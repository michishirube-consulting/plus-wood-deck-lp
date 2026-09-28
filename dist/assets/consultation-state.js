(() => {
  'use strict';

  const ID_KEY = 'wooddeckConsultationId';
  const ATTRIBUTION_KEY = 'wooddeckAttribution';
  const ATTRIBUTION_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const PLAN_LABELS = Object.freeze({ tree: '植栽を囲むデッキ', 'outdoor-room': '屋根付きの外の部屋', courtyard: '中庭をつなぐ回廊', terraced: '段差を生かすテラス', canopy: 'モダンな屋根付きデッキ', angled: '敷地に沿う変形デッキ' });
  const SIZE_LABELS = Object.freeze({ compact: 'ひと休み・庭へ出る（1.8 × 1.2m）', pair: '2人でお茶を楽しむ（2.7 × 1.8m）', family: '家族でテーブルを囲む（3.6 × 2.4m）' });
  const INTENT_LABELS = Object.freeze({ budget: '予算に合う広さと必要な工事', dining: '庭でお茶・食事をする広さ', laundry: '洗濯物を干す動線と配置' });
  const PAIN_LABELS = Object.freeze({ step: '庭に出る段差が大きい', laundry: '洗濯物を運びにくい', narrow: '庭が狭く、置けるか不安', privacy: '道路・隣家の視線が気になる', family: '家族で過ごす場所がない', price: '総額の目安が分からない' });
  const PRODUCT_SLUGS = ['kiraraku-plain', 'kiraraku-masame', 'kiraraku-kibori-revia', 'kiraraku-stage-kibori'];

  function readJson(key, fallback = null, storage) {
    try {
      const value = JSON.parse((storage || sessionStorage).getItem(key) || 'null');
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value, storage) {
    try {
      (storage || sessionStorage).setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function clean(value, max = 100) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
  }

  function lpSelectionLines(selection = {}, { includePain = true } = {}) {
    const lines = [];
    const label = (labels, key) => Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : '';
    if (includePain && label(PAIN_LABELS, selection.pain)) lines.push(`いま困っていること：${label(PAIN_LABELS, selection.pain)}`);
    if (label(PLAN_LABELS, selection.plan)) lines.push(`気になる形：LPの「${label(PLAN_LABELS, selection.plan)}」`);
    if (label(SIZE_LABELS, selection.size)) {
      lines.push(`広さの参考：${label(SIZE_LABELS, selection.size)}`);
      lines.push('上記は配置の参考です。確定寸法ではありません。');
    }
    if (label(INTENT_LABELS, selection.intent)) lines.push(`相談したいこと：${label(INTENT_LABELS, selection.intent)}`);
    return lines;
  }

  function priceSelectionLines(price = {}, { includeCity = true, includePurpose = true } = {}) {
    if (!price || typeof price !== 'object') return [];
    const lines = [];
    const selections = price.selections || {};
    const qualifiers = price.qualifiers || {};
    const option = value => clean(value, 80).replace(/^.+?:/, '');
    const yen = value => `${value.toLocaleString('ja-JP')}円`;
    if (price.productName) {
      lines.push(`価格診断の商品：${clean(price.productName, 100)}`);
      if (selections.width) lines.push(`幅：${option(selections.width)}`);
      if (selections.depth) lines.push(`奥行：${option(selections.depth)}`);
      if (selections.height) lines.push(selections.height === '__unknown__' ? '高さ：未定（窓・地面の高さを確認希望）' : `高さ：${option(selections.height)}`);
      if (Number.isFinite(price.price) && price.price > 0) lines.push(`税込・商品本体参考価格：${yen(price.price)}`);
      else if (Number.isFinite(price.priceMin) && Number.isFinite(price.priceMax) && price.priceMin > 0 && price.priceMax >= price.priceMin) {
        lines.push(`税込・商品本体参考価格：${yen(price.priceMin)}〜${yen(price.priceMax)}（高さ未定の範囲）`);
      }
      lines.push('商品本体の参考価格です。施工費・追加工事等は含みません。');
    }
    if (includeCity && qualifiers.city) lines.push(`施工希望地域：${clean(qualifiers.city, 40)}`);
    if (includePurpose && qualifiers.purpose) lines.push(`庭でしたいこと：${clean(qualifiers.purpose, 40)}`);
    if (qualifiers.existing) lines.push(`既存デッキ：${clean(qualifiers.existing, 40)}`);
    if (qualifiers.ground) lines.push(`設置場所の地面：${clean(qualifiers.ground, 40)}`);
    if (Array.isArray(qualifiers.extras)) {
      const extras = qualifiers.extras.slice(0, 4).map(value => clean(value, 40)).filter(Boolean);
      if (extras.length) lines.push(`一緒に相談したいもの：${extras.join('、')}`);
    }
    return lines;
  }

  // Relative to the LP root: valid for localhost and the GitHub Pages subdirectory.
  function productPath(price = {}) {
    return PRODUCT_SLUGS.includes(price?.productSlug) ? `products/wooddeck/${price.productSlug}/` : 'wooddeck/';
  }

  function getConsultationId() {
    try {
      const existing = clean(sessionStorage.getItem(ID_KEY), 40);
      if (/^WD-\d{8}-[A-Z0-9]{6}$/.test(existing)) return existing;
      const now = new Date();
      const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const token = [...bytes].map(value => alphabet[value % alphabet.length]).join('');
      const id = `WD-${date}-${token}`;
      sessionStorage.setItem(ID_KEY, id);
      return id;
    } catch {
      return 'WD-' + Date.now().toString(36).toUpperCase();
    }
  }

  function captureAttribution() {
    const previous = readJson(ATTRIBUTION_KEY, {});
    const params = new URLSearchParams(location.search);
    const next = { ...previous };
    ATTRIBUTION_FIELDS.forEach(field => {
      const value = clean(params.get(field), 100);
      if (value) next[field] = value;
    });
    if (Object.keys(next).length) writeJson(ATTRIBUTION_KEY, next);
    return next;
  }

  function context() {
    return { consultation_id: getConsultationId(), ...captureAttribution() };
  }

  function record(event, properties = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...context(), ...properties });
  }

  function isAllowedLineUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
      if (['lin.ee', 'line.me'].includes(url.hostname)) return url.href;
      if (url.hostname === 'utage-system.com' && url.pathname.startsWith('/line/open/')) return url.href;
      return '';
    } catch {
      return '';
    }
  }

  window.WOODDECK_STATE = Object.freeze({ readJson, writeJson, clean, lpSelectionLines, priceSelectionLines, productPath, getConsultationId, captureAttribution, context, record, isAllowedLineUrl });
  captureAttribution();
})();
