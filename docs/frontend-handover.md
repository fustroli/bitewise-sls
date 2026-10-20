# Frontend port: handover (runbook section 5)

Plan for porting `../bitewise-frontend` to a static-export SPA in `web/`, served from S3 behind
CloudFront and talking to the serverless API. Written 2026-10-20, after sections 0–4 were done.
Nothing in `web/` exists yet beyond a placeholder `package.json` and `web/placeholder/index.html`.

Read first: `docs/plan.md` (Frontend and Auth sections), `docs/infra/runbook.md` (Decisions table,
section 5), `CONTEXT.md`, and the old app's `CLAUDE.md`, `docs/adr/0001-0006`.

## Where things stand

| Piece | State |
|---|---|
| API (`/api/ingredient`, `/api/meal`, `/api/meal-plan`, `/api/users/me`) | Live behind CloudFront `/api/*`, JWT authorizer `cognito`. Same paths, query params, response shapes and error bodies as the EC2 app, except the differences below |
| Cognito | Pool `us-east-1_mxizFmjKZ`, public client `3ar8dsh33uocuk57aml6imi8qr` (SRP + refresh, code grant + PKCE, scopes `openid email profile aws.cognito.signin.user.admin`), domain `https://us-east-1mxizfmjkz.auth.us-east-1.amazoncognito.com`, Google IdP, branded code emails |
| Hosting | Bucket `bitewise-sls-web-<account-id>`, distribution `E2ZKU5BXWC1GD9`, SPA rewrite Function maps `/x` and `/x/` to `/x/index.html` (needs `trailingSlash: true`) |
| Callback / sign-out URLs registered | `https://sls.bitewise.rolandfuest.com/` and `http://localhost:3000/` |
| Not built yet | Avatar upload (section 6): `POST /api/users/me/avatar-upload` doesn't exist; the avatar UI stays disabled until then |

### API differences the frontend must absorb

- **Ids are ULID strings**, not ints: every `id`, `ingredientId`, `mealIds` and `userId`. Interfaces
  change `number` → `string`; the old `idSchema` (positive int) becomes a ULID check (`ULID` regex in
  `@bitewise/shared`).
- Meal ingredients have **no join-row `id`** anymore (`IMealIngredient.id` goes away).
- `POST` returns **201** (the EC2 app did too); `DELETE` 204.
- Profile: `pendingEmail` / `pendingEmailExpiresAt` are always `null` (Cognito doesn't expose a
  pending change); `emailVerified` is effectively always true (sign-up confirms by code first).
- Account deletion is hard and also deletes the Cognito user; the token is dead afterwards.
- New 400s: at most 48 members per Meal / Meal plan.
- Schemas for request bodies already exist in `@bitewise/shared` (`createIngredientSchema`,
  `createMealSchema`, `createMealPlanSchema`, `profilePatchSchema`, `listQuerySchema`, limits). Reuse
  them for form validation where the old app had its own zod schemas, so client and API agree.

## Decisions

Settled in `docs/plan.md` or with the user:

1. **Next.js static export** (`output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`),
   no server at runtime. Keep shadcn/Radix, Tailwind, RHF + zod (`z.config({ jitless: true })`),
   date-fns, react-easy-crop, next-themes, `next/font` (Manrope, self-hosted at build).
2. **English only**: drop the `[lang]` segment, `hu/de/es/fr`, Negotiator, the Language tab.
3. **Auth with Amplify Auth** (Cognito user pool APIs, own pages, no hosted UI), tokens in
   localStorage (accepted downgrade, mitigated by 15-min access tokens and CSP).
4. **Data with TanStack Query** and a small fetch client adding `Authorization: Bearer <access token>`.
   Mutations invalidate queries (replaces `revalidatePath`).
5. Week plan and Draft meal plan stay in localStorage, keys bumped to **`v2`** and keyed by `sub`.
   Old `v1` drafts (int ids) are dropped.
6. **Client-side dashboard guard** (UX only; the API enforces auth).
7. Security headers move to a **CloudFront response headers policy** (static CSP, hashes instead of a
   nonce).

Confirmed with the user on 2026-10-20:

8. **i18n removal: keep the dictionary shape, drop the machinery.** 70 files call
   `useDictionary()` and schemas are built from the dictionary. Port `en.json` as a typed constant
   (`web/app/copy.ts`), make `useDictionary()` return it (no provider), and delete
   `getDictionary`/`DictionaryProvider`/locales. The port stays mechanical; inlining strings can happen
   later, file by file.
9. **Keep the old app's architecture rules** (module folders, `I*/T*/E*` naming, the ESLint boundaries
   map), minus the server/client split: `api/` (server-only reads) and `actions/` (`'use server'`)
   both become `queries/` (TanStack hooks over the fetch client).
10. **No session management.** It's a new app with no existing sessions to protect: changing or
    resetting a password doesn't sign out other devices (no `signOut({ global: true })`, no
    `GlobalSignOut`). Sign-out is local; Cognito revokes this device's refresh token.
11. Keep the **`TApiResult`** result type (`{ok:true,data} | {ok:false,status,message}`) for mutations,
    so `toastResult()`, `ResourceFormDialog`'s 409 → field error and the banner logic port unchanged.

## Server dependencies and their replacements

| Old (server) | New (static SPA) |
|---|---|
| `proxy.ts`: token refresh, cookie rotation, single-flight refresh | Amplify refreshes tokens itself (`fetchAuthSession`) |
| `proxy.ts`: redirects `/dashboard` ↔ `/` | `AuthGate` client component in the dashboard layout (`getCurrentUser()`; redirect to `/` when signed out) and on `/` (to `/dashboard/` when signed in) |
| `proxy.ts`: locale negotiation, `[lang]/layout` `notFound()` | Gone (English only) |
| `proxy.ts` + `csp.ts`: per-request CSP nonce, `x-nonce` | Static CSP in the CloudFront response headers policy; hash the next-themes inline script |
| `app/layout.tsx` `headers()` for the nonce | ThemeProvider without `nonce` |
| `app/session/*` (cookie names, renewal, routing, backend, sign-out) | Delete; replaced by `app/auth/` (Amplify config + helpers) |
| `(auth)/signout/route.ts` | `signOut()` from a client button; `?reason=expired|account-deleted` stays as a query param on `/` |
| Server gateway `request()` + `getAccessToken()` (cookie) | `app/lib/api.ts`: `fetch(`/api/${path}`)` with the Bearer token from `fetchAuthSession()`; same `readError` normalisation (array `message` joined); 401 → `signOut()` + `/?reason=expired` |
| Module `api/` reads (server-only, `unwrap()` → `error.tsx`) | `useQuery` hooks; errors to an error boundary or inline `ErrorFallback` |
| `'use server'` actions + `parseActionInput()` | `useMutation` hooks returning `TApiResult`; validate with the shared zod schemas before sending |
| `revalidatePath('/[lang]/dashboard','layout')` after resource writes | `queryClient.invalidateQueries` for that resource's list, options and the library counts (and dependents: an Ingredient change invalidates meals and meal plans) |
| Async Server Components (`ResourcePage`, `ResourceList`, `LibrarySection`, `DraftMealPlanSection`, `WeekPlanSection`, dashboard layout `fetchMe`) | Client components with `useQuery`; `Suspense` / skeletons for loading |
| Server-read search params (`page`, `orderBy`, `orderDirection`, `search`, `type`, `ids`, `reason`, `error`, `email`) | `useSearchParams()` inside `Suspense` (required for static export) |
| `resource/list.tsx` (server row rendering with functions) | Plain client config; the `server-only` import goes |
| `useRecordCache(fetchByIds)` over server actions | Keep the hook; feed it the fetch client (`GET /api/x?ids=…`), or replace with `useQueries` |
| `next/image` `getImageProps` hero (`AuthImageFrame`, needs the optimizer + `sharp`) | Plain `<picture>` with pre-sized WebP files in `public/` |
| `next.config` `headers()`, `serverActions.bodySizeLimit` | Gone (headers policy; no server actions) |
| axios + `withCredentials` (sign-in/up cookie flows) | Gone; Amplify for auth, `fetch` for the API |
| `COOKIE_DOMAIN`, `buildspec.yml`, `appspec.yml`, `Dockerfile`, pm2 scripts | Gone; deploy = build, upload `out/`, invalidate |

## Auth flows

Amplify Auth v6 APIs named below; check the current Amplify docs for exact signatures and error
names before coding (don't trust memory).

| Old | New |
|---|---|
| Sign-in, 2 steps (email, then password) | Same UI; `signIn({ username: email, password })` (SRP). `nextStep.signInStep === 'CONFIRM_SIGN_UP'` → send to the code step |
| Sign-up → signed in, unverified | `signUp({ username: email, password, options: { userAttributes: { email } } })` → **code step** `confirmSignUp` → then `signIn` automatically (Amplify `autoSignIn`) |
| Resend verification banner | `resendSignUpCode` on the code step; delete `EmailVerificationBanner` and the "verify to upload avatar" rule |
| Google button → backend `/auth/google/login` | `signInWithRedirect({ provider: 'Google' })`; Cognito comes back to `/` with `?code=`, Amplify finishes it; on success go to `/dashboard/`. `?error=` from Cognito shows a notice |
| Forgot password → link mail → `/reset-password?token=` (signed out everywhere) | `/forgot-password/`: `resetPassword({ username })` → code + new password on the same page → `confirmResetPassword`, then sign in. No global sign-out (decision 10). `/reset-password/` goes away |
| Change password (signed out other sessions) | `updatePassword`; the session stays, other devices aren't signed out (decision 10). No "password changed" mail |
| Email change: password + links to new/old address | Re-authenticate (`signIn` with the current password), `updateUserAttributes({ email })` → code step `confirmUserAttribute({ userAttributeKey: 'email', confirmationCode })`. No mail to the old address, no cancel link. Track "pending" in component state / localStorage |
| `/verify-email`, `/confirm-email-change`, `/cancel-email-change` | Delete (codes in-app) |
| Sign-out route | `signOut()`; clear TanStack cache; go to `/` |
| Delete account (`DELETE users/me` → `/signout?reason=account-deleted`) | `DELETE /api/users/me` (deletes data and the Cognito user), then `signOut()` locally, go to `/?reason=account-deleted` |
| Google-only user sets a first password | Not supported (accepted downgrade); hide the option when `hasPassword === false` |

Error messages to map: Cognito exceptions (`NotAuthorizedException` "Incorrect username or password.",
`UsernameExistsException`, `CodeMismatchException`, `ExpiredCodeException`, `LimitExceededException`,
`InvalidPasswordException`), and the pre-sign-up rejection, which arrives as
`UserLambdaValidationException` "PreSignUp failed with error Email already in use." (strip the prefix).

Amplify config (`Amplify.configure`, once, client-side):

- `userPoolId`, `userPoolClientId`, `loginWith.oauth`: `domain` (without `https://`), `scopes` (the
  four above), `redirectSignIn` / `redirectSignOut` (`https://sls.bitewise.rolandfuest.com/`,
  `http://localhost:3000/`), `responseType: 'code'`.
- Token storage: the default localStorage store.

## Data layer

- `app/lib/api.ts`: `api<T>(path, { method, body, query })` → `TApiResult<T>`. Base URL `/api` on the
  deployed site (same origin, no CORS). Static export can't proxy in `next dev`, so locally use
  `NEXT_PUBLIC_API_URL=https://sls.bitewise.rolandfuest.com/api` and add CORS for
  `http://localhost:3000` on the HTTP API (a console step to add to the runbook).
- Query keys: `['ingredients', 'list', query]`, `['ingredients', 'options']`, `['ingredients', 'byIds', ids]`,
  same for meals / meal plans, `['me']`, `['statistics']`.
- Library counts: use `GET /api/users/me/statistics` (one call) instead of three `?limit=1` lists.
- After a mutation: invalidate the resource prefix, `['statistics']`, and dependents (ingredients →
  meals, meal plans; meals → meal plans).
- User: `useQuery(['me'])` replaces `UserProvider`'s server seed; keep the context API so consumers
  don't change.

## Routes

| Old | New (static, trailing slash) |
|---|---|
| `/` (sign-in / sign-up tabs, `?reason`, `?error`) | `/` (+ sign-up code step) |
| `/forgot-password?email=` | `/forgot-password/` (request + confirm with code) |
| `/reset-password`, `/verify-email`, `/confirm-email-change`, `/cancel-email-change`, `/signout` | removed |
| `/[lang]/dashboard` | `/dashboard/` (`?draft=`) |
| `/[lang]/dashboard/{ingredients,meals,meal-plans}` | `/dashboard/{ingredients,meals,meal-plans}/` (`?page&orderBy&orderDirection&search`) |
| `/[lang]/dashboard/compare` | `/dashboard/compare/` (`?type&ids`) |
| `/[lang]/dashboard/week` | `/dashboard/week/` (`?load=`) |
| `/[lang]/dashboard/profile` | `/dashboard/profile/` (no Language tab) |

All hard-coded hrefs `/${lang}/dashboard/...` become `/dashboard/...`.

## CSP and headers (CloudFront response headers policy)

Start from the old `csp.ts` and remove the nonce:

- `default-src 'self'`; `script-src 'self' 'sha256-<next-themes script>'` (compute the hash from the
  built HTML; also check Next's own inline scripts in the export and hash them); `style-src 'self'
  'unsafe-inline'`; `img-src 'self' data: blob:`; `font-src 'self'`;
  `connect-src 'self' https://cognito-idp.us-east-1.amazonaws.com https://us-east-1mxizfmjkz.auth.us-east-1.amazoncognito.com`;
  `form-action 'self' https://us-east-1mxizfmjkz.auth.us-east-1.amazoncognito.com`; `frame-ancestors 'none'`;
  `base-uri 'none'`; `object-src 'none'`.
- Plus the old static headers: nosniff, `X-Frame-Options: DENY`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, HSTS.
- Attach the policy to the default behavior (and `/api/*` gets nosniff/HSTS at least).

## Build and deploy

- Env (build-time, `NEXT_PUBLIC_*`): API base URL, user pool id, client id, Cognito domain, avatar
  base URL (section 6).
- `bun run build` in `web/` → `web/out/`; upload to the web bucket (replace the placeholder), then a
  CloudFront invalidation `/*`. CI (section 7) automates this later.
- Each page must exist as `out/<route>/index.html` for the SPA rewrite Function.

## Port order

Each step ends with `bun run build` passing and a manual check on `localhost:3000` (then on the app
domain after an upload).

1. **Scaffold** `web/`: Next + Tailwind + shadcn config copied from the old app, `output: 'export'`,
   `trailingSlash`, `images.unoptimized`, Manrope, ThemeProvider, `jitless` zod, ESLint config with the
   boundaries map (without `[lang]`). Workspace dependency on `@bitewise/shared`.
2. **Shared code**: copy `app/components`, `app/hooks`, `app/lib/utils`, `app/utils` (minus
   `helpers/server`, `security/csp`, `config` cookie bits), the `en` copy constant and `useDictionary`.
3. **Auth**: `app/auth/` (Amplify config, `AuthGate`, error mapping), `/` sign-in + sign-up + code step,
   Google redirect, `/forgot-password/`. Verify against the real pool.
4. **Data layer + dashboard shell**: `api.ts`, QueryClientProvider, `['me']`, nav, layout, overview,
   library counts via `/statistics`.
5. **Resources**: `_resource-table` as client components; ingredients → meals → meal plans (forms,
   dialogs, delete with the 409 messages).
6. **Draft meal plan, week plan, compare**: localStorage `v2`, `useRecordCache` over the fetch client.
7. **Profile**: groups PATCH, change password, email change with code, delete account; avatar UI
   disabled until section 6.
8. **Headers + deploy**: response headers policy (compute hashes from the build), upload, invalidate,
   smoke test on the app domain.
9. **Tests**: port the vitest suites that still apply (helpers, validations, hooks, components);
   action tests become tests of the query/mutation hooks against a mocked `api`.

## Open questions

- Pending email change: confirm what `GetUser` returns while a change is pending (the API returns
  `pendingEmail: null` for now).
- Local development against the deployed API needs CORS on the HTTP API for `http://localhost:3000`.

## Runbook and cleanup

- Runbook section 5 boxes stay the checklist; tick them as the steps land.
- New AWS resources this section creates: the response headers policy (already on the cleanup list
  under section 2), CORS config on the HTTP API (goes with the API).
