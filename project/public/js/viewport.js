/**
 * viewport.js - ZoomController + PanController (Viewport Operations)
 * Text Diff Editor - Prototype C
 *
 * Hybrid Zoom: CSS transform for smooth animation + font-size commit for clarity
 */

// ============================================================
// ZoomController - Magic Mouse Pinch Zoom (Hybrid Approach)
// ============================================================
class ZoomController {
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

    this._handleWheel = this._handleWheel.bind(this);
    container.addEventListener('wheel', this._handleWheel, { passive: false });
  }

  _handleWheel(e) {
    if (!this.enabled) return;
    if (!e.ctrlKey) return;
    e.preventDefault();

    const delta = -e.deltaY * this.zoomStep;
    const newLevel = Utils.clamp(this.level + delta, this.minZoom, this.maxZoom);

    if (Math.abs(newLevel - this.level) < 0.001) return;

    this.level = newLevel;

    // Real-time: CSS transform for smooth zoom
    const rect = this.container.getBoundingClientRect();
    const ox = ((e.clientX - rect.left) / rect.width * 100);
    const oy = ((e.clientY - rect.top) / rect.height * 100);
    this.container.style.transformOrigin = `${ox}% ${oy}%`;
    this.container.style.transform = `scale(${this.level})`;
    this.container.style.willChange = 'transform';

    // Settle: commit to font size after zoom stops
    clearTimeout(this.zoomTimer);
    this.zoomTimer = setTimeout(() => this.commitZoom(), 200);

    EventBus.emit('zoom:change', { level: this.level, originX: ox, originY: oy });
  }

  commitZoom() {
    // Apply to font size for crisp text
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

  zoomIn() {
    this.setZoom(this.level + 0.25);
  }

  zoomOut() {
    this.setZoom(this.level - 0.25);
  }

  setZoom(level, originX, originY) {
    this.level = Utils.clamp(level, this.minZoom, this.maxZoom);

    if (originX !== undefined && originY !== undefined) {
      const rect = this.container.getBoundingClientRect();
      const ox = ((originX - rect.left) / rect.width * 100);
      const oy = ((originY - rect.top) / rect.height * 100);
      this.container.style.transformOrigin = `${ox}% ${oy}%`;
    }

    this.container.style.transform = `scale(${this.level})`;

    clearTimeout(this.zoomTimer);
    this.zoomTimer = setTimeout(() => this.commitZoom(), 200);

    EventBus.emit('zoom:change', { level: this.level });
  }

  getZoom() {
    return this.level;
  }

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

  destroy() {
    clearTimeout(this.zoomTimer);
    this.container.removeEventListener('wheel', this._handleWheel);
  }
}

// ============================================================
// PanController - Alt + Drag Pan with Inertia
// ============================================================
class PanController {
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

  _onMouseUp(e) {
    if (!this.panning) return;
    this.panning = false;
    this.container.style.cursor = '';
    EventBus.emit('pan:end', {});
    this._startInertia();
  }

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

  enable() {
    this._enabled = true;
  }

  disable() {
    this._enabled = false;
    this.panning = false;
  }

  isPanning() {
    return this.panning;
  }

  reset() {
    const textarea = this.container.querySelector('.editor-textarea');
    if (textarea) {
      textarea.scrollLeft = 0;
      textarea.scrollTop = 0;
    }
  }

  destroy() {
    cancelAnimationFrame(this.inertiaFrame);
    this.container.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }
}
