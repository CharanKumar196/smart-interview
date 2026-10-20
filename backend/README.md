SMART INTERVIEW AUTHENTICATION REPLACEMENT FILES

Copy these files into your project, replacing the existing files at the paths below:

1. backend/auth.js        <- auth.js
2. backend/index.js       <- index.js
3. fronted/src/lib/authFlows.js <- authFlows.js
4. fronted/src/App.jsx    <- App.jsx

The registration flow remains Email -> OTP -> Details. Login now uses email + password, and registration automatically inserts is_authorized=true after creating the profile. The existing profiles schema's login_id column is retained for compatibility and is filled with the verified email; it is not shown as a separate field in the UI.

IMPORTANT: Keep the service-role key only in the project-root/backend environment used by the server. Never put SUPABASE_SERVICE_ROLE_KEY in a VITE_ variable or frontend file. Ensure the profiles table has user_id, login_id, full_name columns and authorized_users has user_id and is_authorized columns.

After replacing files, restart backend and Vite.
