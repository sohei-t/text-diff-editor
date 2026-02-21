# Text Diff Editor

[![CI](https://github.com/sohei-t/text-diff-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/sohei-t/text-diff-editor/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tests](https://img.shields.io/badge/Tests-66%20passing-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

マルチパネルのテキスト差分エディタ。Myers 差分アルゴリズムによる高精度な差分検出、3テーマ対応、検索・置換、ズーム・パン機能を搭載。

## Features

- **マルチパネル編集**: 1/2/3 ペインのスプリットビュー（ドラッグで幅調整）
- **Myers 差分アルゴリズム**: 行レベル＋文字レベルの高精度差分検出（O(D(N+M))）
- **3テーマ**: Light（パーチメント）/ Dark（インク）/ High Contrast（アクセシビリティ）
- **検索・置換**: 正規表現対応、大小文字区別、全置換
- **ズーム＆パン**: Cmd+スクロールでズーム、Alt+ドラッグでパン（慣性付き）
- **ファイル操作**: File System Access API（Chrome）+ フォールバック
- **自動保存**: タイマーベース
- **Undo/Redo**: 1000レベルの操作履歴
- **キーボードショートカット**: Cmd+N/O/S/W/F/H/\, F7 等

## Tech Stack

- **フレームワーク**: React 18 + TypeScript (strict)
- **ビルド**: Vite 6
- **テスト**: Vitest + React Testing Library（66テスト）
- **スタイル**: CSS Custom Properties（テーマ切替）
- **CI/CD**: GitHub Actions

## Architecture

```
src/
├── engine/       # DiffEngine（Myers アルゴリズム、純粋 TypeScript）
├── types/        # 全型定義
├── context/      # 7 React Context（Theme, Settings, Toast, Editor, Split, Diff, File）
├── hooks/        # 10 カスタムフック（useEditor, useUndoRedo, useZoom, usePan, etc.）
├── components/
│   ├── toolbar/  # ツールバー（ファイル、表示、フォント、ズーム）
│   ├── editor/   # エディタ（パネル、行番号、スプリッター）
│   ├── search/   # 検索・置換バー
│   ├── status/   # ステータスバー
│   └── ui/       # Toast 通知
├── utils/        # ユーティリティ関数
└── styles/       # CSS（テーマ、エディタ、ツールバー等）
```

## Getting Started

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm test         # テスト実行
```

## Keyboard Shortcuts

| ショートカット | アクション |
|--------------|-----------|
| `Cmd+N` | 新規ファイル |
| `Cmd+O` | ファイルを開く |
| `Cmd+S` | 保存 |
| `Cmd+F` | 検索 |
| `Cmd+H` | 検索＆置換 |
| `Cmd+\` | スプリットビュー切替 |
| `Cmd+Z` | 元に戻す |
| `Cmd+Shift+Z` | やり直し |
| `F7` | 次の差分へ |
| `Shift+F7` | 前の差分へ |

## License

MIT
