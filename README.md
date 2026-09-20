# plus wood deck LP

Instagram広告からLINE相談につなげる、スマートフォン向けウッドデッキ専門店LPです。

## 公開ファイル

公開対象は `dist/` フォルダです。HTML・CSS・JavaScript・画像・フォントを含む静的サイトのため、ビルド作業や外部ライブラリのインストールは不要です。

## ローカル確認

プロジェクトのルートで次を実行し、`http://127.0.0.1:4187/` を開きます。

```bash
python3 -m http.server 4187 --bind 127.0.0.1 --directory dist
```

## LINE公式アカウントの接続

公開前に `dist/site-config.js` の `lineUrl` にLINE公式アカウントのURLを、`serviceArea` に確認済みの対応地域を設定してください。

```js
window.WOODDECK_CONFIG = Object.freeze({
  lineUrl: 'https://line.me/R/ti/p/@example',
  serviceArea: '○○市・△△市とその周辺地域'
});
```

`lineUrl` が空の場合、LINEボタンはデザイン確認用の案内画面を表示し、外部には送信しません。GitHub Pagesの公開処理は、LINE URLまたは対応地域が未設定の場合に停止します。

## GitHub Pagesで公開する

1. GitHubで空のリポジトリを作成します。
2. このプロジェクトを `main` ブランチへpushします。
3. GitHubのリポジトリで **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
4. `Deploy plus wood deck LP to GitHub Pages` が完了すると、PagesのURLで公開されます。

`.github/workflows/pages.yml` が `dist/` の内容だけをGitHub Pagesへ公開します。

## 主なファイル

- `dist/index.html` — LP本体
- `dist/assets/lp.css` — デザイン
- `dist/assets/lp.js` — 画像拡大、相談文作成、LINE導線
- `dist/site-config.js` — LINE URL・対応地域の設定
- `dist/assets/brand/` — plus wood deck ロゴ
- `dist/assets/patterns/` — デッキのプランイメージ

## 公開前チェック

- LINE公式アカウントURLを設定する
- 対応地域を設定する
- 施工写真・価格・保証などは、確認済み情報だけを掲載する
- 画像生成によるプランイメージである旨の注意書きを残す

次のコマンドで、GitHubへ送る前に公開条件を確認できます。

```bash
node scripts/preflight.mjs
```

## ライセンス

見出しには M PLUS Rounded 1c を使用しています。フォントのライセンスは `dist/assets/fonts/OFL-MPLUSRounded1c.txt` に同梱しています。LPのロゴ・文章・写真・画像の利用条件は、プロジェクト所有者の管理方針に従ってください。
