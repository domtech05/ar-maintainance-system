import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

export default function Security() {
    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {
        apiRequest("/api/dashboard").then(setDashboard);
    }, []);

    if (!dashboard) {
        return <section className="panel">Loading security logs...</section>;
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <p className="eyebrow">Cyber Security</p>
                    <h1>Security Logs</h1>
                    <p className="muted">
                        Monitor authentication events, failed login attempts, and suspicious activity.
                    </p>
                </div>
            </header>

            <section className="panel">
                {dashboard.recentLogs.map((log) => (
                    <div className={`table-row ${log.type === "security" ? "danger-row" : ""}`} key={log.id}>
                        <div>
                            <strong>{log.type}</strong>
                            <p>{log.message}</p>
                        </div>
                        <small>{log.username}</small>
                        <small>{new Date(log.timestamp).toLocaleString()}</small>
                    </div>
                ))}
            </section>
        </>
    );
}