# Login integration — setup

## 1. Where these files go

Drop these into your existing Next.js project at the matching paths (this assumes
the App Router, since your `page.tsx` lives under a route folder):

```
your-project/
├── middleware.ts              ← project root, next to package.json
├── app/
│   ├── login/
│   │   └── page.tsx
│   └── api/
│       └── auth/
│           ├── login/route.ts
│           └── logout/route.ts
├── lib/
│   ├── auth.ts
│   └── session.ts
└── data/
    └── users.json             ← NOT in /public, never shipped to the browser
```

If your project uses a `src/` directory (`src/app`, `src/lib`), put `app/`,
`lib/` inside `src/` but keep `middleware.ts` and `data/` at the project root.

## 2. Store the credentials file correctly

`data/users.json` in this bundle already has the passwords from your CSV
**hashed with a random salt** (Node's built-in `scrypt` — no plaintext, no
extra dependency to install). It is safe to have on your server, but:

- Put `data/users.json` in `.gitignore` if this repo is or will be pushed
  anywhere — treat it like a secret, not because it's readable (it isn't
  reversible) but because it's still a list of your real usernames.
- **Delete `users_credentials.csv`** (the plaintext file you gave me) from
  wherever it's sitting once you've copied `users.json` in — don't keep both.
- Never put `users.json` (or the CSV) under `/public` — anything there is
  directly downloadable by anyone who guesses the URL.

## 3. Set a session secret

The session cookie is signed with an HMAC secret so it can't be forged.
Add this to `.env.local` (create the file if it doesn't exist, and make sure
`.env.local` is in `.gitignore` — it usually already is in Next.js projects):

```
SESSION_SECRET=<a long random string>
```

Generate one with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Restart your dev server after adding it — env vars are only read on startup.

## 4. How the "can't bypass it" part works

`middleware.ts` runs on the server before any page is rendered. It checks for
a valid, signed `kp_session` cookie on every request except `/login` and the
login API route itself. No cookie (or an expired/tampered one) → redirected
to `/login`, full stop — this isn't something that can be worked around by
typing a URL directly, disabling JavaScript, or editing the page in the
browser, because the check never touches the browser at all.

Logging in (`POST /api/auth/login`) checks the submitted username/password
against `data/users.json` server-side, and if it matches, sets that cookie as
`httpOnly` (so client-side JS can't read or fake it) and `secure` in
production (HTTPS only).

## 5. Adjust the matcher if needed

`middleware.ts` currently protects everything except `/login`,
`/api/auth/login`, and your static assets (`_next`, `favicon`, `/images`).
If you have other public routes (a public landing page, a health-check
endpoint, etc.), add them to `PUBLIC_PATHS` in `middleware.ts`.

## 6. Session length & logout

Sessions last 8 hours (`SESSION_TTL_SECONDS` in `lib/session.ts` and the
matching `maxAge` in `login/route.ts` — keep both in sync if you change it).
Wire a "log out" button to `POST /api/auth/logout` to clear the cookie
immediately.
