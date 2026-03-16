import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCars } from "../api";

export default function HomePage() {
  const [featuredCars, setFeaturedCars] = useState([]);

  useEffect(() => {
    getCars().then((data) => setFeaturedCars(data.cars.slice(0, 3)));
  }, []);

  return (
    <div className="stack-lg">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Dealer MVP</p>
          <h1>Search, compare, and manage a focused car catalog.</h1>
          <p className="hero-text">
            Example inventory across sedans, SUVs, trucks, and enthusiast models with admin CRUD tools.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/cars">
              Explore cars
            </Link>
            <Link className="button button-secondary" to="/admin">
              Manage inventory
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <p>What this MVP includes</p>
          <ul>
            <li>Featured inventory on the home page</li>
            <li>Filters for make, model, year, body type, and price</li>
            <li>Keyword search and detail pages</li>
            <li>Admin add, edit, and delete workflow</li>
          </ul>
        </div>
      </section>

      <section className="stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured Cars</p>
            <h2>Ready-to-browse examples</h2>
          </div>
          <Link className="text-link" to="/cars">
            View full inventory
          </Link>
        </div>

        <div className="card-grid">
          {featuredCars.map((car) => (
            <article className="car-card" key={car.id}>
              <div className="car-card-top">
                <span className="badge">{car.bodyType}</span>
                <span className="price">${car.price.toLocaleString()}</span>
              </div>
              <h3>
                {car.year} {car.make} {car.model}
              </h3>
              <p className="subtle">
                {car.trim} • {car.color}
              </p>
              <p>{car.description}</p>
              <Link className="text-link" to={`/cars/${car.id}`}>
                View details
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
