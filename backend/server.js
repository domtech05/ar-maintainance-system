const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const bcrypt = require("bcryptjs");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.use(helmet());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: {
        ok: false,
        error: {
            type: "rate_limit",
            message: "Too many requests. Please try again later."
        }
    }
});

app.use("/api", apiLimiter);

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
        logEvent("security", "Unauthorised admin action attempted", req.user.username);

        return res.status(403).json({
            ok: false,
            error: {
                type: "forbidden",
                message: "Admin access required."
            }
        });
    }

    next();
}

app.get("/", (req, res) => {
    res.json({ message: "AR Maintenance Support System API is running" });
});

const failedLoginAttempts = {};

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (
        !username ||
        !password ||
        typeof username !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            message: "Username and password are required."
        });
    }

    const cleanUsername = username.trim().toLowerCase();

    failedLoginAttempts[cleanUsername] = failedLoginAttempts[cleanUsername] || {
        count: 0,
        lockedUntil: null
    };

    const attempt = failedLoginAttempts[cleanUsername];

    if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
        logEvent("security", "Blocked login attempt due to temporary lockout", cleanUsername);

        return res.status(429).json({
            message: "Too many failed login attempts. Please try again later."
        });
    }

    const users = readJson("users.json");
    const user = users.find((u) => u.username.toLowerCase() === cleanUsername);

    if (!user) {
        attempt.count += 1;

        if (attempt.count >= 5) {
            attempt.lockedUntil = Date.now() + 2 * 60 * 1000;
        }

        logEvent("security", "Failed login attempt - unknown username", cleanUsername);

        return res.status(401).json({
            message: "Invalid username or password."
        });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
        attempt.count += 1;

        if (attempt.count >= 5) {
            attempt.lockedUntil = Date.now() + 2 * 60 * 1000;
        }

        logEvent("security", "Failed login attempt - incorrect password", cleanUsername);

        return res.status(401).json({
            message: "Invalid username or password."
        });
    }

    failedLoginAttempts[cleanUsername] = {
        count: 0,
        lockedUntil: null
    };

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    logEvent("auth", "Successful login", user.username);

    res.json({
        message: "Login successful",
        token,
        user: {
            username: user.username,
            role: user.role
        }
    });
});

const faultValidation = [
    body("markerId")
        .trim()
        .isLength({ min: 3, max: 40 })
        .matches(/^[a-zA-Z0-9-_]+$/),

    body("faultType")
        .trim()
        .isIn([
            "Signal Failure",
            "Electrical Issue",
            "Structural Crack",
            "Equipment Degradation"
        ]),

    body("location")
        .trim()
        .isLength({ min: 2, max: 80 })
        .matches(/^[a-zA-Z0-9\s-_]+$/),

    body("severity")
        .isIn(["low", "medium", "high"]),

    body("notes")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 })
];

app.get("/api/users", authenticateToken, requireAdmin, (req, res) => {
    const users = readJson("users.json");

    const safeUsers = users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role
    }));

    res.json(safeUsers);
});

app.post("/api/faults", authenticateToken, faultValidation, (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        logEvent("security", "Blocked invalid fault submission", req.user.username);

        return res.status(422).json({
            ok: false,
            error: {
                type: "validation_error",
                message: "Invalid fault submission.",
                details: errors.array()
            }
        });
    }
    const faults = readJson("faults.json");
    res.json(faults);
});

app.post("/api/faults", authenticateToken, (req, res) => {
    const { markerId, faultType, location, severity, notes } = req.body;

    if (!markerId || !faultType || !location || !severity) {
        return res.status(400).json({ message: "Missing required fault fields." });
    }

    const faults = readJson("faults.json");
    faults.push(newFault);
    writeJson("faults.json", faults);

    logEvent("fault", `Fault reported: ${faultType}`, req.user.username);

    res.status(201).json(newFault);

    const newFault = {
        id: Date.now(),
        markerId,
        faultType,
        location,
        severity,
        notes,
        status: "open",
        assignedTo: null,
        adminNote: "",
        reportedBy: req.user.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    faults.push(newFault);
    writeJson("faults.json", faults);

    logEvent("fault", `New fault reported: ${faultType}`, req.user.username);

    res.status(201).json(newFault);
});

app.get("/api/faults", authenticateToken, (req, res) => {
    let faults = readJson("faults.json").map(normaliseFault);

    if (req.query.assignedTo === "me") {
        faults = faults.filter((fault) => fault.assignedTo === req.user.username);
    }

    if (req.query.status) {
        faults = faults.filter((fault) => fault.status === req.query.status);
    }

    res.json(faults);
});

app.get("/api/faults/:id", authenticateToken, (req, res) => {
    const faultId = Number(req.params.id);
    const faults = readJson("faults.json").map(normaliseFault);

    const fault = faults.find((fault) => fault.id === faultId);

    if (!fault) {
        return res.status(404).json({
            ok: false,
            error: {
                type: "not_found",
                message: "Fault not found."
            }
        });
    }

    res.json(fault);
});

app.patch("/api/faults/:id", authenticateToken, requireAdmin, (req, res) => {
    const faultId = Number(req.params.id);
    const { status, assignedTo, adminNote } = req.body;

    const allowedStatuses = [
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "closed"
    ];

    if (status && !allowedStatuses.includes(status)) {
        logEvent("security", "Blocked invalid fault status update", req.user.username);

        return res.status(422).json({
            ok: false,
            error: {
                type: "validation_error",
                message: "Invalid fault status."
            }
        });
    }

    const faults = readJson("faults.json").map(normaliseFault);
    const faultIndex = faults.findIndex((fault) => fault.id === faultId);

    if (faultIndex === -1) {
        return res.status(404).json({
            ok: false,
            error: {
                type: "not_found",
                message: "Fault not found."
            }
        });
    }

    const updatedFault = {
        ...faults[faultIndex],
        status: status || faults[faultIndex].status,
        assignedTo: assignedTo ?? faults[faultIndex].assignedTo,
        adminNote: adminNote ?? faults[faultIndex].adminNote,
        updatedAt: new Date().toISOString()
    };

    faults[faultIndex] = updatedFault;
    writeJson("faults.json", faults);

    logEvent(
        "ticket",
        `Fault ${faultId} updated to ${updatedFault.status}`,
        req.user.username
    );

    res.json(updatedFault);
});

app.patch("/api/faults/:id", authenticateToken, requireAdmin, (req, res) => {
    const faultId = Number(req.params.id);
    const { status, assignedTo, adminNote } = req.body;

    const allowedStatuses = [
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "closed"
    ];

    if (status && !allowedStatuses.includes(status)) {
        logEvent("security", "Blocked invalid fault status update", req.user.username);

        return res.status(422).json({
            ok: false,
            error: {
                type: "validation_error",
                message: "Invalid fault status."
            }
        });
    }

    const faults = readJson("faults.json");
    const faultIndex = faults.findIndex((fault) => fault.id === faultId);

    if (faultIndex === -1) {
        return res.status(404).json({
            ok: false,
            error: {
                type: "not_found",
                message: "Fault not found."
            }
        });
    }

    const updatedFault = {
        ...faults[faultIndex],
        status: status || faults[faultIndex].status,
        assignedTo: assignedTo ?? faults[faultIndex].assignedTo,
        adminNote: adminNote ?? faults[faultIndex].adminNote,
        updatedAt: new Date().toISOString()
    };

    faults[faultIndex] = updatedFault;
    writeJson("faults.json", faults);

    logEvent(
        "ticket",
        `Fault ${faultId} updated: ${updatedFault.status}`,
        req.user.username
    );

    res.json(updatedFault);
});

function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        logEvent("security", "Unauthorised admin action attempted", req.user.username);

        return res.status(403).json({
            ok: false,
            error: {
                type: "forbidden",
                message: "Admin access required."
            }
        });
    }

    next();
}

app.get("/api/users", authenticateToken, requireAdmin, (req, res) => {
    const users = readJson("users.json");

    const safeUsers = users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role
    }));

    res.json(safeUsers);
});

function normaliseFault(fault) {
    return {
        status: "open",
        assignedTo: null,
        adminNote: "",
        createdAt: fault.timestamp || new Date().toISOString(),
        updatedAt: fault.timestamp || new Date().toISOString(),
        ...fault
    };
}

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
    const faults = readJson("faults.json").map(normaliseFault);
    const toolChecks = readJson("tools.json");
    const logs = readJson("logs.json");

    res.json({
        summary: {
            openFaults: faults.filter((fault) => fault.status !== "closed").length,
            totalFaults: faults.length,
            toolChecks: toolChecks.length,
            securityEvents: logs.filter((log) => log.type === "security").length
        },
        statusCounts: {
            open: faults.filter((fault) => fault.status === "open").length,
            assigned: faults.filter((fault) => fault.status === "assigned").length,
            in_progress: faults.filter((fault) => fault.status === "in_progress").length,
            resolved: faults.filter((fault) => fault.status === "resolved").length,
            closed: faults.filter((fault) => fault.status === "closed").length
        },
        severityCounts: {
            low: faults.filter((fault) => fault.severity === "low").length,
            medium: faults.filter((fault) => fault.severity === "medium").length,
            high: faults.filter((fault) => fault.severity === "high").length
        },
        recentFaults: faults.slice(-5).reverse(),
        recentToolChecks: toolChecks.slice(-5).reverse(),
        recentLogs: logs.slice(-8).reverse()
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});