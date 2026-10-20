# BiteWise — Serverless Redesign Plan

Status: draft, revised 2026-10-15 against the final EC2 app (backend `53176af`, frontend `54c771c`).
Replaces the single-EC2 stack (Next.js + NestJS + MySQL on one box), built side by side first.
Region: `us-east-1`. Domain: `bitewise.rolandfuest.com` (DNS stays at Namecheap); the new stack runs on
`sls.bitewise.rolandfuest.com`. Build order and console steps: `infra/runbook.md`.

Domain terms (Owner, Owned resource, Meal ingredient, Calorie target, Macro plan, …) follow
`bitewise-backend/CONTEXT.md`; copy it into this repo in phase 1.

## Goals

- No servers to patch; true scale-to-zero; cost of cents/month at current traffic.
- AWS practice: Cognito, API Gateway, Lambda, DynamoDB modeling, event-driven S3, IaC.
- Keep the domain rules (Ownership, per-Owner unique names, ordered Composition, in-use 409s).
- Plain English only (drop i18n: today `en` + `hu`).

## Target architecture

```
Browser ──► CloudFront (flat-rate Free plan)
              ├─ /*         → S3 (static SPA, private, OAC)
              ├─ /api/*     → API Gateway HTTP API (JWT authorizer: Cognito)
              │                 └─ Lambda per resource → DynamoDB (single table)
              └─ /avatars/* → S3 avatar bucket (private, OAC)

Cognito User Pool (+ Google IdP, Cognito domain) ──► SES (custom message Lambda trigger)
Browser ──presigned POST──► S3 uploads/ ──event──► Lambda (sharp re-encode) → avatars/ + profile
```

| Concern | Old | New |
|---|---|---|
| Frontend | Next.js server (SSR, 6 Server Action modules, `/signout` route, `proxy.ts`) | Next.js `output: 'export'` static SPA on S3 |
| Auth | Sessions table, JWT cookies, Passport, one token table (`purpose`) | Cognito User Pool + Google IdP |
| API | NestJS on EC2 | HTTP API + Node 22 arm64 Lambdas (one per resource) |
| Data | MySQL + TypeORM + migrations, int ids, soft deletes | DynamoDB on-demand, single table, ULIDs, hard deletes |
| Avatars | Multipart to backend, sharp, `FileStore` | Presigned POST + S3 event Lambda |
| Email | SES via `MailTransport`, 6 templates | Cognito → SES, custom message trigger |
| Rate limiting | Nest throttler (global + credential/resend limits) | API Gateway throttling; Cognito's own auth quotas |
| Infra | Manual console | Manual console, mirrored in CDK (TypeScript) as docs |
| Config/secrets | `.env` on box | SSM Parameter Store (standard, free) |

## Data model (DynamoDB single table `bitewise-sls`)

Ids are ULIDs (sortable by creation time, strings). `sub` = Cognito user id = Owner.

| Item | PK | SK | Attributes |
|---|---|---|---|
| Profile | `USER#<sub>` | `PROFILE` | `personalInformation`, `socialProfiles`, `bodyStats`, `targets`, `avatarKey`, timestamps |
| Ingredient | `USER#<sub>` | `ING#<ulid>` | `name`, 7 nutrients, `unit`, `usedBy` (string set of Meal ids), timestamps |
| Meal | `USER#<sub>` | `MEAL#<ulid>` | `name`, `ingredients: [{ingredientId, quantity}]` (ordered), `usedBy` (set of plan ids), timestamps |
| Meal plan | `USER#<sub>` | `PLAN#<ulid>` | `name`, `mealIds: [...]` (ordered), timestamps |
| Name sentinel | `USER#<sub>` | `NAME#ING\|MEAL\|PLAN#<key>` | `id` of the owner of the name |
| Username sentinel | `USERNAME#<key>` | `USERNAME` | `sub` (global, not per Owner) |

`<key>` = name lowercased, accents stripped (NFD + remove marks), trimmed: matches today's
`utf8mb4_0900_ai_ci` comparison. No GSI.

How the domain rules map:

- **Ownership**: the partition key comes from the JWT `sub`, never the request; a foreign id is
  simply not found → 404 "No <label> found with the provided id."
- **Unique names**: `TransactWriteItems` with the entity + its name sentinel
  (`attribute_not_exists`) → `TransactionCanceled` mapped to 409 with today's messages
  ("You already have an ingredient named X."). Rename = delete old sentinel + put new.
  Usernames the same way with the global sentinel ("Username 'x' is already taken.").
- **Composition**: members are an ordered array embedded in the parent (array order = position,
  so ordering is free). ≥ 1 member, no duplicates (400 "Each ingredient may appear only once in a
  meal"). Updates replace the whole array. The write transaction adds/removes the parent id in each
  added/removed member's `usedBy` set, conditioned on the member existing (missing → 404 "No
  ingredient found with id …"). Transaction limit 100 items → cap at 48 members per Meal / Meal plan.
- **In-use delete → 409**: delete with condition `attribute_not_exists(usedBy)` (an empty set
  is removed). On failure read `usedBy` → `BatchGetItem` names → "This ingredient is used in meals:
  A, B." / "This meal is in meal plans: …". Meal plans have no check.
- **Validation**: zod schemas in `shared/` copy today's DTO rules (name 2–255; nutrients
  0–999,999,999.9; `totalFat ≥ saturatedFat`; quantity > 0; `unit` `100g|piece`; body stat ranges
  and steps; strong password is Cognito's policy). Fix while porting: check fat on the merged
  item on PATCH (today a partial update compares against undefined).
- **Lists**: a User's data is small, so a list `Query`s every item of the type
  (`begins_with(SK, 'ING#')`, following `LastEvaluatedKey`), then filters, sorts and slices in the
  Lambda. That keeps today's contract: `limit` 1–100 (default 20), `offset`, `orderBy` whitelist
  (Ingredient: name, 7 nutrients, unit, createTimeStamp, updateTimeStamp; Meal / Meal plan: name,
  createTimeStamp, updateTimeStamp: today's response names, stored as `createdAt`/`updatedAt`), `orderDirection`, `search` (accent-insensitive substring on name), response
  `{data, count}`. Revisit (GSI + cursor) only if a User ever has thousands of items.
- **Option lists**: same `Query` with a `ProjectionExpression`, sorted by name then id.
  Ingredient `{id, name, unit}`, Meal `{id, name}`, Meal plan `{id, name, mealIds}`.
- **Fetch by ids**: `?ids=` (1–100) → `BatchGetItem`; missing/foreign ids silently omitted;
  limit/offset ignored, sorted by `orderBy`.
- **Responses** keep today's shapes: a Meal's members are denormalized
  (`{ingredientId, ingredientName, quantity, 7 nutrients, unit}`; the join-row `id` is gone) via
  `BatchGetItem` of its ingredients; a Meal plan returns full Meals (batch meals → batch the union of
  ingredients). Nutrition totals stay on the frontend, as today.
- **Statistics**: three `Query`s with `Select: COUNT`.
- **Deletes are hard.** Account deletion = query all `USER#<sub>` items + the username sentinel →
  batch delete, delete avatar objects, `DeleteUser` with the caller's access token (no IAM needed). (Today owned resources are kept.)

## API

Same paths, query params and response shapes as today so the frontend port is mechanical. Ids
change from int to ULID string.

| Lambda | Routes |
|---|---|
| ingredients | `GET /api/ingredient`, `GET /api/ingredient/options`, `POST`, `PATCH /{id}`, `DELETE /{id}` (no `GET /{id}` today) |
| meals | `GET /api/meal`, `GET /api/meal/options`, `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}` |
| meal plans | `GET /api/meal-plan`, `GET /api/meal-plan/options`, `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}` |
| users | `GET/PATCH/DELETE /api/users/me`, `GET /api/users/me/statistics`, `POST /api/users/me/avatar-upload` |

- `/api/auth/*` and `/api/health*` go away: Cognito covers auth, nothing to health-check.
- `PATCH /users/me` keeps the group semantics: groups `personalInformation`, `socialProfiles`,
  `bodyStats`, `targets` (`calorieTarget`, `macroPlan`); missing = unchanged, `null` field = cleared.
- `GET /users/me` adds from the token: `email`, `emailVerified`, `hasPassword` (false for a
  Google-only user: `identities` claim present and no native password); `avatarUrl` from `avatarKey`.
  `pendingEmail` comes from Cognito (see Auth).
- One Lambda per resource (routes dispatched inside), not per route: fewer cold starts, less infra.
- Stack: `NodejsFunction` (esbuild), zod, AWS Lambda Powertools (logger, tracer), AWS SDK v3
  `DynamoDBDocumentClient`. Shared helper for the owned-item patterns above.
- Errors: one mapper (validation → 400, not found → 404, condition/transaction failures → 409),
  same messages as today. Unknown fields → 400 (zod `.strict()`, like `forbidNonWhitelisted`).
- Throttling: HTTP API default route throttle (e.g. 20 rps burst 40); tighter on avatar upload.

## Auth (Cognito)

- User Pool, email as username (lowercased), Essentials tier. Password policy: 8+, upper, lower,
  number, symbol (today's rule).
- Cognito domain (needed for the Google redirect even with own pages). Google IdP; Authorization
  Code + PKCE via `signInWithRedirect`.
- Linking: pre-sign-up trigger links a Google sign-in to an existing native user with the same
  email (`AdminLinkProviderForUser`), like today's auto-link. Only when Google verified the email.
  An unconfirmed native user is deleted instead (its password was never proven), and a native
  sign-up is rejected with "Email already in use." when a Google-only user has the email.
- Email via SES (`no-reply@rolandfuest.com`, existing identity); custom message trigger renders
  today's branded layout (wordmark, card, footer, inline styles) with a **code** instead of a link.
- Token lifetimes: access 15 min, refresh 30 days. Post-confirmation trigger creates `PROFILE`.

| Today | Cognito |
|---|---|
| Sign-up → signed in, unverified, banner + resend; avatar blocked until verified | Sign-up → confirm with code before first sign-in; banner and avatar rule go away |
| Sign-in (2 steps: email, password) | `signIn` (UI keeps 2 steps) |
| Refresh rotation in `proxy.ts` | Amplify refreshes tokens |
| Sign-out of one Session | `signOut` (revokes the refresh token) |
| Password reset link (1 h), signs out everywhere | `resetPassword` + code; `GlobalSignOut` after confirm |
| Change password, signs out other Sessions, mails "password changed" | `updatePassword` + global sign-out; **no mail** |
| Email change: password + link to new address, cancel link to old, notice to old | `updateUserAttributes` + code to new address with "keep original value active until verified"; **no mail to old address, no cancel link**; UI asks for the password and re-authenticates first |
| Google-only user sets a first password via reset | **Not supported** for federated users |

## Frontend

New static-export app in `web/`, ported page by page from `bitewise-frontend`.

- Keep: shadcn/Radix, Tailwind, react-hook-form + zod (`z.config({ jitless: true })`),
  date-fns, react-easy-crop, next-themes, custom charts, nutrition / body-metrics / daily-targets
  helpers (all client-side already).
- Drop: `[lang]` segment and dictionaries (`negotiator`, `@formatjs/intl-localematcher`), axios,
  `proxy.ts`, `app/session/*`, `signout/route.ts`, all Server Actions and server data fetching,
  `revalidatePath`, `serverActions.bodySizeLimit`, Language preference tab.
- Data layer: TanStack Query + a fetch client adding `Authorization: Bearer <access token>`;
  mutations invalidate queries (replaces `revalidatePath`). `use-record-cache` fetch-by-ids → queries.
- URL state read on the client (`useSearchParams` under `Suspense`): list `page`/`orderBy`/
  `orderDirection`/`search`, compare `type`/`ids`, `?draft=`, `?load=`, `?reason=`, `?error=`.
- Week plan and Draft meal plan stay in localStorage (`bitewise:…:v1:<userId>`, key by `sub`).
  Accepted loss: drafts saved by the old app (int ids) are dropped; the key is bumped to `v2`.
- Auth pages: sign-in, sign-up + confirm code, forgot/reset with code, Google button; the
  confirm/cancel email-change and verify-email link pages become code steps in-app.
- Dashboard guard: client-side redirect to `/` without a session (UX only; the API enforces auth).
- Images: `images.unoptimized` (hero image via `getImageProps` today). `next/font` stays.
- CSP: static header via CloudFront response headers policy (no nonce possible: `'self'` plus
  hashes for the next-themes inline script). Plus today's nosniff, `X-Frame-Options`, Referrer- and
  Permissions-Policy, HSTS. `connect-src` adds the Cognito endpoints.
- Avatar: crop in the browser → presigned POST → poll profile until `avatarKey` changes.
- Build-time config: `NEXT_PUBLIC_API_URL`, Cognito pool/client ids + domain, avatar URL.
- Deploy: `next build` → upload `out/` → CloudFront invalidation.

Accepted downgrade: tokens readable by JS (localStorage) instead of httpOnly cookies.
Mitigated by short access-token lifetime + CSP. Revisit with a token-handler (BFF) Lambda if needed; see
[Follow-up: httpOnly cookies via a BFF](#follow-up-httponly-cookies-via-a-bff).

## Avatars

- `POST /api/users/me/avatar-upload` returns a presigned POST to `uploads/<sub>/<ulid>`
  (5 MB `content-length-range`, JPEG/PNG/WebP, 5 min expiry).
- S3 event → Lambda: `sharp` (arm64) → 512×512 WebP (cover fit), EXIF stripped →
  `avatars/<sub>/<ulid>.webp` (`Cache-Control: public, max-age=31536000, immutable`) → update
  `PROFILE.avatarKey` → delete the upload and the previous avatar. Invalid image → delete upload, log.
- Lifecycle rule: expire `uploads/` after 1 day.

## Infra & delivery

- Repo `bitewise-sls` (monorepo: `infra/` CDK, `api/`, `web/`, `shared/`).
- Built by hand in the console (`infra/runbook.md`), mirrored in CDK, torn down with
  `infra/cleanup.md`. CDK stacks: `Data`, `Auth`, `Api`, `Web`.
- One environment, one AWS account: no dev/prod split.
- CI: GitHub Actions with OIDC role → web build + sync, Lambda code updates.
- Observability: CloudWatch log retention 14 days, Powertools structured logs, alarm on
  Lambda errors + 5xx → existing SNS topic `bitewise-ses-alerts`.
- Backups: DynamoDB point-in-time recovery, turned on once real data lives in the table.

## Phases

1. **Foundations**: repo, CDK skeleton, `Data` + `Web`, empty SPA at `sls.bitewise.rolandfuest.com`.
2. **Auth**: Cognito pool, domain, Google IdP, SES + triggers, sign-up/in pages working.
3. **API + data**: ingredients → meals → meal plans → users; integration tests against
   DynamoDB Local.
4. **Frontend port**: static export, data layer, auth pages, all dashboard pages
   (overview, draft, week, compare, lists, profile).
5. **Avatars**: presigned upload + re-encode Lambda.
6. **Migration & cutover** (optional):
   - Export MySQL (skip soft-deleted rows) → items; int ids → new ULIDs, members in `position`
     order, rebuild `usedBy` and sentinels.
   - Users: create Cognito users via admin API, force password reset on first login;
     Google users re-link by email.
   - Point the main domain at the new distribution; keep EC2 stopped for a week.
7. **Decommission** (optional): terminate EC2, release Elastic IP, drop old buckets/backups,
   archive `bitewise-backend`/`bitewise-frontend`.

## Cost estimate (no free tier, few users, ~10k API calls/month)

| Service | ~$/month |
|---|---|
| Lambda, API Gateway, DynamoDB, SES, CloudWatch | ~0.05 |
| Cognito Essentials (~5 MAU) | ~0.08 |
| S3 | ~0.05 |
| CloudFront (flat-rate Free plan) | 0 |
| **Total** | **~0.25–0.50** |

vs current EC2 stack ≈ $12/month. Avoid: NAT Gateway (~$33), standalone WAF (~$6+),
provisioned concurrency, customer-managed KMS keys, unlimited log retention.

## Follow-up: httpOnly cookies via a BFF

Possible later improvement that removes the localStorage token downgrade. Contained change:
nothing in the current design blocks it.

Adds (BFF = backend for frontend, a small server-side piece that holds the tokens):
- Token-handler Lambda behind CloudFront, e.g. on `/auth/*`. Runs the OAuth code exchange with
  Cognito itself, using a confidential app client (with a secret, which a server can keep).
  Stores tokens server-side (e.g. DynamoDB) or encrypted in the cookie; gives the browser an
  httpOnly, Secure, SameSite session cookie.
- `/api/*` authenticates by cookie. Something turns it back into an access token: a Lambda
  authorizer, or the BFF proxying API calls with the Bearer header. The current JWT authorizer
  expects a Bearer header, so this is the main infra change.
- CSRF protection: browsers attach cookies automatically, so SameSite plus a CSRF token or header
  check become necessary.

Stays the same:
- Resource Lambdas: Owner still comes from the `sub` claim, however the token arrived.
- DynamoDB data model and API paths.
- Cognito User Pool and users; nobody re-registers.

Frontend changes:
- Amplify sign-in calls become redirects or calls to the BFF. Own sign-in pages calling Amplify
  `signIn` (SRP in the browser) don't fit as-is: either the BFF does the auth calls server-side,
  or sign-in goes through the Cognito hosted flow.
- The fetch client drops the Bearer header and sends `credentials: 'include'`.

To keep the switch cheap: all token handling lives behind one fetch client and one small auth
module in `web/`, so the migration touches those two places, not every page.

## Open questions

- Managed Login (hosted UI) vs own auth pages on Cognito APIs? (Plan: own pages.)
- Keep Next.js (static export) or move to Vite + React Router? (Plan: Next.js.)
- Accept the auth downgrades in the table above (no old-address mail / cancel link, no
  password-changed mail, no first password for Google-only users)? A custom SES Lambda could
  add the mails back.
- Member cap 48 per Meal / Meal plan acceptable?
