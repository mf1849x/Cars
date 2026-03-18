import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CarsPage from "./pages/CarsPage";
import CarDetailsPage from "./pages/CarDetailsPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { getCurrentUser, logout as logoutRequest, setAuthToken } from "./api";

function ProtectedRoute({ currentUser, authReady, role, children }) {
  const location = useLocation();

  if (!authReady) {
    return <p className="auth-loading">Checking your session...</p>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && currentUser.role !== role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  function syncCurrentUser() {
    if (!localStorage.getItem("cars-auth-token")) {
      setCurrentUser(null);
      setAuthReady(true);
      return Promise.resolve();
    }

    return getCurrentUser()
      .then((data) => {
        setCurrentUser(data.user);
      })
      .catch(() => {
        setAuthToken("");
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthReady(true);
      });
  }

  useEffect(() => {
    syncCurrentUser();

    function handleAuthChange() {
      syncCurrentUser();
    }

    window.addEventListener("cars-auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("cars-auth-changed", handleAuthChange);
    };
  }, []);

  async function handleLogout() {
    await logoutRequest().catch(() => {
      setAuthToken("");
    });
    setCurrentUser(null);
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">Curated Inventory</p>
          <NavLink className="brand" to="/">
            TorqueHouse
          </NavLink>
        </div>
        <nav className="main-nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/cars">Cars</NavLink>
          {currentUser?.role === "admin" ? <NavLink to="/admin">Admin</NavLink> : null}
          {currentUser ? (
            <button className="button button-secondary nav-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/signup">Sign up</NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cars" element={<CarsPage />} />
          <Route path="/cars/:id" element={<CarDetailsPage />} />
          <Route path="/login" element={<LoginPage currentUser={currentUser} authReady={authReady} />} />
          <Route path="/signup" element={<SignupPage currentUser={currentUser} authReady={authReady} />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute currentUser={currentUser} authReady={authReady} role="admin">
                <AdminPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={currentUser?.role === "admin" ? "/admin" : "/"} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}
