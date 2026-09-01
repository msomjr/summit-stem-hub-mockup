// Shared admin session helper.
// Demo bypass (email "admin" / password "admin") works ONLY on localhost.
// On the public site, use a real Supabase account with role leader/admin,
// or the optional Python backend when that server is deployed.

window.SummitAdmin = (function () {
  const TOKEN_KEY = "summitAdminToken";
  const BYPASS_KEY = "summitAdminBypass";
  const BYPASS_USER_KEY = "summitAdminBypassUser";
  const BYPASS_EMAIL = "admin";
  const BYPASS_PASSWORD = "admin";

  function isLocalDemoHost() {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "";
  }

  async function tryAdminLogin(email, password) {
    const normalizedEmail = (email || "").trim().toLowerCase();

    // Local-only demo bypass — disabled on GitHub Pages / production hosts.
    if (
      isLocalDemoHost() &&
      normalizedEmail === BYPASS_EMAIL &&
      password === BYPASS_PASSWORD
    ) {
      localStorage.setItem(BYPASS_KEY, "true");
      localStorage.setItem(BYPASS_USER_KEY, "Admin");
      sessionStorage.removeItem(TOKEN_KEY);
      return true;
    }

    // Clear a leftover local bypass if someone opens the public site.
    if (!isLocalDemoHost()) {
      localStorage.removeItem(BYPASS_KEY);
      localStorage.removeItem(BYPASS_USER_KEY);
    }

    try {
      const response = await fetch(`${window.SUMMIT_BACKEND_URL}/api/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password })
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
      localStorage.removeItem(BYPASS_KEY);
      localStorage.removeItem(BYPASS_USER_KEY);
      sessionStorage.setItem(TOKEN_KEY, result.token);
      return true;
    } catch (err) {
      // Backend not running / unreachable - don't block regular users.
      console.warn("Admin login check skipped (backend unreachable):", err.message);
      return false;
    }
  }

  async function verifyAdminSession() {
    if (isLocalDemoHost() && localStorage.getItem(BYPASS_KEY) === "true") {
      return {
        valid: true,
        role: "admin",
        full_name: localStorage.getItem(BYPASS_USER_KEY) || "Admin"
      };
    }

    if (!isLocalDemoHost()) {
      localStorage.removeItem(BYPASS_KEY);
      localStorage.removeItem(BYPASS_USER_KEY);
    }

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
    localStorage.removeItem(BYPASS_KEY);
    localStorage.removeItem(BYPASS_USER_KEY);
  }

  function isStaffRole(role) {
    return role === "leader" || role === "admin";
  }

  return { tryAdminLogin, verifyAdminSession, clearAdminSession, isStaffRole };
})();
