import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { apiRequest } from "../api.js";

export default function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");

    async function loadDashboard() {
        try {
            const data = await apiRequest("/api/dashboard");
            setDashboard(data);
        } catch (err) {
            setError(err.message);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    if (error) {
        return (
            <main className="page">
                <Navbar title="Admin Dashboard" />
                <div className="card error">{error}</div>
            </main>
        );
    }

    if (!dashboard) {
        return (
            <main className="page">
                <Navbar title="Admin Dashboard" />
                <div className="card">Loading dashboard...</div>
            </main>
        );
    }

    return (
        <main className="page">
            <Navbar title="Admin Dashboard" />

            <div className="stats-grid">
                <div className="stat-card">
                    <span>Open Faults</span>
                    <strong>{dashboard.summary.openFaults}</strong>
                </div>
                <div className="stat-card">
                    <span>Total Faults</span>
                    <strong>{dashboard.summary.totalFaults}</strong>
                </div>
                <div className="stat-card">
                    <span>Tool Checks</span>
                    <strong>{dashboard.summary.toolChecks}</strong>
                </div>
                <div className="stat-card warning">
                    <span>Security Events</span>
                    <strong>{dashboard.summary.securityEvents}</strong>
                </div>
            </div>

            <div className="grid three-column">
                <section className="card">
                    <h2>Recent Faults</h2>
                    {dashboard.recentFaults.length === 0 && <p className="muted">No faults recorded.</p>}
                    {dashboard.recentFaults.map((fault) => (
                        <div className="list-item" key={fault.id}>
                            <strong>{fault.faultType}</strong>
                            <p>{fault.location} — {fault.severity}</p>
                            <small>{fault.reportedBy}</small>
                        </div>
                    ))}
                </section>

                <section className="card">
                    <h2>Recent Tool Checks</h2>
                    {dashboard.recentToolChecks.length === 0 && <p className="muted">No tool checks recorded.</p>}
                    {dashboard.recentToolChecks.map((check) => (
                        <div className="list-item" key={check.id}>
                            <strong>{check.taskName}</strong>
                            <p>{check.toolsChecked.join(", ") || "No tools selected"}</p>
                            <small>{check.checkedBy}</small>
                        </div>
                    ))}
                </section>

                <section className="card">
                    <h2>System Logs</h2>
                    {dashboard.recentLogs.map((log) => (
                        <div className="list-item" key={log.id}>
                            <strong>{log.type}</strong>
                            <p>{log.message}</p>
                            <small>{log.username}</small>
                        </div>
                    ))}
                </section>
            </div>
        </main>
    );
}