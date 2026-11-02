# Serverless cleanup (teardown of hand-made resources)

Step-by-step teardown of everything `runbook.md` created, in dependency order: nothing is deleted while something else still uses it. Each step names the runbook section (§) it undoes. Whenever the runbook creates something, add its delete line to the step where its dependencies allow (resources AWS creates for you too: log groups, roles, policies). Region: `us-east-1`. Leaves the EC2 app untouched.

**Keep (shared with the EC2 app):** SES identity `rolandfuest.com`, SNS topic `bitewise-ses-alerts`, the Google OAuth client itself (only its Cognito bits go, step 4).

## 1. Prep

- [ ] Console region = `us-east-1`; note the account id (bucket names end with it)
- [ ] Export data if it matters: DynamoDB → table `bitewise-sls` → Exports to S3 (needs PITR), or Explore items → download; S3 → avatar bucket → download `avatars/`

## 2. Cut traffic, start the slow part (§2)

- [ ] Namecheap → Advanced DNS: delete the `sls.bitewise` CNAME → `d2l2g1mwd2syrl.cloudfront.net` (keep the ACM validation CNAME until step 6)
- [ ] CloudFront → distribution `E2ZKU5BXWC1GD9` → **Disable**. Takes ~5–15 min to deploy; do steps 3–5 meanwhile

## 3. API + compute (§4, §6, §7)

- [ ] Only if §7 was built: CloudWatch → Alarms → delete the Lambda error / HTTP API 5xx alarms; IAM → Roles → delete the GitHub deploy role (keep the GitHub OIDC provider if other repos use it)
- [ ] API Gateway → APIs → `bitewise-sls` (`31mhrbd81j`) → Actions → Delete. Routes, JWT authorizer `cognito`, integrations (incl. the duplicate ingredients one), `$default` stage and its route throttling all go with it
- [ ] Lambda → Functions → delete the five API-side functions (their S3 invoke permission goes with them):
  - `bitewise-sls-ingredients`, `bitewise-sls-meals`, `bitewise-sls-meal-plans`, `bitewise-sls-users`
  - `bitewise-sls-avatar-processor`
- [ ] IAM → Roles → delete their roles (inline policies `*-table`, `users-avatars`, `avatar-processor` go with them): `bitewise-sls-ingredients-role-x0k1xwb7`, `bitewise-sls-meals-role-rgll73w1`, `bitewise-sls-meal-plans-role-y2blzazi`, `bitewise-sls-users-role-sxdk0co1`, `bitewise-sls-avatar-processor-role-meslxdcp`

## 4. Auth (§3)

- [ ] Cognito → User pool `us-east-1_mxizFmjKZ` → Branding → Domain → Actions → Delete the Cognito domain (`us-east-1mxizfmjkz`; it must go before the pool)
- [ ] Delete the user pool (no deletion protection; type its name). App client `bitewise-sls-web`, Google IdP, trigger wiring and all test users go with it. Delete it **before** the trigger Lambdas
- [] Lambda → delete `bitewise-sls-custom-message`, `bitewise-sls-post-confirmation`, `bitewise-sls-pre-sign-up`
- [ ] IAM → Roles → delete `bitewise-sls-custom-message-role-vjlofbgb`, `bitewise-sls-post-confirmation-role-523y41jh`, `bitewise-sls-pre-sign-up-role-06djja63`
- [ ] Google Cloud Console → APIs & Services → Credentials → the shared OAuth client (**never delete the client**):
  - remove JS origin `https://us-east-1mxizfmjkz.auth.us-east-1.amazoncognito.com`
  - remove redirect URI `https://us-east-1mxizfmjkz.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
  - client secrets: disable, then delete the **Cognito** secret only (keep the EC2 one)
  - Branding → Authorized domains: remove `amazoncognito.com` if nothing else uses it
- [ ] Secrets Manager: if `bitewise-sls/google-client-secret` exists, Actions → Delete (7-day recovery window)

## 5. Leftovers of all eight Lambdas (§3, §4, §6)

Deleting a function or role leaves these behind.

- [ ] CloudWatch → Log groups → filter `/aws/lambda/bitewise-sls-` → delete all eight groups
- [ ] IAM → Policies → filter Customer managed, `AWSLambdaBasicExecutionRole-` → delete those the console created for the eight roles (now "Not attached"; check none is still attached to an EC2-app role)

## 6. Edge (§2, §4, §5, §6), once the distribution shows Disabled

- [ ] CloudFront → `E2ZKU5BXWC1GD9` → Delete. The `/api/*` and `/avatars/*` behaviors, both origins and the `SecurityHeadersPolicy` attachments go with it (the managed policy itself stays, it's AWS's). If delete is blocked by the Free flat-rate pricing plan, remove the distribution from / cancel the plan first (CloudFront → Pricing plans), then retry
- [ ] CloudFront → Functions → delete `bitewise-sls-spa-rewrite`
- [ ] CloudFront → Origin access → delete `oac-bitewise-sls-web-…` (shared by both buckets)
- [ ] ACM → certificate for `sls.bitewise.rolandfuest.com` → Delete (fails while a distribution uses it)
- [ ] Namecheap: delete the ACM validation CNAME (`_<hash>.sls.bitewise`)
- [ ] Pricing plan manager: no plan still lists the distribution

## 7. Data (§1, §2, §6)

- [ ] S3 → `bitewise-sls-web-<account-id>` → Empty (type `permanently delete`) → Delete. Its bucket policy goes with it
- [ ] S3 → `bitewise-sls-avatars-<account-id>` → Empty → Delete. CORS, lifecycle rule, `avatars/*` bucket policy and the `avatar-uploaded` event notification go with it
- [ ] DynamoDB → table `bitewise-sls` → Delete: **uncheck** "create on-demand backup" (it would outlive the table and bill), check "delete CloudWatch alarms"

## 8. Repo + final check (§0)

- [ ] CloudFormation: delete the `CDKToolkit` stack only if you ever ran `cdk bootstrap` (empty its `cdk-…-assets-…` bucket first); no `bitewise-sls-*` stacks should exist (never deployed)
- [ ] Resource Groups & Tag Editor → all regions, tag `app=bitewise-sls` → expect no results
- [ ] Optional: CloudShell → Actions → Delete home directory (the route-throttling CLI session)
- [ ] Billing → Bills next month: no Lambda / API Gateway / Cognito / DynamoDB / S3 / CloudFront lines from this app
