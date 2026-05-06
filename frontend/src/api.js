const API_BASE = "http://localhost:3000";

export function getToken() {
    return localStorage.getItem("token");
}

export function getUser() {
    return JSON.parse(localStorage.getItem("user") || "null");
}

export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
}

export async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}