# Serverless runbook (console first, then CDK)

Manual setup of the serverless stack from `docs/plan.md`, built next to the EC2 app.
Everything is created by hand in the console. After each section, the **CDK** step writes the
same resources as CDK code in `infra/` and checks it with `cdk synth` (renders the CloudFormation
template, deploys nothing). That code is documentation for a later rebuild: only `cdk deploy` it
after tearing down the hand-made resources (`cleanup.md`), or names will clash.
Region: `us-east-1`. Fill in the values you chose. Tag every resource `app=bitewise-sls`.
Whenever a step creates something, add its delete step to `cleanup.md`.

## Decisions

| Item | Value |
| --- | --- |
| Domain (dev) | `sls.bitewise.rolandfuest.com` (DNS: Namecheap) |
| Repo | `bitewise-sls` (bun workspaces) |
| CDK stacks | `bitewise-sls-dev-{data,auth,api,web}` |
| Table | `bitewise-dev` |
| Web bucket | |
| Avatar bucket | |
| CloudFront distribution | |
| User Pool id / client id | |
| HTTP API id | |

## 0. Repo + CDK bootstrap

- [x] Monorepo: `infra/`, `api/`, `web/`, `shared/`, workspace config, shared `tsconfig`
- [x] CDK app skeleton in `infra/`; `cdk synth` runs clean
- `cdk bootstrap` (creates the `CDKToolkit` stack) is only needed before the first `cdk deploy`

## 1. Data

- [ ] DynamoDB table: PK `PK` (S), SK `SK` (S), on-demand, no GSI, PITR off in dev
- [ ] Avatar bucket: private, Block Public Access on, lifecycle: expire `uploads/` after 1 day
- [ ] Put/query a test item in the console (Explore items)
- [ ] CDK: `Data` stack, `RemovalPolicy.RETAIN` on table + bucket

## 2. Web hosting

- [ ] Web bucket: private, Block Public Access on, no static website hosting (OAC needs the REST endpoint)
- [ ] ACM cert for the dev domain (us-east-1, DNS validation); validation CNAME at Namecheap
- [ ] CloudFront distribution: origin = web bucket with OAC, default root object `index.html`,
      alias = dev domain, bucket policy updated to allow the distribution only
- [ ] SPA fallback: custom error responses 403/404 → `/index.html` (200), or a CloudFront Function
- [ ] Upload a placeholder `index.html`; DNS CNAME dev domain → distribution domain
- [ ] CDK: `Web` stack (leave the ACM validation CNAME in place)

## 3. Auth (Cognito)

- [ ] User Pool: email sign-in, lowercase, Essentials tier, self sign-up on, email verification by code
- [ ] App client: public (no secret), Authorization Code + PKCE, callback/sign-out URLs = dev domain
      (+ `http://localhost:3000`), access token 15 min, refresh 30 days
- [ ] SES as email sender (`no-reply@rolandfuest.com`, existing identity)
- [ ] Cognito domain (prefix domain is enough for dev); needed for the Google redirect
- [ ] Google IdP: new OAuth client in Google console, redirect URI = Cognito domain `/oauth2/idpresponse`;
      attribute mapping email → email
- [ ] Lambda triggers: custom message (branded templates with the code), post-confirmation
      (create `PROFILE` item; needs `dynamodb:PutItem` on the table), pre-sign-up (link a Google
      sign-in to an existing user with the same email; needs `cognito-idp:AdminLinkProviderForUser`,
      `ListUsers`)
- [ ] Attribute change setting: keep original email active until the new one is verified
- [ ] Verify: sign up a test user, receive code, confirm, profile item exists; Google sign-in with
      the same email lands on the same `sub`
- [ ] CDK: `Auth` stack

## 4. API

- [ ] One Lambda (Node 22, arm64) for ingredients, env `TABLE_NAME`, role with DynamoDB access on the table
- [ ] HTTP API: routes `ANY /api/ingredient` and `ANY /api/ingredient/{proxy+}` → Lambda
- [ ] JWT authorizer: issuer = User Pool URL, audience = app client id; attach to all routes
- [ ] Default stage throttling (e.g. 20 rps, burst 40)
- [ ] Verify with a token from a signed-in test user: 401 without, 200 with
- [ ] CloudFront behavior `/api/*` → HTTP API origin, caching disabled,
      origin request policy `AllViewerExceptHostHeader` (API Gateway rejects a foreign Host)
- [ ] Repeat for `/api/meal`, `/api/meal-plan`, `/api/users/me` (users Lambda also needs
      `cognito-idp:AdminDeleteUser` and S3 on the avatar bucket)
- [ ] Log retention 14 days on every `/aws/lambda/*` group
- [ ] CDK: `Api` stack (`NodejsFunction`)

## 5. Frontend

- [ ] New static-export Next.js app in `web/`, port pages/components from `bitewise-frontend`
- [ ] Fetch client + TanStack Query, Amplify Auth, client-side guard on dashboard
- [ ] Build-time env: API URL, pool/client ids, Cognito domain, avatar URL
- [ ] Deploy: `next build` → upload `out/` to the web bucket → CloudFront invalidation `/*`
- [ ] Response headers policy: CSP (`'self'` + hashes, `connect-src` API + Cognito), HSTS,
      nosniff, frame DENY, Referrer- and Permissions-Policy

## 6. Avatars

- [ ] `POST /api/users/me/avatar-upload` returns a presigned POST to `uploads/<sub>/<ulid>`
- [ ] Bucket CORS: allow `POST` from the dev domain
- [ ] S3 event (`ObjectCreated`, prefix `uploads/`) → re-encode Lambda (`sharp`, arm64) →
      `avatars/<sub>/<ulid>.webp`, update profile, delete upload + previous avatar
- [ ] CloudFront behavior `/avatars/*` → avatar bucket with OAC
- [ ] CDK: add to `Data`/`Api` stacks

## 7. Ops + CI

- [ ] Alarms: Lambda errors, HTTP API 5xx → SNS `bitewise-ses-alerts`
- [ ] GitHub OIDC provider in IAM + deploy role trusted for `repo:fustroli/bitewise-sls:ref:refs/heads/main`
- [ ] Workflow: build web → sync → invalidate (no `cdk deploy` while resources are hand-made);
      Lambda code updates: build zip → `lambda update-function-code`
- [ ] Prod: separate stacks, PITR on

## Gotchas hit

-

## Differs from `docs/plan.md`

- Built side by side with EC2 on a dev subdomain; cutover/decommission (phases 6–7) not planned yet.
