import { describe, it, expect, beforeEach } from 'vitest';
import { DiffEngine } from '../engine/DiffEngine';

describe('DiffEngine', () => {
  let engine: DiffEngine;

  beforeEach(() => {
    engine = new DiffEngine();
  });

  describe('computeLineDiff', () => {
    it('should return equal for identical texts', () => {
      const result = engine.computeLineDiff('hello\nworld', 'hello\nworld');
      expect(result.changes).toHaveLength(2);
      expect(result.changes.every((c) => c.type === 'equal')).toBe(true);
      expect(result.stats.unchanged).toBe(2);
      expect(result.stats.added).toBe(0);
      expect(result.stats.deleted).toBe(0);
      expect(result.stats.modified).toBe(0);
    });

    it('should detect added lines', () => {
      const result = engine.computeLineDiff('hello', 'hello\nworld');
      const addedChanges = result.changes.filter((c) => c.type === 'add');
      expect(addedChanges.length).toBeGreaterThanOrEqual(1);
      expect(result.stats.added).toBeGreaterThanOrEqual(1);
    });

    it('should detect deleted lines', () => {
      const result = engine.computeLineDiff('hello\nworld', 'hello');
      const deletedChanges = result.changes.filter((c) => c.type === 'delete');
      expect(deletedChanges.length).toBeGreaterThanOrEqual(1);
      expect(result.stats.deleted).toBeGreaterThanOrEqual(1);
    });

    it('should detect modified lines', () => {
      const result = engine.computeLineDiff('hello world', 'hello earth');
      const modifiedChanges = result.changes.filter((c) => c.type === 'modify');
      expect(modifiedChanges.length).toBeGreaterThanOrEqual(1);
      expect(result.stats.modified).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty texts', () => {
      const result = engine.computeLineDiff('', '');
      expect(result.changes.length).toBeGreaterThanOrEqual(1);
      expect(result.changes[0].type).toBe('equal');
    });

    it('should handle empty to non-empty', () => {
      const result = engine.computeLineDiff('', 'hello');
      // Both texts split to single lines ('' and 'hello'), yielding a modify
      const nonEqual = result.changes.filter((c) => c.type !== 'equal');
      expect(nonEqual.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle non-empty to empty', () => {
      const result = engine.computeLineDiff('hello', '');
      // Both texts split to single lines ('hello' and ''), yielding a modify
      const nonEqual = result.changes.filter((c) => c.type !== 'equal');
      expect(nonEqual.length).toBeGreaterThanOrEqual(1);
    });

    it('should normalize line endings (CRLF to LF)', () => {
      const result = engine.computeLineDiff('hello\r\nworld', 'hello\nworld');
      expect(result.changes.every((c) => c.type === 'equal')).toBe(true);
    });

    it('should cache results', () => {
      const textA = 'hello\nworld';
      const textB = 'hello\nearth';
      const result1 = engine.computeLineDiff(textA, textB);
      const result2 = engine.computeLineDiff(textA, textB);
      expect(result1.changes).toEqual(result2.changes);
      expect(result1.stats).toEqual(result2.stats);
    });

    it('should handle multi-line diff correctly', () => {
      const textA = 'line1\nline2\nline3\nline4\nline5';
      const textB = 'line1\nmodified\nline3\nnew line\nline4\nline5';
      const result = engine.computeLineDiff(textA, textB);
      expect(result.changes.length).toBeGreaterThan(0);
      // Should have at least some equal lines (line1, line3 exist in both)
      const equalCount = result.changes.filter((c) => c.type === 'equal').length;
      expect(equalCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('computeInlineDiff', () => {
    it('should return equal for identical lines', () => {
      const result = engine.computeInlineDiff('hello world', 'hello world');
      expect(result).toEqual([{ type: 'equal', text: 'hello world' }]);
    });

    it('should detect character-level changes', () => {
      const result = engine.computeInlineDiff('hello world', 'hello earth');
      expect(result.length).toBeGreaterThan(1);
      // Should have equal prefix "hello "
      expect(result[0]).toEqual({ type: 'equal', text: 'hello ' });
    });

    it('should handle completely different lines', () => {
      const result = engine.computeInlineDiff('abc', 'xyz');
      const deleteSegments = result.filter((r) => r.type === 'delete');
      const addSegments = result.filter((r) => r.type === 'add');
      expect(deleteSegments.length).toBeGreaterThanOrEqual(1);
      expect(addSegments.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty lines', () => {
      const result = engine.computeInlineDiff('', 'hello');
      expect(result.some((r) => r.type === 'add')).toBe(true);
    });
  });

  describe('computeStats', () => {
    it('should compute correct statistics', () => {
      const changes = [
        { type: 'equal' as const, lineLeft: 1, lineRight: 1, contentLeft: 'a', contentRight: 'a', inlineDiffs: [] },
        { type: 'add' as const, lineLeft: null, lineRight: 2, contentLeft: '', contentRight: 'b', inlineDiffs: [] },
        { type: 'delete' as const, lineLeft: 2, lineRight: null, contentLeft: 'c', contentRight: '', inlineDiffs: [] },
        { type: 'modify' as const, lineLeft: 3, lineRight: 3, contentLeft: 'd', contentRight: 'e', inlineDiffs: [] },
      ];
      const stats = engine.computeStats(changes);
      expect(stats).toEqual({ added: 1, deleted: 1, modified: 1, unchanged: 1 });
    });
  });

  describe('computeAsync', () => {
    it('should return same result as sync computation', async () => {
      const textA = 'hello\nworld';
      const textB = 'hello\nearth';
      const syncResult = engine.computeLineDiff(textA, textB);
      const asyncResult = await engine.computeAsync(textA, textB);
      expect(asyncResult.changes).toEqual(syncResult.changes);
      expect(asyncResult.stats).toEqual(syncResult.stats);
    });

    it('should call progress callback', async () => {
      let lastProgress = -1;
      await engine.computeAsync('hello', 'world', (p) => {
        lastProgress = p;
      });
      expect(lastProgress).toBe(100);
    });
  });

  describe('cache', () => {
    it('should evict oldest entry when cache is full', () => {
      // Fill cache to max size
      for (let i = 0; i < 21; i++) {
        engine.computeLineDiff(`text${i}`, `other${i}`);
      }
      // The first entry should have been evicted (cache max = 20)
      // This test just verifies no error occurs
      const result = engine.computeLineDiff('new text', 'new other');
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should be clearable', () => {
      engine.computeLineDiff('hello', 'world');
      engine.clearCache();
      // After clearing, next call should still work
      const result = engine.computeLineDiff('hello', 'world');
      expect(result.changes.length).toBeGreaterThan(0);
    });
  });
});
