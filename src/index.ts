// Backend Server for AO Process Builder
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Import routes
import automationRoutes from "./routes/automationRoutes";
import aoRoutes from "./routes/aoRoutes";
import telegramRoutes from "./routes/telegramRoutes";
import tokenPriceRoutes from "./routes/tokenPriceRoutes";
import { ErrorResponse, HealthResponse } from "./types";
import telegramBotService from "./services/telegramBotService";

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "../../frontend/build")));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/automations", automationRoutes);
app.use("/api", aoRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/token-price", tokenPriceRoutes);

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  const healthResponse: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
  res.json(healthResponse);
});

// Serve React app for any other routes
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);

  const errorResponse: ErrorResponse = {
    error: true,
    message: err.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  };

  res.status(500).json(errorResponse);
});

// Initialize the Telegram bot on startup if token is available
if (process.env.TELEGRAM_BOT_TOKEN) {
  // Use an async IIFE to properly await initialization
  (async () => {
    try {
      const initialized = await telegramBotService.initialize();
      if (initialized) {
        console.log('Telegram bot successfully initialized on startup');
      } else {
        console.error('Failed to initialize Telegram bot on startup');
      }
    } catch (error) {
      console.error('Error initializing Telegram bot on startup:', error);
    }
  })();
}

// Start the server
app.listen(PORT, () => {
  console.log(`AO Process Builder API running on port ${PORT}`);
});

export default app;
