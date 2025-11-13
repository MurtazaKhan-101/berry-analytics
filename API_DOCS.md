# Berry Analytics API Documentation

**Base URL:** `http://localhost:5000` (Development)  
**Production URL:** `https://your-api-domain.com`

**Version:** 1.0.0  
**Last Updated:** November 12, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Month-over-Month Metrics](#month-over-month-metrics)
   - [Churn Rate](#churn-rate)
   - [Event Metrics](#event-metrics)
   - [Daily Active Users](#daily-active-users)
   - [User Cohorts](#user-cohorts)
7. [Code Examples](#code-examples)
8. [Postman Collection](#postman-collection)

---

## Overview

The Berry Analytics API provides access to Firebase Analytics data through BigQuery. This RESTful API allows you to query user engagement metrics, churn rates, event analytics, and cohort analysis.

### Base Information

- **Protocol:** HTTPS (Production) / HTTP (Development)
- **Data Format:** JSON
- **Character Encoding:** UTF-8
- **CORS:** Enabled for configured origins

---

## Authentication

### Current Version (Open)

Currently, no authentication is required. The API is open for development purposes.

### Future Versions (Recommended)

For production use, implement API key authentication:

**Header:**

```
X-API-Key: your-api-key-here
```

**Example:**

```bash
curl -H "X-API-Key: your-api-key" http://localhost:5000/api/analytics/mom
```

---

## Response Format

All API responses follow this standard format:

### Success Response

```json
{
  "success": true,
  "data": [
    /* array of results */
  ],
  "metadata": {
    "timestamp": "2025-11-12T10:30:00.000Z",
    "months_analyzed": 6,
    "days_analyzed": 30
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here",
  "details": "Detailed error information"
}
```

---

## Error Handling

### HTTP Status Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `200` | Success                                   |
| `400` | Bad Request - Invalid parameters          |
| `401` | Unauthorized - Invalid or missing API key |
| `403` | Forbidden - Insufficient permissions      |
| `404` | Not Found - Resource doesn't exist        |
| `500` | Internal Server Error                     |
| `503` | Service Unavailable - BigQuery timeout    |

### Common Errors

#### Dataset Not Found

```json
{
  "success": false,
  "error": "BigQuery table not found. Please ensure BigQuery export is enabled and data exists."
}
```

#### Permission Denied

```json
{
  "success": false,
  "error": "Permission denied. Check service account permissions."
}
```

---

## Rate Limiting

**Development:** No rate limits  
**Production:** Recommended limits:

- 100 requests per minute per IP
- 10,000 requests per day per API key

---

## Endpoints

### Health Check

Check if the API is running and responsive.

**Endpoint:** `GET /api/analytics/health`

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "message": "Analytics API is healthy",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "uptime": 123.456
}
```

**cURL Example:**

```bash
curl http://localhost:5000/api/analytics/health
```

---

### Month-over-Month Metrics

Get Monthly Active Users (MAU) and growth percentage for month-over-month analysis.

**Endpoint:** `GET /api/analytics/mom`

**Query Parameters:**

| Parameter | Type    | Required | Default | Description                        |
| --------- | ------- | -------- | ------- | ---------------------------------- |
| `months`  | integer | No       | 6       | Number of months to analyze (1-12) |

**Request:**

```bash
GET /api/analytics/mom?months=6
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2025-11",
      "active_users": "1250",
      "previous_month_users": "1100",
      "growth_percentage": "13.64"
    },
    {
      "month": "2025-10",
      "active_users": "1100",
      "previous_month_users": "1050",
      "growth_percentage": "4.76"
    }
  ],
  "metadata": {
    "months_analyzed": 6,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

**Data Fields:**

| Field                  | Type   | Description                                                   |
| ---------------------- | ------ | ------------------------------------------------------------- |
| `month`                | string | Month in YYYY-MM format                                       |
| `active_users`         | string | Number of unique active users                                 |
| `previous_month_users` | string | Previous month's active users (null for oldest month)         |
| `growth_percentage`    | string | Percentage growth from previous month (null for oldest month) |

**cURL Example:**

```bash
curl "http://localhost:5000/api/analytics/mom?months=6"
```

---

### Churn Rate

Calculate monthly churn rate - users who were active in month N but not in month N+1.

**Endpoint:** `GET /api/analytics/churn`

**Query Parameters:**

| Parameter | Type    | Required | Default | Description                        |
| --------- | ------- | -------- | ------- | ---------------------------------- |
| `months`  | integer | No       | 6       | Number of months to analyze (1-12) |

**Request:**

```bash
GET /api/analytics/churn?months=6
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2025-11",
      "active_users": "1250",
      "churned_users": "150",
      "churn_rate": "12.00"
    },
    {
      "month": "2025-10",
      "active_users": "1100",
      "churned_users": "132",
      "churn_rate": "12.00"
    }
  ],
  "metadata": {
    "months_analyzed": 6,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

**Data Fields:**

| Field           | Type   | Description                          |
| --------------- | ------ | ------------------------------------ |
| `month`         | string | Month in YYYY-MM format              |
| `active_users`  | string | Number of active users in this month |
| `churned_users` | string | Number of users who churned          |
| `churn_rate`    | string | Percentage of users who churned      |

**Churn Calculation:**

```
Churn Rate = (Users who didn't return next month / Total active users) × 100
```

**cURL Example:**

```bash
curl "http://localhost:5000/api/analytics/churn?months=6"
```

---

### Event Metrics

Get top events by count and unique users who triggered them.

**Endpoint:** `GET /api/analytics/events`

**Query Parameters:**

| Parameter | Type    | Required | Default | Description                           |
| --------- | ------- | -------- | ------- | ------------------------------------- |
| `days`    | integer | No       | 30      | Number of days to analyze (1-365)     |
| `events`  | string  | No       | all     | Comma-separated event names to filter |

**Request:**

```bash
GET /api/analytics/events?days=30&events=screen_view,button_click
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "event_name": "screen_view",
      "event_count": "5420",
      "unique_users": "1250"
    },
    {
      "event_name": "button_click",
      "event_count": "3210",
      "unique_users": "890"
    }
  ],
  "metadata": {
    "days_analyzed": 30,
    "filtered_events": ["screen_view", "button_click"],
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

**Data Fields:**

| Field          | Type   | Description                                     |
| -------------- | ------ | ----------------------------------------------- |
| `event_name`   | string | Name of the event                               |
| `event_count`  | string | Total number of times event was triggered       |
| `unique_users` | string | Number of unique users who triggered this event |

**cURL Examples:**

```bash
# Get all events
curl "http://localhost:5000/api/analytics/events?days=30"

# Filter specific events
curl "http://localhost:5000/api/analytics/events?days=30&events=screen_view,purchase,button_click"
```

---

### Daily Active Users

Get daily active user counts for trend analysis.

**Endpoint:** `GET /api/analytics/dau`

**Query Parameters:**

| Parameter | Type    | Required | Default | Description                       |
| --------- | ------- | -------- | ------- | --------------------------------- |
| `days`    | integer | No       | 30      | Number of days to analyze (1-365) |

**Request:**

```bash
GET /api/analytics/dau?days=30
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": {
        "value": "2025-11-12"
      },
      "active_users": "450"
    },
    {
      "date": {
        "value": "2025-11-11"
      },
      "active_users": "423"
    }
  ],
  "metadata": {
    "days_analyzed": 30,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

**Data Fields:**

| Field          | Type   | Description                                |
| -------------- | ------ | ------------------------------------------ |
| `date`         | object | Date object with value property            |
| `date.value`   | string | Date in YYYY-MM-DD format                  |
| `active_users` | string | Number of unique active users on this date |

**cURL Example:**

```bash
curl "http://localhost:5000/api/analytics/dau?days=30"
```

---

### User Cohorts

Get cohort retention data - track how users from specific months remain active over time.

**Endpoint:** `GET /api/analytics/cohorts`

**Query Parameters:**

| Parameter | Type    | Required | Default | Description                               |
| --------- | ------- | -------- | ------- | ----------------------------------------- |
| `months`  | integer | No       | 3       | Number of cohort months to analyze (1-12) |

**Request:**

```bash
GET /api/analytics/cohorts?months=3
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "cohort_month": "2025-09",
      "cohort_size": "500",
      "activity_month": "2025-11",
      "active_users": "350",
      "retention_rate": "70.00"
    },
    {
      "cohort_month": "2025-09",
      "cohort_size": "500",
      "activity_month": "2025-10",
      "active_users": "425",
      "retention_rate": "85.00"
    }
  ],
  "metadata": {
    "months_analyzed": 3,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

**Data Fields:**

| Field            | Type   | Description                                |
| ---------------- | ------ | ------------------------------------------ |
| `cohort_month`   | string | Month when users first appeared (YYYY-MM)  |
| `cohort_size`    | string | Total number of users in this cohort       |
| `activity_month` | string | Month of activity being measured (YYYY-MM) |
| `active_users`   | string | Number of cohort users still active        |
| `retention_rate` | string | Percentage of cohort still active          |

**Retention Calculation:**

```
Retention Rate = (Active Users in Activity Month / Cohort Size) × 100
```

**cURL Example:**

```bash
curl "http://localhost:5000/api/analytics/cohorts?months=3"
```

---

## Code Examples

### JavaScript/Node.js

```javascript
const API_BASE = 'http://localhost:5000';

// Fetch Month-over-Month metrics
async function getMoMMetrics(months = 6) {
  try {
    const response = await fetch(`${API_BASE}/api/analytics/mom?months=${months}`);
    const data = await response.json();

    if (data.success) {
      console.log('MoM Metrics:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Fetch Event Metrics with filtering
async function getEventMetrics(days = 30, events = []) {
  const eventsParam = events.length > 0 ? `&events=${events.join(','')}` : '';
  const url = `${API_BASE}/api/analytics/events?days=${days}${eventsParam}`;

  const response = await fetch(url);
  return response.json();
}

// Usage
getMoMMetrics(6);
getEventMetrics(30, ['screen_view', 'purchase']);
```

### Python

```python
import requests

API_BASE = 'http://localhost:5000'

def get_mom_metrics(months=6):
    """Fetch Month-over-Month metrics"""
    url = f'{API_BASE}/api/analytics/mom'
    params = {'months': months}

    response = requests.get(url, params=params)
    data = response.json()

    if data['success']:
        return data['data']
    else:
        raise Exception(data['error'])

def get_churn_rate(months=6):
    """Fetch churn rate data"""
    url = f'{API_BASE}/api/analytics/churn'
    params = {'months': months}

    response = requests.get(url, params=params)
    return response.json()

# Usage
metrics = get_mom_metrics(6)
print(f"Latest month users: {metrics[0]['active_users']}")
```

### React/React Native

```javascript
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000";

// Custom Hook
function useAnalytics(endpoint, params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE}/api/analytics/${endpoint}?${queryString}`;

    fetch(url)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [endpoint, JSON.stringify(params)]);

  return { data, loading, error };
}

// Component Usage
function AnalyticsDashboard() {
  const { data: momData, loading } = useAnalytics("mom", { months: 6 });
  const { data: churnData } = useAnalytics("churn", { months: 6 });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Monthly Active Users: {momData[0].active_users}</h2>
      <h2>Churn Rate: {churnData[0].churn_rate}%</h2>
    </div>
  );
}
```

### Swift (iOS)

```swift
import Foundation

struct AnalyticsAPI {
    static let baseURL = "http://localhost:5000"

    struct MoMMetric: Codable {
        let month: String
        let active_users: String
        let growth_percentage: String?
    }

    struct APIResponse<T: Codable>: Codable {
        let success: Bool
        let data: [T]
    }

    static func getMoMMetrics(months: Int = 6, completion: @escaping (Result<[MoMMetric], Error>) -> Void) {
        let url = URL(string: "\(baseURL)/api/analytics/mom?months=\(months)")!

        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NSError(domain: "", code: -1)))
                return
            }

            do {
                let result = try JSONDecoder().decode(APIResponse<MoMMetric>.self, from: data)
                completion(.success(result.data))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

// Usage
AnalyticsAPI.getMoMMetrics(months: 6) { result in
    switch result {
    case .success(let metrics):
        print("Users: \(metrics[0].active_users)")
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

### Kotlin (Android)

```kotlin
import kotlinx.coroutines.*
import kotlinx.serialization.*
import kotlinx.serialization.json.*
import java.net.URL

@Serializable
data class MoMMetric(
    val month: String,
    val active_users: String,
    val growth_percentage: String?
)

@Serializable
data class APIResponse<T>(
    val success: Boolean,
    val data: List<T>
)

class AnalyticsAPI {
    companion object {
        private const val BASE_URL = "http://localhost:5000"

        suspend fun getMoMMetrics(months: Int = 6): List<MoMMetric> {
            return withContext(Dispatchers.IO) {
                val url = "$BASE_URL/api/analytics/mom?months=$months"
                val json = URL(url).readText()
                val response = Json.decodeFromString<APIResponse<MoMMetric>>(json)
                response.data
            }
        }
    }
}

// Usage
GlobalScope.launch {
    val metrics = AnalyticsAPI.getMoMMetrics(6)
    println("Users: ${metrics[0].active_users}")
}
```

### cURL

```bash
# Health check
curl http://localhost:5000/api/analytics/health

# Get MoM metrics for 6 months
curl "http://localhost:5000/api/analytics/mom?months=6"

# Get churn rate for 3 months
curl "http://localhost:5000/api/analytics/churn?months=3"

# Get specific events for 30 days
curl "http://localhost:5000/api/analytics/events?days=30&events=screen_view,purchase"

# Get DAU for last 7 days
curl "http://localhost:5000/api/analytics/dau?days=7"

# Get cohort retention for 3 months
curl "http://localhost:5000/api/analytics/cohorts?months=3"

# Pretty print JSON response
curl "http://localhost:5000/api/analytics/mom?months=6" | json_pp
```

---

## Postman Collection

### Import Collection

```json
{
  "info": {
    "name": "Berry Analytics API",
    "description": "Firebase Analytics & BigQuery API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/analytics/health"
      }
    },
    {
      "name": "Get MoM Metrics",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/analytics/mom?months=6",
          "query": [{ "key": "months", "value": "6" }]
        }
      }
    },
    {
      "name": "Get Churn Rate",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/analytics/churn?months=6",
          "query": [{ "key": "months", "value": "6" }]
        }
      }
    },
    {
      "name": "Get Event Metrics",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/analytics/events?days=30&events=screen_view,purchase",
          "query": [
            { "key": "days", "value": "30" },
            { "key": "events", "value": "screen_view,purchase" }
          ]
        }
      }
    },
    {
      "name": "Get Daily Active Users",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/analytics/dau?days=30",
          "query": [{ "key": "days", "value": "30" }]
        }
      }
    },
    {
      "name": "Get User Cohorts",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/analytics/cohorts?months=3",
          "query": [{ "key": "months", "value": "3" }]
        }
      }
    }
  ]
}
```

### Using the Collection

1. **Import to Postman:**

   - Open Postman
   - Click "Import"
   - Paste the JSON above
   - Collection will be added

2. **Set Environment:**

   - Click "Environments"
   - Set `baseUrl` to your API URL
   - For local: `http://localhost:5000`
   - For production: `https://your-api-domain.com`

3. **Run Requests:**
   - Select any request from the collection
   - Click "Send"
   - View response in the body tab

---

## Best Practices

### 1. Error Handling

Always check the `success` field in responses:

```javascript
const response = await fetch(`${API_BASE}/api/analytics/mom`);
const data = await response.json();

if (data.success) {
  // Process data
  console.log(data.data);
} else {
  // Handle error
  console.error(data.error);
}
```

### 2. Parameter Validation

Validate parameters before making requests:

```javascript
function getMoMMetrics(months) {
  if (months < 1 || months > 12) {
    throw new Error("Months must be between 1 and 12");
  }

  return fetch(`${API_BASE}/api/analytics/mom?months=${months}`);
}
```

### 3. Caching

Cache responses to reduce API calls:

```javascript
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedData(endpoint, params) {
  const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFromAPI(endpoint, params);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

### 4. Timeout Handling

Set appropriate timeouts for long-running queries:

```javascript
async function fetchWithTimeout(url, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
```

---

## Support

**Documentation:** [GitHub Repository](https://github.com/your-repo)  
**Issues:** [GitHub Issues](https://github.com/your-repo/issues)  
**Email:** support@your-domain.com

---

## Changelog

### Version 1.0.0 (2025-11-12)

- Initial API release
- Added MoM metrics endpoint
- Added churn rate endpoint
- Added event metrics endpoint
- Added DAU endpoint
- Added user cohorts endpoint
- Added health check endpoint

---

**Last Updated:** November 12, 2025  
**API Version:** 1.0.0
