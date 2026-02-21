import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../hooks/useUndoRedo';

describe('useUndoRedo', () => {
  it('should start with empty stacks', () => {
    const { result } = renderHook(() => useUndoRedo());
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });

  it('should push state and enable undo', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useUndoRedo());

    act(() => {
      result.current.pushState('hello');
    });

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.canUndo()).toBe(true);
    vi.useRealTimers();
  });

  it('should undo to previous state', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useUndoRedo());

    act(() => {
      result.current.pushState('hello');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    let undoneValue: string | null = null;
    act(() => {
      undoneValue = result.current.undo('hello');
    });

    expect(undoneValue).toBe('');
    expect(result.current.canRedo()).toBe(true);
    vi.useRealTimers();
  });

  it('should redo after undo', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useUndoRedo());

    act(() => {
      result.current.pushState('hello');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    act(() => {
      result.current.undo('hello');
    });

    let redoneValue: string | null = null;
    act(() => {
      redoneValue = result.current.redo('');
    });

    expect(redoneValue).toBe('hello');
    vi.useRealTimers();
  });

  it('should return null when nothing to undo', () => {
    const { result } = renderHook(() => useUndoRedo());
    let value: string | null = null;
    act(() => {
      value = result.current.undo('current');
    });
    expect(value).toBeNull();
  });

  it('should return null when nothing to redo', () => {
    const { result } = renderHook(() => useUndoRedo());
    let value: string | null = null;
    act(() => {
      value = result.current.redo('current');
    });
    expect(value).toBeNull();
  });
});
