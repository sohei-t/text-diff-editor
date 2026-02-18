# Stock Price API Documentation

## Overview

Real-time stock price API with WebSocket support for live updates. Built with Node.js, Express, and WebSocket for high-performance data delivery.

## Features

- REST API for stock data retrieval
- WebSocket for real-time price updates
- In-memory caching (5-minute TTL)
- Rate limiting (100 requests per 15 minutes)
- CORS enabled
- Mock data for 10 major stocks

## Base URL

```
http://localhost:3001/api
```

## Available Stock Symbols

AAPL, GOOGL, MSFT, AMZN, TSLA, META, NVDA, JPM, V, WMT

---

## REST API Endpoints

### 1. Health Check

Check API server status.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

### 2. Get All Stocks

Retrieve current data for all available stocks.

**Endpoint:** `GET /api/stocks`

**Response:**
```json
{
  "data": [
    {
      "symbol": "AAPL",
      "price": 179.25,
      "change": 0.75,
      "changePercent": 0.42,
      "volume": 5234567,
      "high": 180.50,
      "low": 178.20,
      "open": 178.80,
      "timestamp": "2025-12-03T10:30:00.000Z"
    },
    // ... more stocks
  ],
  "cached": false,
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

---

### 3. Get Single Stock

Retrieve current data for a specific stock.

**Endpoint:** `GET /api/stocks/:symbol`

**Parameters:**
- `symbol` (path) - Stock symbol (e.g., AAPL, GOOGL)

**Example:** `GET /api/stocks/AAPL`

**Response:**
```json
{
  "data": {
    "symbol": "AAPL",
    "price": 179.25,
    "change": 0.75,
    "changePercent": 0.42,
    "volume": 5234567,
    "high": 180.50,
    "low": 178.20,
    "open": 178.80,
    "timestamp": "2025-12-03T10:30:00.000Z"
  },
  "cached": false,
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Stock symbol not found",
  "availableSymbols": ["AAPL", "GOOGL", "MSFT", ...]
}
```

---

### 4. Get Historical Data

Retrieve historical price data for a stock.

**Endpoint:** `GET /api/stocks/:symbol/history`

**Parameters:**
- `symbol` (path) - Stock symbol
- `days` (query, optional) - Number of days (1-365, default: 30)

**Example:** `GET /api/stocks/AAPL/history?days=30`

**Response:**
```json
{
  "symbol": "AAPL",
  "data": [
    {
      "date": "2025-11-03",
      "open": 177.50,
      "high": 179.80,
      "low": 176.20,
      "close": 178.50,
      "volume": 6543210
    },
    // ... more historical data
  ],
  "cached": false,
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid days parameter. Must be between 1 and 365"
}
```

---

### 5. Batch Stock Request

Retrieve data for multiple stocks in one request.

**Endpoint:** `POST /api/stocks/batch`

**Request Body:**
```json
{
  "symbols": ["AAPL", "GOOGL", "MSFT"]
}
```

**Response:**
```json
{
  "data": [
    {
      "symbol": "AAPL",
      "price": 179.25,
      "change": 0.75,
      "changePercent": 0.42,
      "volume": 5234567,
      "high": 180.50,
      "low": 178.20,
      "open": 178.80,
      "timestamp": "2025-12-03T10:30:00.000Z"
    },
    // ... more stocks
  ],
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

**Limitations:**
- Maximum 10 symbols per request
- Symbols must be in an array

**Error Response (400):**
```json
{
  "error": "Maximum 10 symbols per batch request"
}
```

---

### 6. Clear Cache

Clear all cached data (admin endpoint).

**Endpoint:** `POST /api/cache/clear`

**Response:**
```json
{
  "message": "Cache cleared successfully",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

---

### 7. Cache Statistics

Get cache performance statistics.

**Endpoint:** `GET /api/cache/stats`

**Response:**
```json
{
  "stats": {
    "hits": 1250,
    "misses": 75,
    "keys": 15,
    "ksize": 15,
    "vsize": 15
  },
  "keys": 15,
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

---

## WebSocket API

Connect to real-time stock price updates via WebSocket.

**URL:** `ws://localhost:3001`

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Message Types

#### 1. Connected (Server → Client)

Sent immediately after connection is established.

```json
{
  "type": "connected",
  "message": "Connected to stock price WebSocket",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

#### 2. Subscribe (Client → Server)

Subscribe to stock price updates.

**Send:**
```json
{
  "type": "subscribe",
  "symbols": ["AAPL", "GOOGL", "MSFT"]
}
```

**Response:**
```json
{
  "type": "subscribed",
  "symbols": ["AAPL", "GOOGL", "MSFT"],
  "invalidSymbols": [],
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

#### 3. Update (Server → Client)

Real-time stock price updates (sent every 2 seconds).

```json
{
  "type": "update",
  "data": [
    {
      "symbol": "AAPL",
      "price": 179.25,
      "change": 0.75,
      "changePercent": 0.42,
      "volume": 5234567,
      "high": 180.50,
      "low": 178.20,
      "open": 178.80,
      "timestamp": "2025-12-03T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

#### 4. Unsubscribe (Client → Server)

Unsubscribe from specific symbols or all symbols.

**Unsubscribe from specific symbols:**
```json
{
  "type": "unsubscribe",
  "symbols": ["AAPL", "GOOGL"]
}
```

**Unsubscribe from all:**
```json
{
  "type": "unsubscribe",
  "symbols": "all"
}
```

**Response:**
```json
{
  "type": "unsubscribed",
  "symbols": ["AAPL", "GOOGL"],
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

#### 5. Ping/Pong (Heartbeat)

Keep connection alive.

**Send:**
```json
{
  "type": "ping"
}
```

**Response:**
```json
{
  "type": "pong",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

#### 6. Error (Server → Client)

Error messages.

```json
{
  "type": "error",
  "message": "Invalid message format"
}
```

---

## Performance Optimizations

### 1. Caching Strategy

- **In-memory cache** using node-cache
- **TTL:** 5 minutes (300 seconds)
- **Check period:** 60 seconds
- Cache keys: `stock_${symbol}`, `all_stocks`, `history_${symbol}_${days}`
- Automatic cache invalidation on TTL expiration

### 2. Rate Limiting

- **Window:** 15 minutes
- **Max requests:** 100 per IP
- Applied to all `/api/*` endpoints
- Prevents API abuse and ensures fair usage

### 3. Efficient Data Structures

- **Map** for WebSocket subscriptions: O(1) lookup
- **Set** for symbol tracking: O(1) add/remove/check
- **JSON parsing** only when needed
- Minimal data transformation overhead

### 4. WebSocket Optimization

- **Selective broadcasting:** Only send updates to subscribed clients
- **Batch updates:** Collect all symbol updates before broadcasting
- **Connection state check:** Only send to OPEN connections
- **Update interval:** 2 seconds (configurable)

### 5. Memory Management

- Automatic cleanup of closed WebSocket connections
- Cache size limits prevent memory overflow
- Efficient garbage collection with proper object lifecycle

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd worktrees/mission-backend
npm install
```

### 2. Start Server

**Production:**
```bash
npm start
```

**Development (with auto-reload):**
```bash
npm run dev
```

### 3. Environment Variables (Optional)

Create a `.env` file:

```env
PORT=3001
CORS_ORIGIN=*
```

---

## Usage Examples

### REST API Example (JavaScript)

```javascript
// Fetch all stocks
fetch('http://localhost:3001/api/stocks')
  .then(res => res.json())
  .then(data => console.log(data));

// Fetch single stock
fetch('http://localhost:3001/api/stocks/AAPL')
  .then(res => res.json())
  .then(data => console.log(data));

// Fetch historical data
fetch('http://localhost:3001/api/stocks/AAPL/history?days=30')
  .then(res => res.json())
  .then(data => console.log(data));

// Batch request
fetch('http://localhost:3001/api/stocks/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbols: ['AAPL', 'GOOGL'] })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### WebSocket Example (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  // Subscribe to stocks
  ws.send(JSON.stringify({
    type: 'subscribe',
    symbols: ['AAPL', 'GOOGL', 'MSFT']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'update') {
    // Handle real-time updates
    data.data.forEach(stock => {
      console.log(`${stock.symbol}: $${stock.price} (${stock.changePercent}%)`);
    });
  }
};

// Unsubscribe after 30 seconds
setTimeout(() => {
  ws.send(JSON.stringify({
    type: 'unsubscribe',
    symbols: 'all'
  }));
  ws.close();
}, 30000);
```

### WebSocket Example (Python)

```python
import websocket
import json
import time

def on_message(ws, message):
    data = json.loads(message)
    if data['type'] == 'update':
        for stock in data['data']:
            print(f"{stock['symbol']}: ${stock['price']} ({stock['changePercent']}%)")

def on_open(ws):
    # Subscribe to stocks
    ws.send(json.dumps({
        'type': 'subscribe',
        'symbols': ['AAPL', 'GOOGL', 'MSFT']
    }))

ws = websocket.WebSocketApp(
    'ws://localhost:3001',
    on_message=on_message,
    on_open=on_open
)

ws.run_forever()
```

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (invalid symbol or endpoint)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Common Errors

**Invalid Symbol:**
```json
{
  "error": "Stock symbol not found",
  "availableSymbols": ["AAPL", "GOOGL", ...]
}
```

**Rate Limit Exceeded:**
```json
{
  "error": "Too many requests, please try again later."
}
```

**WebSocket Error:**
```json
{
  "type": "error",
  "message": "Invalid message format"
}
```

---

## Testing

### Test REST Endpoints

```bash
# Health check
curl http://localhost:3001/api/health

# Get all stocks
curl http://localhost:3001/api/stocks

# Get single stock
curl http://localhost:3001/api/stocks/AAPL

# Get historical data
curl "http://localhost:3001/api/stocks/AAPL/history?days=30"

# Batch request
curl -X POST http://localhost:3001/api/stocks/batch \
  -H "Content-Type: application/json" \
  -d '{"symbols":["AAPL","GOOGL"]}'

# Cache stats
curl http://localhost:3001/api/cache/stats
```

### Test WebSocket

Use tools like:
- **wscat:** `wscat -c ws://localhost:3001`
- **websocat:** `websocat ws://localhost:3001`
- Browser DevTools Console

---

## Architecture

### Components

1. **Express Server:** Handles HTTP REST API requests
2. **WebSocket Server:** Manages real-time connections
3. **Cache Layer:** In-memory caching with node-cache
4. **Rate Limiter:** express-rate-limit middleware
5. **CORS:** Cross-origin resource sharing
6. **Mock Data Generator:** Realistic stock data simulation

### Data Flow

```
Client Request → Rate Limiter → CORS → Route Handler
                                           ↓
                                    Check Cache
                                           ↓
                              Cache Hit ←→ Cache Miss
                                 ↓            ↓
                            Return Data  Generate Data
                                              ↓
                                         Store in Cache
                                              ↓
                                         Return Data
```

### WebSocket Flow

```
Client Connect → WebSocket Server → Send Welcome Message
                      ↓
              Subscribe to Symbols
                      ↓
         Store Subscription in Map
                      ↓
    Broadcast Updates (every 2s) → Filter by Subscription → Send to Client
```

---

## Future Enhancements

- [ ] Add authentication/API keys
- [ ] Implement Redis for distributed caching
- [ ] Add real Yahoo Finance API integration
- [ ] Support for forex and crypto data
- [ ] GraphQL API endpoint
- [ ] Metrics and monitoring (Prometheus)
- [ ] Database persistence for historical data
- [ ] WebSocket reconnection logic
- [ ] Compression for WebSocket messages
- [ ] Multi-currency support

---

## License

MIT
