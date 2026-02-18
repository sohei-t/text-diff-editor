# 🌐 外部API連携システム構築ガイド

## 📋 概要

このエージェントシステムは、外部API連携を含む複雑なシステムの構築が可能です。
ただし、セキュリティとコストの観点から、人間とAIの明確な役割分担が必要です。

## 🎯 構築可能なシステム例

### 1. Vertex AI RAG検索システム
- Embeddingの生成と管理
- ベクトルDBへの保存/検索
- Cloud Runでのサービス化
- 認証・認可の実装

### 2. LINE Chatbot システム
- Webhook エンドポイントの実装
- メッセージ処理ロジック
- Cloud Functions/GAS でのホスティング
- Rich Menu の動的生成

### 3. その他の統合システム
- Slack Bot / Discord Bot
- OpenAI API 統合アプリ
- Stripe 決済システム
- SendGrid メール配信
- Firebase リアルタイムアプリ

## 🤝 人間-AI 協調ワークフロー

### Phase 0: 事前準備（人間の責任）

```yaml
human_responsibilities:
  必須作業:
    - APIキーの取得と設定
    - GCPプロジェクトの作成
    - 予算制限の設定
    - 本番環境の準備

  セキュリティ:
    - 認証情報の管理
    - アクセス権限の設定
    - ファイアウォールルール

  コスト管理:
    - 予算アラートの設定
    - リソース制限の定義
```

### Phase 1: 要件定義（対話型）

```yaml
ai_agent_tasks:
  分析:
    - 技術的実現可能性の評価
    - コスト見積もり
    - セキュリティリスク評価

  提案:
    - アーキテクチャ設計
    - 技術スタックの選定
    - デプロイメント戦略

human_approval_points:
  - "予想コスト: $XX/月 で問題ないですか？"
  - "以下のAPIを使用します: [リスト]"
  - "これらの権限が必要です: [権限リスト]"
```

### Phase 2: 開発フェーズ（AI主導）

```yaml
ai_capabilities:
  完全自動化可能:
    - コード生成
    - ローカルテスト
    - Dockerfileの作成
    - CI/CD設定ファイル生成
    - ドキュメント作成

  サポート可能（要確認）:
    - terraform/IaCコード生成
    - デプロイスクリプト生成
    - モニタリング設定

human_actions_required:
  - 生成されたコードのレビュー
  - APIキーの環境変数設定
  - デプロイの実行承認
```

## 📊 実装提案システム

### 1. Vertex AI RAG検索システム

```yaml
architecture:
  frontend:
    - Next.js アプリケーション
    - Vercel または Cloud Run

  backend:
    - FastAPI / Cloud Run
    - Vertex AI Matching Engine
    - Cloud Storage (文書保存)

  infrastructure:
    - Cloud Load Balancer
    - Cloud CDN
    - Identity Platform (認証)

implementation_plan:
  ai_generates:
    - 完全なソースコード
    - Dockerfile
    - cloudbuild.yaml
    - terraform設定

  human_executes:
    - GCPプロジェクト作成
    - Vertex AI API有効化
    - サービスアカウント作成
    - デプロイ実行

estimated_cost:
  development: "0円（AI生成）"
  monthly_running:
    - Cloud Run: "$10-50"
    - Vertex AI: "$50-200"
    - Storage: "$5-20"
```

### 2. LINE Chatbot システム

```yaml
architecture:
  option_1_gas:
    platform: "Google Apps Script"
    pros:
      - 無料
      - 簡単なデプロイ
      - 管理不要
    cons:
      - 実行時間制限
      - 機能制限

  option_2_cloud_run:
    platform: "Cloud Run + Python/Node.js"
    pros:
      - スケーラブル
      - 高機能
      - カスタマイズ自由
    cons:
      - コスト発生
      - 管理必要

implementation:
  ai_generates:
    - Webhook処理コード
    - メッセージハンドラー
    - Rich Menu JSON
    - デプロイスクリプト

  human_setup:
    - LINE Developer登録
    - Channel作成
    - Webhook URL設定
    - Channel Token取得
```

## 🎯 UX向上のための対話フロー

### 初回セットアップ時の対話例

```markdown
AI: 「外部API連携システムを構築しますね。まず確認させてください：」

=== 🔍 要件確認 ===
1. 構築したいシステムは？
   □ RAG検索システム
   □ Chatbot
   □ API統合アプリ
   □ その他: ___

2. 想定ユーザー数: ___
3. 予算上限（月額）: $___
4. 必要な外部サービス:
   □ Vertex AI
   □ LINE
   □ OpenAI
   □ その他: ___

AI: 「理解しました。以下の構成を提案します：」

=== 📋 実装計画 ===
【AIが自動実行】
✅ ソースコード生成
✅ テストコード作成
✅ Docker/デプロイ設定
✅ ドキュメント作成

【人間の作業（約30分）】
⚠️ APIキー取得（10分）
⚠️ GCPプロジェクト作成（10分）
⚠️ 環境変数設定（5分）
⚠️ デプロイ承認（5分）

【コスト見積もり】
- 初期費用: $0
- 月額運用: $XX
- 従量課金: API呼び出し数による

この計画で進めてよろしいですか？(y/n)
```

## 🔒 セキュリティ考慮事項

### APIキー管理の自動化提案

```yaml
security_automation:
  development:
    - .env.example 自動生成
    - Secret Manager設定コード生成

  production:
    - Cloud KMS統合コード
    - IAMポリシー定義
    - 最小権限の原則適用

ai_never_handles:
  - 実際のAPIキー
  - 本番環境の認証情報
  - 顧客データ
  - 決済情報
```

## 📝 実装手順テンプレート

### Step 1: 要件定義フェーズ

```python
# AI が生成する要件定義書の例
requirements = {
    "system_type": "vertex_ai_rag",
    "features": [
        "文書アップロード",
        "ベクトル化処理",
        "類似検索",
        "回答生成"
    ],
    "external_apis": {
        "vertex_ai": {
            "services": ["text-embedding", "matching-engine"],
            "estimated_cost": "$100/month"
        }
    },
    "deployment": {
        "platform": "cloud_run",
        "region": "asia-northeast1",
        "scaling": "0-100 instances"
    },
    "human_tasks": [
        "GCPプロジェクト作成",
        "Vertex AI API有効化",
        "サービスアカウント作成"
    ]
}
```

### Step 2: 承認フロー

```javascript
// ユーザー承認のためのチェックリスト生成
const approvalChecklist = {
  technicalReview: {
    architecture: "✓ Cloud Run + Vertex AI",
    security: "✓ OAuth2.0 + Cloud IAM",
    scalability: "✓ Auto-scaling enabled"
  },

  costReview: {
    monthly: "$150-200",
    breakdown: {
      cloudRun: "$50",
      vertexAI: "$100",
      storage: "$10"
    }
  },

  humanTasks: {
    required: [
      "[ ] GCPコンソールでプロジェクト作成",
      "[ ] billing設定",
      "[ ] APIキー生成と保管"
    ],
    estimated_time: "30分"
  },

  confirmation: "これらの条件で実装を開始しますか？"
};
```

### Step 3: 実装フェーズ

```yaml
implementation_output:
  generated_files:
    backend:
      - "app.py"           # FastAPI アプリケーション
      - "rag_service.py"   # RAGロジック
      - "vertex_client.py" # Vertex AI クライアント

    infrastructure:
      - "Dockerfile"
      - "cloudbuild.yaml"
      - "terraform/main.tf"
      - ".github/workflows/deploy.yml"

    documentation:
      - "README.md"
      - "SETUP_GUIDE.md"    # 人間用セットアップガイド
      - "API_DOCS.md"

    scripts:
      - "deploy.sh"         # ワンクリックデプロイ
      - "test_local.sh"     # ローカルテスト
```

## 🚀 ワンクリックデプロイスクリプト

```bash
#!/bin/bash
# deploy_to_gcp.sh - AIが生成するデプロイスクリプト

echo "=== 🚀 デプロイ前チェック ==="

# 1. 必須環境変数の確認
required_vars=("GCP_PROJECT_ID" "VERTEX_AI_LOCATION" "LINE_CHANNEL_TOKEN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var が設定されていません"
        echo "💡 ヒント: export $var=your_value"
        exit 1
    fi
done

echo "✅ 環境変数OK"

# 2. GCPログイン確認
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q '@'; then
    echo "❌ GCPにログインしてください: gcloud auth login"
    exit 1
fi

echo "✅ GCP認証OK"

# 3. デプロイ承認
echo "
=== 📋 デプロイ内容 ===
プロジェクト: $GCP_PROJECT_ID
リージョン: $VERTEX_AI_LOCATION
推定コスト: $150/月

デプロイしますか？ (y/n)"
read -r response

if [ "$response" != "y" ]; then
    echo "デプロイをキャンセルしました"
    exit 0
fi

# 4. 自動デプロイ実行
echo "=== 🔨 デプロイ開始 ==="
gcloud run deploy my-api \
    --source . \
    --project $GCP_PROJECT_ID \
    --region $VERTEX_AI_LOCATION \
    --allow-unauthenticated

echo "✅ デプロイ完了！"
```

## 💡 ベストプラクティス

### 1. 段階的実装アプローチ

```yaml
phase1_local:
  - モックAPI使用
  - ローカル開発
  - コスト: $0

phase2_staging:
  - 実APIの限定利用
  - Cloud Run（最小構成）
  - コスト: $10/月

phase3_production:
  - フル機能
  - Auto-scaling
  - コスト: $100+/月
```

### 2. コスト最適化

```yaml
cost_optimization:
  vertex_ai:
    - バッチ処理でEmbedding生成
    - キャッシュ活用
    - 適切なモデル選択

  cloud_run:
    - コールドスタート最適化
    - 最小インスタンス数: 0
    - 同時実行数の調整
```

## ✅ まとめ

このエージェントシステムは：

1. **完全なコード生成**: 外部API連携を含む複雑なシステムのコードを生成
2. **デプロイ設定**: Docker、terraform、CI/CD設定まで自動生成
3. **人間との協調**: セキュリティとコストに関わる部分は人間が管理
4. **承認フロー**: 実装前に詳細な計画を提示し、承認を得てから実行
5. **ワンクリックデプロイ**: 人間の作業を最小化するスクリプト生成

これにより、複雑な外部API連携システムも効率的かつ安全に構築できます。