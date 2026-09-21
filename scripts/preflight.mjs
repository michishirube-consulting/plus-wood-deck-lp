import {existsSync, readFileSync} from 'node:fs';

const pageFiles = ['index.html', 'operator.html', 'privacy.html', 'terms.html'];
const pages = Object.fromEntries(pageFiles.map(file => [file, readFileSync(`dist/${file}`, 'utf8')]));
const html = pages['index.html'];
const allHtml = Object.values(pages).join('\n');
const config = readFileSync('dist/site-config.js', 'utf8');
const robots = readFileSync('dist/robots.txt', 'utf8');
const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
const productionUrl = 'https://michishirube-consulting.github.io/plus-wood-deck-lp/';

const setting = name => config.match(new RegExp(`${name}:\\s*['\"]([^'\"]*)['\"]`))?.[1].trim() ?? '';
const lineUrl = setting('lineUrl');
const lineId = setting('lineId');
const serviceArea = setting('serviceArea');
const failures = [];
const warnings = [];
const requireLaunch = (condition, message) => {
  if (!condition) failures.push(message);
};

if (lineUrl) {
  try {
    const parsedLineUrl = new URL(lineUrl);
    requireLaunch(parsedLineUrl.protocol === 'https:', 'LINE URLはhttps://から始まる必要があります。');
    requireLaunch(['line.me', 'lin.ee'].includes(parsedLineUrl.hostname), 'LINE公式ドメイン（line.me または lin.ee）のURLを設定してください。');
  } catch {
    failures.push('LINE URLの形式が正しくありません。');
  }
} else {
  warnings.push('LINE公式アカウントURLは未設定です。');
}

if (lineId) {
  requireLaunch(/^@[a-z0-9._-]{3,50}$/i.test(lineId), 'LINE公式アカウントIDは @ から始まるIDを設定してください。');
}
if (!lineUrl && !lineId) warnings.push('LINE公式アカウントIDも未設定です。LINEボタンは案内画面を表示します。');

if (serviceArea) {
  requireLaunch(!/(example|〇〇|未定|要確認)/i.test(serviceArea), '対応地域の仮文言を実際の内容へ差し替えてください。');
} else {
  warnings.push('対応地域は未設定です。LP上では対応エリア表示を非表示にします。');
}

const formerOperator = ['木', '村', '建', '設'].join('');
const wrongJapaneseBrand = ['道', 'しるべ'].join('');
requireLaunch(!allHtml.includes(formerOperator), '削除済みの会社名が公開ページに残っています。');
requireLaunch(!allHtml.includes(wrongJapaneseBrand), 'ブランドの日本語表記は「みちしるべ」に統一してください。');
requireLaunch((html.match(/<h1\b/g) || []).length === 1, 'H1は1つにしてください。');
requireLaunch(html.includes(`<link rel="canonical" href="${productionUrl}">`), 'canonical URLを本番URLへ設定してください。');
requireLaunch(html.includes(`<meta property="og:url" content="${productionUrl}">`), 'og:urlを本番URLへ設定してください。');
requireLaunch(robots.includes(`Sitemap: ${productionUrl}sitemap.xml`), 'robots.txtに本番sitemap URLを設定してください。');
requireLaunch(html.includes('みちしるべコンサルティング株式会社'), '正式な運営会社名を表示してください。');
requireLaunch(html.includes('現地調査・見積もり・契約・施工は地域の施工対応店'), '運営窓口と施工担当の役割を明記してください。');
requireLaunch(pages['privacy.html'].includes('ご本人の同意をいただきます'), '施工対応店への情報提供前の同意を明記してください。');

for (const file of pageFiles) {
  const page = pages[file];
  const expectedUrl = file === 'index.html' ? productionUrl : `${productionUrl}${file}`;
  requireLaunch((page.match(/<h1\b/g) || []).length === 1, `${file}のH1は1つにしてください。`);
  requireLaunch(page.includes(`<link rel="canonical" href="${expectedUrl}">`), `${file}のcanonical URLを本番URLへ設定してください。`);
  requireLaunch(sitemap.includes(`<loc>${expectedUrl}</loc>`), `sitemap.xmlに${file}の本番URLを設定してください。`);

  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  requireLaunch(ids.length === new Set(ids).size, `${file}内に重複IDがあります。`);
  for (const [, id] of page.matchAll(/href="#([^"]+)"/g)) {
    requireLaunch(ids.includes(id), `${file}のリンク先 #${id} が見つかりません。`);
  }
  for (const [, asset] of page.matchAll(/(?:src|href)="((?:assets\/|site-config)[^"]+)"/g)) {
    requireLaunch(existsSync(`dist/${asset.split(/[?#]/)[0]}`), `${file}: ${asset} が見つかりません。`);
  }
  for (const [, asset] of page.matchAll(/srcset="(assets\/[^"]+)"/g)) {
    requireLaunch(existsSync(`dist/${asset}`), `${file}: ${asset} が見つかりません。`);
  }
  for (const [, linkedPage] of page.matchAll(/href="([a-z-]+\.html)"/g)) {
    requireLaunch(existsSync(`dist/${linkedPage}`), `${file}: ${linkedPage} が見つかりません。`);
  }
}

const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
requireLaunch(jsonLdBlocks.length > 0, 'JSON-LD構造化データが見つかりません。');
for (const [, block] of jsonLdBlocks) {
  try { JSON.parse(block); } catch { failures.push('JSON-LD構造化データのJSONが正しくありません。'); }
}

if (failures.length) {
  console.error('公開前チェックで確認が必要な項目があります。');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

if (warnings.length) {
  console.warn('未設定項目がありますが、安全なプレビュー動作で公開します。');
  warnings.forEach(warning => console.warn(`- ${warning}`));
}

console.log(`公開前チェック完了: HTML・画像・リンク構造を確認しました${serviceArea ? `（対応地域: ${serviceArea}）` : ''}。`);
