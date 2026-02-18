# Stock Market Dashboard - UX Guidelines

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color Scheme](#color-scheme)
3. [Typography](#typography)
4. [Accessibility](#accessibility)
5. [Animation & Motion](#animation--motion)
6. [User Experience Patterns](#user-experience-patterns)
7. [Performance Guidelines](#performance-guidelines)
8. [Mobile-First Approach](#mobile-first-approach)
9. [Error Handling](#error-handling)
10. [Data Visualization](#data-visualization)

---

## Design Philosophy

### Core Principles

1. **Clarity Over Complexity**
   - Information hierarchy is paramount in financial applications
   - Critical data (price, change %) should be immediately visible
   - Secondary information (volume, market cap) is accessible but not overwhelming

2. **Trust Through Consistency**
   - Consistent color coding (green = gain, red = loss) across all interfaces
   - Predictable layouts and behaviors
   - Reliable data updates with clear timestamps

3. **Progressive Disclosure**
   - Beginners see simplified views by default
   - Advanced features are discoverable but not intrusive
   - Keyboard shortcuts for power users (press '?' to view)

4. **Emotional Design**
   - Dark theme reduces eye strain during extended trading hours
   - Smooth animations provide feedback without distraction
   - Gentle color gradients create a premium, professional feel

---

## Color Scheme

### Primary Palette

```css
/* Background Colors */
--color-bg-primary: #0a0e27      /* Deep navy - main background */
--color-bg-secondary: #141824    /* Slightly lighter - sections */
--color-bg-card: #1a1f37         /* Card background */
--color-bg-card-hover: #242a45   /* Hover state */

/* Accent Colors */
--color-accent-primary: #3b82f6  /* Blue - primary actions */
--color-accent-secondary: #8b5cf6 /* Purple - gradient accent */

/* Stock Colors - Carefully Chosen for Accessibility */
--color-gain: #10b981            /* Green - WCAG AAA compliant */
--color-loss: #ef4444            /* Red - WCAG AAA compliant */
--color-neutral: #64748b         /* Gray - neutral state */

/* Text Colors */
--color-text-primary: #f8fafc    /* Almost white - high contrast */
--color-text-secondary: #94a3b8  /* Muted - less important text */
--color-text-muted: #64748b      /* Very muted - labels */
```

### Color Psychology & Meaning

**Green (#10b981) - Positive Movement**
- Used for: Price increases, positive percentages, success states
- Psychology: Growth, prosperity, go-ahead signal
- Contrast ratio: 4.8:1 against dark background (WCAG AA+)

**Red (#ef4444) - Negative Movement**
- Used for: Price decreases, losses, errors
- Psychology: Warning, caution, stop signal
- Contrast ratio: 4.5:1 against dark background (WCAG AA)

**Blue (#3b82f6) - Primary Actions**
- Used for: Buttons, links, interactive elements
- Psychology: Trust, reliability, professionalism
- Contrast ratio: 5.2:1 against dark background

### Color Usage Guidelines

1. **Never use color alone** to convey information
   - Always pair with icons (▲▼) or text labels
   - Example: "▲ $2.50 (1.5%)" not just green text

2. **Maintain sufficient contrast**
   - All text must meet WCAG AA standards (4.5:1 for normal text)
   - Large text (18pt+) can use 3:1 ratio
   - Use contrast checker tools regularly

3. **Provide color-blind friendly alternatives**
   - Icons and symbols supplement color
   - Patterns or textures for complex charts
   - Test with color-blindness simulators

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Type Scale

| Element | Size | Weight | Use Case |
|---------|------|--------|----------|
| h1 | 1.875rem (30px) | 700 | Page title |
| h2 | 1.5rem (24px) | 700 | Section headers |
| h3 | 1.25rem (20px) | 700 | Stock symbols |
| Body | 1rem (16px) | 400 | Normal text |
| Small | 0.875rem (14px) | 400 | Labels, metadata |
| Tiny | 0.75rem (12px) | 600 | Uppercase labels |

### Typography Best Practices

1. **Number Formatting**
   - Use monospaced fonts for price alignment
   - Always show 2 decimal places: `$175.50` not `$175.5`
   - Use comma separators for thousands: `1,234,567`

2. **Readability**
   - Line height: 1.6 for body text
   - Maximum line length: 70-80 characters
   - Adequate letter spacing for small text (0.5px)

3. **Hierarchy**
   - Stock price is largest element (2rem / 32px)
   - Symbol is second (1.5rem / 24px)
   - Supporting data is smaller (0.875rem / 14px)

---

## Accessibility

### WCAG 2.1 Level AA Compliance

#### Perceivable

1. **Text Alternatives**
   - All icons have `aria-label` attributes
   - Chart data available in table format
   - Images have descriptive alt text

2. **Adaptable Content**
   - Semantic HTML structure (header, main, article, nav)
   - Proper heading hierarchy (h1 → h2 → h3)
   - Meaningful reading order

3. **Color Contrast**
   - Minimum 4.5:1 for normal text
   - Minimum 3:1 for large text and UI components
   - Tested with automated tools (axe, WAVE)

#### Operable

1. **Keyboard Accessible**
   - All functionality available via keyboard
   - Logical tab order
   - Visible focus indicators (2px blue outline)
   - No keyboard traps

2. **Keyboard Shortcuts**
   - `?` - Show help panel
   - `R` - Refresh data
   - `/` - Focus search
   - `1-4` - Quick filters
   - `ESC` - Close modals

3. **Sufficient Time**
   - Auto-refresh pauses when page is hidden
   - User can disable auto-refresh
   - No time limits on reading

#### Understandable

1. **Readable**
   - Language set to `lang="ja"` for Japanese or `lang="en"` for English
   - Clear, simple language
   - Abbreviations explained (hover tooltips)

2. **Predictable**
   - Navigation is consistent
   - Actions have clear feedback
   - No unexpected context changes

3. **Input Assistance**
   - Clear error messages
   - Helpful validation feedback
   - Autocomplete for search

#### Robust

1. **Compatible**
   - Valid HTML5
   - ARIA landmarks and roles
   - Tested with screen readers (NVDA, JAWS, VoiceOver)

### Screen Reader Support

```html
<!-- Example: Stock card with proper ARIA labels -->
<article class="stock-card"
         aria-label="Apple Inc, current price $175.50, up $2.25 or 1.3%">
  <div class="stock-header">
    <h3 class="stock-symbol">AAPL</h3>
    <button class="watchlist-btn"
            aria-label="Add AAPL to watchlist">☆</button>
  </div>
  <div class="stock-price" aria-label="Current price">$175.50</div>
  <div class="stock-change gain"
       aria-label="Price change positive $2.25 or 1.3 percent">
    ▲ $2.25 (1.3%)
  </div>
</article>
```

### Focus Management

- Focus indicator: 2px solid blue outline with 2px offset
- Skip to main content link for keyboard users
- Focus trapping in modals (tab cycles within modal)
- Return focus to trigger element when closing modals

---

## Animation & Motion

### Animation Principles

1. **Purpose-Driven**
   - Every animation serves a function
   - Loading states indicate progress
   - Transitions show relationships between states
   - Feedback confirms user actions

2. **Performance First**
   - GPU-accelerated properties only (transform, opacity)
   - Avoid animating: width, height, margin, padding, left, top
   - Use `will-change` sparingly and remove after animation

3. **Timing & Easing**
   ```css
   --transition-fast: 150ms ease-in-out   /* Quick feedback */
   --transition-base: 250ms ease-in-out   /* Standard transitions */
   --transition-slow: 350ms ease-in-out   /* Complex animations */
   ```

### Animation Catalog

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| Fade In | 300ms | ease-out | Content appearing |
| Slide In | 300ms | ease-out | List items, cards |
| Pulse | 2s | ease-in-out | Live indicators |
| Spin | 1s | linear | Loading spinners |
| Hover Lift | 200ms | ease-in-out | Interactive cards |
| Price Flash | 800ms | ease-out | Price updates |
| Shake | 500ms | ease-in-out | Error feedback |

### Accessibility - Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Users who enable "reduce motion" in their OS settings should:
- See instant state changes (no transitions)
- Still receive visual feedback (no loss of functionality)
- Not experience vestibular motion triggers

---

## User Experience Patterns

### Loading States

1. **Initial Load**
   - Show skeleton screens (shape of content)
   - Display loading spinner with message: "Loading market data..."
   - Estimated time if known: "This may take a few seconds"

2. **Auto-Refresh**
   - Subtle indicator (pulsing dot)
   - Non-disruptive updates
   - Timestamp: "Last updated: 14:23:15"

3. **Lazy Loading**
   - Load visible content first
   - Progressive enhancement for below-fold content
   - Smooth transitions when new content appears

### Error States

#### Network Errors
```
⚠️ Unable to Load Data
Failed to fetch market data. Please check your internet connection.
[Try Again Button]
```

#### Search No Results
```
No stocks found matching "ZZZZ"
Try searching by company name or stock symbol.
```

#### General Error
```
Something went wrong
We're having trouble loading this data. Please try again.
If the problem persists, contact support.
[Try Again Button]
```

### Empty States

```
No stocks in your watchlist yet
Add stocks to your watchlist by clicking the star icon ☆
Start by searching for companies above.
```

### Tooltips

- Appear on hover (desktop) or tap (mobile)
- 200ms delay before showing
- Clear, concise text (max 2 lines)
- Positioned above element when possible

```html
<div class="tooltip">
  <span>Market Cap</span>
  <span class="tooltip-text">
    Total market value of all outstanding shares
  </span>
</div>
```

---

## Performance Guidelines

### Target Metrics

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Optimization Strategies

1. **CSS Optimization**
   - Minimize reflows and repaints
   - Use CSS containment for isolated components
   - Avoid expensive properties (box-shadow during animation)

2. **JavaScript Optimization**
   - Debounce search input (300ms delay)
   - Throttle scroll events (100ms)
   - Use requestAnimationFrame for animations

3. **Image Optimization**
   - No images currently, but if added:
   - Use WebP format with JPEG fallback
   - Lazy load images below fold
   - Provide width/height to prevent layout shift

4. **Data Management**
   - Cache API responses (30 seconds)
   - Batch updates when possible
   - Virtual scrolling for long lists (1000+ items)

---

## Mobile-First Approach

### Responsive Breakpoints

```css
/* Mobile First - Base styles for mobile */
/* Default: 320px - 767px */

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1440px) { }
```

### Mobile Optimizations

1. **Touch Targets**
   - Minimum size: 48x48 pixels
   - Adequate spacing between interactive elements (8px)
   - Larger buttons for primary actions

2. **Touch Gestures**
   - Swipe to refresh (pull down)
   - Tap to expand card details
   - Long press for contextual menu
   - Pinch to zoom (charts only)

3. **Mobile Navigation**
   - Sticky header for quick access
   - Bottom navigation for primary actions
   - Hamburger menu for secondary features

4. **Performance on Mobile**
   - Reduce animation complexity
   - Smaller images and icons
   - Lighter initial payload
   - Service worker for offline support

### Viewport Configuration

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

- No user-scalable=no (allow pinch zoom for accessibility)
- Maximum-scale not restricted
- Initial scale set to 1.0

---

## Error Handling

### Error Hierarchy

1. **Critical Errors** (Block functionality)
   - Network failure
   - API unavailable
   - Authentication failure
   - Show full-page error with retry option

2. **Non-Critical Errors** (Partial functionality)
   - Single stock fails to load
   - Search timeout
   - Show inline error, allow continuing

3. **Validation Errors**
   - Invalid search input
   - Show helpful message inline

### Error Message Guidelines

**DO:**
- Explain what happened: "Unable to load stock data"
- Explain why: "Network connection lost"
- Suggest action: "Check your connection and try again"
- Provide escape: [Retry Button] or [Dismiss]

**DON'T:**
- Show technical jargon: "HTTP 500 Internal Server Error"
- Blame user: "You entered invalid data"
- Dead ends: Error with no action options
- Vague messages: "Error occurred"

### Example Error Messages

```javascript
// Network Error
{
  title: "Unable to Load Data",
  message: "Failed to fetch market data. Please check your internet connection.",
  actions: ["Try Again", "Dismiss"]
}

// Validation Error
{
  title: "Invalid Search",
  message: "Please enter at least 2 characters to search.",
  type: "warning"
}

// Timeout Error
{
  title: "Request Timed Out",
  message: "The server took too long to respond. Please try again.",
  actions: ["Retry"]
}
```

---

## Data Visualization

### Number Formatting

1. **Prices**
   - Always 2 decimal places: `$175.50`
   - Use dollar sign prefix
   - Comma thousands separator: `$1,234.56`

2. **Percentages**
   - Show sign: `+1.5%` or `-0.8%`
   - 2 decimal places for precision
   - Color coded (green/red)

3. **Large Numbers**
   - Market Cap: `$2.5T`, `$150.3B`, `$45.2M`
   - Volume: `25.3M`, `1.2B`
   - Use abbreviations (K, M, B, T)

4. **Date/Time**
   - Last update: `14:23:15` (HH:MM:SS)
   - Date format: `Dec 3, 2025` or `2025-12-03`
   - Relative time: "Updated 30 seconds ago"

### Chart Guidelines (for future implementation)

1. **Line Charts** (Price over time)
   - Green for gains, red for losses
   - Gradient fill below line
   - Tooltip on hover with exact values
   - Axis labels clearly visible

2. **Bar Charts** (Volume)
   - Vertical bars
   - Height proportional to volume
   - Color based on price direction

3. **Interactive Elements**
   - Crosshairs on mouse/touch
   - Zoom with scroll/pinch
   - Pan by dragging
   - Reset zoom button

---

## Advanced Features for Pro Traders

### Power User Features

1. **Keyboard Shortcuts**
   - Quick filters (1-4)
   - Rapid refresh (R)
   - Focus search (/)
   - Full list on `?`

2. **Customization**
   - Watchlist organization
   - Custom alerts (future)
   - Preferred view density
   - Auto-refresh interval

3. **Bulk Operations**
   - Select multiple stocks
   - Batch add to watchlist
   - Export data (CSV)

### Beginner-Friendly Features

1. **Onboarding**
   - First-time user tutorial
   - Tooltips explaining terms
   - Sample watchlist pre-populated

2. **Help System**
   - Contextual help icons
   - Glossary of terms
   - FAQ section

3. **Progressive Disclosure**
   - Basic view by default
   - "Show advanced" option
   - Gradual feature discovery

---

## Testing Checklist

### Functional Testing
- [ ] All buttons and links work
- [ ] Search filters correctly
- [ ] Watchlist saves to localStorage
- [ ] Auto-refresh works
- [ ] Keyboard shortcuts function

### Accessibility Testing
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all content
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Performance Testing
- [ ] Loads in under 3 seconds
- [ ] Smooth animations (60fps)
- [ ] No layout shifts
- [ ] Memory doesn't leak

### Browser Testing
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

### Device Testing
- [ ] iPhone (iOS Safari)
- [ ] Android (Chrome)
- [ ] iPad (Portrait/Landscape)
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)

---

## Maintenance & Updates

### Regular Reviews
- Monthly accessibility audit
- Quarterly performance review
- Bi-annual user testing
- Continuous monitoring of analytics

### Documentation
- Keep this guide updated with changes
- Document design decisions
- Track user feedback
- Version control for design assets

### Continuous Improvement
- A/B test new features
- Gather user feedback
- Monitor error rates
- Analyze usage patterns

---

## Resources

### Design Tools
- Figma - UI design and prototyping
- Contrast Checker - WCAG compliance
- Lighthouse - Performance auditing
- axe DevTools - Accessibility testing

### Reference Materials
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Material Design: https://material.io/design
- Apple Human Interface Guidelines
- Google Web Fundamentals

### Color Tools
- Coolors - Palette generation
- ColorBox - Accessible color systems
- Who Can Use - Color accessibility checker

---

**Last Updated:** 2025-12-03
**Version:** 1.0.0
**Maintained by:** Development Team
