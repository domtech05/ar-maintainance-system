import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Engineer from "./pages/Engineer.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getToken, getUser } from "./api.js";

function ProtectedRoute({ children, requiredRole }) {
  const token = getToken();
  const user = getUser();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/engineer" replace />;
  }

  return children;
}

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
            path="/engineer"
            element={
              <ProtectedRoute>
                <Engineer />
              </ProtectedRoute>
            }
        />

        <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <Dashboard />
              </ProtectedRoute>
            }
        />
      </Routes>
  );
}