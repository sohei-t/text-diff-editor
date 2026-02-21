/**
 * core.js - EventBus + Utilities + Settings Management
 * Text Diff Editor - Prototype C (Component-Based Architecture)
 */

// ============================================================
// EventBus - Central Pub/Sub Communication Hub
// ============================================================
// Wrapped in IIFE to prevent class name from shadowing window.EventBus
window.EventBus = (() => {
  class _EventBus {
    constructor() {
      /** @type {Object<string, Function[]>} */
      this._listeners = {};
    }

    /**
     * Subscribe to an event.
     * @param {string} event - Event name.
     * @param {Function} callback - Handler function.
     * @returns {Function} Unsubscribe function.
     */
    on(event, callback) {
      if (!this._listeners[event]) {
        this._listeners[event] = [];
      }
      this._listeners[event].push(callback);
      return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - Event name.
     * @param {Function} callback - Handler to remove.
     */
    off(event, callback) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit an event with data.
     * @param {string} event - Event name.
     * @param {*} data - Payload.
     */
    emit(event, data) {
      if (!this._listeners[event]) return;
      this._listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (_err) {
          // Silently handle listener errors in production
        }
      });
    }

    /**
     * Subscribe to an event once; auto-unsubscribes after first call.
     * @param {string} event - Event name.
     * @param {Function} callback - Handler function.
     */
    once(event, callback) {
      const wrapper = (data) => {
        this.off(event, wrapper);
        callback(data);
      };
      this.on(event, wrapper);
    }

    /** Remove all listeners. */
    destroy() {
      this._listeners = {};
    }
  }

  return new _EventBus();
})();

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
      lastZoomLevel: 1.0,
      recentFiles: [],
      welcomeShown: false
    };
    this.settings = { ...this.defaults };
    this.loadSettings();
  }

  /** Load settings from localStorage. */
  loadSettings() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = { ...this.defaults, ...parsed };
      }
    } catch (_e) {
      // Use defaults on parse failure
    }
  }

  /** Persist settings to localStorage. */
  saveSettings() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (_e) {
      // Silently fail if storage is full
    }
  }

  /**
   * Get a setting value.
   * @param {string} key - Setting key.
   * @returns {*} Setting value.
   */
  get(key) {
    return this.settings[key];
  }

  /**
   * Set a setting value and persist.
   * @param {string} key - Setting key.
   * @param {*} value - New value.
   */
  set(key, value) {
    this.settings[key] = value;
    this.saveSettings();
    EventBus.emit('settings:change', { key, value });
  }

  /**
   * Get a copy of all settings.
   * @returns {Object} All settings.
   */
  getAll() {
    return { ...this.settings };
  }

  /** Reset all settings to defaults. */
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
  /**
   * Create a debounced function that delays invoking fn.
   * @param {Function} fn - Function to debounce.
   * @param {number} delay - Delay in ms.
   * @returns {Function} Debounced function.
   */
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Create a throttled function that invokes fn at most once per limit.
   * @param {Function} fn - Function to throttle.
   * @param {number} limit - Minimum interval in ms.
   * @returns {Function} Throttled function.
   */
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

  /**
   * Clamp a value between min and max.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Escape HTML special characters.
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  },

  /**
   * Escape special regex characters.
   * @param {string} str
   * @returns {string}
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Format a byte count into a human-readable size string.
   * @param {number} bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};
