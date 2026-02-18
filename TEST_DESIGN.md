# TEST_DESIGN.md - Text Diff Editor テスト設計書

## 1. テスト戦略概要

### 1.1 テスト方針
- **npm/bundler不使用**: テストもVanilla JSで実装し、ブラウザ内テストランナーで実行
- **テストランナー**: 自前の軽量テストランナー（`tests/test-runner.html`）
- **カバレッジ目標**: 全体80%以上、クリティカルパス100%
- **テストファースト**: 各モジュールの実装前にテスト設計を完了

### 1.2 テストレベル

| レベル | 範囲 | 目標カバレッジ | 実行方法 |
|--------|------|-------------|---------|
| ユニットテスト | 各モジュール単体 | 80-95% | test-runner.html |
| 統合テスト | モジュール間連携 | 70-80% | test-runner.html |
| E2Eテスト | ユーザーフロー全体 | 主要シナリオ | 手動 + test-runner.html |

### 1.3 テストランナー構成

```
tests/
├── test-runner.html          # テスト実行用HTML
├── test-framework.js         # 軽量テストフレームワーク（assert, describe, it）
├── test-helpers.js           # テスト用ヘルパー（DOM生成、モック等）
├── unit/
│   ├── EventBus.test.js      # EventBusユニットテスト
│   ├── EditorManager.test.js # エディターユニットテスト
│   ├── ZoomController.test.js # ズームユニットテスト
│   ├── PanController.test.js  # パンユニットテスト
│   ├── FileManager.test.js   # ファイルI/Oユニットテスト
│   ├── DiffEngine.test.js    # Diffエンジンユニットテスト
│   ├── SplitView.test.js     # 分割ビューユニットテスト
│   ├── SearchManager.test.js  # 検索ユニットテスト
│   ├── ThemeManager.test.js   # テーマユニットテスト
│   └── AutoSave.test.js      # 自動保存ユニットテスト
└── integration/
    ├── zoom-pan.test.js      # ズーム+パン統合テスト
    ├── diff-split.test.js    # Diff+分割ビュー統合テスト
    └── file-edit-save.test.js # ファイル操作統合テスト
```

### 1.4 テストフレームワーク仕様

```javascript
// tests/test-framework.js
// 自前の軽量テストフレームワーク

/**
 * テストスイートを定義する
 * @param {string} name - テストスイート名
 * @param {Function} fn - テスト関数
 */
function describe(name, fn) {}

/**
 * テストケースを定義する
 * @param {string} name - テストケース名
 * @param {Function} fn - テスト関数（async対応）
 */
function it(name, fn) {}

/**
 * 各テスト前に実行するセットアップ
 * @param {Function} fn - セットアップ関数
 */
function beforeEach(fn) {}

/**
 * 各テスト後に実行するクリーンアップ
 * @param {Function} fn - クリーンアップ関数
 */
function afterEach(fn) {}

/**
 * アサーション
 */
const assert = {
  equal(actual, expected, message) {},
  deepEqual(actual, expected, message) {},
  ok(value, message) {},
  notOk(value, message) {},
  throws(fn, message) {},
  doesNotThrow(fn, message) {},
  approximately(actual, expected, tolerance, message) {}
};
```

---

## 2. ユニットテストケース

### 2.1 EventBus テスト（6ケース）

```javascript
describe('EventBus', () => {
  // TC-EB-001: イベントリスナーの登録と発火
  it('should call registered listener when event is emitted', () => {
    // Given: EventBusインスタンスとリスナー
    // When: emit('test', data)
    // Then: リスナーがdataを引数に呼ばれる
  });

  // TC-EB-002: 複数リスナーの登録
  it('should call all registered listeners for the same event', () => {
    // Given: 同じイベントに3つのリスナーを登録
    // When: emit('test', data)
    // Then: 3つ全てが呼ばれる
  });

  // TC-EB-003: リスナーの解除
  it('should not call removed listener', () => {
    // Given: リスナーを登録してからoff()で解除
    // When: emit('test')
    // Then: リスナーは呼ばれない
  });

  // TC-EB-004: once()の動作
  it('should call once listener only once', () => {
    // Given: once()でリスナーを登録
    // When: emit('test')を2回実行
    // Then: リスナーは1回だけ呼ばれる
  });

  // TC-EB-005: 存在しないイベントへのemit
  it('should not throw when emitting event with no listeners', () => {
    // Given: リスナー未登録のイベント
    // When: emit('nonexistent')
    // Then: エラーが発生しない
  });

  // TC-EB-006: destroy後の動作
  it('should not call any listeners after destroy', () => {
    // Given: リスナーを登録後、destroy()
    // When: emit('test')
    // Then: リスナーは呼ばれない
  });
});
```

### 2.2 EditorManager テスト（10ケース）

```javascript
describe('EditorManager', () => {
  // TC-EM-001: テキストの設定と取得
  it('should set and get text content', () => {
    // Given: EditorManagerインスタンス
    // When: setText('Hello World')
    // Then: getText() === 'Hello World'
  });

  // TC-EM-002: 空テキストの処理
  it('should handle empty text correctly', () => {
    // Given: テキストが設定済み
    // When: setText('')
    // Then: getText() === '', getLineCount() === 1
  });

  // TC-EM-003: カーソル位置の取得
  it('should return correct cursor position', () => {
    // Given: setText('line1\nline2\nline3'), カーソルを2行目3列に設定
    // When: getCursorPosition()
    // Then: { line: 2, column: 3 }
  });

  // TC-EM-004: カーソル位置の設定
  it('should set cursor to specified position', () => {
    // Given: setText('line1\nline2')
    // When: setCursorPosition(2, 1)
    // Then: getCursorPosition() === { line: 2, column: 1 }
  });

  // TC-EM-005: 行数の取得
  it('should return correct line count', () => {
    // Given: setText('a\nb\nc\nd')
    // When: getLineCount()
    // Then: 4
  });

  // TC-EM-006: テキスト挿入
  it('should insert text at specified position', () => {
    // Given: setText('Hello World')
    // When: insertText(5, ' Beautiful')
    // Then: getText() === 'Hello Beautiful World'
  });

  // TC-EM-007: テキスト置換
  it('should replace text in specified range', () => {
    // Given: setText('Hello World')
    // When: replaceRange(0, 5, 'Goodbye')
    // Then: getText() === 'Goodbye World'
  });

  // TC-EM-008: 変更時のイベント発火
  it('should emit editor:change on text modification', () => {
    // Given: EventBusにeditor:changeリスナー登録
    // When: textarea.value変更をシミュレート
    // Then: リスナーが呼ばれ、contentが正しい
  });

  // TC-EM-009: 行番号の更新
  it('should update line numbers when text changes', () => {
    // Given: setText('a\nb\nc')
    // When: updateLineNumbers()
    // Then: 行番号コンテナに3つの行番号要素が存在
  });

  // TC-EM-010: フォントサイズの設定
  it('should apply font size to textarea', () => {
    // Given: EditorManagerインスタンス
    // When: setFontSize(24)
    // Then: textarea.style.fontSize === '24px'
  });
});
```

### 2.3 ZoomController テスト（8ケース）

```javascript
describe('ZoomController', () => {
  // TC-ZC-001: デフォルトズームレベル
  it('should initialize with zoom level 1.0', () => {
    // Given: 新しいZoomControllerインスタンス
    // When: getZoom()
    // Then: 1.0
  });

  // TC-ZC-002: ズームインの動作
  it('should increase zoom level by 0.25 on zoomIn()', () => {
    // Given: zoom = 1.0
    // When: zoomIn()
    // Then: getZoom() === 1.25
  });

  // TC-ZC-003: ズームアウトの動作
  it('should decrease zoom level by 0.25 on zoomOut()', () => {
    // Given: zoom = 1.0
    // When: zoomOut()
    // Then: getZoom() === 0.75
  });

  // TC-ZC-004: ズーム上限（400%）
  it('should not exceed max zoom level (4.0)', () => {
    // Given: zoom = 3.9
    // When: zoomIn()
    // Then: getZoom() === 4.0 (clamped)
  });

  // TC-ZC-005: ズーム下限（50%）
  it('should not go below min zoom level (0.5)', () => {
    // Given: zoom = 0.6
    // When: zoomOut()
    // Then: getZoom() === 0.5 (clamped)
  });

  // TC-ZC-006: CSS transformの適用
  it('should apply CSS transform scale to container', () => {
    // Given: ZoomControllerインスタンス
    // When: setZoom(1.5)
    // Then: container.style.transform === 'scale(1.5)'
  });

  // TC-ZC-007: ズームリセット
  it('should reset zoom to 1.0 on resetZoom()', () => {
    // Given: zoom = 2.0
    // When: resetZoom()
    // Then: getZoom() === 1.0
  });

  // TC-ZC-008: wheelイベントのctrlKey検出
  it('should zoom on wheel event with ctrlKey', () => {
    // Given: ZoomControllerインスタンス
    // When: wheel event { ctrlKey: true, deltaY: -100 }
    // Then: ズームレベルが変化する（> 1.0）
  });
});
```

### 2.4 PanController テスト（6ケース）

```javascript
describe('PanController', () => {
  // TC-PC-001: パンモードの開始
  it('should start panning on Alt+mousedown', () => {
    // Given: PanControllerインスタンス
    // When: mousedown event { altKey: true }
    // Then: isPanning() === true
  });

  // TC-PC-002: Altキーなしではパンしない
  it('should not pan without Alt key', () => {
    // Given: PanControllerインスタンス
    // When: mousedown event { altKey: false }
    // Then: isPanning() === false
  });

  // TC-PC-003: パン中のスクロール更新
  it('should update scroll position during pan', () => {
    // Given: パンモード中
    // When: mousemove event { movementX: 10, movementY: 20 }
    // Then: container.scrollLeftが減少、container.scrollTopが減少
  });

  // TC-PC-004: パンモードの終了
  it('should stop panning on mouseup', () => {
    // Given: パンモード中
    // When: mouseup event
    // Then: isPanning() === false
  });

  // TC-PC-005: パン位置のリセット
  it('should reset scroll position on reset()', () => {
    // Given: スクロール位置が変更済み
    // When: reset()
    // Then: container.scrollLeft === 0, container.scrollTop === 0
  });

  // TC-PC-006: 無効化中はパンしない
  it('should not pan when disabled', () => {
    // Given: disable()済み
    // When: Alt+mousedown
    // Then: isPanning() === false
  });
});
```

### 2.5 FileManager テスト（8ケース）

```javascript
describe('FileManager', () => {
  // TC-FM-001: File System Access APIのサポート検出
  it('should detect File System Access API support', () => {
    // Given: FileManagerインスタンス
    // When: isNativeSupported()
    // Then: ブラウザに応じてtrue/false
  });

  // TC-FM-002: 新規テキスト作成
  it('should create new file state', () => {
    // Given: FileManagerインスタンス
    // When: createNew('left')
    // Then: getFileName('left') === 'Untitled'
  });

  // TC-FM-003: ファイル名の取得
  it('should return correct file name', () => {
    // Given: ファイルオープン後
    // When: getFileName('left')
    // Then: オープンしたファイル名
  });

  // TC-FM-004: フォールバック保存（Blobダウンロード）
  it('should create download link for fallback save', () => {
    // Given: File System Access API非対応環境
    // When: saveFile('left', 'content')
    // Then: aタグが一時生成されclick()が呼ばれる
  });

  // TC-FM-005: file:openイベントの発火
  it('should emit file:open event after opening file', () => {
    // Given: file:openリスナー登録
    // When: ファイルオープン（モック）
    // Then: { panelId, name, content } が渡される
  });

  // TC-FM-006: file:savedイベントの発火
  it('should emit file:saved event after saving', () => {
    // Given: file:savedリスナー登録
    // When: 保存実行（モック）
    // Then: { panelId, name } が渡される
  });

  // TC-FM-007: ドロップファイルの処理
  it('should read dropped file content', async () => {
    // Given: FileManagerインスタンス
    // When: handleDrop('left', mockFile)
    // Then: { name, content } が返される
  });

  // TC-FM-008: 未対応ファイルタイプの警告
  it('should warn for non-text files', async () => {
    // Given: バイナリファイル（image/png等）
    // When: handleDrop('left', binaryFile)
    // Then: toast:showイベントで警告通知
  });
});
```

### 2.6 DiffEngine テスト（10ケース）

```javascript
describe('DiffEngine', () => {
  // TC-DE-001: 同一テキストのdiff
  it('should return no changes for identical texts', () => {
    // Given: textA === textB
    // When: computeLineDiff(textA, textB)
    // Then: changes全てがtype: 'equal', stats: { added: 0, deleted: 0, modified: 0 }
  });

  // TC-DE-002: 行追加の検出
  it('should detect added lines', () => {
    // Given: textA = 'a\nb', textB = 'a\nc\nb'
    // When: computeLineDiff(textA, textB)
    // Then: changesに { type: 'add', contentRight: 'c' } が含まれる
  });

  // TC-DE-003: 行削除の検出
  it('should detect deleted lines', () => {
    // Given: textA = 'a\nb\nc', textB = 'a\nc'
    // When: computeLineDiff(textA, textB)
    // Then: changesに { type: 'delete', contentLeft: 'b' } が含まれる
  });

  // TC-DE-004: 行変更の検出
  it('should detect modified lines', () => {
    // Given: textA = 'hello', textB = 'world'
    // When: computeLineDiff(textA, textB)
    // Then: changesに { type: 'modify' } が含まれる
  });

  // TC-DE-005: 行内文字差分の計算
  it('should compute inline character diffs', () => {
    // Given: lineA = 'Hello World', lineB = 'Hello Earth'
    // When: computeInlineDiff(lineA, lineB)
    // Then: [{type:'equal',text:'Hello '},{type:'delete',text:'World'},{type:'add',text:'Earth'}]
  });

  // TC-DE-006: 空テキストのdiff
  it('should handle empty text correctly', () => {
    // Given: textA = '', textB = 'new line'
    // When: computeLineDiff(textA, textB)
    // Then: 全行がtype: 'add'
  });

  // TC-DE-007: 統計の正確性
  it('should compute correct diff stats', () => {
    // Given: 既知の差分を持つ2つのテキスト
    // When: computeStats(changes)
    // Then: { added, deleted, modified, unchanged } が正確
  });

  // TC-DE-008: 大きなテキストの非同期diff
  it('should compute diff asynchronously for large texts', async () => {
    // Given: 10000行のtextAとtextB
    // When: computeAsync(textA, textB)
    // Then: 正しいDiffResultが返される
  });

  // TC-DE-009: 複数行の連続変更
  it('should detect consecutive changes correctly', () => {
    // Given: textA = 'a\nb\nc\nd', textB = 'a\nx\ny\nd'
    // When: computeLineDiff(textA, textB)
    // Then: bとcがdeleted、xとyがaddedまたはmodified
  });

  // TC-DE-010: 改行コードの違い（LF vs CRLF）
  it('should handle different line endings', () => {
    // Given: textA = 'a\nb', textB = 'a\r\nb'
    // When: computeLineDiff(textA, textB)
    // Then: 差分なし（改行コードは正規化して比較）
  });
});
```

### 2.7 SplitView テスト（6ケース）

```javascript
describe('SplitView', () => {
  // TC-SV-001: デフォルトは単一パネル
  it('should start in single panel mode', () => {
    // Given: 新しいSplitViewインスタンス
    // When: isSplit()
    // Then: false
  });

  // TC-SV-002: 分割モードの切り替え
  it('should toggle split mode', () => {
    // Given: isSplit() === false
    // When: toggle()
    // Then: isSplit() === true、右パネルが表示される
  });

  // TC-SV-003: 分割比率の設定
  it('should set split ratio within bounds', () => {
    // Given: 分割モードON
    // When: setSplitRatio(0.7)
    // Then: getSplitRatio() === 0.7
  });

  // TC-SV-004: 分割比率の範囲制限
  it('should clamp split ratio to 0.2-0.8', () => {
    // Given: 分割モードON
    // When: setSplitRatio(0.1)
    // Then: getSplitRatio() === 0.2
  });

  // TC-SV-005: パネル要素の取得
  it('should return correct pane elements', () => {
    // Given: 分割モードON
    // When: getPane('left'), getPane('right')
    // Then: それぞれ対応するDOM要素
  });

  // TC-SV-006: 分割イベントの発火
  it('should emit split:toggle event', () => {
    // Given: split:toggleリスナー登録
    // When: toggle()
    // Then: { enabled: true } が通知される
  });
});
```

### 2.8 SearchManager テスト（8ケース）

```javascript
describe('SearchManager', () => {
  // TC-SM-001: 基本検索
  it('should find all occurrences of a string', () => {
    // Given: テキスト 'hello world hello'
    // When: find('hello')
    // Then: { matches: [{start:0,end:5}, {start:12,end:17}], total: 2 }
  });

  // TC-SM-002: 大文字小文字を区別しない検索
  it('should find case-insensitive matches', () => {
    // Given: テキスト 'Hello HELLO hello'
    // When: find('hello', { caseSensitive: false })
    // Then: total: 3
  });

  // TC-SM-003: 大文字小文字を区別する検索
  it('should find case-sensitive matches only', () => {
    // Given: テキスト 'Hello HELLO hello'
    // When: find('hello', { caseSensitive: true })
    // Then: total: 1
  });

  // TC-SM-004: 正規表現検索
  it('should find regex matches', () => {
    // Given: テキスト 'foo123 bar456'
    // When: find('\\d+', { useRegex: true })
    // Then: total: 2
  });

  // TC-SM-005: 無効な正規表現のエラーハンドリング
  it('should handle invalid regex gracefully', () => {
    // Given: 不正な正規表現
    // When: find('[invalid', { useRegex: true })
    // Then: エラーなし、total: 0
  });

  // TC-SM-006: 次/前の一致箇所への移動
  it('should navigate to next/previous match', () => {
    // Given: 3つの一致箇所
    // When: findNext() x3, findPrevious() x1
    // Then: インデックスが 0→1→2→0, 0→2
  });

  // TC-SM-007: 単一置換
  it('should replace current match', () => {
    // Given: テキスト 'hello world', 検索 'hello'
    // When: replace('goodbye')
    // Then: テキスト 'goodbye world'
  });

  // TC-SM-008: 全置換
  it('should replace all matches', () => {
    // Given: テキスト 'aaa bbb aaa', 検索 'aaa'
    // When: replaceAll('ccc')
    // Then: テキスト 'ccc bbb ccc', 返り値: 2
  });
});
```

### 2.9 ThemeManager テスト（6ケース）

```javascript
describe('ThemeManager', () => {
  // TC-TM-001: デフォルトテーマ
  it('should default to light theme', () => {
    // Given: 新しいThemeManagerインスタンス（localStorage空）
    // When: getTheme()
    // Then: 'light'
  });

  // TC-TM-002: テーマ設定
  it('should set theme and update DOM attribute', () => {
    // Given: ThemeManagerインスタンス
    // When: setTheme('dark')
    // Then: document.documentElement.dataset.theme === 'dark'
  });

  // TC-TM-003: テーマの循環切り替え
  it('should cycle through themes', () => {
    // Given: theme === 'light'
    // When: toggleTheme() x3
    // Then: 'dark' → 'high-contrast' → 'light'
  });

  // TC-TM-004: テーマの永続化
  it('should persist theme to localStorage', () => {
    // Given: ThemeManagerインスタンス
    // When: setTheme('high-contrast')
    // Then: localStorage.getItem('textDiffEditor_theme') === 'high-contrast'
  });

  // TC-TM-005: テーマの復元
  it('should restore theme from localStorage', () => {
    // Given: localStorage.setItem('textDiffEditor_theme', 'dark')
    // When: new ThemeManager()
    // Then: getTheme() === 'dark'
  });

  // TC-TM-006: 利用可能テーマ一覧
  it('should return available themes', () => {
    // Given: ThemeManagerインスタンス
    // When: getAvailableThemes()
    // Then: ['light', 'dark', 'high-contrast']
  });
});
```

### 2.10 AutoSave テスト（6ケース）

```javascript
describe('AutoSave', () => {
  // TC-AS-001: 自動保存の開始
  it('should start auto-save timer', () => {
    // Given: AutoSaveインスタンス
    // When: start(30000)
    // Then: isEnabled() === true
  });

  // TC-AS-002: 自動保存の停止
  it('should stop auto-save timer', () => {
    // Given: 自動保存実行中
    // When: stop()
    // Then: isEnabled() === false
  });

  // TC-AS-003: タイマーリセット
  it('should reset timer on content change', () => {
    // Given: 自動保存実行中（残り10秒）
    // When: resetTimer()
    // Then: タイマーが30秒にリセット
  });

  // TC-AS-004: 指定時間後に保存イベント発火
  it('should emit file:save after interval', async () => {
    // Given: file:saveリスナー登録、start(100)（テスト用に短い間隔）
    // When: 100ms + α 待機
    // Then: file:saveイベントが発火
  });

  // TC-AS-005: 未変更時は保存しない
  it('should not save when content is not modified', async () => {
    // Given: modified === false
    // When: 自動保存タイマー発火
    // Then: file:saveイベントは発火しない
  });

  // TC-AS-006: destroy後はタイマーが停止
  it('should clear timer on destroy', () => {
    // Given: 自動保存実行中
    // When: destroy()
    // Then: タイマーがクリアされている
  });
});
```

---

## 3. 統合テストケース

### 3.1 ズーム+パン統合テスト（5ケース）

```javascript
describe('Integration: Zoom + Pan', () => {
  // TC-INT-ZP-001: ズーム後にパンが正しく動作する
  it('should allow panning after zoom', () => {
    // Given: ズームレベル2.0に設定
    // When: Alt+ドラッグでパン
    // Then: スクロール位置が変化する
  });

  // TC-INT-ZP-002: パン中にズームが正しく動作する
  it('should maintain pan state during zoom change', () => {
    // Given: パンでスクロール済み
    // When: ピンチズーム
    // Then: スクロール位置が適切に調整される
  });

  // TC-INT-ZP-003: ズームリセット後のパンリセット
  it('should reset pan on zoom reset', () => {
    // Given: ズーム2.0 + パンで右下にスクロール
    // When: resetZoom()
    // Then: パン位置もリセットされる
  });

  // TC-INT-ZP-004: ズームレベルのEventBus伝播
  it('should propagate zoom level via EventBus', () => {
    // Given: StatusBarがzoom:changeを監視
    // When: ZoomController.zoomIn()
    // Then: StatusBarのズーム表示が更新される
  });

  // TC-INT-ZP-005: ズーム時のCSS transform値の正確性
  it('should apply correct CSS transform values', () => {
    // Given: container要素
    // When: setZoom(1.5, 100, 200)
    // Then: transform-originとscaleが正しい値
  });
});
```

### 3.2 Diff+分割ビュー統合テスト（5ケース）

```javascript
describe('Integration: Diff + SplitView', () => {
  // TC-INT-DS-001: 分割モードでdiff自動計算
  it('should compute diff when both panels have content', () => {
    // Given: 分割モードON、左右にテキスト設定
    // When: 右パネルのテキストを変更
    // Then: diff:resultイベントが発火し、差分が計算される
  });

  // TC-INT-DS-002: スクロール同期
  it('should sync scroll between panels', () => {
    // Given: 分割モードON、スクロール同期ON
    // When: 左パネルをスクロール
    // Then: 右パネルも同じ位置にスクロール
  });

  // TC-INT-DS-003: テーマ切り替え後の差分表示維持
  it('should maintain diff highlights after theme change', () => {
    // Given: 差分表示中
    // When: テーマをdarkに切り替え
    // Then: 差分ハイライトが正しい色で再描画
  });

  // TC-INT-DS-004: 分割モード解除時のdiffクリア
  it('should clear diff when exiting split mode', () => {
    // Given: 差分表示中
    // When: toggle()で分割解除
    // Then: diff:clearイベントが発火、差分ハイライトが消える
  });

  // TC-INT-DS-005: 差分ナビゲーション
  it('should navigate to next/prev diff chunk', () => {
    // Given: 5つの差分チャンク
    // When: diff:navigate { direction: 'next' } x3
    // Then: 3番目の差分チャンクにスクロール
  });
});
```

### 3.3 ファイル操作統合テスト（5ケース）

```javascript
describe('Integration: File + Editor + Save', () => {
  // TC-INT-FE-001: ファイルオープン→編集→保存フロー
  it('should support open-edit-save workflow', async () => {
    // Given: モックファイル
    // When: openFile → setText → saveFile
    // Then: file:open, editor:change, file:savedイベントが順序通り発火
  });

  // TC-INT-FE-002: 未保存変更の検出
  it('should detect unsaved changes', () => {
    // Given: ファイルオープン済み
    // When: テキストを編集
    // Then: file:modifiedイベント { modified: true }
  });

  // TC-INT-FE-003: 保存後の未保存フラグクリア
  it('should clear modified flag after save', async () => {
    // Given: 未保存変更あり
    // When: saveFile()
    // Then: file:modifiedイベント { modified: false }
  });

  // TC-INT-FE-004: 自動保存の統合
  it('should auto-save after configured interval', async () => {
    // Given: 自動保存30秒設定、テキスト変更
    // When: 30秒経過
    // Then: saveFile()が呼ばれる
  });

  // TC-INT-FE-005: ドラッグ&ドロップでファイルオープン
  it('should open file via drag and drop', async () => {
    // Given: File オブジェクト
    // When: dropイベントをシミュレート
    // Then: file:openイベントが発火し、エディターにコンテンツ表示
  });
});
```

---

## 4. E2Eテストシナリオ

### 4.1 ファイルを開く→編集→保存の一連フロー

```
シナリオ: E2E-001 ファイル操作フロー
前提条件: アプリが起動済み

ステップ:
1. ツールバーの「Open」ボタンをクリック
   → 期待結果: ファイル選択ダイアログが表示される

2. テキストファイルを選択
   → 期待結果: エディターにファイル内容が表示される
   → 期待結果: ステータスバーにファイル名が表示される
   → 期待結果: 未保存インジケーターが非表示

3. テキストを編集（数文字追加）
   → 期待結果: 編集がリアルタイムに反映される
   → 期待結果: 未保存インジケーター(●)が表示される
   → 期待結果: カーソル位置が更新される

4. Cmd+S で保存
   → 期待結果: トースト「保存しました」が表示される
   → 期待結果: 未保存インジケーターが非表示になる

5. ブラウザをリロード
   → 期待結果: エディターが空（ファイル内容はセキュリティ上復元しない）
   → 期待結果: テーマやフォント設定は復元される
```

### 4.2 2ファイル比較フロー

```
シナリオ: E2E-002 Diff比較フロー
前提条件: アプリが起動済み、1つ目のファイルを開いている

ステップ:
1. ツールバーの「Split」ボタンをクリック
   → 期待結果: 画面が左右に分割される
   → 期待結果: スプリッターが表示される
   → 期待結果: 右パネルが空のエディターで表示される

2. 右パネルでファイルを開く
   → 期待結果: 右パネルにファイル内容が表示される
   → 期待結果: 差分がハイライト表示される（追加=緑、削除=赤、変更=黄）
   → 期待結果: ステータスバーに差分サマリーが表示される（+N -M ~L）

3. スプリッターをドラッグして分割比率を変更
   → 期待結果: 左右のパネルサイズが変更される
   → 期待結果: テキスト表示が正しくリフローされる

4. スクロール同期で下方向にスクロール
   → 期待結果: 両パネルが同時にスクロールする
   → 期待結果: 差分ハイライトが正しく維持される

5. 「次の差分」ボタンをクリック（または F7）
   → 期待結果: 次の差分チャンクにジャンプ
   → 期待結果: 差分チャンクがフォーカスハイライトされる
   → 期待結果: ステータスバーに「差分 X/Y」と表示

6. 右パネルのテキストを編集
   → 期待結果: diff が再計算される
   → 期待結果: 差分ハイライトが更新される
   → 期待結果: 差分サマリーが更新される

7. 分割モードを解除（「Split」ボタン再クリック）
   → 期待結果: 右パネルが非表示になる
   → 期待結果: 左パネルが全幅に拡大する
   → 期待結果: 差分ハイライトがクリアされる
```

### 4.3 ズームとドラッグの操作フロー

```
シナリオ: E2E-003 ズーム&パン操作フロー
前提条件: テキストファイルが開いている

ステップ:
1. Magic Mouse でピンチアウト（ズームイン）
   → 期待結果: テキストがマウスカーソル位置を中心に拡大
   → 期待結果: ステータスバーのズーム率が更新される
   → 期待結果: アニメーションが滑らか（60fps）

2. ツールバーのズームプリセット「200%」をクリック
   → 期待結果: ズームが即座に200%に変更
   → 期待結果: ステータスバーに「200%」と表示

3. Alt+ドラッグでパン操作
   → 期待結果: カーソルが grab → grabbing に変化
   → 期待結果: テキスト表示位置がドラッグ方向に移動
   → 期待結果: マウスを離すと慣性で少し滑る

4. ズーム状態でテキストを編集
   → 期待結果: テキスト入力が正常に機能
   → 期待結果: カーソル位置が正確

5. ステータスバーのズーム率をクリック（またはCmd+0）
   → 期待結果: ズームが100%にリセット
   → 期待結果: アニメーション付きでリセット

6. ピンチインで50%まで縮小
   → 期待結果: 50%で下限ストップ
   → 期待結果: テキスト全体が俯瞰できる
```

### 4.4 テーマ・フォント設定フロー

```
シナリオ: E2E-004 設定変更フロー
前提条件: アプリが起動済み

ステップ:
1. ツールバーのテーマボタンをクリック
   → 期待結果: テーマがDarkに切り替わる
   → 期待結果: 背景色、テキスト色が変更される
   → 期待結果: フェードトランジションが動作

2. 再度テーマボタンをクリック
   → 期待結果: テーマがHigh Contrastに切り替わる
   → 期待結果: フォントサイズが大きくなる（20px）
   → 期待結果: テキストが太字になる

3. 設定パネルを開く
   → 期待結果: 設定パネルが表示される
   → 期待結果: 現在の設定値が正しく表示される

4. フォントサイズスライダーを24pxに変更
   → 期待結果: エディターのフォントサイズがリアルタイムに変更
   → 期待結果: 行番号のサイズも連動

5. ブラウザをリロード
   → 期待結果: テーマがHigh Contrastのまま
   → 期待結果: フォントサイズが24pxのまま
   → 期待結果: その他の設定も復元される
```

### 4.5 検索・置換フロー

```
シナリオ: E2E-005 検索・置換フロー
前提条件: テキストファイルが開いている

ステップ:
1. Cmd+F で検索バーを表示
   → 期待結果: 検索バーが表示される
   → 期待結果: 検索入力フィールドにフォーカス

2. 検索文字列を入力（例: "function"）
   → 期待結果: 一致箇所がハイライト表示される
   → 期待結果: 「3/15 件一致」のようにカウント表示

3. Enterキーで次の一致箇所にジャンプ
   → 期待結果: 次の一致箇所にスクロール
   → 期待結果: カウントが更新される（4/15）

4. Cmd+H で置換モードに切り替え
   → 期待結果: 置換入力フィールドが表示される

5. 置換文字列を入力して「置換」ボタン
   → 期待結果: 現在の一致箇所が置換される
   → 期待結果: 一致数が更新される

6. 「すべて置換」ボタン
   → 期待結果: 残りすべての一致箇所が置換される
   → 期待結果: 「N件置換しました」のトースト表示

7. Escapeキーで検索バーを閉じる
   → 期待結果: 検索バーが非表示になる
   → 期待結果: ハイライトがクリアされる
```

---

## 5. クリティカルパステストマトリックス

クリティカルパス上の機能は100%テストカバレッジを必須とする。

| 機能 | テストレベル | テストケース数 | カバレッジ目標 | 優先度 |
|------|------------|-------------|-------------|--------|
| EventBus | ユニット | 6 | 95% | 最高 |
| DiffEngine | ユニット | 10 | 95% | 最高 |
| ZoomController | ユニット | 8 | 90% | 最高 |
| FileManager | ユニット | 8 | 85% | 高 |
| EditorManager | ユニット | 10 | 85% | 高 |
| PanController | ユニット | 6 | 85% | 高 |
| SearchManager | ユニット | 8 | 85% | 高 |
| SplitView | ユニット | 6 | 80% | 高 |
| ThemeManager | ユニット | 6 | 80% | 中 |
| AutoSave | ユニット | 6 | 80% | 中 |
| ズーム+パン統合 | 統合 | 5 | 70% | 高 |
| Diff+分割統合 | 統合 | 5 | 70% | 高 |
| ファイル操作統合 | 統合 | 5 | 70% | 高 |
| **合計** | | **89** | **80%+** | |

---

## 6. テスト実行方法

### 6.1 ブラウザテスト（メイン）

```bash
# テストランナーHTMLをブラウザで開く
open tests/test-runner.html
# → ブラウザ内でテストが自動実行され、結果が表示される
```

### 6.2 テスト結果表示形式

```
=================================
Text Diff Editor - Test Results
=================================

✅ EventBus (6/6 passed)
  ✅ should call registered listener when event is emitted
  ✅ should call all registered listeners for the same event
  ✅ should not call removed listener
  ✅ should call once listener only once
  ✅ should not throw when emitting event with no listeners
  ✅ should not call any listeners after destroy

✅ EditorManager (10/10 passed)
  ...

❌ ZoomController (7/8 passed, 1 failed)
  ...
  ❌ should zoom on wheel event with ctrlKey
     Expected: zoom > 1.0
     Actual: zoom = 1.0
     at ZoomController.test.js:78

=================================
Total: 85/89 passed (95.5%)
Failed: 4
Time: 1.2s
=================================
```
