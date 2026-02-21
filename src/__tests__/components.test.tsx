import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBar from '../components/status/StatusBar';
import SearchBar from '../components/search/SearchBar';

describe('StatusBar', () => {
  const defaultProps = {
    fileName: 'test.txt',
    modified: false,
    cursorPosition: { line: 1, column: 1 },
    zoomLevel: 1.0,
    isSplit: false,
    diffStats: null,
    diffNavInfo: null,
    onZoomReset: vi.fn(),
  };

  it('should render file name', () => {
    render(<StatusBar {...defaultProps} />);
    expect(screen.getByText('test.txt')).toBeDefined();
  });

  it('should render cursor position', () => {
    render(<StatusBar {...defaultProps} cursorPosition={{ line: 5, column: 10 }} />);
    expect(screen.getByText('Ln 5, Col 10')).toBeDefined();
  });

  it('should render zoom level', () => {
    render(<StatusBar {...defaultProps} zoomLevel={1.5} />);
    expect(screen.getByText('150%')).toBeDefined();
  });

  it('should show modified indicator when modified', () => {
    const { container } = render(<StatusBar {...defaultProps} modified={true} />);
    const modified = container.querySelector('.status-modified');
    expect(modified).not.toBeNull();
  });

  it('should hide modified indicator when not modified', () => {
    const { container } = render(<StatusBar {...defaultProps} modified={false} />);
    const modified = container.querySelector('.status-modified');
    expect(modified).toBeNull();
  });

  it('should show split indicator when split', () => {
    render(<StatusBar {...defaultProps} isSplit={true} />);
    expect(screen.getByText('Split')).toBeDefined();
  });

  it('should show diff stats', () => {
    render(
      <StatusBar
        {...defaultProps}
        diffStats={{ added: 3, deleted: 1, modified: 2, unchanged: 10 }}
      />
    );
    expect(screen.getByText('+3 -1 ~2 (6 changes)')).toBeDefined();
  });

  it('should show diff navigation info', () => {
    render(
      <StatusBar
        {...defaultProps}
        diffStats={{ added: 3, deleted: 1, modified: 2, unchanged: 10 }}
        diffNavInfo={{ index: 1, total: 6 }}
      />
    );
    expect(screen.getByText('Diff 2/6')).toBeDefined();
  });

  it('should call onZoomReset when zoom clicked', () => {
    const onZoomReset = vi.fn();
    render(<StatusBar {...defaultProps} onZoomReset={onZoomReset} />);
    const zoomEl = screen.getByRole('button', { name: /zoom/i });
    fireEvent.click(zoomEl);
    expect(onZoomReset).toHaveBeenCalledTimes(1);
  });
});

describe('SearchBar', () => {
  const defaultProps = {
    isOpen: true,
    showReplace: false,
    query: '',
    caseSensitive: false,
    useRegex: false,
    matches: [],
    currentIndex: -1,
    replaceText: '',
    onQueryChange: vi.fn(),
    onToggleCaseSensitive: vi.fn(),
    onToggleRegex: vi.fn(),
    onFindNext: vi.fn(),
    onFindPrevious: vi.fn(),
    onReplace: vi.fn(),
    onReplaceAll: vi.fn(),
    onReplaceTextChange: vi.fn(),
    onClose: vi.fn(),
  };

  it('should not render when closed', () => {
    const { container } = render(<SearchBar {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render search input when open', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search...')).toBeDefined();
  });

  it('should show match count', () => {
    render(<SearchBar {...defaultProps} query="test" />);
    expect(screen.getByText('No results')).toBeDefined();
  });

  it('should show match navigation', () => {
    render(
      <SearchBar
        {...defaultProps}
        query="test"
        matches={[
          { start: 0, end: 4 },
          { start: 10, end: 14 },
        ]}
        currentIndex={0}
      />
    );
    expect(screen.getByText('1 / 2')).toBeDefined();
  });

  it('should show replace row when showReplace is true', () => {
    render(<SearchBar {...defaultProps} showReplace={true} />);
    expect(screen.getByPlaceholderText('Replace...')).toBeDefined();
  });

  it('should call onQueryChange on input', () => {
    const onQueryChange = vi.fn();
    render(<SearchBar {...defaultProps} onQueryChange={onQueryChange} />);
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'test' },
    });
    expect(onQueryChange).toHaveBeenCalledWith('test');
  });

  it('should call onClose on close button click', () => {
    const onClose = vi.fn();
    render(<SearchBar {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onFindNext on next button click', () => {
    const onFindNext = vi.fn();
    render(<SearchBar {...defaultProps} onFindNext={onFindNext} />);
    fireEvent.click(screen.getByTitle('Next Match'));
    expect(onFindNext).toHaveBeenCalled();
  });

  it('should call onFindPrevious on prev button click', () => {
    const onFindPrevious = vi.fn();
    render(<SearchBar {...defaultProps} onFindPrevious={onFindPrevious} />);
    fireEvent.click(screen.getByTitle('Previous Match'));
    expect(onFindPrevious).toHaveBeenCalled();
  });
});
