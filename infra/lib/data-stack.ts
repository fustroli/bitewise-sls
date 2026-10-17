import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

/** DynamoDB table and avatar bucket (runbook section 1). */
export class DataStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }
}
