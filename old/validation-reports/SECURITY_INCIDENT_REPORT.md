# 🚨 セキュリティインシデントレポート - GCP秘密鍵の漏洩

**発見日時**: 2025-12-18
**重大度**: 🔴 CRITICAL（最重要）
**状態**: 🚨 即座対応必須

---

## 📋 問題の概要

**Git履歴にGCPサービスアカウント秘密鍵が含まれている**

### 漏洩したファイル

```bash
credentials/imagen-key.json
```

### コミット情報

```
Commit: 882cfd2
メッセージ: feat: AI画像生成システム (Google Imagen API統合)
日時: 過去のコミット
```

### 漏洩内容

- **type**: service_account
- **project_id**: text-to-speech-app-1751525744
- **private_key_id**: db01c51c91401dd170ac8f968e78f4f7faa93194
- **private_key**: ❌ RSA秘密鍵（完全に漏洩）
- **client_email**: imagen-generator@text-to-speech-app-1751525744.iam.gserviceaccount.com

---

## 🔥 即座に実施すべき対応（優先度順）

### 🚨 STEP 1: GCPサービスアカウントキーの無効化（最優先）

```bash
# 1. GCPにログイン
gcloud auth login

# 2. プロジェクト確認
gcloud config set project text-to-speech-app-1751525744

# 3. 漏洩したキーを無効化
gcloud iam service-accounts keys delete db01c51c91401dd170ac8f968e78f4f7faa93194 \
  --iam-account=imagen-generator@text-to-speech-app-1751525744.iam.gserviceaccount.com

# 4. 新しいキーを生成
gcloud iam service-accounts keys create ~/Desktop/git-worktree-agent/credentials/imagen-key-new.json \
  --iam-account=imagen-generator@text-to-speech-app-1751525744.iam.gserviceaccount.com

# 5. 古いキーファイルを削除
rm ~/Desktop/git-worktree-agent/credentials/imagen-key.json
mv ~/Desktop/git-worktree-agent/credentials/imagen-key-new.json \
   ~/Desktop/git-worktree-agent/credentials/imagen-key.json
chmod 600 ~/Desktop/git-worktree-agent/credentials/imagen-key.json
```

### 🚨 STEP 2: Git履歴から秘密鍵を完全削除

**警告**: この操作は破壊的です。リモートリポジトリにプッシュ済みの場合、全ての共同作業者に影響します。

#### Option A: BFG Repo-Cleaner（推奨）

```bash
# 1. BFGをインストール（Homebrewの場合）
brew install bfg

# 2. リポジトリをクローン（--mirrorオプション必須）
cd ~/Desktop
git clone --mirror git@github.com:YOUR_USERNAME/git-worktree-agent.git

# 3. BFGで秘密鍵を削除
bfg --delete-files imagen-key.json git-worktree-agent.git

# 4. Git GCで履歴をクリーンアップ
cd git-worktree-agent.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. 強制プッシュ
git push --force
```

#### Option B: git filter-repo（代替案）

```bash
# 1. git filter-repoをインストール
brew install git-filter-repo

# 2. リポジトリで実行
cd ~/Desktop/git-worktree-agent
git filter-repo --path credentials/imagen-key.json --invert-paths

# 3. リモート再設定
git remote add origin git@github.com:YOUR_USERNAME/git-worktree-agent.git

# 4. 強制プッシュ
git push --force --all
git push --force --tags
```

#### Option C: 新規リポジトリ（最も安全）

```bash
# 1. 現在のリポジトリをバックアップ
mv ~/Desktop/git-worktree-agent ~/Desktop/git-worktree-agent-backup

# 2. 新規リポジトリを作成
mkdir ~/Desktop/git-worktree-agent
cd ~/Desktop/git-worktree-agent
git init

# 3. 必要なファイルのみコピー（credentials/を除外）
rsync -av --exclude='.git' --exclude='credentials/' \
  ~/Desktop/git-worktree-agent-backup/ .

# 4. .gitignoreを強化してからコミット
# （後述の.gitignore更新を参照）
git add .
git commit -m "Initial commit (credentials removed)"

# 5. GitHubに新規プッシュ
git remote add origin git@github.com:YOUR_USERNAME/git-worktree-agent.git
git push -u origin main --force
```

### 🚨 STEP 3: .gitignore を強化

```bash
# credentials/ を完全に除外
cat >> .gitignore <<'EOF'

# 🚨 セキュリティ: 認証情報は絶対にコミットしない
credentials/
*.key.json
*-key.json
*.pem
*.p12
*.pfx
service-account*.json
gcp-*.json
imagen-*.json

# 環境変数ファイル
.env
.env.*
!.env.example
!.env.template

# その他の機密ファイル
secrets/
private/
*.secret
*.private
EOF

# .gitignoreをコミット
git add .gitignore
git commit -m "security: Add comprehensive credential exclusions to .gitignore"
```

### 🚨 STEP 4: GitHubリポジトリの監査

```bash
# 1. GitHubでリポジトリを確認
# https://github.com/YOUR_USERNAME/git-worktree-agent

# 2. 秘密鍵が含まれているか検索
# GitHub UI: "imagen-key.json" で検索
# 見つかった場合: STEP 2を実行

# 3. GitHub Secret Scanningアラート確認
# Settings → Security → Secret scanning alerts
```

---

## 🛡️ 今後の予防策

### 1. .gitignore の強化（完了後）

```gitignore
# 🚨 認証情報（絶対にコミットしない）
credentials/
*.key.json
*-key.json
service-account*.json
gcp-*.json
imagen-*.json
*.pem
*.p12
secrets/
private/

# 環境変数
.env
.env.*
!.env.example
!.env.template
```

### 2. Pre-commitフック追加

```bash
# .git/hooks/pre-commit を作成
cat > .git/hooks/pre-commit <<'EOF'
#!/bin/bash
# 秘密鍵のコミットを防止

if git diff --cached --name-only | grep -E "(credentials/|\.key\.json|service-account.*\.json)"; then
    echo "❌ エラー: 認証情報ファイルを検出しました"
    echo "credentials/ やキーファイルはコミットできません"
    exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

### 3. GitHub公開スクリプトの強化

`simplified_github_publisher.py` の除外パターンに追加:

```python
exclude_patterns = [
    # 既存のパターン
    '__pycache__', '.pyc', '.pyo',
    '.DS_Store', 'Thumbs.db',
    '.env', '.git',

    # 🚨 追加: 認証情報の完全除外
    'credentials/', '*.key.json', '*-key.json',
    'service-account*.json', 'gcp-*.json', 'imagen-*.json',
    '*.pem', '*.p12', 'secrets/', 'private/',
]
```

### 4. CLAUDE.md にセキュリティルール追加

```markdown
## 🚨 セキュリティ必須ルール

### Phase 6: GitHub公開前の必須チェック

❌ 絶対にプッシュしてはいけないもの:
  - credentials/ フォルダ
  - *.key.json（GCP認証キー）
  - service-account*.json
  - .env ファイル（.env.example以外）
  - 秘密鍵・証明書（*.pem, *.p12）

✅ プッシュ前の確認:
  1. git status でcredentials/が含まれていないか確認
  2. git diff --cached で秘密鍵が含まれていないか確認
  3. .gitignore にcredentials/が含まれているか確認
```

---

## 📊 影響範囲の評価

### 漏洩したサービスアカウントの権限

```bash
# 権限確認
gcloud projects get-iam-policy text-to-speech-app-1751525744 \
  --flatten="bindings[].members" \
  --filter="bindings.members:imagen-generator@text-to-speech-app-1751525744.iam.gserviceaccount.com"
```

### 想定される影響

- ✅ **Vertex AI Imagen API**: 画像生成リクエスト可能
- ✅ **コスト**: 不正利用による課金の可能性
- ❌ **他のGCPリソース**: 権限次第（要確認）

### リスク評価

```
リスクレベル: 🔴 HIGH

理由:
1. サービスアカウント秘密鍵が完全に漏洩
2. Imagen API（有料）へのアクセス可能
3. Git履歴に永続的に残っている
4. GitHubに公開されている可能性

推奨アクション:
1. 即座にキーを無効化（最優先）
2. GCP請求アラート設定
3. サービスアカウント削除・再作成
4. Git履歴から完全削除
```

---

## ✅ 対応完了チェックリスト

### 即座対応（24時間以内）

- [ ] GCPサービスアカウントキーを無効化
- [ ] 新しいキーを生成・配置
- [ ] Git履歴から秘密鍵を削除（BFG/filter-repo/新規リポジトリ）
- [ ] .gitignore にcredentials/を追加
- [ ] GitHubリポジトリから秘密鍵が削除されたか確認

### フォローアップ（1週間以内）

- [ ] GCP請求ダッシュボードで不正利用確認
- [ ] pre-commitフック設定
- [ ] simplified_github_publisher.py に除外パターン追加
- [ ] CLAUDE.md にセキュリティルール追加
- [ ] チーム全体に注意喚起（該当する場合）

### 長期対策

- [ ] 定期的な認証情報ローテーション（3ヶ月ごと）
- [ ] GitHub Secret Scanning有効化
- [ ] GCP Security Command Center確認
- [ ] 最小権限原則の再確認

---

## 📚 参考リンク

- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [GCP: Managing service account keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)

---

## 🔒 セキュリティベストプラクティス

### 認証情報の管理

```yaml
推奨:
  - 環境変数で管理（.env + .gitignore）
  - Secret Manager（GCP/AWS/Azure）
  - credentials/ フォルダを.gitignoreに必ず追加
  - pre-commitフックで自動チェック

禁止:
  - 認証情報をGitにコミット
  - 公開リポジトリに秘密鍵を含める
  - ハードコーディング
```

---

**作成者**: Claude Code（セキュリティ監査）
**日時**: 2025-12-18
**次回見直し**: 即座対応後
