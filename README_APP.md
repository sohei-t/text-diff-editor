# Text Diff Editor - 老眼に優しいテキストエディター

Mac mini + Magic Mouse 向けの、テキスト拡大縮小・ドラッグ移動・2ファイル比較ができるエディターです。

## 起動方法

**`launch_app.command` をダブルクリック**するだけで起動します。

ブラウザが自動で開き、エディターが表示されます。
終了するにはターミナルで `Ctrl+C` を押してください。

## 主な操作

| 操作 | 方法 |
|------|------|
| テキスト拡大・縮小 | Magic Mouse でピンチズーム |
| テキスト位置調整 | Alt + ドラッグ |
| ファイルを開く | Cmd+O |
| 保存 | Cmd+S |
| 2ファイル比較 | ツールバーの「分割」ボタン |
| 検索・置換 | Cmd+F / Cmd+H |
| テーマ切替 | 設定パネル（ライト/ダーク/ハイコントラスト） |

## フォルダ構成

```
text-diff-editor-agent/
├── launch_app.command    ... ワンクリック起動スクリプト
├── app/                  ... アプリ本体
│   ├── index.html        ... メイン画面
│   ├── js/               ... JavaScriptモジュール
│   ├── about.html        ... プロジェクト紹介ページ
│   ├── explanation.mp3   ... 音声解説
│   └── README.md         ... 技術詳細
├── project/public/       ... app/ と同じ（公開用コピー元）
├── _workflow/            ... 開発ワークフロー関連（通常は不要）
├── worktrees/            ... Git worktree（開発用）
├── CLAUDE.md             ... AI開発ガイドライン
└── PROJECT_INFO.yaml     ... プロジェクト情報
```

**普段使うのは `launch_app.command` と `app/` フォルダだけです。**
