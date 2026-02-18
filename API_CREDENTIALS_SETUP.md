# 🔐 API認証情報セットアップガイド

**完全自動化を実現するためのAPI認証設定手順**

## 📋 目次

1. [概要](#概要)
2. [クイックスタート](#クイックスタート)
3. [Gemini API設定（推奨）](#gemini-api設定推奨)
4. [GCP認証設定（フォールバック）](#gcp認証設定フォールバック)
5. [GitHub認証設定](#github認証設定)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### 自動化される機能

適切にAPI認証を設定することで、以下が完全自動化されます：

✅ **Phase 5: 完成処理**
- `explanation.mp3` 生成
  - **推奨**: Gemini 2.5 Flash Preview TTS（APIキーのみで利用可能）
  - フォールバック: Google Cloud Text-to-Speech
- ゲーム画像生成（Vertex AI Imagen API）

✅ **Phase 6: GitHub公開**
- リポジトリ作成
- GitHub Pages設定
- README.md更新

### 認証管理システム

3層のフォールバック機構で、環境を問わず自動動作します：

```
レイヤー1: .env ファイル（優先）
    ↓ なければ
レイヤー2: 環境変数 GOOGLE_APPLICATION_CREDENTIALS
    ↓ なければ
レイヤー3: テンプレート環境のデフォルトパス
```

---

## クイックスタート

### 1️⃣ Gemini API キー設定（推奨・最も簡単）

```bash
# 1. Google AI Studio でAPIキーを取得
# https://makersuite.google.com/app/apikey

# 2. 環境変数に設定（いずれかの方法）
# 方法A: 直接設定
export GEMINI_API_KEY='your-api-key'

# 方法B: グローバル設定ファイルに追加
echo "GEMINI_API_KEY=your-api-key" >> ~/.config/ai-agents/profiles/default.env

# 3. 依存関係インストール
pip install google-genai pydub
brew install ffmpeg  # pydubが使用
```

### 2️⃣ テンプレート環境で追加セットアップ（オプション）

```bash
# 1. git-worktree-agent に移動
cd ~/Desktop/git-worktree-agent

# 2. credentials フォルダを作成（画像生成用GCP認証を使う場合）
mkdir -p credentials

# 3. GCP認証ファイルを配置（後述の手順で取得）
# → credentials/gcp-workflow-key.json

# 4. GitHub認証（後述の手順）
gh auth login
```

### 3️⃣ 新規アプリ作成時は自動設定

```bash
# create_new_app.command を実行すると：
# ✅ .env ファイルが自動生成
# ✅ テンプレート環境の認証を自動参照
# ✅ すぐにワークフローを実行可能
```

### 4️⃣ 認証状態を確認

```bash
# 専用環境で実行
python3 ~/Desktop/git-worktree-agent/src/credential_checker.py .
```

出力例：
```
🔐 認証情報チェックレポート
============================================================

✅ GCP (Text-to-Speech & Imagen)
   状態: ok
   ✓ プロジェクト: my-project-12345
   パス: ~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json

✅ GitHub
   状態: ok
   ✓ ユーザー: sohei-t
   パス: gh CLI

============================================================
✅ すべての必須認証が設定されています

🚀 ワークフローを実行できます
============================================================
```

---

## Gemini API設定（推奨）

### なぜ Gemini TTS を推奨するのか

| 項目 | Gemini TTS | GCP TTS |
|------|-----------|---------|
| 認証方式 | APIキーのみ | サービスアカウント |
| セットアップ | 3ステップ | 10+ステップ |
| 音声品質 | 非常に高品質 | 高品質 |
| SSML | 不要（自然言語で間を認識） | 必要 |
| コスト | 無料枠あり | 従量課金 |

### セットアップ手順

#### ステップ1: APIキーを取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. **Create API Key** をクリック
4. APIキーをコピー

#### ステップ2: 環境変数に設定

```bash
# 方法A: 直接設定（現在のセッションのみ）
export GEMINI_API_KEY='AIzaSy...'

# 方法B: グローバル設定ファイルに追加（永続化・推奨）
echo "GEMINI_API_KEY=AIzaSy..." >> ~/.config/ai-agents/profiles/default.env
```

#### ステップ3: 依存関係をインストール

```bash
# Python パッケージ
pip install google-genai pydub

# ffmpeg（pydubがMP3変換に使用）
brew install ffmpeg  # macOS
```

### 動作確認

```bash
# Gemini TTS のテスト
python3 << 'EOF'
import os
from google import genai

api_key = os.environ.get('GEMINI_API_KEY')
if api_key:
    client = genai.Client(api_key=api_key)
    print("✅ Gemini API 接続OK")
else:
    print("❌ GEMINI_API_KEY が設定されていません")
EOF
```

### 利用可能な音声

| 音声名 | 言語 | 特徴 |
|--------|------|------|
| Kore | 日本語対応 | 男性、落ち着いた声（デフォルト） |
| Aoede | 多言語 | 女性、明るい声 |
| Charon | 多言語 | 男性、低めの声 |
| Fenrir | 多言語 | 男性、力強い声 |
| Puck | 多言語 | 男性、ナレーション向け |

---

## GCP認証設定（フォールバック）

### Gemini TTS が利用できない場合のフォールバック

Gemini API キーが設定されていない場合、自動的に Google Cloud TTS にフォールバックします。

### 必要なAPI

- **Text-to-Speech API**: 音声生成（explanation.mp3）← Gemini失敗時のみ使用
- **Vertex AI API**: 画像生成（ゲーム用アセット）

### セットアップ手順（初回のみ）

#### ステップ1: Google Cloud プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成（例: `ai-agent-project`）
3. プロジェクトIDをメモ（例: `ai-agent-project-123456`）

#### ステップ2: APIを有効化

```bash
# Cloud SDKをインストール（まだの場合）
brew install google-cloud-sdk

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# 必要なAPIを有効化
gcloud services enable texttospeech.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

または、Cloud Consoleから：
1. [APIライブラリ](https://console.cloud.google.com/apis/library)
2. "Cloud Text-to-Speech API" を検索して有効化
3. "Vertex AI API" を検索して有効化

#### ステップ3: サービスアカウント作成

```bash
# サービスアカウント作成
gcloud iam service-accounts create ai-agent-service \
  --display-name "AI Agent Service Account"

# 必要な権限を付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:ai-agent-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudtts.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:ai-agent-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

または、Cloud Consoleから：
1. [IAMと管理 > サービスアカウント](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. **サービスアカウントを作成**
3. 名前: `ai-agent-service`
4. ロール: `Cloud Text-to-Speech API管理者` + `Vertex AI ユーザー`

#### ステップ4: 認証キーをダウンロード

```bash
# キーを作成してダウンロード
gcloud iam service-accounts keys create \
  ~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json \
  --iam-account=ai-agent-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

または、Cloud Consoleから：
1. サービスアカウントを選択
2. **鍵 > 鍵を追加 > 新しい鍵を作成**
3. 形式: **JSON**
4. ダウンロードされたファイルを `~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json` に配置

#### ステップ5: 動作確認

```bash
# 環境変数を設定
export GOOGLE_APPLICATION_CREDENTIALS=~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json

# Text-to-Speech APIをテスト
python3 << 'EOF'
from google.cloud import texttospeech
client = texttospeech.TextToSpeechClient()
print("✅ Text-to-Speech API 動作確認OK")
EOF

# Vertex AI Imagen APIをテスト
python3 << 'EOF'
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
vertexai.init(project="YOUR_PROJECT_ID", location="us-central1")
model = ImageGenerationModel.from_pretrained("imagegeneration@006")
print("✅ Vertex AI Imagen API 動作確認OK")
EOF
```

---

## GitHub認証設定

### 必要な権限

- **リポジトリ作成**
- **GitHub Pages設定**
- **README.md更新**

### セットアップ手順

#### オプション1: GitHub CLI（推奨）

```bash
# GitHub CLIをインストール（まだの場合）
brew install gh

# 認証
gh auth login

# 対話形式で以下を選択:
# ? What account do you want to log into? GitHub.com
# ? What is your preferred protocol for Git operations? HTTPS
# ? Authenticate Git with your GitHub credentials? Yes
# ? How would you like to authenticate GitHub CLI? Login with a web browser

# 動作確認
gh auth status
```

#### オプション2: Personal Access Token

1. [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. スコープ選択:
   - ✅ `repo` (すべてのリポジトリアクセス)
   - ✅ `workflow` (GitHub Actions)
   - ✅ `admin:public_key` (公開鍵管理)
4. トークンをコピー
5. `.env` に設定:
   ```bash
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   GITHUB_USERNAME=your-username
   ```

---

## トラブルシューティング

### 🔴 GCP認証エラー

#### エラー: `GOOGLE_APPLICATION_CREDENTIALS が設定されていません`

**原因**: 認証ファイルが見つからない

**解決策**:
```bash
# 1. 認証ファイルの存在確認
ls ~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json

# 2. .env ファイルを確認
cat .env | grep GOOGLE_APPLICATION_CREDENTIALS

# 3. 手動で設定
export GOOGLE_APPLICATION_CREDENTIALS=~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json
```

#### エラー: `Permission denied` (403)

**原因**: サービスアカウントに必要な権限がない

**解決策**:
```bash
# 権限を再付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:ai-agent-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudtts.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:ai-agent-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

#### エラー: `API not enabled`

**原因**: 必要なAPIが有効化されていない

**解決策**:
```bash
# APIを有効化
gcloud services enable texttospeech.googleapis.com
gcloud services enable aiplatform.googleapis.com

# 有効化の確認
gcloud services list --enabled | grep -E "texttospeech|aiplatform"
```

### 🔴 GitHub認証エラー

#### エラー: `gh: command not found`

**原因**: GitHub CLIがインストールされていない

**解決策**:
```bash
# インストール
brew install gh

# 認証
gh auth login
```

#### エラー: `refused to connect to github.com`

**原因**: 認証が切れている

**解決策**:
```bash
# 再認証
gh auth login

# トークンをリフレッシュ
gh auth refresh
```

#### エラー: `403 Forbidden` （リポジトリ作成時）

**原因**: トークンの権限不足

**解決策**:
1. [トークン設定](https://github.com/settings/tokens)を開く
2. トークンを編集
3. `repo` スコープを追加
4. `.env` を更新

---

## 高度な設定

### 複数のGCPプロジェクトを使い分け

```bash
# プロジェクトごとに認証ファイルを作成
~/Desktop/git-worktree-agent/credentials/
├── gcp-workflow-key.json              # デフォルト
├── project-a-key.json            # プロジェクトA用
└── project-b-key.json            # プロジェクトB用

# .env でプロジェクトを切り替え
GOOGLE_APPLICATION_CREDENTIALS=~/Desktop/git-worktree-agent/credentials/project-a-key.json
GCP_PROJECT_ID=project-a-12345
```

### 環境ごとの設定

```bash
# 開発環境
.env.development

# 本番環境
.env.production

# 使い分け
cp .env.development .env  # 開発時
cp .env.production .env   # 本番時
```

---

## まとめ

### ✅ セットアップ完了チェックリスト

**音声生成（Gemini TTS 推奨）:**
- [ ] Gemini API キー取得（[Google AI Studio](https://makersuite.google.com/app/apikey)）
- [ ] `GEMINI_API_KEY` 環境変数設定
- [ ] `pip install google-genai pydub` 実行
- [ ] `brew install ffmpeg` 実行

**画像生成（GCP - ゲーム用）:**
- [ ] GCP プロジェクト作成
- [ ] Vertex AI API 有効化
- [ ] サービスアカウント作成
- [ ] 認証キー配置: `~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json`

**GitHub公開:**
- [ ] GitHub CLI 認証完了

**検証:**
- [ ] `credential_checker.py` で全て ✅

### 🚀 次のステップ

セットアップ完了後、ワークフローを実行：

```bash
# 新規アプリ作成
./create_new_app.command

# 専用環境でワークフロー実行
cd ~/Desktop/AI-Apps/{app-name}-agent/
# Claude Codeでワークフロー実行

# Phase 5: explanation.mp3 が自動生成される ✅
#   → Gemini TTS（推奨）または GCP TTS（フォールバック）
# Phase 6: GitHub に自動公開される ✅
```

---

## 参考リンク

- [Google AI Studio（Gemini APIキー取得）](https://makersuite.google.com/app/apikey)
- [Gemini API ドキュメント](https://ai.google.dev/docs)
- [Google Cloud Text-to-Speech ドキュメント](https://cloud.google.com/text-to-speech/docs)
- [Vertex AI Imagen ドキュメント](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [GitHub CLI マニュアル](https://cli.github.com/manual/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

**💡 ヒント**: このドキュメントは `git-worktree-agent` と一緒に管理されているため、
新規アプリ作成時に自動的にコピーされます。
