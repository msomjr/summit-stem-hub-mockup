// Shared helper for the Python admin-auth backend (backend/app.py).
// Any page that needs to know "is this an authenticated admin?" should use
// window.SummitAdmin.verifyAdminSession() rather than reading a plain
// localStorage flag - a plain flag can be faked in the browser console,
// a signed token verified by the server cannot.

window.SummitAdmin = (function () {
  const TOKEN_KEY = "summitAdminToken";

  async function tryAdminLogin(email, password) {
    try {
      const response = await fetch(`${window.SUMMIT_BACKEND_URL}/api/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (response.status === 429) {
        const result = await response.json();
        alert(result.error || "Too many attempts. Try again shortly.");
        return "rate_limited";
      }

      if (!response.ok) {
        return false; // not admin credentials - caller should try normal login
      }

      const result = await response.json();
      sessionStorage.setItem(TOKEN_KEY, result.token);
      return true;
    } catch (err) {
      // Backend not running / unreachable - don't block regular users.
      console.warn("Admin login check skipped (backend unreachable):", err.message);
      return false;
    }
  }

  async function verifyAdminSession() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const response = await fetch(`${window.SUMMIT_BACKEND_URL}/api/verify-admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        sessionStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return await response.json(); // { valid, role, full_name }
    } catch (err) {
      console.warn("Admin session check failed (backend unreachable):", err.message);
      return null;
    }
  }

  function clearAdminSession() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  return { tryAdminLogin, verifyAdminSession, clearAdminSession };
})();
