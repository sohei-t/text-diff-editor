# TECH_STACK.md - Text Diff Editor 技術スタック決定書

## 1. 技術スタック概要

| レイヤー | 技術 | 理由 |
|---------|------|------|
| エディターエンジン | Vanilla JS + textarea | 外部依存なし、オフライン動作、軽量 |
| ズーム | CSS `transform: scale()` + wheel イベント | GPU加速で60fps維持 |
| ドラッグ/パン | mouse イベント + CSS `transform: translate()` / scroll | ネイティブブラウザAPI |
| Diff計算 | 自前実装（Myers diffアルゴリズム） | 外部ライブラリ不要、行単位+文字単位差分 |
| ファイルI/O | File System Access API + フォールバック | ネイティブレベルのファイル操作 |
| 永続化 | localStorage | 設定・テーマの保持 |
| テスト | ブラウザ内テストランナー（自前） | npm不要のテスト環境 |
| スタイリング | CSS Custom Properties + モダンCSS | テーマ対応、GPU加速 |
| 言語 | Vanilla JavaScript (ES2022+) | フレームワーク不要、軽量 |

## 2. 選定理由の詳細

### 2.1 エディターエンジン: Vanilla JS + textarea

**選定理由:**
- **配布要件**: 単一HTMLファイルまたは最小限のファイル構成でオフライン動作が必須
- **依存排除**: CodeMirror 6 は高性能だが npm + バンドラーが必要。本プロジェクトではビルドツールを使用しない方針
- **十分な機能**: textarea + JavaScript で、テキスト編集、検索・置換、Undo/Redo、行番号表示が実現可能
- **軽量**: 外部ライブラリなしで数十KB以下の配布物が可能

**代替案と却下理由:**
| 候補 | 却下理由 |
|------|---------|
| CodeMirror 6 | npm/bundler必須。CDN利用もオフライン要件に反する |
| Monaco Editor | 重量級（数MB）。npm/CDN必須 |
| Ace Editor | CDN前提の設計。単一HTMLに組み込み困難 |
| contenteditable | ブラウザ間の挙動差異が大きく、安定したテキスト編集が困難 |

**textareaの利点:**
- ブラウザネイティブのテキスト入力（IME対応、コピペ、Undo/Redo）
- 大量テキストの高速レンダリング（ブラウザ最適化済み）
- アクセシビリティ標準対応
- 予測可能な動作

**textareaの制限と対策:**
| 制限 | 対策 |
|------|------|
| 行番号表示なし | 隣接するdiv要素で行番号をレンダリング |
| シンタックスハイライトなし | 将来拡張として検討（Phase 1ではスコープ外） |
| 折り返し制御 | CSS `white-space: pre` / `pre-wrap` で制御 |
| カーソル行ハイライトなし | textarea上に重ねるオーバーレイで実現 |

### 2.2 ズーム: CSS transform: scale()

**技術詳細:**
```css
.editor-zoom-container {
  will-change: transform;
  transform-origin: var(--zoom-origin-x) var(--zoom-origin-y);
  transform: scale(var(--zoom-level));
}
```

**wheelイベントでのピンチ検出:**
```javascript
// Magic Mouse のピンチジェスチャーは ctrlKey: true で検出
element.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    const delta = -e.deltaY * 0.01;
    setZoom(currentZoom + delta, e.clientX, e.clientY);
  }
}, { passive: false });
```

**選定理由:**
- GPU加速（合成レイヤー）で60fps維持
- テキストの再レイアウト不要（CSSレベルの変換のみ）
- Magic Mouseのピンチジェスチャーとの自然な統合
- `transform-origin` でカーソル位置基準のズームが実現可能

### 2.3 ドラッグ/パン: mouseイベント + scroll

**技術詳細:**
- Alt + mousedown でパンモード開始
- mousemove で `scrollLeft` / `scrollTop` を更新
- mouseup で慣性アニメーション（velocity + friction）
- `requestAnimationFrame` でフレーム同期

**選定理由:**
- ブラウザネイティブAPIで完結
- テキスト選択との競合をAltキー修飾で回避
- 慣性アニメーションで自然な操作感

### 2.4 Diff計算: 自前実装（Myers diffアルゴリズム）

**技術詳細:**
- **行単位diff**: Myers diffアルゴリズム（O(ND)計算量）を行単位で実行
- **行内文字diff**: 変更行について文字単位のdiffを計算
- **最適化**: 行数が10,000行を超える場合はsetTimeout分割で非同期化

**選定理由:**
- diff-match-patch（Google）はnpmパッケージ。本プロジェクトでは外部依存を排除
- Myers diffは実装がシンプルで、行単位diffに適している
- LCS（Longest Common Subsequence）ベースの標準的なアルゴリズム

**実装サイズの見積もり:**
- 行単位diff: 約100行のJavaScript
- 行内文字diff: 約50行
- 差分統計: 約30行
- 合計: 約200行（軽量）

### 2.5 ファイルI/O: File System Access API

**API対応状況:**
| ブラウザ | `showOpenFilePicker` | `showSaveFilePicker` | 備考 |
|---------|---------------------|---------------------|------|
| Chrome 86+ | 対応 | 対応 | フルサポート |
| Edge 86+ | 対応 | 対応 | フルサポート |
| Safari | 非対応 | 非対応 | フォールバック必須 |
| Firefox | 非対応 | 非対応 | フォールバック必須 |

**フォールバック戦略:**
- **オープン**: `<input type="file">` + `FileReader.readAsText()`
- **保存**: `new Blob()` + `<a download>` によるダウンロード

**選定理由:**
- Chrome/Edgeでネイティブレベルのファイル操作（ハンドル保持による上書き保存）
- Safari/Firefoxでも基本機能は利用可能
- 完全ローカル処理（サーバー通信なし）

### 2.6 永続化: localStorage

**保存する設定項目:**
```javascript
{
  "textDiffEditor": {
    "theme": "light",
    "fontSize": 16,
    "fontFamily": "\"SF Mono\", \"Menlo\", monospace",
    "lineHeight": 1.6,
    "wordWrap": true,
    "showLineNumbers": true,
    "highlightCurrentLine": true,
    "autoSaveInterval": 0,
    "splitRatio": 0.5,
    "syncScroll": true,
    "lastZoomLevel": 1.0
  }
}
```

**選定理由:**
- IndexedDBは複雑すぎる（設定データのみの用途には過剰）
- localStorageはシンプルで、同期的にアクセス可能
- 5MB制限は設定データには十分

## 3. アーキテクチャ構成

### 3.1 ファイル構成

```
project/
├── public/
│   ├── index.html              # メインHTMLファイル（エントリーポイント）
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css        # メインスタイル
│   │   │   ├── themes.css      # テーマ定義（CSS Custom Properties）
│   │   │   ├── toolbar.css     # ツールバースタイル
│   │   │   ├── editor.css      # エディタースタイル
│   │   │   ├── split-view.css  # 分割ビュースタイル
│   │   │   ├── search.css      # 検索バースタイル
│   │   │   ├── settings.css    # 設定パネルスタイル
│   │   │   └── statusbar.css   # ステータスバースタイル
│   │   └── js/
│   │       ├── app.js          # メインアプリケーション（初期化・統合）
│   │       ├── EventBus.js     # イベントバス（Pub/Sub通信）
│   │       ├── EditorManager.js# エディター管理（textarea制御）
│   │       ├── ZoomController.js# ズーム制御（CSS transform）
│   │       ├── PanController.js # パン制御（ドラッグナビゲーション）
│   │       ├── FileManager.js  # ファイルI/O（File System Access API）
│   │       ├── AutoSave.js     # 自動保存制御
│   │       ├── DiffEngine.js   # Diff計算エンジン（Myers diff）
│   │       ├── SplitView.js    # 分割ビュー管理
│   │       ├── SearchManager.js # 検索・置換
│   │       ├── ThemeManager.js # テーマ管理
│   │       ├── SettingsManager.js # 設定パネル管理
│   │       ├── Toolbar.js      # ツールバー制御
│   │       ├── StatusBar.js    # ステータスバー制御
│   │       └── Toast.js        # トースト通知
│   └── README.md               # 公開用README
├── tests/
│   ├── test-runner.html        # テストランナー（ブラウザで実行）
│   ├── unit/
│   │   ├── EventBus.test.js
│   │   ├── EditorManager.test.js
│   │   ├── ZoomController.test.js
│   │   ├── PanController.test.js
│   │   ├── FileManager.test.js
│   │   ├── DiffEngine.test.js
│   │   ├── SplitView.test.js
│   │   ├── SearchManager.test.js
│   │   ├── ThemeManager.test.js
│   │   └── AutoSave.test.js
│   └── integration/
│       ├── zoom-pan.test.js
│       ├── diff-split.test.js
│       └── file-edit-save.test.js
└── SPEC.md, TECH_STACK.md, etc.
```

### 3.2 HTMLの構造

```html
<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Text Diff Editor</title>
  <link rel="stylesheet" href="assets/css/main.css">
  <link rel="stylesheet" href="assets/css/themes.css">
  <link rel="stylesheet" href="assets/css/toolbar.css">
  <link rel="stylesheet" href="assets/css/editor.css">
  <link rel="stylesheet" href="assets/css/split-view.css">
  <link rel="stylesheet" href="assets/css/search.css">
  <link rel="stylesheet" href="assets/css/settings.css">
  <link rel="stylesheet" href="assets/css/statusbar.css">
</head>
<body>
  <!-- Toolbar -->
  <header id="toolbar" class="toolbar" role="toolbar">...</header>

  <!-- Editor Area -->
  <main id="editor-area" class="editor-area">
    <div id="panel-left" class="editor-panel">
      <div class="line-numbers" id="line-numbers-left"></div>
      <div class="editor-zoom-container" id="zoom-container-left">
        <textarea id="editor-left" class="editor-textarea" spellcheck="false"></textarea>
      </div>
    </div>
    <div id="splitter" class="splitter" hidden></div>
    <div id="panel-right" class="editor-panel" hidden>
      <div class="line-numbers" id="line-numbers-right"></div>
      <div class="editor-zoom-container" id="zoom-container-right">
        <textarea id="editor-right" class="editor-textarea" spellcheck="false"></textarea>
      </div>
    </div>
  </main>

  <!-- Search Bar -->
  <div id="search-bar" class="search-bar" hidden>...</div>

  <!-- Settings Panel -->
  <div id="settings-panel" class="settings-panel" hidden>...</div>

  <!-- Status Bar -->
  <footer id="status-bar" class="status-bar" role="status">...</footer>

  <!-- Toast Container -->
  <div id="toast-container" class="toast-container"></div>

  <!-- Scripts (modules) -->
  <script src="assets/js/EventBus.js"></script>
  <script src="assets/js/EditorManager.js"></script>
  <script src="assets/js/ZoomController.js"></script>
  <script src="assets/js/PanController.js"></script>
  <script src="assets/js/FileManager.js"></script>
  <script src="assets/js/AutoSave.js"></script>
  <script src="assets/js/DiffEngine.js"></script>
  <script src="assets/js/SplitView.js"></script>
  <script src="assets/js/SearchManager.js"></script>
  <script src="assets/js/ThemeManager.js"></script>
  <script src="assets/js/SettingsManager.js"></script>
  <script src="assets/js/Toolbar.js"></script>
  <script src="assets/js/StatusBar.js"></script>
  <script src="assets/js/Toast.js"></script>
  <script src="assets/js/app.js"></script>
</body>
</html>
```

**注意:** ES Modulesを使わず、scriptタグの順序で依存関係を解決する。EventBusが最初にロードされ、最後にapp.jsが統合する。

### 3.3 モジュール間通信

すべてのモジュールはグローバルな `EventBus` インスタンスを介して通信する。直接参照は避け、疎結合を維持する。

```
EventBus（中央ハブ）
  ├── EditorManager → emits: editor:change, editor:cursor
  ├── ZoomController → emits: zoom:change, zoom:reset
  ├── PanController → emits: pan:start, pan:end
  ├── FileManager → emits: file:open, file:save, file:error
  ├── AutoSave → emits: autosave:save
  ├── DiffEngine → emits: diff:result
  ├── SplitView → emits: split:toggle, split:resize
  ├── SearchManager → emits: search:result, search:navigate
  ├── ThemeManager → emits: theme:change
  ├── Toolbar → emits: toolbar:action
  └── StatusBar → listens: all events for status updates
```

## 4. コスト

| 項目 | コスト |
|------|--------|
| 外部ライブラリ | $0（使用しない） |
| CDN | $0（使用しない） |
| サーバー | $0（ローカル実行） |
| API | $0（外部API不使用） |
| **合計** | **$0** |

## 5. パフォーマンス最適化戦略

### 5.1 レンダリング
| 手法 | 適用箇所 | 効果 |
|------|---------|------|
| CSS transform (GPU) | ズーム操作 | メインスレッドへの負荷をゼロに |
| `will-change: transform` | ズームコンテナ | 合成レイヤー事前確保 |
| `requestAnimationFrame` | ズーム/パン | フレーム同期、過剰描画防止 |
| 行番号の仮想レンダリング | 行番号表示 | 表示範囲のみDOM生成 |
| `content-visibility: auto` | 非表示パネル | レンダリングスキップ |

### 5.2 テキスト処理
| 手法 | 適用箇所 | 効果 |
|------|---------|------|
| デバウンス（150ms） | diff再計算 | 入力中の過剰な計算を防止 |
| setTimeout分割 | 大ファイルdiff | メインスレッドのブロック回避 |
| 差分キャッシュ | diff結果 | 同じ内容の再計算を回避 |

### 5.3 バンドルサイズ目標
| ファイル種別 | 目標サイズ |
|------------|-----------|
| HTML | < 10KB |
| CSS（合計） | < 15KB |
| JS（合計） | < 50KB |
| **合計** | **< 75KB（gzip前）** |

## 6. セキュリティ

### 6.1 セキュリティモデル
- **完全ローカル処理**: ネットワーク通信なし
- **ファイルアクセス**: ユーザーの明示的許可のみ
- **データ保護**: ファイル内容をlocalStorageやサーバーに送信しない
- **XSS対策**: textareaはHTML解釈しないため、ユーザー入力がそのまま安全に表示される
- **CSP**: `connect-src 'none'` でネットワークアクセスを完全禁止
