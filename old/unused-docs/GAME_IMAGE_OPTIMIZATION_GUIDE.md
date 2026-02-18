# 🖼️ ゲーム画像最適化ガイド

## 📐 なぜ画像サイズの最適化が重要か

### UXへの影響
1. **視認性**: 適切なサイズで見やすい
2. **操作性**: プレイヤーキャラが大きすぎず小さすぎず
3. **難易度バランス**: 当たり判定の適正化
4. **美的バランス**: 画面構成の調和

### パフォーマンスへの影響
1. **メモリ使用量**: 適切なサイズで軽量化
2. **描画速度**: 無駄に大きい画像は処理が重い
3. **ロード時間**: 最適化で高速化

## 🎮 シューティングゲームの推奨サイズ

### Canvas標準サイズ: 800x600px

| オブジェクト | 推奨サイズ | 画面比率 | 理由 |
|------------|-----------|---------|------|
| **プレイヤー** | 64x64px | 8% | 視認性と操作性のバランス |
| **小型敵** | 32x32px | 4% | 多数出現、避けやすい |
| **中型敵** | 48x48px | 6% | 標準的な敵 |
| **大型敵/ボス** | 96-128px | 12-16% | 威圧感と存在感 |
| **プレイヤー弾** | 8x16px | 1% | 細長く見やすい |
| **敵弾** | 8-12px | 1-1.5% | 視認可能だが小さめ |
| **パワーアップ** | 32x32px | 4% | 目立つが邪魔にならない |
| **爆発エフェクト** | 64x64px | 8% | インパクトある演出 |

## 🔧 ImageProcessor クラスの実装例

```javascript
// src/assets/ImageProcessor.js
export class ImageProcessor {
  constructor(canvasWidth = 800, canvasHeight = 600) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.cache = new Map();
  }

  // サイズ設定を外部ファイルから読み込み可能に
  async loadSizeConfig(configPath = 'config/asset_sizes.json') {
    try {
      const response = await fetch(configPath);
      this.sizeConfig = await response.json();
    } catch (e) {
      console.warn('Using default size configuration');
      this.sizeConfig = this.getDefaultSizes();
    }
  }

  getDefaultSizes() {
    return {
      'player': {
        width: 64,
        height: 64,
        maxScale: 1.5,
        minScale: 0.5
      },
      'enemy_small': {
        width: 32,
        height: 32,
        maxScale: 1.2,
        minScale: 0.8
      },
      'enemy_medium': {
        width: 48,
        height: 48,
        maxScale: 1.3,
        minScale: 0.7
      },
      'enemy_large': {
        width: 96,
        height: 96,
        maxScale: 1.5,
        minScale: 0.6
      },
      'boss': {
        width: 128,
        height: 128,
        maxScale: 1.5,
        minScale: 0.5
      },
      'bullet_player': {
        width: 8,
        height: 16,
        maxScale: 1.0,
        minScale: 1.0
      },
      'bullet_enemy': {
        width: 12,
        height: 12,
        maxScale: 1.2,
        minScale: 0.8
      },
      'powerup': {
        width: 32,
        height: 32,
        maxScale: 1.5,
        minScale: 0.8
      },
      'explosion': {
        width: 64,
        height: 64,
        maxScale: 2.0,
        minScale: 0.5
      },
      'background': {
        width: this.canvasWidth,
        height: this.canvasHeight,
        maxScale: 1.0,
        minScale: 1.0
      }
    };
  }

  async processImage(imagePath, targetType, options = {}) {
    // キャッシュチェック
    const cacheKey = `${imagePath}_${targetType}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const img = await this.loadImage(imagePath);
    const config = this.sizeConfig[targetType] || this.sizeConfig['enemy_medium'];

    // オプションでサイズ調整
    const targetSize = {
      width: options.width || config.width,
      height: options.height || config.height
    };

    // 自動サイズ判定
    const needsResize = this.shouldResize(img, targetSize, config);

    if (needsResize) {
      console.log(`🎨 Optimizing ${targetType}: ${img.width}x${img.height} → ${targetSize.width}x${targetSize.height}`);
      const optimized = await this.resizeImage(img, targetSize, options);
      this.cache.set(cacheKey, optimized);
      return optimized;
    }

    this.cache.set(cacheKey, img);
    return img;
  }

  shouldResize(img, targetSize, config) {
    // サイズ差が閾値を超える場合はリサイズ
    const widthRatio = img.width / targetSize.width;
    const heightRatio = img.height / targetSize.height;

    return widthRatio > config.maxScale ||
           widthRatio < config.minScale ||
           heightRatio > config.maxScale ||
           heightRatio < config.minScale;
  }

  async resizeImage(img, targetSize, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;
    const ctx = canvas.getContext('2d');

    // 画質設定
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = options.quality || 'high';

    if (options.pixelArt) {
      // ピクセルアート用設定
      ctx.imageSmoothingEnabled = false;
    }

    // アスペクト比を保持するか
    if (options.preserveAspectRatio !== false) {
      const scale = Math.min(
        targetSize.width / img.width,
        targetSize.height / img.height
      );

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      // 透明背景
      if (options.transparent !== false) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    } else {
      // ストレッチ（非推奨）
      ctx.drawImage(img, 0, 0, targetSize.width, targetSize.height);
    }

    return canvas;
  }

  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error(`Failed to load image: ${src}`);
        reject(e);
      };
      img.src = src;
    });
  }

  // バッチ処理
  async processAllAssets(assetList) {
    const processed = [];
    for (const asset of assetList) {
      try {
        const result = await this.processImage(
          asset.path,
          asset.type,
          asset.options || {}
        );
        processed.push({
          ...asset,
          processed: true,
          canvas: result
        });
      } catch (e) {
        console.error(`Failed to process ${asset.path}:`, e);
        processed.push({
          ...asset,
          processed: false,
          error: e.message
        });
      }
    }
    return processed;
  }

  // 最適化レポート生成
  generateOptimizationReport(assetList) {
    const report = {
      totalAssets: assetList.length,
      optimized: 0,
      errors: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      details: []
    };

    assetList.forEach(asset => {
      if (asset.processed) {
        report.optimized++;
        // サイズ計算等
      } else {
        report.errors++;
      }
    });

    return report;
  }
}
```

## 📝 config/asset_sizes.json の例

```json
{
  "player": {
    "width": 64,
    "height": 64,
    "maxScale": 1.5,
    "minScale": 0.5,
    "quality": "high",
    "preserveAspectRatio": true
  },
  "enemy_small": {
    "width": 32,
    "height": 32,
    "maxScale": 1.2,
    "minScale": 0.8,
    "quality": "medium"
  },
  "enemy_medium": {
    "width": 48,
    "height": 48,
    "maxScale": 1.3,
    "minScale": 0.7
  },
  "enemy_large": {
    "width": 96,
    "height": 96,
    "maxScale": 1.5,
    "minScale": 0.6
  },
  "boss": {
    "width": 128,
    "height": 128,
    "maxScale": 1.5,
    "minScale": 0.5,
    "quality": "high",
    "animated": true
  },
  "bullet_player": {
    "width": 8,
    "height": 16,
    "quality": "low",
    "pixelArt": true
  },
  "bullet_enemy": {
    "width": 12,
    "height": 12,
    "quality": "low",
    "pixelArt": true
  }
}
```

## 🎨 使用例

```javascript
// ゲーム初期化時
async function initializeAssets() {
  const processor = new ImageProcessor(800, 600);
  await processor.loadSizeConfig();

  const assetList = [
    { path: 'assets/player.png', type: 'player' },
    { path: 'assets/enemy1.png', type: 'enemy_small' },
    { path: 'assets/enemy2.png', type: 'enemy_medium' },
    { path: 'assets/boss.png', type: 'boss' },
    { path: 'assets/bullet.png', type: 'bullet_player' },
    // カスタムサイズ指定も可能
    {
      path: 'assets/special_enemy.png',
      type: 'enemy_medium',
      options: { width: 56, height: 56 }
    }
  ];

  const processed = await processor.processAllAssets(assetList);

  // レポート出力
  const report = processor.generateOptimizationReport(processed);
  console.log('📊 Asset Optimization Report:', report);

  return processed;
}
```

## ✅ チェックリスト

### Asset Integration Agent が確認すべき項目

- [ ] すべての画像が適切なサイズに調整されているか
- [ ] プレイヤーキャラが画面の5-8%のサイズか
- [ ] 敵のサイズが種類ごとに差別化されているか
- [ ] 弾が小さすぎず大きすぎないか
- [ ] 画質劣化が最小限に抑えられているか
- [ ] アスペクト比が保持されているか
- [ ] 透明背景が維持されているか
- [ ] パフォーマンスに問題がないか

## 🚀 期待される効果

1. **UX向上**
   - 視認性の改善
   - 操作感の向上
   - ゲームバランスの最適化

2. **パフォーマンス改善**
   - メモリ使用量削減
   - 描画処理の高速化
   - ロード時間短縮

3. **開発効率**
   - 様々なサイズの画像を自動調整
   - 手動リサイズ作業が不要
   - 統一感のある見た目

## 📌 注意事項

1. **元画像の品質**
   - 高解像度の元画像を用意（縮小は可、拡大は品質劣化）
   - できれば SVG や高解像度 PNG を使用

2. **ピクセルアート**
   - imageSmoothingEnabled = false で処理
   - 整数倍のスケーリングを推奨

3. **メモリ管理**
   - 処理済み画像はキャッシュ
   - 不要になったらキャッシュクリア