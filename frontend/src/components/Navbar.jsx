import { getUser, logout } from "../api.js";

export default function Navbar({ title }) {
    const user = getUser();

    return (
        <div className="navbar">
            <div>
                <h1>{title}</h1>
                {user && (
                    <p>
                        Logged in as <strong>{user.username}</strong> ({user.role})
                    </p>
                )}
            </div>

            <button className="secondary-button" onClick={logout}>
                Logout
            </button>
        </div>
    );
}