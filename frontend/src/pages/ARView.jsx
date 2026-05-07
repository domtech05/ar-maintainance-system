import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

export default function ARView() {
    const [fault, setFault] = useState(null);
    const [status, setStatus] = useState("Loading fault data...");
    const [fallback, setFallback] = useState(false);

    useEffect(() => {
        async function loadFaults() {
            try {
                const faults = await apiRequest("/api/faults");
                const openFault = faults.find((f) => f.status === "open") || faults[0];

                if (openFault) {
                    setFault(openFault);
                    setStatus("Point camera at Hiro marker to view fault overlay.");
                } else {
                    setStatus("No fault data available. Submit a fault first.");
                }
            } catch (err) {
                setStatus(err.message);
            }
        }

        function checkCamera() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setFallback(true);
                setStatus("Camera access is not supported by this browser.");
                return;
            }

            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    stream.getTracks().forEach((track) => track.stop());
                })
                .catch(() => {
                    setFallback(true);
                    setStatus("Camera permission was denied or unavailable.");
                });
        }

        loadFaults();
        checkCamera();
    }, []);

    useEffect(() => {
        const marker = document.querySelector("#faultMarker");

        if (!marker) return;

        function foundMarker() {
            setStatus("Marker detected. Fault overlay active.");
        }

        function lostMarker() {
            setStatus("Marker lost. Re-align camera with marker.");
        }

        marker.addEventListener("markerFound", foundMarker);
        marker.addEventListener("markerLost", lostMarker);

        return () => {
            marker.removeEventListener("markerFound", foundMarker);
            marker.removeEventListener("markerLost", lostMarker);
        };
    }, [fault]);

    if (fallback) {
        return (
            <>
                <header className="page-header">
                    <div>
                        <p className="eyebrow">AR Fault View</p>
                        <h1>Fallback Mode</h1>
                        <p className="muted">{status}</p>
                    </div>
                </header>

                <section className="panel narrow-panel">
                    <h2>Fault Data</h2>

                    {fault ? (
                        <>
                            <p><strong>Fault:</strong> {fault.faultType}</p>
                            <p><strong>Location:</strong> {fault.location}</p>
                            <p><strong>Severity:</strong> {fault.severity}</p>
                            <p><strong>Marker:</strong> {fault.markerId}</p>
                            <p><strong>Notes:</strong> {fault.notes || "No notes provided."}</p>
                        </>
                    ) : (
                        <p>No fault data available.</p>
                    )}
                </section>
            </>
        );
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <p className="eyebrow">AR Fault View</p>
                    <h1>Marker-Based Fault Overlay</h1>
                    <p className="muted">
                        Uses marker-based WebAR to visualise live fault data from the backend.
                    </p>
                </div>
            </header>

            <section className="ar-layout">
                <div className="ar-panel">
                    <h2>AR Status</h2>
                    <p>{status}</p>

                    {fault ? (
                        <div className="fault-summary">
                            <p><strong>Fault:</strong> {fault.faultType}</p>
                            <p><strong>Location:</strong> {fault.location}</p>
                            <p><strong>Severity:</strong> {fault.severity}</p>
                            <p><strong>Marker:</strong> {fault.markerId}</p>
                        </div>
                    ) : (
                        <p className="muted">Submit a fault first to populate the AR overlay.</p>
                    )}

                    <p className="muted">
                        Print or display a Hiro marker, then point the camera at it.
                    </p>
                </div>

                <div className="ar-stage">
                    <a-scene
                        embedded
                        arjs="sourceType: webcam; debugUIEnabled: false;"
                        vr-mode-ui="enabled: false"
                        renderer="logarithmicDepthBuffer: true;"
                    >
                        <a-marker preset="hiro" id="faultMarker">
                            <a-box
                                position="0 0.5 0"
                                scale="0.8 0.8 0.8"
                                color={fault?.severity === "high" ? "#dc2626" : "#2563eb"}
                                opacity="0.9"
                            ></a-box>

                            <a-text
                                value={fault ? `${fault.faultType}\n${fault.location}\n${fault.severity}` : "No Fault Data"}
                                position="0 1.4 0"
                                align="center"
                                color="#ffffff"
                                scale="1.3 1.3 1.3"
                            ></a-text>
                        </a-marker>

                        <a-entity camera></a-entity>
                    </a-scene>
                </div>
            </section>
        </>
    );
}