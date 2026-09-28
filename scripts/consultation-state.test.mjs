import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';

function stateFixture({ blocked = false, search = '' } = {}) {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const sandbox = { window: {}, location: { search }, URL, URLSearchParams, crypto: webcrypto };
  Object.defineProperty(sandbox, 'sessionStorage', { get() {
    if (blocked) throw new Error('Storage unavailable');
    return storage;
  } });
  runInNewContext(readFileSync('dist/assets/consultation-state.js', 'utf8'), sandbox);
  return { state: sandbox.window.WOODDECK_STATE, sandbox };
}

test('LPの形・参考寸法・悩み・相談目的を具体名で渡す', () => {
  const { state } = stateFixture();
  const text = state.lpSelectionLines({ plan: 'angled', size: 'pair', pain: 'narrow', intent: 'budget' }).join('\n');
  for (const expected of ['敷地に沿う変形デッキ', '2.7 × 1.8m', '庭が狭く、置けるか不安', '予算に合う広さと必要な工事', '確定寸法ではありません']) assert.ok(text.includes(expected), expected);
});

test('既にフォームで確認した悩みは重複させず、未選択から候補を作らない', () => {
  const { state } = stateFixture();
  assert.equal(state.lpSelectionLines({ intent: 'undecided' }).length, 0);
  assert.equal(state.lpSelectionLines({ plan: '__proto__', pain: 'constructor', size: 'unknown' }).length, 0);
  assert.equal(state.lpSelectionLines({ pain: 'narrow' }, { includePain: false }).length, 0);
});

const price = {
  productSlug: 'kiraraku-plain', productName: '樹ら楽 プレーンタイプ',
  selections: { width: 'width:2750mm', depth: 'depth:1828mm', height: '__unknown__' },
  priceMin: 100000, priceMax: 120000,
  qualifiers: { city: 'テスト市', purpose: '2人でお茶', existing: 'なし', ground: '砂利', extras: ['ステップ', 'フェンス・目隠し'] }
};

test('商品と工事条件を引き継ぎ、高さ未定の価格帯と本体のみの範囲を維持する', () => {
  const { state } = stateFixture();
  const text = state.priceSelectionLines(price).join('\n');
  for (const expected of ['樹ら楽', '幅：2750mm', '奥行：1828mm', '高さ：未定', '100,000円〜120,000円', 'テスト市', '2人でお茶', '既存デッキ：なし', '砂利', 'ステップ、フェンス・目隠し', '施工費・追加工事等は含みません']) assert.ok(text.includes(expected), expected);
  const changed = state.priceSelectionLines(price, { includeCity: false, includePurpose: false }).join('\n');
  assert.ok(!changed.includes('テスト市'));
  assert.ok(!changed.includes('2人でお茶'));
  assert.ok(changed.includes('砂利'));
  assert.equal(state.priceSelectionLines(null).length, 0);
});

test('総額を生成せず、本体の確定参考値または有効な範囲だけを表示する', () => {
  const { state } = stateFixture();
  assert.ok(state.priceSelectionLines({ ...price, price: 101753 }).join('\n').includes('101,753円'));
  const invalid = state.priceSelectionLines({ ...price, priceMin: -1, priceMax: 120000 }).join('\n');
  assert.ok(!invalid.includes('税込・商品本体参考価格：'));
});

test('GitHub Pagesのサブディレクトリでも選んだ商品へ戻り、任意URLへは移動しない', () => {
  const { state } = stateFixture();
  const path = state.productPath({ ...price, productUrl: '/plus-wood-deck-lp/products/wooddeck/kiraraku-plain/' });
  assert.equal(new URL(path, 'https://example.org/plus-wood-deck-lp/').pathname, '/plus-wood-deck-lp/products/wooddeck/kiraraku-plain/');
  assert.equal(new URL(path, 'http://localhost:4187/').pathname, '/products/wooddeck/kiraraku-plain/');
  assert.equal(state.productPath({ productSlug: '../operator', productUrl: 'https://evil.invalid/' }), 'wooddeck/');
});

test('相談番号を同じタブで保持し、解析イベントへ地域や写真を自動で入れない', () => {
  const { state, sandbox } = stateFixture({ search: '?utm_source=instagram&city=test&photo=private' });
  assert.match(state.getConsultationId(), /^WD-\d{8}-[A-Z0-9]{6}$/);
  assert.equal(state.getConsultationId(), state.getConsultationId());
  state.record('wooddeck_line_handoff_view');
  assert.equal(sandbox.window.dataLayer[0].utm_source, 'instagram');
  assert.ok(!('city' in sandbox.window.dataLayer[0]));
  assert.ok(!('photo' in sandbox.window.dataLayer[0]));
});

test('ブラウザが保存を拒否してもページの初期化が失敗しない', () => {
  const { state } = stateFixture({ blocked: true });
  assert.equal(state.readJson('draft', 'fallback'), 'fallback');
  assert.equal(state.writeJson('draft', {}), false);
});

test('LINE遷移先を公式URL・UTAGEの登録URLに制限する', () => {
  const { state } = stateFixture();
  assert.ok(state.isAllowedLineUrl('https://utage-system.com/line/open/test'));
  for (const url of ['javascript:alert(1)', 'https://line.me.evil.invalid/', 'https://user:password@line.me/', 'https://utage-system.com/admin/']) assert.equal(state.isAllowedLineUrl(url), '');
});
