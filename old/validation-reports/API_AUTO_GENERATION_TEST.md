# 🧪 API自動生成機能 - テストケース

## 📋 テスト目的

音声・画像の両方が自動生成されることを検証する。

---

## 🎯 テストケース一覧

### TC1: TTS自動生成（認証ファイルなし→自動セットアップ）

**前提条件:**
- `~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json` が存在しない
- GCPプロジェクトが設定済み（`gcloud config get-value project`）

**実行手順:**
1. ワークフロー実行（Phase 0-5）
2. Phase 5: Audio Generator タスクで自動セットアップ実行を確認

**期待結果:**
- ✅ GCP TTSセットアップ完了メッセージ表示
- ✅ `~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json` 生成
- ✅ `explanation.mp3` 生成
- ✅ about.htmlに音声プレーヤー埋め込み

**検証コマンド:**
```bash
# 認証ファイル確認
ls -la ~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json

# 音声ファイル確認
ls -la ./worktrees/mission-*/explanation.mp3

# about.html確認
grep -i "audio" ./worktrees/mission-*/about.html
```

---

### TC2: TTS自動生成（認証ファイル既存）

**前提条件:**
- `~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json` が存在
- 有効なGCP認証

**実行手順:**
1. ワークフロー実行（Phase 0-5）
2. Phase 5: Audio Generator タスク実行

**期待結果:**
- ✅ 「GCP認証ファイルが存在します」メッセージ表示
- ✅ セットアップスキップ
- ✅ `explanation.mp3` 生成
- ✅ about.htmlに音声プレーヤー埋め込み

---

### TC3: TTS生成失敗（GCPプロジェクト未設定）

**前提条件:**
- `gcloud config get-value project` が空
- 認証ファイルなし

**実行手順:**
1. ワークフロー実行（Phase 0-5）
2. Phase 5: Audio Generator タスク実行

**期待結果:**
- ⚠️ 「GCPプロジェクトが設定されていません」警告表示
- ⚠️ 音声生成スキップ
- ✅ ワークフロー継続（エラーで停止しない）
- ✅ README.mdに理由記録（「音声生成スキップ: GCPプロジェクト未設定」）

**検証:**
```bash
# README確認
grep -i "音声" ./worktrees/mission-*/README.md
# → "音声生成スキップ: GCPプロジェクト未設定" が記載されているはず
```

---

### TC4: Imagen自動生成（画像が必要なゲーム）

**前提条件:**
- ゲーム開発リクエスト（例: "シューティングゲームを作って"）
- GCP認証設定済み

**実行手順:**
1. ワークフロー実行（Phase 0-2）
2. Phase 2: 実装フェーズで画像生成判定

**期待結果:**
- ✅ 「use the gcp skill」宣言確認
- ✅ Vertex AI API有効化
- ✅ 画像生成実行（player_ship.png, enemy_alien.png 等）
- ✅ 各画像ファイル生成
- ✅ README.mdにコスト記録（「画像生成: 25枚、コスト: $0.50」）

**検証コマンド:**
```bash
# 画像ファイル確認
ls -la ./worktrees/mission-*/assets/*.png

# README確認
grep -i "imagen" ./worktrees/mission-*/README.md
```

---

### TC5: Imagen生成失敗→SVG代替

**前提条件:**
- ゲーム開発リクエスト
- Vertex AI APIクォータ超過 OR 認証エラー

**実行手順:**
1. ワークフロー実行（Phase 0-2）
2. Phase 2: 画像生成でエラー発生

**期待結果:**
- ⚠️ Imagen生成失敗メッセージ
- ✅ SVG代替自動生成（カラフル幾何学図形）
- ✅ ゲーム動作確認（SVG画像で正常動作）
- ✅ README.mdに理由記録（「画像生成失敗: クォータ超過、SVG代替使用」）

**検証:**
```bash
# SVGファイル確認
ls -la ./worktrees/mission-*/assets/*.svg

# ゲーム動作確認
open ./worktrees/mission-*/index.html
# → SVG図形でゲームが動作するはず
```

---

### TC6: 音声・画像両方生成（統合テスト）

**前提条件:**
- ゲーム開発リクエスト
- GCP認証設定済み

**実行手順:**
1. 完全ワークフロー実行（Phase 0-6）

**期待結果:**
- ✅ Phase 2: Imagen生成成功（20-30枚）
- ✅ Phase 5: TTS生成成功（explanation.mp3）
- ✅ DELIVERY/<app-name>/ に以下が揃う:
  - index.html（ゲーム本体、AI生成画像使用）
  - about.html（explanation.mp3埋め込み）
  - assets/*.png（AI生成画像）
  - explanation.mp3（AI生成音声）
  - README.md（生成コスト記録）
- ✅ README.mdに記録:
  ```
  ## 生成コスト
  - 画像生成（Imagen）: 25枚、$0.50
  - 音声生成（TTS）: 無料枠内
  - 合計: $0.50
  ```

**検証コマンド:**
```bash
# 完全性確認
tree ./worktrees/mission-*/DELIVERY/

# コスト記録確認
cat ./worktrees/mission-*/README.md | grep -A 3 "生成コスト"
```

---

## 🔍 検証観点

### 1. 自動セットアップの堅牢性

| 観点 | テストケース | 合格基準 |
|------|-------------|---------|
| 認証ファイルなし | TC1 | 自動生成成功 |
| 認証ファイルあり | TC2 | スキップして使用 |
| GCP未設定 | TC3 | エラーだがワークフロー継続 |

### 2. 画像生成の品質

| 観点 | テストケース | 合格基準 |
|------|-------------|---------|
| Imagen成功 | TC4 | AI画像生成 |
| Imagen失敗 | TC5 | SVG代替で動作 |
| コスト管理 | TC4, TC6 | README.mdに記録 |

### 3. エラーハンドリング

| エラーパターン | 期待動作 | 検証TC |
|---------------|---------|--------|
| GCP未設定 | 警告→スキップ→継続 | TC3 |
| クォータ超過 | 代替実装→継続 | TC5 |
| 認証エラー | 代替実装→継続 | TC5 |

### 4. ユーザーエクスペリエンス

| 観点 | 期待値 | 検証方法 |
|------|--------|---------|
| エラーメッセージ | 明確で実行可能 | 手動確認 |
| フォールバック | 透過的 | TC5（SVG動作確認） |
| コスト透明性 | README記録 | TC4, TC6 |

---

## 📊 テスト結果テンプレート

### 実行日: YYYY-MM-DD

| TC# | テスト名 | 結果 | 備考 |
|-----|---------|------|------|
| TC1 | TTS自動生成（認証なし） | ⬜ PASS / ⬜ FAIL | |
| TC2 | TTS自動生成（認証あり） | ⬜ PASS / ⬜ FAIL | |
| TC3 | TTS生成失敗 | ⬜ PASS / ⬜ FAIL | |
| TC4 | Imagen自動生成 | ⬜ PASS / ⬜ FAIL | |
| TC5 | Imagen失敗→SVG | ⬜ PASS / ⬜ FAIL | |
| TC6 | 統合テスト | ⬜ PASS / ⬜ FAIL | |

**総合評価:** ⬜ PASS / ⬜ FAIL

---

## 🛠️ トラブルシューティング

### Issue 1: TTS生成が毎回失敗する

```bash
# デバッグ手順
1. GCPプロジェクト確認
   gcloud config get-value project

2. 認証確認
   gcloud auth list

3. API有効化確認
   gcloud services list --enabled | grep texttospeech

4. 手動セットアップ試行
   cd ~/Desktop/git-worktree-agent
   bash GCP_TTS_SETUP.md の手順を実行
```

### Issue 2: Imagen生成が毎回SVG代替になる

```bash
# デバッグ手順
1. Vertex AI API確認
   gcloud services list --enabled | grep aiplatform

2. クォータ確認
   open "https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas"

3. 権限確認
   gcloud projects get-iam-policy $(gcloud config get-value project) \
     --filter="bindings.members:*ai-agent*"

4. 手動生成テスト
   cd ~/.claude/skills/gcp-skill
   # IMAGEN_API.mdの使用例を実行
```

### Issue 3: コスト記録が不正確

```bash
# 確認事項
1. README.mdの「生成コスト」セクションを検索
2. 画像生成ログを確認（何枚成功したか）
3. 実際のGCP請求を確認
   open "https://console.cloud.google.com/billing"
```

---

## ✅ 実装完了の定義

以下の条件をすべて満たすこと：

- [ ] TC1-TC6すべて PASS
- [ ] エラー時もワークフロー継続
- [ ] README.mdにコスト記録
- [ ] フォールバック動作確認
- [ ] DELIVERY構造の整合性
- [ ] 月間予算$25以内で動作

---

## 📚 関連ドキュメント

- [CLAUDE.md](./CLAUDE.md) - ワークフロー定義
- [API_USAGE_POLICY.md](./API_USAGE_POLICY.md) - API利用ポリシー
- [gcp-skill/IMAGEN_API.md](./.claude/skills/gcp-skill/IMAGEN_API.md) - Imagen実装
- [GCP_TTS_SETUP.md](./GCP_TTS_SETUP.md) - TTS設定ガイド
