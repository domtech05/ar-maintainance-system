const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const JWT_SECRET = "dev-secret-key-change-in-production";

app.use(cors());
app.use(express.json());

const dataPath = (filename) => path.join(__dirname, "data", filename);

function readJson(filename) {
    return JSON.parse(fs.readFileSync(dataPath(filename), "utf8"));
}

function writeJson(filename, data) {
    fs.writeFileSync(dataPath(filename), JSON.stringify(data, null, 2));
}

function logEvent(type, message, username = "unknown") {
    const logs = readJson("logs.json");

    logs.push({
        id: Date.now(),
        type,
        message,
        username,
        timestamp: new Date().toISOString()
    });

    writeJson("logs.json", logs);
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." });
        }

        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required." });
    }

    next();
}

app.get("/", (req, res) => {
    res.json({ message: "AR Maintenance Support System API is running" });
});

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const users = readJson("users.json");

    const user = users.find(
        (u) => u.username === username && u.password === password
    );

    if (!user) {
        logEvent("security", "Failed login attempt", username);
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: "2h" }
    );

    logEvent("auth", "Successful login", username);

    res.json({
        message: "Login successful",
        token,
        user: {
            username: user.username,
            role: user.role
        }
    });
});

app.get("/api/faults", authenticateToken, (req, res) => {
    const faults = readJson("faults.json");
    res.json(faults);
});

app.post("/api/faults", authenticateToken, (req, res) => {
    const { markerId, faultType, location, severity, notes } = req.body;

    if (!markerId || !faultType || !location || !severity) {
        return res.status(400).json({ message: "Missing required fault fields." });
    }

    const faults = readJson("faults.json");

    const newFault = {
        id: Date.now(),
        markerId,
        faultType,
        location,
        severity,
        notes: notes || "",
        status: "open",
        reportedBy: req.user.username,
        timestamp: new Date().toISOString()
    };

    faults.push(newFault);
    writeJson("faults.json", faults);

    logEvent("fault", `New fault reported: ${faultType}`, req.user.username);

    res.status(201).json(newFault);
});

app.post("/api/tools", authenticateToken, (req, res) => {
    const { taskName, toolsChecked, missingTools } = req.body;

    if (!taskName || !Array.isArray(toolsChecked)) {
        return res.status(400).json({ message: "Invalid tool check data." });
    }

    const tools = readJson("tools.json");

    const toolCheck = {
        id: Date.now(),
        taskName,
        toolsChecked,
        missingTools: missingTools || [],
        checkedBy: req.user.username,
        timestamp: new Date().toISOString()
    };

    tools.push(toolCheck);
    writeJson("tools.json", tools);

    logEvent("tool-check", `Tool check completed for: ${taskName}`, req.user.username);

    res.status(201).json(toolCheck);
});

app.get("/api/dashboard", authenticateToken, requireAdmin, (req, res) => {
    const faults = readJson("faults.json");
    const tools = readJson("tools.json");
    const logs = readJson("logs.json");

    res.json({
        summary: {
            openFaults: faults.filter((fault) => fault.status === "open").length,
            totalFaults: faults.length,
            toolChecks: tools.length,
            securityEvents: logs.filter((log) => log.type === "security").length
        },
        recentFaults: faults.slice(-5).reverse(),
        recentToolChecks: tools.slice(-5).reverse(),
        recentLogs: logs.slice(-10).reverse()
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});