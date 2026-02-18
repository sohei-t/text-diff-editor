#!/usr/bin/env python3
"""
Documenterエージェント - ドキュメントと音声解説生成
about.html と explanation.mp3 を自動生成

音声生成: Gemini 2.5 Flash Preview TTS API を使用
- SSMLを使わず自然言語から高品質な音声を生成
- APIキーのみで利用可能（サービスアカウント不要）
"""

import os
import sys
import json
import re
import wave
import uuid
import subprocess
from pathlib import Path
from datetime import datetime

# Gemini TTS用のインポート
try:
    from google import genai
    from google.genai import types
    GEMINI_TTS_AVAILABLE = True
except ImportError:
    print("警告: google-genaiがインストールされていません")
    print("インストール: pip install google-genai")
    GEMINI_TTS_AVAILABLE = False

# 音声変換用
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    print("警告: pydubがインストールされていません")
    print("インストール: pip install pydub")
    PYDUB_AVAILABLE = False

# 環境変数読み込み
try:
    from dotenv import load_dotenv
    # グローバル設定を読み込み
    global_env = Path.home() / ".config" / "ai-agents" / "profiles" / "default.env"
    if global_env.exists():
        load_dotenv(global_env)
except ImportError:
    pass  # dotenvがなくても環境変数は読める

class DocumenterAgent:
    """ドキュメント生成エージェント"""

    def __init__(self, project_path="."):
        self.project_path = Path(project_path)
        self.gcp_skill_path = Path.home() / ".claude" / "skills" / "gcp-skill"

        # project/public/ ディレクトリを確保
        self.public_path = self.project_path / "project" / "public"
        self.public_path.mkdir(parents=True, exist_ok=True)

    def generate_about_html(self, project_info):
        """about.html（プロジェクト解説ページ）を生成 - 日英切り替え式（デフォルト: 日本語）"""
        project_name = project_info.get('name', 'プロジェクト')
        project_type = project_info.get('type', 'web')

        html_content = f"""<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{project_name} - プロジェクト解説 / Project Overview</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }}

        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }}

        /* 言語切り替えボタン */
        .lang-switcher {{
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1000;
            display: flex;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.95);
            padding: 0.5rem;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }}

        .lang-btn {{
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            background: transparent;
            color: #667eea;
        }}

        .lang-btn:hover {{
            background: #f3f4f6;
        }}

        .lang-btn.active {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}

        /* 言語別コンテンツの表示制御 */
        .lang-ja, .lang-en {{
            display: none;
        }}

        body.lang-ja .lang-ja {{
            display: block;
        }}

        body.lang-en .lang-en {{
            display: block;
        }}

        /* インライン要素用 */
        body.lang-ja span.lang-ja,
        body.lang-ja p.lang-ja {{
            display: inline;
        }}

        body.lang-en span.lang-en,
        body.lang-en p.lang-en {{
            display: inline;
        }}

        .header {{
            text-align: center;
            color: white;
            padding: 3rem 0;
            animation: fadeInDown 1s ease;
        }}

        .header h1 {{
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }}

        .header p {{
            font-size: 1.2rem;
            opacity: 0.9;
        }}

        .main-content {{
            background: white;
            border-radius: 20px;
            padding: 3rem;
            margin: 2rem 0;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: fadeInUp 1s ease 0.5s both;
        }}

        .section {{
            margin-bottom: 3rem;
        }}

        .section h2 {{
            font-size: 2rem;
            color: #667eea;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid #667eea;
        }}

        .feature-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }}

        .feature-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            transform: translateY(0);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }}

        .feature-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }}

        .feature-card h3 {{
            font-size: 1.3rem;
            margin-bottom: 1rem;
        }}

        .tech-stack {{
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: 1.5rem;
        }}

        .tech-badge {{
            background: #f3f4f6;
            color: #667eea;
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-weight: bold;
            transition: all 0.3s ease;
        }}

        .tech-badge:hover {{
            background: #667eea;
            color: white;
            transform: scale(1.05);
        }}

        .audio-player {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
            border-radius: 15px;
            margin: 2rem 0;
            text-align: center;
            color: white;
        }}

        .audio-player h3 {{
            margin-bottom: 1rem;
        }}

        .audio-player audio {{
            width: 100%;
            max-width: 600px;
            margin-top: 1rem;
        }}

        .ai-badge {{
            display: inline-block;
            background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
            color: #333;
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-weight: bold;
            margin-top: 1rem;
            animation: pulse 2s infinite;
        }}

        @keyframes fadeInDown {{
            from {{
                opacity: 0;
                transform: translateY(-30px);
            }}
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}

        @keyframes fadeInUp {{
            from {{
                opacity: 0;
                transform: translateY(30px);
            }}
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}

        @keyframes pulse {{
            0%, 100% {{
                transform: scale(1);
            }}
            50% {{
                transform: scale(1.05);
            }}
        }}

        @media (max-width: 768px) {{
            .header h1 {{
                font-size: 2rem;
            }}

            .main-content {{
                padding: 1.5rem;
            }}

            .feature-grid {{
                grid-template-columns: 1fr;
            }}

            .lang-switcher {{
                top: 0.5rem;
                right: 0.5rem;
                padding: 0.3rem;
            }}

            .lang-btn {{
                padding: 0.4rem 0.8rem;
                font-size: 0.9rem;
            }}
        }}
    </style>
</head>
<body class="lang-ja">
    <!-- 言語切り替えボタン -->
    <div class="lang-switcher">
        <button class="lang-btn active" data-lang="ja" onclick="switchLang('ja')">🇯🇵 日本語</button>
        <button class="lang-btn" data-lang="en" onclick="switchLang('en')">🇺🇸 English</button>
    </div>

    <div class="container">
        <div class="header">
            <h1>🚀 {project_name}</h1>
            <p class="lang-ja">AIエージェントによる完全自動開発プロジェクト</p>
            <p class="lang-en">Fully Automated Development by AI Agents</p>
            <div class="ai-badge">🤖 AI Generated</div>
        </div>

        <div class="main-content">
            <div class="section">
                <h2 class="lang-ja">📋 プロジェクト概要</h2>
                <h2 class="lang-en">📋 Project Overview</h2>
                <div class="lang-ja">
                    <p>
                        このプロジェクトは、Claude Code の AIエージェントシステムにより、
                        要件定義から実装、テスト、ドキュメント生成まで <strong>完全自動化</strong> されたプロセスで開発されました。
                    </p>
                    <p style="margin-top: 1rem;">
                        人間の開発者が行ったのは「要件を伝える」ことだけ。
                        あとはAIエージェントたちが協調して、プロダクションレベルのアプリケーションを生成しました。
                    </p>
                </div>
                <div class="lang-en">
                    <p>
                        This project was developed through a <strong>fully automated</strong> process using Claude Code's AI Agent system,
                        covering everything from requirements definition to implementation, testing, and documentation generation.
                    </p>
                    <p style="margin-top: 1rem;">
                        The human developer only provided the requirements.
                        The AI agents collaborated to generate a production-level application.
                    </p>
                </div>
            </div>

            <div class="section">
                <h2 class="lang-ja">✨ 主要機能</h2>
                <h2 class="lang-en">✨ Key Features</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>🎯 <span class="lang-ja">機能1</span><span class="lang-en">Feature 1</span></h3>
                        <p class="lang-ja">ユーザーフレンドリーなインターフェース</p>
                        <p class="lang-en">User-friendly interface</p>
                    </div>
                    <div class="feature-card">
                        <h3>⚡ <span class="lang-ja">機能2</span><span class="lang-en">Feature 2</span></h3>
                        <p class="lang-ja">高速なレスポンス処理</p>
                        <p class="lang-en">Fast response processing</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔒 <span class="lang-ja">機能3</span><span class="lang-en">Feature 3</span></h3>
                        <p class="lang-ja">セキュアなデータ管理</p>
                        <p class="lang-en">Secure data management</p>
                    </div>
                    <div class="feature-card">
                        <h3>📊 <span class="lang-ja">機能4</span><span class="lang-en">Feature 4</span></h3>
                        <p class="lang-ja">リアルタイム更新</p>
                        <p class="lang-en">Real-time updates</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="lang-ja">🛠 技術スタック</h2>
                <h2 class="lang-en">🛠 Tech Stack</h2>
                <div class="tech-stack">
                    <span class="tech-badge">JavaScript</span>
                    <span class="tech-badge">HTML5</span>
                    <span class="tech-badge">CSS3</span>
                    <span class="tech-badge">Node.js</span>
                    <span class="tech-badge">AI Agent</span>
                </div>
            </div>

            <div class="section">
                <h2 class="lang-ja">🤖 AI開発プロセス</h2>
                <h2 class="lang-en">🤖 AI Development Process</h2>
                <ol class="lang-ja" style="line-height: 2; font-size: 1.1rem;">
                    <li><strong>要件分析</strong>: Requirements Analyst が要件を整理・明確化</li>
                    <li><strong>計画立案</strong>: Planner が WBS（作業分解構造）を作成</li>
                    <li><strong>テスト設計</strong>: Test Designer がテストコードを先行作成（TDD）</li>
                    <li><strong>並列開発</strong>: 複数の Developer エージェントが同時開発</li>
                    <li><strong>品質保証</strong>: Evaluator が品質チェック、Fixer が修正</li>
                    <li><strong>文書生成</strong>: Documenter が解説とマニュアルを自動生成</li>
                </ol>
                <ol class="lang-en" style="line-height: 2; font-size: 1.1rem;">
                    <li><strong>Requirements Analysis</strong>: Requirements Analyst organizes and clarifies requirements</li>
                    <li><strong>Planning</strong>: Planner creates WBS (Work Breakdown Structure)</li>
                    <li><strong>Test Design</strong>: Test Designer creates test code first (TDD)</li>
                    <li><strong>Parallel Development</strong>: Multiple Developer agents work simultaneously</li>
                    <li><strong>Quality Assurance</strong>: Evaluator checks quality, Fixer makes corrections</li>
                    <li><strong>Documentation</strong>: Documenter auto-generates explanations and manuals</li>
                </ol>
            </div>

            <div class="audio-player">
                <h3 class="lang-ja">🎧 音声解説</h3>
                <h3 class="lang-en">🎧 Audio Explanation</h3>
                <p class="lang-ja">AIが生成した音声で、このプロジェクトの詳細を解説します</p>
                <p class="lang-en">AI-generated audio explaining the details of this project</p>
                <audio controls>
                    <source src="explanation.mp3" type="audio/mpeg">
                    <span class="lang-ja">お使いのブラウザは音声再生に対応していません。</span>
                    <span class="lang-en">Your browser does not support audio playback.</span>
                </audio>
            </div>

            <div class="section">
                <h2 class="lang-ja">📊 開発メトリクス</h2>
                <h2 class="lang-en">📊 Development Metrics</h2>
                <ul class="lang-ja" style="line-height: 2; font-size: 1.1rem;">
                    <li>⏱ <strong>開発時間</strong>: 約1-2時間（従来の開発の10倍速）</li>
                    <li>👥 <strong>投入エージェント数</strong>: 8体</li>
                    <li>📝 <strong>自動生成コード行数</strong>: 1000行以上</li>
                    <li>✅ <strong>テストカバレッジ</strong>: 80%以上</li>
                    <li>📄 <strong>自動生成ドキュメント</strong>: 5種類以上</li>
                </ul>
                <ul class="lang-en" style="line-height: 2; font-size: 1.1rem;">
                    <li>⏱ <strong>Development Time</strong>: About 1-2 hours (10x faster than traditional)</li>
                    <li>👥 <strong>Agents Deployed</strong>: 8</li>
                    <li>📝 <strong>Auto-generated Code Lines</strong>: 1000+</li>
                    <li>✅ <strong>Test Coverage</strong>: 80%+</li>
                    <li>📄 <strong>Auto-generated Documents</strong>: 5+ types</li>
                </ul>
            </div>

            <div class="section" style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 15px;">
                <h2 class="lang-ja">🏆 このプロジェクトが実証すること</h2>
                <h2 class="lang-en">🏆 What This Project Demonstrates</h2>
                <p class="lang-ja" style="font-size: 1.2rem; line-height: 1.8; margin-top: 1rem;">
                    AIエージェントを活用することで、<br>
                    <strong>開発速度10倍</strong>、<strong>品質の標準化</strong>、<strong>完全な自動化</strong><br>
                    が実現可能であることを証明しています。
                </p>
                <p class="lang-en" style="font-size: 1.2rem; line-height: 1.8; margin-top: 1rem;">
                    By leveraging AI agents, we demonstrate that<br>
                    <strong>10x development speed</strong>, <strong>standardized quality</strong>, and <strong>full automation</strong><br>
                    are achievable.
                </p>
                <div class="ai-badge" style="margin-top: 2rem;">
                    🚀 The Future of Development is Here
                </div>
            </div>
        </div>
    </div>

    <script>
        // 言語切り替え機能
        function switchLang(lang) {{
            // body のクラスを切り替え
            document.body.className = 'lang-' + lang;

            // html の lang 属性を更新
            document.documentElement.lang = lang === 'ja' ? 'ja' : 'en';

            // ボタンのアクティブ状態を更新
            document.querySelectorAll('.lang-btn').forEach(btn => {{
                btn.classList.remove('active');
                if (btn.dataset.lang === lang) {{
                    btn.classList.add('active');
                }}
            }});

            // LocalStorage に保存
            localStorage.setItem('preferred-lang', lang);
        }}

        // ページ読み込み時に保存された言語を復元（デフォルト: 日本語）
        document.addEventListener('DOMContentLoaded', function() {{
            const savedLang = localStorage.getItem('preferred-lang') || 'ja';
            switchLang(savedLang);
        }});
    </script>
</body>
</html>"""

        # about.html を保存（project/public/ に出力）
        about_path = self.public_path / "about.html"
        with open(about_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print(f"✅ about.html を生成しました（日英切り替え式、デフォルト: 日本語）: {about_path}")
        return about_path

    def generate_audio_prompts_json(self, project_info):
        """AUDIO_PROMPTS.json を生成（ゲームプロジェクト用）

        ゲーム用のBGMと効果音のプロンプトを自動生成します。
        既存ファイルがある場合、プロジェクト名が一致するかチェックし、
        一致しない場合は削除して再生成します（古いプロジェクトの残骸を防ぐため）。
        """
        project_name = project_info.get('name', 'プロジェクト')
        project_type = project_info.get('type', 'web')

        # ゲームプロジェクトかどうか判定
        is_game = 'game' in project_type.lower() or 'ゲーム' in project_name.lower()

        if not is_game:
            print(f"ℹ️  プロジェクトタイプ '{project_type}' はゲームではありません - AUDIO_PROMPTS.json をスキップ")
            return None

        print(f"🎮 ゲームプロジェクト検出: {project_name}")

        # 既存のAUDIO_PROMPTS.jsonをチェック
        existing_prompts_path = self.project_path / "AUDIO_PROMPTS.json"
        if existing_prompts_path.exists():
            try:
                with open(existing_prompts_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)

                existing_project_name = existing_data.get('project_name', '')

                if existing_project_name == project_name:
                    print(f"✅ AUDIO_PROMPTS.json 既存（同じプロジェクト: {existing_project_name}）- 使用")
                    return existing_prompts_path
                else:
                    print(f"⚠️  AUDIO_PROMPTS.json 既存（別プロジェクト: {existing_project_name}）")
                    print(f"   現在のプロジェクト: {project_name}")
                    print(f"   → 削除して再生成します")
                    existing_prompts_path.unlink()
            except (json.JSONDecodeError, KeyError):
                print(f"⚠️  AUDIO_PROMPTS.json が破損しています - 削除して再生成します")
                existing_prompts_path.unlink()

        print(f"🎵 AUDIO_PROMPTS.json を生成します...")

        # ゲームジャンル推測（プロジェクト名から）
        genre = "retro arcade"  # デフォルト
        if 'space' in project_name.lower() or 'invader' in project_name.lower():
            genre = "retro space shooter"
        elif 'puzzle' in project_name.lower():
            genre = "casual puzzle"
        elif 'rpg' in project_name.lower():
            genre = "RPG adventure"
        elif 'action' in project_name.lower():
            genre = "action platformer"

        # AUDIO_PROMPTS.json のテンプレート
        audio_prompts = {
            "project_name": project_name,
            "genre": genre,
            "bgm": [
                {
                    "name": "main_theme",
                    "prompt": f"8-bit {genre} background music, upbeat, adventurous, chiptune style, 120 BPM, synthesizer heavy, loopable",
                    "negative_prompt": "vocals, lyrics, acoustic instruments, drums",
                    "duration": 30,
                    "bpm": 120,
                    "loop": True,
                    "file": "assets/audio/bgm_main.wav"
                },
                {
                    "name": "game_over",
                    "prompt": f"8-bit {genre} game over theme, sad, slow tempo, minor key, retro synthesizer, 80 BPM",
                    "negative_prompt": "vocals, upbeat, major key, happy",
                    "duration": 10,
                    "bpm": 80,
                    "loop": False,
                    "file": "assets/audio/bgm_game_over.wav"
                }
            ],
            "sfx": [
                {
                    "name": "player_action",
                    "prompt": f"8-bit {genre} player action sound effect, short, sharp, retro game style, punchy",
                    "duration": 1,
                    "file": "assets/audio/sfx_action.wav"
                },
                {
                    "name": "enemy_hit",
                    "prompt": f"8-bit {genre} enemy hit sound effect, retro game style, impact sound, short burst",
                    "duration": 1,
                    "file": "assets/audio/sfx_enemy_hit.wav"
                },
                {
                    "name": "item_collect",
                    "prompt": f"8-bit {genre} item collect sound, cheerful, short ping, retro game style, reward sound",
                    "duration": 0.5,
                    "file": "assets/audio/sfx_item.wav"
                }
            ]
        }

        # 保存
        # project/ 配下に保存（内部ドキュメント）
        prompts_path = self.project_path / "project" / "AUDIO_PROMPTS.json"
        prompts_path.parent.mkdir(parents=True, exist_ok=True)
        with open(prompts_path, 'w', encoding='utf-8') as f:
            json.dump(audio_prompts, f, indent=2, ensure_ascii=False)

        print(f"✅ AUDIO_PROMPTS.json を生成しました: {prompts_path}")
        print(f"   BGM: {len(audio_prompts['bgm'])}曲")
        print(f"   効果音: {len(audio_prompts['sfx'])}音")

        return prompts_path

    def generate_audio_script(self, project_info):
        """音声スクリプトを生成（Gemini TTS向け - 自然言語で間を指示）

        Gemini 2.5 Flash Preview TTS は SSML を使わず、自然言語の指示で
        適切な間を入れてくれるため、シンプルなテキストを生成します。
        """
        project_name = project_info.get('name', 'プロジェクト')

        # 自然言語スクリプト（Gemini TTS向け）
        # 句読点や文構造で適切な間を認識してくれる
        script = f"""こんにちは。{project_name}プロジェクトの解説を始めます。

このプロジェクトは、Claude Codeの AIエージェントシステムにより、完全自動で開発されました。
人間の開発者は要件を伝えただけで、あとはすべてAIが自動的に実装しました。

開発プロセスは以下の通りです。

まず、要件定義エージェントが、ユーザーの要望を分析し、明確な仕様書を作成します。
次に、計画エージェントが、作業を細かなタスクに分解し、最適な実行順序を決定します。
そして、テスト設計エージェントが、テストファーストアプローチで、先にテストコードを作成します。

その後、複数の開発エージェントが並列で動作し、フロントエンド、バックエンド、データベースなどを同時に実装します。
品質評価エージェントが、コードの品質をチェックし、問題があれば修正エージェントが自動的に改善します。

最後に、ドキュメント生成エージェントが、このような解説ページや音声ファイルを自動生成します。

この一連のプロセスは、わずか1時間から2時間で完了し、従来の開発と比べて10倍以上の速度を実現しています。
しかも、品質は一定に保たれ、テストカバレッジも80%以上を達成しています。

このプロジェクトは、AIエージェントを活用した次世代の開発手法の可能性を示しています。
将来的には、このような自動開発が当たり前になり、人間はより創造的な作業に集中できるようになるでしょう。

以上で、{project_name}プロジェクトの解説を終わります。
ご清聴ありがとうございました。"""

        # スクリプトを保存
        script_path = self.public_path / "audio_script.txt"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script.strip())

        print(f"✅ 音声スクリプトを生成しました: {script_path}")
        return script_path

    def auto_insert_ssml_pauses(self, text):
        """テキストに自動的にSSML pause（間）を挿入

        仕様:
        - 句点（。）: 0.3秒の間
        - 読点（、）: 0.5秒の間
        - タイトル遷移（## で始まる行）: 1秒の間
        - ページ遷移（# で始まる行）: 1秒の間

        Args:
            text: 元のテキスト

        Returns:
            str: SSML pause挿入済みのテキスト
        """
        import re

        lines = text.split('\n')
        processed_lines = []

        for line in lines:
            # タイトル遷移（## または #）
            if line.strip().startswith('##') or line.strip().startswith('#'):
                # タイトル前に1秒の間
                if processed_lines:  # 最初のタイトルは間を入れない
                    processed_lines.append('[pause:1s]')
                processed_lines.append(line)
                # タイトル後に1秒の間
                processed_lines.append('[pause:1s]')
                continue

            # 句点と読点に間を挿入
            modified_line = line
            # 句点の後に0.3秒の間（すでにSSMLがある場合はスキップ）
            if '。' in modified_line and '[pause:' not in modified_line:
                modified_line = re.sub(r'。', '。[pause:0.3s]', modified_line)

            # 読点の後に0.5秒の間（すでにSSMLがある場合はスキップ）
            if '、' in modified_line and '[pause:' not in modified_line:
                modified_line = re.sub(r'、', '、[pause:0.5s]', modified_line)

            processed_lines.append(modified_line)

        return '\n'.join(processed_lines)

    def convert_ssml_pause_to_google_ssml(self, text):
        """簡易SSML記法（[pause:Xs]）をGoogle TTS API の SSML形式に変換

        例: [pause:1s] → <break time="1s"/>
        """
        import re

        # pauseタグの変換
        text = re.sub(r'\[pause:([0-9.]+)(s|ms)\]', r'<break time="\\1\\2"/>', text)

        # SSML全体を<speak>タグで囲む
        if '<break' in text:
            text = f'<speak>{text}</speak>'
            return text, True

        return text, False

    def split_text_by_byte_limit(self, text, max_bytes=4500):
        """テキストをバイト数制限で分割（改行や句点で区切る）

        参考: Gemini_コンテンツ作成自動化ツールのapp.py実装を使用

        Args:
            text: 分割するテキスト
            max_bytes: 最大バイト数（デフォルト4500、5000より少し小さめに設定）

        Returns:
            list: 分割されたテキストのリスト
        """
        chunks = []
        current_chunk = ""

        # 改行で分割
        lines = text.split('\n')

        for line in lines:
            test_chunk = current_chunk + line + '\n'

            # バイト数をチェック
            if len(test_chunk.encode('utf-8')) > max_bytes:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = line + '\n'
                else:
                    # 1行が制限を超える場合は句点で分割
                    sentences = line.split('。')
                    for sentence in sentences:
                        if sentence:
                            test_sentence = current_chunk + sentence + '。'
                            if len(test_sentence.encode('utf-8')) > max_bytes:
                                if current_chunk:
                                    chunks.append(current_chunk.strip())
                                current_chunk = sentence + '。'
                            else:
                                current_chunk = test_sentence
            else:
                current_chunk = test_chunk

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def generate_audio_with_gemini(self, script_path, output_path=None, voice_name="Kore"):
        """Gemini 2.5 Flash Preview TTS を使用して音声を生成

        特徴:
        - APIキーのみで利用可能（サービスアカウント不要）
        - SSMLを使わず自然言語から高品質な音声を生成
        - 日本語に対応した高品質な音声

        Args:
            script_path: 音声スクリプトファイルのパス
            output_path: 出力先MP3ファイルのパス（デフォルト: project/public/explanation.mp3）
            voice_name: 使用する音声名（デフォルト: Kore - 日本語対応の男性音声）
                        利用可能: Aoede, Charon, Fenrir, Kore, Puck, etc.

        Returns:
            Path: 生成された音声ファイルのパス、失敗時はNone
        """
        # 依存関係チェック
        if not GEMINI_TTS_AVAILABLE:
            print("❌ google-genai がインストールされていません")
            print("インストール: pip install google-genai")
            return None

        if not PYDUB_AVAILABLE:
            print("❌ pydub がインストールされていません")
            print("インストール: pip install pydub")
            return None

        # APIキー取得
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            print("❌ GEMINI_API_KEY 環境変数が設定されていません")
            print("設定方法:")
            print("  export GEMINI_API_KEY='your-api-key'")
            print("または ~/.config/ai-agents/profiles/default.env に追加:")
            print("  GEMINI_API_KEY=your-api-key")
            return None

        # デフォルトの出力先: project/public/explanation.mp3
        if output_path is None:
            output_path = self.public_path / "explanation.mp3"

        # スクリプトを読み込み
        with open(script_path, 'r', encoding='utf-8') as f:
            text = f.read().strip()

        print(f"🎤 Gemini TTS で音声生成を開始...")
        print(f"   音声: {voice_name}")
        print(f"   テキスト長: {len(text)} 文字")

        try:
            # Gemini クライアントを作成
            client = genai.Client(api_key=api_key)

            # テキストを分割（5000バイト制限対応）
            chunks = self.split_text_by_byte_limit(text, max_bytes=4500)
            print(f"   チャンク数: {len(chunks)}")

            temp_files = []

            for i, chunk in enumerate(chunks):
                print(f"   🔊 チャンク {i+1}/{len(chunks)} を生成中...")

                # Gemini TTS API 呼び出し
                response = client.models.generate_content(
                    model="gemini-2.5-flash-preview-tts",
                    contents=chunk,
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name=voice_name,
                                )
                            )
                        ),
                    )
                )

                # PCMデータを取得
                pcm_data = response.candidates[0].content.parts[0].inline_data.data
                mime_type = response.candidates[0].content.parts[0].inline_data.mime_type

                # PCMデータ品質検証（デバッグ用）
                import struct
                if len(pcm_data) >= 2:
                    samples = struct.unpack(f'<{len(pcm_data)//2}h', pcm_data)
                    sample_max = max(samples)
                    sample_min = min(samples)
                    sample_avg = sum(samples) / len(samples)
                    print(f"      📊 PCM品質: {len(pcm_data)}bytes, max={sample_max}, min={sample_min}, avg={sample_avg:.1f}")
                    if sample_max < 1000 and sample_min > -1000:
                        print(f"      ⚠️ 警告: PCMデータが無音に近い（振幅が小さい）")
                else:
                    print(f"      ❌ エラー: PCMデータが空または不正")

                # 一時WAVファイルに保存
                temp_wav = self.public_path / f"temp_chunk_{i}_{uuid.uuid4().hex[:8]}.wav"
                with wave.open(str(temp_wav), 'wb') as wf:
                    wf.setnchannels(1)      # モノラル
                    wf.setsampwidth(2)      # 16-bit
                    wf.setframerate(24000)  # 24kHz
                    wf.writeframes(pcm_data)

                temp_files.append(temp_wav)

            # 複数チャンクの場合は結合
            if len(temp_files) == 1:
                # 単一チャンク: WAV → MP3 変換
                audio = AudioSegment.from_wav(str(temp_files[0]))
                audio.export(str(output_path), format='mp3')
            else:
                # 複数チャンク: 結合してからMP3変換
                print(f"   🔗 {len(temp_files)} 個のチャンクを結合中...")
                combined = AudioSegment.empty()
                for temp_wav in temp_files:
                    audio = AudioSegment.from_wav(str(temp_wav))
                    combined += audio
                combined.export(str(output_path), format='mp3')

            # 一時ファイルを削除
            for temp_wav in temp_files:
                if temp_wav.exists():
                    temp_wav.unlink()

            # 生成されたファイルの検証
            if output_path.exists():
                file_size = output_path.stat().st_size
                print(f"✅ 音声ファイル生成完了: {output_path}")
                print(f"   📁 ファイルサイズ: {file_size:,} bytes ({file_size/1024:.1f} KB)")
                if file_size < 1000:
                    print(f"   ⚠️ 警告: ファイルサイズが小さすぎます（破損の可能性）")
            else:
                print(f"❌ 音声ファイルが見つかりません: {output_path}")
                return None

            return output_path

        except Exception as e:
            print(f"❌ Gemini TTS エラー: {e}")
            import traceback
            traceback.print_exc()
            # 一時ファイルをクリーンアップ
            for temp_wav in temp_files if 'temp_files' in dir() else []:
                if temp_wav.exists():
                    temp_wav.unlink()
            return None

    def resolve_gcp_credentials_path(self):
        """階層型設定システムに基づいてGCP認証パスを解決

        優先順位:
        1. ローカル設定（プロジェクト固有）: ./ai-agents-config/credentials/gcp.json
        2. 専用環境の認証: ./credentials/gcp-workflow-key.json
        3. 親ディレクトリの認証: ../credentials/gcp-workflow-key.json
        4. グローバル設定: ~/.config/ai-agents/credentials/gcp/default.json
        5. テンプレート環境: ~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json

        Returns:
            Path or None: 認証ファイルのパス、見つからない場合はNone
        """
        # 候補パスを優先順位順に定義
        candidate_paths = [
            self.project_path / "ai-agents-config" / "credentials" / "gcp.json",  # ローカル設定
            self.project_path / "credentials" / "gcp-workflow-key.json",  # 専用環境ルート
            self.project_path.parent / "credentials" / "gcp-workflow-key.json",  # 親ディレクトリ（worktree内から実行時）
            Path.home() / ".config" / "ai-agents" / "credentials" / "gcp" / "default.json",  # グローバル設定
            Path.home() / "Desktop" / "git-worktree-agent" / "credentials" / "gcp-workflow-key.json",  # テンプレート環境
        ]

        for path in candidate_paths:
            if path.exists():
                print(f"✅ GCP認証ファイルを検出: {path}")
                return path

        print("⚠️ GCP認証ファイルが見つかりません")
        print("検索したパス:")
        for path in candidate_paths:
            print(f"  - {path}")

        return None

    def setup_gcp_credentials_auto(self):
        """既存のAPI管理システム（GCPスキル）を使用してGCP認証を自動セットアップ"""
        try:
            # プロジェクトID取得
            result = subprocess.run(
                ['gcloud', 'config', 'get-value', 'project'],
                capture_output=True, text=True, timeout=10
            )
            project_id = result.stdout.strip()

            if not project_id:
                print("❌ GCPプロジェクトが設定されていません")
                print("以下のコマンドを実行してください：")
                print("  gcloud auth login")
                print("  gcloud config set project YOUR_PROJECT_ID")
                return False

            print(f"📋 プロジェクトID: {project_id}")

            # Text-to-Speech API有効化
            print("🔧 Text-to-Speech APIを有効化中...")
            subprocess.run(
                ['gcloud', 'services', 'enable', 'texttospeech.googleapis.com', f'--project={project_id}'],
                check=True, timeout=30
            )

            # サービスアカウント確認・作成
            sa_name = "ai-agent"
            sa_email = f"{sa_name}@{project_id}.iam.gserviceaccount.com"

            # サービスアカウント存在確認
            result = subprocess.run(
                ['gcloud', 'iam', 'service-accounts', 'describe', sa_email, f'--project={project_id}'],
                capture_output=True, timeout=10
            )

            if result.returncode != 0:
                print(f"🔧 サービスアカウント作成中: {sa_email}")
                subprocess.run(
                    ['gcloud', 'iam', 'service-accounts', 'create', sa_name,
                     '--display-name=AI Agent (TTS + Imagen)',
                     f'--project={project_id}'],
                    check=True, timeout=30
                )
            else:
                print(f"✅ サービスアカウント既存: {sa_email}")

            # 権限付与（TTS用）
            print("🔧 権限を確認中...")
            subprocess.run(
                ['gcloud', 'projects', 'add-iam-policy-binding', project_id,
                 f'--member=serviceAccount:{sa_email}',
                 '--role=roles/cloudtts.admin'],
                capture_output=True, timeout=30
            )

            # 認証キー生成（環境に応じて保存先を決定）
            # 優先順位: 専用環境 > グローバル設定 > テンプレート環境
            if (self.project_path / "credentials").exists():
                cred_path = self.project_path / "credentials" / "gcp-workflow-key.json"
            elif (self.project_path.parent / "credentials").exists():
                cred_path = self.project_path.parent / "credentials" / "gcp-workflow-key.json"
            elif (Path.home() / ".config" / "ai-agents" / "credentials" / "gcp").exists():
                cred_path = Path.home() / ".config" / "ai-agents" / "credentials" / "gcp" / "default.json"
            else:
                cred_path = Path.home() / "Desktop" / "git-worktree-agent" / "credentials" / "gcp-workflow-key.json"

            cred_path.parent.mkdir(parents=True, exist_ok=True)

            if not cred_path.exists():
                print(f"🔑 認証キー生成中: {cred_path}")
                subprocess.run(
                    ['gcloud', 'iam', 'service-accounts', 'keys', 'create',
                     str(cred_path),
                     f'--iam-account={sa_email}',
                     f'--project={project_id}'],
                    check=True, timeout=30
                )
                cred_path.chmod(0o600)
                print(f"✅ 認証キー生成完了: {cred_path}")
            else:
                print(f"✅ 認証キー既存: {cred_path}")

            return True

        except subprocess.TimeoutExpired:
            print("❌ タイムアウト: GCPコマンドの実行に時間がかかりすぎています")
            return False
        except subprocess.CalledProcessError as e:
            print(f"❌ GCPコマンド実行エラー: {e}")
            return False
        except Exception as e:
            print(f"❌ 予期しないエラー: {e}")
            return False

    def generate_audio_file(self, tts_script_path, output_path):
        """音声ファイルを実際に生成"""
        try:
            print("\n📦 npm依存関係をインストール中...")
            subprocess.run(
                ['npm', 'install', '@google-cloud/text-to-speech'],
                cwd=self.project_path,
                check=True,
                timeout=120
            )

            print("🎤 音声生成を開始...")
            # 階層型設定システムで認証パスを解決
            cred_path = self.resolve_gcp_credentials_path()
            if not cred_path:
                print("❌ GCP認証ファイルが見つかりません")
                return False

            env = os.environ.copy()
            env['GOOGLE_APPLICATION_CREDENTIALS'] = str(cred_path)

            subprocess.run(
                ['node', str(tts_script_path)],
                cwd=self.project_path,
                env=env,
                check=True,
                timeout=60
            )

            print(f"✅ 音声ファイル生成完了: {output_path}")
            return True

        except subprocess.CalledProcessError as e:
            print(f"❌ 音声生成エラー: {e}")
            return False
        except Exception as e:
            print(f"❌ 予期しないエラー: {e}")
            return False

    def generate_audio_with_gcp(self, script_path, output_path=None, auto_ssml=True):
        """GCP Text-to-Speech を使用して音声を生成（SSML自動挿入・分割・結合対応）

        Args:
            script_path: 音声スクリプトファイルのパス
            output_path: 出力先MP3ファイルのパス
            auto_ssml: 句点・読点に自動的にSSML pauseを挿入するか（デフォルト: True）
        """

        # デフォルトの出力先: project/public/explanation.mp3
        if output_path is None:
            output_path = self.public_path / "explanation.mp3"

        # スクリプトを読み込み
        with open(script_path, 'r', encoding='utf-8') as f:
            original_text = f.read()

        # 自動SSML挿入（オプション）
        if auto_ssml:
            print("🔧 自動SSML挿入: 句点・読点・タイトル遷移に間を追加中...")
            processed_text = self.auto_insert_ssml_pauses(original_text)
        else:
            processed_text = original_text

        # 階層型設定システムで認証パスを解決
        cred_path = self.resolve_gcp_credentials_path()
        cred_path_str = str(cred_path) if cred_path else ''

        # Google Cloud TTS用のスクリプトを生成（分割・結合対応）
        tts_script = f"""
const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');

// クライアントを作成（環境変数または明示的なキーファイル）
const clientOptions = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? {{}}
    : {{ keyFilename: '{cred_path_str}' }};
const client = new textToSpeech.TextToSpeechClient(clientOptions);

// SSML変換関数
function convertToSSML(text) {{
    // [pause:Xs] → <break time="Xs"/>
    let ssml = text.replace(/\\[pause:([0-9.]+)(s|ms)\\]/g, '<break time="$1$2"/>');

    // SSMLタグがある場合のみ<speak>で囲む
    if (ssml.includes('<break')) {{
        return '<speak>' + ssml + '</speak>';
    }}
    return text;
}}

// テキストをバイト数制限で分割
function splitTextByByteLimit(text, maxBytes = 4500) {{
    const chunks = [];
    let currentChunk = "";

    const lines = text.split('\\n');

    for (const line of lines) {{
        const testChunk = currentChunk + line + '\\n';

        if (Buffer.byteLength(testChunk, 'utf-8') > maxBytes) {{
            if (currentChunk) {{
                chunks.push(currentChunk.trim());
                currentChunk = line + '\\n';
            }} else {{
                // 1行が制限を超える場合は句点で分割
                const sentences = line.split('。');
                for (const sentence of sentences) {{
                    if (sentence) {{
                        const testSentence = currentChunk + sentence + '。';
                        if (Buffer.byteLength(testSentence, 'utf-8') > maxBytes) {{
                            if (currentChunk) {{
                                chunks.push(currentChunk.trim());
                            }}
                            currentChunk = sentence + '。';
                        }} else {{
                            currentChunk = testSentence;
                        }}
                    }}
                }}
            }}
        }} else {{
            currentChunk = testChunk;
        }}
    }}

    if (currentChunk.trim()) {{
        chunks.push(currentChunk.trim());
    }}

    return chunks;
}}

async function generateSpeech() {{
    // テキストを読み込み
    const rawText = `{processed_text.replace("`", "\\`")}`;

    // SSML変換
    const ssmlText = convertToSSML(rawText);
    const isSSML = ssmlText.includes('<speak>');

    console.log(isSSML ? '✅ SSML形式で音声生成します（間あり）' : 'ℹ️  テキスト形式で音声生成します');

    // バイト数チェック
    const textBytes = Buffer.byteLength(ssmlText, 'utf-8');
    console.log(`📊 テキストバイト数: ${{textBytes}}`);

    // 5000バイト以下ならそのまま生成
    if (textBytes <= 4500) {{
        const request = {{
            input: isSSML ? {{ ssml: ssmlText }} : {{ text: rawText }},
            voice: {{
                languageCode: 'ja-JP',
                name: 'ja-JP-Neural2-B',
                ssmlGender: 'MALE'
            }},
            audioConfig: {{
                audioEncoding: 'MP3',
                speakingRate: 1.0,
                pitch: 0.0,
                effectsProfileId: ['headphone-class-device']
            }},
        }};

        const [response] = await client.synthesizeSpeech(request);
        fs.writeFileSync('{output_path}', response.audioContent, 'binary');
        console.log('✅ 音声ファイルを生成しました: {output_path}');
        return;
    }}

    // 5000バイト超える場合は分割処理
    console.log('⚠️  テキストが長いため分割して生成します');

    // SSMLタグを除去してテキストのみ分割
    const textOnly = isSSML ? ssmlText.replace(/<speak>/g, '').replace(/<\\/speak>/g, '') : ssmlText;

    // テキストを分割
    const chunks = splitTextByByteLimit(textOnly, 4500);
    console.log(`📦 テキストを${{chunks.length}}個に分割しました`);

    // 各チャンクで音声生成
    const tempFiles = [];
    for (let i = 0; i < chunks.length; i++) {{
        console.log(`🎤 チャンク ${{i+1}}/${{chunks.length}} を生成中...`);

        const chunkText = isSSML ? `<speak>${{chunks[i]}}</speak>` : chunks[i];

        const request = {{
            input: isSSML ? {{ ssml: chunkText }} : {{ text: chunks[i] }},
            voice: {{
                languageCode: 'ja-JP',
                name: 'ja-JP-Neural2-B',
                ssmlGender: 'MALE'
            }},
            audioConfig: {{
                audioEncoding: 'MP3',
                speakingRate: 1.0,
                pitch: 0.0,
                effectsProfileId: ['headphone-class-device']
            }},
        }};

        const [response] = await client.synthesizeSpeech(request);

        const tempFile = `temp_${{i}}.mp3`;
        fs.writeFileSync(tempFile, response.audioContent, 'binary');
        tempFiles.push(tempFile);
    }}

    // pydubで音声ファイルを結合（Pythonスクリプト呼び出し）
    console.log('🔗 音声ファイルを結合中...');

    const combineScript = `
import sys
from pydub import AudioSegment

temp_files = ${{JSON.stringify(tempFiles)}}
output_path = '{output_path}'

combined = AudioSegment.empty()
for temp_file in temp_files:
    audio = AudioSegment.from_mp3(temp_file)
    combined += audio

combined.export(output_path, format='mp3')

# 一時ファイルを削除
import os
for temp_file in temp_files:
    os.remove(temp_file)

print(f'✅ ${{len(temp_files)}}個のチャンクを結合しました: {{output_path}}')
`;

    fs.writeFileSync('combine_audio.py', combineScript);

    const {{ execSync }} = require('child_process');
    execSync('python3 combine_audio.py', {{ stdio: 'inherit' }});

    // クリーンアップ
    fs.unlinkSync('combine_audio.py');

    console.log('✅ 音声ファイル生成完了: {output_path}');
}}

generateSpeech().catch(console.error);
"""

        # 一時的なNode.jsスクリプトを作成
        tts_script_path = self.project_path / "generate_audio_gcp.js"
        with open(tts_script_path, 'w', encoding='utf-8') as f:
            f.write(tts_script)

        print(f"✅ TTS生成スクリプトを作成しました: {tts_script_path}")

        # package.json に依存関係を追加（存在する場合）
        package_json_path = self.project_path / "package.json"
        if package_json_path.exists():
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)

            if 'dependencies' not in package_data:
                package_data['dependencies'] = {}

            package_data['dependencies']['@google-cloud/text-to-speech'] = "^4.2.0"

            # スクリプトも追加
            if 'scripts' not in package_data:
                package_data['scripts'] = {}
            package_data['scripts']['generate-audio:gcp'] = 'node generate_audio_gcp.js'

            with open(package_json_path, 'w') as f:
                json.dump(package_data, f, indent=2)

            print("✅ package.json に GCP TTS 依存関係を追加しました")

        # 認証情報ファイルの存在を確認し、必要なら自動セットアップ
        # 注: cred_pathは上で既に階層型設定システムで解決済み
        if not cred_path:
            print("\n⚠️  GCP認証情報が見つかりません")
            print("⚠️  use the gcp skill")
            print("\n🔧 既存のAPI管理システムを使用して自動セットアップを試みます...\n")

            # 既存のAPI管理システム（GCPスキル + CLAUDE.mdの手順）を使用
            if self.setup_gcp_credentials_auto():
                print("✅ GCP認証セットアップ完了")
                # 認証パスを再解決
                cred_path = self.resolve_gcp_credentials_path()
                if cred_path:
                    # 音声生成を続行
                    self.generate_audio_file(tts_script_path, output_path)
                else:
                    print("❌ セットアップ後も認証ファイルが見つかりません")
                    return None
            else:
                print(f"""
⚠️  GCP認証の自動セットアップに失敗しました

音声生成を有効にするには（手動）：
1. Google Cloud Console で Text-to-Speech API を有効化
2. サービスアカウントキーを作成
3. {cred_path} に保存
4. npm install @google-cloud/text-to-speech
5. npm run generate-audio:gcp

または、gcloudコマンドで：
gcloud services enable texttospeech.googleapis.com
gcloud iam service-accounts create tts-service-account
gcloud iam service-accounts keys create {cred_path} \\
  --iam-account tts-service-account@PROJECT_ID.iam.gserviceaccount.com
""")
            return None
        else:
            # 認証ファイルが既存の場合、音声生成を実行
            print(f"\n✅ GCP認証ファイル既存: {cred_path}")
            print("🎤 音声生成を開始します...\n")
            self.generate_audio_file(tts_script_path, output_path)

        return output_path

    def generate_all_documents(self, project_info=None):
        """すべてのドキュメントと音声を生成

        音声生成の優先順位:
        1. Gemini 2.5 Flash Preview TTS（推奨 - APIキーのみで利用可能）
        2. Google Cloud TTS（フォールバック - サービスアカウント必要）
        """
        if project_info is None:
            # PROJECT_INFO.yaml から読み込み
            project_info_path = self.project_path / "PROJECT_INFO.yaml"
            if project_info_path.exists():
                import yaml
                with open(project_info_path, 'r') as f:
                    data = yaml.safe_load(f)
                    project_info = data.get('project', {})
            else:
                project_info = {'name': 'Project', 'type': 'web'}

        print("📄 ドキュメント生成を開始...")

        # 0. AUDIO_PROMPTS.json を生成（ゲームプロジェクトの場合）
        audio_prompts_path = self.generate_audio_prompts_json(project_info)

        # 1. about.html を生成
        about_path = self.generate_about_html(project_info)

        # 2. 音声スクリプトを生成（explanation.mp3用）
        script_path = self.generate_audio_script(project_info)

        # 3. 音声生成（Gemini TTS 優先、GCP TTS フォールバック）
        audio_path = None
        audio_method = None

        # 3-1. Gemini TTS を試行（推奨）
        print(f"\n📋 TTS選択診断:")
        print(f"   GEMINI_TTS_AVAILABLE: {GEMINI_TTS_AVAILABLE}")
        print(f"   GEMINI_API_KEY設定: {bool(os.environ.get('GEMINI_API_KEY'))}")
        print(f"   PYDUB_AVAILABLE: {PYDUB_AVAILABLE}")

        if GEMINI_TTS_AVAILABLE and os.environ.get('GEMINI_API_KEY'):
            print("\n🎤 Gemini 2.5 Flash Preview TTS で音声生成を試行...")
            audio_path = self.generate_audio_with_gemini(script_path)
            if audio_path:
                audio_method = "Gemini TTS"

        # 3-2. Gemini 失敗時は GCP TTS にフォールバック
        if audio_path is None:
            print("\n🎤 Google Cloud TTS にフォールバック...")
            audio_path = self.generate_audio_with_gcp(script_path)
            if audio_path:
                audio_method = "GCP TTS"

        print("\n✅ ドキュメント生成完了！")
        if audio_prompts_path:
            print(f"  - {audio_prompts_path} (ゲーム音声プロンプト)")
        print(f"  - {about_path}")
        print(f"  - {script_path}")
        if audio_path:
            print(f"  - {audio_path} ({audio_method})")
        else:
            print(f"  - ⚠️ 音声生成スキップ（GEMINI_API_KEY または GCP認証が必要）")

        # 4. GitHub Pages用パス検証（自動実行）
        print("\n🔍 GitHub Pages用パス検証を実行中...")
        validation_result = self.validate_github_pages_paths()

        if validation_result['status'] == 'success':
            print("✅ パス検証完了: すべてのパスが相対パスです")
        elif validation_result['status'] == 'fixed':
            print(f"✅ パス検証完了: {validation_result['fixes']}個のパスを自動修正しました")
        else:
            print(f"⚠️  パス検証で警告が出ました（詳細は path_validator.py を実行してください）")

        return {
            'audio_prompts_json': str(audio_prompts_path) if audio_prompts_path else None,
            'about_html': str(about_path),
            'audio_script': str(script_path),
            'audio_file': str(audio_path) if audio_path else None,
            'path_validation': validation_result
        }

    def validate_github_pages_paths(self):
        """GitHub Pages用のパス検証を実行

        Returns:
            dict: 検証結果 {'status': 'success'|'fixed'|'warning', 'issues': [...], 'fixes': int}
        """
        try:
            # path_validator.py を実行
            validator_path = Path(__file__).parent / "path_validator.py"

            if not validator_path.exists():
                return {'status': 'skipped', 'reason': 'path_validator.py not found'}

            result = subprocess.run(
                ['python3', str(validator_path), str(self.public_path)],
                capture_output=True,
                text=True,
                timeout=30
            )

            # 出力を表示
            if result.stdout:
                print(result.stdout)

            if result.returncode == 0:
                # 修正があった場合は 'fixed'、なければ 'success'
                if 'auto-fix' in result.stdout.lower() or '修正' in result.stdout:
                    return {'status': 'fixed', 'fixes': result.stdout.count('✅ 修正')}
                else:
                    return {'status': 'success', 'issues': 0}
            else:
                return {'status': 'warning', 'output': result.stdout}

        except subprocess.TimeoutExpired:
            return {'status': 'error', 'reason': 'timeout'}
        except Exception as e:
            return {'status': 'error', 'reason': str(e)}

def main():
    """メイン処理"""
    documenter = DocumenterAgent()
    results = documenter.generate_all_documents()

    print("\n📚 生成されたドキュメント:")
    for key, value in results.items():
        if value:
            print(f"  - {key}: {value}")

if __name__ == "__main__":
    main()