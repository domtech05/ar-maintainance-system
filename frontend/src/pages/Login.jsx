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
                navigate("/engineer/faults");
            }
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <main className="page center-page">
            <section className="card login-card">
                <p className="eyebrow">Secure Prototype</p>
                <h1>TrackFlow</h1>
                <p className="muted">
                    Authorised access only. Login attempts are logged and monitored.
                </p>

                <form onSubmit={handleSubmit}>
                    <label>Username</label>
                    <input
                        name="username"
                        onChange={updateField}
                        required
                    />

                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        onChange={updateField}
                        required
                    />

                    <button type="submit">Login</button>
                </form>

                {error && <p className="error">{error}</p>}

            </section>
        </main>
    );
}