import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCars } from "../api";

export default function CarsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    makes: [],
    models: [],
    years: [],
    bodyTypes: [],
  });

  const filters = useMemo(
    () => ({
      make: searchParams.get("make") || "",
      model: searchParams.get("model") || "",
      year: searchParams.get("year") || "",
      bodyType: searchParams.get("bodyType") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      search: searchParams.get("search") || "",
    }),
    [searchParams],
  );

  useEffect(() => {
    const query = searchParams.toString();
    getCars(query ? `?${query}` : "").then((data) => {
      setCars(data.cars);
      setFilterOptions(data.filterOptions);
    });
  }, [searchParams]);

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }

    setSearchParams(next);
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="inventory-layout">
      <aside className="filter-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Inventory Filters</p>
            <h2>Refine the list</h2>
          </div>
        </div>

        <label>
          Keyword
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search make, model, trim..."
          />
        </label>

        <label>
          Make
          <select value={filters.make} onChange={(event) => updateFilter("make", event.target.value)}>
            <option value="">All makes</option>
            {filterOptions.makes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Model
          <select value={filters.model} onChange={(event) => updateFilter("model", event.target.value)}>
            <option value="">All models</option>
            {filterOptions.models.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Year
          <select value={filters.year} onChange={(event) => updateFilter("year", event.target.value)}>
            <option value="">All years</option>
            {filterOptions.years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Body Type
          <select value={filters.bodyType} onChange={(event) => updateFilter("bodyType", event.target.value)}>
            <option value="">All body types</option>
            {filterOptions.bodyTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Min Price
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(event) => updateFilter("minPrice", event.target.value)}
            placeholder="15000"
          />
        </label>

        <label>
          Max Price
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => updateFilter("maxPrice", event.target.value)}
            placeholder="50000"
          />
        </label>

        <button className="button button-secondary" type="button" onClick={resetFilters}>
          Reset filters
        </button>
      </aside>

      <section className="stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">All Cars</p>
            <h2>{cars.length} vehicles available</h2>
          </div>
        </div>

        <div className="card-grid">
          {cars.map((car) => (
            <article className="car-card" key={car.id}>
              <div className="car-card-top">
                <span className="badge">{car.bodyType}</span>
                <span className="price">${car.price.toLocaleString()}</span>
              </div>
              <h3>
                {car.year} {car.make} {car.model}
              </h3>
              <p className="subtle">
                {car.trim} • {car.transmission} • {car.fuelType}
              </p>
              <p className="subtle">{car.mileage.toLocaleString()} miles</p>
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
