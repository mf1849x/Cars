import { useEffect, useState } from "react";
import { createCar, deleteCar, getCars, updateCar } from "../api";

const initialForm = {
  make: "",
  model: "",
  year: "",
  trim: "",
  bodyType: "",
  color: "",
  price: "",
  mileage: "",
  fuelType: "",
  transmission: "",
  description: "",
};

export default function AdminPage() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCars() {
    const data = await getCars();
    setCars(data.cars);
  }

  useEffect(() => {
    loadCars();
  }, []);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function beginEdit(car) {
    setEditingId(car.id);
    setForm({
      make: car.make,
      model: car.model,
      year: String(car.year),
      trim: car.trim,
      bodyType: car.bodyType,
      color: car.color,
      price: String(car.price),
      mileage: String(car.mileage),
      fuelType: car.fuelType,
      transmission: car.transmission,
      description: car.description,
    });
    setMessage("");
    setError("");
  }

  function clearForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (editingId) {
        await updateCar(editingId, form);
        setMessage("Car updated.");
      } else {
        await createCar(form);
        setMessage("Car created.");
      }

      setError("");
      clearForm();
      await loadCars();
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this car listing?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteCar(id);
      if (editingId === id) {
        clearForm();
      }
      setMessage("Car deleted.");
      setError("");
      await loadCars();
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  return (
    <div className="admin-layout">
      <section className="form-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>{editingId ? "Edit listing" : "Add a new car"}</h2>
          </div>
        </div>

        <form className="car-form" onSubmit={handleSubmit}>
          {Object.entries(form).map(([key, value]) => (
            <label key={key}>
              {key}
              {key === "description" ? (
                <textarea name={key} value={value} onChange={handleChange} rows="4" />
              ) : (
                <input
                  type={["year", "price", "mileage"].includes(key) ? "number" : "text"}
                  min={["year", "price", "mileage"].includes(key) ? "0" : undefined}
                  name={key}
                  value={value}
                  onChange={handleChange}
                />
              )}
            </label>
          ))}

          <div className="form-actions">
            <button className="button button-primary" type="submit">
              {editingId ? "Save changes" : "Add car"}
            </button>
            <button className="button button-secondary" type="button" onClick={clearForm}>
              Clear form
            </button>
          </div>
        </form>

        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
      </section>

      <section className="stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Inventory Manager</p>
            <h2>Current listings</h2>
          </div>
        </div>

        <div className="admin-table">
          {cars.map((car) => (
            <article className="admin-row" key={car.id}>
              <div>
                <h3>
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="subtle">
                  {car.trim} • {car.bodyType} • ${car.price.toLocaleString()}
                </p>
              </div>
              <div className="row-actions">
                <button className="button button-secondary" type="button" onClick={() => beginEdit(car)}>
                  Edit
                </button>
                <button className="button button-danger" type="button" onClick={() => handleDelete(car.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
