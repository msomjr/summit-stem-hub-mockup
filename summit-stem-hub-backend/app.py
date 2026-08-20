"""
SUMMIT STEM Hub - admin login backend.

Why this exists:
  The old front-end had the admin login (email "1", password "1") written
  directly in index.html's JavaScript. Anyone could view-source and read it,
  and worse, anyone could open the browser console and run
  localStorage.setItem("summitAdminBypass", "true") to grant themselves
  admin access with NO password at all.

  This backend fixes that:
    - The real admin email/password hash live only in server environment
      variables - never in a file the browser can read.
    - Login attempts are rate limited (5 tries / 5 minutes) to stop
      password guessing.
    - Admin sessions are signed JWTs. Pages verify the signature with this
      server before trusting "yes, this is really the admin" - a fake
      localStorage flag can no longer grant access.

Regular student/leader accounts are untouched - they keep using Supabase
auth directly, which was already secure.

Run it with:  python app.py
See README.md for setup.
"""

import os
import time
import jwt
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify
from werkzeug.security import check_password_hash

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Configuration (from environment variables - see .env.example)
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get("SECRET_KEY", "")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "*")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").strip().lower()
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", "")

if not SECRET_KEY or not ADMIN_EMAIL or not ADMIN_PASSWORD_HASH:
    raise RuntimeError(
        "Missing required environment variables. Copy .env.example to .env, "
        "set SECRET_KEY, ADMIN_EMAIL and ADMIN_PASSWORD_HASH, then restart."
    )

TOKEN_LIFETIME_HOURS = 12

# ---------------------------------------------------------------------------
# Tiny in-memory rate limiter: 5 attempts per 5 minutes per IP+email.
# Resets if the server restarts - fine for a small club/nonprofit site.
# Swap for Redis if this ever needs to survive restarts or run on >1 server.
# ---------------------------------------------------------------------------
_attempts = {}
MAX_ATTEMPTS = 5
WINDOW_SECONDS = 5 * 60


def _key_for(email):
    return f"{request.remote_addr}:{email}"


def is_locked_out(key):
    now = time.time()
    recent = [t for t in _attempts.get(key, []) if now - t < WINDOW_SECONDS]
    _attempts[key] = recent
    return len(recent) >= MAX_ATTEMPTS


def record_failure(key):
    _attempts.setdefault(key, []).append(time.time())


def clear_failures(key):
    _attempts.pop(key, None)


# ---------------------------------------------------------------------------
# CORS - manual, so we don't need an extra dependency for one header set.
# ---------------------------------------------------------------------------
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = FRONTEND_ORIGIN
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/api/<path:_any>", methods=["OPTIONS"])
def cors_preflight(_any):
    return "", 204


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/admin-login", methods=["POST"])
def admin_login():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    key = _key_for(email)

    if is_locked_out(key):
        return jsonify({"error": "Too many attempts. Try again in a few minutes."}), 429

    if not email or not password or email != ADMIN_EMAIL or not check_password_hash(ADMIN_PASSWORD_HASH, password):
        record_failure(key)
        return jsonify({"error": "Invalid admin credentials."}), 401

    clear_failures(key)
    payload = {
        "role": "leader",
        "full_name": "Admin",
        "email": ADMIN_EMAIL,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_LIFETIME_HOURS),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return jsonify({"token": token, "role": "leader", "full_name": "Admin"})


@app.route("/api/verify-admin", methods=["GET"])
def verify_admin():
    """Pages call this before trusting that a stored token really is a
    valid, unexpired, server-issued admin session."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return jsonify({"valid": False, "error": "No token provided."}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"valid": False, "error": "Session expired."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"valid": False, "error": "Invalid token."}), 401

    return jsonify({"valid": True, "role": payload.get("role"), "full_name": payload.get("full_name")})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
