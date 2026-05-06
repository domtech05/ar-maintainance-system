import { useState } from "react";
import { logout, apiRequest, getUser } from "../api.js";

export default function Engineer() {

    const user = getUser();

    const [faultForm, setFaultForm] = useState({
        markerId: "marker-001",
        faultType: "Signal Failure",
        location: "Tunnel A",
        severity: "high",
        notes: ""
    });

    const [toolForm, setToolForm] = useState({
        taskName: "Rail Inspection",
        toolsChecked: []
    });

    const [message, setMessage] = useState("");

    function updateFault(event) {
        setFaultForm({
            ...faultForm,
            [event.target.name]: event.target.value
        });
    }

    function toggleTool(toolName) {

        const exists = toolForm.toolsChecked.includes(toolName);

        setToolForm({
            ...toolForm,
            toolsChecked: exists
                ? toolForm.toolsChecked.filter(tool => tool !== toolName)
                : [...toolForm.toolsChecked, toolName]
        });
    }

    async function submitFault(event) {
        event.preventDefault();

        setMessage("");

        try {

            await apiRequest("/api/faults", {
                method: "POST",
                body: JSON.stringify(faultForm)
            });

            setMessage("Fault submitted successfully.");

            setFaultForm({
                ...faultForm,
                notes: ""
            });

        } catch (err) {
            setMessage(err.message);
        }
    }

    async function submitToolCheck(event) {

        event.preventDefault();

        setMessage("");

        try {

            await apiRequest("/api/tools", {
                method: "POST",
                body: JSON.stringify(toolForm)
            });

            setMessage("Tool accountability check submitted.");

        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main className="dashboard-page">

            <div className="topbar">

                <div>
                    <p className="eyebrow">Engineer Portal</p>
                    <h1>Maintenance Operations</h1>
                    <p className="muted">
                        Logged in as {user.username}
                    </p>
                </div>

                <button
                    className="secondary-button"
                    onClick={logout}
                >
                    Logout
                </button>

            </div>

            {message && (
                <div className="notice">
                    {message}
                </div>
            )}

            <div className="dashboard-grid">

                <section className="card">

                    <p className="eyebrow">Fault Reporting</p>

                    <h2>Submit Fault</h2>

                    <p className="muted">
                        Simulates a fault identified through AR inspection.
                    </p>

                    <form onSubmit={submitFault}>

                        <label>Marker ID</label>
                        <input
                            name="markerId"
                            value={faultForm.markerId}
                            onChange={updateFault}
                        />

                        <label>Fault Type</label>
                        <select
                            name="faultType"
                            value={faultForm.faultType}
                            onChange={updateFault}
                        >
                            <option>Signal Failure</option>
                            <option>Electrical Issue</option>
                            <option>Structural Crack</option>
                            <option>Equipment Degradation</option>
                        </select>

                        <label>Location</label>
                        <input
                            name="location"
                            value={faultForm.location}
                            onChange={updateFault}
                        />

                        <label>Severity</label>
                        <select
                            name="severity"
                            value={faultForm.severity}
                            onChange={updateFault}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>

                        <label>Engineer Notes</label>

                        <textarea
                            name="notes"
                            value={faultForm.notes}
                            onChange={updateFault}
                            placeholder="Describe the detected issue..."
                        />

                        <button type="submit">
                            Submit Fault
                        </button>

                    </form>

                </section>

                <section className="card">

                    <p className="eyebrow">Tool Accountability</p>

                    <h2>Maintenance Tool Check</h2>

                    <p className="muted">
                        Ensures tools entering restricted areas are accounted for.
                    </p>

                    <form onSubmit={submitToolCheck}>

                        <label>Task Name</label>

                        <input
                            value={toolForm.taskName}
                            onChange={(e) =>
                                setToolForm({
                                    ...toolForm,
                                    taskName: e.target.value
                                })
                            }
                        />

                        {[
                            "Multimeter",
                            "Spanner",
                            "Screwdriver",
                            "Inspection Torch"
                        ].map(tool => (

                            <label
                                className="checkbox-row"
                                key={tool}
                            >

                                <input
                                    type="checkbox"
                                    checked={toolForm.toolsChecked.includes(tool)}
                                    onChange={() => toggleTool(tool)}
                                />

                                {tool}

                            </label>

                        ))}

                        <button type="submit">
                            Submit Tool Check
                        </button>

                    </form>

                </section>

            </div>

        </main>
    );
}