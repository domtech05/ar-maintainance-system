import { useState } from "react";
import { apiRequest } from "../api.js";

export default function Tools() {
    const [toolForm, setToolForm] = useState({
        taskName: "Rail Inspection",
        toolsChecked: []
    });

    const [message, setMessage] = useState("");

    function toggleTool(toolName) {
        const exists = toolForm.toolsChecked.includes(toolName);

        setToolForm({
            ...toolForm,
            toolsChecked: exists
                ? toolForm.toolsChecked.filter((tool) => tool !== toolName)
                : [...toolForm.toolsChecked, toolName]
        });
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
        <>
            <header className="page-header">
                <div>
                    <p className="eyebrow">Tool Accountability</p>
                    <h1>Tool Check</h1>
                    <p className="muted">
                        Confirm tools entering and leaving restricted maintenance areas.
                    </p>
                </div>
            </header>

            {message && <div className="notice">{message}</div>}

            <section className="panel narrow-panel">
                <form onSubmit={submitToolCheck}>
                    <label>Task Name</label>
                    <input
                        value={toolForm.taskName}
                        onChange={(e) =>
                            setToolForm({ ...toolForm, taskName: e.target.value })
                        }
                    />

                    <div className="tool-list">
                        {["Multimeter", "Spanner", "Screwdriver", "Inspection Torch"].map((tool) => (
                            <label className="tool-row" key={tool}>
                                <input
                                    type="checkbox"
                                    checked={toolForm.toolsChecked.includes(tool)}
                                    onChange={() => toggleTool(tool)}
                                />
                                <span>{tool}</span>
                            </label>
                        ))}
                    </div>

                    <button type="submit">Submit Tool Check</button>
                </form>
            </section>
        </>
    );
}