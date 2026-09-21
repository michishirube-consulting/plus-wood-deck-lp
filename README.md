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

本番のLINE導線を接続するときに、`dist/site-config.js` の `lineId` にLINE公式アカウントID（`@`から始まるID）を設定してください。対応地域は、現在確認済みの「福岡県を含む九州エリア・東海エリア・関東エリア」を設定済みです。`lineId`を使うと、LPで選んだ形・広さ・相談目的をLINEの入力欄へ引き継げます。IDが分からない場合は、`lineUrl`にLINE公式アカウントURLを設定できます。

```js
window.WOODDECK_CONFIG = Object.freeze({
  lineId: '@example',
  lineUrl: '',
  serviceArea: '福岡県を含む九州エリア・東海エリア・関東エリア'
});
```

`lineId` と `lineUrl` が両方空の場合、LINEボタンはデザイン確認用の案内画面を表示し、外部には送信しません。`serviceArea` が空の場合、対応エリア表示は非表示になります。GitHub Pagesには安全なプレビュー状態で公開でき、設定後のpushで本番導線へ切り替わります。

## GitHub Pagesで公開する

1. GitHubで空のリポジトリを作成します。
2. このプロジェクトを `main` ブランチへpushします。
3. GitHubのリポジトリで **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
4. `Deploy plus wood deck LP to GitHub Pages` が完了すると、PagesのURLで公開されます。

`.github/workflows/pages.yml` が `dist/` の内容だけをGitHub Pagesへ公開します。

## 主なファイル

- `dist/index.html` — LP本体
- `dist/operator.html` — 運営者情報・相談窓口と施工担当の役割
- `dist/privacy.html` — 本サービス用プライバシーポリシー
- `dist/terms.html` — サービス利用時の確認事項
- `dist/assets/lp.css` — デザイン
- `dist/assets/lp.js` — 画像拡大、相談文作成、LINE導線
- `dist/site-config.js` — LINE公式アカウントID／URL・対応地域の設定
- `dist/sitemap.xml` — 本番URLのXMLサイトマップ
- `dist/assets/brand/` — plus wood deck ロゴ
- `dist/assets/portfolio/` — 家と庭への合わせ方が異なる6つの生成プランイメージ（表示用768px・拡大用1536px）
- `docs/portfolio-image-prompts.md` — 画像制作の意図と生成プロンプト
- `docs/lead-routing-operations.md` — 相談受付、施工店への同意取得、案件管理、加盟店連携の運用設計

## 本番導線の接続前チェック

- LINE公式アカウントURLを設定する
- 対応地域や施工対応店の稼働状況に変更がないか確認する
- 施工写真・価格・保証などは、確認済み情報だけを掲載する
- 画像生成によるプランイメージである旨の注意書きを残す
- 施工対応店へ個人情報を共有する前に、共有先・共有項目を案内して同意を記録する
- プライバシーポリシーと利用案内は、運用開始前に専門家の確認を受ける

次のコマンドで、GitHubへ送る前に公開条件を確認できます。

```bash
node scripts/preflight.mjs
```

## ライセンス

見出しには M PLUS Rounded 1c を使用しています。フォントのライセンスは `dist/assets/fonts/OFL-MPLUSRounded1c.txt` に同梱しています。LPのロゴ・文章・写真・画像の利用条件は、プロジェクト所有者の管理方針に従ってください。
