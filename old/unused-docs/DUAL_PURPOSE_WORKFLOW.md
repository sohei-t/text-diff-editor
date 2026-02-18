# 目的別ワークフロー分岐システム

## 🎯 プロジェクトタイプ

### 1. Portfolio（ポートフォリオ用）
- **目的**: 転職活動での技術力アピール
- **公開**: GitHub Public
- **重視点**:
  - コードの可読性
  - 技術的チャレンジ
  - README の充実
  - デモの分かりやすさ

### 2. Client（顧客納品用）
- **目的**: ビジネス案件の納品
- **公開**: Private または 非公開
- **重視点**:
  - 仕様の完全実装
  - ドキュメントの網羅性
  - セキュリティ
  - 保守性

## 📂 ディレクトリ構成

### Portfolio プロジェクト
```
~/Desktop/AI-Apps/{app-name}-agent/
├── worktrees/
│   └── mission-v1/         # 開発作業
├── release/               # リリース版
│   └── {app-name}/        # 公開用コード
└── portfolio/             # GitHub公開用
    ├── README.md
    ├── about.html
    └── demo/
```

### Client プロジェクト
```
~/Desktop/AI-Apps/{client-name}-{app-name}-agent/
├── worktrees/
│   └── mission-v1/         # 開発作業
├── release/               # リリース版
│   └── {app-name}/        # 実行可能アプリ
└── deliverables/          # 納品物一式
    ├── 01_documents/      # ドキュメント
    │   ├── 要件定義書.pdf
    │   ├── 基本設計書.pdf
    │   ├── 詳細設計書.pdf
    │   ├── テスト結果報告書.pdf
    │   └── 操作マニュアル.pdf
    ├── 02_source/         # ソースコード
    │   ├── src.zip
    │   └── README.md
    ├── 03_executable/     # 実行可能形式
    │   ├── {app-name}.app
    │   └── launch.command
    └── 04_presentation/   # プレゼン資料
        ├── system_overview.html
        ├── demo_video.mp4
        └── explanation.mp3
```

## 🔄 ワークフローの分岐

### 初期設定（create_new_app.command 実行時）

```bash
================================
🚀 新規アプリ環境作成ウィザード
================================

プロジェクトタイプを選択してください:
[1] Portfolio - 技術ポートフォリオ用（GitHub公開）
[2] Client - 顧客納品用（非公開）

選択 (1/2):
```

### PROJECT_INFO.yaml の拡張

```yaml
project:
  name: ${APP_NAME}
  slug: ${APP_SLUG}
  type: portfolio # または client
  created: $(date +"%Y-%m-%d %H:%M:%S")

# Portfolioの場合
portfolio:
  github_repo: ai-agent-portfolio
  visibility: public
  demo_url: https://...

# Clientの場合
client:
  client_name: ${CLIENT_NAME}
  contract_id: ${CONTRACT_ID}
  delivery_date: ${DELIVERY_DATE}
  confidential: true
```

## 📋 フェーズ5: 完成処理の分岐

### 5-A. Portfolio 完成処理

```
1. Documenter実行
   - README.md（技術詳細を含む）
   - about.html（デモページ）
   - explanation.mp3（技術解説）

2. Portfolio Publisher実行
   - GitHubへpush（public）
   - デモサイトデプロイ
   - ポートフォリオサイト更新

3. 成果物
   - GitHub URL
   - デモサイトURL
   - 技術ブログ記事（自動生成）
```

### 5-B. Client 完成処理

```
1. Documenter実行
   - 要件定義書.pdf
   - 基本設計書.pdf
   - 詳細設計書.pdf
   - テスト結果報告書.pdf
   - 操作マニュアル.pdf
   - 保守マニュアル.pdf

2. Deliverable Packager実行
   - deliverables/フォルダに整理
   - ソースコードのzip化
   - ライセンスファイル追加
   - 納品チェックリスト生成

3. 成果物
   - deliverables.zip（納品物一式）
   - 納品書.pdf
   - 請求書テンプレート
```

## 🤖 新規エージェントの追加

### Deliverable Packager（納品物整理エージェント）

```javascript
deliverable_packager: {
  role: "納品物整理・パッケージング",
  condition: "project.type === 'client'",
  tasks: [
    "ドキュメントをPDF化",
    "ソースコードをzip圧縮",
    "実行可能形式の生成",
    "納品物フォルダに整理",
    "納品チェックリスト作成",
    "最終品質チェック"
  ],
  outputs: [
    "deliverables/",
    "納品チェックリスト.md",
    "deliverables.zip"
  ]
}
```

### Client Documenter（顧客向けドキュメント生成）

```javascript
client_documenter: {
  role: "顧客向けフォーマルドキュメント生成",
  condition: "project.type === 'client'",
  tasks: [
    "要件定義書の整形",
    "設計書の図表生成",
    "テスト結果の集計",
    "操作マニュアル作成",
    "PDF変換と体裁調整"
  ],
  style: {
    format: "formal_business",
    language: "敬語",
    includes: ["表紙", "目次", "改訂履歴", "承認欄"]
  }
}
```

## 🔐 セキュリティ考慮事項

### Client プロジェクトの場合

1. **GitHubへの誤push防止**
   ```bash
   # .git/configに自動追加
   [remote "origin"]
     pushurl = no_push
   ```

2. **機密情報の除外**
   - .env.production を .gitignore
   - APIキーの環境変数化
   - 顧客情報のマスキング

3. **納品前チェック**
   - ライセンスの明確化
   - 著作権表示
   - 機密情報スキャン

## 📊 実行コマンドの分岐

### Portfolio の場合
```bash
# 開発完了後
./release.sh                    # リリース版作成
./publish_to_portfolio.sh       # GitHub公開
./deploy_demo.sh                # デモサイトデプロイ
```

### Client の場合
```bash
# 開発完了後
./release.sh                    # リリース版作成
./generate_documents.sh         # ドキュメント生成
./package_deliverables.sh       # 納品物パッケージング
./final_check.sh                # 最終チェック
```

## 💡 実装優先度

### Phase 1（基本機能）
1. create_new_app.command にプロジェクトタイプ選択を追加
2. PROJECT_INFO.yaml にタイプ情報を保存
3. 完成処理フェーズでの分岐実装

### Phase 2（ドキュメント強化）
4. Client Documenter エージェント実装
5. PDF生成機能の追加
6. 納品チェックリスト自動生成

### Phase 3（自動化）
7. Deliverable Packager エージェント実装
8. 納品物の自動整理
9. 最終品質チェック自動化

## 🎯 期待される効果

### Portfolio プロジェクト
- **アピール力向上**: プロフェッショナルな公開物
- **効率化**: GitHub公開まで完全自動化
- **差別化**: AI組織の生産力を可視化

### Client プロジェクト
- **品質保証**: 網羅的なドキュメント
- **効率化**: 納品準備の自動化
- **信頼性**: プロフェッショナルな納品物