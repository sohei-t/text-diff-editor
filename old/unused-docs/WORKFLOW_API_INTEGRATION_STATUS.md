# 🔌 ワークフロー API統合ステータス

**更新日**: 2025-12-22
**バージョン**: v9.1

---

## ✅ 統合済みAPI・ツール

### 1. Vertex AI Imagen API（画像生成）

#### 統合状況
```yaml
status: ✅ 完全統合
integration_phase: Phase 2（実装フェーズ）
skill_location: ~/.claude/skills/gcp-skill/IMAGEN_API.md
trigger_condition: IMAGE_PROMPTS.json が存在する場合
```

#### ワークフロー内での使用方法
```yaml
phase_1_preparation:
  task: IMAGE_PROMPTS.json 自動生成
  agent: Prompt Engineer
  output: IMAGE_PROMPTS.json（英語プロンプト集）

phase_2_execution:
  step_1: "use the gcp skill" 宣言（必須）
  step_2: GCP認証セットアップ（自動）
  step_3: Vertex AI Imagen API 実行
  step_4: 失敗時SVG代替
  step_5: 結果記録（README.md）
```

#### 自動化レベル
```yaml
setup: 100%自動（認証・API有効化・権限設定）
execution: 100%自動（プロンプト読み込み→生成→保存）
error_handling: 100%自動（SVG代替・エラー記録）
cost_management: 手動（予算設定推奨）
```

#### 実装例
```python
# CLAUDE.md の Phase 2 に完全な実装フローあり
# gcp-skill/IMAGEN_API.md にPython/Node.js実装例あり

# 簡易版:
from vertexai.preview.vision_models import ImageGenerationModel
model = ImageGenerationModel.from_pretrained("imagegeneration@006")
response = model.generate_images(prompt="spaceship, pixel art")
response.images[0].save("player.png")
```

#### コスト
```yaml
unit_price: $0.020/画像
example: 100枚 = $2.00
monthly_budget: $30-50推奨
```

---

### 2. Playwright MCP（E2Eテスト）

#### 統合状況
```yaml
status: ✅ 完全統合
integration_phase: Phase 3（テストフェーズ）
tool_location: src/playwright_e2e_tester.py
trigger_condition: Phase 3-1（ユニット・統合テスト）100%合格後
```

#### ワークフロー内での使用方法
```yaml
phase_3_1_unit_integration:
  requirement: 100%合格（必須）
  coverage: 70%以上

phase_3_2_e2e_testing:
  step_1: playwright_e2e_tester.py でシナリオ自動生成
  step_2: E2E_SCENARIOS.json 出力
  step_3: Playwright MCP でブラウザ自動操作
  step_4: 全シナリオ成功まで修正ループ
  step_5: スクリーンショット付きエラー報告
```

#### 自動シナリオ生成
```yaml
対応プロジェクトタイプ:
  - Todo/Taskアプリ
  - ゲーム
  - Chatアプリ
  - Calculator
  - 汎用Webアプリ

生成されるシナリオ例:
  todo_app:
    - "Add New Todo"（新規追加）
    - "Complete Todo"（完了マーク）
    - "Delete Todo"（削除）

  game:
    - "Start Game"（ゲーム開始）
    - "Player Control"（操作確認）
    - "Game Over"（終了処理）
```

#### 自動化レベル
```yaml
scenario_generation: 100%自動（プロジェクトタイプ判定）
execution: Playwright MCP経由で自動
error_detection: 100%自動（スクリーンショット付き）
fix_loop: Claude Code が自動修正
```

#### 実装例
```python
# src/playwright_e2e_tester.py
tester = PlaywrightE2ETester("http://localhost:3000")
scenarios = tester.generate_scenarios(project_info)

# E2E_SCENARIOS.json が生成される
# Claude Code に以下を指示:
# "E2E_SCENARIOS.jsonのシナリオをPlaywright MCPで実行してください"
```

#### コスト
```yaml
cost: $0（無料）
requirement: Playwright MCP有効化のみ
```

---

### 3. Text-to-Speech API（音声生成）

#### 統合状況
```yaml
status: ✅ 完全統合
integration_phase: Phase 5（完成処理フェーズ）
tool_location: src/documenter_agent.py
trigger_condition: Phase 5実行時（必須タスク）
```

#### ワークフロー内での使用方法
```yaml
phase_5_completion:
  task_1: documenter_agent.py 実行（最重要）
  task_2: audio_script.txt 自動生成
  task_3: GCP TTS で explanation.mp3 生成
  task_4: 失敗時は音声なしで継続（理由記録）
```

#### 自動化レベル
```yaml
setup: 100%自動（Imagen と同じ認証を使用）
script_generation: 100%自動（プロジェクト解析）
speech_synthesis: 100%自動（SSML対応）
error_handling: 100%自動（音声なし継続）
```

---

### 4. Vertex AI Lyria API（BGM/効果音生成）

#### 統合状況
```yaml
status: ✅ 完全統合
integration_phase: Phase 2（実装フェーズ）
tool_location: src/audio_generator_lyria.py
trigger_condition: AUDIO_PROMPTS.json が存在する場合（ゲームのみ）
```

#### ワークフロー内での使用方法
```yaml
phase_1_preparation:
  task: AUDIO_PROMPTS.json 自動生成（ゲームのみ）
  agent: Prompt Engineer
  output: AUDIO_PROMPTS.json（BGM/効果音プロンプト）

phase_2_execution:
  step_1: "use the gcp skill" 宣言（Imagen と同じ）
  step_2: GCP認証確認（Imagen と共通）
  step_3: Vertex AI Lyria API 実行
  step_4: 失敗時は無音完成
  step_5: 結果記録（README.md）
```

#### 自動化レベル
```yaml
setup: 100%自動（Imagen と共通認証）
execution: 100%自動
error_handling: 100%自動（無音代替）
```

#### コスト
```yaml
unit_price: $0.06/30秒
example: BGM 2曲 + 効果音 5個 = $0.42
monthly_budget: $30-50推奨（画像+音声合計）
```

---

## 🔄 ワークフロー実行フロー（API統合版）

### Phase 0: 初期化
```
create_new_app.command 実行
↓
専用環境作成
↓
credential_checker.py で認証確認
```

### Phase 1: 計画
```
要件定義
↓
IMAGE_PROMPTS.json 生成？（画像必要時）
AUDIO_PROMPTS.json 生成？（ゲーム時）
↓
WBS作成・クリティカルパス特定
```

### Phase 2: 実装
```
画像必要？
├─ Yes → use the gcp skill → Vertex AI Imagen
└─ No  → スキップ

音声必要？
├─ Yes → use the gcp skill → Vertex AI Lyria
└─ No  → スキップ

Frontend/Backend/Database実装
```

### Phase 3: テスト
```
ユニット・統合テスト（100%合格必須）
↓
playwright_e2e_tester.py でシナリオ生成
↓
Playwright MCP で E2E実行
↓
全成功まで修正ループ
```

### Phase 4: 品質改善
```
カバレッジ80-90%目標
↓
改善ループ（最大3回）
```

### Phase 5: 完成処理
```
documenter_agent.py 実行
↓
audio_script.txt 生成
↓
GCP TTS で explanation.mp3 生成
↓
about.html 生成（frontend-design skill）
↓
path_validator.py でパス検証
```

### Phase 6: GitHub公開
```
PROJECT_INFO.yaml 確認（Portfolio判定）
↓
simplified_github_publisher.py 実行
↓
project/public/ → GitHub
```

---

## 📊 API利用状況サマリー

### 必須API（常時使用）
```yaml
github_api:
  tool: gh CLI
  phase: Phase 6
  cost: 無料

frontend_design_skill:
  tool: Claude Code Skill
  phase: Phase 2, 5
  cost: 無料
```

### オプションAPI（条件付き使用）
```yaml
vertex_ai_imagen:
  condition: IMAGE_PROMPTS.json 存在
  phase: Phase 2
  cost: $0.020/画像

vertex_ai_lyria:
  condition: AUDIO_PROMPTS.json 存在
  phase: Phase 2
  cost: $0.06/30秒

text_to_speech:
  condition: Phase 5 実行時
  phase: Phase 5
  cost: $4/100万文字

playwright_mcp:
  condition: Phase 3-1 合格後
  phase: Phase 3
  cost: 無料
```

---

## 🎯 API使用判定フロー

### 自動判定基準
```python
def should_use_api(project_info: dict) -> dict:
    """API使用要否を自動判定"""

    apis = {
        "imagen": False,
        "lyria": False,
        "tts": False,
        "playwright": True  # 常に使用
    }

    # 画像生成判定
    if project_info.get("has_visuals") or \
       "game" in project_info.get("type", "").lower():
        if Path("IMAGE_PROMPTS.json").exists():
            apis["imagen"] = True

    # 音声生成判定（ゲームのみ）
    if "game" in project_info.get("type", "").lower():
        if Path("AUDIO_PROMPTS.json").exists():
            apis["lyria"] = True

    # TTS判定（Phase 5で常に試行）
    apis["tts"] = True

    return apis
```

---

## ✅ 検証チェックリスト

### Vertex AI Imagen
- [x] gcp-skill 統合完了
- [x] CLAUDE.md に実装フロー記載
- [x] 自動セットアップスクリプト完備
- [x] SVG代替フォールバック実装
- [x] コスト管理ガイド作成
- [x] 認証ファイル名統一（gcp-workflow-key.json）

### Playwright MCP
- [x] playwright_e2e_tester.py 実装完了
- [x] CLAUDE.md に使用手順記載
- [x] 自動シナリオ生成実装
- [x] プロジェクトタイプ別対応
- [x] エラー検出・修正ループ実装

### Text-to-Speech
- [x] documenter_agent.py 統合完了
- [x] SSML対応実装
- [x] 自動分割・マージ実装
- [x] Imagen と共通認証使用
- [x] 認証ファイル名統一（gcp-workflow-key.json）

### Vertex AI Lyria
- [x] audio_generator_lyria.py 実装完了
- [x] AUDIO_PROMPTS.json 生成ロジック実装
- [x] Imagen と共通認証使用
- [x] 無音代替フォールバック実装
- [x] 認証ファイル名統一（gcp-workflow-key.json）

---

## 🎉 結論

**ワークフローは Vertex AI と Playwright MCP の両方を完全統合しています**

### 実装状況
- ✅ Vertex AI Imagen: Phase 2で自動使用（画像必要時）
- ✅ Vertex AI Lyria: Phase 2で自動使用（ゲーム音声必要時）
- ✅ Text-to-Speech: Phase 5で自動使用（説明音声生成）
- ✅ Playwright MCP: Phase 3で自動使用（E2Eテスト）

### 自動化レベル
- セットアップ: 100%自動
- 実行判定: 100%自動
- エラー処理: 100%自動
- フォールバック: 100%自動

### コスト最適化
- 画像生成: 必要時のみ実行（$0.020/枚）
- 音声生成: ゲームのみ実行（$0.06/30秒）
- E2Eテスト: 常時実行（無料）
- デフォルト: $0（ローカル完結）

**全APIが必要に応じて自動的に利用される完全自動ワークフローです！**
