# 環境検出ガイド（Claude Code用）

## 🔍 環境の自動判定

Claude Codeは起動時に以下を確認してください：

### 1. テンプレート環境の場合
```
パス: ~/Desktop/git-worktree-agent/
ファイル: create_new_app.command が存在
```
→ **アプリ開発を依頼されたら：**
```
「このディレクトリはテンプレートです。
アプリ開発を行う場合は、まず以下を実行してください：
1. ./create_new_app.command
2. アプリ名を入力
3. 作成された専用環境（~/Desktop/AI-Apps/{app}-agent/）でClaude Codeを起動
そこで開発を依頼してください。」
```

### 2. 専用環境の場合
```
パス: ~/Desktop/AI-Apps/*-agent/
ファイル: PROJECT_INFO.yaml が存在
```
→ **CLAUDE.md に従ってワークフロー実行**

## 📝 専用環境でのワークフロー

1. **初回起動時**
   - CLAUDE.md を読み込む
   - PROJECT_INFO.yaml からアプリ名を取得
   - 必須4ファイルを確認

2. **開発開始**
   - Worktree作成: `git worktree add -b feat/v1 ./worktrees/mission-v1 main`
   - ワークフロー実行（要件定義 → WBS → テスト設計 → 実装 → 改善 → 完成）

3. **完成後**
   ```bash
   # リリース版作成
   ./release.sh

   # GitHub公開
   ./publish_to_portfolio.sh
   ```

## ⚠️ 注意事項

- **テンプレート環境では開発しない**
- **専用環境は独立したGitリポジトリ**
- **Worktreeは専用環境内に作成**
- **成果物は専用環境内で管理**