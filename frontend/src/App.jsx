import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Faults from "./pages/Faults.jsx";
import Tools from "./pages/Tools.jsx";
import Security from "./pages/Security.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ARView from "./pages/ARView.jsx";
import MyTasks from "./pages/MyTasks.jsx";
import { getToken, getUser } from "./api.js";

function ProtectedRoute({ children, requiredRole }) {
    const token = getToken();
    const user = getUser();

    if (!token) return <Navigate to="/" />;

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/engineer/faults" />;
    }

    return children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />

            <Route
                path="/engineer"
                element={<Navigate to="/engineer/faults" />}
            />

            <Route
                path="/engineer/faults"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <Faults />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/engineer/tools"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <Tools />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <AppLayout>
                            <Dashboard />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/engineer/tasks"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <MyTasks />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/security"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <AppLayout>
                            <Security />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/ar"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <ARView />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

        </Routes>
    );
}