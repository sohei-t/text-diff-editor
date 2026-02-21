import type { DiffChange, DiffResult, DiffStats, InlineDiff } from '../types';

interface DiffOp {
  type: 'equal' | 'delete' | 'add';
  lineA?: number;
  lineB?: number;
}

interface CacheEntry {
  changes: DiffChange[];
  stats: DiffStats;
  _fullKeyA: string;
  _fullKeyB: string;
}

/**
 * DiffEngine - Myers Diff Algorithm Implementation (pure TypeScript port).
 *
 * Computes line-level diffs using the Myers shortest edit script algorithm,
 * with character-level inline diffs via LCS for modified lines.
 */
export class DiffEngine {
  private _cache: Map<string, CacheEntry> = new Map();
  private _cacheMaxSize = 20;

  /**
   * Compute a line-level diff between two texts.
   * Results are cached for repeated comparisons.
   */
  computeLineDiff(textA: string, textB: string): DiffResult {
    const cacheKey =
      textA.length + ':' + textB.length + ':' + textA.slice(0, 64) + ':' + textB.slice(0, 64);
    const cached = this._cache.get(cacheKey);
    if (cached && cached._fullKeyA === textA && cached._fullKeyB === textB) {
      return { changes: cached.changes, stats: cached.stats };
    }

    const linesA = this._normalizeAndSplit(textA);
    const linesB = this._normalizeAndSplit(textB);

    const ops = this._myersDiff(linesA, linesB);
    const changes = this._buildChanges(ops, linesA, linesB);
    const stats = this.computeStats(changes);

    if (this._cache.size >= this._cacheMaxSize) {
      const firstKey = this._cache.keys().next().value;
      if (firstKey !== undefined) {
        this._cache.delete(firstKey);
      }
    }
    this._cache.set(cacheKey, { changes, stats, _fullKeyA: textA, _fullKeyB: textB });

    return { changes, stats };
  }

  private _normalizeAndSplit(text: string): string[] {
    if (!text && text !== '') return [''];
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  }

  private _myersDiff(a: string[], b: string[]): DiffOp[] {
    const N = a.length;
    const M = b.length;
    const MAX = N + M;
    const v = new Array<number>(2 * MAX + 1).fill(0);
    v[MAX + 1] = 0;
    const trace: number[][] = [];

    for (let d = 0; d <= MAX; d++) {
      const newV = v.slice();
      for (let k = -d; k <= d; k += 2) {
        let x: number;
        if (k === -d || (k !== d && v[MAX + k - 1] < v[MAX + k + 1])) {
          x = v[MAX + k + 1];
        } else {
          x = v[MAX + k - 1] + 1;
        }
        let y = x - k;

        while (x < N && y < M && a[x] === b[y]) {
          x++;
          y++;
        }

        newV[MAX + k] = x;

        if (x >= N && y >= M) {
          trace.push(newV);
          return this._backtrack(trace, MAX, N, M);
        }
      }
      trace.push(newV.slice());
      for (let k = -d; k <= d; k += 2) {
        v[MAX + k] = newV[MAX + k];
      }
    }

    return [];
  }

  private _backtrack(trace: number[][], MAX: number, N: number, M: number): DiffOp[] {
    let x = N;
    let y = M;
    const ops: DiffOp[] = [];

    for (let d = trace.length - 1; d >= 0; d--) {
      const k = x - y;

      let prevK: number;
      if (
        k === -d ||
        (k !== d && (d > 0 ? trace[d - 1][MAX + k - 1] : 0) < (d > 0 ? trace[d - 1][MAX + k + 1] : 0))
      ) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = d > 0 ? trace[d - 1][MAX + prevK] : 0;
      const prevY = prevX - prevK;

      // Diagonal moves (equal)
      while (x > prevX + (prevK < k ? 1 : 0) && y > prevY + (prevK < k ? 0 : 1)) {
        x--;
        y--;
        ops.unshift({ type: 'equal', lineA: x, lineB: y });
      }

      if (d > 0) {
        if (prevK < k) {
          x--;
          ops.unshift({ type: 'delete', lineA: x });
        } else {
          y--;
          ops.unshift({ type: 'add', lineB: y });
        }
      }

      // Diagonal moves before the edit
      while (x > prevX && y > prevY) {
        x--;
        y--;
        ops.unshift({ type: 'equal', lineA: x, lineB: y });
      }
    }

    return ops;
  }

  private _buildChanges(ops: DiffOp[], linesA: string[], linesB: string[]): DiffChange[] {
    const changes: DiffChange[] = [];
    let i = 0;

    while (i < ops.length) {
      const op = ops[i];

      if (op.type === 'equal') {
        changes.push({
          type: 'equal',
          lineLeft: (op.lineA ?? 0) + 1,
          lineRight: (op.lineB ?? 0) + 1,
          contentLeft: linesA[op.lineA ?? 0],
          contentRight: linesB[op.lineB ?? 0],
          inlineDiffs: [],
        });
        i++;
      } else if (op.type === 'delete' && i + 1 < ops.length && ops[i + 1].type === 'add') {
        const delOp = op;
        const addOp = ops[i + 1];
        const inlineDiffs = this.computeInlineDiff(
          linesA[delOp.lineA ?? 0],
          linesB[addOp.lineB ?? 0]
        );
        changes.push({
          type: 'modify',
          lineLeft: (delOp.lineA ?? 0) + 1,
          lineRight: (addOp.lineB ?? 0) + 1,
          contentLeft: linesA[delOp.lineA ?? 0],
          contentRight: linesB[addOp.lineB ?? 0],
          inlineDiffs,
        });
        i += 2;
      } else if (op.type === 'delete') {
        changes.push({
          type: 'delete',
          lineLeft: (op.lineA ?? 0) + 1,
          lineRight: null,
          contentLeft: linesA[op.lineA ?? 0],
          contentRight: '',
          inlineDiffs: [],
        });
        i++;
      } else if (op.type === 'add') {
        changes.push({
          type: 'add',
          lineLeft: null,
          lineRight: (op.lineB ?? 0) + 1,
          contentLeft: '',
          contentRight: linesB[op.lineB ?? 0],
          inlineDiffs: [],
        });
        i++;
      } else {
        i++;
      }
    }

    if (changes.length === 0 && (linesA.length > 0 || linesB.length > 0)) {
      if (linesA.join('') === '' && linesB.join('') === '') {
        changes.push({
          type: 'equal',
          lineLeft: 1,
          lineRight: 1,
          contentLeft: '',
          contentRight: '',
          inlineDiffs: [],
        });
      }
    }

    return changes;
  }

  /**
   * Compute character-level inline diff between two lines using LCS.
   */
  computeInlineDiff(lineA: string, lineB: string): InlineDiff[] {
    if (lineA === lineB) {
      return [{ type: 'equal', text: lineA }];
    }

    const result: InlineDiff[] = [];
    const charsA = lineA.split('');
    const charsB = lineB.split('');

    const lcs = this._lcs(charsA, charsB);
    let idxA = 0;
    let idxB = 0;
    let idxL = 0;

    while (idxA < charsA.length || idxB < charsB.length) {
      if (
        idxL < lcs.length &&
        idxA < charsA.length &&
        charsA[idxA] === lcs[idxL] &&
        idxB < charsB.length &&
        charsB[idxB] === lcs[idxL]
      ) {
        let eq = '';
        while (
          idxL < lcs.length &&
          idxA < charsA.length &&
          idxB < charsB.length &&
          charsA[idxA] === lcs[idxL] &&
          charsB[idxB] === lcs[idxL]
        ) {
          eq += charsA[idxA];
          idxA++;
          idxB++;
          idxL++;
        }
        if (eq) result.push({ type: 'equal', text: eq });
      } else {
        let del = '';
        while (idxA < charsA.length && (idxL >= lcs.length || charsA[idxA] !== lcs[idxL])) {
          del += charsA[idxA];
          idxA++;
        }
        if (del) result.push({ type: 'delete', text: del });

        let add = '';
        while (idxB < charsB.length && (idxL >= lcs.length || charsB[idxB] !== lcs[idxL])) {
          add += charsB[idxB];
          idxB++;
        }
        if (add) result.push({ type: 'add', text: add });
      }
    }

    return result;
  }

  private _lcs(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result: string[] = [];
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.unshift(a[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    return result;
  }

  /** Compute summary statistics from a list of change objects. */
  computeStats(changes: DiffChange[]): DiffStats {
    const stats: DiffStats = { added: 0, deleted: 0, modified: 0, unchanged: 0 };
    for (const c of changes) {
      switch (c.type) {
        case 'add':
          stats.added++;
          break;
        case 'delete':
          stats.deleted++;
          break;
        case 'modify':
          stats.modified++;
          break;
        case 'equal':
          stats.unchanged++;
          break;
      }
    }
    return stats;
  }

  /**
   * Async diff computation for large files.
   * Uses setTimeout to yield to the main thread.
   */
  async computeAsync(
    textA: string,
    textB: string,
    onProgress?: (percent: number) => void
  ): Promise<DiffResult> {
    return new Promise((resolve) => {
      if (onProgress) onProgress(0);
      setTimeout(() => {
        const result = this.computeLineDiff(textA, textB);
        if (onProgress) onProgress(100);
        resolve(result);
      }, 0);
    });
  }

  /** Clear the diff result cache. */
  clearCache(): void {
    this._cache.clear();
  }
}
