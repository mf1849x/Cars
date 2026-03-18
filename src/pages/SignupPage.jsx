import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { register } from "../api";

export default function SignupPage({ currentUser, authReady }) {
  const navigate = useNavigate();
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
      const data = await register(email, password);
      setMessage(`Account created for ${data.user.email}.`);
      setError("");
      navigate(data.user.role === "admin" ? "/admin" : "/cars", { replace: true });
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
        <p className="eyebrow">Public signup</p>
        <h1>Create a user account</h1>
        <p className="hero-text">Sign up for view-only access to the catalog. Admin access is assigned separately.</p>
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
            Create account
          </button>
          <Link className="button button-secondary" to="/login">
            Back to sign in
          </Link>
        </div>

        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
      </form>
    </section>
  );
}