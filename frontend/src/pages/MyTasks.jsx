import { useEffect, useState } from "react";
import { apiRequest, getUser } from "../api.js";

export default function MyTasks() {
    const user = getUser();
    const [tasks, setTasks] = useState([]);
    const [message, setMessage] = useState("Loading assigned tasks...");

    async function loadTasks() {
        try {
            const data = await apiRequest("/api/faults?assignedTo=me");
            setTasks(data);
            setMessage("");
        } catch (err) {
            setMessage(err.message);
        }
    }

    useEffect(() => {
        loadTasks();
    }, []);

    return (
        <>
            <header className="page-header">
                <p className="eyebrow">Engineer Tasks</p>
                <h1>My Assigned Tickets</h1>
                <p className="muted">Tickets assigned to {user.username}.</p>
            </header>

            {message && <section className="panel">{message}</section>}

            <section className="panel">
                {tasks.length === 0 && <p className="muted">No assigned tasks.</p>}

                {tasks.map((task) => (
                    <div className="ticket-row" key={task.id}>
                        <div>
                            <strong>{task.faultType}</strong>
                            <p>{task.location}</p>
                            <small>{task.notes || "No notes provided."}</small>
                        </div>

                        <span className={`status-badge status-${task.status}`}>
              {task.status.replace("_", " ")}
            </span>
                    </div>
                ))}
            </section>
        </>
    );
}