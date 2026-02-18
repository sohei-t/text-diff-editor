# API_DESIGN.md - Text Diff Editor モジュール間インターフェース定義

## 1. 概要

本アプリはバックエンドを持たない純粋なフロントエンドアプリケーションである。
本ドキュメントでは、JavaScriptモジュール間のパブリックAPIとEventBusイベントを定義する。

---

## 2. EventBus イベント一覧

すべてのモジュール間通信はEventBusを介して行う。

### 2.1 ファイル関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `file:new` | Toolbar, FileManager | `{ panelId: string }` | 新規テキスト作成 |
| `file:open` | FileManager | `{ panelId: string, name: string, content: string, handle: FileSystemFileHandle\|null }` | ファイル読み込み完了 |
| `file:save` | Toolbar, AutoSave | `{ panelId: string }` | 保存要求 |
| `file:saved` | FileManager | `{ panelId: string, name: string }` | 保存完了通知 |
| `file:save-as` | Toolbar | `{ panelId: string }` | 名前を付けて保存要求 |
| `file:modified` | EditorManager | `{ panelId: string, modified: boolean }` | 内容変更通知 |
| `file:error` | FileManager | `{ panelId: string, error: string, action: string }` | ファイル操作エラー |
| `file:drop` | EditorManager | `{ panelId: string, file: File }` | ファイルドロップ |

### 2.2 エディター関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `editor:change` | EditorManager | `{ panelId: string, content: string }` | テキスト内容変更 |
| `editor:cursor` | EditorManager | `{ panelId: string, line: number, column: number }` | カーソル位置変更 |
| `editor:scroll` | EditorManager | `{ panelId: string, scrollTop: number, scrollLeft: number, scrollHeight: number }` | スクロール位置変更 |
| `editor:focus` | EditorManager | `{ panelId: string }` | フォーカス取得 |
| `editor:ready` | EditorManager | `{ panelId: string }` | エディター初期化完了 |

### 2.3 ズーム関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `zoom:change` | ZoomController | `{ level: number, originX: number, originY: number }` | ズームレベル変更 |
| `zoom:reset` | ZoomController, Toolbar | `{}` | ズームリセット要求 |
| `zoom:set` | Toolbar | `{ level: number }` | ズームレベル直接設定 |

### 2.4 パン関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `pan:start` | PanController | `{}` | パンモード開始 |
| `pan:move` | PanController | `{ deltaX: number, deltaY: number }` | パン移動中 |
| `pan:end` | PanController | `{}` | パンモード終了 |

### 2.5 分割表示関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `split:toggle` | Toolbar, SplitView | `{ enabled: boolean }` | 分割モードトグル |
| `split:resize` | SplitView | `{ ratio: number }` | 分割比率変更 |
| `split:sync-scroll` | Toolbar | `{ enabled: boolean }` | スクロール同期トグル |

### 2.6 Diff関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `diff:compute` | EditorManager, SplitView | `{ textLeft: string, textRight: string }` | diff計算要求 |
| `diff:result` | DiffEngine | `{ changes: DiffChunk[], stats: DiffStats }` | diff計算結果 |
| `diff:navigate` | Toolbar | `{ direction: 'next'\|'prev' }` | 差分ナビゲーション |
| `diff:clear` | SplitView | `{}` | diff結果クリア |

### 2.7 検索関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `search:open` | Toolbar | `{ replace: boolean }` | 検索バー表示 |
| `search:close` | SearchManager | `{}` | 検索バー非表示 |
| `search:find` | SearchManager | `{ query: string, caseSensitive: boolean, useRegex: boolean }` | 検索実行 |
| `search:result` | SearchManager | `{ matches: Array<{start, end}>, total: number, current: number }` | 検索結果 |
| `search:navigate` | SearchManager | `{ direction: 'next'\|'prev', position: {start, end} }` | 次/前の一致箇所 |
| `search:replace` | SearchManager | `{ from: string, to: string, all: boolean }` | 置換実行 |

### 2.8 テーマ・設定関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `theme:change` | ThemeManager, Toolbar | `{ theme: 'light'\|'dark'\|'high-contrast' }` | テーマ変更 |
| `settings:open` | Toolbar | `{}` | 設定パネル表示 |
| `settings:close` | SettingsManager | `{}` | 設定パネル非表示 |
| `settings:change` | SettingsManager | `{ key: string, value: any }` | 設定値変更 |

### 2.9 通知関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `toast:show` | 各モジュール | `{ message: string, type: 'success'\|'error'\|'warning'\|'info', duration: number }` | トースト通知表示 |

### 2.10 ツールバー関連イベント

| イベント名 | 発行元 | ペイロード | 説明 |
|-----------|--------|-----------|------|
| `toolbar:action` | Toolbar | `{ action: string, params: object }` | ツールバーアクション（汎用） |

---

## 3. 主要クラスのパブリックAPI

### 3.1 EventBus

```javascript
class EventBus {
  /**
   * イベントリスナーを登録する
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   * @returns {Function} 登録解除用の関数
   */
  on(event, callback) {}

  /**
   * イベントリスナーを解除する
   * @param {string} event - イベント名
   * @param {Function} callback - 登録時のコールバック
   */
  off(event, callback) {}

  /**
   * イベントを発火する
   * @param {string} event - イベント名
   * @param {*} data - ペイロード
   */
  emit(event, data) {}

  /**
   * 一度だけ発火するリスナーを登録する
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  once(event, callback) {}

  /**
   * すべてのリスナーを解除する
   */
  destroy() {}
}
```

### 3.2 EditorManager

```javascript
class EditorManager {
  /**
   * @param {HTMLTextAreaElement} textarea - テキストエリア要素
   * @param {HTMLElement} lineNumbersContainer - 行番号コンテナ
   * @param {string} panelId - パネル識別子 ('left' | 'right')
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(textarea, lineNumbersContainer, panelId, eventBus) {}

  /**
   * テキスト内容を取得する
   * @returns {string} テキスト内容
   */
  getText() {}

  /**
   * テキスト内容を設定する
   * @param {string} text - 設定するテキスト
   */
  setText(text) {}

  /**
   * 選択範囲を取得する
   * @returns {{ start: number, end: number, text: string }}
   */
  getSelection() {}

  /**
   * カーソル位置を取得する
   * @returns {{ line: number, column: number }}
   */
  getCursorPosition() {}

  /**
   * カーソルを指定位置に移動する
   * @param {number} line - 行番号（1始まり）
   * @param {number} column - 列番号（1始まり）
   */
  setCursorPosition(line, column) {}

  /**
   * 指定位置にテキストを挿入する
   * @param {number} position - 挿入位置
   * @param {string} text - 挿入テキスト
   */
  insertText(position, text) {}

  /**
   * 指定範囲のテキストを置換する
   * @param {number} start - 開始位置
   * @param {number} end - 終了位置
   * @param {string} replacement - 置換テキスト
   */
  replaceRange(start, end, replacement) {}

  /**
   * 元に戻す
   */
  undo() {}

  /**
   * やり直し
   */
  redo() {}

  /**
   * 行番号を再描画する
   */
  updateLineNumbers() {}

  /**
   * 行数を取得する
   * @returns {number} 行数
   */
  getLineCount() {}

  /**
   * 指定位置までスクロールする
   * @param {number} line - 行番号
   */
  scrollToLine(line) {}

  /**
   * 差分ハイライトを適用する
   * @param {DiffChunk[]} changes - 差分チャンクリスト
   */
  applyDiffHighlights(changes) {}

  /**
   * 差分ハイライトをクリアする
   */
  clearDiffHighlights() {}

  /**
   * フォントサイズを設定する
   * @param {number} size - フォントサイズ（px）
   */
  setFontSize(size) {}

  /**
   * フォントファミリーを設定する
   * @param {string} fontFamily - CSS font-family値
   */
  setFontFamily(fontFamily) {}

  /**
   * 行間を設定する
   * @param {number} lineHeight - CSS line-height値
   */
  setLineHeight(lineHeight) {}

  /**
   * 折り返しモードを設定する
   * @param {boolean} wrap - 折り返しON/OFF
   */
  setWordWrap(wrap) {}

  /**
   * フォーカスを設定する
   */
  focus() {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.3 ZoomController

```javascript
class ZoomController {
  /**
   * @param {HTMLElement} container - ズーム対象のコンテナ要素
   * @param {EventBus} eventBus - イベントバス
   * @param {object} options - オプション
   * @param {number} [options.minZoom=0.5] - 最小ズームレベル
   * @param {number} [options.maxZoom=4.0] - 最大ズームレベル
   * @param {number} [options.zoomStep=0.05] - ピンチ1段階の変化量
   */
  constructor(container, eventBus, options = {}) {}

  /**
   * ズームインする（25%刻み）
   */
  zoomIn() {}

  /**
   * ズームアウトする（25%刻み）
   */
  zoomOut() {}

  /**
   * ズームレベルを設定する
   * @param {number} level - ズームレベル（0.5 ~ 4.0）
   * @param {number} [originX] - ズーム中心X座標（クライアント座標）
   * @param {number} [originY] - ズーム中心Y座標（クライアント座標）
   */
  setZoom(level, originX, originY) {}

  /**
   * 現在のズームレベルを取得する
   * @returns {number} ズームレベル
   */
  getZoom() {}

  /**
   * ズームをリセットする（100%に戻す、アニメーション付き）
   */
  resetZoom() {}

  /**
   * wheelイベントハンドラー（Magic Mouseピンチ検出）
   * @param {WheelEvent} event
   */
  handleWheel(event) {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.4 PanController

```javascript
class PanController {
  /**
   * @param {HTMLElement} container - パン対象のコンテナ要素
   * @param {EventBus} eventBus - イベントバス
   * @param {object} options - オプション
   * @param {number} [options.friction=0.95] - 慣性の摩擦係数
   */
  constructor(container, eventBus, options = {}) {}

  /**
   * パンモードを有効化する
   */
  enable() {}

  /**
   * パンモードを無効化する
   */
  disable() {}

  /**
   * パン位置をリセットする（スクロール位置を0,0に戻す）
   */
  reset() {}

  /**
   * パン中かどうか
   * @returns {boolean}
   */
  isPanning() {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.5 FileManager

```javascript
class FileManager {
  /**
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(eventBus) {}

  /**
   * ファイルを開くダイアログを表示する
   * @param {string} panelId - 対象パネルID
   * @returns {Promise<{name: string, content: string, handle: FileSystemFileHandle|null}>}
   */
  async openFile(panelId) {}

  /**
   * ファイルを保存する（上書き）
   * @param {string} panelId - 対象パネルID
   * @param {string} content - 保存内容
   * @returns {Promise<boolean>} 成功フラグ
   */
  async saveFile(panelId, content) {}

  /**
   * 名前を付けて保存する
   * @param {string} panelId - 対象パネルID
   * @param {string} content - 保存内容
   * @param {string} [suggestedName] - 推奨ファイル名
   * @returns {Promise<{name: string, handle: FileSystemFileHandle|null}>}
   */
  async saveAsFile(panelId, content, suggestedName) {}

  /**
   * 新規テキストを作成する
   * @param {string} panelId - 対象パネルID
   */
  createNew(panelId) {}

  /**
   * ドロップされたファイルを処理する
   * @param {string} panelId - 対象パネルID
   * @param {File} file - ドロップされたファイル
   * @returns {Promise<{name: string, content: string}>}
   */
  async handleDrop(panelId, file) {}

  /**
   * File System Access APIがサポートされているか
   * @returns {boolean}
   */
  isNativeSupported() {}

  /**
   * ファイル名を取得する
   * @param {string} panelId - 対象パネルID
   * @returns {string} ファイル名
   */
  getFileName(panelId) {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.6 DiffEngine

```javascript
class DiffEngine {
  /**
   * 行単位のdiffを計算する
   * @param {string} textA - 左側テキスト
   * @param {string} textB - 右側テキスト
   * @returns {DiffResult} diff結果
   *
   * @typedef {Object} DiffResult
   * @property {DiffChunk[]} changes - 差分チャンクリスト
   * @property {DiffStats} stats - 差分統計
   *
   * @typedef {Object} DiffChunk
   * @property {'add'|'delete'|'modify'|'equal'} type - 差分タイプ
   * @property {number|null} lineLeft - 左側行番号
   * @property {number|null} lineRight - 右側行番号
   * @property {string} contentLeft - 左側テキスト
   * @property {string} contentRight - 右側テキスト
   * @property {InlineDiff[]} inlineDiffs - 行内差分（modifyのみ）
   *
   * @typedef {Object} InlineDiff
   * @property {'equal'|'add'|'delete'} type
   * @property {string} text
   *
   * @typedef {Object} DiffStats
   * @property {number} added - 追加行数
   * @property {number} deleted - 削除行数
   * @property {number} modified - 変更行数
   * @property {number} unchanged - 変更なし行数
   */
  computeLineDiff(textA, textB) {}

  /**
   * 行内の文字単位diffを計算する
   * @param {string} lineA - 左側行テキスト
   * @param {string} lineB - 右側行テキスト
   * @returns {InlineDiff[]} 行内差分リスト
   */
  computeInlineDiff(lineA, lineB) {}

  /**
   * diff統計を計算する
   * @param {DiffChunk[]} changes - 差分チャンクリスト
   * @returns {DiffStats} 差分統計
   */
  computeStats(changes) {}

  /**
   * 大ファイル用の非同期diff計算
   * @param {string} textA - 左側テキスト
   * @param {string} textB - 右側テキスト
   * @param {Function} [onProgress] - 進捗コールバック (0-100)
   * @returns {Promise<DiffResult>} diff結果
   */
  async computeAsync(textA, textB, onProgress) {}
}
```

### 3.7 SplitView

```javascript
class SplitView {
  /**
   * @param {HTMLElement} container - 分割ビューのコンテナ
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(container, eventBus) {}

  /**
   * 分割モードをトグルする
   */
  toggle() {}

  /**
   * 分割モードを設定する
   * @param {boolean} enabled - 分割ON/OFF
   */
  setSplit(enabled) {}

  /**
   * 分割比率を設定する
   * @param {number} ratio - 分割比率（0.2 ~ 0.8）
   */
  setSplitRatio(ratio) {}

  /**
   * 分割比率を取得する
   * @returns {number} 分割比率
   */
  getSplitRatio() {}

  /**
   * パネル要素を取得する
   * @param {'left'|'right'} side - パネル側
   * @returns {HTMLElement} パネル要素
   */
  getPane(side) {}

  /**
   * 分割モードかどうか
   * @returns {boolean}
   */
  isSplit() {}

  /**
   * スクロール同期のON/OFF
   * @param {boolean} enabled
   */
  setSyncScroll(enabled) {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.8 SearchManager

```javascript
class SearchManager {
  /**
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(eventBus) {}

  /**
   * 検索バーを表示する
   * @param {boolean} [showReplace=false] - 置換モード表示
   */
  open(showReplace) {}

  /**
   * 検索バーを非表示にする
   */
  close() {}

  /**
   * 検索を実行する
   * @param {string} query - 検索文字列
   * @param {object} options
   * @param {boolean} [options.caseSensitive=false] - 大文字小文字区別
   * @param {boolean} [options.useRegex=false] - 正規表現モード
   * @returns {{ matches: Array<{start, end}>, total: number }}
   */
  find(query, options) {}

  /**
   * 次の一致箇所に移動する
   * @returns {{ start: number, end: number, index: number }}
   */
  findNext() {}

  /**
   * 前の一致箇所に移動する
   * @returns {{ start: number, end: number, index: number }}
   */
  findPrevious() {}

  /**
   * 現在の一致箇所を置換する
   * @param {string} replacement - 置換テキスト
   */
  replace(replacement) {}

  /**
   * すべての一致箇所を置換する
   * @param {string} replacement - 置換テキスト
   * @returns {number} 置換数
   */
  replaceAll(replacement) {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.9 ThemeManager

```javascript
class ThemeManager {
  /**
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(eventBus) {}

  /**
   * テーマを設定する
   * @param {'light'|'dark'|'high-contrast'} theme - テーマ名
   */
  setTheme(theme) {}

  /**
   * 現在のテーマを取得する
   * @returns {'light'|'dark'|'high-contrast'} テーマ名
   */
  getTheme() {}

  /**
   * 利用可能なテーマ一覧を取得する
   * @returns {string[]} テーマ名配列
   */
  getAvailableThemes() {}

  /**
   * テーマを次のテーマに切り替える（循環）
   */
  toggleTheme() {}

  /**
   * OSのシステムテーマを取得する
   * @returns {'light'|'dark'} システムテーマ
   */
  getSystemTheme() {}

  /**
   * システムテーマ連動を設定する
   * @param {boolean} enabled
   */
  setSystemThemeSync(enabled) {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.10 AutoSave

```javascript
class AutoSave {
  /**
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(eventBus) {}

  /**
   * 自動保存を開始する
   * @param {number} intervalMs - 保存間隔（ミリ秒）
   */
  start(intervalMs) {}

  /**
   * 自動保存を停止する
   */
  stop() {}

  /**
   * 自動保存タイマーをリセットする（内容変更時に呼ぶ）
   */
  resetTimer() {}

  /**
   * 自動保存が有効かどうか
   * @returns {boolean}
   */
  isEnabled() {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.11 Toast

```javascript
class Toast {
  /**
   * @param {HTMLElement} container - トースト表示コンテナ
   */
  constructor(container) {}

  /**
   * トースト通知を表示する
   * @param {string} message - メッセージ
   * @param {'success'|'error'|'warning'|'info'} [type='info'] - 通知タイプ
   * @param {number} [duration=3000] - 表示時間（ミリ秒）。0=手動消去のみ
   */
  show(message, type, duration) {}

  /**
   * すべてのトースト通知を消去する
   */
  clearAll() {}
}
```

### 3.12 Toolbar

```javascript
class Toolbar {
  /**
   * @param {HTMLElement} container - ツールバー要素
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(container, eventBus) {}

  /**
   * ファイル名を更新する
   * @param {string} name - ファイル名
   */
  updateFileName(name) {}

  /**
   * ズーム率を更新する
   * @param {number} level - ズームレベル
   */
  updateZoomLevel(level) {}

  /**
   * 分割モード表示を更新する
   * @param {boolean} enabled - 分割ON/OFF
   */
  updateSplitState(enabled) {}

  /**
   * テーマアイコンを更新する
   * @param {string} theme - テーマ名
   */
  updateThemeIcon(theme) {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.13 StatusBar

```javascript
class StatusBar {
  /**
   * @param {HTMLElement} container - ステータスバー要素
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(container, eventBus) {}

  /**
   * カーソル位置を更新する
   * @param {number} line - 行番号
   * @param {number} column - 列番号
   */
  updateCursorPosition(line, column) {}

  /**
   * ファイル名を更新する
   * @param {string} name - ファイル名
   */
  updateFileName(name) {}

  /**
   * ズーム率を更新する
   * @param {number} level - ズームレベル
   */
  updateZoomLevel(level) {}

  /**
   * 未保存インジケーターを更新する
   * @param {boolean} modified - 変更あり/なし
   */
  updateModifiedIndicator(modified) {}

  /**
   * Diff統計を更新する
   * @param {DiffStats} stats - 差分統計
   */
  updateDiffStats(stats) {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

### 3.14 SettingsManager

```javascript
class SettingsManager {
  /**
   * @param {HTMLElement} container - 設定パネル要素
   * @param {EventBus} eventBus - イベントバス
   */
  constructor(container, eventBus) {}

  /**
   * 設定パネルを表示する
   */
  open() {}

  /**
   * 設定パネルを非表示にする
   */
  close() {}

  /**
   * 設定値を取得する
   * @param {string} key - 設定キー
   * @returns {*} 設定値
   */
  get(key) {}

  /**
   * 設定値を設定する（localStorageに保存）
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   */
  set(key, value) {}

  /**
   * すべての設定を取得する
   * @returns {object} 設定オブジェクト
   */
  getAll() {}

  /**
   * 設定をデフォルトに戻す
   */
  resetToDefaults() {}

  /**
   * localStorageから設定を読み込む
   */
  loadSettings() {}

  /**
   * リソースを解放する
   */
  destroy() {}
}
```

---

## 4. データフロー図

### 4.1 ファイルオープンフロー

```
User Click (Open)
     │
     ├── Toolbar emits 'toolbar:action' { action: 'open', params: { panelId: 'left' } }
     │
     ├── App catches → calls FileManager.openFile('left')
     │       │
     │       ├── [Native] showOpenFilePicker() → handle → file.text() → content
     │       └── [Fallback] input[type=file] → FileReader → content
     │
     ├── FileManager emits 'file:open' { panelId, name, content, handle }
     │
     ├── EditorManager listens → setText(content)
     │       └── emits 'editor:change' → triggers diff if split mode
     │
     ├── Toolbar listens → updateFileName(name)
     │
     └── StatusBar listens → updateFileName(name), updateModifiedIndicator(false)
```

### 4.2 ズーム操作フロー

```
User Pinch (Magic Mouse)
     │
     ├── wheel event { ctrlKey: true, deltaY }
     │
     ├── ZoomController.handleWheel(event)
     │       ├── event.preventDefault()
     │       ├── newLevel = clamp(current + delta, 0.5, 4.0)
     │       ├── Calculate transform-origin from cursor position
     │       └── requestAnimationFrame → apply CSS transform
     │
     ├── ZoomController emits 'zoom:change' { level, originX, originY }
     │
     ├── StatusBar listens → updateZoomLevel(level)
     │
     └── [Split mode] Other panel's ZoomController syncs
```

### 4.3 Diff計算フロー

```
Text Change in Split Mode
     │
     ├── EditorManager emits 'editor:change' { panelId, content }
     │
     ├── App debounces (150ms) → emits 'diff:compute' { textLeft, textRight }
     │
     ├── DiffEngine listens → computeLineDiff(textLeft, textRight)
     │       ├── [< 10000 lines] Sync computation
     │       └── [>= 10000 lines] Async with setTimeout chunks
     │
     ├── DiffEngine emits 'diff:result' { changes, stats }
     │
     ├── EditorManager(left) listens → applyDiffHighlights(changes)
     ├── EditorManager(right) listens → applyDiffHighlights(changes)
     │
     └── StatusBar listens → updateDiffStats(stats)
```

---

## 5. エラーハンドリングパターン

### 5.1 ファイル操作エラー

```javascript
// エラーイベントのペイロード
{
  panelId: 'left',
  error: 'Permission denied',     // エラーメッセージ
  action: 'save',                 // 'open' | 'save' | 'save-as'
  recoverable: true               // リカバリー可能か
}
```

### 5.2 エラー通知フロー

```
Error occurs in any module
     │
     ├── Module emits 'toast:show' { message, type: 'error', duration: 0 }
     │
     └── Toast listens → displays error notification (manual dismiss)
```

### 5.3 フォールバック戦略

| 機能 | プライマリ | フォールバック |
|------|-----------|---------------|
| ファイルオープン | showOpenFilePicker() | input[type=file] |
| ファイル保存 | createWritable() + write() | Blob + a.download |
| Diff計算 | 同期計算 | setTimeout分割の非同期計算 |
