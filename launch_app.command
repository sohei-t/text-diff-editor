#!/bin/bash
cd "$(dirname "$0")/project/public"
echo "================================================"
echo "  Text Diff Editor - 老眼に優しいテキストエディター"
echo "================================================"
echo ""
# ポート自動検出
PORT=8080
while lsof -i:$PORT > /dev/null 2>&1; do PORT=$((PORT+1)); done
echo "  http://localhost:$PORT で起動中..."
echo "  終了するには Ctrl+C を押してください"
echo ""
open "http://localhost:$PORT"
python3 -m http.server $PORT
