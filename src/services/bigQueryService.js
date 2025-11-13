require("dotenv").config();
const { BigQuery } = require("@google-cloud/bigquery");

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const datasetId = process.env.BIGQUERY_DATASET_ID;

/**
 * Query to get Monthly Active Users (MAU) for MoM calculations
 */
async function getMonthlyActiveUsers(months = 6) {
  const query = `
    SELECT 
      FORMAT_DATE('%Y-%m', PARSE_DATE('%Y%m%d', event_date)) AS month,
      COUNT(DISTINCT user_pseudo_id) AS active_users
    FROM 
      \`${process.env.BIGQUERY_PROJECT_ID}.${datasetId}.events_*\`
    WHERE 
      _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${months} MONTH))
      AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    GROUP BY 
      month
    ORDER BY 
      month DESC
  `;

  try {
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (error) {
    console.error("Error fetching monthly active users:", error);
    throw error;
  }
}

/**
 * Calculate Month-over-Month growth metrics
 */
async function calculateMoMMetrics(months = 6) {
  try {
    const monthlyData = await getMonthlyActiveUsers(months);

    const metrics = monthlyData.map((current, index) => {
      if (index < monthlyData.length - 1) {
        const previous = monthlyData[index + 1];
        const growth =
          ((current.active_users - previous.active_users) /
            previous.active_users) *
          100;

        return {
          month: current.month,
          active_users: current.active_users,
          previous_month_users: previous.active_users,
          growth_percentage: growth.toFixed(2),
        };
      }

      return {
        month: current.month,
        active_users: current.active_users,
        previous_month_users: null,
        growth_percentage: null,
      };
    });

    return metrics;
  } catch (error) {
    console.error("Error calculating MoM metrics:", error);
    throw error;
  }
}

/**
 * Query to get user cohorts for churn analysis
 */
async function getUserCohorts(months = 3) {
  const query = `
    WITH first_activity AS (
      SELECT 
        user_pseudo_id,
        MIN(PARSE_DATE('%Y%m%d', event_date)) AS first_seen_date
      FROM 
        \`${process.env.BIGQUERY_PROJECT_ID}.${datasetId}.events_*\`
      WHERE 
        _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH))
        AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
      GROUP BY 
        user_pseudo_id
    ),
    monthly_cohorts AS (
      SELECT 
        FORMAT_DATE('%Y-%m', first_seen_date) AS cohort_month,
        COUNT(DISTINCT user_pseudo_id) AS cohort_size
      FROM 
        first_activity
      WHERE
        first_seen_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${months} MONTH)
      GROUP BY 
        cohort_month
    ),
    active_users_per_month AS (
      SELECT 
        FORMAT_DATE('%Y-%m', fa.first_seen_date) AS cohort_month,
        FORMAT_DATE('%Y-%m', PARSE_DATE('%Y%m%d', e.event_date)) AS activity_month,
        COUNT(DISTINCT e.user_pseudo_id) AS active_users
      FROM 
        \`${process.env.BIGQUERY_PROJECT_ID}.${datasetId}.events_*\` e
      JOIN 
        first_activity fa ON e.user_pseudo_id = fa.user_pseudo_id
      WHERE 
        _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH))
        AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
        AND fa.first_seen_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${months} MONTH)
      GROUP BY 
        cohort_month, activity_month
    )
    SELECT 
      mc.cohort_month,
      mc.cohort_size,
      apm.activity_month,
      apm.active_users,
      ROUND((apm.active_users / mc.cohort_size) * 100, 2) AS retention_rate
    FROM 
      monthly_cohorts mc
    JOIN 
      active_users_per_month apm ON mc.cohort_month = apm.cohort_month
    ORDER BY 
      mc.cohort_month DESC, apm.activity_month ASC
  `;

  try {
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (error) {
    console.error("Error fetching user cohorts:", error);
    throw error;
  }
}

/**
 * Calculate churn rate for each month
 */
async function calculateChurnRate(months = 6) {
  const query = `
    WITH monthly_users AS (
      SELECT 
        FORMAT_DATE('%Y-%m', PARSE_DATE('%Y%m%d', event_date)) AS month,
        user_pseudo_id
      FROM 
        \`${process.env.BIGQUERY_PROJECT_ID}.${datasetId}.events_*\`
      WHERE 
        _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${
          months + 1
        } MONTH))
        AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
      GROUP BY 
        month, user_pseudo_id
    ),
    user_activity AS (
      SELECT 
        month,
        user_pseudo_id,
        LEAD(month) OVER (PARTITION BY user_pseudo_id ORDER BY month) AS next_month
      FROM 
        monthly_users
    ),
    churn_calculation AS (
      SELECT 
        month,
        COUNT(DISTINCT user_pseudo_id) AS active_users,
        COUNT(DISTINCT CASE 
          WHEN next_month IS NULL OR 
               DATE_DIFF(PARSE_DATE('%Y-%m', next_month), PARSE_DATE('%Y-%m', month), MONTH) > 1 
          THEN user_pseudo_id 
        END) AS churned_users
      FROM 
        user_activity
      WHERE 
        month >= FORMAT_DATE('%Y-%m', DATE_SUB(CURRENT_DATE(), INTERVAL ${months} MONTH))
      GROUP BY 
        month
    )
    SELECT 
      month,
      active_users,
      churned_users,
      ROUND((churned_users / active_users) * 100, 2) AS churn_rate
    FROM 
      churn_calculation
    ORDER BY 
      month DESC
  `;

  try {
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (error) {
    console.error("Error calculating churn rate:", error);
    throw error;
  }
}

/**
 * Get key event metrics
 */
async function getEventMetrics(eventNames = [], days = 30) {
  const eventFilter =
    eventNames.length > 0
      ? `AND event_name IN (${eventNames.map((e) => `'${e}'`).join(",")})`
      : "";

  const query = `
    SELECT 
      event_name,
      COUNT(*) AS event_count,
      COUNT(DISTINCT user_pseudo_id) AS unique_users
    FROM 
      \`${process.env.BIGQUERY_PROJECT_ID}.${datasetId}.events_*\`
    WHERE 
      _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
      ${eventFilter}
    GROUP BY 
      event_name
    ORDER BY 
      event_count DESC
    LIMIT 20
  `;

  try {
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (error) {
    console.error("Error fetching event metrics:", error);
    throw error;
  }
}

/**
 * Get daily active users trend
 */
async function getDailyActiveUsers(days = 30) {
  const query = `
    SELECT 
      PARSE_DATE('%Y%m%d', event_date) AS date,
      COUNT(DISTINCT user_pseudo_id) AS active_users
    FROM 
      \`${process.env.BIGQUERY_PROJECT_ID}.${datasetId}.events_*\`
    WHERE 
      _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    GROUP BY 
      date
    ORDER BY 
      date DESC
  `;

  try {
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (error) {
    console.error("Error fetching daily active users:", error);
    throw error;
  }
}

module.exports = {
  bigquery,
  getMonthlyActiveUsers,
  calculateMoMMetrics,
  getUserCohorts,
  calculateChurnRate,
  getEventMetrics,
  getDailyActiveUsers,
};
