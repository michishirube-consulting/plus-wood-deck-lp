import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const productionRoot = 'https://michishirube-consulting.github.io/plus-wood-deck-lp/';
const products = JSON.parse(readFileSync('data/wooddeck-products.source.json', 'utf8'));
const slugById = {
  '22486': 'kiraraku-plain',
  '22529': 'kiraraku-masame',
  '22487': 'kiraraku-kibori-revia',
  '9520': 'kiraraku-stage-kibori'
};
const imageMetaById = {
  '22486': { width: 933, height: 700 },
  '22529': { width: 933, height: 700 },
  '22487': { width: 933, height: 700 },
  '9520': { width: 930, height: 890 }
};

const yen = value => `${Number(value).toLocaleString('ja-JP')}円`;
const cleanDescription = value => String(value || '').replace(/^.+?の販売情報\s*/, '');
const escapeHtml = value => String(value).replace(/[&<>\"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
}[character]));
const jsonForHtml = value => JSON.stringify(value).replace(/</g, '\\u003c');

if (!Array.isArray(products) || products.length === 0) throw new Error('商品データが空です。');
if (new Set(products.map(product => product.id)).size !== products.length) throw new Error('商品IDが重複しています。');
for (const product of products) {
  if (!slugById[product.id] || !imageMetaById[product.id]) throw new Error(`公開設定のない商品IDです: ${product.id}`);
  if (!Number.isFinite(product.rate) || product.rate <= 0 || product.rate > 1) throw new Error(`${product.id}: 価格計算率を確認してください。`);
  if (!Array.isArray(product.variants) || product.variants.length === 0) throw new Error(`${product.id}: 価格バリエーションがありません。`);
  if (!Array.isArray(product.variantDimensions) || product.variantDimensions.length !== 3) throw new Error(`${product.id}: 幅・奥行・高さの3軸が必要です。`);
  const validVariants = product.variants.filter(variant => variant.valid !== false && Number.isFinite(variant.catalogPrice) && variant.catalogPrice > 0);
  const combinationKeys = validVariants.map(variant => product.variantDimensions.map(dimension => variant.selections[dimension.key]).join('|'));
  if (new Set(combinationKeys).size !== combinationKeys.length) throw new Error(`${product.id}: サイズ組み合わせが重複しています。`);
  const catalogPrices = validVariants.map(variant => variant.catalogPrice);
  const referencePrices = catalogPrices.map(price => Math.round(price * product.rate));
  if (Math.min(...catalogPrices) !== product.catalogPriceMin || Math.max(...catalogPrices) !== product.catalogPriceMax) throw new Error(`${product.id}: メーカー希望価格の範囲が一致しません。`);
  if (Math.min(...referencePrices) !== product.referencePriceMin || Math.max(...referencePrices) !== product.referencePriceMax) throw new Error(`${product.id}: 本体参考価格の範囲が一致しません。`);
  product.publicSlug = slugById[product.id];
  product.imageMeta = imageMetaById[product.id];
  product.cleanDescription = cleanDescription(product.description);
}

function head({ title, description, canonical, image, jsonLd }) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#ffffff">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="plus wood deck｜ウッドデッキ専門店">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/webp" href="${canonical.includes('/products/') ? '../../../' : '../'}assets/brand/plus-wood-deck-logo.webp">
  <link rel="stylesheet" href="${canonical.includes('/products/') ? '../../../' : '../'}assets/fonts/plus-rounded.css">
  <link rel="stylesheet" href="${canonical.includes('/products/') ? '../../../' : '../'}assets/shop.css?v=20260922">
  <script type="application/ld+json">${jsonForHtml(jsonLd)}</script>
</head>`;
}

function header(relativeRoot) {
  return `<header class="shop-header"><a class="shop-brand" href="${relativeRoot}" aria-label="plus wood deck トップへ"><img src="${relativeRoot}assets/brand/plus-wood-deck-logo.webp" width="1024" height="1024" alt="plus wood deck"><span><small>ウッドデッキ専門店</small>庭に、暮らしをプラス。</span></a><a class="header-consult" href="${relativeRoot}#contact">相談する</a></header>`;
}

function footer(relativeRoot) {
  return `<footer class="shop-footer"><p><strong>plus wood deck</strong><br>運営：みちしるべコンサルティング株式会社</p><nav><a href="${relativeRoot}">専門店トップ</a><a href="${relativeRoot}operator.html">運営者情報</a><a href="${relativeRoot}privacy.html">プライバシーポリシー</a><a href="${relativeRoot}terms.html">ご利用にあたって</a></nav><p class="shop-small">現地調査・正式見積もり・契約・施工・保証は、ご案内する地域の施工対応店が担当します。</p></footer>`;
}

const categoryCanonical = `${productionRoot}wooddeck/`;
const categoryDescription = 'LIXILの人工木ウッドデッキ4商品を比較。幅・奥行・高さを選び、税込の商品本体参考価格を確認してからLINEで相談できます。';
const categoryJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'plus wood deck', item: productionRoot },
      { '@type': 'ListItem', position: 2, name: 'ウッドデッキ商品・価格', item: categoryCanonical }
    ] },
    { '@type': 'ItemList', name: 'ウッドデッキ商品', itemListElement: products.map((product, index) => ({
      '@type': 'ListItem', position: index + 1, name: product.productName,
      url: `${productionRoot}products/wooddeck/${product.publicSlug}/`
    })) }
  ]
};
const productCards = products.map(product => `<article class="product-card">
  <a href="../products/wooddeck/${product.publicSlug}/"><img src="../assets/products/wood-deck-${product.id}.jpg" width="${product.imageMeta.width}" height="${product.imageMeta.height}" alt="${escapeHtml(product.productName)}" loading="lazy"></a>
  <div class="product-card-body"><p class="maker">LIXIL｜人工木デッキ</p><h2><a href="../products/wooddeck/${product.publicSlug}/">${escapeHtml(product.productName)}</a></h2>
  <p class="from-price"><span>税込・商品本体参考価格</span><strong>${yen(product.referencePriceMin)}〜</strong></p>
  <a class="product-link" href="../products/wooddeck/${product.publicSlug}/">サイズを選んで価格を見る <span aria-hidden="true">›</span></a></div>
</article>`).join('\n');

const categoryHtml = `${head({
  title: 'ウッドデッキの商品・本体価格を比較｜plus wood deck',
  description: categoryDescription,
  canonical: categoryCanonical,
  image: `${productionRoot}assets/products/wood-deck-22486.jpg`,
  jsonLd: categoryJsonLd
})}
<body><div class="shop-shell">${header('../')}
<main><nav class="breadcrumbs" aria-label="パンくず"><a href="../">ホーム</a><span aria-hidden="true">›</span><span>ウッドデッキ商品</span></nav>
<section class="category-hero"><p class="shop-kicker">サイズ別の価格を確認</p><h1>ウッドデッキを<br>商品から選ぶ。</h1><p>気になる商品を選び、幅・奥行・高さから税込の商品本体参考価格を確認できます。</p><div class="price-scope"><strong>このページで分かる価格</strong><p>商品本体の参考価格です。施工費、基礎、加工、ステップ、フェンス、撤去、配送などは含みません。</p></div></section>
<section class="product-list" aria-label="ウッドデッキ商品一覧">${productCards}</section>
<section class="category-consult"><p class="shop-kicker">商品が決まっていなくても大丈夫</p><h2>庭でしたいことから<br>相談できます。</h2><p>「2人でお茶をしたい」「洗濯をしやすくしたい」など、使い方から形・広さ・費用を整理します。</p><button class="shop-line js-shop-line" type="button" data-product="">LINEで形と費用を相談する</button><p class="shop-note">市区町村と、庭でしたいことをひとこと。</p></section>
</main>${footer('../')}</div>
<dialog id="shopLineDialog"><div><p class="dialog-label">LINE接続準備中</p><h2>公開用のLINE窓口を<br>設定すると利用できます。</h2><p>現在は商品と価格の確認用です。LINE URL設定後、選択内容を相談文として引き継ぎます。</p><button type="button" data-close-line>ページへ戻る</button></div></dialog>
<script src="../site-config.js"></script><script src="../assets/shop.js?v=20260922"></script></body></html>`;
mkdirSync('dist/wooddeck', { recursive: true });
writeFileSync('dist/wooddeck/index.html', categoryHtml);

for (const product of products) {
  const relativeRoot = '../../../';
  const canonical = `${productionRoot}products/wooddeck/${product.publicSlug}/`;
  const description = `${product.productName}の幅・奥行・高さ別価格を確認。税込の商品本体参考価格を見て、選択内容をLINE相談へ引き継げます。`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'plus wood deck', item: productionRoot },
        { '@type': 'ListItem', position: 2, name: 'ウッドデッキ商品', item: categoryCanonical },
        { '@type': 'ListItem', position: 3, name: product.productName, item: canonical }
      ] },
      { '@type': 'Product', name: product.productName, image: [`${productionRoot}assets/products/wood-deck-${product.id}.jpg`], description: product.cleanDescription, brand: { '@type': 'Brand', name: product.manufacturer || 'LIXIL' }, category: 'ウッドデッキ' }
    ]
  };
  const dimensions = product.variantDimensions.map((dimension, index) => `<fieldset class="dimension-field" data-dimension="${dimension.key}"><legend><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(dimension.label)}を選ぶ</legend><div class="option-grid">${dimension.options.map(option => `<label><input type="radio" name="${dimension.key}" value="${escapeHtml(option)}"><span>${escapeHtml(option.replace(/^.+?:/, ''))}</span></label>`).join('')}</div></fieldset>`).join('\n');
  const related = products.filter(item => item.id !== product.id).slice(0, 3).map(item => `<a href="../${item.publicSlug}/"><img src="${relativeRoot}assets/products/wood-deck-${item.id}.jpg" width="${item.imageMeta.width}" height="${item.imageMeta.height}" alt="${escapeHtml(item.productName)}" loading="lazy"><span>${escapeHtml(item.productName)}</span></a>`).join('');
  const safeProduct = {
    id: product.id, name: product.productName, slug: product.publicSlug,
    rate: product.rate, referencePriceMin: product.referencePriceMin,
    referencePriceMax: product.referencePriceMax, catalogPriceMin: product.catalogPriceMin,
    catalogPriceMax: product.catalogPriceMax, variants: product.variants.map(variant => ({ selections: variant.selections, catalogPrice: variant.catalogPrice, valid: variant.valid }))
  };
  const productHtml = `${head({ title: `${product.productName}の価格・サイズ｜plus wood deck`, description, canonical, image: `${productionRoot}assets/products/wood-deck-${product.id}.jpg`, jsonLd })}
<body><div class="shop-shell">${header(relativeRoot)}
<main><nav class="breadcrumbs" aria-label="パンくず"><a href="${relativeRoot}">ホーム</a><span aria-hidden="true">›</span><a href="${relativeRoot}wooddeck/">ウッドデッキ商品</a><span aria-hidden="true">›</span><span>${escapeHtml(product.productName)}</span></nav>
<article class="product-detail"><div class="product-image"><img src="${relativeRoot}assets/products/wood-deck-${product.id}.jpg" width="${product.imageMeta.width}" height="${product.imageMeta.height}" alt="${escapeHtml(product.productName)}"></div>
<div class="product-intro"><p class="maker">LIXIL｜人工木デッキ</p><h1>${escapeHtml(product.productName)}</h1><p>${escapeHtml(product.cleanDescription)}</p></div>
<section class="price-panel" aria-live="polite"><span>税込・商品本体参考価格</span><strong id="referencePrice">${yen(product.referencePriceMin)}〜${yen(product.referencePriceMax)}</strong><p id="catalogPrice">メーカー希望価格：${yen(product.catalogPriceMin)}〜${yen(product.catalogPriceMax)}</p><small>施工費、基礎、加工、ステップ、フェンス、撤去、配送などは含みません。</small></section>
<section class="configurator" aria-labelledby="config-title"><p class="shop-kicker">3項目で本体価格を確認</p><h2 id="config-title">サイズを選んでください。</h2><p>選んだ組み合わせに合わせて、本体参考価格が変わります。</p>${dimensions}</section>
<section class="selected-summary"><h2>この条件で相談する</h2><dl id="selectionSummary"><div><dt>商品</dt><dd>${escapeHtml(product.productName)}</dd></div><div><dt>サイズ</dt><dd>幅・奥行・高さを選択してください</dd></div></dl><button class="shop-line js-shop-line" type="button" data-product="${escapeHtml(product.productName)}" disabled>選択内容をLINEで相談する</button><p class="shop-note">設置場所の写真は後からでOK。工事条件はLINEで順番に確認します。</p></section>
<section class="product-description"><h2>商品の特徴</h2><p>${escapeHtml(product.cleanDescription)}</p><details><summary>価格について確認する</summary><p>表示額は商品データをもとに計算した税込の商品本体参考価格です。正式な商品価格と工事費は、現地条件と必要な部材・工事を確認したうえで施工対応店が見積もります。</p></details></section>
<section class="related"><h2>ほかの商品も見る</h2><div>${related}</div><a class="back-products" href="${relativeRoot}wooddeck/">4商品を比較する</a></section></article>
</main>${footer(relativeRoot)}</div>
<dialog id="shopLineDialog"><div><p class="dialog-label">LINE接続準備中</p><h2>選択内容を保存しました。</h2><p>公開用のLINE URL設定後、この条件から相談を始められます。</p><button type="button" data-close-line>ページへ戻る</button></div></dialog>
<script id="wooddeckProductData" type="application/json">${jsonForHtml(safeProduct)}</script><script src="${relativeRoot}site-config.js"></script><script src="${relativeRoot}assets/shop.js?v=20260922"></script></body></html>`;
  const directory = `dist/products/wooddeck/${product.publicSlug}`;
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/index.html`, productHtml);
}

console.log(`ウッドデッキ商品ページを${products.length}件生成しました。`);
