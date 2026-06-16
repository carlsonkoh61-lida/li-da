/*
  auth.js — shared Supabase auth for Li-Da.

  The anon (public) key below is SAFE to live in browser code. On its own it can
  do nothing: it only permits what your Row-Level Security policies allow, and
  every read/write is tied to the signed-in user. The powerful service key stays
  server-side and is never used here.

  SETUP: paste your anon/public key where marked below
  (Supabase → Settings → API → Project API keys → "anon" "public").

  REQUIRES the supabase-js library to be loaded BEFORE this file, e.g.:
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/auth.js"></script>
*/
(function () {
  var SUPABASE_URL = "https://kwwjapbmkslbfdddbukn.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3d2phcGJta3NsYmZkZGRidWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mjk3ODgsImV4cCI6MjA5NjQwNTc4OH0.4txRyh8y70Kea3cu2oGAzA_ztstpfoQCHVraz8lvsNM";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("[Li-Da auth] supabase-js not loaded. Add the CDN <script> before auth.js.");
    return;
  }
  if (SUPABASE_ANON_KEY.indexOf("PASTE_YOUR") === 0) {
    console.warn("[Li-Da auth] Anon key not set yet — paste it into auth.js.");
  }

  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.lidaAuth = {
    client: client,

    signUp: function (email, password) {
      return client.auth.signUp({ email: email, password: password });
    },
    signIn: function (email, password) {
      return client.auth.signInWithPassword({ email: email, password: password });
    },
    signOut: function () {
      return client.auth.signOut();
    },
    getUser: function () {
      return client.auth.getUser().then(function (r) { return r.data ? r.data.user : null; });
    },
    getSession: function () {
      return client.auth.getSession().then(function (r) { return r.data ? r.data.session : null; });
    },

    // Call at the top of any page that should require login.
    // Redirects to the login screen (remembering where you were) if not signed in.
    requireAuth: function (loginPath) {
      return this.getSession().then(function (session) {
        if (!session) {
          var dest = loginPath || "/login.html";
          window.location.href = dest + "?next=" + encodeURIComponent(window.location.pathname);
          return null;
        }
        return session.user;
      });
    },

    onChange: function (cb) {
      return client.auth.onAuthStateChange(function (_event, session) { cb(session); });
    },

    // Ready for later — flip on Google in Supabase, then call this from a button.
    signInWithGoogle: function (redirectTo) {
      return client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo || (window.location.origin + "/research.html") },
      });
    },
  };
})();
