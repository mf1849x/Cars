# Plan: Add User Authentication & Role-Based Access Control

## TL;DR
Add JWT-based authentication with two roles (Admin + User):
- **Admin**: Create/edit/delete cars + manage users
- **User**: View-only access to car catalog + public sign-up option
- Backend: Add users table, auth endpoints, JWT middleware
- Frontend: Login/signup pages, protected routes, admin access check
- All user data in SQLite alongside cars table

## Steps

### Phase 1: Database & Server Setup
1. **Create users table in SQLite** with: id, email, password_hash, role (admin/user), created_at
   - File: `server/index.js` — add migration or creation logic
2. **Install dependencies** for hashing & JWT
   - Add `bcryptjs` for password hashing, `jsonwebtoken` for JWT
3. **Create auth middleware** in server to verify JWT tokens on protected routes
   - File: `server/index.js` — add verifyToken, verifyRole middleware functions
4. **Create auth API endpoints**:
   - `POST /api/auth/register` — public, creates user with role="user"
   - `POST /api/auth/login` — public, returns JWT token
   - `POST /api/auth/logout` — clears client-side token (optional)
   - `GET /api/auth/me` — returns current user info (protected)
   - `POST /api/users` — admin-only, create user with specific role
   - File: `server/index.js` — add route handlers

5. **Protect existing car endpoints**
   - `POST /api/cars` — require admin role
   - `PUT /api/cars/:id` — require admin role
   - `DELETE /api/cars/:id` — require admin role
   - GET endpoints remain public
   - File: `server/index.js` — wrap routes with middleware

### Phase 2: Frontend Login/Auth Pages
6. **Create Login page** (`src/pages/LoginPage.jsx`)
   - Email + password form
   - Submit to `/api/auth/login`
   - Store JWT in localStorage
   - Redirect to `/cars` on success, show error on failure

7. **Create Sign-up page** (`src/pages/SignupPage.jsx`)
   - Email + password form
   - Submit to `/api/auth/register`
   - Store JWT + redirect to `/cars`

8. **Create route guards** in app routing
   - File: `src/App.jsx` — add ProtectedRoute component that redirects to login if no token
   - AdminPage requires both token + admin role

9. **Add Auth API layer** in frontend
   - File: `src/api.js` — add login(), register(), getCurrentUser(), setAuthToken() functions
   - Automatically attach JWT to all requests via Authorization header

### Phase 3: UI Updates & User Management
10. **Update AdminPage** (`src/pages/AdminPage.jsx`)
    - Add "Users" tab/section (admin-only) to view/create/delete users
    - Add form to create new users with role selection
    - Show current logged-in user info

11. **Add auth status to NavBar/Header**
    - Display current user email
    - Add logout button
    - Hide admin link unless user is admin

12. **Update App routing** (`src/App.jsx`)
    - Add routes: `/login`, `/signup`
    - Protect routes: `/admin` requires admin role
    - Handle redirect logic if token expires

### Verification
1. **Authentication flow**: Register new account → login → JWT stored → can access `/cars` and `/admin` (if admin)
2. **Role-based access**: 
   - Regular user logs in → admin link hidden, can't access `/admin`
   - Admin logs in → admin link visible, can access and modify cars
3. **Protected API calls**: Try DELETE car without token → 401 error
4. **Token persistence**: Refresh page → user stays logged in (token in localStorage)
5. **User management**: Admin can create users via `/api/users` endpoint with role="admin"

## Relevant Files
- `server/index.js` — Add users table, auth endpoints, middleware
- `server/data/cars.db` — Add users table (SQLite)
- `src/api.js` — Add auth functions, JWT header attachment
- `src/pages/LoginPage.jsx` — **NEW** Login form
- `src/pages/SignupPage.jsx` — **NEW** Sign-up form
- `src/pages/AdminPage.jsx` — Add user management section, check admin role
- `src/App.jsx` — Add routes, protect routes, routing logic
- `package.json` — Add bcryptjs, jsonwebtoken

## Decisions
- **JWT over sessions**: Stateless auth, scales better, JSON token contains user info
- **SQLite same database**: Simpler deployment, shared connection
- **Admin-created users + sign-up**: Flexibility for both internal admins + public access
- **Role on token**: JWT includes role, no DB lookup on each request
- **localStorage for JWT**: Simple, works with SPA, can add refresh token later

## Further Considerations
1. **Password reset flow** — Not in initial plan, but consider email-based reset later
2. **Token expiration** — Set reasonable expiry (e.g., 24h) and implement refresh token endpoint
3. **HTTPS in production** — Tokens must be sent over HTTPS only (use secure cookie flag if switching to cookies)