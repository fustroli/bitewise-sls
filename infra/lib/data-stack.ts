import { Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { AttributeType, Billing, TableEncryptionV2, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { BlockPublicAccess, Bucket, BucketEncryption, HttpMethods, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export interface DataStackProps extends StackProps {
  /** App domain: the browser posts avatar uploads from it straight to the bucket. */
  domainName: string;
}

/** DynamoDB table and avatar bucket (runbook sections 1 and 6). */
export class DataStack extends Stack {
  readonly table: TableV2;
  readonly avatarBucket: Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // Single table: every item an Owner owns sits under PK = USER#<sub> (docs/plan.md, Data model).
    this.table = new TableV2(this, 'Table', {
      tableName: 'bitewise-sls',
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billing: Billing.onDemand(),
      encryption: TableEncryptionV2.dynamoOwnedKey(),
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Private; CloudFront reads avatars/ through OAC, the bucket policy is in the Web stack.
    this.avatarBucket = new Bucket(this, 'AvatarBucket', {
      bucketName: `bitewise-sls-avatars-${this.account}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: BucketEncryption.S3_MANAGED,
      // Safety net for uploads the re-encode Lambda never picked up.
      lifecycleRules: [{ id: 'expire-uploads', prefix: 'uploads/', expiration: Duration.days(1) }],
      // Presigned POST uploads come from another origin (localhost for `next dev`)
      cors: [
        {
          allowedMethods: [HttpMethods.POST],
          allowedOrigins: [`https://${props.domainName}`, 'http://localhost:3000'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
