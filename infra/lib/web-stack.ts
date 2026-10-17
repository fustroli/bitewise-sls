import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

/** Web bucket, ACM certificate and CloudFront distribution (runbook section 2). */
export class WebStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }
}
