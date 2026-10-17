import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

/** HTTP API, JWT authorizer and resource Lambdas (runbook section 4). */
export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }
}
