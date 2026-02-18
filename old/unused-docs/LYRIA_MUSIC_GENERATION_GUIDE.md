# 🎵 Lyria音楽生成完全ガイド

**更新日**: 2025-12-22
**Lyriaバージョン**: lyria-002
**対応プロジェクト**: ゲーム開発

---

## ✅ 既に実装済み！

**良いニュース**: ワークフローには既にGoogle Cloud Vertex AI Lyria APIによるBGM・効果音生成機能が完全統合されています！

---

## 🎯 Lyria APIとは

### 概要
```yaml
provider: Google Cloud Vertex AI
model: lyria-002
capability: テキストプロンプトから高品質な音楽を自動生成
output_format: WAV (48kHz, ステレオ)
duration: 30秒固定
genres: あらゆるジャンル対応（8-bit, orchestral, rock, jazz, etc.）
```

### 特徴
- **プロフェッショナル品質**: 微妙なニュアンスを捉えた高忠実度音楽
- **ジャンル対応**: レトロゲーム8-bit風からオーケストラまで
- **制御可能**: BPM、キー、楽器グループ、ノート密度などを調整可能
- **安全性**: コンテンツフィルター、SynthID透かし埋め込み

---

## 🚀 ワークフロー内での使用方法

### Phase 1: AUDIO_PROMPTS.json 自動生成

**実行条件**: プロジェクトタイプが "game" の場合

```yaml
task: AIプロンプト生成（Phase 1-6）
agent: Prompt Engineer
input: PROJECT_INFO.yaml（ゲーム仕様）
output: AUDIO_PROMPTS.json
```

**生成例（AUDIO_PROMPTS.json）**:
```json
{
  "project_name": "Space Shooter",
  "project_type": "game",
  "audio_assets": [
    {
      "name": "bgm_gameplay",
      "type": "bgm",
      "prompt": "Upbeat 8-bit chiptune music, fast tempo, energetic, retro arcade game style, looping background music",
      "negative_prompt": "vocals, lyrics, slow, sad, calm",
      "bpm": 140,
      "duration": 30,
      "priority": "CRITICAL",
      "fallback": "silent"
    },
    {
      "name": "bgm_menu",
      "type": "bgm",
      "prompt": "Relaxed 8-bit menu music, medium tempo, welcoming, retro game style",
      "negative_prompt": "vocals, intense, dramatic",
      "bpm": 100,
      "duration": 30,
      "priority": "HIGH",
      "fallback": "silent"
    },
    {
      "name": "sfx_shoot",
      "type": "sfx",
      "prompt": "Short laser shoot sound effect, 8-bit retro game style, pew pew",
      "negative_prompt": "music, melody, long",
      "bpm": 120,
      "duration": 1,
      "priority": "HIGH",
      "fallback": "silent"
    },
    {
      "name": "sfx_explosion",
      "type": "sfx",
      "prompt": "8-bit explosion sound effect, retro arcade game, boom crash",
      "negative_prompt": "music, melody, quiet",
      "bpm": 120,
      "duration": 2,
      "priority": "MEDIUM",
      "fallback": "silent"
    }
  ],
  "estimated_cost": 0.42,
  "cost_breakdown": {
    "bgm_count": 2,
    "sfx_count": 2,
    "unit_price": 0.06,
    "note": "$0.06 per 30 seconds"
  }
}
```

### Phase 2: Lyria API実行

**自動実行フロー**:

```yaml
step_0: プロジェクトタイプ判定
  condition: PROJECT_INFO.yaml の type が "game"
  action: AUDIO_PROMPTS.json 確認

step_1: GCP認証確認
  action: "use the gcp skill" 宣言
  credential: gcp-workflow-key.json（Imagen と共通）
  setup: 自動（認証ファイルがない場合）

step_2: Vertex AI Lyria API有効化
  api: aiplatform.googleapis.com
  setup: 自動（有効化されていない場合）

step_3: 音声生成実行
  script: src/audio_generator_lyria.py
  input: AUDIO_PROMPTS.json
  output:
    - bgm_gameplay.wav (30秒)
    - bgm_menu.wav (30秒)
    - sfx_shoot.wav (30秒) ※効果音も30秒で生成
    - sfx_explosion.wav (30秒)

step_4: 結果記録
  location: README.md
  content: 生成成功数、失敗数、コスト試算
```

---

## 🛠️ 実装詳細

### audio_generator_lyria.py

**場所**: `src/audio_generator_lyria.py`

**主要機能**:
```python
class LyriaAudioGenerator:
    def __init__(self, credentials_path: str):
        """GCP認証でLyria APIクライアント初期化"""

    def generate_bgm(self, name: str, prompt: str,
                     negative_prompt: str = "",
                     bpm: int = 120) -> bool:
        """BGM生成（30秒固定）"""

    def generate_sfx(self, name: str, prompt: str,
                     duration: int = 2) -> bool:
        """効果音生成（30秒生成後、指定時間にトリミング）"""

    def batch_generate(self, audio_prompts_file: str) -> Dict:
        """AUDIO_PROMPTS.jsonから一括生成"""
```

**API呼び出し例**:
```python
# Vertex AI Lyria API endpoint
endpoint = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/lyria-002:predict"

# Request body
request_body = {
    "instances": [{
        "prompt": "Upbeat 8-bit chiptune music, fast tempo, energetic",
        "negative_prompt": "vocals, slow, sad",
        "sample_count": 1,
        "guidance": 3.0,  # プロンプト強度 (0.0-6.0)
        "bpm": 140,
        "seed": 12345  # 再現性のため
    }]
}

# API呼び出し（curl経由）
# Response: Base64エンコードされた48kHz WAVデータ
```

---

## 💰 コスト管理

### 料金体系
```yaml
unit_price: $0.06 / 30秒
calculation: 生成回数 × $0.06

examples:
  bgm_2tracks: 2 × $0.06 = $0.12
  sfx_5sounds: 5 × $0.06 = $0.30
  total_per_game: $0.42

monthly_budget:
  development: $30-50推奨
  combined_with_imagen: $30-50（画像+音声合計）
```

### コスト最適化戦略
```yaml
strategy_1_cache:
  description: 同じプロンプトはseedを固定して再利用
  savings: 50-70%

strategy_2_priority:
  description: CRITICAL/HIGH のみ生成、MEDIUM/LOW はスキップ
  savings: 30-50%

strategy_3_fallback:
  description: 失敗時は無音で継続（ゲームは動作可能に）
  savings: エラー時のリトライコスト削減
```

---

## 🎨 プロンプト作成ガイド

### 効果的なプロンプト構成

**BGM用**:
```
{ジャンル} + {テンポ感} + {楽器} + {雰囲気} + {用途}

例:
- "Upbeat 8-bit chiptune music, fast tempo, energetic, retro arcade game style, looping background music"
- "Epic orchestral battle music, dramatic, intense, heroic theme, fantasy RPG boss fight"
- "Relaxing ambient synth music, slow tempo, peaceful, space exploration theme"
```

**効果音用**:
```
{音の種類} + {特徴} + {スタイル} + {長さ指定}

例:
- "Short laser shoot sound effect, 8-bit retro game style, pew pew"
- "Metal sword clash sound effect, sharp, realistic, medieval combat"
- "Coin pickup sound effect, bright, cheerful, 8-bit retro game"
```

### ネガティブプロンプト
```yaml
common_negatives:
  bgm: "vocals, lyrics, speech, talking, dialogue"
  sfx: "music, melody, harmony, long duration"
  all: "distorted, noisy, low quality, muffled"
```

### ジャンル別プロンプト例

**8-bit レトロゲーム**:
```json
{
  "bgm_gameplay": "Upbeat 8-bit chiptune music, fast tempo, square wave leads, retro NES style",
  "bgm_menu": "Mellow 8-bit menu music, medium tempo, nostalgic, Game Boy style",
  "sfx_jump": "8-bit jump sound effect, bouncy, classic platformer game",
  "sfx_coin": "8-bit coin pickup sound, bright ding, Super Mario style"
}
```

**RPGファンタジー**:
```json
{
  "bgm_field": "Epic orchestral adventure music, grand, heroic, fantasy theme with strings and brass",
  "bgm_battle": "Intense orchestral battle music, dramatic percussion, fast tempo, heroic brass",
  "sfx_magic": "Magical spell sound effect, mystical chimes, fantasy RPG healing spell",
  "sfx_sword": "Metal sword slash sound, sharp swish, medieval combat"
}
```

**宇宙シューティング**:
```json
{
  "bgm_space": "Atmospheric electronic space music, synth pads, cosmic ambient, sci-fi theme",
  "bgm_action": "High-energy electronic music, fast beat, pulsing bass, space combat theme",
  "sfx_laser": "Futuristic laser shoot sound, sci-fi weapon, zap pew",
  "sfx_explosion": "Space explosion sound effect, deep boom, sci-fi destruction"
}
```

---

## 🔧 トラブルシューティング

### Q1: "API not enabled" エラー

```bash
# Vertex AI API有効化
gcloud services enable aiplatform.googleapis.com --project=ai-agent-workflow-2024
```

### Q2: "Permission denied" エラー

```bash
# サービスアカウント権限確認・追加
SA_EMAIL=$(cat $GOOGLE_APPLICATION_CREDENTIALS | python3 -c "import sys, json; print(json.load(sys.stdin)['client_email'])")

gcloud projects add-iam-policy-binding ai-agent-workflow-2024 \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user"
```

### Q3: "Quota exceeded" エラー

```bash
# クォータ確認（Web推奨）
open "https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=ai-agent-workflow-2024"

# 対策: 待機時間を増やす
# audio_generator_lyria.py 内で time.sleep(5) に変更
```

### Q4: 効果音が30秒で長すぎる

**対処法**:
```python
# audio_generator_lyria.py は自動でトリミング実装済み
# 30秒生成 → 指定時間（1-5秒）にカット → 保存

def generate_sfx(self, name: str, prompt: str, duration: int = 2):
    # 30秒生成
    audio_30s = self._call_lyria_api(prompt, bpm=120)

    # 指定時間にトリミング（pydub使用）
    from pydub import AudioSegment
    audio = AudioSegment.from_wav(BytesIO(audio_30s))
    trimmed = audio[:duration * 1000]  # ミリ秒

    # 保存
    trimmed.export(output_file, format="wav")
```

### Q5: 音質が期待と違う

**改善策**:
```yaml
prompt_tuning:
  - プロンプトにより具体的な楽器名を追加
  - "high quality, professional" を追加
  - guidanceパラメータを調整（3.0 → 4.5）

examples:
  before: "8-bit music"
  after: "High quality 8-bit chiptune music with square wave leads, triangle bass, and noise percussion, NES-style, professional game audio"
```

---

## 📊 実行結果例

### 成功ケース

```
🎵 Lyria BGM/効果音生成開始
==================================================

📁 AUDIO_PROMPTS.json 読み込み: 4個の音声
   - BGM: 2個
   - 効果音: 2個

🎵 BGM生成中: bgm_gameplay
   プロンプト: Upbeat 8-bit chiptune music, fast tempo...
   BPM: 140, 時間: 30秒
✅ 音声生成成功: 2,822,400 bytes
✅ BGM保存: bgm_gameplay.wav

🎵 BGM生成中: bgm_menu
   プロンプト: Relaxed 8-bit menu music...
   BPM: 100, 時間: 30秒
✅ 音声生成成功: 2,822,400 bytes
✅ BGM保存: bgm_menu.wav

🔊 効果音生成中: sfx_shoot
   プロンプト: Short laser shoot sound effect...
   生成: 30秒 → トリミング: 1秒
✅ 効果音保存: sfx_shoot.wav

🔊 効果音生成中: sfx_explosion
   プロンプト: 8-bit explosion sound effect...
   生成: 30秒 → トリミング: 2秒
✅ 効果音保存: sfx_explosion.wav

==================================================
🎉 音声生成完了!
   Lyria生成: 4/4個成功
   無音代替: 0個
   コスト: $0.24
==================================================
```

### README.md への記録

```markdown
## 🎵 音声生成結果

- **Lyria生成**: 4/4個成功
- **BGM**: bgm_gameplay.wav (30秒), bgm_menu.wav (30秒)
- **効果音**: sfx_shoot.wav (1秒), sfx_explosion.wav (2秒)
- **コスト**: $0.24
- **生成日時**: 2025-12-22 10:30:00

### 音声詳細
| ファイル名 | タイプ | 時間 | BPM | プロンプト |
|-----------|--------|------|-----|----------|
| bgm_gameplay.wav | BGM | 30秒 | 140 | Upbeat 8-bit chiptune music... |
| bgm_menu.wav | BGM | 30秒 | 100 | Relaxed 8-bit menu music... |
| sfx_shoot.wav | 効果音 | 1秒 | 120 | Short laser shoot sound... |
| sfx_explosion.wav | 効果音 | 2秒 | 120 | 8-bit explosion sound... |
```

---

## 🎮 ゲーム統合例

### HTML5ゲームでの使用

```javascript
// 音声ファイル読み込み
const audio = {
  bgm: {
    gameplay: new Audio('bgm_gameplay.wav'),
    menu: new Audio('bgm_menu.wav')
  },
  sfx: {
    shoot: new Audio('sfx_shoot.wav'),
    explosion: new Audio('sfx_explosion.wav')
  }
};

// BGMループ再生
audio.bgm.gameplay.loop = true;
audio.bgm.gameplay.play();

// 効果音再生
function shootLaser() {
  audio.sfx.shoot.currentTime = 0;
  audio.sfx.shoot.play();
}

function explode() {
  audio.sfx.explosion.currentTime = 0;
  audio.sfx.explosion.play();
}
```

---

## 📚 参考リンク

- [Lyria公式ドキュメント](https://cloud.google.com/vertex-ai/generative-ai/docs/music/generate-music)
- [Lyria API リファレンス](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/lyria-music-generation)
- [プロンプトガイド](https://cloud.google.com/vertex-ai/generative-ai/docs/music/music-gen-prompt-guide)
- [料金詳細](https://cloud.google.com/vertex-ai/pricing#generative-ai-models)

---

## ✅ まとめ

**ワークフローには既にLyria音楽生成機能が完全統合されています！**

### 既に実装済みの機能
- ✅ AUDIO_PROMPTS.json 自動生成（Phase 1）
- ✅ Lyria API 自動実行（Phase 2）
- ✅ BGM/効果音の一括生成
- ✅ 効果音の自動トリミング
- ✅ GCP認証統合（Imagen と共通）
- ✅ エラー時の無音代替
- ✅ コスト試算・記録

### 使用方法
1. ゲームプロジェクトを作成
2. ワークフローを実行（Phase 0-6）
3. Phase 1で AUDIO_PROMPTS.json 自動生成
4. Phase 2で Lyria API が自動実行
5. BGM/効果音が assets/ フォルダに保存される

**追加作業は一切不要です！ゲーム開発時に自動的に音楽生成されます！**
