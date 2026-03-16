import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCar } from "../api";

export default function CarDetailsPage() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCar(id)
      .then((data) => {
        setCar(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [id]);

  if (error) {
    return <p className="status-message error">{error}</p>;
  }

  if (!car) {
    return <p className="status-message">Loading car details...</p>;
  }

  return (
    <section className="details-layout">
      <div className="details-hero">
        <p className="eyebrow">{car.bodyType}</p>
        <h1>
          {car.year} {car.make} {car.model}
        </h1>
        <p className="hero-text">{car.description}</p>
        <div className="spec-strip">
          <span>{car.trim}</span>
          <span>{car.color}</span>
          <span>{car.transmission}</span>
          <span>{car.fuelType}</span>
        </div>
      </div>

      <div className="details-grid">
        <article className="details-card">
          <h2>Price & mileage</h2>
          <p className="detail-stat">${car.price.toLocaleString()}</p>
          <p>{car.mileage.toLocaleString()} miles</p>
        </article>

        <article className="details-card">
          <h2>Vehicle overview</h2>
          <dl className="spec-list">
            <div>
              <dt>Make</dt>
              <dd>{car.make}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{car.model}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{car.year}</dd>
            </div>
            <div>
              <dt>Body type</dt>
              <dd>{car.bodyType}</dd>
            </div>
          </dl>
        </article>
      </div>

      <Link className="text-link" to="/cars">
        Back to inventory
      </Link>
    </section>
  );
}
