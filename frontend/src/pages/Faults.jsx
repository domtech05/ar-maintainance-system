import { useState } from "react";
import { apiRequest } from "../api.js";

export default function Faults() {
    const [faultForm, setFaultForm] = useState({
        markerId: "marker-001",
        faultType: "Signal Failure",
        location: "Tunnel A",
        severity: "high",
        notes: ""
    });

    const [message, setMessage] = useState("");

    function updateFault(event) {
        setFaultForm({
            ...faultForm,
            [event.target.name]: event.target.value
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

    return (
        <>
            <header className="page-header">
                <div>
                    <p className="eyebrow">Fault Detection</p>
                    <h1>Fault Reporting</h1>
                    <p className="muted">
                        Record faults identified during AR-assisted maintenance inspection.
                    </p>
                </div>
            </header>

            {message && <div className="notice">{message}</div>}

            <section className="panel">
                <form className="form-grid" onSubmit={submitFault}>
                    <div>
                        <label>Marker ID</label>
                        <input name="markerId" value={faultForm.markerId} onChange={updateFault} />
                    </div>

                    <div>
                        <label>Fault Type</label>
                        <select name="faultType" value={faultForm.faultType} onChange={updateFault}>
                            <option>Signal Failure</option>
                            <option>Electrical Issue</option>
                            <option>Structural Crack</option>
                            <option>Equipment Degradation</option>
                        </select>
                    </div>

                    <div>
                        <label>Location</label>
                        <input name="location" value={faultForm.location} onChange={updateFault} />
                    </div>

                    <div>
                        <label>Severity</label>
                        <select name="severity" value={faultForm.severity} onChange={updateFault}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div className="span-2">
                        <label>Engineer Notes</label>
                        <textarea
                            name="notes"
                            value={faultForm.notes}
                            onChange={updateFault}
                            placeholder="Describe the detected issue..."
                        />
                    </div>

                    <div className="span-2">
                        <button type="submit">Submit Fault Report</button>
                    </div>
                </form>
            </section>
        </>
    );
}