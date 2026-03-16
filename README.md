# TorqueHouse Cars MVP

A full-stack car catalog MVP built with React, Vite, Express, and SQLite.

This project includes a public inventory browsing experience plus an admin workflow for creating, editing, and deleting listings.

## Features

- Home page with featured vehicles
- Inventory page with filtering and keyword search
- Car details page for each listing
- Admin page with full CRUD operations
- SQLite-backed API with seeded starter data
- Single-command local development for frontend + backend

## Tech Stack

- Frontend: React 19, React Router, Vite
- Backend: Express 5
- Database: SQLite via better-sqlite3
- Tooling: concurrently

## Project Structure

```text
Cars/
  src/
    App.jsx
    api.js
    main.jsx
    styles.css
    pages/
      HomePage.jsx
      CarsPage.jsx
      CarDetailsPage.jsx
      AdminPage.jsx
  server/
    index.js
    data/
      cars.db (created automatically)
  index.html
  vite.config.mjs
  package.json
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start in development mode

```bash
npm run dev
```

This starts:

- Vite client on http://localhost:5173
- Express API server on http://localhost:3001

Vite is configured to proxy `/api` requests to the backend.

## Available Scripts

- `npm run dev` - Run client and server together
- `npm run dev:client` - Run only the Vite client
- `npm run dev:server` - Run only the Express server in watch mode
- `npm run build` - Build production frontend assets to `dist/`
- `npm start` - Start the Express server (serves API and built frontend if `dist/` exists)

## API Overview

Base URL in development: http://localhost:3001

### Endpoints

- `GET /api/cars`
  - Returns list of cars, total count, and filter options.
  - Supports query params: `make`, `model`, `year`, `bodyType`, `minPrice`, `maxPrice`, `search`

- `GET /api/cars/:id`
  - Returns one car by ID.

- `POST /api/cars`
  - Creates a car.
  - Required fields:
    - `make`, `model`, `year`, `trim`, `bodyType`, `color`, `price`, `mileage`, `fuelType`, `transmission`, `description`

- `PUT /api/cars/:id`
  - Updates an existing car by ID.
  - Uses the same required fields as create.

- `DELETE /api/cars/:id`
  - Deletes a car by ID.

## Data Notes

- On first run, the server creates the SQLite database at `server/data/cars.db`.
- If the cars table is empty, starter inventory rows are automatically seeded.

## Production Notes

1. Build the frontend:

```bash
npm run build
```

2. Start the server:

```bash
npm start
```

When the `dist/` folder exists, the Express server serves static frontend assets and handles non-API routes for client-side routing.
