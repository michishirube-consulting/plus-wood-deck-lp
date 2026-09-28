(() => {
  'use strict';

  const config = window.WOODDECK_CONFIG || {};
  const sharedState = window.WOODDECK_STATE || {};
  const form = document.getElementById('consultForm');
  const error = document.getElementById('formError');
  const submit = document.getElementById('submitConsult');
  const success = document.getElementById('successPanel');
  const clean = (value, max = 80) => typeof sharedState.clean === 'function'
    ? sharedState.clean(value, max)
    : String(value || '').trim().slice(0, max);
  const consultationId = typeof sharedState.getConsultationId === 'function'
    ? sharedState.getConsultationId()
    : 'WD-' + Date.now().toString(36).toUpperCase();
  let liffReady = false;

  function readJson(key) {
    try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
  }

  function buildMessage(data) {
    const price = readJson('wooddeckPriceSelection');
    const lp = readJson('wooddeckSelection');
    const lines = [
      `相談番号：${consultationId}`,
      'ウッドデッキの相談を始めます。',
      `施工希望地域：${clean(data.get('city'), 40)}`,
      `いま困っていること：${clean(data.get('pain'), 60)}`
    ];
    const purpose = clean(data.get('purpose'), 40);
    if (purpose) lines.push(`庭でしたいこと：${purpose}`);
    if (lp?.plan) lines.push('LPで気になる形を選択済みです。');
    if (price?.productName) {
      lines.push(`価格診断の商品：${clean(price.productName, 80)}`);
      if (price.selections?.width) lines.push(`幅：${clean(price.selections.width, 40).replace(/^.+?:/, '')}`);
      if (price.selections?.depth) lines.push(`奥行：${clean(price.selections.depth, 40).replace(/^.+?:/, '')}`);
      lines.push(price.selections?.height === '__unknown__'
        ? '高さ：未定（写真または現地で確認希望）'
        : price.selections?.height ? `高さ：${clean(price.selections.height, 50).replace(/^.+?:/, '')}` : '');
      if (Number.isFinite(price.price)) lines.push(`商品本体参考価格：${Number(price.price).toLocaleString('ja-JP')}円（税込）`);
      else if (Number.isFinite(price.priceMin) && Number.isFinite(price.priceMax)) lines.push(`商品本体参考価格：${Number(price.priceMin).toLocaleString('ja-JP')}〜${Number(price.priceMax).toLocaleString('ja-JP')}円（税込・高さ未定の範囲）`);
    }
    lines.push('写真・図面はこの後、用意できる範囲で送ります。');
    return lines.filter(Boolean).join('\n');
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* fallback */ }
    }
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    field.remove();
    return copied;
  }

  async function initializeLiff() {
    if (!config.liffId || !window.liff) return;
    try {
      await window.liff.init({ liffId: config.liffId });
      liffReady = true;
      if (!window.liff.isLoggedIn()) window.liff.login({ redirectUri: location.href });
    } catch {
      error.textContent = 'LINEとの接続を確認できませんでした。通常のLINE相談へ切り替えられます。';
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    const data = new FormData(form);
    if (!clean(data.get('city'), 40)) {
      error.textContent = '施工希望の市区町村を入力してください。';
      document.getElementById('city').focus();
      return;
    }
    if (!data.get('pain')) {
      error.textContent = 'いま一番近いお悩みを選んでください。';
      document.querySelector('[name="pain"]')?.focus();
      return;
    }
    const text = buildMessage(data);
    submit.disabled = true;
    submit.firstChild.textContent = '送信しています';
    try {
      if (liffReady && window.liff.isInClient()) {
        await window.liff.sendMessages([{ type: 'text', text }]);
        form.hidden = true;
        success.hidden = false;
        if (typeof sharedState.record === 'function') sharedState.record('wooddeck_inquiry_message_sent', { channel: 'liff' });
      } else {
        await copyText(text);
        if (config.lineUrl) location.assign(config.lineUrl);
        else throw new Error('LINE URL is not configured');
      }
    } catch {
      error.textContent = '送信できませんでした。時間をおいてもう一度お試しください。';
      submit.disabled = false;
      submit.firstChild.textContent = 'この内容をLINEで送る';
    }
  });

  document.getElementById('closeLiff')?.addEventListener('click', () => {
    if (window.liff?.isInClient()) window.liff.closeWindow();
  });

  initializeLiff();
})();
