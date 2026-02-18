/**
 * core.js - EventBus + Utilities + Settings Management
 * Text Diff Editor - Prototype C (Component-Based Architecture)
 */

// ============================================================
// EventBus - Central Pub/Sub Communication Hub
// ============================================================
class EventBus {
  constructor() {
    this._listeners = {};
  }

  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`EventBus error in "${event}":`, err);
      }
    });
  }

  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  destroy() {
    this._listeners = {};
  }
}

// Global singleton
window.EventBus = new EventBus();

// ============================================================
// SettingsManager - localStorage-backed settings
// ============================================================
class SettingsManager {
  constructor() {
    this.STORAGE_KEY = 'textDiffEditor';
    this.defaults = {
      theme: 'light',
      fontSize: 18,
      fontFamily: '"SF Mono", "Menlo", "Monaco", "Consolas", monospace',
      lineHeight: 1.6,
      wordWrap: true,
      showLineNumbers: true,
      highlightCurrentLine: true,
      autoSaveInterval: 0,
      splitRatio: 0.5,
      syncScroll: true,
      lastZoomLevel: 1.0
    };
    this.settings = { ...this.defaults };
    this.loadSettings();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = { ...this.defaults, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.saveSettings();
    EventBus.emit('settings:change', { key, value });
  }

  getAll() {
    return { ...this.settings };
  }

  resetToDefaults() {
    this.settings = { ...this.defaults };
    this.saveSettings();
    EventBus.emit('settings:reset', this.settings);
  }
}

window.Settings = new SettingsManager();

// ============================================================
// Utility Functions
// ============================================================
window.Utils = {
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  },

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};
