# bitewise-sls — Claude instructions

Serverless rebuild of BiteWise (Cognito, API Gateway HTTP API, Lambda, DynamoDB single table,
static Next.js on S3 + CloudFront). The user builds it to learn for the AWS SAA exam.

## Read first

- `docs/plan.md`: the design. It covers the data model, API contract, the Cognito auth mapping
  and accepted downgrades, the frontend port and the phases.
- `docs/infra/runbook.md`: console build steps per section, with checkboxes. Read its
  **Decisions** table for the real resource names and ids.
- `docs/infra/cleanup.md`: the teardown checklist, in reverse order.

## How the infra is built

- The user creates every AWS resource **by hand in the console**. Give console steps and explain
  the why; don't run the `aws` CLI or deploy anything.
- After a runbook section is done, write the matching CDK code in `infra/` and check it with
  `cdk synth`. Never `cdk deploy` while the hand-made resources exist, or names will clash.
- Whenever a step creates something, add its delete line to `docs/infra/cleanup.md`. That
  includes resources AWS creates implicitly, like Lambda roles and log groups.
- Tag every resource `app=bitewise-sls`. Record gotchas in the runbook's "Gotchas hit" section.

## Porting from the EC2 app

Sibling repos `../bitewise-backend` (NestJS) and `../bitewise-frontend` (Next.js) are the source
of truth for behavior.

- Keep their API paths, query params, response shapes and error messages, unless
  `docs/plan.md` says otherwise. Ids change from int to ULID.
- Domain terms (Owner, Owned resource, Meal ingredient, Calorie target, Macro plan, …) come from
  `CONTEXT.md`, copied from `../bitewise-backend`. Use them in code and docs.
- The Owner always comes from the JWT `sub`, never from the request.

## Git

- Branch off `main` for changes. Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Never commit secrets, `.env` files or key files.
