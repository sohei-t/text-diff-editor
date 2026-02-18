const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

// Mock stock data generator
const STOCK_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT'];

// Initialize base prices for consistent mock data
const basePrices = {
  'AAPL': 178.50,
  'GOOGL': 141.80,
  'MSFT': 378.90,
  'AMZN': 151.20,
  'TSLA': 242.80,
  'META': 338.50,
  'NVDA': 495.20,
  'JPM': 156.30,
  'V': 258.70,
  'WMT': 165.40
};

/**
 * Generate realistic mock stock data
 */
function generateStockData(symbol, basePrice = null) {
  const price = basePrice || basePrices[symbol] || 100;
  const change = (Math.random() - 0.5) * 5; // Random change between -2.5 and +2.5
  const currentPrice = price + change;
  const changePercent = (change / price) * 100;

  return {
    symbol,
    price: parseFloat(currentPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    high: parseFloat((currentPrice + Math.random() * 2).toFixed(2)),
    low: parseFloat((currentPrice - Math.random() * 2).toFixed(2)),
    open: parseFloat((price + (Math.random() - 0.5)).toFixed(2)),
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate historical stock data
 */
function generateHistoricalData(symbol, days = 30) {
  const data = [];
  const basePrice = basePrices[symbol] || 100;
  let currentPrice = basePrice;

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Simulate price movement
    const change = (Math.random() - 0.48) * 3; // Slight upward bias
    currentPrice = currentPrice + change;

    const open = currentPrice + (Math.random() - 0.5) * 2;
    const high = Math.max(open, currentPrice) + Math.random() * 1;
    const low = Math.min(open, currentPrice) - Math.random() * 1;

    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000
    });
  }

  return data;
}

// ========================================
// REST API Endpoints
// ========================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Get all available stock symbols
 */
app.get('/api/stocks', (req, res) => {
  const cacheKey = 'all_stocks';
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json({
      data: cached,
      cached: true,
      timestamp: new Date().toISOString()
    });
  }

  const stocks = STOCK_SYMBOLS.map(symbol => generateStockData(symbol));
  cache.set(cacheKey, stocks);

  res.json({
    data: stocks,
    cached: false,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get specific stock by symbol
 */
app.get('/api/stocks/:symbol', (req, res) => {
  const { symbol } = req.params;
  const upperSymbol = symbol.toUpperCase();

  if (!STOCK_SYMBOLS.includes(upperSymbol)) {
    return res.status(404).json({
      error: 'Stock symbol not found',
      availableSymbols: STOCK_SYMBOLS
    });
  }

  const cacheKey = `stock_${upperSymbol}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json({
      data: cached,
      cached: true,
      timestamp: new Date().toISOString()
    });
  }

  const stockData = generateStockData(upperSymbol);
  cache.set(cacheKey, stockData);

  res.json({
    data: stockData,
    cached: false,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get historical data for a stock
 */
app.get('/api/stocks/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  const { days = 30 } = req.query;
  const upperSymbol = symbol.toUpperCase();

  if (!STOCK_SYMBOLS.includes(upperSymbol)) {
    return res.status(404).json({
      error: 'Stock symbol not found',
      availableSymbols: STOCK_SYMBOLS
    });
  }

  const daysNum = parseInt(days, 10);
  if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
    return res.status(400).json({
      error: 'Invalid days parameter. Must be between 1 and 365'
    });
  }

  const cacheKey = `history_${upperSymbol}_${daysNum}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json({
      symbol: upperSymbol,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString()
    });
  }

  const historicalData = generateHistoricalData(upperSymbol, daysNum);
  cache.set(cacheKey, historicalData);

  res.json({
    symbol: upperSymbol,
    data: historicalData,
    cached: false,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get multiple stocks by symbols (batch request)
 */
app.post('/api/stocks/batch', (req, res) => {
  const { symbols } = req.body;

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({
      error: 'Symbols must be a non-empty array'
    });
  }

  if (symbols.length > 10) {
    return res.status(400).json({
      error: 'Maximum 10 symbols per batch request'
    });
  }

  const results = [];
  const upperSymbols = symbols.map(s => s.toUpperCase());

  for (const symbol of upperSymbols) {
    if (!STOCK_SYMBOLS.includes(symbol)) {
      results.push({
        symbol,
        error: 'Symbol not found'
      });
      continue;
    }

    const cacheKey = `stock_${symbol}`;
    let data = cache.get(cacheKey);

    if (!data) {
      data = generateStockData(symbol);
      cache.set(cacheKey, data);
    }

    results.push(data);
  }

  res.json({
    data: results,
    timestamp: new Date().toISOString()
  });
});

/**
 * Clear cache (admin endpoint)
 */
app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get cache statistics
 */
app.get('/api/cache/stats', (req, res) => {
  const stats = cache.getStats();
  res.json({
    stats,
    keys: cache.keys().length,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ========================================
// WebSocket Server for Real-time Updates
// ========================================

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`HTTP API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Store active subscriptions: Map<WebSocket, Set<symbols>>
const subscriptions = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  subscriptions.set(ws, new Set());

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to stock price WebSocket',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'subscribe':
          handleSubscribe(ws, data.symbols);
          break;

        case 'unsubscribe':
          handleUnsubscribe(ws, data.symbols);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    subscriptions.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    subscriptions.delete(ws);
  });
});

/**
 * Handle subscription requests
 */
function handleSubscribe(ws, symbols) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Symbols must be a non-empty array'
    }));
    return;
  }

  const clientSubscriptions = subscriptions.get(ws);
  const upperSymbols = symbols.map(s => s.toUpperCase());
  const validSymbols = [];
  const invalidSymbols = [];

  for (const symbol of upperSymbols) {
    if (STOCK_SYMBOLS.includes(symbol)) {
      clientSubscriptions.add(symbol);
      validSymbols.push(symbol);
    } else {
      invalidSymbols.push(symbol);
    }
  }

  ws.send(JSON.stringify({
    type: 'subscribed',
    symbols: validSymbols,
    invalidSymbols,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Handle unsubscription requests
 */
function handleUnsubscribe(ws, symbols) {
  const clientSubscriptions = subscriptions.get(ws);

  if (symbols === 'all' || !symbols) {
    clientSubscriptions.clear();
    ws.send(JSON.stringify({
      type: 'unsubscribed',
      message: 'Unsubscribed from all symbols',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (Array.isArray(symbols)) {
    const upperSymbols = symbols.map(s => s.toUpperCase());
    upperSymbols.forEach(symbol => clientSubscriptions.delete(symbol));

    ws.send(JSON.stringify({
      type: 'unsubscribed',
      symbols: upperSymbols,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Broadcast stock updates to subscribed clients
 */
function broadcastStockUpdates() {
  if (subscriptions.size === 0) return;

  // Collect all unique symbols that clients are subscribed to
  const activeSymbols = new Set();
  subscriptions.forEach((symbols) => {
    symbols.forEach(symbol => activeSymbols.add(symbol));
  });

  if (activeSymbols.size === 0) return;

  // Generate updated data for active symbols
  const updates = {};
  activeSymbols.forEach(symbol => {
    // Get base price for consistency
    const cacheKey = `stock_${symbol}`;
    const cached = cache.get(cacheKey);
    const basePrice = cached ? cached.price : basePrices[symbol];

    updates[symbol] = generateStockData(symbol, basePrice);
    cache.set(cacheKey, updates[symbol]);
  });

  // Send updates to subscribed clients
  subscriptions.forEach((subscribedSymbols, ws) => {
    if (ws.readyState === WebSocket.OPEN && subscribedSymbols.size > 0) {
      const clientUpdates = [];
      subscribedSymbols.forEach(symbol => {
        if (updates[symbol]) {
          clientUpdates.push(updates[symbol]);
        }
      });

      if (clientUpdates.length > 0) {
        ws.send(JSON.stringify({
          type: 'update',
          data: clientUpdates,
          timestamp: new Date().toISOString()
        }));
      }
    }
  });
}

// Broadcast updates every 2 seconds
setInterval(broadcastStockUpdates, 2000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
