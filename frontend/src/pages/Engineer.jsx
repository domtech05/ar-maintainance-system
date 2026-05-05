import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { apiRequest } from "../api.js";

export default function Engineer() {
    const [faultForm, setFaultForm] = useState({
        markerId: "marker-001",
        faultType: "Signal Failure",
        location: "Tunnel A",
        severity: "high",
        notes: ""
    });

    const [toolForm, setToolForm] = useState({
        taskName: "Rail Inspection",
        toolsChecked: [],
        missingTools: []
    });

    const [message, setMessage] = useState("");

    function updateFault(event) {
        setFaultForm({
            ...faultForm,
            [event.target.name]: event.target.value
        });
    }

    function toggleTool(toolName) {
        const checked = toolForm.toolsChecked.includes(toolName);

        setToolForm({
            ...toolForm,
            toolsChecked: checked
                ? toolForm.toolsChecked.filter((tool) => tool !== toolName)
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
            setFaultForm({ ...faultForm, notes: "" });
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

            setMessage("Tool check submitted successfully.");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main className="page">
            <Navbar title="Engineer Portal" />

            {message && <div className="notice">{message}</div>}

            <div className="grid two-column">
                <section className="card">
                    <p className="eyebrow">Fault Detection</p>
                    <h2>Report Detected Fault</h2>
                    <p className="muted">
                        This simulates an AR marker scan where the engineer identifies and annotates an invisible fault.
                    </p>

                    <form onSubmit={submitFault}>
                        <label>Marker ID</label>
                        <input name="markerId" value={faultForm.markerId} onChange={updateFault} />

                        <label>Fault Type</label>
                        <select name="faultType" value={faultForm.faultType} onChange={updateFault}>
                            <option>Signal Failure</option>
                            <option>Structural Crack</option>
                            <option>Electrical Issue</option>
                            <option>Equipment Degradation</option>
                        </select>

                        <label>Location</label>
                        <input name="location" value={faultForm.location} onChange={updateFault} />

                        <label>Severity</label>
                        <select name="severity" value={faultForm.severity} onChange={updateFault}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>

                        <label>Engineer Notes</label>
                        <textarea
                            name="notes"
                            value={faultForm.notes}
                            onChange={updateFault}
                            placeholder="Add inspection notes..."
                        />

                        <button type="submit">Submit Fault</button>
                    </form>
                </section>

                <section className="card">
                    <p className="eyebrow">Tool Accountability</p>
                    <h2>Maintenance Tool Check</h2>
                    <p className="muted">
                        Used to confirm that tools taken into a restricted maintenance area are accounted for.
                    </p>

                    <form onSubmit={submitToolCheck}>
                        <label>Task Name</label>
                        <input
                            value={toolForm.taskName}
                            onChange={(e) => setToolForm({ ...toolForm, taskName: e.target.value })}
                        />

                        {["Multimeter", "Spanner", "Screwdriver", "Inspection Torch"].map((tool) => (
                            <label className="checkbox-row" key={tool}>
                                <input
                                    type="checkbox"
                                    checked={toolForm.toolsChecked.includes(tool)}
                                    onChange={() => toggleTool(tool)}
                                />
                                {tool}
                            </label>
                        ))}

                        <button type="submit">Submit Tool Check</button>
                    </form>
                </section>
            </div>
        </main>
    );
}