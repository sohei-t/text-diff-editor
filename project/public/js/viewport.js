/**
 * viewport.js - ZoomController + PanController (Viewport Operations)
 * Text Diff Editor - Prototype C
 *
 * Hybrid Zoom: CSS transform for smooth animation + font-size commit for clarity
 */

// ============================================================
// ZoomController - Cmd+Scroll Zoom (Hybrid Approach)
// ============================================================
class ZoomController {
  /**
   * @param {HTMLElement} container - The editor container element.
   * @param {Object} [options]
   * @param {number} [options.minZoom=0.5]
   * @param {number} [options.maxZoom=4.0]
   * @param {number} [options.baseFontSize=18]
   * @param {number} [options.zoomStep=0.008]
   */
  constructor(container, options = {}) {
    this.container = container;
    this.level = 1.0;
    this.minZoom = options.minZoom || 0.5;
    this.maxZoom = options.maxZoom || 4.0;
    this.baseFontSize = options.baseFontSize || 18;
    this.zoomStep = options.zoomStep || 0.008;
    this.animating = false;
    this.zoomTimer = null;
    this.enabled = true;
    /** When false, Cmd+scroll zooms only the panel under the cursor. */
    this.syncZoom = true;
    /** Per-panel zoom levels keyed by panel id. */
    this._panelLevels = { left: 1.0, center: 1.0, right: 1.0 };

    // Track Cmd key state independently (browser may not set metaKey on wheel events)
    this._cmdPressed = false;
    this._onKeyDown = (e) => { if (e.key === 'Meta') this._cmdPressed = true; };
    this._onKeyUp = (e) => { if (e.key === 'Meta') this._cmdPressed = false; };
    this._onBlur = () => { this._cmdPressed = false; };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);

    // Throttled zoom change emission for performance
    this._throttledEmit = Utils.throttle((data) => {
      EventBus.emit('zoom:change', data);
    }, 32);

    this._handleWheel = this._handleWheel.bind(this);
    // Register on document to catch Cmd+scroll zoom from anywhere on the page
    document.addEventListener('wheel', this._handleWheel, { passive: false });

  }

  /** @private */
  _handleWheel(e) {
    if (!this.enabled) return;

    // Zoom triggers: Pinch (ctrlKey), Cmd+scroll (_cmdPressed or metaKey)
    const isZoom = e.ctrlKey || e.metaKey || this._cmdPressed;
    if (!isZoom) return; // Regular scroll = normal textarea scrolling

    e.preventDefault();

    const delta = -e.deltaY * this.zoomStep;

    // Independent zoom: only zoom the panel under the cursor
    if (!this.syncZoom) {
      const panel = e.target.closest?.('.editor-panel');
      if (!panel) return;
      const panelId = panel.id === 'panel-right' ? 'right'
        : panel.id === 'panel-center' ? 'center' : 'left';
      const current = this._panelLevels[panelId] || 1.0;
      const newLevel = Utils.clamp(current + delta, this.minZoom, this.maxZoom);
      if (Math.abs(newLevel - current) < 0.001) return;
      this._panelLevels[panelId] = newLevel;
      this._commitPanelZoom(panelId, newLevel);
      this._throttledEmit({ level: newLevel, panelId });
      return;
    }

    // Synced zoom: zoom all panels together
    const newLevel = Utils.clamp(this.level + delta, this.minZoom, this.maxZoom);
    if (Math.abs(newLevel - this.level) < 0.001) return;
    this.level = newLevel;

    // Real-time: CSS transform for smooth zoom via requestAnimationFrame
    const rect = this.container.getBoundingClientRect();
    const ox = ((e.clientX - rect.left) / rect.width * 100);
    const oy = ((e.clientY - rect.top) / rect.height * 100);

    requestAnimationFrame(() => {
      this.container.style.transformOrigin = `${ox}% ${oy}%`;
      this.container.style.transform = `scale(${this.level})`;
      this.container.style.willChange = 'transform';
    });

    // Settle: commit to font size after zoom stops
    clearTimeout(this.zoomTimer);
    this.zoomTimer = setTimeout(() => this.commitZoom(), 200);

    this._throttledEmit({ level: this.level, originX: ox, originY: oy });
  }

  /**
   * Apply zoom to a single panel by adjusting font size directly.
   * @param {string} panelId - 'left', 'center', or 'right'
   * @param {number} level - Zoom level
   */
  _commitPanelZoom(panelId, level) {
    const panel = document.getElementById(`panel-${panelId}`);
    if (!panel) return;
    const newSize = Math.round(this.baseFontSize * level);
    const lineH = Math.round(newSize * 1.5);
    panel.querySelectorAll('.editor-textarea, .line-numbers').forEach(el => {
      el.style.fontSize = `${newSize}px`;
      el.style.lineHeight = `${lineH}px`;
    });
  }

  /**
   * Enable or disable synced zoom across all panels.
   * @param {boolean} enabled
   */
  setSyncZoom(enabled) {
    this.syncZoom = enabled;
    if (enabled) {
      // Re-sync all panels to the global level
      this._panelLevels = { left: this.level, center: this.level, right: this.level };
      this.commitZoom();
    }
  }

  /** Commit the current zoom level to font-size for crisp text rendering. */
  commitZoom() {
    const newSize = Math.round(this.baseFontSize * this.level);
    const lineH = Math.round(newSize * 1.5);

    document.querySelectorAll('.editor-textarea, .line-numbers').forEach(el => {
      el.style.fontSize = `${newSize}px`;
      el.style.lineHeight = `${lineH}px`;
    });

    this.container.style.transform = 'scale(1)';
    this.container.style.transformOrigin = 'center center';
    this.container.style.willChange = 'auto';
  }

  /** Zoom in by 0.25 step. */
  zoomIn() {
    this.setZoom(this.level + 0.25);
  }

  /** Zoom out by 0.25 step. */
  zoomOut() {
    this.setZoom(this.level - 0.25);
  }

  /**
   * Set zoom to a specific level with optional origin point.
   * @param {number} level - Target zoom level.
   * @param {number} [originX] - Origin X in client coordinates.
   * @param {number} [originY] - Origin Y in client coordinates.
   */
  setZoom(level, originX, originY) {
    this.level = Utils.clamp(level, this.minZoom, this.maxZoom);

    if (originX !== undefined && originY !== undefined) {
      const rect = this.container.getBoundingClientRect();
      const ox = ((originX - rect.left) / rect.width * 100);
      const oy = ((originY - rect.top) / rect.height * 100);
      this.container.style.transformOrigin = `${ox}% ${oy}%`;
    }

    // Use CSS transition for smooth preset zoom
    this.container.style.transition = 'transform 0.2s ease';
    this.container.style.transform = `scale(${this.level})`;

    clearTimeout(this.zoomTimer);
    this.zoomTimer = setTimeout(() => {
      this.container.style.transition = '';
      this.commitZoom();
    }, 250);

    EventBus.emit('zoom:change', { level: this.level });
  }

  /**
   * Get the current zoom level.
   * @returns {number}
   */
  getZoom() {
    return this.level;
  }

  /** Reset zoom to 100% with a smooth animation. */
  resetZoom() {
    this.level = 1.0;
    this.container.style.transition = 'transform 0.3s ease';
    this.container.style.transform = 'scale(1)';

    setTimeout(() => {
      this.container.style.transition = '';
      this.commitZoom();
    }, 300);

    EventBus.emit('zoom:change', { level: 1.0 });
    EventBus.emit('zoom:reset', {});
  }

  /** Clean up event listeners and timers. */
  destroy() {
    clearTimeout(this.zoomTimer);
    document.removeEventListener('wheel', this._handleWheel);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
  }
}

// ============================================================
// PanController - Alt + Drag Pan with Inertia
// ============================================================
class PanController {
  /**
   * @param {HTMLElement} container - The editor container element.
   * @param {Object} [options]
   * @param {number} [options.friction=0.95] - Inertia friction coefficient.
   */
  constructor(container, options = {}) {
    this.container = container;
    this.friction = options.friction || 0.95;
    this.panning = false;
    this._enabled = true;
    this.lastX = 0;
    this.lastY = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.inertiaFrame = null;

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);

    container.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
  }

  /** @private */
  _onMouseDown(e) {
    if (!this._enabled) return;
    if (!e.altKey) return;
    e.preventDefault();
    this.panning = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.velocityX = 0;
    this.velocityY = 0;
    cancelAnimationFrame(this.inertiaFrame);
    this.container.style.cursor = 'grabbing';
    EventBus.emit('pan:start', {});
  }

  /** @private */
  _onMouseMove(e) {
    if (!this.panning) return;
    e.preventDefault();

    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;

    // Find scrollable textarea inside container
    const textarea = this.container.querySelector('.editor-textarea');
    if (textarea) {
      textarea.scrollLeft -= dx;
      textarea.scrollTop -= dy;
    }

    this.velocityX = dx;
    this.velocityY = dy;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    EventBus.emit('pan:move', { deltaX: dx, deltaY: dy });
  }

  /** @private */
  _onMouseUp() {
    if (!this.panning) return;
    this.panning = false;
    this.container.style.cursor = '';
    EventBus.emit('pan:end', {});
    this._startInertia();
  }

  /** @private */
  _startInertia() {
    const textarea = this.container.querySelector('.editor-textarea');
    if (!textarea) return;

    const animate = () => {
      if (Math.abs(this.velocityX) < 0.5 && Math.abs(this.velocityY) < 0.5) return;

      textarea.scrollLeft -= this.velocityX;
      textarea.scrollTop -= this.velocityY;

      this.velocityX *= this.friction;
      this.velocityY *= this.friction;

      this.inertiaFrame = requestAnimationFrame(animate);
    };

    this.inertiaFrame = requestAnimationFrame(animate);
  }

  /** Enable pan controller. */
  enable() {
    this._enabled = true;
  }

  /** Disable pan controller. */
  disable() {
    this._enabled = false;
    this.panning = false;
  }

  /**
   * Check if currently panning.
   * @returns {boolean}
   */
  isPanning() {
    return this.panning;
  }

  /** Reset scroll position to origin. */
  reset() {
    const textarea = this.container.querySelector('.editor-textarea');
    if (textarea) {
      textarea.scrollLeft = 0;
      textarea.scrollTop = 0;
    }
  }

  /** Clean up event listeners and animation frames. */
  destroy() {
    cancelAnimationFrame(this.inertiaFrame);
    this.container.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }
}
