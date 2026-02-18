#!/bin/bash

# quick_start.sh - エージェントシステムのクイックスタートスクリプト
# 使い方: ./quick_start.sh

set -e

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🚀 AI Agent System Quick Start${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# プロジェクトタイプの選択
echo "どのようなプロジェクトを始めますか？"
echo ""
echo "1) 📱 Webアプリケーション"
echo "2) 🔧 API開発"
echo "3) 📊 データ分析"
echo "4) 🎨 UI/UXデザイン"
echo "5) 🚀 フルスタック開発"
echo "6) 🔍 研究・調査"
echo "7) 📝 ドキュメント作成"
echo "8) 🐛 デバッグ・修正"
echo "9) ⚙️  カスタム設定"
echo ""
read -p "選択してください (1-9): " project_type

# プロジェクト名の入力
echo ""
read -p "プロジェクト名を入力してください: " project_name

# プロジェクトディレクトリの作成
if [ -d "$project_name" ]; then
    echo -e "${YELLOW}⚠️  ディレクトリ '$project_name' は既に存在します${NC}"
    read -p "上書きしますか？ (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "終了します"
        exit 1
    fi
    rm -rf "$project_name"
fi

echo ""
echo -e "${GREEN}✨ プロジェクト '$project_name' を作成中...${NC}"

# テンプレートをコピー
cp -r . "$project_name" 2>/dev/null || true
cd "$project_name"

# .gitの削除（新規プロジェクトなので）
rm -rf .git

# Git初期化
git init --quiet
echo -e "${GREEN}✅ Gitリポジトリを初期化しました${NC}"

# 必要なディレクトリの作成
mkdir -p worktrees src docs tests
echo -e "${GREEN}✅ プロジェクト構造を作成しました${NC}"

# プロジェクトタイプに応じた設定
case $project_type in
    1)
        team="webapp"
        agents="frontend_dev, backend_dev, tester"
        ;;
    2)
        team="api"
        agents="backend_dev, db_expert, tester"
        ;;
    3)
        team="data"
        agents="data_scientist, engineer"
        ;;
    4)
        team="design"
        agents="ui_ux_designer, frontend_dev"
        ;;
    5)
        team="fullstack"
        agents="frontend_dev, backend_dev, devops_engineer, tester"
        ;;
    6)
        team="research"
        agents="researcher, report_writer"
        ;;
    7)
        team="docs"
        agents="report_writer"
        ;;
    8)
        team="debug"
        agents="code_reviewer, engineer, tester"
        ;;
    9)
        team="custom"
        agents="generalist"
        ;;
esac

# プロジェクト固有のREADME作成
cat > README.md << EOF
# $project_name

AIエージェントシステムで開発されるプロジェクト

## プロジェクトタイプ
- チーム: $team
- エージェント: $agents

## 使い方

### エージェントを起動してタスクを実行
\`\`\`bash
./launch_agents.sh $team "実行したいタスク"
\`\`\`

### 例
\`\`\`bash
# 新機能の追加
./launch_agents.sh $team "ユーザー認証機能を追加"

# バグ修正
./launch_agents.sh debug "ログインエラーを修正"

# ドキュメント作成
./launch_agents.sh docs "APIドキュメントを作成"
\`\`\`

## プロジェクト構造
\`\`\`
$project_name/
├── src/           # ソースコード
├── docs/          # ドキュメント
├── tests/         # テストコード
├── worktrees/     # エージェントの作業場所
├── agent_config.yaml     # エージェント設定
├── agent_library.yaml    # エージェントライブラリ
└── launch_agents.sh      # 実行スクリプト
\`\`\`

## カスタマイズ

エージェントの設定を変更するには \`agent_config.yaml\` を編集してください。
新しいエージェントを追加するには \`agent_library.yaml\` を参照してください。

---
Generated with AI Agent System
EOF

# 初期コミット
git add -A
git commit -m "Initial commit: $project_name project setup with AI agent system" --quiet

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 セットアップ完了！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}プロジェクトディレクトリ:${NC} $(pwd)"
echo ""
echo -e "${YELLOW}次のステップ:${NC}"
echo "1. cd $project_name"
echo "2. ./launch_agents.sh $team \"最初のタスクを記述\""
echo ""
echo -e "${GREEN}頑張ってください！ 🚀${NC}"