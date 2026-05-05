import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "engineer1",
        password: "password123"
    });

    const [error, setError] = useState("");

    function updateField(event) {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        try {
            const data = await apiRequest("/api/login", {
                method: "POST",
                body: JSON.stringify(form)
            });

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            if (data.user.role === "admin") {
                navigate("/dashboard");
            } else {
                navigate("/engineer");
            }
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <main className="page center-page">
            <section className="card login-card">
                <p className="eyebrow">Secure Prototype</p>
                <h1>AR Maintenance Support System</h1>
                <p className="muted">
                    Login as an authorised engineer or administrator.
                </p>

                <form onSubmit={handleSubmit}>
                    <label>Username</label>
                    <input
                        name="username"
                        value={form.username}
                        onChange={updateField}
                        required
                    />

                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={updateField}
                        required
                    />

                    <button type="submit">Login</button>
                </form>

                {error && <p className="error">{error}</p>}

                <div className="demo-details">
                    <p><strong>Engineer:</strong> engineer1 / password123</p>
                    <p><strong>Admin:</strong> admin1 / admin123</p>
                </div>
            </section>
        </main>
    );
}