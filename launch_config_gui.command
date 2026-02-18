#!/bin/bash
# ============================================
# AI Agents 設定管理 GUI 起動スクリプト
# ============================================
# ダブルクリックで管理画面を起動します
# ============================================

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

echo "============================================"
echo "🔐 AI Agents 設定管理 GUI を起動します..."
echo "============================================"
echo ""

# Python環境確認
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 が見つかりません"
    echo "Homebrewでインストールしてください: brew install python"
    read -p "Enterキーを押して終了..."
    exit 1
fi

# Streamlit確認
if ! python3 -c "import streamlit" &> /dev/null; then
    echo "⚠️ Streamlit がインストールされていません"
    echo "インストールしますか？ (y/n): "
    read answer
    if [ "$answer" = "y" ]; then
        pip3 install streamlit python-dotenv pyyaml
    else
        echo "Streamlit が必要です。終了します。"
        read -p "Enterキーを押して終了..."
        exit 1
    fi
fi

# GUI起動
CONFIG_GUI="$HOME/.config/ai-agents/scripts/config_gui.py"

if [ -f "$CONFIG_GUI" ]; then
    echo "✅ 設定管理GUIを起動中..."
    echo ""
    echo "ブラウザが自動で開きます。"
    echo "開かない場合は以下のURLにアクセスしてください："
    echo "  http://localhost:8501"
    echo ""
    echo "終了するには Ctrl+C を押してください。"
    echo "============================================"
    echo ""

    # Streamlit起動（ブラウザ自動オープン）
    streamlit run "$CONFIG_GUI" --server.headless=false
else
    echo "❌ 設定管理GUIが見つかりません: $CONFIG_GUI"
    echo ""
    echo "初回セットアップが必要です。"
    echo "Claude Code で以下を実行してください："
    echo "  「設定管理システムをセットアップして」"
    read -p "Enterキーを押して終了..."
    exit 1
fi
