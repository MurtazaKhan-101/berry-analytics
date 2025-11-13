const express = require("express");
const router = express.Router();
const {
  calculateMoMMetrics,
  calculateChurnRate,
  getEventMetrics,
  getDailyActiveUsers,
  getUserCohorts,
} = require("../services/bigQueryService");

/**
 * @route   GET /api/analytics/mom
 * @desc    Get Month-over-Month growth metrics
 * @access  Public
 * @query   months - Number of months to analyze (default: 6)
 */
router.get("/mom", async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const metrics = await calculateMoMMetrics(months);

    res.json({
      success: true,
      data: metrics,
      metadata: {
        months_analyzed: months,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/churn
 * @desc    Get churn rate data
 * @access  Public
 * @query   months - Number of months to analyze (default: 6)
 */
router.get("/churn", async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const churnData = await calculateChurnRate(months);

    res.json({
      success: true,
      data: churnData,
      metadata: {
        months_analyzed: months,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/events
 * @desc    Get event metrics
 * @access  Public
 * @query   days - Number of days to analyze (default: 30)
 * @query   events - Comma-separated list of event names to filter
 */
router.get("/events", async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const events = req.query.events
      ? req.query.events.split(",").filter(Boolean)
      : [];

    const eventData = await getEventMetrics(events, days);

    res.json({
      success: true,
      data: eventData,
      metadata: {
        days_analyzed: days,
        filtered_events: events.length > 0 ? events : "all",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/dau
 * @desc    Get Daily Active Users
 * @access  Public
 * @query   days - Number of days to analyze (default: 30)
 */
router.get("/dau", async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dauData = await getDailyActiveUsers(days);

    res.json({
      success: true,
      data: dauData,
      metadata: {
        days_analyzed: days,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/cohorts
 * @desc    Get user cohort retention data
 * @access  Public
 * @query   months - Number of months to analyze (default: 3)
 */
router.get("/cohorts", async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 3;
    const cohortData = await getUserCohorts(months);

    res.json({
      success: true,
      data: cohortData,
      metadata: {
        months_analyzed: months,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Analytics API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
