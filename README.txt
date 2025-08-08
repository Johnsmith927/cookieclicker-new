Activation server README
------------------------

Files:
- index.js          : main server (Node.js / Express)
- package.json      : npm package description
- db.json           : lowdb JSON database with activation codes
- generate_codes.js : helper to produce random codes
- .env.example      : example environment variables

Setup:
1. Copy the folder to your server (Replit or other Node host).
2. Create a .env file from .env.example and set a strong JWT_SECRET and ADMIN_KEY.
3. Install dependencies: `npm install`
4. Run: `npm start` (or set up using Replit or PM2)

Endpoints:
- POST /activate  { code, device_id }  -> returns { token } on success
- POST /renew     { device_id } (or Authorization: Bearer <token>) -> returns { token } to refresh expiry
- POST /admin/add  (requires header x-admin-key) { codes: ["A1","B2"] }
- POST /admin/revoke (requires header x-admin-key) { code: "ABC123" }

Notes:
- Tokens are signed with JWT_SECRET and expire in 30 days.
- On first activation the server assigns the code to the device_id and marks it used.
- If a code is already used by another device_id, activation will be denied.