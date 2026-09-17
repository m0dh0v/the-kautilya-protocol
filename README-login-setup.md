# Login integration for netra404_kp-main (Vite + Express)

## 0. Clean up the earlier mistake

The first zip I sent you was built assuming Next.js, which isn't what this
project is. Delete these three from your project root — they're inert, not
loaded by anything:

```
app/
lib/
middleware.ts
```

**Keep** `data/users.json` if you already have it from that zip — it's the
correct hashed-credentials file and is reused below.

## 1. Where these new files go

```
your-project/
├── server/
│   ├── db.ts          ← already exists
│   └── auth.ts         ← NEW — password + session logic
├── src/
│   └── components/
│       └── LoginPage.tsx   ← NEW — the login screen + eye/pulse animation
├── scripts/
│   └── hash-users.mjs      ← NEW — (re)generate data/users.json from a CSV
└── data/
    └── users.json          ← hashed credentials, NOT in /public
```

If `data/users.json` isn't already in your project, regenerate it from your
CSV:

```
node scripts/hash-users.mjs path/to/users_credentials.csv
```

Then delete the plaintext CSV. Add `data/users.json` to `.gitignore`.

## 2. Add SESSION_SECRET

Add this to your `.env` (you already have `dotenv.config()` in `server.ts`):

```
SESSION_SECRET=<a long random string>
```

Generate one with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Patch `server.ts`

**Add this import** near your other local imports (below the `db` import):

```ts
import { requireAuth, verifyCredentials, createSessionToken, SESSION_COOKIE_NAME } from "./server/auth";
```

**Add these three routes.** Put them right after `app.get("/api/health", ...)`
and *before* every other `/api/...` route — order matters, since the auth
middleware you'll add in step 4 covers everything registered after it:

```ts
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (!verifyCredentials(username.trim(), password)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = createSessionToken(username.trim());
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  });
  res.json({ success: true });
});

app.post("/api/auth/logout", (req, res) => {
  res.cookie(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  res.json({ success: true });
});

app.get("/api/auth/session", (req, res) => {
  const { getSessionUsername } = require("./server/auth");
  const username = getSessionUsername(req);
  res.json({ authenticated: Boolean(username), username: username || null });
});
```

**Add the enforcement middleware** right after the three routes above (and
still before `/api/database/status`, `/api/graph/data`, etc.):

```ts
// Everything below this line requires a valid session. Login/logout/session
// routes above are intentionally registered first so they stay public.
app.use("/api", requireAuth);
```

That one line is what makes it unbypassable: every remaining `/api/*` route
(`database/status`, `graph/data`, `graph/sync`, `database/seed`,
`blockchain/*`, `ai/*`) now 401s without a valid cookie, regardless of what
the browser UI shows or hides.

## 4. Patch `App.tsx`

**Add the import:**

```ts
import { LoginPage } from "./components/LoginPage";
```

**Add auth state right after your other `useState` calls** (near the top of
`export default function App()`):

```ts
const [authChecked, setAuthChecked] = useState(false);
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

**Add a `useEffect` to check the session once on mount** (alongside your
existing `fetchDatabaseStatus` / `fetchLiveGraph` effect):

```ts
useEffect(() => {
  fetch("/api/auth/session")
    .then((res) => res.json())
    .then((data) => setIsAuthenticated(Boolean(data.authenticated)))
    .catch(() => setIsAuthenticated(false))
    .finally(() => setAuthChecked(true));
}, []);
```

**Gate the return statement.** Right before your existing
`return ( <div id="app-root" ...> ... )`, add:

```tsx
if (!authChecked) {
  return <div className="w-full h-screen bg-[#030712]" />; // blank while checking
}

if (!isAuthenticated) {
  return <LoginPage onSuccess={() => setIsAuthenticated(true)} />;
}
```

That's the whole change to `App.tsx` — everything else (the dossier UI,
nav, views) stays exactly as-is; it just won't render, and its data-fetching
effects won't return anything real, until `isAuthenticated` is true.

## 5. Optional: a logout button

Anywhere in your header (e.g. next to the DB Gateway button), you can add:

```tsx
<button
  onClick={async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }}
  className="text-xs font-mono text-slate-400 hover:text-red-400"
>
  LOG OUT
</button>
```

## 6. Restart

Restart `npm run dev` (or however you run `tsx server.ts`) after adding
`SESSION_SECRET` — env vars are only read on startup.
