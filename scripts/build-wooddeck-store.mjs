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
  <link rel="stylesheet" href="${canonical.includes('/products/') ? '../../../' : '../'}assets/shop.css?v=20260928-market2">
  <script type="application/ld+json">${jsonForHtml(jsonLd)}</script>
</head>`;
}

function header(relativeRoot) {
  return `<header class="shop-header"><a class="shop-brand" href="${relativeRoot}" aria-label="plus wood deck トップへ"><img src="${relativeRoot}assets/brand/plus-wood-deck-logo.webp" width="1024" height="1024" alt="plus wood deck"><span><small>ウッドデッキ専門店</small>庭に、暮らしをプラス。</span></a><a class="header-consult" href="${relativeRoot}#contact">相談する</a></header>`;
}

function footer(relativeRoot) {
  return `<footer class="shop-footer"><p><strong>plus wood deck</strong><br>運営：みちしるべコンサルティング株式会社</p><nav><a href="${relativeRoot}">専門店トップ</a><a href="${relativeRoot}operator.html">運営者情報</a><a href="${relativeRoot}privacy.html">プライバシーポリシー</a><a href="${relativeRoot}terms.html">ご利用にあたって</a></nav><p class="shop-small">現地調査・正式見積もり・契約・施工・保証は、ご案内する地域の施工対応店が担当します。</p></footer>`;
}

const lineDialog = `<dialog id="shopLineDialog"><div><p class="dialog-label" id="shopLineStatus" role="status" aria-live="polite">相談内容を確認してください</p><h2>LINEで相談を<br>続けてください。</h2><p>友だち追加後、コピーした内容をトークへ貼り付けて送信してください。まだお問い合わせは送信されていません。</p><pre id="shopLineMessage"></pre><a class="dialog-line-open" id="shopLineOpen" href="#" rel="noopener">LINEを開く</a><button class="dialog-copy" id="shopLineCopy" type="button">相談内容をもう一度コピー</button><button type="button" data-close-line>ページへ戻る</button></div></dialog>`;

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
<section class="category-consult"><p class="shop-kicker">商品が決まっていなくても大丈夫</p><h2>庭でしたいことから<br>相談できます。</h2><p>「2人でお茶をしたい」「洗濯をしやすくしたい」など、使い方から形・広さ・費用を整理します。</p><button class="shop-line js-shop-line" type="button" data-location="category">LINEで形と費用を相談する</button><p class="shop-note">市区町村と、庭でしたいことをひとこと。</p></section>
</main>${footer('../')}</div>
${lineDialog}
<script src="../site-config.js"></script><script src="../assets/consultation-state.js?v=20260928-handoff3"></script><script src="../assets/shop.js?v=20260928-handoff3"></script></body></html>`;
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
  const dimensions = product.variantDimensions.map((dimension, index) => {
    const options = dimension.options.map(option => `<label><input type="radio" name="${dimension.key}" value="${escapeHtml(option)}"><span>${escapeHtml(option.replace(/^.+?:/, ''))}</span></label>`).join('');
    const unknown = dimension.key === 'height'
      ? '<label class="unknown-option"><input type="radio" name="height" value="__unknown__"><span>高さが分からない<small>選んだ幅・奥行で価格帯を表示</small></span></label>'
      : '';
    return `<fieldset class="dimension-field" data-dimension="${dimension.key}"><legend><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(dimension.label)}を選ぶ</legend><div class="option-grid">${options}${unknown}</div></fieldset>`;
  }).join('\n');
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
<section class="configurator" aria-labelledby="config-title"><p class="shop-kicker">分かる範囲で本体価格を確認</p><h2 id="config-title">幅・奥行からでも<br>価格の目安が分かります。</h2><p>高さが分からない場合は価格帯で表示し、窓や地面の高さは相談時に確認できます。</p>${dimensions}</section>
<section class="site-conditions"><details><summary>設置条件を追加すると相談がスムーズです</summary><form id="siteConditionsForm"><p>分かる項目だけで構いません。未定は空欄のままLINEで相談できます。</p><label class="city-field">施工希望地域（市区町村・任意）<input type="text" name="city" maxlength="40" autocomplete="address-level2" placeholder="例：福岡市"></label><fieldset><legend>庭でしたいこと</legend><div class="condition-grid"><label><input type="radio" name="purpose" value="ひと休み"><span>ひと休み</span></label><label><input type="radio" name="purpose" value="洗濯"><span>洗濯</span></label><label><input type="radio" name="purpose" value="2人でお茶"><span>2人でお茶</span></label><label><input type="radio" name="purpose" value="家族で食事"><span>家族で食事</span></label><label><input type="radio" name="purpose" value="まだ未定"><span>まだ未定</span></label></div></fieldset><fieldset><legend>既存のウッドデッキ</legend><div class="condition-grid"><label><input type="radio" name="existing" value="なし"><span>なし</span></label><label><input type="radio" name="existing" value="あり"><span>あり</span></label><label><input type="radio" name="existing" value="わからない"><span>わからない</span></label></div></fieldset><fieldset><legend>設置場所の地面</legend><div class="condition-grid"><label><input type="radio" name="ground" value="土"><span>土</span></label><label><input type="radio" name="ground" value="砂利"><span>砂利</span></label><label><input type="radio" name="ground" value="コンクリート・タイル"><span>コンクリート・タイル</span></label><label><input type="radio" name="ground" value="わからない"><span>わからない</span></label></div></fieldset><fieldset><legend>一緒に相談したいもの</legend><div class="condition-grid"><label><input type="checkbox" name="extras" value="ステップ"><span>ステップ</span></label><label><input type="checkbox" name="extras" value="フェンス・目隠し"><span>フェンス・目隠し</span></label><label><input type="checkbox" name="extras" value="床下の防草"><span>床下の防草</span></label><label><input type="checkbox" name="extras" value="屋根"><span>屋根</span></label></div></fieldset></form></details></section>
<section class="selected-summary"><h2>この条件で相談する</h2><dl id="selectionSummary"><div><dt>商品</dt><dd>${escapeHtml(product.productName)}</dd></div><div><dt>サイズ</dt><dd>幅・奥行を選び、高さは分かる範囲で選択してください</dd></div></dl><button class="shop-line js-shop-line" type="button" data-location="product-result" disabled>選択内容をLINEで相談する</button><p class="shop-note">高さ・設置条件・写真は後からでOK。分かる内容だけ相談文に入ります。</p><a class="return-lp" href="${relativeRoot}#message-builder">LPで選んだ形・用途もまとめて確認する</a></section>
<section class="product-description"><h2>商品の特徴</h2><p>${escapeHtml(product.cleanDescription)}</p><details><summary>価格について確認する</summary><p>表示額は商品データをもとに計算した税込の商品本体参考価格です。正式な商品価格と工事費は、現地条件と必要な部材・工事を確認したうえで施工対応店が見積もります。</p></details></section>
<section class="related"><h2>ほかの商品も見る</h2><div>${related}</div><a class="back-products" href="${relativeRoot}wooddeck/">4商品を比較する</a></section></article>
</main>${footer(relativeRoot)}</div>
${lineDialog}
<script id="wooddeckProductData" type="application/json">${jsonForHtml(safeProduct)}</script><script src="${relativeRoot}site-config.js"></script><script src="${relativeRoot}assets/consultation-state.js?v=20260928-handoff3"></script><script src="${relativeRoot}assets/shop.js?v=20260928-handoff3"></script></body></html>`;
  const directory = `dist/products/wooddeck/${product.publicSlug}`;
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/index.html`, productHtml);
}

console.log(`ウッドデッキ商品ページを${products.length}件生成しました。`);
