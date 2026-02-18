# 株価推移表示ウェブアプリ

このアプリは、エージェントシステムv2.0のデモとして3つの専門エージェントが並列開発したサンプルアプリケーションです。

## 🚀 起動方法

### フロントエンドのみ（簡単）
```bash
open index.html
# または
open stock-display.html
```

### フルスタック版（API連携）
```bash
npm install
npm start
# ブラウザで index.html を開く
```

## 📂 ファイル構成

```
stock-tracker/
├── index.html           # Chart.js版インタラクティブチャート
├── stock-display.html   # プロフェッショナルダッシュボード
├── app.js              # フロントエンドロジック
├── styles.css          # Chart.js版スタイル
├── animations.css      # アニメーション定義
├── server.js           # Express.js APIサーバー
├── package.json        # Node.js依存関係
├── API_DOCUMENTATION.md # API仕様書
└── ux-guidelines.md    # UXデザインガイド
```

## ✨ 機能

- リアルタイムチャート表示
- 複数銘柄の比較
- ズーム＆パン機能
- ダークモード
- WebSocket通信
- レスポンシブデザイン
- WCAG 2.1準拠のアクセシビリティ

## 🤖 開発エージェント

このアプリは以下のエージェントによって開発されました：

1. **Frontend Agent** - UIとチャート機能
2. **Backend Agent** - API開発とWebSocket
3. **UI/UX Agent** - デザインとユーザビリティ

## 📝 メモ

- モックデータを使用（実際の株価ではありません）
- 教育・デモ目的のアプリケーション
- Chart.js 4.4.0 + date-fns adapter使用