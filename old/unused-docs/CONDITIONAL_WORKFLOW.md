# 🔄 条件分岐型ワークフロー

## 📋 概要

要求内容に応じて自動的に最適なワークフローを選択します。
**デフォルトは常に全自動・ゼロコスト**を維持します。

## 🎯 ワークフロー判定ロジック

```python
def select_workflow(user_request):
    """
    ユーザー要求に基づいて適切なワークフローを選択
    デフォルトポリシー（$0、全自動）を最優先
    """

    # Step 1: 外部サービス要求の検出
    external_services = detect_external_services(user_request)

    # Step 2: ワークフロー選択
    if not external_services:
        # 🟢 通常ワークフロー（全自動、$0）
        return "standard_workflow"

    elif is_explicit_request(external_services, user_request):
        # 🟡 外部API対応ワークフロー（要承認）
        return "external_api_workflow"

    else:
        # 🟢 デフォルトポリシー適用（曖昧な場合）
        return "standard_workflow_with_note"

def detect_external_services(request):
    """明示的な外部サービス要求のみを検出"""

    explicit_services = {
        "cloud_sql": ["Cloud SQL", "CloudSQL"],
        "vertex_ai": ["Vertex AI", "VertexAI", "RAG"],
        "openai": ["OpenAI", "GPT", "ChatGPT"],
        "line": ["LINE", "LINEボット"],
        "cloud_run": ["Cloud Run", "CloudRun"],
        "gcp": ["GCP", "Google Cloud Platform"],
        "aws": ["AWS", "Amazon Web Services"],
        "firebase": ["Firebase", "Firestore"],
        "stripe": ["Stripe", "決済"],
    }

    detected = []
    for service, keywords in explicit_services.items():
        for keyword in keywords:
            if keyword.lower() in request.lower():
                detected.append(service)
                break

    return detected

def is_explicit_request(services, request):
    """明示的な要求かどうかを判定"""

    explicit_phrases = [
        "使って", "使用して", "利用して",
        "で実装", "を使った", "連携",
        "統合", "接続"
    ]

    for phrase in explicit_phrases:
        if phrase in request:
            return True

    return False
```

## 📊 ワークフロー分岐

### 🟢 パターン1: 通常ワークフロー（デフォルト）

**条件**: 外部サービス要求なし

```yaml
standard_workflow:
  characteristics:
    - 全自動実行
    - コスト: $0
    - 人間の介入: 不要
    - 実行時間: 30-45分

  flow:
    1. Phase 0: 初期化
    2. Phase 1: 要件定義・計画
    3. Phase 2: 実装（並列）
    4. Phase 3: テスト合格
    5. Phase 4: 品質改善
    6. Phase 5: 完成処理

  technology_stack:
    database: SQLite / LocalStorage
    backend: Node.js / Python（ローカル）
    frontend: React / Vue（ローカル）
    deployment: launch_app.command

  ai_message:
    "アプリを全自動で開発します。
     コスト: $0
     起動方法: launch_app.command
     開発を開始します..."
```

### 🟡 パターン2: 外部API対応ワークフロー

**条件**: 明示的な外部サービス要求あり

```yaml
external_api_workflow:
  characteristics:
    - 承認フロー付き
    - コスト: 月額$X
    - 人間の介入: 30分
    - 実行時間: 45-60分

  flow:
    1. Phase -1: 事前承認 ← 追加
    2. Phase 0: 環境準備（拡張版）
    3. Phase 1-5: 通常フロー（API対応版）
    4. Phase 6: デプロイ準備 ← 追加

  ai_message:
    "外部サービス（{service}）を使用したシステムですね。

     【確認事項】
     - 月額コスト: ${cost}
     - 必要な作業: {tasks}（30分）

     【代替案】
     ローカル実装なら$0で即座に開発可能です。

     どちらを選びますか？
     1. {service}を使用（月額${cost}）
     2. ローカル実装（無料）"
```

### 🟢 パターン3: デフォルト適用（曖昧な場合）

**条件**: 曖昧または不明確な要求

```yaml
standard_workflow_with_note:
  characteristics:
    - 通常ワークフローを実行
    - 代替オプションを提示
    - コスト: $0

  ai_message:
    "{feature}を含むアプリを開発します。

     デフォルト設定:
     - DB: SQLite（ローカル、無料）
     - 実行: launch_app.command

     ※ Cloud SQLなど外部サービスが必要な場合は
        明示的にお知らせください。

     開発を開始します..."
```

## 💬 実際の動作例

### 例1: シンプルな要求
```markdown
User: "メモアプリを作って"

AI判定: 外部サービス要求なし
選択: standard_workflow

AI: "メモアプリを全自動で開発します。
     - DB: SQLite
     - 起動: launch_app.command
     - コスト: $0
     開発を開始します..."

→ 即座に全自動開発開始
```

### 例2: 明示的な外部サービス要求
```markdown
User: "Vertex AIを使ったRAG検索システムを作って"

AI判定: 明示的な外部サービス要求
選択: external_api_workflow

AI: "Vertex AIを使用したRAG検索システムですね。

     【確認事項】
     - 月額コスト: $150-200
     - GCPプロジェクト作成が必要（10分）
     - APIキー設定が必要（10分）

     【代替案】
     ローカルの全文検索なら$0で実装可能です。

     どちらを選びますか？
     1. Vertex AI（月額$150-200）
     2. ローカル検索（無料）"

User: "1"

AI: "承知しました。Vertex AI対応で開発します。
     まず以下をご準備ください..."
```

### 例3: 曖昧な要求
```markdown
User: "AIを使ったアプリ"

AI判定: 曖昧（"AI"だけでは外部API確定できない）
選択: standard_workflow_with_note

AI: "AIアプリを開発します。

     デフォルト設定:
     - ローカルAI機能（TensorFlow.js）
     - コスト: $0

     ※ OpenAI APIなど外部AIサービスが必要な場合は
        明示的にお知らせください。

     開発を開始します..."
```

### 例4: データベースの曖昧な要求
```markdown
User: "データベースを使った在庫管理"

AI判定: DBは必要だが、種類が不明確
選択: standard_workflow_with_note

AI: "在庫管理システムを開発します。

     デフォルト設定:
     - DB: SQLite（ローカル、無料）
     - バックアップ: 自動（ローカル）

     ※ Cloud SQLなど外部DBが必要な場合は
        「Cloud SQLを使った在庫管理」のように
        明示的にお知らせください。

     開発を開始します..."
```

## 🔧 実装の要点

### 1. 後方互換性の完全維持
```yaml
compatibility:
  保証事項:
    - 既存の全自動開発は100%維持
    - デフォルトは常に$0
    - 追加の承認フローは明示的要求時のみ
```

### 2. ユーザー体験の最適化
```yaml
ux_optimization:
  principles:
    - 余計な質問をしない
    - デフォルトで最良の選択
    - 代替案は常に提示
    - コストは必ず事前開示
```

### 3. 判定の透明性
```yaml
transparency:
  always_show:
    - 選択したワークフロー
    - 選択理由
    - コスト
    - 代替オプション
```

## ✅ メリット

1. **後方互換**: 従来の全自動開発を完全維持
2. **柔軟性**: 必要に応じて外部サービス対応
3. **コスト最適**: デフォルトは常に無料
4. **透明性**: 判定理由を明確に説明
5. **選択権**: ユーザーが最終決定

## 🚨 重要な原則

### 絶対にやってはいけないこと
- ❌ デフォルトでコストが発生する選択
- ❌ 不要な承認フローの追加
- ❌ 曖昧な要求で外部サービス使用
- ❌ 全自動開発の阻害

### 必ず守ること
- ✅ デフォルト = 全自動 + $0
- ✅ 外部サービス = 明示的要求のみ
- ✅ コスト発生 = 必ず事前承認
- ✅ 代替案の提示 = 常に