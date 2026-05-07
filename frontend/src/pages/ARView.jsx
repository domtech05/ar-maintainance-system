import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api.js";

export default function ARView() {
    const videoRef = useRef(null);

    const [fault, setFault] = useState(null);
    const [status, setStatus] = useState("Starting camera...");
    const [cameraActive, setCameraActive] = useState(false);
    const [markerDetected, setMarkerDetected] = useState(false);

    useEffect(() => {
        async function loadFaults() {
            try {
                const faults = await apiRequest("/api/faults");
                const openFault = faults.find((f) => f.status === "open") || faults[0];

                if (openFault) {
                    setFault(openFault);
                } else {
                    setStatus("No fault data available. Submit a fault first.");
                }
            } catch (err) {
                setStatus(err.message);
            }
        }

        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment"
                    },
                    audio: false
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                setCameraActive(true);
                setStatus("Camera active. Scan marker or simulate detection.");
            } catch (err) {
                setCameraActive(false);
                setStatus("Camera unavailable or permission denied.");
            }
        }

        loadFaults();
        startCamera();

        return () => {
            const stream = videoRef.current?.srcObject;

            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    function simulateMarkerDetection() {
        setMarkerDetected(true);
        setStatus("Marker detected. Fault overlay active.");
    }

    function clearMarker() {
        setMarkerDetected(false);
        setStatus("Marker lost. Re-align camera with marker.");
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <p className="eyebrow">AR Fault View</p>
                    <h1>Camera-Based Fault Overlay</h1>
                    <p className="muted">
                        Simulated AR view using live camera feed and backend fault data.
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
                        <p className="muted">No fault loaded.</p>
                    )}

                    <div className="ar-controls">
                        <button onClick={simulateMarkerDetection}>
                            Simulate Marker Detection
                        </button>

                        <button className="secondary-action" onClick={clearMarker}>
                            Clear Marker
                        </button>
                    </div>
                </div>

                <div className="camera-stage">
                    {!cameraActive && (
                        <div className="camera-fallback">
                            <h2>Camera Unavailable</h2>
                            <p>{status}</p>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="camera-feed"
                    />

                    <div className="scan-frame">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    {markerDetected && fault && (
                        <div className={`ar-overlay severity-${fault.severity}`}>
                            <p className="overlay-label">Detected Fault</p>
                            <h2>{fault.faultType}</h2>
                            <p><strong>Location:</strong> {fault.location}</p>
                            <p><strong>Severity:</strong> {fault.severity}</p>
                            <p><strong>Marker:</strong> {fault.markerId}</p>
                            <p>{fault.notes || "No engineer notes provided."}</p>
                        </div>
                    )}

                    <div className="camera-hud">
                        <span>{cameraActive ? "CAMERA ONLINE" : "CAMERA OFFLINE"}</span>
                        <span>{markerDetected ? "MARKER LOCKED" : "SCANNING"}</span>
                    </div>
                </div>
            </section>
        </>
    );
}