import { join } from 'node:path';
import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
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
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BlockPublicAccess, Bucket, BucketEncryption, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export interface WebStackProps extends StackProps {
  /** App domain, e.g. sls.bitewise.rolandfuest.com. DNS lives at Namecheap. */
  domainName: string;
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

    this.distribution = new Distribution(this, 'Distribution', {
      // Creates the OAC and the bucket policy limited to this distribution's ARN.
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        functionAssociations: [{ function: spaRewrite, eventType: FunctionEventType.VIEWER_REQUEST }],
      },
      domainNames: [props.domainName],
      certificate,
      defaultRootObject: 'index.html',
      httpVersion: HttpVersion.HTTP2_AND_3,
      enableIpv6: true,
    });

    // Target of the app domain's CNAME at Namecheap.
    new CfnOutput(this, 'DistributionDomainName', { value: this.distribution.distributionDomainName });
  }
}
