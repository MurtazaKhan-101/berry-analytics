require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import routes
const analyticsRoutes = require("./routes/analytics");

// Import middleware
const {
  errorHandler,
  notFoundHandler,
  requestLogger,
} = require("./middleware/errorHandler");

// Import config (to initialize Firebase)
require("./config/firebase");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(morgan("dev")); // HTTP request logging
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", // Configure allowed origins
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Berry Analytics Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/analytics/health",
      mom: "/api/analytics/mom?months=6",
      churn: "/api/analytics/churn?months=6",
      events: "/api/analytics/events?days=30",
      dau: "/api/analytics/dau?days=30",
      cohorts: "/api/analytics/cohorts?months=3",
    },
  });
});

// API Routes
app.use("/api/analytics", analyticsRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("");
  console.log("🚀 ================================== 🚀");
  console.log(`✅ Berry Analytics Backend running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📊 BigQuery Project: ${
      process.env.BIGQUERY_PROJECT_ID || "Not configured"
    }`
  );
  console.log(
    `📦 Dataset: ${process.env.BIGQUERY_DATASET_ID || "Not configured"}`
  );
  console.log("🚀 ================================== 🚀");
  console.log("");
  console.log("Available endpoints:");
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/health`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/mom`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/churn`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/events`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/dau`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/cohorts`);
  console.log("");
});

module.exports = app;
