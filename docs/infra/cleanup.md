# Serverless cleanup (teardown of hand-made resources)

Reverse of `runbook.md`: delete in this order so nothing is still in use when removed.
Add a line here whenever the runbook creates something, including resources AWS creates for you
(log groups, roles, policies). Region: `us-east-1`. Leaves the EC2 app untouched.

Keep (shared with the EC2 app): SES identity `rolandfuest.com`, SNS topic `bitewise-ses-alerts`.

## 7. Ops + CI

- [ ] CloudWatch alarms
- [ ] GitHub OIDC deploy role (keep the OIDC provider if other repos use it)

## 6. Avatars

- [ ] S3 event notification on the avatar bucket
- [ ] Re-encode Lambda + its execution role + `/aws/lambda/<name>` log group
- [ ] CloudFront `/avatars/*` behavior (removed with the distribution in step 2)

## 5. Frontend

- [ ] Nothing in AWS beyond the web bucket contents (step 2)

## 4. API

- [ ] HTTP API (routes, authorizer, integrations, stage go with it)
- [ ] Lambdas (ingredients, meals, meal plans, users) + execution roles + log groups

## 3. Auth

- [ ] Cognito domain (must go before the pool)
- [ ] User Pool (app client, Google IdP, triggers go with it)
- [ ] Trigger Lambdas (custom message, post-confirmation, pre-sign-up) + roles + log groups
- [ ] Google OAuth client in Google Cloud console

## 2. Web hosting

- [ ] Namecheap: app domain CNAME → distribution
- [ ] CloudFront distribution `E2ZKU5BXWC1GD9`: **disable**, wait for deploy, then delete
- [ ] OAC(s) (`oac-bitewise-sls-web-…`), response headers policy, CloudFront Function `bitewise-sls-spa-rewrite`
- [ ] ACM certificate (after the distribution is gone) + its validation CNAME at Namecheap
- [ ] Web bucket `bitewise-sls-web-<account-id>`: empty, then delete
- [ ] Free flat-rate pricing plan: check it no longer lists the distribution (Pricing Plan Manager)

## 1. Data

- [ ] Avatar bucket `bitewise-sls-avatars-<account-id>`: empty, then delete (versioning is off)
- [ ] DynamoDB table `bitewise-sls` (export first if the data matters)

## 0. Repo

- [ ] `CDKToolkit` stack, only if you ever ran `cdk bootstrap` (empty its asset bucket first)

## Final check

- [ ] Billing > Bills: no unexpected serverless line items next month
- [ ] Resource Groups & Tag Editor, all regions, filter by tag `app=bitewise-sls` (tag everything when creating it)
