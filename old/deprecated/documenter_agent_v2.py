#!/usr/bin/env python3
"""
Documenterエージェント v2.0 - アプリ特化型ドキュメント生成
- アプリの機能と特徴を中心に解説
- frontend-design スキルの必須使用
- GCP TTS サービスアカウントキーの適切なパス
"""

import os
import sys
import json
import yaml
import subprocess
from pathlib import Path
from datetime import datetime

class DocumenterAgentV2:
    """アプリ特化型ドキュメント生成エージェント"""

    def __init__(self, project_path="."):
        self.project_path = Path(project_path)
        # 実際のサービスアカウントキーのパス候補
        self.gcp_key_candidates = [
            Path.home() / "Desktop" / "SKILLS" / "tts-api-key.json",
            Path.home() / "Desktop" / "delete" / "credentials" / "gcp-workflow-key.json",
            Path.home() / "Desktop" / "git-worktree-agent" / "credentials" / "gcp-workflow-key.json"
        ]

    def get_project_details(self):
        """プロジェクトの詳細情報を取得"""
        # PROJECT_INFO.yaml から読み込み
        project_info_path = self.project_path / "PROJECT_INFO.yaml"
        if project_info_path.exists():
            with open(project_info_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                return data

        # requirements.md から抽出
        req_path = self.project_path / "docs" / "requirements.md"
        if req_path.exists():
            with open(req_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # 要件から主要機能を抽出するロジック
                return self.parse_requirements(content)

        return {
            'project_name': 'アプリケーション',
            'project_type': 'web',
            'features': [],
            'tech_stack': []
        }

    def parse_requirements(self, content):
        """要件書から情報を抽出"""
        # 簡易的なパース処理
        features = []
        lines = content.split('\n')
        for line in lines:
            if '機能' in line or 'Feature' in line:
                features.append(line.strip('- #'))

        return {
            'features': features[:5] if features else []
        }

    def generate_about_html_prompt(self, project_info):
        """frontend-design スキル用のプロンプトを生成"""

        project_name = project_info.get('project_name', 'アプリケーション')
        project_type = project_info.get('project_type', 'web')
        features = project_info.get('features', [])
        tech_stack = project_info.get('tech_stack', [])

        # ゲームプロジェクトの場合の特別処理
        if project_type == 'game':
            game_genre = project_info.get('game_genre', 'action')
            return f"""
# {project_name} - ゲーム紹介ページ

## 必須要件
- **frontend-design スキルを必ず使用してください**
- アプリ（ゲーム）の機能と特徴を中心に説明
- AIエージェント開発の説明は最小限に

## ゲーム情報
- ゲーム名: {project_name}
- ジャンル: {game_genre}
- プラットフォーム: Web ブラウザ

## 主要なゲーム機能（これをメインに説明）
{self.extract_game_features(project_info)}

## デザイン要件
1. ゲームのスクリーンショットエリア（プレースホルダーでOK）
2. 操作方法の説明セクション
3. ゲームの特徴を視覚的にアピール
4. プレイボタン（目立つCTA）
5. スコアランキングエリア（あれば）

## 技術スタック
- Canvas/WebGL
- JavaScript
- {', '.join(tech_stack) if tech_stack else 'HTML5 Game Technologies'}

## 重要
- ゲームの楽しさと特徴を前面に
- どのようなゲームプレイかを明確に
- AIで開発したことは補足程度に
"""

        # 通常のWebアプリの場合
        return f"""
# {project_name} - アプリケーション紹介ページ

## 必須要件
- **frontend-design スキルを必ず使用してください**
- アプリの機能と価値を中心に説明
- ユーザーにとってのメリットを強調

## アプリケーション情報
- アプリ名: {project_name}
- タイプ: {project_type}

## 主要機能（これをメインコンテンツに）
{self.format_features(features)}

## デザイン要件
1. ヒーローセクション（アプリの価値提案）
2. 機能紹介（ビジュアル付き）
3. 使い方の3ステップ
4. 技術スタック（サブセクション）
5. CTAボタン（今すぐ使う）

## 技術情報
{', '.join(tech_stack) if tech_stack else 'Modern Web Technologies'}

## 注意点
- アプリの価値と機能を最優先で説明
- ユーザー視点でのメリットを強調
- AI開発については最後に軽く触れる程度
"""

    def extract_game_features(self, project_info):
        """ゲームの特徴を抽出"""
        features = []

        # ゲーム固有の特徴を追加
        if project_info.get('game_genre') == 'shooting':
            features = [
                "- 爽快なシューティングアクション",
                "- 多彩な敵キャラクター",
                "- パワーアップシステム",
                "- ハイスコアチャレンジ",
                "- ステージ進行システム"
            ]
        elif project_info.get('game_genre') == 'puzzle':
            features = [
                "- 頭を使うパズル要素",
                "- 段階的な難易度",
                "- ヒントシステム",
                "- タイムアタックモード",
                "- 実績システム"
            ]
        else:
            features = project_info.get('features', [])

        return '\n'.join(features)

    def format_features(self, features):
        """機能リストをフォーマット"""
        if not features:
            return """
- ユーザーフレンドリーなインターフェース
- 高速なレスポンス
- 安全なデータ管理
- クロスプラットフォーム対応
- リアルタイム同期
"""
        return '\n'.join(f"- {f}" for f in features[:5])

    def create_about_with_frontend_skill(self, project_info):
        """frontend-design スキルを使用してabout.htmlを生成"""

        prompt = self.generate_about_html_prompt(project_info)

        # frontend-design スキル用のファイルを作成
        skill_request_path = self.project_path / "about_design_request.md"
        with open(skill_request_path, 'w', encoding='utf-8') as f:
            f.write(prompt)

        print(f"""
📝 frontend-design スキル使用の準備完了

以下の手順でabout.htmlを生成してください：

1. frontend-design スキルを起動
2. {skill_request_path} の内容でデザイン依頼
3. アプリの機能を中心とした紹介ページを生成

重要: 必ずfrontend-designスキルを使用してください
""")

        return skill_request_path

    def generate_audio_script(self, project_info):
        """アプリ中心の音声スクリプトを生成"""

        project_name = project_info.get('project_name', 'アプリケーション')
        project_type = project_info.get('project_type', 'web')
        features = project_info.get('features', [])

        if project_type == 'game':
            game_genre = project_info.get('game_genre', 'action')
            script = f"""
こんにちは。{project_name}の紹介を始めます。

{project_name}は、{game_genre}タイプのWebゲームです。
ブラウザ上で手軽に楽しめる、エキサイティングなゲーム体験を提供します。

ゲームの特徴をご紹介します。

{self.generate_game_feature_narration(project_info)}

操作は簡単で、キーボードやマウスだけで直感的にプレイできます。
初心者から上級者まで、幅広いレベルのプレイヤーが楽しめる設計になっています。

このゲームは最新のWeb技術を使用して開発されており、
スムーズなアニメーションと美しいグラフィックを実現しています。

なお、このゲームはAIエージェントシステムにより自動開発されました。
要件定義から実装、テストまで、すべてAIが行っています。

ぜひ、{project_name}をプレイして、楽しいゲーム体験をお楽しみください。

以上で、{project_name}の紹介を終わります。
"""
        else:
            script = f"""
こんにちは。{project_name}の紹介を始めます。

{project_name}は、{self.describe_app_purpose(project_info)}を実現するWebアプリケーションです。

主な機能をご紹介します。

{self.generate_feature_narration(features)}

このアプリケーションは、使いやすさを第一に設計されています。
直感的なインターフェースで、誰でも簡単に利用できます。

技術面では、最新のWeb技術を採用し、
高速で安定した動作を実現しています。

このアプリケーションは、AIエージェントシステムにより、
要件定義から実装まで自動的に開発されました。

{project_name}をぜひご利用いただき、
便利な機能をお役立てください。

以上で、{project_name}の紹介を終わります。
"""

        # スクリプトを保存
        script_path = self.project_path / "audio_script.txt"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script.strip())

        print(f"✅ アプリ中心の音声スクリプトを生成: {script_path}")
        return script_path

    def describe_app_purpose(self, project_info):
        """アプリの目的を説明"""
        project_type = project_info.get('project_type', 'web')

        purposes = {
            'web': 'ユーザーの作業効率を向上させること',
            'mobile': 'いつでもどこでも便利な機能を提供すること',
            'desktop': '強力な機能を快適に使用できること',
            'api': 'システム間の連携を簡単にすること'
        }

        return purposes.get(project_type, 'ユーザーの課題を解決すること')

    def generate_feature_narration(self, features):
        """機能の音声説明を生成"""
        if not features:
            return """
第一に、シンプルで使いやすいインターフェース。
第二に、高速な処理と応答性。
第三に、安全なデータ管理機能。
第四に、複数デバイスでの同期機能。
第五に、カスタマイズ可能な設定。
"""

        narrations = []
        order = ['第一に', '第二に', '第三に', '第四に', '第五に']
        for i, feature in enumerate(features[:5]):
            narrations.append(f"{order[i]}、{feature}。")

        return '\n'.join(narrations)

    def generate_game_feature_narration(self, project_info):
        """ゲーム機能の音声説明を生成"""
        game_genre = project_info.get('game_genre', 'action')

        if game_genre == 'shooting':
            return """
第一に、爽快なシューティングアクション。敵を倒す快感が味わえます。
第二に、多彩な敵キャラクター。それぞれ異なる攻撃パターンを持っています。
第三に、パワーアップシステム。武器を強化して強敵に立ち向かいます。
第四に、ハイスコアチャレンジ。世界中のプレイヤーと競い合えます。
第五に、美しいエフェクト。爆発や弾幕が画面を彩ります。
"""

        return """
第一に、エキサイティングなゲームプレイ。
第二に、段階的に上がる難易度。
第三に、達成感のある進行システム。
第四に、美しいビジュアル表現。
第五に、中毒性のあるゲーム性。
"""

    def find_gcp_key(self):
        """利用可能なGCPキーを探す"""
        for key_path in self.gcp_key_candidates:
            if key_path.exists():
                print(f"✅ GCPキーを発見: {key_path}")
                return key_path

        print(f"⚠️ GCPキーが見つかりません。以下の場所を確認しました:")
        for path in self.gcp_key_candidates:
            print(f"  - {path}")

        return None

    def generate_audio_with_gcp(self, script_path, output_path="explanation.mp3"):
        """GCP Text-to-Speech を使用して音声を生成（改良版）"""

        # 利用可能なキーを探す
        key_path = self.find_gcp_key()

        if not key_path:
            # キーがない場合の代替処理
            print("""
⚠️ GCP認証情報が見つかりません。

音声生成を有効にする方法:

方法1: 既存のキーをコピー
  cp ~/Desktop/SKILLS/tts-api-key.json ~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json

方法2: 新規作成
  1. Google Cloud Console で Text-to-Speech API を有効化
  2. サービスアカウントキーを作成
  3. 以下のいずれかの場所に保存:
     - ~/Desktop/SKILLS/tts-api-key.json
     - ~/Desktop/git-worktree-agent/credentials/gcp-workflow-key.json
""")
            return None

        # Google Cloud TTS用のスクリプトを生成
        tts_script = f"""
const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');

// クライアントを作成
const client = new textToSpeech.TextToSpeechClient({{
    keyFilename: '{key_path}'
}});

async function generateSpeech() {{
    try {{
        // テキストを読み込み
        const text = fs.readFileSync('{script_path}', 'utf-8');

        // リクエストを構築
        const request = {{
            input: {{ text: text }},
            voice: {{
                languageCode: 'ja-JP',
                name: 'ja-JP-Neural2-D',  // 男性の自然な声
                ssmlGender: 'MALE'
            }},
            audioConfig: {{
                audioEncoding: 'MP3',
                speakingRate: 1.0,
                pitch: 0.0,
                effectsProfileId: ['headphone-class-device']
            }},
        }};

        console.log('🎤 音声生成中...');

        // API呼び出し
        const [response] = await client.synthesizeSpeech(request);

        // 音声ファイルを保存
        fs.writeFileSync('{output_path}', response.audioContent, 'binary');
        console.log('✅ 音声ファイルを生成しました: {output_path}');
    }} catch (error) {{
        console.error('❌ エラー:', error.message);
        if (error.code === 7) {{
            console.log('認証エラー: サービスアカウントキーを確認してください');
            console.log('キーパス: {key_path}');
        }}
    }}
}}

generateSpeech();
"""

        # 一時的なNode.jsスクリプトを作成
        tts_script_path = self.project_path / "generate_audio_gcp.js"
        with open(tts_script_path, 'w', encoding='utf-8') as f:
            f.write(tts_script)

        print(f"✅ TTS生成スクリプトを作成: {tts_script_path}")
        print(f"📍 使用するGCPキー: {key_path}")

        # package.json に依存関係を追加
        self.update_package_json()

        return output_path

    def update_package_json(self):
        """package.jsonを更新"""
        package_json_path = self.project_path / "package.json"

        if package_json_path.exists():
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
        else:
            package_data = {
                "name": "app",
                "version": "1.0.0",
                "description": "AI Generated App"
            }

        # 依存関係を追加
        if 'dependencies' not in package_data:
            package_data['dependencies'] = {}

        package_data['dependencies']['@google-cloud/text-to-speech'] = "^4.2.0"

        # スクリプトを追加
        if 'scripts' not in package_data:
            package_data['scripts'] = {}

        package_data['scripts']['generate-audio'] = 'node generate_audio_gcp.js'

        with open(package_json_path, 'w') as f:
            json.dump(package_data, f, indent=2)

        print("✅ package.json を更新しました")

    def generate_all_documents(self):
        """すべてのドキュメントを生成"""
        print("📄 アプリ特化型ドキュメント生成を開始...")

        # プロジェクト情報を取得
        project_info = self.get_project_details()

        # 1. frontend-design スキル用のプロンプトを生成
        design_request = self.create_about_with_frontend_skill(project_info)

        # 2. アプリ中心の音声スクリプトを生成
        script_path = self.generate_audio_script(project_info)

        # 3. GCP TTS用スクリプトを生成（改良版パス）
        audio_path = self.generate_audio_with_gcp(script_path)

        print("\n✅ ドキュメント生成完了！")
        print(f"  - デザイン依頼: {design_request}")
        print(f"  - 音声スクリプト: {script_path}")

        if audio_path:
            print(f"  - 音声生成準備: 完了")
            print("\n📢 音声を生成するには:")
            print("  npm install")
            print("  npm run generate-audio")

        return {
            'design_request': str(design_request),
            'audio_script': str(script_path),
            'audio_ready': audio_path is not None
        }

def main():
    """メイン処理"""
    documenter = DocumenterAgentV2()
    results = documenter.generate_all_documents()

    print("\n📚 次のステップ:")
    print("1. frontend-design スキルでabout.htmlを生成")
    print("2. npm install && npm run generate-audio で音声生成")

if __name__ == "__main__":
    main()