import { join } from 'node:path';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

const REPO_ROOT = join(import.meta.dirname, '../..');

export interface BitewiseFunctionProps {
  /** Function name without the `bitewise-sls-` prefix, e.g. `pre-sign-up`. */
  name: string;
  /** Entry file relative to `api/src`, e.g. `triggers/pre-sign-up.ts`. */
  entry: string;
  environment?: Record<string, string>;
  /** Defaults to 5 s, Cognito's limit for triggers. */
  timeout?: Duration;
}

/**
 * A Lambda from `api/` with the project defaults: Node 22 on arm64, 256 MB, ESM bundle without
 * the AWS SDK (same settings as `api/scripts/build.ts`), log group kept 14 days.
 */
export class BitewiseFunction extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: BitewiseFunctionProps) {
    super(scope, id);
    const functionName = `bitewise-sls-${props.name}`;

    const logGroup = new LogGroup(this, 'Logs', {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.fn = new NodejsFunction(this, 'Function', {
      functionName,
      entry: join(REPO_ROOT, 'api/src', props.entry),
      handler: 'handler',
      projectRoot: REPO_ROOT,
      depsLockFilePath: join(REPO_ROOT, 'bun.lock'),
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 256,
      timeout: props.timeout ?? Duration.seconds(5),
      environment: props.environment,
      logGroup,
      bundling: {
        format: OutputFormat.ESM,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
        banner: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
      },
    });
  }
}
