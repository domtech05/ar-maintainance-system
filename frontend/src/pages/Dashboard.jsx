import { useEffect, useState } from "react";
import { apiRequest, logout, getUser } from "../api.js";

export default function Dashboard() {
    const user = getUser();

    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");

    async function loadDashboard() {
        setError("");

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
            <main className="dashboard-page">
                <div className="topbar">
                    <div>
                        <p className="eyebrow">Admin Dashboard</p>
                        <h1>System Monitoring</h1>
                    </div>

                    <button className="secondary-button" onClick={logout}>
                        Logout
                    </button>
                </div>

                <section className="card">
                    <p className="error">{error}</p>
                </section>
            </main>
        );
    }

    if (!dashboard) {
        return (
            <main className="dashboard-page">
                <section className="card">
                    Loading dashboard...
                </section>
            </main>
        );
    }

    return (
        <main className="dashboard-page">

            <div className="topbar">
                <div>
                    <p className="eyebrow">Admin Dashboard</p>
                    <h1>Security & Maintenance Monitoring</h1>
                    <p className="muted">
                        Logged in as {user.username}. This dashboard supports monitoring of faults, tool checks, and security events.
                    </p>
                </div>

                <div className="topbar-actions">
                    <button className="secondary-button" onClick={loadDashboard}>
                        Refresh
                    </button>

                    <button className="secondary-button" onClick={logout}>
                        Logout
                    </button>
                </div>
            </div>

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

            <div className="dashboard-grid three">

                <section className="card">
                    <p className="eyebrow">Fault Data</p>
                    <h2>Recent Fault Reports</h2>

                    {dashboard.recentFaults.length === 0 && (
                        <p className="muted">No faults have been reported.</p>
                    )}

                    {dashboard.recentFaults.map((fault) => (
                        <div className="list-item" key={fault.id}>
                            <strong>{fault.faultType}</strong>
                            <p>{fault.location} — {fault.severity} severity</p>
                            <small>
                                Reported by {fault.reportedBy}
                            </small>
                        </div>
                    ))}
                </section>

                <section className="card">
                    <p className="eyebrow">Tool Accountability</p>
                    <h2>Recent Tool Checks</h2>

                    {dashboard.recentToolChecks.length === 0 && (
                        <p className="muted">No tool checks submitted.</p>
                    )}

                    {dashboard.recentToolChecks.map((check) => (
                        <div className="list-item" key={check.id}>
                            <strong>{check.taskName}</strong>
                            <p>
                                {check.toolsChecked.length > 0
                                    ? check.toolsChecked.join(", ")
                                    : "No tools selected"}
                            </p>
                            <small>
                                Checked by {check.checkedBy}
                            </small>
                        </div>
                    ))}
                </section>

                <section className="card">
                    <p className="eyebrow">Security Monitoring</p>
                    <h2>System Logs</h2>

                    {dashboard.recentLogs.length === 0 && (
                        <p className="muted">No logs recorded.</p>
                    )}

                    {dashboard.recentLogs.map((log) => (
                        <div className={`list-item ${log.type === "security" ? "security-log" : ""}`} key={log.id}>
                            <strong>{log.type}</strong>
                            <p>{log.message}</p>
                            <small>
                                {log.username} — {new Date(log.timestamp).toLocaleString()}
                            </small>
                        </div>
                    ))}
                </section>

            </div>

        </main>
    );
}