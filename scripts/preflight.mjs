import {existsSync, readFileSync} from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const config = readFileSync('dist/site-config.js', 'utf8');

const setting = name => config.match(new RegExp(`${name}:\\s*['\"]([^'\"]*)['\"]`))?.[1].trim() ?? '';
const lineUrl = setting('lineUrl');
const serviceArea = setting('serviceArea');
const failures = [];
const requireLaunch = (condition, message) => {
  if (!condition) failures.push(message);
};

requireLaunch(lineUrl, 'dist/site-config.js にLINE公式アカウントURLを設定してください。');
if (lineUrl) {
  try {
    const parsedLineUrl = new URL(lineUrl);
    requireLaunch(parsedLineUrl.protocol === 'https:', 'LINE URLはhttps://から始まる必要があります。');
    requireLaunch(['line.me', 'lin.ee'].includes(parsedLineUrl.hostname), 'LINE公式ドメイン（line.me または lin.ee）のURLを設定してください。');
  } catch {
    failures.push('LINE URLの形式が正しくありません。');
  }
}

requireLaunch(serviceArea, 'dist/site-config.js に対応地域を設定してください。');
requireLaunch(!/(example|〇〇|未定|要確認)/i.test(serviceArea), '対応地域の仮文言を実際の内容へ差し替えてください。');

requireLaunch(!html.includes('木村建設'), '削除済みの会社名がLPに残っています。');
requireLaunch((html.match(/<h1\b/g) || []).length === 1, 'H1は1つにしてください。');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
requireLaunch(ids.length === new Set(ids).size, 'HTML内に重複IDがあります。');
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  requireLaunch(ids.includes(id), `リンク先 #${id} が見つかりません。`);
}
for (const [, asset] of html.matchAll(/(?:src|href)="((?:assets\/|site-config)[^"]+)"/g)) {
  requireLaunch(existsSync(`dist/${asset}`), `${asset} が見つかりません。`);
}
for (const [, asset] of html.matchAll(/srcset="(assets\/[^"]+)"/g)) {
  requireLaunch(existsSync(`dist/${asset}`), `${asset} が見つかりません。`);
}

if (failures.length) {
  console.error('公開前チェックで確認が必要な項目があります。');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`公開前チェック完了: LINE接続・対応地域・HTML・画像を確認しました（対応地域: ${serviceArea}）。`);
