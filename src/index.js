// Backend Server for AO Process Builder
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Import routes
const automationRoutes = require("./routes/automationRoutes");
const aoRoutes = require("./routes/aoRoutes");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../../frontend/build")));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use("/api/automations", automationRoutes);
app.use("/api", aoRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve React app for any other routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: true,
        message: err.message || "An unexpected error occurred",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`AO Process Builder API running on port ${PORT}`);
});
