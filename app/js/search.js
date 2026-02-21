/**
 * search.js - SearchManager + Replace Functionality
 * Text Diff Editor - Prototype C
 */

class SearchManager {
  /** Create the SearchManager and build the search bar UI. */
  constructor() {
    this.searchBar = document.getElementById('search-bar');
    this.searchInput = null;
    this.replaceInput = null;
    this.matchCountEl = null;
    this.caseSensitiveBtn = null;
    this.regexBtn = null;
    this.replaceRow = null;

    this.query = '';
    this.caseSensitive = false;
    this.useRegex = false;
    this.matches = [];
    this.currentIndex = -1;
    this.activeEditor = null;
    this.isOpen = false;

    this._buildSearchBar();
    this._setupListeners();
  }

  _buildSearchBar() {
    if (!this.searchBar) return;

    this.searchBar.innerHTML = `
      <div class="search-row">
        <div class="search-input-group">
          <span class="search-icon">&#x1F50D;</span>
          <input type="text" id="search-input" class="search-field" placeholder="Search..." autocomplete="off" spellcheck="false">
        </div>
        <button id="search-case-btn" class="search-toggle-btn" title="Match Case (Aa)" aria-pressed="false">Aa</button>
        <button id="search-regex-btn" class="search-toggle-btn" title="Regular Expression (.*)" aria-pressed="false">.*</button>
        <button id="search-prev-btn" class="search-nav-btn" title="Previous Match">&uarr;</button>
        <button id="search-next-btn" class="search-nav-btn" title="Next Match">&darr;</button>
        <span id="search-match-count" class="search-match-count">0 results</span>
        <button id="search-close-btn" class="search-close-btn" title="Close">&times;</button>
      </div>
      <div id="replace-row" class="search-row replace-row" hidden>
        <div class="search-input-group">
          <span class="search-icon" style="opacity:0;">&#x1F50D;</span>
          <input type="text" id="replace-input" class="search-field" placeholder="Replace..." autocomplete="off" spellcheck="false">
        </div>
        <button id="replace-btn" class="search-action-btn" title="Replace">Replace</button>
        <button id="replace-all-btn" class="search-action-btn" title="Replace All">All</button>
      </div>
    `;

    this.searchInput = document.getElementById('search-input');
    this.replaceInput = document.getElementById('replace-input');
    this.matchCountEl = document.getElementById('search-match-count');
    this.caseSensitiveBtn = document.getElementById('search-case-btn');
    this.regexBtn = document.getElementById('search-regex-btn');
    this.replaceRow = document.getElementById('replace-row');
  }

  _setupListeners() {
    if (!this.searchInput) return;

    this.searchInput.addEventListener('input', () => {
      this.query = this.searchInput.value;
      this._performSearch();
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.findNext();
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        this.findPrevious();
      } else if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'Tab') {
        // Focus trap: keep Tab within search bar
        this._handleFocusTrap(e);
      }
    });

    if (this.replaceInput) {
      this.replaceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    }

    document.getElementById('search-case-btn')?.addEventListener('click', () => {
      this.caseSensitive = !this.caseSensitive;
      this.caseSensitiveBtn.setAttribute('aria-pressed', this.caseSensitive);
      this.caseSensitiveBtn.classList.toggle('active', this.caseSensitive);
      this._performSearch();
    });

    document.getElementById('search-regex-btn')?.addEventListener('click', () => {
      this.useRegex = !this.useRegex;
      this.regexBtn.setAttribute('aria-pressed', this.useRegex);
      this.regexBtn.classList.toggle('active', this.useRegex);
      this._performSearch();
    });

    document.getElementById('search-prev-btn')?.addEventListener('click', () => this.findPrevious());
    document.getElementById('search-next-btn')?.addEventListener('click', () => this.findNext());
    document.getElementById('search-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('replace-btn')?.addEventListener('click', () => {
      if (this.replaceInput) this.replace(this.replaceInput.value);
    });
    document.getElementById('replace-all-btn')?.addEventListener('click', () => {
      if (this.replaceInput) {
        const count = this.replaceAll(this.replaceInput.value);
        EventBus.emit('toast:show', {
          message: `Replaced ${count} occurrence${count !== 1 ? 's' : ''}`,
          type: 'info',
          duration: 2000
        });
      }
    });

    this._onSearchOpen = (data) => this.open(data?.replace);
    EventBus.on('search:open', this._onSearchOpen);
  }

  /**
   * Open the search bar.
   * @param {boolean} [showReplace=false] - Whether to show the replace row.
   */
  open(showReplace = false) {
    if (!this.searchBar) return;
    this.searchBar.hidden = false;
    this.isOpen = true;

    if (showReplace && this.replaceRow) {
      this.replaceRow.hidden = false;
    }

    this.searchInput?.focus();

    // Use currently focused editor
    const activePanel = document.querySelector('.editor-textarea:focus');
    if (activePanel) {
      this.activeEditor = activePanel;
    } else {
      this.activeEditor = document.getElementById('editor-left');
    }

    // If text is selected, use as search query
    if (this.activeEditor) {
      const sel = this.activeEditor.value.substring(
        this.activeEditor.selectionStart,
        this.activeEditor.selectionEnd
      );
      if (sel && sel.length < 200) {
        this.searchInput.value = sel;
        this.query = sel;
        this._performSearch();
      }
    }

    EventBus.emit('search:opened', {});
  }

  /** Close the search bar and clear highlights. */
  close() {
    if (!this.searchBar) return;
    this.searchBar.hidden = true;
    this.isOpen = false;
    this.matches = [];
    this.currentIndex = -1;

    if (this.replaceRow) {
      this.replaceRow.hidden = true;
    }

    this._clearHighlights();
    EventBus.emit('search:close', {});
  }

  /**
   * Execute a search with the given query and options.
   * @param {string} query - Search string or regex pattern.
   * @param {{ caseSensitive?: boolean, useRegex?: boolean }} [options]
   * @returns {{ matches: Object[], total: number }}
   */
  find(query, options = {}) {
    this.query = query;
    this.caseSensitive = options.caseSensitive || false;
    this.useRegex = options.useRegex || false;
    return this._performSearch();
  }

  _performSearch() {
    if (!this.activeEditor) {
      this.activeEditor = document.getElementById('editor-left');
    }
    if (!this.activeEditor || !this.query) {
      this.matches = [];
      this.currentIndex = -1;
      this._updateMatchCount();
      return { matches: [], total: 0 };
    }

    const text = this.activeEditor.value;
    this.matches = [];

    try {
      let regex;
      if (this.useRegex) {
        regex = new RegExp(this.query, this.caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = Utils.escapeRegex(this.query);
        regex = new RegExp(escaped, this.caseSensitive ? 'g' : 'gi');
      }

      let match;
      while ((match = regex.exec(text)) !== null) {
        this.matches.push({ start: match.index, end: match.index + match[0].length });
        if (match[0].length === 0) break; // Prevent infinite loop
      }
    } catch (e) {
      // Invalid regex
      this.matches = [];
    }

    if (this.matches.length > 0 && this.currentIndex === -1) {
      this.currentIndex = 0;
    } else if (this.matches.length === 0) {
      this.currentIndex = -1;
    }

    this._updateMatchCount();
    this._highlightCurrent();

    EventBus.emit('search:result', {
      matches: this.matches,
      total: this.matches.length,
      current: this.currentIndex
    });

    return { matches: this.matches, total: this.matches.length };
  }

  /**
   * Navigate to the next match.
   * @returns {{ start: number, end: number, index: number }|null}
   */
  findNext() {
    if (this.matches.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this._updateMatchCount();
    this._highlightCurrent();

    const match = this.matches[this.currentIndex];
    EventBus.emit('search:navigate', {
      direction: 'next',
      position: match,
      index: this.currentIndex
    });
    return { ...match, index: this.currentIndex };
  }

  /**
   * Navigate to the previous match.
   * @returns {{ start: number, end: number, index: number }|null}
   */
  findPrevious() {
    if (this.matches.length === 0) return null;
    this.currentIndex = this.currentIndex <= 0 ? this.matches.length - 1 : this.currentIndex - 1;
    this._updateMatchCount();
    this._highlightCurrent();

    const match = this.matches[this.currentIndex];
    EventBus.emit('search:navigate', {
      direction: 'prev',
      position: match,
      index: this.currentIndex
    });
    return { ...match, index: this.currentIndex };
  }

  /**
   * Replace the current match with the given text.
   * @param {string} replacement - Replacement text.
   */
  replace(replacement) {
    if (!this.activeEditor || this.matches.length === 0 || this.currentIndex === -1) return;

    const match = this.matches[this.currentIndex];
    const text = this.activeEditor.value;
    this.activeEditor.value = text.substring(0, match.start) + replacement + text.substring(match.end);

    // Trigger input event
    this.activeEditor.dispatchEvent(new Event('input'));
    this._performSearch();
  }

  /**
   * Replace all matches with the given text.
   * @param {string} replacement - Replacement text.
   * @returns {number} Number of replacements made.
   */
  replaceAll(replacement) {
    if (!this.activeEditor || this.matches.length === 0) return 0;

    const count = this.matches.length;
    let text = this.activeEditor.value;
    // Replace from end to start to preserve positions
    for (let i = this.matches.length - 1; i >= 0; i--) {
      const match = this.matches[i];
      text = text.substring(0, match.start) + replacement + text.substring(match.end);
    }
    this.activeEditor.value = text;
    this.activeEditor.dispatchEvent(new Event('input'));
    this._performSearch();
    return count;
  }

  _updateMatchCount() {
    if (!this.matchCountEl) return;
    if (this.matches.length === 0) {
      this.matchCountEl.textContent = this.query ? 'No results' : '0 results';
    } else {
      this.matchCountEl.textContent = `${this.currentIndex + 1} / ${this.matches.length}`;
    }
  }

  _highlightCurrent() {
    if (!this.activeEditor || this.matches.length === 0 || this.currentIndex === -1) return;
    const match = this.matches[this.currentIndex];
    this.activeEditor.focus();
    this.activeEditor.setSelectionRange(match.start, match.end);

    // Scroll into view - approximate
    const text = this.activeEditor.value.substring(0, match.start);
    const line = text.split('\n').length;
    const lineHeight = parseFloat(getComputedStyle(this.activeEditor).lineHeight) || 27;
    const targetScroll = (line - 5) * lineHeight;
    if (targetScroll > 0) {
      this.activeEditor.scrollTop = targetScroll;
    }
  }

  _clearHighlights() {
    // textarea doesn't support styled highlights directly; the selection serves as highlight
  }

  /**
   * Focus trap: keep Tab/Shift+Tab within the search bar when open.
   * @param {KeyboardEvent} e
   */
  _handleFocusTrap(e) {
    if (!this.searchBar || !this.isOpen) return;
    const focusable = this.searchBar.querySelectorAll('input, button:not([hidden])');
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /** Clean up event listeners. */
  destroy() {
    if (this._onSearchOpen) {
      EventBus.off('search:open', this._onSearchOpen);
    }
  }
}
