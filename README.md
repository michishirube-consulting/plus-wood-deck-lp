# plus wood deck LP

Instagram広告からLINE相談につなげる、スマートフォン向けウッドデッキ専門店LPです。

## 公開ファイル

公開対象は `dist/` フォルダです。HTML・CSS・JavaScript・画像・フォントを含む静的サイトです。商品・価格ページは、公開時に検証済みの商品データから再生成します。外部ライブラリのインストールは不要です。

## ローカル確認

プロジェクトのルートで次を実行し、`http://127.0.0.1:4187/` を開きます。

```bash
python3 -m http.server 4187 --bind 127.0.0.1 --directory dist
```

## LINE公式アカウントの接続

引継ぎ担当者は、まず [LINE引継ぎ・現行実装チェックリスト](docs/line-handoff-status.md) を確認してください。設定済みの登録入口、相談文に引き継ぐ項目、UTAGE側の構築手順、未接続のLIFF・AI提案・CV集計を区別しています。現在の公開版はコピー・貼り付け方式であり、LINEの自動受付やAIボットの完成版ではありません。

LINE導線は `dist/site-config.js` で管理します。現在はplusウッドデッキのUTAGE公開登録URLを `lineUrl` に設定しています。対応地域は、確認済みの「福岡県を含む九州エリア・東海エリア・関東エリア」です。LPや価格診断で選んだ内容は端末内で相談文にまとめ、LINEを開く前にコピーします。APIのChannel secretやアクセストークンは公開ファイルへ絶対に記載しないでください。

```js
window.WOODDECK_CONFIG = Object.freeze({
  lineId: '',
  lineUrl: 'https://utage-system.com/line/open/...',
  serviceArea: '福岡県を含む九州エリア・東海エリア・関東エリア'
});
```

`lineId` を使う場合はLINEの入力欄へ相談文を直接入れられます。公開登録URLを使う場合は、相談内容をコピーしてから「LINEを開く」確認画面を表示します。友だち追加だけでは問い合わせ完了とせず、トークで相談内容が送信された時点を問い合わせCVとします。`serviceArea` が空の場合、対応エリア表示は非表示になります。

## GitHub Pagesで公開する

1. GitHubで空のリポジトリを作成します。
2. このプロジェクトを `main` ブランチへpushします。
3. GitHubのリポジトリで **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
4. `Deploy plus wood deck LP to GitHub Pages` が完了すると、PagesのURLで公開されます。

`.github/workflows/pages.yml` が `dist/` の内容だけをGitHub Pagesへ公開します。

公開ワークフローは、商品ページの生成 → 公開前チェック → Pagesへの配置の順で実行します。商品データと公開HTMLのずれを残したまま公開しない構成です。

## 主なファイル

- `dist/index.html` — LP本体
- `dist/wooddeck/index.html` — ウッドデッキ4商品の比較・価格入口
- `dist/products/wooddeck/` — 商品別のサイズ選択・本体参考価格・相談内容生成ページ
- `dist/operator.html` — 運営者情報・相談窓口と施工担当の役割
- `dist/privacy.html` — 本サービス用プライバシーポリシー
- `dist/terms.html` — サービス利用時の確認事項
- `dist/assets/lp.css` — デザイン
- `dist/assets/lp.js` — 画像拡大、相談文作成、LINE導線
- `dist/assets/shop.css` / `dist/assets/shop.js` — 商品・価格ページのUIと価格／相談内容生成
- `dist/assets/consultation-state.js` — 相談番号、UTM流入情報、LPと価格診断の選択状態を共通化
- `dist/site-config.js` — LINE公式アカウントID／URL・対応地域の設定
- `dist/sitemap.xml` — 本番URLのXMLサイトマップ
- `dist/assets/brand/` — plus wood deck ロゴ
- `dist/assets/portfolio/` — 家と庭への合わせ方が異なる6つの生成プランイメージ（表示用768px・拡大用1536px）
- `docs/portfolio-image-prompts.md` — 画像制作の意図と生成プロンプト
- `docs/lead-routing-operations.md` — 相談受付、施工店への同意取得、案件管理、加盟店連携の運用設計
- `docs/conversion-line-ai-proposal-plan.md` — LP・概算価格・LINEボット・AI提案・施工店連携を一つにつなぐCV導線の企画設計
- `docs/line-handoff-status.md` — 最新の実装状況・LINE担当者への引継ぎ・テスト条件（最初に読む）
- `docs/utage-line-build-spec.md` — UTAGEのラベル・自動応答・リッチメニューの構築指示
- `data/wooddeck-products.source.json` — 商品名・サイズ・価格の生成元データ
- `scripts/build-wooddeck-store.mjs` — 商品比較・商品詳細ページの静的HTML生成

## 本番導線の接続前チェック

- LINE公式アカウント／UTAGE公開登録URLが正しいアカウントへ接続するか確認する
- LINE Messaging APIの受信側で「最初の相談文送信」を問い合わせCVとして記録する
- 対応地域や施工対応店の稼働状況に変更がないか確認する
- 施工写真・価格・保証などは、確認済み情報だけを掲載する
- 画像生成によるプランイメージである旨の注意書きを残す
- 施工対応店へ個人情報を共有する前に、共有先・共有項目を案内して同意を記録する
- プライバシーポリシーと利用案内は、運用開始前に専門家の確認を受ける

次のコマンドで、GitHubへ送る前に公開条件を確認できます。

```bash
node scripts/build-wooddeck-store.mjs
node scripts/preflight.mjs
node --test scripts/consultation-state.test.mjs
```

## ライセンス

見出しには M PLUS Rounded 1c を使用しています。フォントのライセンスは `dist/assets/fonts/OFL-MPLUSRounded1c.txt` に同梱しています。LPのロゴ・文章・写真・画像の利用条件は、プロジェクト所有者の管理方針に従ってください。
