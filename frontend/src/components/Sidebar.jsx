import { NavLink } from "react-router-dom";
import { getUser, logout } from "../api.js";

export default function Sidebar() {
    const user = getUser();
    const isAdmin = user?.role === "admin";

    return (
        <aside className="sidebar">
            <div>
                <div className="brand">
                    <span className="brand-mark">AR</span>
                    <div>
                        <strong>MaintSec</strong>
                        <small>Secure AR Ops</small>
                    </div>
                </div>

                <nav className="side-nav">
                    <NavLink to="/engineer/faults">Fault Reporting</NavLink>
                    <NavLink to="/engineer/tools">Tool Check</NavLink>

                    {isAdmin && (
                        <>
                            <NavLink to="/dashboard">Dashboard</NavLink>
                            <NavLink to="/security">Security Logs</NavLink>
                        </>
                    )}
                </nav>
            </div>

            <div className="sidebar-footer">
                <small>{user?.username}</small>
                <small>{user?.role}</small>
                <button onClick={logout}>Logout</button>
            </div>
        </aside>
    );
}