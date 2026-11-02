import { join } from 'node:path';
import { Annotations, CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import type { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  Function,
  FunctionCode,
  FunctionEventType,
  FunctionRuntime,
  HttpVersion,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  S3OriginAccessControl,
  Signing,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  BucketPolicy,
  type IBucket,
  ObjectOwnership,
} from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export interface WebStackProps extends StackProps {
  /** App domain, e.g. sls.bitewise.rolandfuest.com. DNS lives at Namecheap. */
  domainName: string;
  /** Served under /api/* on the same domain, so the browser needs no CORS. */
  api: HttpApi;
  /** Its avatars/ is served under /avatars/*. */
  avatarBucket: IBucket;
}

/**
 * Web bucket, ACM certificate and CloudFront distribution (runbook section 2).
 * The Free flat-rate pricing plan is chosen in the console; CloudFormation doesn't model it.
 */
export class WebStack extends Stack {
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    // Private; only the distribution reads it, through OAC.
    const bucket = new Bucket(this, 'WebBucket', {
      bucketName: `bitewise-sls-web-${this.account}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // CloudFront only accepts certificates from us-east-1. No Route 53 zone, so deploy waits
    // until the validation CNAME exists at Namecheap.
    const certificate = new Certificate(this, 'Certificate', {
      domainName: props.domainName,
      validation: CertificateValidation.fromDns(),
    });

    // Rewrites instead of custom error responses: those apply distribution-wide and would turn
    // the API's 403/404s into index.html once /api/* is added.
    const spaRewrite = new Function(this, 'SpaRewrite', {
      functionName: 'bitewise-sls-spa-rewrite',
      runtime: FunctionRuntime.JS_2_0,
      code: FunctionCode.fromFile({ filePath: join(import.meta.dirname, '../functions/spa-rewrite.js') }),
    });

    // One OAC for both buckets: it's only signing settings, not tied to a bucket
    const oac = new S3OriginAccessControl(this, 'Oac', { signing: Signing.SIGV4_ALWAYS });

    // By name, not the Data stack's Bucket: CDK would put its OAC policy in the Data stack, pointing
    // at this distribution (a cycle). The policy is written below instead, scoped to avatars/.
    const avatarBucket = Bucket.fromBucketAttributes(this, 'AvatarBucket', {
      bucketName: props.avatarBucket.bucketName,
      region: this.region,
    });

    this.distribution = new Distribution(this, 'Distribution', {
      // Adds the web bucket policy limited to this distribution's ARN.
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket, { originAccessControl: oac }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        // Managed only: the Free flat-rate plan allows no custom policy. The CSP is a <meta> tag
        // the web build writes into every page.
        responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
        compress: true,
        functionAssociations: [{ function: spaRewrite, eventType: FunctionEventType.VIEWER_REQUEST }],
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new HttpOrigin(`${props.api.apiId}.execute-api.${this.region}.${this.urlSuffix}`, {
            protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
          }),
          // Not "redirect": a redirected POST loses its body
          viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          // Never cache per-user responses. With caching off, forwarding all viewer headers is what
          // passes Authorization; Host is left out because API Gateway routes on its own host name.
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
          // No SPA rewrite here: that's for the default behavior only
        },
        // The URL path is the object key (avatars/<sub>/<ulid>.webp), so no origin path
        '/avatars/*': {
          origin: S3BucketOrigin.withOriginAccessControl(avatarBucket, { originAccessControl: oac }),
          viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
          // Each avatar has a new key and Cache-Control: immutable, so caching never goes stale
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
          responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
          compress: true,
        },
      },
      domainNames: [props.domainName],
      certificate,
      defaultRootObject: 'index.html',
      httpVersion: HttpVersion.HTTP2_AND_3,
      enableIpv6: true,
    });

    // Only re-encoded avatars are readable, never raw uploads/
    const avatarPolicy = new BucketPolicy(this, 'AvatarBucketPolicy', { bucket: avatarBucket });
    avatarPolicy.document.addStatements(
      new PolicyStatement({
        principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [avatarBucket.arnForObjects('avatars/*')],
        conditions: { StringEquals: { 'AWS:SourceArn': this.distribution.distributionArn } },
      }),
    );

    // Handled by the policy above
    Annotations.of(this).acknowledgeWarning(
      '@aws-cdk/aws-cloudfront-origins:updateImportedBucketPolicyOac',
      'avatar bucket policy is written in this stack',
    );

    // Target of the app domain's CNAME at Namecheap.
    new CfnOutput(this, 'DistributionDomainName', { value: this.distribution.distributionDomainName });
  }
}
