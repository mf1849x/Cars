const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "cars-auth-dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "cars.db");
const distDir = path.join(__dirname, "..", "dist");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    trim TEXT NOT NULL,
    bodyType TEXT NOT NULL,
    color TEXT NOT NULL,
    price INTEGER NOT NULL,
    mileage INTEGER NOT NULL,
    fuelType TEXT NOT NULL,
    transmission TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const existingCars = db.prepare("SELECT COUNT(*) AS count FROM cars").get().count;

if (existingCars === 0) {
  const seedCars = [
    {
      make: "Toyota",
      model: "Camry",
      year: 2023,
      trim: "XSE",
      bodyType: "Sedan",
      color: "Wind Chill Pearl",
      price: 31990,
      mileage: 12400,
      fuelType: "Gasoline",
      transmission: "Automatic",
      description: "Comfort-focused midsize sedan with a sharp cabin and balanced daily driving manners.",
    },
    {
      make: "Honda",
      model: "CR-V",
      year: 2024,
      trim: "Sport Touring",
      bodyType: "SUV",
      color: "Canyon River Blue",
      price: 38450,
      mileage: 8100,
      fuelType: "Hybrid",
      transmission: "CVT",
      description: "Efficient family SUV with generous cargo space, a quiet ride, and modern driver assists.",
    },
    {
      make: "Ford",
      model: "F-150",
      year: 2022,
      trim: "Lariat",
      bodyType: "Truck",
      color: "Carbonized Gray",
      price: 45995,
      mileage: 22180,
      fuelType: "Gasoline",
      transmission: "Automatic",
      description: "Versatile full-size pickup set up for towing, highway comfort, and weekend utility.",
    },
    {
      make: "BMW",
      model: "330i",
      year: 2021,
      trim: "M Sport",
      bodyType: "Sedan",
      color: "Alpine White",
      price: 34900,
      mileage: 28410,
      fuelType: "Gasoline",
      transmission: "Automatic",
      description: "Sport sedan with precise steering, refined power delivery, and a premium cabin layout.",
    },
    {
      make: "Tesla",
      model: "Model Y",
      year: 2024,
      trim: "Long Range",
      bodyType: "SUV",
      color: "Stealth Grey",
      price: 46990,
      mileage: 5900,
      fuelType: "Electric",
      transmission: "Automatic",
      description: "Fast, quiet electric crossover with strong range, clean packaging, and expansive glass.",
    },
    {
      make: "Mazda",
      model: "MX-5 Miata",
      year: 2023,
      trim: "Club",
      bodyType: "Convertible",
      color: "Soul Red Crystal",
      price: 33750,
      mileage: 6400,
      fuelType: "Gasoline",
      transmission: "Manual",
      description: "Lightweight roadster built around simple driving feedback and open-air weekend fun.",
    },
  ];

  const insertCar = db.prepare(`
    INSERT INTO cars (
      make, model, year, trim, bodyType, color, price, mileage, fuelType, transmission, description
    ) VALUES (
      @make, @model, @year, @trim, @bodyType, @color, @price, @mileage, @fuelType, @transmission, @description
    )
  `);

  const insertMany = db.transaction((cars) => {
    for (const car of cars) {
      insertCar.run(car);
    }
  });

  insertMany(seedCars);
}

const existingUsers = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;

if (existingUsers === 0) {
  const adminPasswordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 12);

  db.prepare(`
    INSERT INTO users (email, password_hash, role)
    VALUES (?, ?, 'admin')
  `).run(DEFAULT_ADMIN_EMAIL, adminPasswordHash);

  console.log(`Seeded default admin user: ${DEFAULT_ADMIN_EMAIL}`);
  console.log(`Default admin password: ${DEFAULT_ADMIN_PASSWORD}`);
}

const carColumns = [
  "make",
  "model",
  "year",
  "trim",
  "bodyType",
  "color",
  "price",
  "mileage",
  "fuelType",
  "transmission",
  "description",
];

function normalizeCarPayload(payload) {
  const required = {};

  for (const key of carColumns) {
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
      throw new Error(`Missing required field: ${key}`);
    }

    required[key] = payload[key];
  }

  required.year = Number(required.year);
  required.price = Number(required.price);
  required.mileage = Number(required.mileage);

  if ([required.year, required.price, required.mileage].some(Number.isNaN)) {
    throw new Error("Year, price, and mileage must be numeric values.");
  }

  return required;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function createUser({ email, password, role = "user" }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  if (!["admin", "user"].includes(role)) {
    throw new Error("Role must be either admin or user.");
  }

  if (getUserByEmail(normalizedEmail)) {
    const error = new Error("A user with that email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const result = db
    .prepare(
      `
        INSERT INTO users (email, password_hash, role)
        VALUES (@email, @passwordHash, @role)
      `
    )
    .run({
      email: normalizedEmail,
      passwordHash,
      role,
    });

  return getUserById(result.lastInsertRowid);
}

function updateUserById(id, { email, password, role }) {
  const existingUser = getUserById(id);

  if (!existingUser) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email ?? existingUser.email);
  const nextRole = role ?? existingUser.role;

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (!["admin", "user"].includes(nextRole)) {
    throw new Error("Role must be either admin or user.");
  }

  const emailOwner = getUserByEmail(normalizedEmail);

  if (emailOwner && Number(emailOwner.id) !== Number(id)) {
    const error = new Error("A user with that email already exists.");
    error.statusCode = 409;
    throw error;
  }

  if (existingUser.role === "admin" && nextRole !== "admin" && countAdminUsers() <= 1) {
    throw new Error("At least one admin account must remain.");
  }

  const nextPasswordHash =
    typeof password === "string" && password.length > 0 ? bcrypt.hashSync(password, 12) : existingUser.password_hash;

  db.prepare(
    `
      UPDATE users
      SET email = @email,
          password_hash = @passwordHash,
          role = @role
      WHERE id = @id
    `
  ).run({
    id,
    email: normalizedEmail,
    passwordHash: nextPasswordHash,
    role: nextRole,
  });

  return getUserById(id);
}

function authenticateUser(email, password) {
  const user = getUserByEmail(normalizeEmail(email));

  if (!user) {
    return null;
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return null;
  }

  return user;
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authentication token." });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.auth = payload;
    req.user = serializeUser(user);

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource." });
    }

    return next();
  };
}

function createAuthResponse(user) {
  const token = signToken(user);

  return {
    token,
    user: serializeUser(user),
  };
}

function getAllUsers() {
  return db
    .prepare("SELECT id, email, role, created_at FROM users ORDER BY datetime(created_at) DESC, id DESC")
    .all();
}

function countAdminUsers() {
  return db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count;
}

function createApp() {
  const app = express();

  app.use(express.json());

  app.post("/api/auth/register", (req, res) => {
    try {
      const payload = req.body || {};
      const user = createUser({
        email: payload.email,
        password: payload.password,
        role: "user",
      });

      return res.status(201).json(createAuthResponse(user));
    } catch (error) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const payload = req.body || {};
    const user = authenticateUser(payload.email, payload.password);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json(createAuthResponse(user));
  });

  app.post("/api/auth/logout", (req, res) => {
    return res.status(204).send();
  });

  app.get("/api/auth/me", verifyToken, (req, res) => {
    return res.json({ user: req.user });
  });

  app.post("/api/users", verifyToken, requireRole("admin"), (req, res) => {
    try {
      const payload = req.body || {};
      const user = createUser({
        email: payload.email,
        password: payload.password,
        role: payload.role || "user",
      });

      return res.status(201).json({ user: serializeUser(user) });
    } catch (error) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  });

  app.get("/api/users", verifyToken, requireRole("admin"), (req, res) => {
    return res.json({ users: getAllUsers() });
  });

  app.put("/api/users/:id", verifyToken, requireRole("admin"), (req, res) => {
    try {
      const payload = req.body || {};
      const user = updateUserById(req.params.id, {
        email: payload.email,
        password: payload.password,
        role: payload.role,
      });

      return res.json({ user: serializeUser(user) });
    } catch (error) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", verifyToken, requireRole("admin"), (req, res) => {
    const targetUser = getUserById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (Number(targetUser.id) === Number(req.user.id)) {
      return res.status(400).json({ message: "You cannot delete your own account while signed in." });
    }

    if (targetUser.role === "admin" && countAdminUsers() <= 1) {
      return res.status(400).json({ message: "At least one admin account must remain." });
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);

    return res.status(204).send();
  });

  app.get("/api/cars", (req, res) => {
    const conditions = [];
    const values = {};

    if (req.query.make) {
      conditions.push("make = @make");
      values.make = req.query.make;
    }

    if (req.query.model) {
      conditions.push("model = @model");
      values.model = req.query.model;
    }

    if (req.query.year) {
      conditions.push("year = @year");
      values.year = Number(req.query.year);
    }

    if (req.query.bodyType) {
      conditions.push("bodyType = @bodyType");
      values.bodyType = req.query.bodyType;
    }

    if (req.query.minPrice) {
      conditions.push("price >= @minPrice");
      values.minPrice = Number(req.query.minPrice);
    }

    if (req.query.maxPrice) {
      conditions.push("price <= @maxPrice");
      values.maxPrice = Number(req.query.maxPrice);
    }

    if (req.query.search) {
      conditions.push(`(
        make LIKE @search OR
        model LIKE @search OR
        trim LIKE @search OR
        bodyType LIKE @search OR
        description LIKE @search
      )`);
      values.search = `%${req.query.search}%`;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const cars = db
      .prepare(`SELECT * FROM cars ${whereClause} ORDER BY year DESC, price DESC`)
      .all(values);

    const filterOptions = {
      makes: db.prepare("SELECT DISTINCT make FROM cars ORDER BY make").all().map((row) => row.make),
      models: db.prepare("SELECT DISTINCT model FROM cars ORDER BY model").all().map((row) => row.model),
      years: db.prepare("SELECT DISTINCT year FROM cars ORDER BY year DESC").all().map((row) => row.year),
      bodyTypes: db.prepare("SELECT DISTINCT bodyType FROM cars ORDER BY bodyType").all().map((row) => row.bodyType),
    };

    res.json({
      cars,
      total: cars.length,
      filterOptions,
    });
  });

  app.get("/api/cars/all", (req, res) => {
    const cars = db.prepare("SELECT * FROM cars ORDER BY id").all();
    return res.json({ cars, total: cars.length });
  });

  app.get("/api/cars/find/:year/:model", (req, res) => {
    const { year, model } = req.params;
    const cars = db
      .prepare("SELECT * FROM cars WHERE year = ? AND LOWER(model) = LOWER(?) ORDER BY id")
      .all(Number(year), model);

    return res.json({ cars, total: cars.length });
  });

  app.get("/api/cars/:id", (req, res) => {
    const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id);

    if (!car) {
      return res.status(404).json({ message: "Car not found." });
    }

    return res.json(car);
  });

  app.post("/api/cars", verifyToken, requireRole("admin"), (req, res) => {
    try {
      const car = normalizeCarPayload(req.body);
      const result = db
        .prepare(`
          INSERT INTO cars (
            make, model, year, trim, bodyType, color, price, mileage, fuelType, transmission, description
          ) VALUES (
            @make, @model, @year, @trim, @bodyType, @color, @price, @mileage, @fuelType, @transmission, @description
          )
        `)
        .run(car);

      return res.status(201).json(db.prepare("SELECT * FROM cars WHERE id = ?").get(result.lastInsertRowid));
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/cars/:id", verifyToken, requireRole("admin"), (req, res) => {
    const existing = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Car not found." });
    }

    try {
      const car = normalizeCarPayload(req.body);
      db.prepare(`
        UPDATE cars
        SET
          make = @make,
          model = @model,
          year = @year,
          trim = @trim,
          bodyType = @bodyType,
          color = @color,
          price = @price,
          mileage = @mileage,
          fuelType = @fuelType,
          transmission = @transmission,
          description = @description
        WHERE id = @id
      `).run({ ...car, id: Number(req.params.id) });

      return res.json(db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id));
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cars/:id", verifyToken, requireRole("admin"), (req, res) => {
    const result = db.prepare("DELETE FROM cars WHERE id = ?").run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Car not found." });
    }

    return res.status(204).send();
  });

  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));

    app.get(/^(?!\/api).*/, (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "Not found." });
      }

      return res.sendFile(path.join(distDir, "index.html"));
    });
  }

  return app;
}

if (require.main === module) {
  createApp().listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { createApp, db };
