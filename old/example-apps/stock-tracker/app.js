/**
 * Stock Price Tracker - Interactive Chart Application
 * Features: Real-time updates, multiple stocks, zoom & pan, dark mode
 */

// ===========================
// Constants & Configuration
// ===========================

const CONFIG = {
    UPDATE_INTERVAL: 5000, // 5 seconds
    ANIMATION_DURATION: 750,
    CHART_TENSION: 0.4,
    STOCK_COLORS: {
        AAPL: '#4F46E5',
        GOOGL: '#10B981',
        MSFT: '#F59E0B',
        AMZN: '#EF4444',
        TSLA: '#8B5CF6'
    },
    STOCK_NAMES: {
        AAPL: 'Apple Inc.',
        GOOGL: 'Alphabet Inc.',
        MSFT: 'Microsoft Corp.',
        AMZN: 'Amazon.com Inc.',
        TSLA: 'Tesla Inc.'
    },
    BASE_PRICES: {
        AAPL: 175.00,
        GOOGL: 140.00,
        MSFT: 370.00,
        AMZN: 145.00,
        TSLA: 240.00
    }
};

// ===========================
// State Management
// ===========================

const state = {
    chart: null,
    updateTimer: null,
    currentPeriod: '1W',
    selectedStocks: ['AAPL'],
    autoRefresh: true,
    isDarkMode: false,
    stockData: {},
    isLoading: false,
    ws: null // WebSocket connection
};

// ===========================
// Utility Functions
// ===========================

/**
 * Format date for display
 */
function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format currency
 */
function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Format percentage
 */
function formatPercentage(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

/**
 * Generate random stock price data
 */
function generateStockData(symbol, numPoints) {
    const basePrice = CONFIG.BASE_PRICES[symbol];
    const data = [];
    const now = new Date();
    let currentPrice = basePrice;

    for (let i = numPoints - 1; i >= 0; i--) {
        const date = new Date(now - i * getTimeInterval());
        // Random walk with mean reversion
        const change = (Math.random() - 0.5) * (basePrice * 0.02);
        const meanReversion = (basePrice - currentPrice) * 0.1;
        currentPrice += change + meanReversion;

        data.push({
            x: date,
            y: currentPrice
        });
    }

    return data;
}

/**
 * Get time interval based on selected period
 */
function getTimeInterval() {
    const intervals = {
        '1D': 60000 * 5,        // 5 minutes
        '1W': 3600000,           // 1 hour
        '1M': 3600000 * 4,       // 4 hours
        '3M': 86400000,          // 1 day
        '6M': 86400000 * 2,      // 2 days
        '1Y': 86400000 * 7,      // 1 week
        'ALL': 86400000 * 30     // 1 month
    };
    return intervals[state.currentPeriod] || 3600000;
}

/**
 * Get number of data points based on period
 */
function getDataPoints() {
    const points = {
        '1D': 48,      // 48 points (5 min intervals)
        '1W': 168,     // 168 points (1 hour intervals)
        '1M': 180,     // 180 points (4 hour intervals)
        '3M': 90,      // 90 points (1 day intervals)
        '6M': 90,      // 90 points (2 day intervals)
        '1Y': 52,      // 52 points (1 week intervals)
        'ALL': 60      // 60 points (1 month intervals)
    };
    return points[state.currentPeriod] || 100;
}

/**
 * Update stock data with new point
 */
function updateStockData(symbol) {
    if (!state.stockData[symbol]) return;

    const lastPoint = state.stockData[symbol][state.stockData[symbol].length - 1];
    const change = (Math.random() - 0.5) * (CONFIG.BASE_PRICES[symbol] * 0.01);
    const meanReversion = (CONFIG.BASE_PRICES[symbol] - lastPoint.y) * 0.05;
    const newPrice = lastPoint.y + change + meanReversion;

    state.stockData[symbol].push({
        x: new Date(),
        y: newPrice
    });

    // Keep only necessary points
    const maxPoints = getDataPoints() + 50;
    if (state.stockData[symbol].length > maxPoints) {
        state.stockData[symbol].shift();
    }
}

/**
 * Calculate price change
 */
function calculateChange(data) {
    if (data.length < 2) return { value: 0, percentage: 0 };

    const firstPrice = data[0].y;
    const lastPrice = data[data.length - 1].y;
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;

    return { value: change, percentage };
}

// ===========================
// Theme Management
// ===========================

/**
 * Initialize theme
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    state.isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    applyTheme(state.isDarkMode);
}

/**
 * Apply theme
 */
function applyTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    state.isDarkMode = isDark;

    // Update chart if it exists
    if (state.chart) {
        updateChartTheme();
    }
}

/**
 * Toggle theme
 */
function toggleTheme() {
    applyTheme(!state.isDarkMode);
}

/**
 * Update chart theme colors
 */
function updateChartTheme() {
    const isDark = state.isDarkMode;

    state.chart.options.plugins.legend.labels.color = isDark ? '#f1f5f9' : '#1e293b';
    state.chart.options.scales.x.ticks.color = isDark ? '#cbd5e1' : '#64748b';
    state.chart.options.scales.y.ticks.color = isDark ? '#cbd5e1' : '#64748b';
    state.chart.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    state.chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    state.chart.update('none');
}

// ===========================
// Loading State Management
// ===========================

/**
 * Show loading overlay
 */
function showLoading() {
    state.isLoading = true;
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    state.isLoading = false;
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ===========================
// Chart Management
// ===========================

/**
 * Initialize chart
 */
function initChart() {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;

    const isDark = state.isDarkMode;

    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        color: isDark ? '#f1f5f9' : '#1e293b'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            const date = new Date(context[0].parsed.x);
                            return date.toLocaleString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = formatCurrency(context.parsed.y);
                            return `${label}: ${value}`;
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    limits: {
                        x: { min: 'original', max: 'original' }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'M/d',
                            week: 'M/d',
                            month: 'yyyy/M'
                        }
                    },
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: isDark ? '#cbd5e1' : '#64748b',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: isDark ? '#cbd5e1' : '#64748b',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            animation: {
                duration: CONFIG.ANIMATION_DURATION,
                easing: 'easeInOutQuart'
            }
        }
    });
}

/**
 * Update chart with current data
 */
function updateChart() {
    if (!state.chart) return;

    const datasets = state.selectedStocks.map(symbol => {
        const data = state.stockData[symbol] || [];
        return {
            label: symbol,
            data: data,
            borderColor: CONFIG.STOCK_COLORS[symbol],
            backgroundColor: CONFIG.STOCK_COLORS[symbol] + '20',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: CONFIG.STOCK_COLORS[symbol],
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            tension: CONFIG.CHART_TENSION,
            fill: false
        };
    });

    state.chart.data.datasets = datasets;
    state.chart.update('active');
}

// ===========================
// Stats Cards Management
// ===========================

/**
 * Update stats cards
 */
function updateStatsCards() {
    const container = document.getElementById('statsCards');
    if (!container) return;

    container.innerHTML = '';

    state.selectedStocks.forEach(symbol => {
        const data = state.stockData[symbol];
        if (!data || data.length === 0) return;

        const currentPrice = data[data.length - 1].y;
        const change = calculateChange(data);
        const isPositive = change.value >= 0;

        const card = document.createElement('div');
        card.className = 'stat-card';
        card.style.borderLeftColor = CONFIG.STOCK_COLORS[symbol];
        card.innerHTML = `
            <div class="stat-header">
                <span class="stat-symbol">${symbol}</span>
                <span class="stat-change ${isPositive ? 'positive' : 'negative'}">
                    ${formatPercentage(change.percentage)}
                </span>
            </div>
            <div class="stat-price">${formatCurrency(currentPrice)}</div>
            <div class="stat-name">${CONFIG.STOCK_NAMES[symbol]}</div>
        `;

        container.appendChild(card);
    });
}

// ===========================
// Data Management
// ===========================

/**
 * Get number of days for current period
 */
function getPeriodDays() {
    const periodMap = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        'ALL': 365
    };
    return periodMap[state.currentPeriod] || 7;
}

/**
 * Load data for selected stocks
 */
async function loadData() {
    showLoading();

    try {
        // Fetch data from API for each selected stock
        const promises = state.selectedStocks.map(async symbol => {
            try {
                const response = await fetch(`http://localhost:3001/api/stocks/${symbol}/history?days=${getPeriodDays()}`);
                if (!response.ok) throw new Error('API not available');

                const data = await response.json();
                state.stockData[symbol] = data.history.map(point => ({
                    x: new Date(point.date),
                    y: point.close
                }));
            } catch (error) {
                // Fallback to mock data if API fails
                console.log(`Using mock data for ${symbol}`);
                const numPoints = getDataPoints();
                state.stockData[symbol] = generateStockData(symbol, numPoints);
            }
        });

        await Promise.all(promises);
        updateChart();
        updateStatsCards();
        updateLastUpdateTime();
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        hideLoading();
    }
}

/**
 * Refresh data (update with new points)
 */
async function refreshData() {
    if (state.isLoading) return;

    try {
        state.selectedStocks.forEach(symbol => {
            if (state.stockData[symbol]) {
                updateStockData(symbol);
            }
        });

        updateChart();
        updateStatsCards();
        updateLastUpdateTime();
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}

/**
 * Update last update time display
 */
function updateLastUpdateTime() {
    const element = document.getElementById('lastUpdate');
    if (element) {
        const now = new Date();
        element.textContent = `最終更新: ${now.toLocaleTimeString('ja-JP')}`;
    }
}

// ===========================
// Event Handlers
// ===========================

/**
 * Handle stock selection change
 */
function handleStockSelectionChange(checkbox) {
    const symbol = checkbox.value;

    if (checkbox.checked) {
        if (!state.selectedStocks.includes(symbol)) {
            state.selectedStocks.push(symbol);
            if (!state.stockData[symbol]) {
                state.stockData[symbol] = generateStockData(symbol, getDataPoints());
            }
        }
    } else {
        const index = state.selectedStocks.indexOf(symbol);
        if (index > -1) {
            state.selectedStocks.splice(index, 1);
        }
    }

    // Ensure at least one stock is selected
    if (state.selectedStocks.length === 0) {
        checkbox.checked = true;
        state.selectedStocks.push(symbol);
        alert('少なくとも1つの銘柄を選択してください。');
        return;
    }

    updateChart();
    updateStatsCards();
}

/**
 * Handle period change
 */
function handlePeriodChange(period) {
    state.currentPeriod = period;

    // Update active button
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });

    // Clear existing data and reload
    state.stockData = {};
    loadData();
}

/**
 * Handle reset zoom
 */
function handleResetZoom() {
    if (state.chart) {
        state.chart.resetZoom();
    }
}

/**
 * Handle auto refresh toggle
 */
function handleAutoRefreshToggle(checked) {
    state.autoRefresh = checked;

    if (checked) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
}

/**
 * Start auto refresh
 */
function startAutoRefresh() {
    if (state.updateTimer) {
        clearInterval(state.updateTimer);
    }

    state.updateTimer = setInterval(() => {
        if (state.autoRefresh && !state.isLoading) {
            refreshData();
        }
    }, CONFIG.UPDATE_INTERVAL);
}

/**
 * Stop auto refresh
 */
function stopAutoRefresh() {
    if (state.updateTimer) {
        clearInterval(state.updateTimer);
        state.updateTimer = null;
    }
}

// ===========================
// Initialization
// ===========================

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Stock checkboxes
    const stockCheckboxes = document.querySelectorAll('#stockCheckboxes input[type="checkbox"]');
    stockCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => handleStockSelectionChange(e.target));
    });

    // Period buttons
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(btn => {
        btn.addEventListener('click', (e) => handlePeriodChange(e.target.dataset.period));
    });

    // Reset zoom button
    const resetZoomBtn = document.getElementById('resetZoom');
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', handleResetZoom);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }

    // Auto refresh toggle
    const autoRefreshToggle = document.getElementById('autoRefresh');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', (e) => handleAutoRefreshToggle(e.target.checked));
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // T key for theme toggle
        if (e.key === 't' || e.key === 'T') {
            toggleTheme();
        }
        // R key for refresh
        if (e.key === 'r' || e.key === 'R') {
            refreshData();
        }
        // ESC key for reset zoom
        if (e.key === 'Escape') {
            handleResetZoom();
        }
    });

    // Visibility change - pause updates when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else if (state.autoRefresh) {
            startAutoRefresh();
            refreshData();
        }
    });
}

/**
 * Initialize application
 */
async function init() {
    try {
        // Initialize theme
        initTheme();

        // Initialize chart
        initChart();

        // Initialize event listeners
        initEventListeners();

        // Load initial data
        await loadData();

        // Start auto refresh if enabled
        if (state.autoRefresh) {
            startAutoRefresh();
        }

        console.log('Stock Price Tracker initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        hideLoading();
    }
}

// ===========================
// App Entry Point
// ===========================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
