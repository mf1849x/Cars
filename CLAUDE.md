# TorqueHouse Cars MVP

A full-stack car catalog application with public inventory browsing and admin CRUD operations.

## Quick Start

```bash
npm install
npm run dev
```

- Vite client: http://localhost:5173
- Express API: http://localhost:3001
- API requests to `/api/*` are proxied to the backend

## Tech Stack

- **Frontend**: React 19, React Router DOM 7, Vite 8
- **Backend**: Express 5, better-sqlite3
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Tools**: concurrently (runs client + server together)

## Project Structure

```
Cars/
├── src/
│   ├── App.jsx           # Root component, routing, auth state
│   ├── api.js            # API client functions (fetch wrappers)
│   ├── main.jsx          # React entry point
│   ├── styles.css        # Global styles
│   └── pages/
│       ├── HomePage.jsx
│       ├── CarsPage.jsx          # Inventory with filters
│       ├── CarDetailsPage.jsx
│       ├── AdminPage.jsx         # CRUD for cars + users
│       ├── LoginPage.jsx
│       └── SignupPage.jsx
├── server/
│   ├── index.js          # Express server, DB setup, routes
│   └── data/
│       └── cars.db       # SQLite database (auto-created)
├── vite.config.mjs       # Vite config with API proxy
└── package.json
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3001 | Express server port |
| `JWT_SECRET` | `cars-auth-dev-secret` | JWT signing key |
| `JWT_EXPIRES_IN` | `24h` | Token expiration |
| `DEFAULT_ADMIN_EMAIL` | `admin@example.com` | Auto-created admin |
| `DEFAULT_ADMIN_PASSWORD` | random | Admin password (logged on first start) |

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user (role: user)
- `POST /api/auth/login` - Login, returns JWT
- `POST /api/auth/logout` - Logout (no-op, client clears token)
- `GET /api/auth/me` - Get current user (requires auth)

### Users (admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user (any role)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (cannot delete self or last admin)

### Cars (public read, admin write)
- `GET /api/cars` - List cars with filtering
  - Query params: `make`, `model`, `year`, `bodyType`, `minPrice`, `maxPrice`, `search`
- `GET /api/cars/:id` - Get single car
- `POST /api/cars` - Create car (admin only)
- `PUT /api/cars/:id` - Update car (admin only)
- `DELETE /api/cars/:id` - Delete car (admin only)

## Car Schema

Required fields for create/update:
- `make` (string)
- `model` (string)
- `year` (number)
- `trim` (string)
- `bodyType` (string) - Sedan, SUV, Truck, Convertible, etc.
- `color` (string)
- `price` (number)
- `mileage` (number)
- `fuelType` (string) - Gasoline, Hybrid, Electric, etc.
- `transmission` (string) - Automatic, Manual, CVT
- `description` (string)

## Database

- Uses **better-sqlite3** (synchronous SQLite)
- Auto-creates tables on first run
- Seeds 6 sample cars if table is empty
- Seeds 1 admin user if no users exist (credentials logged to console)

## Authentication Flow

1. User logs in via `/api/auth/login`
2. Server returns JWT + user data
3. Client stores token in `localStorage` (`cars-auth-token`)
4. API client (`src/api.js`) adds `Authorization: Bearer <token>` header
5. Protected routes check token via `verifyToken` middleware
6. Admin routes additionally check `requireRole('admin')`

## Key Patterns

### API Client (`src/api.js`)
- All API functions return promises
- Automatically injects auth header from localStorage
- `setAuthToken()` updates token and dispatches `cars-auth-changed` event
- Request errors throw with server message

### Protected Routes (`App.jsx`)
- `ProtectedRoute` component wraps admin pages
- Checks `currentUser` and `authReady` state
- Redirects to `/login` if not authenticated
- `role` prop enforces admin-only access

### Auth State Sync
- `syncCurrentUser()` fetches current user on mount
- Listens for `cars-auth-changed` events to re-sync
- Clears user state on 401 errors

## Common Commands

```bash
# Development
npm run dev              # Start client + server
npm run dev:client       # Vite only
npm run dev:server       # Express only (with --watch)

# Production
npm run build            # Build frontend to dist/
npm start                # Start production server
```

## Notes

- Database is SQLite (file-based), no external DB server needed
- Production mode: Express serves static files from `dist/` and handles client-side routing
- Default admin password is randomly generated and logged on first server start
- At least one admin must always remain (enforced in delete logic)
