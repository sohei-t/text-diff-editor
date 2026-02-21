import { describe, it, expect, vi } from 'vitest';
import { clamp } from '../utils/clamp';
import { debounce, throttle } from '../utils/debounce';
import { escapeHtml, escapeRegex, formatFileSize, formatTimeAgo } from '../utils/format';

describe('clamp', () => {
  it('should return value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should clamp to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should clamp to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle equal min and max', () => {
    expect(clamp(5, 5, 5)).toBe(5);
  });
});

describe('debounce', () => {
  it('should delay function execution', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should reset timer on subsequent calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('throttle', () => {
  it('should call function immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throttle subsequent calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('escapeHtml', () => {
  it('should escape special HTML characters', () => {
    expect(escapeHtml('<div class="test">&</div>')).toBe(
      '&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;'
    );
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle string with no special chars', () => {
    expect(escapeHtml('hello')).toBe('hello');
  });
});

describe('escapeRegex', () => {
  it('should escape regex special characters', () => {
    expect(escapeRegex('a.b+c*d?e^f$g{h}i|j(k)l[m]n\\o')).toBe(
      'a\\.b\\+c\\*d\\?e\\^f\\$g\\{h\\}i\\|j\\(k\\)l\\[m\\]n\\\\o'
    );
  });

  it('should handle normal text', () => {
    expect(escapeRegex('hello world')).toBe('hello world');
  });
});

describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('should format with decimal', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('formatTimeAgo', () => {
  it('should show "Just now" for less than a minute', () => {
    expect(formatTimeAgo(Date.now() - 30000)).toBe('Just now');
  });

  it('should show minutes ago', () => {
    expect(formatTimeAgo(Date.now() - 300000)).toBe('5m ago');
  });

  it('should show hours ago', () => {
    expect(formatTimeAgo(Date.now() - 7200000)).toBe('2h ago');
  });

  it('should show days ago', () => {
    expect(formatTimeAgo(Date.now() - 172800000)).toBe('2d ago');
  });
});
