# Phase 1.5(a) — Manual Verification Runbook

Scope: end-to-end browser test of the Supabase auth flow wired in this
commit. Backend still uses the old custom JWT for the rest of the app —
this commit ONLY touches the frontend auth pages and the axios
interceptor. Phase 1.5(b) will replace the BE auth middleware.

---

## Before you start — Supabase dashboard configuration

Owner has confirmed these are done. If any of them is wrong, the
flow will fail on the first try.

1. Supabase Dashboard → Authentication → Providers → Email →
   confirm toggle ON, "Confirm email" toggle ON.
2. Same page → Google and Apple sections, leave OFF for v1.
3. Authentication → URL Configuration → Site URL =
   http://localhost:5173
4. Same page → Additional Redirect URLs → add line
   http://localhost:5173/auth/callback (no trailing slash)

---

## 0. Local env setup (one time, after pulling this commit)

`frontend/.env` already has `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from before. Add the new var that this commit
introduces:

```
VITE_SUPABASE_PROJECT_REF=<your-project-ref>
```

Where `<your-project-ref>` is the subdomain of `VITE_SUPABASE_URL`.
Example: for `https://jphnszxsdltmhfdjbwnk.supabase.co`, the ref is
`jphnszxsdltmhfdjbwnk`.

Without this, the cold-reload fallback in the axios interceptor
won't work, but everything else will — you'll only notice if you
hard-reload a protected page and immediately fire an API call before
INITIAL_SESSION has settled.

---

## 1. Start the frontend

```
cd frontend
npm run dev
```

Expect: `Local: http://localhost:5173/`. Leave the dev server running
for the rest of this runbook.

You do NOT need to start the backend for this runbook. The auth pages
talk directly to Supabase; they don't hit the Express server.

---

## 2. Sign up a new account

1. Open http://localhost:5173/signup in your browser.
2. Enter a real email you can check (Gmail works). Use something you
   haven't already signed up with on this Supabase project.
3. Enter a password (≥8 chars), confirm it, click "Create account".
4. Expect: green toast "Check your email." Then you're redirected to
   `/verify-email` showing the email you used.

**Pass / fail:**

- PASS: redirected to `/verify-email`, page shows your email address
  and a "Resend confirmation email" button.
- FAIL (stuck on /signup with red error toast): the network response
  in DevTools → Network → signup → Response will show the Supabase
  error. Most common causes:
    - Email provider disabled in dashboard → re-check item 1 above.
    - Wrong VITE_SUPABASE_URL → confirm it matches your project's URL.
    - CORS: Site URL not set → re-check item 3 above.

---

## 3. Confirm the email

1. Open the inbox for the email you used. Supabase sent "Confirm
   your signup" from `noreply@<your-ref>.supabase.co` (or whatever
   custom "from" address your project is configured with).
2. Click the "Confirm your email" link.
3. Your browser opens http://localhost:5173/auth/callback#access_token=...
4. Expect: a brief spinner, then a redirect to `/farm` (the 3D farm
   page). The 3D page may be empty/slow if the backend isn't running
   — that's fine for this runbook, what matters is that you LANDED on
   /farm and you're not bounced back to /login.

**Pass / fail:**

- PASS: URL bar shows http://localhost:5173/farm. DevTools →
  Application → Local Storage shows a key like
  `sb-<your-ref>-auth-token` with a JSON value containing
  `access_token`, `refresh_token`, `expires_at`.
- FAIL (redirected back to /login): the recovery session didn't stick.
  Most common cause: link was clicked twice (Supabase tokens are
  single-use). Go back to step 2 and resend.
- FAIL (`redirect_uri_mismatch` or 400 from Supabase): Site URL or
  Redirect URLs misconfigured. Re-check items 3 and 4 above.

---

## 4. Verify the protected route gate

1. While signed in, navigate around — visit /recommendations,
   /market, /weather, anything behind the sidebar.
2. Expect: pages load normally. The axios interceptor is attaching
   your Supabase Bearer to each backend request.
3. Open DevTools → Network → click any XHR. Look for
   `Authorization: Bearer eyJ...` in Request Headers.

**Pass / fail:**

- PASS: every XHR to `http://localhost:3002/api/*` carries the
  Bearer header.
- FAIL (no Authorization header on requests): the cold-reload path
  is firing and `VITE_SUPABASE_PROJECT_REF` is missing. Add it
  (see Step 0 above), restart `npm run dev`, hard-reload.

---

## 5. Verify the protected route gate actually blocks

1. While still signed in, open a new private/incognito window.
2. In the incognito window, navigate to http://localhost:5173/farm.
3. Expect: redirected to `http://localhost:5173/login?next=%2Ffarm`
   with the login form visible.

**Pass / fail:**

- PASS: URL shows `/login?next=%2Ffarm`. Signing in there should
  land you back on /farm.
- FAIL (page renders without login): ProtectedRoute isn't gating.
  Check that `frontend/src/App.tsx` imports the new
  `components/ProtectedRoute` (NOT the inline one that read
  localStorage). Confirm this commit's changes to App.tsx are
  in place.

---

## 6. Sign out and sign back in

1. Back in your normal window, click the user menu / sign out
   button in the top bar (whichever UI path your build exposes).
   If the top bar doesn't yet expose Supabase sign-out (because
   it still reads `useAuthStore` which holds the legacy token),
   open DevTools → Application → Local Storage and delete the
   `sb-<ref>-auth-token` key, then refresh.
2. Expect: redirected to `/login`.
3. Sign in with the same email + password you signed up with.
4. Expect: redirected back to `/farm` (or to `?next=` if you
   triggered the sign-out from a protected page).

**Pass / fail:**

- PASS: clean sign-in round-trip, no error toasts.
- FAIL ("Invalid login credentials"): password mismatch OR the
  user was never created because email confirmation is required
  AND you skipped step 3.

---

## 7. Forgot-password round trip

1. On /login, click "Forgot?". Enter your email, click "Send
   reset link".
2. Expect: green toast "If an account exists for that email, a
   reset link is on its way." (Same toast whether or not the
   email exists — by design, prevents account enumeration.)
3. Open the inbox. Supabase sends "Reset your VaagAi password"
   (or similar — wording is configurable in the dashboard).
4. Click the link. Browser opens
   http://localhost:5173/reset-password#access_token=...
5. Expect: the new-password form appears (NOT the /login form).
   Supabase fires SIGNED_IN with a recovery session, and the
   page reads the session via useAuth.
6. Enter a new password (≥8 chars), confirm, click "Update
   password".
7. Expect: green toast, redirected to /farm.

**Pass / fail:**

- PASS: password updated, you're signed in on /farm.
- FAIL (redirected to /forgot-password with "Reset link is
  invalid or has expired"): the link was opened in a different
  browser than the one that requested it, OR it's been more
  than 1 hour, OR the link was clicked twice. Re-request.

---

## What this runbook does NOT cover

- Backend JWT middleware changes — that's Phase 1.5(b).
- RLS policies on Supabase tables — that's Phase 1.5(b) too.
- Google / Apple OAuth — explicitly deferred per dashboard item 2.
- MFA — explicitly deferred per the architecture decision.

If anything fails that isn't covered above, paste the failing
step number + the relevant log line / screenshot / network
response, and we'll debug from there.