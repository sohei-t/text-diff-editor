# DiffEngine - Myers Diff Algorithm

Pure TypeScript implementation of the Myers diff algorithm for computing line-level and character-level text differences.

## Algorithm

The engine uses the **Myers shortest edit script** algorithm with O(D(N+M)) time complexity, where D is the edit distance and N, M are the lengths of the two input texts.

## API

### `computeLineDiff(textA: string, textB: string): DiffResult`
Compute line-level differences between two texts.

Returns `{ changes: DiffChange[], stats: DiffStats }` where:
- `changes`: Array of line operations (equal, add, delete, modify)
- `stats`: Summary counts `{ added, deleted, modified, unchanged }`

### `computeInlineDiff(lineA: string, lineB: string): InlineDiff[]`
Compute character-level differences within a single line pair using LCS (Longest Common Subsequence).

### `computeAsync(textA: string, textB: string): Promise<DiffResult>`
Async wrapper for large file comparisons.

## Caching
Results are cached with a 20-item LRU cache. Cache key is derived from text lengths and first 64 characters.

## Performance
- Small files (<1000 lines): < 5ms
- Medium files (1000-10000 lines): < 50ms
- Large files (10000+ lines): Use `computeAsync()` to avoid blocking
