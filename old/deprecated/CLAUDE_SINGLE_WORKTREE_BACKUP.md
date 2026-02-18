# AI エージェント完全自動実行ガイドライン

## 🚨 最優先実行ルール

### 1️⃣ 各タスク実行前に必ずCLAUDE.mdを読み直す
```yaml
task_execution_rule:
  before_each_task:
    - "必ずCLAUDE.mdを読み直す"
    - "現在のフェーズを確認"
    - "実行すべきタスクを確認"
    - "チェックポイントを確認"
  reason: "長時間の実行でワークフローを忘れないため"
```

### 2️⃣ DEFAULT_POLICY.mdを最初に必ず読む
```yaml
initial_check:
  step_1: "DEFAULT_POLICY.mdを読む"
  step_2: "外部API要否を判定"
  step_3: "ワークフロー選択（$0優先）"
```

### 3️⃣ frontend-designスキルは必ず明示的に宣言
```yaml
ui_generation:
  必須: "use the frontend design skill"
  対象: ["about.html", "UIコンポーネント", "ランディング"]
```

## 📋 ワークフロー実行チェックリスト

### 開始前チェック
- [ ] DEFAULT_POLICY.md 確認済み
- [ ] 外部API要否を判定済み
- [ ] ワークフロー選択済み（通常/$0 or 外部API対応）

### Phase 0: 初期化
- [ ] Git worktree作成
- [ ] PROJECT_INFO.yaml生成
- [ ] CLAUDE.md再読み込み ← 必須

### Phase 1: 計画（拡張版 - 精度向上）
- [ ] CLAUDE.md再読み込み ← 必須
- [ ] 1-1. 要件分析完了
- [ ] 1-2. 仕様設計完了（SPEC.md生成）← NEW
- [ ] 1-3. テスト設計完了
- [ ] 1-4. 技術選定・アーキテクチャ設計完了（TECH_STACK.md, API_DESIGN.md, ARCHITECTURE.md）← 拡張
- [ ] 1-5. WBS作成・クリティカルパス特定完了
- [ ] 1-6. AIプロンプト生成完了（画像必要な場合のみ - IMAGE_PROMPTS.json）← NEW

### Phase 2: 実装
- [ ] CLAUDE.md再読み込み ← 必須
- [ ] Frontend実装（frontend-design skill使用）
- [ ] Backend実装
- [ ] Database実装

### Phase 3: テスト合格
- [ ] CLAUDE.md再読み込み ← 必須
- [ ] 作成済みテスト100%合格
- [ ] カバレッジ70%以上
- [ ] クリティカルパス100%カバー

### Phase 4: 品質改善
- [ ] CLAUDE.md再読み込み ← 必須
- [ ] カバレッジ80-90%達成
- [ ] パフォーマンス最適化
- [ ] 改善回数3回以内

### Phase 5: 完成処理
- [ ] CLAUDE.md再読み込み ← 必須
- [ ] README.md生成
- [ ] documenter_agent.py実行
- [ ] about.html生成（frontend-design skill使用）
- [ ] explanation.mp3生成
- [ ] launch_app.command生成
- [ ] 公開用ファイルセット（README.md/about.html/explanation.mp3/launch_app.command）を明示
- [ ] スマホ縦/横でのindex.html・about.htmlレスポンシブ確認

### Phase 5.5: DELIVERY生成
- [ ] CLAUDE.md再読み込み ← 必須
- [ ] delivery_organizer.py実行
- [ ] DELIVERY/<app-name>/ の固定構成を検証（index.html/about.html/assets/explanation.mp3/README.md）
- [ ] about.html から mp3/静的ファイルの相対パス確認
- [ ] 成果物確認メッセージ表示（公開用ファイルリスト付き）

### Phase 6: GitHubポートフォリオ公開（Portfolio用プロジェクトのみ）
- [ ] CLAUDE.md再読み込み ← 必須
- [ ] Git初期化・コミット
- [ ] GitHubリポジトリ作成
- [ ] リポジトリ直下に <app-name>/ を作成し DELIVERY/<app-name> をそのまま配置してpush
- [ ] GitHub Pages設定（リポジトリルートまたは指定ブランチで <app-name>/ 配下を公開）
- [ ] 公開URL確認（例: https://user.github.io/repo/<app-name>/）

## 🔴 記憶保持ルール

**各フェーズ開始時に必ずチェックポイントを確認して出力すること**

```
=================================
📌 チェックポイント: [フェーズ名]
=================================
実行すべきタスク:
✅ [タスク1]
✅ [タスク2]
✅ [タスク3]
=================================
```

token_optimization:
  CLAUDE_md_reread:
    理想: "毎回全文読み直し"
    現実的: "各フェーズの該当セクションのみ読む"
  checkpoint_output:
    フォーマット: "phase: 2, tasks: [task1, task2], status: in_progress"（簡潔なYAMLでOK）

## 🚨 初期設定（必ず実行前に確認）

**重要: 実行環境を確認**
- テンプレート環境（git-worktree-agent）: 保護対象、直接開発禁止
- 専用環境（AI-Apps/*-agent）: ここで開発を実行

### 必須確認ファイル（ワークフロー実行前に必ず Read ツールで確認）
1. `WORKFLOW_EXECUTION_GUIDE.md` - 実行ガイド（最初に読む）
2. `DEFAULT_POLICY.md` - デフォルトポリシー（最優先で確認）
3. `WORKFLOW_AUTOMATION_V6.md` - ワークフロー詳細定義
4. `WORKFLOW_CHECKPOINT_SYSTEM.md` - チェックポイントシステム（タスク忘れ防止）
5. `TASK_PARALLEL_EXECUTION_GUIDE.md` - Taskツール並列実行ガイド（最重要！）← NEW！
6. `FRONTEND_DESIGN_SKILL_GUIDE.md` - frontend-designスキル使用ガイド（重要）
7. `PHASE_6_PUBLISHING_FLOW.md` - GitHub公開フロー（Phase 6用）
8. `agent_config.yaml` - エージェント設定
9. `WBS_TEMPLATE.json` - タスク分割テンプレート
10. `SUBAGENT_PROMPT_TEMPLATE.md` - サブエージェント用プロンプト

## 📋 実行開始手順

### STEP -2: API認証チェック（推奨）
```bash
# 認証状態を確認（専用環境で実行）
python3 ~/Desktop/git-worktree-agent/src/credential_checker.py .

# 出力例:
# ✅ GCP (Text-to-Speech & Imagen): OK
# ✅ GitHub: OK
# 🚀 ワークフローを実行できます

# ❌ 未設定の場合:
# ⚠️ GCP認証が未設定です
# 📝 セットアップガイド: API_CREDENTIALS_SETUP.md
```

**重要**: API認証を設定することで以下が完全自動化されます：
- ✅ Phase 5: `explanation.mp3` 生成（GCP Text-to-Speech）
- ✅ Phase 5: ゲーム画像生成（Vertex AI Imagen）
- ✅ Phase 6: GitHub自動公開

**セットアップ手順**: `API_CREDENTIALS_SETUP.md` を参照

### STEP -1: ポリシー判定（最重要）
```yaml
policy_decision:
  最優先: "デフォルトポリシー（$0、全自動）"

  判定基準:
    - 外部API要求なし → 通常ワークフロー（全自動）
    - 明示的な外部API要求 → 承認フロー後に外部API対応
    - 曖昧な場合 → デフォルトポリシー適用

  examples:
    "Todoアプリ作って": → SQLite、ローカル実行（$0）
    "Cloud SQL使ったTodoアプリ": → 承認確認後、Cloud SQL対応
    "データベースアプリ": → SQLite（デフォルト）

詳細: DEFAULT_POLICY.md を参照
```

### STEP 0: プロジェクト初期化
```bash
# 初期化フェーズ
1. 環境チェック:
   - Git状態確認
   - 依存関係確認
   - 権限確認

2. プロジェクトセットアップ:
   - PROJECT_INFO.yaml 生成
   - .gitignore 作成
   - ディレクトリ構造作成

3. Phase別Worktree作成（9個 - 自動実行済み）:
   ⚠️ create_new_app.command で既に作成されています

   構成:
   - phase1-planning-a/b         # 計画（2案）
   - phase2-impl-prototype-a/b/c # 実装（3プロトタイプ）
   - phase3-testing              # テスト
   - phase4-quality-opt-a/b      # 品質改善（2最適化）
   - phase5-delivery             # 完成処理

   詳細: PHASE_WORKTREE_AUTONOMOUS_STRATEGY.md 参照
```

### STEP 1: ワークフロー開始
以下のフェーズを順番に実行する（Task ツールを使用）：

## 🚀 ワークフロー v7.0 - 一気通貫自動実行

### 📌 重要変更点
```
Portfolio Appの場合:
Phase 0 → 1 → 2 → 3 → 4 → 5 → 5.5 → 6 まで中断なく自動実行
ユーザー確認は最後のみ（GitHub公開完了後）

Client Appの場合:
Phase 0 → 1 → 2 → 3 → 4 → 5 → 5.5 で完了
```

## 🤖 Task ツールを使った並列ワークフロー実行

### 🚨 最重要警告：Taskツールを必ず使用すること

**worktree・ディレクトリ指定の徹底**
- すべてのTaskプロンプトで作業ディレクトリを `./worktrees/mission-{プロジェクト名}/` と明示
- テンプレート直下（git-worktree-agentルート）では絶対に作業しない
- 並列タスクを送る前に `pwd` / `ls` で mission worktree であることを確認してから委任
- Task経由で正しく実行できていれば git-worktree-agent 本体に変更が入らない

**⛔ 絶対にやってはいけないこと:**
```yaml
wrong_approach:
  ❌ 自分で直接worktreeに移動して作業
  ❌ 自分で直接ファイルを作成・編集
  ❌ 自分で直接テストを実行
  ❌ 自分で直接コマンドを実行
```

**✅ 必ず行うべきこと:**
```yaml
correct_approach:
  ✅ 各フェーズはTaskツールでサブエージェントを起動
  ✅ 並列タスクは1つのメッセージで複数Task呼び出し
  ✅ サブエージェントに作業を委任
  ✅ 結果を待って統合
```

### 🔴 重要：Task実行前の必須ルール
```yaml
before_task_execution:
  必須手順:
    1. "CLAUDE.mdを読み直す"
    2. "現在のフェーズを確認"
    3. "Taskツールを使用しているか確認" ← 重要追加
    4. "チェックポイント出力"
  理由: "並列処理とコンテキスト分離を実現するため"
```

### 1. 要件定義・計画フェーズ（Phase別worktree並列開発）

#### 🚀 Phase 1: 複数計画案の並列生成・自律評価

**戦略:** 2つの計画アプローチを並列生成し、自律評価して最良を選択

#### 1-1. 並列計画生成
```
📌 Task実行前に必須:
1. CLAUDE.mdを読み直す
2. Phase 1のチェックリストを確認
3. PHASE_WORKTREE_AUTONOMOUS_STRATEGY.md を参照
4. ⚠️ 2つのTaskを1つのメッセージで並列実行

Task 1: Planning Approach A（保守的）
- worktree: phase1-planning-a/
- subagent_type: "general-purpose"
- prompt: |
    あなたは保守的なアーキテクトです。
    作業ディレクトリ: ./worktrees/phase1-planning-a/

    【作業内容】
    - 実績のある技術スタックを選択
    - リスクを最小化
    - 段階的な実装計画
    - SUBAGENT_PROMPT_TEMPLATE.md の「1. Requirements Analyst」に準拠

Task 2: Planning Approach B（革新的）
- worktree: phase1-planning-b/
- subagent_type: "general-purpose"
- prompt: |
    あなたは革新的なアーキテクトです。
    作業ディレクトリ: ./worktrees/phase1-planning-b/

    【作業内容】
    - 最新技術を積極採用
    - パフォーマンス最優先
    - アグレッシブな実装計画
    - SUBAGENT_PROMPT_TEMPLATE.md の「1. Requirements Analyst」に準拠

⚠️ 重要: 1つのメッセージで2つのTaskを同時に呼び出す
```

#### 1-2. 自律評価・選択
```
📌 2つの計画案が完成したら自動実行

Task 3: Autonomous Evaluation
- subagent_type: "general-purpose"
- prompt: |
    あなたは計画評価の専門家です。

    【評価対象】
    - Approach A: ./worktrees/phase1-planning-a/
    - Approach B: ./worktrees/phase1-planning-b/

    【評価基準】
    1. 技術スタックの適切性（30点）
    2. 実装可能性（25点）
    3. 保守性（20点）
    4. パフォーマンス（15点）
    5. 拡張性（10点）

    【出力形式】
    EVALUATION_REPORT.json:
    {
      "approach_a": {"score": XX, "strengths": [...], "weaknesses": [...]},
      "approach_b": {"score": XX, "strengths": [...], "weaknesses": [...]},
      "recommendation": "approach_a または approach_b",
      "reason": "選択理由"
    }

【自動マージ】
評価完了後、スコアが高い方を自動的にmainにマージ:
  git checkout main
  git merge phase/planning-a  # または phase/planning-b
```

#### 1-3. 仕様設計（選択された計画案を基に）
```
📌 Task実行前に必須:
1. CLAUDE.mdを読み直す
2. 要件定義の成果物（REQUIREMENTS.md）を確認
3. チェックポイント出力
4. ⚠️ Taskツール使用確認

Task実行（必ずTaskツールを使用）:
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「2. Specification Designer」を使用

成果物:
  - SPEC.md: 詳細仕様書
    * 機能一覧（優先度付き）
    * 画面遷移図（テキスト表現）
    * データフロー図（入出力定義）
    * 制約条件（性能、セキュリティ、UX）
  - user_stories.json: 実装可能な粒度のユーザーストーリー
  - data_models.md: 主要データ構造の定義

重要性:
  - 要件定義とWBSのギャップを埋める
  - 実装時の手戻りを防ぐ
  - テスト設計の品質向上に寄与

次フェーズへの引き継ぎ:
  - SPEC.md → WBS作成の入力
  - data_models.md → 技術選定の参考
  - user_stories.json → テスト設計の基準
```

#### 1-3. WBS作成とクリティカルパス分析（改善ループ：最大3回）
```
📌 Task実行前に必須:
1. CLAUDE.mdを読み直す
2. WBS作成の重要性を再確認
3. チェックポイント出力

Task実行:
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「2. Planner（WBS作成）」を使用
- 追加指示: WBS_CRITICAL_PATH_TEMPLATE.json を参照してクリティカルパスを特定
- 改善ループ: 初回実行 → タスク粒度評価 → 依存関係最適化（最大2回追加実行）

重要:
- WBSの品質が全体の成否を決定
- クリティカルパスを明確に識別
- 並列実行可能なタスクをグループ化
```

#### 1-3. テスト設計（改善ループ：最大3回）
```
📌 ワークフロー再確認を出力してから実行

Task実行:
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「7. Test Designer」を使用
- 改善ループ: 初回実行 → カバレッジ評価 → 追加生成（最大2回追加実行）
重要: テストの品質が実装の品質を保証
```

#### 1-4. 技術選定・アーキテクチャ設計（NEW - 拡張版）
```
📌 Task実行前に必須:
1. CLAUDE.mdを読み直す
2. SPEC.md（Phase 1-2の成果物）を確認
3. 技術選定基準を確認（DEFAULT_POLICY.md、API_USAGE_POLICY.md）

Task実行:
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「4. Tech Stack Selector」を使用

成果物:
  - TECH_STACK.md: 技術スタック決定書
    * フロントエンド: フレームワーク、ライブラリ、UIコンポーネント
    * バックエンド: 言語、フレームワーク、ランタイム
    * データベース: RDBMS/NoSQL選択、理由
    * 外部API: 必要なAPI、コスト試算、代替案
    * インフラ: デプロイ方式、ホスティング
  - API_DESIGN.md: API仕様
    * RESTful/GraphQL選択
    * エンドポイント一覧
    * リクエスト/レスポンス例
  - ARCHITECTURE.md: システムアーキテクチャ
    * コンポーネント図
    * データフロー
    * 依存関係

重要な判定:
  1. 外部API要否（DEFAULT_POLICY.md確認）
  2. コスト試算（API_USAGE_POLICY.md確認）
  3. $0優先、価値向上のための低コストAPIは自動承認
  4. 認証・決済など高コストAPIは明示的承認を求める

選定基準:
  - シンプル優先（過剰な技術選択を避ける）
  - ポートフォリオ向けは最新技術も検討
  - Client向けは安定性・保守性優先
  - セキュリティ・パフォーマンス考慮
```

#### 1-5. WBS作成とクリティカルパス分析（改善ループ：最大3回）
```
📌 Task実行前に必須:
1. CLAUDE.mdを読み直す
2. SPEC.md、TECH_STACK.md を確認
3. WBS作成の重要性を再確認
4. チェックポイント出力

Task実行:
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「6. Planner（WBS作成）」を使用
- 追加指示: WBS_CRITICAL_PATH_TEMPLATE.json を参照してクリティカルパスを特定
- 改善ループ: 初回実行 → タスク粒度評価 → 依存関係最適化（最大2回追加実行）

重要:
- WBSの品質が全体の成否を決定
- クリティカルパスを明確に識別
- 並列実行可能なタスクをグループ化
- TECH_STACK.mdの技術選定を反映
```

#### 1-6. AIプロンプト生成（NEW - 画像生成が必要な場合のみ）
```
📌 実行条件:
- 画像アセットが必要なプロジェクト（ゲーム、ビジュアル重視アプリ等）
- Vertex AI Imagenを使用する場合

📌 Task実行前に必須:
1. CLAUDE.mdを読み直す
2. SPEC.md、TECH_STACK.md を確認
3. 画像アセット一覧を抽出

Task実行:
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「4. Prompt Engineer」を使用

成果物:
  - IMAGE_PROMPTS.json: 画像生成プロンプト集
    ```json
    {
      "assets": [
        {
          "filename": "player_ship.png",
          "prompt": "Cute pixel art spaceship flying upward, blue metallic, glowing engine, top-down view for mobile game",
          "aspect_ratio": "1:1",
          "priority": "high"
        },
        {
          "filename": "enemy_alien.png",
          "prompt": "Cute pixel art alien enemy facing downward, green skin, purple eyes, top-down view",
          "aspect_ratio": "1:1",
          "priority": "high"
        }
      ],
      "fallback_strategy": "SVG代替（カラフル幾何学図形）",
      "estimated_cost": "$0.50"
    }
    ```

重要:
  - プロンプトは英語で作成（Imagen最適化）
  - 優先度付け（クリティカルな画像から生成）
  - フォールバック戦略を明記
  - コスト試算を含める（$0.020/画像）
```

#### 1-7. テスト設計（改善ループ：最大3回）
```
📌 ワークフロー再確認を出力してから実行

Task実行:
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「7. Test Designer」を使用
- 改善ループ: 初回実行 → カバレッジ評価 → 追加生成（最大2回追加実行）
重要: テストの品質が実装の品質を保証
```

### 2. 実装フェーズ（クリティカルパス優先・並列実行）

#### 🚨 並列実行の正しい実装方法

**❌ 間違った実装（絶対に避ける）:**
```python
# 自分で直接実装してしまう - これは間違い！
implement_frontend()  # 順次実行
implement_backend()   # 順次実行
implement_database()  # 順次実行
```

**✅ 正しい実装（必ずこの方法を使う）:**
```python
# 1つのメッセージで3つのTaskツールを同時に呼び出す
Task(
  description="Frontend Development",
  subagent_type="general-purpose",
  prompt=FRONTEND_DEVELOPER_TEMPLATE
)
Task(
  description="Backend Development",
  subagent_type="general-purpose",
  prompt=BACKEND_DEVELOPER_TEMPLATE
)
Task(
  description="Database Implementation",
  subagent_type="general-purpose",
  prompt=DATABASE_TEMPLATE
)
# → 3つが並列実行される
```

#### 実装フェーズの実行手順
```
📌 ワークフロー再確認を出力してから実行
📌 クリティカルパスのタスクを最優先で実行
📌 Taskツールを使用しているか必ず確認

実行戦略:
1. クリティカルパスタスク（最優先）
2. クリティカルパスに依存するタスク（高優先）
3. 独立した並列可能タスク（通常優先）

sequential_critical_path:
  step_1: "API仕様定義（単独Task）"
  step_2: "データモデル定義（単独Task）"

parallel_execution (step_1, step_2 完了後):
  - Frontend（API仕様参照）
  - Backend（API仕様+データモデル参照）
  - Database（データモデル参照）

integration:
  step_3: "統合テストと結線確認（親エージェントが実行）"
  統合確認項目（親の責任）:
    - Frontend→Backend API呼び出しが動作するか
    - Backend→Database CRUD操作が正常か
    - 認証フローがエンドツーエンドで通るか
    - 環境変数の整合性（.env.exampleとコードの一致）

並列実行グループ（WBSのクリティカルパス分析に基づく）:

Group 1: クリティカルパス（最初に実行）
- API仕様定義
- 認証システム基盤
- データモデル定義

Group 2: 並列実行可能タスク（Group 1完了後 - 1メッセージで同時実行）
Task 1: Frontend
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「8. Frontend Developer」
- 依存: API仕様定義完了

Task 2: Backend
- subagent_type: "general-purpose"
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「9. Backend Developer」
- 依存: API仕様定義、データモデル定義完了

Task 3: Database
- subagent_type: "general-purpose"
- prompt: データベース実装の標準プロンプト
- 依存: データモデル定義完了

⚠️ 重要: Group 2の3つのTaskは必ず1つのメッセージで同時に呼び出す

【NEW】モバイルゲーム判定（条件付き）:
  実装前確認:
    1. PROJECT_INFO.yaml を確認
    2. platform が "mobile" または mobile_features に "tilt_control" があるか判定
    3. YES の場合: Frontend Developer に以下を追加指示

  追加タスク（自動的にFrontend Developerに含まれる）:
    - GYRO_CONTROLS_STANDARD.md v2.0 に完全準拠した実装
    - GyroControls.js 作成（sensitivity = 3.5, v2で高感度化）
    - VirtualJoystick.js 作成（必須フォールバック）
    - InputSystem.js でジャイロ + ジョイスティック統合
    - デフォルト操作: ジョイスティック（ジャイロはオプション）
    - 操作モード切り替えUI（🎯 傾き / 🕹️ スティック）
    - iOS 18対応: clickまたはtouchendイベントで許可取得（touchstart不可）
    - 横向き/縦向き自動対応
    - テスト項目: ジャイロ許可なしでも遊べることを確認（最重要）

  重要:
    - Frontend Developerプロンプト（8番）に詳細手順が含まれている
    - 専用エージェント不要（条件分岐で対応）
    - GYRO_CONTROLS_STANDARD.md v2.0が成功事例の完全な実装を提供
    - バーチャルジョイスティックで100%プレイ可能を保証

【NEW】画像生成が必要な場合（ゲーム・ビジュアル重視アプリ）:
  ⚠️ 最重要: use the gcp skill を必ず明示的に宣言

  画像生成実行フロー（完全自動化）:

    ステップ0: 前提条件確認
      - TECH_STACK.md で画像生成が決定されていること
      - IMAGE_PROMPTS.json（Phase 1-6で生成）が存在すること

    ステップ1: GCP認証の自動セットアップ
      ⚠️ use the gcp skill を宣言してから以下を実行:

      ```bash
      # 認証ファイルパスを環境に応じて決定
      # パターン1: テンプレート環境
      CRED_PATH_TEMPLATE="$HOME/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json"
      # パターン2: 専用環境
      CRED_PATH_DEDICATED="../credentials/gcp-workflow-key.json"

      # 環境検出
      if [ -f "$CRED_PATH_DEDICATED" ]; then
        CRED_FILE="$CRED_PATH_DEDICATED"
        echo "✅ 専用環境の認証ファイルを検出: $CRED_FILE"
      elif [ -f "$CRED_PATH_TEMPLATE" ]; then
        CRED_FILE="$CRED_PATH_TEMPLATE"
        echo "✅ テンプレート環境の認証ファイルを検出: $CRED_FILE"
      else
        CRED_FILE=""
      fi

      if [ -z "$CRED_FILE" ] || [ ! -f "$CRED_FILE" ]; then
        echo "⚠️ GCP認証ファイルが存在しません - 自動セットアップを開始します"

        # プロジェクトID取得
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

        if [ -z "$PROJECT_ID" ]; then
          echo "❌ GCPプロジェクトが設定されていません"
          echo "以下のいずれかを実行してください："
          echo "  1. gcloud auth login"
          echo "  2. gcloud config set project YOUR_PROJECT_ID"
          echo "⚠️ 画像生成をスキップし、SVG代替を使用します"
          # SVG代替フローへ移行
          exit 0
        fi

        # Vertex AI API有効化
        echo "🔧 Vertex AI APIを有効化しています..."
        gcloud services enable aiplatform.googleapis.com --project=$PROJECT_ID

        # サービスアカウント作成（TTS用と統合）
        SA_NAME="ai-agent"
        SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

        if ! gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID &>/dev/null; then
          gcloud iam service-accounts create $SA_NAME \
            --display-name="AI Agent (TTS + Imagen)" \
            --project=$PROJECT_ID

          # 権限付与（TTS + Vertex AI）
          gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/cloudtts.admin" \
            --condition=None

          gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/aiplatform.user" \
            --condition=None
        else
          # 既存のサービスアカウントにVertex AI権限を追加
          gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/aiplatform.user" \
            --condition=None 2>/dev/null || true
        fi

        # キー生成（環境に応じて保存先を決定）
        # 保存先を決定
        if [ -d "../credentials" ]; then
          # 専用環境の場合
          CRED_DIR="../credentials"
          CRED_FILE="../credentials/gcp-workflow-key.json"
        elif [ -d "./credentials" ]; then
          # エージェント環境ルートから実行の場合
          CRED_DIR="./credentials"
          CRED_FILE="./credentials/gcp-workflow-key.json"
        else
          # テンプレート環境の場合（デフォルト）
          CRED_DIR="$HOME/Desktop/git-worktree-agent/credentials"
          CRED_FILE="$HOME/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json"
        fi

        mkdir -p "$CRED_DIR"
        gcloud iam service-accounts keys create \
          "$CRED_FILE" \
          --iam-account=$SA_EMAIL \
          --project=$PROJECT_ID

        chmod 600 "$CRED_FILE"

        echo "✅ GCP認証セットアップ完了（TTS + Imagen統合）: $CRED_FILE"
      else
        echo "✅ GCP認証ファイル既存"

        # Vertex AI権限を追加（TTSのみの場合）
        SA_EMAIL=$(cat $CRED_FILE | python3 -c "import sys, json; print(json.load(sys.stdin)['client_email'])")
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

        gcloud projects add-iam-policy-binding $PROJECT_ID \
          --member="serviceAccount:$SA_EMAIL" \
          --role="roles/aiplatform.user" \
          --condition=None 2>/dev/null || true

        echo "✅ Vertex AI権限確認完了"
      fi

      export GOOGLE_APPLICATION_CREDENTIALS="$CRED_FILE"
      ```

    ステップ2: IMAGE_PROMPTS.json を読み込み
      - Phase 1-6で生成されたプロンプトを使用
      - 優先度順（CRITICAL → HIGH → MEDIUM → LOW）で生成

    ステップ3: 画像生成実行
      - gcp-skill/IMAGEN_API.md のPython実装を使用
      - 各画像生成後、2秒待機（クォータ対策）
      - 生成成功: PNGファイル保存
      - 生成失敗: SVG代替を使用（IMAGE_PROMPTS.jsonのfallback_svg）

    ステップ4: 結果記録
      - 成功した画像数、失敗した画像数をカウント
      - コスト試算（成功数 × $0.020）
      - README.mdに記録:
        ```markdown
        ## 画像生成結果
        - Imagen生成: 25/30枚成功
        - SVG代替: 5枚
        - コスト: $0.50
        ```

  コスト管理:
    - 1画像: $0.020
    - 1ゲーム: 20-30画像 → $0.40-0.60
    - 月間予算: $25推奨
    - クォータ: 分間5-10リクエスト（2秒待機推奨）

  エラーハンドリング:
    - GCPプロジェクト未設定: 警告 → SVG代替 → 継続
    - API未有効化: 自動有効化 → リトライ
    - 認証エラー: 自動セットアップ → リトライ
    - クォータ超過: 待機時間延長 → リトライ（最大3回）
    - その他エラー: SVG代替 → 継続

  重要な注意事項:
    ✅ 画像生成失敗はプロジェクト全体の失敗ではない
    ✅ SVG代替で動作可能なゲーム/アプリを作成
    ✅ 失敗理由を明確にREADME.mdに記録
    ✅ ユーザーに手動セットアップ方法を提示
```

### 3. テスト合格フェーズ（作成済みテストは100%合格必須）
```
📌 ワークフロー再確認を出力してから実行

テスト実行ループ（作成済みテストは100%合格まで継続）:
1. すべてのテストを実行
2. 失敗があれば修正（Fixerエージェント）
3. 再度テスト実行

【カバレッジ基準】
- 作成済みテスト: 100%合格必須（妥協なし）
- 実カバレッジ: 70%以上（最低限）
- クリティカルパス: 100%必須（認証、決済、データ検証）

※ 作成済みテストが100%合格するまで次フェーズへ進まない
```

### 4. 品質改善フェーズ（カバレッジ80-90%目標、最大3回改善）
```
📌 ワークフロー再確認を出力してから実行

改善ループ実行（最大3回）:
1. Task: Evaluator
   - prompt: SUBAGENT_PROMPT_TEMPLATE.md の「10. Evaluator」
   - 品質評価（カバレッジ、パフォーマンス、可読性、セキュリティ）

2. カバレッジ改善（目標: 80-90%）
   - 現在のカバレッジを確認
   - 不足している重要なテストを追加
   - クリティカルパスは100%を目指す

3. Task: Improvement Planner（改善余地がある場合）
   - prompt: SUBAGENT_PROMPT_TEMPLATE.md の「11. Improvement Planner」

4. Task: Fixer（改善実装）
   - prompt: SUBAGENT_PROMPT_TEMPLATE.md の「12. Fixer」
   - 作成済みテストは100%合格を維持
   - 新規テストも追加

【目標カバレッジ】
- 全体: 80-90%
- ビジネスロジック: 90-100%
- API/統合: 80-90%
- UI/E2E: 70-80%

収束条件:
- 目標カバレッジに達したら早期終了可
- 既存テスト100%合格を維持
```

### 5. 完成処理フェーズ（全タスク必須）
```
🚨 Phase 5 実行前の必須確認
=================================
1. CLAUDE.mdを読み直す ← 必須！
2. WORKFLOW_CHECKPOINT_SYSTEM.mdを読む
3. 以下のチェックポイントを出力
=================================

=================================
📌 チェックポイント: フェーズ5 - 完成処理
=================================
出口条件（全て必須）:
✅ README.md 生成（公開用の概要を含む）
✅ documenter_agent.py 実行 ← 最重要！忘れやすい！
✅ about.html 生成（frontend-design skill使用、mp3埋め込み済み）
✅ explanation.mp3 生成（存在しない場合はスキップ理由を明記）
✅ launch_app.command 生成（実行権限付与）
✅ 公開用ファイルリストを明示（README.md/about.html/explanation.mp3/launch_app.command/index.html/必要なassets）
✅ index.html / about.html のスマホ縦・横でのレスポンシブ確認（レイアウト崩れ/タップ検証）
Phase 5完了後の自動検証:
  bash: validate_phase5()  # DELIVERY必須ファイル確認
  pass: Phase 5.5へ自動進行
  fail: 不足ファイルを生成して再検証
=================================

⚠️ Phase 5 完了後の自動処理:
→ Phase 5.5（DELIVERY生成）を自動実行
→ Phase 6（GitHub公開）を自動実行（Portfolio Appの場合）
=================================

⚠️ 注意: documenter_agent.pyを忘れると about.html が生成されません！
documenter_agent.py失敗時の対応:
  retry: 最大3回自動リトライ
  fallback:
    - about.html をテンプレートから手動生成（frontend-design skill使用）
    - audio_script.txt を手動作成
    - explanation.mp3 は後続タスクでスキップし、理由を記録

重要: 以下の3つのTaskを1つのメッセージで同時に呼び出す

Task 1: Documenter（最重要 - 絶対に忘れない）
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「14. Documenter」
- 必須実行コマンド:
  * テンプレート環境: python3 ~/Desktop/git-worktree-agent/src/documenter_agent.py
  * 専用環境: python3 ../src/documenter_agent.py (worktree内から実行)
  * または: python3 ./src/documenter_agent.py (エージェント環境ルートから実行)
- 検証項目:
  * about.html が生成されているか（frontend-design skill使用）
  * audio_script.txt が生成されているか
  * generate_audio_gcp.js が生成されているか
  * package.json に @google-cloud/text-to-speech が追加されているか

Task 2: Launcher Creator
- prompt: SUBAGENT_PROMPT_TEMPLATE.md の「15. Launcher Creator」
- 生成物: launch_app.command
- 実行権限付与: chmod +x launch_app.command

Task 3: Audio Generator（GCP認証の自動セットアップ付き）
- prompt: 音声生成用プロンプト（以下参照）
- 実行フロー:
  1. 認証ファイル確認（~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json）
  2. 存在しない場合: use the gcp skill を宣言し、自動セットアップ実行
  3. 存在する場合: そのまま音声生成実行
- 生成物: explanation.mp3（認証セットアップ成功時）
- フォールバック: セットアップ失敗時は音声なしで継続（理由を記録）

📌 追加検証（Phase 5 完了時に必ず実施）
- 公開用ファイルリストをREADME.mdに記載し、about.htmlからexplanation.mp3が相対パス（例: ./explanation.mp3）で再生できることを確認
- index.html/about.htmlの主要導線がスマホ縦・横どちらでもクリック/タップ可能であることを簡易確認（デバッガ不要の目視・ブラウザサイズ変更でOK）
```

### 音声生成用プロンプト:
```
あなたは音声生成担当者です。

【作業環境】
- 作業ディレクトリ: ./worktrees/mission-{プロジェクト名}/
- GCP認証: 環境に応じて自動検出

【タスク】
0. GCP認証の自動セットアップ（認証ファイルがない場合）:
   ⚠️ 重要: use the gcp skill を必ず明示的に宣言してから実行

   ```bash
   # 認証ファイルパスを環境に応じて決定
   # パターン1: テンプレート環境（git-worktree-agent）
   CRED_PATH_TEMPLATE="$HOME/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json"

   # パターン2: 専用環境（AI-Apps/{app-name}-agent）
   # ワークツリー内から: ../credentials/gcp-workflow-key.json
   # エージェント環境ルートから: ./credentials/gcp-workflow-key.json
   CRED_PATH_DEDICATED="../credentials/gcp-workflow-key.json"

   # 環境検出: 現在地を確認
   if [ -f "$CRED_PATH_DEDICATED" ]; then
     CRED_FILE="$CRED_PATH_DEDICATED"
     echo "✅ 専用環境の認証ファイルを検出: $CRED_FILE"
   elif [ -f "$CRED_PATH_TEMPLATE" ]; then
     CRED_FILE="$CRED_PATH_TEMPLATE"
     echo "✅ テンプレート環境の認証ファイルを検出: $CRED_FILE"
   else
     CRED_FILE=""
   fi

   if [ -z "$CRED_FILE" ] || [ ! -f "$CRED_FILE" ]; then
     echo "⚠️ GCP認証ファイルが存在しません - 自動セットアップを開始します"
     echo "use the gcp skill"

     # プロジェクトID取得
     PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

     if [ -z "$PROJECT_ID" ]; then
       echo "❌ GCPプロジェクトが設定されていません"
       echo "以下のいずれかを実行してください："
       echo "  1. gcloud auth login"
       echo "  2. gcloud config set project YOUR_PROJECT_ID"
       echo "⚠️ 音声生成をスキップします"
       exit 0
     fi

     echo "📋 使用するプロジェクト: $PROJECT_ID"

     # Text-to-Speech API有効化
     echo "🔧 Text-to-Speech APIを有効化しています..."
     gcloud services enable texttospeech.googleapis.com --project=$PROJECT_ID

     # サービスアカウント作成（既存の場合はスキップ）
     SA_EMAIL="tts-agent@$PROJECT_ID.iam.gserviceaccount.com"
     if ! gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID &>/dev/null; then
       echo "🔧 サービスアカウントを作成しています..."
       gcloud iam service-accounts create tts-agent \
         --display-name="Text-to-Speech Agent" \
         --project=$PROJECT_ID

       # 権限付与
       gcloud projects add-iam-policy-binding $PROJECT_ID \
         --member="serviceAccount:$SA_EMAIL" \
         --role="roles/cloudtts.admin" \
         --condition=None
     else
       echo "✅ サービスアカウント既存: $SA_EMAIL"
     fi

     # キー生成（環境に応じて保存先を決定）
     echo "🔑 認証キーを生成しています..."

     # 保存先を決定
     if [ -d "../credentials" ]; then
       # 専用環境の場合
       CRED_DIR="../credentials"
       CRED_FILE="../credentials/gcp-workflow-key.json"
     elif [ -d "./credentials" ]; then
       # エージェント環境ルートから実行の場合
       CRED_DIR="./credentials"
       CRED_FILE="./credentials/gcp-workflow-key.json"
     else
       # テンプレート環境の場合（デフォルト）
       CRED_DIR="$HOME/Desktop/git-worktree-agent/credentials"
       CRED_FILE="$HOME/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json"
     fi

     mkdir -p "$CRED_DIR"
     gcloud iam service-accounts keys create \
       "$CRED_FILE" \
       --iam-account=$SA_EMAIL \
       --project=$PROJECT_ID

     chmod 600 "$CRED_FILE"

     echo "✅ GCP認証セットアップ完了: $CRED_FILE"
   else
     echo "✅ GCP認証ファイルが存在します: $CRED_FILE"
   fi
   ```

1. 音声生成実行:
   ```bash
   # 環境変数設定（上記で決定された$CRED_FILEを使用）
   export GOOGLE_APPLICATION_CREDENTIALS="$CRED_FILE"
   npm install @google-cloud/text-to-speech
   node generate_audio_gcp.js
   ```

2. 生成確認:
   - explanation.mp3 が生成されていること
   - 生成されない場合は理由を記録（README.mdに追記）

【成果物】
- explanation.mp3（セットアップ成功時）
- セットアップ失敗時: 理由をREADME.mdに記録し、音声なしで継続

【エラーハンドリング】
- GCPプロジェクト未設定 → ユーザーに設定方法を通知してスキップ
- API有効化失敗 → 権限不足を通知してスキップ
- キー生成失敗 → エラー内容を記録してスキップ
```

### 5.5. DELIVERY生成フェーズ（Phase 5完了後、自動実行必須）
```
🚨 Phase 5完了直後に自動実行 - ユーザー確認不要
=================================
📌 チェックポイント: Phase 5.5 - DELIVERY生成
=================================

実行コマンド:
python3 ~/Desktop/git-worktree-agent/src/delivery_organizer.py

確認項目:
✅ DELIVERYフォルダが生成されているか
✅ summary.htmlが含まれているか
✅ docs/フォルダに設計書等が含まれているか
=================================
```

### 6. GitHubポートフォリオ公開フェーズ（Phase 5.5完了後、自動実行必須）
```
🚨 Portfolio Appの場合、Phase 5.5完了直後に自動実行 - ユーザー確認不要
=================================
📌 チェックポイント: Phase 6 - GitHub自動公開
=================================

実行前確認:
1. PROJECT_INFO.yaml の development_type を確認
2. "Portfolio App" の場合のみ実行
3. "Client App" の場合はスキップ

実行コマンド:
python3 ~/Desktop/git-worktree-agent/src/simplified_github_publisher.py .

🔴 定型タスク（必ず実行）:
✅ リモートリポジトリ: https://github.com/sohei-t/ai-agent-portfolio
✅ アプリ名フォルダ作成（slug方式、日付除去）
✅ 同名フォルダは中身のみ更新（フォルダ名は固定）
✅ GitHub Pages自動有効化（gh API使用）
✅ README.md冒頭に以下を自動追加:
   - 🎮 ライブデモリンク
   - 📱 About.htmlリンク
   - 🔊 音声解説リンク（該当する場合）

確認項目:
✅ ai-agent-portfolio/{app-name}/ にpush完了
✅ GitHub Pages自動有効化成功（または手動案内表示）
✅ README.mdに定型リンク追加済み
✅ 公開URLを表示（ライブデモ/About/音声）
=================================

📌 公開後の確認
=================================
✅ ライブデモURL: https://{username}.github.io/ai-agent-portfolio/{app-name}/
✅ AboutページURL: https://{username}.github.io/ai-agent-portfolio/{app-name}/about.html
✅ 音声解説URL: https://{username}.github.io/ai-agent-portfolio/{app-name}/explanation.mp3
✅ README.md冒頭に上記リンクが記載されていることを確認
=================================
```

## 📝 サブエージェントへの標準プロンプト

Taskツール実行時、必ず以下の内容を含める：

```
あなたは{エージェント名}です。

【作業環境】
- 作業ディレクトリ: ./worktrees/mission-{プロジェクト名}/
- このディレクトリ内でのみファイル操作を行う

【品質基準】
- 作成済みテスト: 100%合格必須
- 実カバレッジ目標: 80-90%
- クリティカルパス: 100%必須
- エラーフリーで動作すること

【改善ループ】
- フェーズ3: 作成済みテストは100%合格まで修正（回数制限なし）
- フェーズ4: カバレッジ80-90%を目指して最大3回改善

【NEW】API利用判定（API_USAGE_POLICY.md参照）:
  画像生成が必要な場合:
    ⚠️ use the gcp skill を明示的に宣言
    1. gcp-skill/IMAGEN_API.md を参照
    2. Vertex AI Imagen セットアップ実行
    3. 画像生成（英語プロンプト）
    4. 失敗時: SVG/Canvas代替を自動実装
    5. コスト・結果をREADME.mdに記録

  音声生成が必要な場合（Phase 5のみ）:
    ⚠️ use the gcp skill を明示的に宣言
    1. GCP TTS 認証確認・自動セットアップ
    2. explanation.mp3 生成
    3. 失敗時: 音声なしで継続（理由を記録）

【タスク】
{具体的なタスク内容}

【完了条件】
- テスト合格

【コンテキスト継承（必須で明記）】
- 参照ファイル: {依存する成果物のパス}
- 前フェーズの成果: {具体的な内容}

【完了報告フォーマット（必須）】
✅ 生成ファイル: {パスのリスト}
✅ テスト結果: {合格率 or 実行有無}
✅ 次フェーズへの引き継ぎ事項: {具体的内容}

【エラー時の対応】
- 自動リトライ: 3回まで（軽微なエラー）
- リトライ失敗時: 簡易版/代替案で実装し、理由を報告
```

## 📦 Phase 5.5: 成果物集約（DELIVERY）

### 概要
生成されたファイルをDELIVERY/<app-name>/ 配下に集約し、公開用の固定フォーマットを保証する。

### 実行タイミング
Phase 5の全タスク完了後、自動的に実行

### 実行方法
```bash
# Phase 5完了後に自動実行
python3 ~/Desktop/git-worktree-agent/src/delivery_organizer.py
```

### DELIVERYフォルダ構造
**標準構造（必須）**
```
DELIVERY/
└── <app-name>/
    ├── index.html           # 公開トップ（ビルド済み or SPAルート）
    ├── about.html           # mp3埋め込み済み
    ├── assets/              # 画像/音声/JS/CSS 等すべての静的ファイル
    ├── explanation.mp3
    ├── README.md            # 公開用概要
    └── dist/                # ビルド成果物（必要な場合のみ。index.html から相対参照で動作確認）
```

**delivery_organizer.py 要件**
- 上記構造を自動生成/コピーし、不足があればエラーを返す
- <app-name> はPROJECT_INFO.yamlのアプリ名から決定する
- 追加で summary.html や docs/ がある場合も、標準構造を壊さずに共存させる

### 固定フォーマット検証
```
🔍 チェックポイント:
- DELIVERY/<app-name>/ に以下が揃っているか: index.html, about.html, assets/, explanation.mp3, README.md
- about.html から explanation.mp3 への相対パス（例: ./explanation.mp3）が崩れていないか
- index.html から assets/ や dist/ への参照が相対パスで動くか（<app-name>/ 配下配置を想定）
- summary.html など追加ファイルがある場合も <app-name>/ 配下の公開ファイルセットが揃っているか
```

### 成果物確認メッセージ
```
========================================
🎉 開発完了！成果物を確認してください
========================================

📁 確認フォルダ: DELIVERY/<app-name>/

重要ファイル:
  📄 README.md        - 公開用概要
  🌐 index.html       - 公開トップ
  🌐 about.html       - プロジェクト紹介（mp3埋め込み）
  🔊 explanation.mp3  - 音声解説
  📂 assets/          - 画像/音声/JS/CSS
  🚀 launch_app.command - ダブルクリックで起動（必要に応じてルートにも配置）

ブラウザで確認（相対パス検証）:
  open DELIVERY/<app-name>/index.html
  open DELIVERY/<app-name>/about.html
========================================
```

## 🚀 Phase 6: GitHubポートフォリオ公開

### 概要
Portfolio用プロジェクトをGitHubに公開し、技術力をアピールする。
**重要**: リポジトリ直下に `<app-name>/` を置き、DELIVERY/<app-name> をそのまま配置して公開する（slug方式・再利用可能）。統合先は `https://github.com/sohei-t/ai-agent-portfolio/tree/main` を基本とし、同じアプリ名のフォルダはリネームせず中身のみ更新する。

### 実行条件
- PROJECT_INFO.yaml の development_type が "Portfolio App" の場合のみ
- Client用プロジェクトの場合はスキップ
- 統合ポートフォリオの場合は ai-agent-portfolio（mainブランチ）配下に `<app-name>/` を追加・更新する

### 実行前の必須確認
```
📌 Phase 6 実行前チェック
=================================
1. CLAUDE.mdを読み直す
2. PHASE_6_PUBLISHING_FLOW.md を確認 ← 重要！
3. worktreeがマージ済みか確認
4. DELIVERYフォルダが生成済みか確認
5. 現在地が専用環境のmainブランチか確認
   pwd → ~/Desktop/AI-Apps/{date}-{app-name}-agent/
6. DELIVERY/<app-name>/ が固定フォーマットで揃っているか再確認
=================================
```

### 実行手順

#### 6-0. Worktreeのマージ（削除しない）
```bash
# worktreeの作業を完了してmainにマージ
cd ~/Desktop/AI-Apps/{date}-{app-name}-agent/
git merge feat/{app-name}

# ⚠️ 重要: Worktreeは削除しない（将来の修正用に維持）
# git worktree remove は実行しない
echo "✅ Worktree維持: ./worktrees/mission-{app-name}"

# ブランチも維持
echo "✅ Branch維持: feat/{app-name}"

【Worktreeを維持する理由】
- 将来の修正や追加開発に即応できる
- ブランチ履歴を保持しGit管理を一貫させる
- 再構築コストを削減する
※ ディスク逼迫や完全終了時のみ、手動判断で削除を検討
```

#### 6-1. Git準備（mainブランチで）
```bash
# 専用環境のmainブランチで実行
cd ~/Desktop/AI-Apps/{date}-{app-name}-agent/
# DELIVERY/<app-name>/ をリポジトリ直下に配置
mkdir -p <app-name>
rsync -a DELIVERY/<app-name>/ <app-name>/
# 既に同名フォルダがある場合は上書きで中身だけ更新する（フォルダ名は変更しない）

# 公開に不要/機密なファイルは含めない（プロンプト、.env、.gitignore、credentials などは除外）
# 公開物のみ（index.html/about.html/assets/explanation.mp3/README.md/必要なdist等。node_modulesやテストコードは除外）をステージング
git add <app-name>/
git commit -m "feat: {app-name} - AI-generated full-stack application with documentation

- Full implementation with tests
- DELIVERY folder with organized documentation
- Design docs, test reports, and management files
- Generated by Claude Code with git-worktree-agent"
```

#### 6-2. 公開方式の選択と実行

**Option A: 統合ポートフォリオ方式**（複数アプリを1箇所で管理）
```bash
# ai-agent-portfolioリポジトリ（main）に追加/更新（公開物のみ）
python3 ~/Desktop/git-worktree-agent/src/simplified_github_publisher.py .

# 結果: ai-agent-portfolio/{app-name}/ （日付なしのslug形式、既存の場合は上書き更新）
```

**Option B: 個別リポジトリ方式**（アプリ専用リポジトリ）
```bash
# 新規リポジトリ作成（portfolio-todo-app）
python3 ~/Desktop/git-worktree-agent/src/simplified_github_publisher.py .

# 結果: portfolio-todo-app リポジトリ
```

**Option C: 両方実行**（推奨）
```bash
# 統合と個別の両方に公開
python3 ~/Desktop/git-worktree-agent/src/simplified_github_publisher.py .   # ai-agent-portfolio 直下に配置
python3 ~/Desktop/git-worktree-agent/src/github_portfolio_publisher.py .     # 個別リポジトリを作成/更新
```
※ 既存の `<app-name>/` が ai-agent-portfolio にある場合は同名フォルダを再利用し、中身だけを更新する（フォルダ名は変更しない）。

#### 6-3. GitHub Pages設定（オプション）
```bash
# GitHub Pagesの有効化（手動またはAPI経由）
# 公開パス: https://{username}.github.io/{repo-name}/{app-name}/
gh api repos/{owner}/$REPO_NAME/pages \
  --method POST \
  --field source='{"branch":"main","path":"/"}'

# 必要なら .nojekyll を配置（app-name/ 以下に直置きする場合は不要なことが多い）
echo "" > .nojekyll
git add .nojekyll
```

#### 6-4. README.mdの更新（ルート用）
```markdown
# {App Name}

AI-generated full-stack application with comprehensive documentation.

## 🚀 Quick Start

1. **View Project**: Open `{app-name}/index.html`
2. **About**: Open `{app-name}/about.html`（`./explanation.mp3` が再生できることを確認）
3. **Docs**: Check `{app-name}/README.md`（公開用概要）
4. **Local Launch**: Double-click `DELIVERY/launch_app.command`（任意）

## 📦 DELIVERY Folder

The `DELIVERY/<app-name>/` folder contains all essential files for publishing:
- `index.html` - Public entry point (works from `<app-name>/` path)
- `about.html` - About page with embedded `explanation.mp3`
- `assets/` - All static assets (images/audio/JS/CSS)
- `README.md` - Public overview
- `explanation.mp3` - Audio walkthrough
- `dist/` - Built assets if needed (kept relative; node_modules/testコード/プロンプト類は含めない)

## 🛠 Technical Stack

{自動検出した技術スタックを記載}

## 📊 Portfolio

This project demonstrates:
- Full-stack development capabilities
- Test-driven development (see `tests/` and `DELIVERY/`)
- Comprehensive documentation (see `DELIVERY/`)
- AI-assisted development workflow

---

Generated with [Claude Code](https://github.com/anthropics/claude-code) and [git-worktree-agent](https://github.com/{username}/git-worktree-agent)
```

#### 6-5. 公開URL表示
```
========================================
🎉 GitHubポートフォリオ公開完了！
========================================

📦 リポジトリURL:
https://github.com/{username}/{repo-name}

📊 DELIVERY確認:
https://github.com/{username}/{repo-name}/tree/main/{app-name}

🌐 GitHub Pages（有効化した場合）:
https://{username}.github.io/{repo-name}/{app-name}/

✨ ポートフォリオの特徴:
- ソースコード: 実装力を証明
- tests/: テスト駆動開発の証明
- DELIVERY/ または {app-name}/docs: 設計力・品質意識を証明

========================================
```

### タスク実行用プロンプト
```
あなたはGitHub公開担当者です。

【重要】実行場所の確認
- worktree作業完了後、mainにマージしてから実行
- 作業ディレクトリ: ~/Desktop/AI-Apps/{date}-{app-name}-agent/ （mainブランチ）

【必須確認】
1. PHASE_6_PUBLISHING_FLOW.md を読む
2. worktreeのマージ確認（すでにマージ済みか確認）
3. PROJECT_INFO.yamlを確認（Portfolio Appの場合のみ続行）

【公開方式の選択】
以下から選択（両方も可）:

A. 統合ポートフォリオ（複数アプリ管理）
   ```bash
   python3 ~/Desktop/git-worktree-agent/src/simplified_github_publisher.py .
   ```
   結果: ai-agent-portfolio/{app-name}/ （日付なしslug）

B. 個別リポジトリ（アプリ専用）
   ```bash
   python3 ~/Desktop/git-worktree-agent/src/github_portfolio_publisher.py .
   ```
   結果: portfolio-todo-app リポジトリ

【slug管理の鉄則】
- 日付プレフィックス（20241210-）は自動除去
- 同じアプリ名 → 同じslug/リポジトリを更新（フォルダ名は固定、内容のみ差し替え）
- バージョン違いはGit履歴で管理

【注意事項】
- worktreeではなく、専用環境のmainブランチから実行
- .env等の機密ファイルは.gitignoreで除外
- DELIVERYフォルダを含む全体をpush
- Client用プロジェクトはpushしない

【成果物】
- GitHubリポジトリURL
- GitHub Pages URL（設定した場合）
- slug形式での管理確認
```

========================================
```

## 📝 サブエージェントへの標準完了条件

【完了条件】
- テスト合格
- 動作確認済み
- コミット完了（メッセージ: "feat: {機能名} implemented by {エージェント名}"）

## 🛡️ エラーハンドリング

### 自動リカバリシステム
```yaml
error_recovery:
  level_1_retry:
    - ネットワークエラー → 3回自動リトライ
    - タイムアウト → exponential backoff
    - 一時的なロック → 待機後リトライ

  level_2_fallback:
    - テスト失敗 → 簡略版実装
    - ツール不在 → 代替ツール使用
    - リソース不足 → 機能削減

  level_3_rollback:
    - クリティカルエラー → 前のチェックポイントに戻る
    - セキュリティ問題 → 即座停止＆通知
    - データ破損 → バックアップから復元

詳細: ERROR_HANDLING_STRATEGY.md を参照
```

## ✅ 実行前チェックリスト

□ `WORKFLOW_AUTOMATION_V6.md` を読んだ
□ `WORKFLOW_CHECKPOINT_SYSTEM.md` を読んだ（重要）
□ `FRONTEND_DESIGN_SKILL_GUIDE.md` を読んだ（必須）
□ `WBS_CRITICAL_PATH_TEMPLATE.json` を確認
□ `ERROR_HANDLING_STRATEGY.md` を理解
□ `agent_config.yaml` を読んだ
□ `WBS_TEMPLATE.json` を読んだ
□ worktree が作成されている
□ Taskツールで並列実行する準備ができている
□ **frontend-design スキルを UI/HTML生成時に必ず使用する**
□ クリティカルパスを優先実行する
□ エラー時は自動リカバリを試みる
□ フェーズ5で documenter_agent.py 実行を忘れない

## 🚫 禁止事項

- git-worktree-agent ディレクトリでの直接開発
- テスト未実行でのマージ
- 品質基準を満たさないコミット

## 💡 トラブルシューティング

ワークフローが実行されない場合：
1. `python src/workflow_orchestrator.py creative_webapp {名前}` を実行
2. Taskツールで並列実行（1メッセージで複数Task）
3. サブエージェントプロンプトに品質基準を明記
- 公開用ファイルリストをREADME.mdに記載し、about.htmlからexplanation.mp3が相対パス（例: ./explanation.mp3）で再生できることを確認
- index.html/about.htmlの主要導線がスマホ縦・横どちらでもクリック/タップ可能であることを簡易確認（デバッガ不要の目視・ブラウザサイズ変更でOK）
```

### Phase 5 自動検証（実行例）
```bash
validate_phase5() {
  required_files=(
    "DELIVERY/<app-name>/index.html"
    "DELIVERY/<app-name>/about.html"
    "DELIVERY/<app-name>/README.md"
    "DELIVERY/<app-name>/assets/"
  )
  for file in "${required_files[@]}"; do
    [ -e "$file" ] || echo "❌ Missing: $file"
  done
  [ -e "DELIVERY/<app-name>/explanation.mp3" ] && echo "✅ Audio present" || echo "⚠️ Audio skipped"
}
```
