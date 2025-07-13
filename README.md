# バブルシューター (Bust-a-Move)

HTML5 CanvasとJavaScriptで作られたパズルボブル風のバブルシューティングゲームです。

![バブルシューター](screenshot.png)

## 特徴

- **段階的な難易度調整**: レベル1から5まで段階的に難易度が上がります
- **物理演算**: リアルな跳ね返りと落下アニメーション
- **レベルシステム**: レベルごとに色数、行数、天井落下速度が変化
- **ハイスコア機能**: localStorageでハイスコアを自動保存
- **モーダルダイアログ**: ゲームオーバー・クリア時のスタイリッシュな表示
- **落下アニメーション**: 浮いているバブルが重力で落下

## ゲームルール

1. **基本操作**
   - マウスを動かして照準を合わせる
   - クリックでバブルを発射
   - 同じ色のバブルを3個以上つなげると消える

2. **レベル進行**
   - 画面上のすべてのバブルを消すとレベルアップ
   - レベルアップ時にボーナススコア（100×レベル）を獲得

3. **天井落下システム**
   - 一定数発射すると天井が1段落下
   - レベルが上がるほど落下までの発射数が減る

4. **ゲームオーバー**
   - バブルが赤い危険ラインに到達するとゲームオーバー

## レベル構成

| レベル | バブル色数 | 初期行数 | 天井落下まで |
|--------|------------|----------|--------------|
| 1      | 3色        | 3行      | 15発         |
| 2      | 4色        | 4行      | 12発         |
| 3      | 5色        | 4行      | 10発         |
| 4      | 6色        | 5行      | 9発          |
| 5      | 6色        | 5行      | 8発          |

## プレイ方法

1. ブラウザで `index.html` を開く
2. マウスで照準を合わせてクリックで発射
3. 同じ色のバブルを3個以上つなげて消す
4. すべてのバブルを消してレベルアップを目指す

## ファイル構成

```
Bust-a-Move/
├── index.html      # メインHTMLファイル
├── style.css       # スタイルシート
├── game.js         # ゲームロジック
└── README.md       # このファイル
```

## 技術仕様

- **HTML5 Canvas**: ゲーム描画
- **JavaScript (ES6)**: ゲームロジック
- **CSS3**: UI・モーダルアニメーション
- **localStorage**: ハイスコア保存

## 主要機能

### バブル物理演算
- 壁での跳ね返り
- 六角格子配置での衝突判定
- 重力による落下アニメーション

### レベル管理
- 段階的難易度調整
- 動的色数制限
- プログレッシブな挑戦要素

### UI/UX
- リアルタイムスコア表示
- ハイスコア自動保存
- モーダルダイアログ
- 次弾プレビュー

## ブラウザ対応

- Chrome (推奨)
- Firefox
- Safari
- Edge

## 開発・カスタマイズ

### 設定変更

主要な設定は `game.js` の定数で変更できます：

```javascript
const BUBBLE_RADIUS = 20;          // バブルサイズ
const BUBBLE_COLORS = [...];       // 使用色
const ROWS = 12;                   // 最大行数
const COLS = 10;                   // 列数
```

### レベル設定

`getLevelConfig()` 関数でレベル別設定を変更できます：

```javascript
const configs = {
    1: { colors: 3, rows: 3, shotsUntilDrop: 15 },
    // ...
};
```

## ライセンス

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 更新履歴

### Version 1.0.0 (2025-01-13)
- 初回リリース
- 基本的なバブルシューティング機能
- レベルシステム実装
- ハイスコア機能追加
- モーダルダイアログ実装
- 段階的難易度調整

## 貢献

バグ報告や機能要望は Issue として投稿してください。
プルリクエストも歓迎します。

---

楽しくプレイしてください！ 🎮