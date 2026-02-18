# ARCHITECTURE.md - Text Diff Editor (Innovative Approach)

## 1. アーキテクチャ概要

### 1.1 設計思想

本プロジェクトは「**モジュラー・イベント駆動・GPU加速**」の3つの柱に基づいた革新的なアーキテクチャを採用します。

1. **モジュラー構成**: ES Modules による疎結合なコンポーネント設計。各機能が独立しており、テストと拡張が容易。
2. **イベント駆動**: EventBus パターンによるコンポーネント間通信。直接参照を避け、依存関係を最小化。
3. **GPU加速**: CSS `transform: scale()` + `will-change` によるハードウェアアクセラレーション。ズーム操作で60fps維持。

### 1.2 技術スタック

| レイヤー | 技術 | バージョン | 理由 |
|---------|------|-----------|------|
| エディターエンジン | CodeMirror 6 | ^6.x | 高性能、モジュラー、仮想レンダリング |
| ビルドツール | Vite | ^5.x | 高速HMR、ESM対応、優秀なTree-shaking |
| テスト | Vitest | ^1.x | Vite統合、高速、ESM対応 |
| 単一HTML化 | vite-plugin-singlefile | ^0.13 | 全アセットをインライン化 |
| Diffアルゴリズム | diff-match-patch | ^1.0 | Googleの実績あるdiffライブラリ |
| 言語 | Vanilla JavaScript (ES2022+) | - | フレームワーク不要、軽量 |
| スタイリング | CSS Custom Properties + モダンCSS | - | テーマ対応、GPU加速 |

### 1.3 設計原則

```
1. Single Responsibility: 各モジュールは1つの責務のみ
2. Dependency Inversion: EventBusを介した通信で依存を逆転
3. Interface Segregation: CodeMirror 6のAPIは薄いラッパーで抽象化
4. Open/Closed: テーマ・言語拡張はプラグイン的に追加可能
5. Fail-Safe Default: File System Access API非対応時のフォールバック
```

---

## 2. システムアーキテクチャ

### 2.1 レイヤー構成

```
┌──────────────────────────────────────────────────────────┐
│                    Presentation Layer                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Toolbar  │ │StatusBar │ │ Settings │ │  Minimap   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │            │            │              │         │
│  ┌────┴────────────┴────────────┴──────────────┴──────┐  │
│  │                    EventBus                        │  │
│  └────┬────────────┬────────────┬──────────────┬──────┘  │
│       │            │            │              │         │
├───────┼────────────┼────────────┼──────────────┼─────────┤
│       │     Core Layer          │              │         │
│  ┌────┴─────┐ ┌────┴─────┐ ┌───┴──────┐ ┌────┴──────┐  │
│  │  Editor  │ │   Zoom   │ │   Diff   │ │   File    │  │
│  │ Manager  │ │Controller│ │  Engine  │ │  Manager  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬──────┘  │
│       │            │            │              │         │
│  ┌────┴─────┐ ┌────┴─────┐     │         ┌────┴──────┐  │
│  │CodeMirror│ │   Pan    │     │         │ AutoSave  │  │
│  │   6      │ │Controller│     │         │           │  │
│  └──────────┘ └──────────┘     │         └───────────┘  │
│                                │                         │
├────────────────────────────────┼─────────────────────────┤
│              View Layer        │                         │
│  ┌─────────────────────────────┴──────────────────────┐  │
│  │                  SplitView                         │  │
│  │  ┌──────────────────┐  ┌──────────────────┐        │  │
│  │  │  Editor Panel 1  │  │  Editor Panel 2  │        │  │
│  │  │  (CodeMirror 6)  │  │  (CodeMirror 6)  │        │  │
│  │  │  + ZoomContainer │  │  + ZoomContainer │        │  │
│  │  │  + DiffDecor     │  │  + DiffDecor     │        │  │
│  │  └──────────────────┘  └──────────────────┘        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                    Data Layer                             │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │   localStorage   │  │   IndexedDB      │              │
│  │  (設定・テーマ)    │  │  (セッション)     │              │
│  └──────────────────┘  └──────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

### 2.2 コンポーネント図

```
                    main.js (App)
                       │
         ┌─────────────┼──────────────┐
         │             │              │
    EventBus     ThemeManager    Storage
         │             │              │
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │         │   │         │   │         │
EditorMgr  SplitView FileManager Settings
    │         │        │        │
    ├── ZoomCtrl  DiffEngine  AutoSave
    ├── PanCtrl      │
    └── Minimap  DiffView
                     │
              DiffDecorations
              ScrollSync
              DiffNavigator
```

---

## 3. モジュール詳細設計

### 3.1 EventBus（コンポーネント間通信）

```javascript
// src/utils/EventBus.js
/**
 * 軽量イベントバス - Pub/Subパターンでコンポーネント間通信を疎結合化
 *
 * イベント一覧:
 *   'file:open'        - ファイルオープン {name, content, handle}
 *   'file:save'        - ファイル保存要求
 *   'file:modified'    - ファイル内容変更 {panelId, modified}
 *   'zoom:change'      - ズームレベル変更 {level, origin}
 *   'zoom:reset'       - ズームリセット
 *   'theme:change'     - テーマ変更 {theme}
 *   'diff:compute'     - diff計算要求
 *   'diff:result'      - diff計算結果 {changes, stats}
 *   'diff:navigate'    - diff箇所ジャンプ {direction: 'next'|'prev'}
 *   'split:toggle'     - 分割モード切替
 *   'split:resize'     - スプリッター移動 {ratio}
 *   'settings:change'  - 設定変更 {key, value}
 *   'editor:cursor'    - カーソル位置変更 {line, col, panelId}
 *   'scroll:sync'      - スクロール同期 {scrollTop, panelId}
 */
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, callback) { /* ... */ }
  off(event, callback) { /* ... */ }
  emit(event, data) { /* ... */ }
  once(event, callback) { /* ... */ }
}

export const eventBus = new EventBus();
```

### 3.2 EditorManager（CodeMirror 6 ラッパー）

```javascript
// src/editor/EditorManager.js
/**
 * CodeMirror 6 のセットアップと管理
 *
 * 責務:
 *   - EditorView / EditorState の作成・管理
 *   - 拡張のロードと構成（行番号、折り返し、検索、シンタックスハイライト）
 *   - ファイル言語の自動検出
 *   - 大規模ファイルの最適化設定
 *
 * 使用するCodeMirror 6パッケージ:
 *   - @codemirror/state      : EditorState
 *   - @codemirror/view       : EditorView, ViewPlugin, Decoration
 *   - @codemirror/commands   : 標準コマンド
 *   - @codemirror/search     : 検索・置換
 *   - @codemirror/language   : 言語サポート基盤
 *   - @codemirror/lang-*     : 各言語パッケージ
 *   - @codemirror/autocomplete: 自動補完
 */
class EditorManager {
  constructor(container, options = {}) {
    this.container = container;
    this.view = null;
    this.extensions = [];
  }

  // EditorViewを作成
  createEditor(content = '', language = null) { /* ... */ }

  // 内容の取得・設定
  getContent() { /* ... */ }
  setContent(content) { /* ... */ }

  // 言語検出・設定
  detectLanguage(filename) { /* ... */ }
  setLanguage(langId) { /* ... */ }

  // カーソル位置
  getCursorPosition() { /* ... */ }
  setCursorPosition(line, col) { /* ... */ }

  // 拡張の動的追加・削除
  addExtension(extension) { /* ... */ }
  removeExtension(extension) { /* ... */ }

  destroy() { /* ... */ }
}
```

### 3.3 ZoomController（GPU加速ズーム）

```javascript
// src/zoom/ZoomController.js
/**
 * Magic Mouse ピンチズーム + キーボードズームの制御
 *
 * 技術的アプローチ:
 *   1. wheelイベントの ctrlKey フラグでピンチズームを検出
 *   2. CSS transform: scale() でエディターコンテナ全体を拡大縮小
 *   3. transform-origin をマウスカーソル位置に動的設定
 *   4. will-change: transform でGPUレイヤーを事前確保
 *   5. requestAnimationFrame でフレーム同期（60fps維持）
 *
 * ズームの仕組み:
 *   - エディターの親コンテナに CSS transform: scale(zoomLevel) を適用
 *   - transform-origin はマウスカーソルの位置（%, %）に設定
 *   - これにより、カーソル直下のテキストを基準にズームイン/アウト
 *   - CodeMirror 6 の内部レイアウトは変更しない（CSSレベルの変換のみ）
 *
 * パフォーマンス最適化:
 *   - will-change: transform で合成レイヤーを事前確保
 *   - ズーム中は pointer-events: none でイベント処理を削減
 *   - デバウンスではなくrAFスロットリングで滑らかさを維持
 */
class ZoomController {
  constructor(container, options = {}) {
    this.container = container;
    this.zoomLevel = 1.0;
    this.minZoom = 0.5;   // 50%
    this.maxZoom = 4.0;   // 400%
    this.zoomStep = 0.05; // ピンチ1段階あたりの変化量
    this.animationId = null;
  }

  // ピンチズームの検出とハンドリング
  handleWheel(event) {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = -event.deltaY * this.zoomStep;
      this.setZoom(this.zoomLevel + delta, event.clientX, event.clientY);
    }
  }

  // ズームレベルの設定（カーソル位置基準）
  setZoom(level, originX, originY) {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    this.applyTransform(originX, originY);
    eventBus.emit('zoom:change', { level: this.zoomLevel, origin: { x: originX, y: originY } });
  }

  // CSS transform の適用（GPU加速）
  applyTransform(originX, originY) {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(() => {
      const rect = this.container.getBoundingClientRect();
      const percentX = ((originX - rect.left) / rect.width) * 100;
      const percentY = ((originY - rect.top) / rect.height) * 100;
      this.container.style.transformOrigin = `${percentX}% ${percentY}%`;
      this.container.style.transform = `scale(${this.zoomLevel})`;
    });
  }

  // ズームリセット（アニメーション付き）
  resetZoom() { /* ... */ }

  // キーボードショートカット対応
  zoomIn() { this.setZoom(this.zoomLevel + 0.25); }
  zoomOut() { this.setZoom(this.zoomLevel - 0.25); }

  destroy() { /* ... */ }
}
```

### 3.4 PanController（慣性付きドラッグナビゲーション）

```javascript
// src/zoom/PanController.js
/**
 * Alt+ドラッグによるパンナビゲーション
 *
 * 技術的アプローチ:
 *   1. Alt キー押下中のmousedownでパンモード開始
 *   2. mousemove でコンテナの scrollLeft/scrollTop を更新
 *   3. mouseup で慣性アニメーション開始
 *   4. 慣性は速度の指数減衰（摩擦係数: 0.95）
 *
 * テキスト選択との競合回避:
 *   - Alt キーをモディファイアとして使用
 *   - パンモード中は user-select: none を設定
 *   - パンモード終了後に user-select を復元
 */
class PanController {
  constructor(container, options = {}) {
    this.container = container;
    this.isPanning = false;
    this.velocity = { x: 0, y: 0 };
    this.friction = 0.95;
    this.lastPosition = { x: 0, y: 0 };
  }

  handleMouseDown(event) { /* Alt+ドラッグ開始 */ }
  handleMouseMove(event) { /* パン実行 */ }
  handleMouseUp(event) { /* 慣性アニメーション開始 */ }

  // 慣性アニメーション
  startInertia() {
    const animate = () => {
      if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.y) < 0.1) return;
      this.container.scrollLeft -= this.velocity.x;
      this.container.scrollTop -= this.velocity.y;
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  destroy() { /* ... */ }
}
```

### 3.5 DiffEngine（差分計算エンジン）

```javascript
// src/editor/DiffEngine.js
/**
 * diff-match-patch ベースの差分計算エンジン
 *
 * 機能:
 *   1. 行単位の差分計算（Myers diff アルゴリズム）
 *   2. 行内文字単位の差分計算
 *   3. 差分統計（追加/削除/変更行数）
 *   4. 大ファイル対応（Web Worker非同期処理）
 *
 * 出力フォーマット:
 *   {
 *     changes: [
 *       { type: 'add', lineLeft: null, lineRight: 5, content: '...' },
 *       { type: 'delete', lineLeft: 3, lineRight: null, content: '...' },
 *       { type: 'modify', lineLeft: 7, lineRight: 8, contentLeft: '...', contentRight: '...', inlineDiffs: [...] },
 *       { type: 'equal', lineLeft: 10, lineRight: 11, content: '...' }
 *     ],
 *     stats: { added: 5, deleted: 3, modified: 2, unchanged: 100 }
 *   }
 */
class DiffEngine {
  constructor() {
    this.dmp = new diff_match_patch();
  }

  // 行単位diff
  computeLineDiff(textA, textB) { /* ... */ }

  // 行内文字diff
  computeInlineDiff(lineA, lineB) { /* ... */ }

  // 差分統計
  computeStats(changes) { /* ... */ }

  // Web Worker での非同期計算（大ファイル用）
  async computeAsync(textA, textB) { /* ... */ }
}
```

### 3.6 FileManager（File System Access API）

```javascript
// src/file/FileManager.js
/**
 * ファイルの読み書きを管理
 *
 * 技術的アプローチ:
 *   1. File System Access API（Chrome/Edge）: ファイルハンドルの保持・再利用
 *   2. フォールバック（Safari/Firefox）: input[type=file] + Blob ダウンロード
 *   3. ドラッグ&ドロップ: DataTransfer API
 *
 * ファイルハンドル管理:
 *   - openFile() で FileSystemFileHandle を取得・保持
 *   - saveFile() で同じハンドルに上書き保存（権限再要求なし）
 *   - saveAsFile() で新しいハンドルを取得
 *
 * セキュリティ:
 *   - ユーザーの明示的許可のみでファイルアクセス
 *   - ファイルハンドルはメモリ上のみ（永続化しない）
 *   - ファイル内容は一切外部送信しない
 */
class FileManager {
  constructor() {
    this.handles = new Map(); // panelId -> FileSystemFileHandle
    this.supportsFileSystemAccess = 'showOpenFilePicker' in window;
  }

  // ファイルオープン
  async openFile(panelId) {
    if (this.supportsFileSystemAccess) {
      return this.openFileNative(panelId);
    }
    return this.openFileFallback(panelId);
  }

  // File System Access API でオープン
  async openFileNative(panelId) {
    const [handle] = await window.showOpenFilePicker({
      types: [
        { description: 'Text Files', accept: { 'text/*': ['.txt', '.md', '.js', '.ts', '.py', '.json', '.html', '.css', '.yaml', '.yml', '.xml', '.sql', '.sh', '.go', '.rs', '.java', '.c', '.cpp', '.h'] } }
      ]
    });
    this.handles.set(panelId, handle);
    const file = await handle.getFile();
    const content = await file.text();
    return { name: file.name, content, handle };
  }

  // フォールバック（input[type=file]）
  async openFileFallback(panelId) { /* ... */ }

  // 保存（上書き）
  async saveFile(panelId, content) {
    if (this.supportsFileSystemAccess && this.handles.has(panelId)) {
      const handle = this.handles.get(panelId);
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    }
    return this.saveFileFallback(content);
  }

  // 名前を付けて保存
  async saveAsFile(panelId, content) { /* ... */ }

  // フォールバック（Blobダウンロード）
  saveFileFallback(content, filename = 'untitled.txt') { /* ... */ }

  // ドラッグ&ドロップ対応
  handleDrop(event, panelId) { /* ... */ }

  destroy() { /* ... */ }
}
```

### 3.7 SplitView（分割ビュー）

```javascript
// src/ui/SplitView.js
/**
 * 左右分割レイアウト管理
 *
 * 構造:
 *   ┌──────────┬──┬──────────┐
 *   │  Panel 1 │ S│  Panel 2 │
 *   │          │ p│          │
 *   │ (Editor) │ l│ (Editor) │
 *   │          │ i│          │
 *   │          │ t│          │
 *   └──────────┴──┴──────────┘
 *
 * 機能:
 *   - 単一パネル / 分割パネルの切り替え
 *   - スプリッターのドラッグによるリサイズ
 *   - ダブルクリックで50:50にリセット
 *   - 最小幅制限（各パネル200px以上）
 *   - スクロール同期のON/OFF
 *   - ズーム同期
 */
class SplitView {
  constructor(container) {
    this.container = container;
    this.isSplit = false;
    this.ratio = 0.5; // 50:50
    this.panels = { left: null, right: null };
    this.syncScroll = true;
  }

  // 分割モードの切り替え
  toggleSplit() { /* ... */ }

  // スプリッターのドラッグ処理
  handleSplitterDrag(event) { /* ... */ }

  // スクロール同期
  syncScrollPosition(sourcePanel, scrollInfo) { /* ... */ }

  destroy() { /* ... */ }
}
```

### 3.8 ThemeManager（テーマ管理）

```javascript
// src/theme/ThemeManager.js
/**
 * テーマの管理と切り替え
 *
 * テーマ定義（CSS Custom Properties）:
 *   --bg-primary, --bg-secondary, --bg-editor
 *   --text-primary, --text-secondary, --text-muted
 *   --accent-primary, --accent-secondary
 *   --border-color, --shadow-color
 *   --diff-add-bg, --diff-delete-bg, --diff-modify-bg
 *   --font-size-base, --line-height-base
 *   --scrollbar-bg, --scrollbar-thumb
 *
 * テーマ一覧:
 *   1. light: 白背景、黒テキスト（デフォルト）
 *   2. dark: 暗い背景、明るいテキスト
 *   3. high-contrast: 黒背景、大きな白太字テキスト（老眼特化）
 *
 * システム連動:
 *   - prefers-color-scheme メディアクエリ
 *   - 手動選択が優先（localStorage）
 */
class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themes = ['light', 'dark', 'high-contrast'];
  }

  setTheme(theme) { /* ... */ }
  getSystemTheme() { /* ... */ }
  loadSavedTheme() { /* ... */ }

  // CodeMirror 6 のテーマも同期
  getCodeMirrorTheme(theme) { /* ... */ }

  destroy() { /* ... */ }
}
```

---

## 4. データフロー

### 4.1 ファイルオープンフロー

```
User: Cmd+O / ツールバーボタン
  │
  ├→ FileManager.openFile(panelId)
  │     │
  │     ├→ showOpenFilePicker() [Native]
  │     │   or input[type=file] [Fallback]
  │     │
  │     └→ file.text() → content取得
  │
  ├→ eventBus.emit('file:open', { name, content, handle, panelId })
  │
  ├→ EditorManager.setContent(content)
  │     └→ 言語自動検出 → シンタックスハイライト適用
  │
  ├→ Toolbar.updateFileName(name)
  │
  ├→ StatusBar.updateFileInfo(encoding, language)
  │
  └→ [2ファイル目の場合]
        └→ DiffEngine.computeLineDiff(contentA, contentB)
              └→ eventBus.emit('diff:result', { changes, stats })
                    ├→ DiffView.applyDecorations(changes)
                    └→ StatusBar.updateDiffStats(stats)
```

### 4.2 ズーム操作フロー

```
User: Magic Mouse ピンチ
  │
  ├→ wheel event (ctrlKey === true)
  │
  ├→ ZoomController.handleWheel(event)
  │     ├→ event.preventDefault()  // ブラウザズーム抑止
  │     ├→ 新しいzoomLevel計算（50%-400%制限）
  │     ├→ transform-origin をカーソル位置に設定
  │     └→ requestAnimationFrame(() => {
  │           container.style.transform = `scale(${zoomLevel})`
  │         })
  │
  ├→ eventBus.emit('zoom:change', { level, origin })
  │     ├→ StatusBar.updateZoom(level)
  │     └→ [分割モード時] 両パネルに同じzoomLevel適用
  │
  └→ 60fps維持（GPU加速）
```

### 4.3 Diff計算フロー

```
User: 2つ目のファイルを開く / テキスト編集
  │
  ├→ eventBus.emit('diff:compute')
  │
  ├→ DiffEngine.computeLineDiff(textA, textB)
  │     │
  │     ├→ [ファイルサイズ < 10000行]
  │     │     └→ 同期処理（メインスレッド）
  │     │
  │     └→ [ファイルサイズ >= 10000行]
  │           └→ Web Worker で非同期処理
  │                 └→ プログレス表示
  │
  ├→ 行内diff計算（変更行のみ）
  │
  ├→ eventBus.emit('diff:result', { changes, stats })
  │     │
  │     ├→ DiffView: CodeMirror 6 Decoration API で差分ハイライト
  │     │     ├→ 追加行: 緑背景 + "+" マーク
  │     │     ├→ 削除行: 赤背景 + "-" マーク
  │     │     └→ 変更行: 黄背景 + 行内差分ハイライト
  │     │
  │     └→ StatusBar: "+15 -8 ~3" のような差分サマリー
  │
  └→ 差分ナビゲーション（次/前ジャンプ）有効化
```

### 4.4 保存フロー

```
User: Cmd+S
  │
  ├→ EditorManager.getContent()
  │
  ├→ FileManager.saveFile(panelId, content)
  │     │
  │     ├→ [File System Access API]
  │     │     ├→ handle.createWritable()
  │     │     ├→ writable.write(content)
  │     │     └→ writable.close()
  │     │
  │     └→ [フォールバック]
  │           ├→ new Blob([content])
  │           └→ a.download = filename
  │
  ├→ eventBus.emit('file:saved', { panelId })
  │     ├→ StatusBar: 未保存インジケーター消去
  │     └→ Toast: "保存しました" 表示
  │
  └→ AutoSave.resetTimer()
```

---

## 5. CSS アーキテクチャ

### 5.1 ズーム用CSS構造

```css
/* ズーム対応のコンテナ階層 */
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.toolbar {
  /* ツールバーはズームの影響を受けない */
  flex-shrink: 0;
  z-index: 100;
}

.editor-viewport {
  /* ズームが適用されるコンテナ */
  flex: 1;
  overflow: auto;
  position: relative;
}

.editor-zoom-container {
  /* CSS transformが適用される要素 */
  will-change: transform;
  transform-origin: 0 0;
  transition: none; /* ピンチ中はアニメーション無効（60fps維持） */
}

.editor-zoom-container.resetting {
  /* リセット時のみアニメーション有効 */
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.statusbar {
  /* ステータスバーもズームの影響を受けない */
  flex-shrink: 0;
  z-index: 100;
}
```

### 5.2 テーマ用CSS Custom Properties

```css
:root {
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-editor: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-muted: #999999;
  --accent-primary: #0066cc;
  --accent-secondary: #004499;
  --border-color: #e0e0e0;
  --diff-add-bg: #e6ffec;
  --diff-add-text: #1a7f37;
  --diff-delete-bg: #ffebe9;
  --diff-delete-text: #cf222e;
  --diff-modify-bg: #fff8c5;
  --diff-modify-text: #9a6700;
  --font-size-base: 16px;
  --line-height-base: 1.6;
  --font-family-mono: "SF Mono", "Menlo", "Monaco", "Consolas", monospace;
}

[data-theme="dark"] {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-editor: #1e1e1e;
  --text-primary: #d4d4d4;
  --text-secondary: #9d9d9d;
  --text-muted: #6d6d6d;
  --accent-primary: #569cd6;
  --accent-secondary: #4fc1ff;
  --border-color: #3c3c3c;
  --diff-add-bg: #1a3a2a;
  --diff-add-text: #4ec9b0;
  --diff-delete-bg: #3a1a1a;
  --diff-delete-text: #f44747;
  --diff-modify-bg: #3a3a1a;
  --diff-modify-text: #dcdcaa;
}

[data-theme="high-contrast"] {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-editor: #000000;
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-muted: #b0b0b0;
  --accent-primary: #ffff00;
  --accent-secondary: #00ffff;
  --border-color: #ffffff;
  --diff-add-bg: #003300;
  --diff-add-text: #00ff00;
  --diff-delete-bg: #330000;
  --diff-delete-text: #ff0000;
  --diff-modify-bg: #333300;
  --diff-modify-text: #ffff00;
  --font-size-base: 20px;    /* 老眼向けに大きめ */
  --line-height-base: 1.8;   /* 広い行間 */
  --font-family-mono: "SF Mono", "Menlo", monospace;
  font-weight: bold;          /* 太字 */
}
```

---

## 6. パフォーマンス最適化戦略

### 6.1 レンダリング最適化

| 手法 | 適用箇所 | 効果 |
|------|---------|------|
| CSS transform (GPU) | ズーム操作 | メインスレッド負荷ゼロ |
| will-change: transform | ズームコンテナ | 合成レイヤー事前確保 |
| requestAnimationFrame | ズーム/パン | フレーム同期、過剰描画防止 |
| 仮想レンダリング | CodeMirror 6 | 表示範囲のみDOM生成 |
| Content Visibility | 非表示パネル | レンダリングスキップ |

### 6.2 メモリ最適化

| 手法 | 適用箇所 | 効果 |
|------|---------|------|
| CodeMirror 6 仮想化 | エディター | DOM要素を最小化 |
| Web Worker | Diff計算 | メインスレッドブロック回避 |
| 遅延ロード | 言語パッケージ | 初期バンドルサイズ削減 |
| WeakRef | イベントリスナー | メモリリーク防止 |

### 6.3 バンドル最適化

| 手法 | 効果 |
|------|------|
| Tree-shaking (Vite) | 未使用コード除去 |
| 選択的インポート | CodeMirror 6 必要パッケージのみ |
| コード圧縮 (terser) | JS最小化 |
| CSS最小化 (lightningcss) | CSS最小化 |
| 単一HTMLインライン化 | HTTP リクエストゼロ |

---

## 7. エラーハンドリング設計

### 7.1 エラーカテゴリと対応

| カテゴリ | 例 | 対応 |
|---------|-----|------|
| ファイルI/O | 権限拒否、ファイル不在 | ユーザーに通知、リトライ提案 |
| API非対応 | File System Access API | フォールバック実装に切り替え |
| パフォーマンス | 大ファイルでフリーズ | Web Worker + プログレス表示 |
| メモリ | 巨大ファイルでOOM | サイズ警告 + 分割読み込み提案 |
| 状態不整合 | ズーム中のリサイズ | デバウンス + 状態リセット |

### 7.2 ユーザー通知パターン

```
┌─────────────────────────────────────┐
│ Toast通知:                           │
│  - 保存成功: "保存しました" (2秒で消去)  │
│  - エラー: "保存に失敗しました" (手動消去) │
│  - 警告: "大きなファイルです" (5秒で消去)  │
└─────────────────────────────────────┘
```

---

## 8. テスト戦略

### 8.1 テスト対象と優先度

| コンポーネント | テスト種別 | 優先度 | カバレッジ目標 |
|--------------|----------|--------|-------------|
| ZoomController | ユニット | 最高 | 90% |
| PanController | ユニット | 高 | 85% |
| DiffEngine | ユニット | 最高 | 95% |
| FileManager | ユニット | 高 | 85% |
| EditorManager | 統合 | 高 | 80% |
| SplitView | 統合 | 中 | 75% |
| EventBus | ユニット | 高 | 95% |
| ThemeManager | ユニット | 中 | 80% |
| AutoSave | ユニット | 高 | 85% |

### 8.2 テストフレームワーク構成

```
tests/
├── unit/
│   ├── ZoomController.test.js
│   ├── PanController.test.js
│   ├── DiffEngine.test.js
│   ├── FileManager.test.js
│   ├── EventBus.test.js
│   ├── ThemeManager.test.js
│   └── AutoSave.test.js
├── integration/
│   ├── EditorManager.test.js
│   ├── SplitView.test.js
│   └── DiffView.test.js
└── e2e/
    └── app.test.js
```

---

## 9. セキュリティ考慮事項

### 9.1 脅威モデル

| 脅威 | リスク | 対策 |
|------|--------|------|
| XSS | ユーザー入力のHTML実行 | CodeMirror 6 のサニタイズ機能 + CSP |
| データ漏洩 | ファイル内容の外部送信 | 完全ローカル処理、ネットワーク通信なし |
| 不正ファイルアクセス | 許可なしのファイル読み書き | File System Access API の権限モデル |
| ストレージ汚染 | localStorage の改ざん | JSON.parse の try-catch + バリデーション |

### 9.2 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data:;
               font-src 'self';
               connect-src 'none';">
```

---

## 10. 拡張性設計

### 10.1 将来の拡張ポイント

| 拡張 | 設計上の準備 |
|------|------------|
| 新しい言語サポート | CodeMirror 6 の @codemirror/lang-* を追加するだけ |
| 新しいテーマ | CSS Custom Properties を定義した新CSSファイルを追加 |
| 3ファイル比較 | SplitView を3分割に拡張可能な設計 |
| プラグインAPI | EventBus + 公開API で外部拡張可能 |
| 協調編集 | CodeMirror 6 の collab 拡張で対応可能 |
| Git diff | DiffEngine のアルゴリズム差し替えで対応 |
