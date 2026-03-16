const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const Database = require("better-sqlite3");

const PORT = process.env.PORT || 3001;
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

function createApp() {
  const app = express();

  app.use(express.json());

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

  app.get("/api/cars/:id", (req, res) => {
    const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id);

    if (!car) {
      return res.status(404).json({ message: "Car not found." });
    }

    return res.json(car);
  });

  app.post("/api/cars", (req, res) => {
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

  app.put("/api/cars/:id", (req, res) => {
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

  app.delete("/api/cars/:id", (req, res) => {
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
