# bitewise-sls

Serverless version of BiteWise, the meal planner (Ingredients → Meals → Meal plans, nutrition
totals against daily targets). It is a rebuild of the EC2 app (`bitewise-backend` +
`bitewise-frontend`) and runs side by side with it. It is also practice for the AWS SAA exam.

**Status:** planning done; nothing built yet.

## Architecture

- **Frontend:** Next.js static export (SPA) on S3, served by CloudFront.
- **API:** API Gateway HTTP API with a Cognito JWT authorizer, one Node 22 Lambda per resource.
- **Data:** DynamoDB, a single table, on-demand.
- **Auth:** Cognito User Pool with Google sign-in; emails go out through SES.
- **Avatars:** the browser uploads to S3 with a presigned POST; an S3 event triggers a Lambda that re-encodes the image.

Details are in [`docs/plan.md`](docs/plan.md).

## Layout

| Path | Contents |
| --- | --- |
| `infra/` | CDK app (TypeScript) mirroring the hand-built resources |
| `api/` | Lambda handlers, Cognito triggers, avatar re-encode |
| `web/` | Static-export Next.js SPA |
| `shared/` | zod schemas and types used by `api/` and `web/` |
| `docs/` | Plan, runbook, cleanup |

Only `docs/` exists so far.

## How it's built

Everything is created by hand in the AWS console, following
[`docs/infra/runbook.md`](docs/infra/runbook.md). After each step, the same resources are written
as CDK code and checked with `cdk synth`. That code is not deployed while the hand-made resources
exist. [`docs/infra/cleanup.md`](docs/infra/cleanup.md) tears everything down in reverse order.

Region `us-east-1`; dev domain `sls.bitewise.rolandfuest.com`.
