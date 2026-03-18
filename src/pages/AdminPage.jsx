import { useEffect, useState } from "react";
import { createCar, createUser, deleteCar, deleteUser, getCars, getUsers, setAuthToken, updateCar, updateUser } from "../api";

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

const initialUserForm = {
  email: "",
  password: "",
  role: "user",
};

export default function AdminPage({ currentUser }) {
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [editingId, setEditingId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [carMessage, setCarMessage] = useState("");
  const [carError, setCarError] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [userError, setUserError] = useState("");

  async function loadCars() {
    const data = await getCars();
    setCars(data.cars);
  }

  async function loadUsers() {
    const data = await getUsers();
    setUsers(data.users);
  }

  useEffect(() => {
    void Promise.all([loadCars(), loadUsers()]).catch((err) => {
      setCarError(err.message);
    });
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
    setCarMessage("");
    setCarError("");
  }

  function clearForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  function beginUserEdit(user) {
    setEditingUserId(user.id);
    setUserForm({
      email: user.email,
      password: "",
      role: user.role,
    });
    setUserMessage("");
    setUserError("");
  }

  function handleUserChange(event) {
    setUserForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function clearUserForm() {
    setEditingUserId(null);
    setUserForm(initialUserForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (editingId) {
        await updateCar(editingId, form);
        setCarMessage("Car updated.");
      } else {
        await createCar(form);
        setCarMessage("Car created.");
      }

      setCarError("");
      clearForm();
      await loadCars();
    } catch (err) {
      setCarError(err.message);
      setCarMessage("");
    }
  }

  async function handleUserSubmit(event) {
    event.preventDefault();

    try {
      if (editingUserId) {
        await updateUser(editingUserId, userForm);
        setUserMessage("User updated.");
      } else {
        await createUser(userForm);
        setUserMessage("User created.");
      }

      setUserError("");
      clearUserForm();
      await loadUsers();

      if (currentUser?.id === editingUserId) {
        setAuthToken(localStorage.getItem("cars-auth-token") || "");
      }
    } catch (err) {
      setUserError(err.message);
      setUserMessage("");
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
      setCarMessage("Car deleted.");
      setCarError("");
      await loadCars();
    } catch (err) {
      setCarError(err.message);
      setCarMessage("");
    }
  }

  async function handleDeleteUserAccount(id) {
    const confirmed = window.confirm("Delete this user account?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(id);
      setUserMessage("User deleted.");
      setUserError("");
      await loadUsers();
    } catch (err) {
      setUserError(err.message);
      setUserMessage("");
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

        {currentUser ? (
          <div className="user-panel">
            <p className="eyebrow">Signed in</p>
            <h3>{currentUser.email}</h3>
            <p className="subtle">Role: {currentUser.role}</p>
          </div>
        ) : null}

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

        {carMessage ? <p className="status-message success">{carMessage}</p> : null}
        {carError ? <p className="status-message error">{carError}</p> : null}

        <div className="section-heading">
          <div>
            <p className="eyebrow">Users</p>
            <h2>{editingUserId ? "Edit user" : "Create a user"}</h2>
          </div>
        </div>

        <form className="car-form" onSubmit={handleUserSubmit}>
          <label>
            Email
            <input type="email" name="email" value={userForm.email} onChange={handleUserChange} required />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={userForm.password}
              onChange={handleUserChange}
              required={!editingUserId}
              minLength={8}
              placeholder={editingUserId ? "Leave blank to keep current password" : undefined}
            />
          </label>

          <label>
            Role
            <select name="role" value={userForm.role} onChange={handleUserChange}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div className="form-actions">
            <button className="button button-primary" type="submit">
              {editingUserId ? "Save user" : "Create user"}
            </button>
            <button className="button button-secondary" type="button" onClick={clearUserForm}>
              Clear user form
            </button>
          </div>
        </form>

        {userMessage ? <p className="status-message success">{userMessage}</p> : null}
        {userError ? <p className="status-message error">{userError}</p> : null}
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

        <div className="section-heading">
          <div>
            <p className="eyebrow">User Directory</p>
            <h2>Registered users</h2>
          </div>
        </div>

        <div className="admin-table">
          {users.map((user) => (
            <article className="admin-row" key={user.id}>
              <div>
                <h3>{user.email}</h3>
                <p className="subtle">
                  {user.role} • Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="row-actions">
                <button className="button button-secondary" type="button" onClick={() => beginUserEdit(user)}>
                  Edit
                </button>
                <button
                  className="button button-danger"
                  type="button"
                  onClick={() => handleDeleteUserAccount(user.id)}
                  disabled={currentUser?.id === user.id}
                  title={currentUser?.id === user.id ? "You cannot delete your own account while signed in." : undefined}
                >
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
