# Berry Analytics Backend API

Express.js REST API for Firebase Analytics and BigQuery integration. This backend provides analytics data endpoints that can be consumed by multiple client applications.

## 🚀 Features

- **RESTful API** - Clean, standard REST endpoints
- **BigQuery Integration** - Direct queries to Firebase Analytics BigQuery export
- **Multi-Client Support** - CORS enabled for multiple frontend applications
- **Error Handling** - Comprehensive error handling and logging
- **Security** - Helmet.js for security headers
- **Scalable** - Separate backend for easy horizontal scaling

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin SDK initialization
│   ├── services/
│   │   └── bigQueryService.js   # BigQuery queries and logic
│   ├── routes/
│   │   └── analytics.js         # API routes
│   ├── middleware/
│   │   └── errorHandler.js      # Error handling middleware
│   └── index.js                 # Express app entry point
├── .env                         # Environment variables
├── .env.example                 # Environment variables template
├── package.json
└── README.md
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (comma-separated origins)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"

# BigQuery Configuration
BIGQUERY_PROJECT_ID=your-project-id
BIGQUERY_DATASET_ID=analytics_XXXXXXXXX
```

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📡 API Endpoints

### Health Check

```http
GET /api/analytics/health
```

**Response:**

```json
{
  "success": true,
  "message": "Analytics API is healthy",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "uptime": 123.456
}
```

### Month-over-Month Growth

```http
GET /api/analytics/mom?months=6
```

**Query Parameters:**

- `months` (optional): Number of months to analyze (default: 6)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2025-11",
      "active_users": 1250,
      "previous_month_users": 1100,
      "growth_percentage": "13.64"
    }
  ],
  "metadata": {
    "months_analyzed": 6,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

### Churn Rate

```http
GET /api/analytics/churn?months=6
```

**Query Parameters:**

- `months` (optional): Number of months to analyze (default: 6)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2025-11",
      "active_users": 1250,
      "churned_users": 150,
      "churn_rate": "12.00"
    }
  ],
  "metadata": {
    "months_analyzed": 6,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

### Event Metrics

```http
GET /api/analytics/events?days=30&events=screen_view,button_click
```

**Query Parameters:**

- `days` (optional): Number of days to analyze (default: 30)
- `events` (optional): Comma-separated event names to filter

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "event_name": "screen_view",
      "event_count": 5420,
      "unique_users": 1250
    }
  ],
  "metadata": {
    "days_analyzed": 30,
    "filtered_events": ["screen_view", "button_click"],
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

### Daily Active Users

```http
GET /api/analytics/dau?days=30
```

**Query Parameters:**

- `days` (optional): Number of days to analyze (default: 30)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-12",
      "active_users": 450
    }
  ],
  "metadata": {
    "days_analyzed": 30,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

### User Cohorts

```http
GET /api/analytics/cohorts?months=3
```

**Query Parameters:**

- `months` (optional): Number of months to analyze (default: 3)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "cohort_month": "2025-09",
      "cohort_size": 500,
      "activity_month": "2025-11",
      "active_users": 350,
      "retention_rate": "70.00"
    }
  ],
  "metadata": {
    "months_analyzed": 3,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

## 🔒 Security

### CORS Configuration

Configure allowed origins in `.env`:

```bash
# Allow specific origins
CORS_ORIGIN=http://localhost:3000,https://your-production-domain.com

# Allow all origins (not recommended for production)
CORS_ORIGIN=*
```

### API Keys (Optional)

To add API key authentication, create middleware:

```javascript
// src/middleware/auth.js
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid API key",
    });
  }

  next();
};

module.exports = { authenticateApiKey };
```

Then apply to routes:

```javascript
const { authenticateApiKey } = require("../middleware/auth");
router.use(authenticateApiKey);
```

## 🐛 Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": "Detailed error information"
}
```

Common error codes:

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication failed)
- `403` - Forbidden (permission denied)
- `404` - Not Found (table/dataset not found)
- `500` - Internal Server Error

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/api/analytics/health

# Get MoM metrics
curl http://localhost:5000/api/analytics/mom?months=6

# Get events with filter
curl "http://localhost:5000/api/analytics/events?days=30&events=screen_view,button_click"
```

### Using Postman

Import the following collection:

```json
{
  "info": {
    "name": "Berry Analytics API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get MoM Metrics",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/analytics/mom?months=6"
      }
    }
  ]
}
```

## 🚀 Deployment

### Deploying to Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create berry-analytics-api

# Set environment variables
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
heroku config:set FIREBASE_PRIVATE_KEY="your-private-key"
heroku config:set BIGQUERY_PROJECT_ID=your-project-id
heroku config:set BIGQUERY_DATASET_ID=analytics_XXXXXXXXX
heroku config:set CORS_ORIGIN=https://your-frontend.com

# Deploy
git push heroku master
```

### Deploying to Google Cloud Run

```bash
# Build and deploy
gcloud run deploy berry-analytics-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Deploying to Railway

1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

## 📊 Client Integration

### Next.js Example

```javascript
// lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function getMoMMetrics(months = 6) {
  const response = await fetch(`${API_URL}/api/analytics/mom?months=${months}`);
  return response.json();
}
```

### React Example

```javascript
// hooks/useAnalytics.js
import { useState, useEffect } from "react";

export function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/analytics/mom?months=6")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

### Mobile App Example (React Native)

```javascript
// services/analyticsAPI.js
const API_URL = "https://your-api-domain.com";

export const getAnalytics = async () => {
  try {
    const response = await fetch(`${API_URL}/api/analytics/mom?months=6`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Analytics API Error:", error);
    throw error;
  }
};
```

## 🔍 Monitoring & Logging

The backend logs all requests automatically:

```
GET /api/analytics/mom - 200 - 245ms
POST /api/analytics/churn - 200 - 189ms
```

For production, consider adding:

- **Winston** for advanced logging
- **Sentry** for error tracking
- **NewRelic** or **Datadog** for performance monitoring

## 🛠️ Development

### Adding New Endpoints

1. Create service function in `src/services/bigQueryService.js`:

```javascript
async function getCustomMetric() {
  const query = `SELECT * FROM ...`;
  const [rows] = await bigquery.query({ query });
  return rows;
}

module.exports = { getCustomMetric };
```

2. Add route in `src/routes/analytics.js`:

```javascript
router.get("/custom", async (req, res, next) => {
  try {
    const data = await getCustomMetric();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please submit a pull request.

---

**Questions?** Check the main project [SETUP_GUIDE.md](../SETUP_GUIDE.md) for more information.
