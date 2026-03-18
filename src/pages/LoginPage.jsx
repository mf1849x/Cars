import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api";

export default function LoginPage({ currentUser, authReady }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authReady || !currentUser) {
      return;
    }

    navigate(currentUser.role === "admin" ? "/admin" : "/cars", { replace: true });
  }, [authReady, currentUser, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const data = await login(email, password);
      setMessage(`Welcome back, ${data.user.email}.`);
      setError("");
      navigate(location.state?.from || (data.user.role === "admin" ? "/admin" : "/cars"), { replace: true });
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  if (authReady && currentUser) {
    return <Navigate to={currentUser.role === "admin" ? "/admin" : "/cars"} replace />;
  }

  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">Account access</p>
        <h1>Sign in to manage inventory</h1>
        <p className="hero-text">Use your admin or user account to continue into the catalog experience.</p>
      </div>

      <form className="auth-card auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        <div className="form-actions">
          <button className="button button-primary" type="submit">
            Sign in
          </button>
          <Link className="button button-secondary" to="/signup">
            Create account
          </Link>
        </div>

        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
      </form>
    </section>
  );
}