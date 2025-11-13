/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // BigQuery specific errors
  if (err.message?.includes("Not found: Table")) {
    return res.status(404).json({
      success: false,
      error:
        "BigQuery table not found. Please ensure BigQuery export is enabled and data exists.",
      details: err.message,
    });
  }

  if (err.message?.includes("Permission denied")) {
    return res.status(403).json({
      success: false,
      error: "Permission denied. Check service account permissions.",
      details: err.message,
    });
  }

  // Firebase errors
  if (err.message?.includes("Firebase")) {
    return res.status(401).json({
      success: false,
      error: "Firebase authentication error",
      details: err.message,
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
};
