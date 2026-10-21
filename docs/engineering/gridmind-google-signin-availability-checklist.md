# Google sign-in availability — integration diagnosis and activation checklist

**Status: code-preflight fix prepared; production OAuth sign-in not yet independently verified.**
Refs: [Google OAuth feature #111](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/111), [technical release gate #29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29), [Supabase official Google guide](https://supabase.com/docs/guides/auth/social-login/auth-google), [redirect allowlist guide](https://supabase.com/docs/guides/auth/redirect-urls).

## Why the Google button said “unavailable”

The application already has a Google OAuth button, safe same-origin callback parser, verified-session guard, and permission-aware customer/team routing. But the preflight checked **raw Vite environment variables** while the initialized, Lovable-generated Supabase client can use **public fallback URL/key** values. On environments without those Vite variables, Google could be incorrectly declared unavailable before `signInWithOAuth` was even called. The code fix resolves the **same public fallback URL/key values as the generated client** when Vite variables are missing, and a regression test compares those fallback literals to the generated client. Supabase's current public TypeScript API does not expose these configuration properties directly. No generated integration file was modified and no Google credentials were hard-coded.

An enabled provider and correct dashboard redirect configuration are still required. The provider can also genuinely be disabled even when code and the public environment are correct. The page now distinguishes:
- provider explicitly disabled in publicly readable Supabase Auth settings;
- provider status unreachable/invalid, with a safe retry/email fallback;
- OAuth start fails, without disclosing internal tokens or arbitrary provider details.

## Verified connected-platform facts (2026-10-21)

- GridMind main repo: `vartmaansharma-blip/gridmind-insights-ea7a9796`; active production Supabase project ref: `bvqmvgbfqhgczwbvlqkk`.
- The linked production Vercel project is `gridmind`; **both** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment-variable *names* exist in its production environment. Their values were not copied or exposed.
- Application has publicly documented fallback connection details, previously used in previews. The Vercel env list alone cannot verify the **Google** Auth provider.
- The available Supabase connector has **no supported Google provider settings-write tool**; connection status for Google was not confirmed directly by a successful production /auth/v1/settings response or a real Google account sign-in. No Google client secret is available or requested; therefore it would be false to call production Google OAuth activated.
- No production SQL, Auth mutation, RLS change, customer membership, callback provider registration, machine control or private data processing was performed.

## Required one-time dashboard setup by authorized project administrators

1. In **Google Cloud Console → Google Auth Platform**, create/select the organization's OAuth web client. Keep scopes to `openid`, `email`, `profile` for sign-in. Configure consent audience and branding; if the app is in testing, ensure legitimate testers have access as required by Google.
2. In the Google OAuth client's **Authorized redirect URIs**, register the *Supabase-managed provider callback* exactly:
   `https://bvqmvgbfqhgczwbvlqkk.supabase.co/auth/v1/callback`
   This is **not** the web app's `/auth` route.
3. In **Supabase Dashboard → GridMind project → Authentication → Sign In / Providers → Google**, enable Google and enter the Google OAuth **client ID and secret** in the dashboard only. **Do not paste or commit either secret into ChatGPT, GitHub, or public Vite variables.**
4. In **Supabase Dashboard → Authentication → URL Configuration**, set production Site URL to the actual GridMind production origin (currently `https://gridmind-rose-rho.vercel.app`, subject to domain verification), and add these three exact allowed post-login destinations:
   - `https://gridmind-rose-rho.vercel.app/auth?oauth=google`
   - `https://gridmind-rose-rho.vercel.app/auth?oauth=google&destination=customer`
   - `https://gridmind-rose-rho.vercel.app/auth?oauth=google&destination=team`
   If the production domain changes, update redirects. Avoid adding broad preview-domain wildcards or arbitrary third-party hosts. Production Google client Authorized JavaScript origins may include `https://gridmind-rose-rho.vercel.app` when needed by the configured integration.
5. Check the project's public `/auth/v1/settings` endpoint returns `external.google === true` using the **public publishable key only**. Never use a service-role key in a browser. The status check is necessary but insufficient.
6. Test the live **Continue with Google** button on `https://gridmind-rose-rho.vercel.app/auth?destination=customer` with an authorized test account. Confirm: Google consent, return to `/auth?oauth=google&destination=customer`, verified Supabase session, safe routing, pending-access behavior without factory membership, logout and revisiting. Repeat staff flow only with genuinely authorized staff. Test cancellation, missing redirect, blocked cookies and provider-disabled recovery; never grant factory membership from Google email/profile data.
7. Record exact deployed SHA, Google provider `true` status, redirect allowlist, real browser success and an independent security/access review against #29 before asserting customer-ready sign-in.

## Test and release boundary

Automated unit/browser tests mock the provider and verify **code behavior**, but do not test Google's live consent screen, dashboard configuration or actual end-user identity. Never assert production availability solely from green CI/Vercel.

Rollback: revert this narrow auth-preflight PR; existing email/password and authorization remain unchanged.
