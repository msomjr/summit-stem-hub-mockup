# SUMMIT STEM Hub - Admin Auth Backend

A small Python (Flask) backend that replaces the old hardcoded admin login.

## What was wrong before

`index.html` had this sitting in plain JavaScript, viewable by anyone via
"View Page Source":

```js
const ADMIN_BYPASS_EMAIL = "1";
const ADMIN_BYPASS_PASSWORD = "1";
```

Even worse, other pages granted admin access just by checking
`localStorage.getItem("summitAdminBypass") === "true"` - which meant anyone
could open their browser console and type
`localStorage.setItem("summitAdminBypass", "true")`, reload, and get admin
access with **no password at all**.

## What this backend does instead

- The real admin email + a **hashed** password live only in environment
  variables on the server (never in a file the browser can read).
- `/api/admin-login` checks credentials server-side and, on success, returns
  a signed token (JWT) that expires after 12 hours.
- `/api/verify-admin` lets every page cryptographically verify that token
  before showing admin content - a fake flag in the browser console no
  longer works, because the signature can't be forged without `SECRET_KEY`.
- Login attempts are rate-limited (5 tries / 5 minutes per IP+email) to slow
  down password guessing.

Regular student/leader accounts are unchanged - they still sign in directly
with Supabase, which was already a secure setup.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Copy the example env file and fill it in:
   ```bash
   cp .env.example .env
   ```

3. Generate a secret key and put it in `.env`:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

4. Generate a password hash for your real admin password and put it in `.env`
   as `ADMIN_PASSWORD_HASH` (do NOT put the plain-text password anywhere):
   ```bash
   python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('YourStrongPassword'))"
   ```

5. Set `ADMIN_EMAIL` in `.env` to whatever email you want to use for admin
   login (it doesn't need to be a real inbox, e.g. `admin@summit.org`).

6. Load the `.env` file and run the server:
   ```bash
   export $(cat .env | xargs)   # macOS/Linux
   python app.py
   ```
   The server listens on `http://localhost:5000`.

7. Update `backend-config.js` in the frontend folder if you deploy the
   backend somewhere other than `localhost:5000`.

## Endpoints

| Method | Path                | Purpose                                      |
|--------|---------------------|-----------------------------------------------|
| GET    | /api/health          | Health check                                 |
| POST   | /api/admin-login     | `{email, password}` -> `{token, role, full_name}` |
| GET    | /api/verify-admin    | `Authorization: Bearer <token>` -> `{valid, role, full_name}` |

## Deploying

Any host that runs Python works (Render, Railway, Fly.io, a small VPS, etc.).
Just make sure:
- The `.env` values are set as real environment variables on the host (not
  committed to git).
- `FRONTEND_ORIGIN` matches the URL your site is actually served from.
- The frontend's `backend-config.js` points at the deployed backend URL,
  and uses `https://`.
