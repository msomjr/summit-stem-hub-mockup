// SUMMIT Supabase client configuration.
// Replace these with your real project values from Supabase -> Settings -> API.
// IMPORTANT: Use ONLY the public anon key in front-end code. Never expose service role keys.
window.SUMMIT_SUPABASE_URL = "https://nzuqjqcxlyuazvdfpgpa.supabase.co";
window.SUMMIT_SUPABASE_ANON_KEY = "sb_publishable_1IfZeLexqwkpjkmjBOHEDg_l4oqKxQn";

window.getSummitSupabaseClient = function getSummitSupabaseClient() {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error("Supabase JS client is not loaded.");
  }

  if (!window.SUMMIT_SUPABASE_URL || !window.SUMMIT_SUPABASE_ANON_KEY ||
      window.SUMMIT_SUPABASE_URL.includes("YOUR_PROJECT_ID") ||
      window.SUMMIT_SUPABASE_ANON_KEY.includes("YOUR_PUBLIC_ANON_KEY")) {
    throw new Error("Supabase config is missing. Update supabase-config.js with real values.");
  }

  if (!window.__summitSupabaseClient) {
    window.__summitSupabaseClient = window.supabase.createClient(
      window.SUMMIT_SUPABASE_URL,
      window.SUMMIT_SUPABASE_ANON_KEY
    );
  }

  return window.__summitSupabaseClient;
};
