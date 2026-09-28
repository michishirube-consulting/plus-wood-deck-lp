(() => {
  'use strict';

  const config = window.WOODDECK_CONFIG || {};
  const sharedState = window.WOODDECK_STATE || {};
  const form = document.getElementById('consultForm');
  const error = document.getElementById('formError');
  const submit = document.getElementById('submitConsult');
  const success = document.getElementById('successPanel');
  const handoff = document.getElementById('handoffPanel');
  const preview = document.getElementById('consultPreview');
  const handoffMessage = document.getElementById('handoffMessage');
  const handoffStatus = document.getElementById('handoffStatus');
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
    const lp = readJson('wooddeckSelection') || {};
    const lines = [
      `相談番号：${consultationId}`,
      'ウッドデッキの相談を始めます。',
      `施工希望地域：${clean(data.get('city'), 40)}`,
      `いま困っていること：${clean(data.get('pain'), 60)}`
    ];
    const purpose = clean(data.get('purpose'), 40);
    if (purpose) lines.push(`庭でしたいこと：${purpose}`);
    lines.push(...sharedState.lpSelectionLines(lp, { includePain: false }));
    lines.push(...sharedState.priceSelectionLines(price, { includeCity: false, includePurpose: !purpose }));
    lines.push('写真・図面はこの後、用意できる範囲で送ります。');
    return lines.filter(Boolean).join('\n');
  }

  function updatePreview() {
    preview.value = buildMessage(new FormData(form));
  }

  async function showHandoff(text) {
    const url = sharedState.isAllowedLineUrl(config.lineUrl);
    if (!url) throw new Error('LINE URL is not configured');
    handoffMessage.value = text;
    const copied = await copyText(text);
    handoffStatus.textContent = copied ? '相談内容をコピーしました' : '自動コピーできませんでした。下の相談文を選択してコピーしてください。';
    document.getElementById('openLine').href = url;
    form.hidden = true;
    handoff.hidden = false;
    handoffStatus.focus();
    sharedState.record('wooddeck_line_handoff_view', { cta_location: 'consult_form' });
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
      // isInClient alone does not mean that sending to the official account is available.
      if (liffReady && window.liff.isInClient() && window.liff.getContext()?.type === 'utou') {
        try {
          await window.liff.sendMessages([{ type: 'text', text }]);
        } catch {
          await showHandoff(text);
          return;
        }
        form.hidden = true;
        success.hidden = false;
        if (typeof sharedState.record === 'function') sharedState.record('wooddeck_inquiry_message_sent', { channel: 'liff' });
      } else {
        await showHandoff(text);
      }
    } catch {
      error.textContent = '送信できませんでした。時間をおいてもう一度お試しください。';
      submit.disabled = false;
      submit.firstChild.textContent = 'この内容でLINEへ進む';
    }
  });

  document.getElementById('copyHandoff')?.addEventListener('click', async () => {
    const copied = await copyText(handoffMessage.value);
    handoffStatus.textContent = copied ? 'コピーしました。LINEのトークへ貼り付けて送信してください。' : 'コピーできませんでした。相談文を選択してコピーしてください。';
  });
  document.getElementById('editConsult')?.addEventListener('click', () => {
    handoff.hidden = true;
    form.hidden = false;
    submit.disabled = false;
    submit.firstChild.textContent = 'この内容でLINEへ進む';
    document.getElementById('city').focus();
  });
  document.getElementById('openLine')?.addEventListener('click', () => sharedState.record('wooddeck_line_open', { source: 'consult_form' }));

  document.getElementById('closeLiff')?.addEventListener('click', () => {
    if (window.liff?.isInClient()) window.liff.closeWindow();
  });

  const savedPrice = readJson('wooddeckPriceSelection');
  const savedLp = readJson('wooddeckSelection') || {};
  const qualifiers = savedPrice?.qualifiers || {};
  if (qualifiers.city) document.getElementById('city').value = clean(qualifiers.city, 40);
  const painAliases = { step: '庭へ出る段差が大きい', laundry: '洗濯物を運びにくい', narrow: '庭が狭く、置けるか不安', privacy: '道路・隣家の視線が気になる', family: '家族で過ごす場所がほしい', price: '費用の目安を知りたい' };
  const purposeFromSize = { compact: 'ひと休み', pair: '2人でお茶', family: '家族で食事' };
  const purpose = qualifiers.purpose || purposeFromSize[savedLp.size] || (savedLp.intent === 'laundry' ? '洗濯' : '');
  form.querySelectorAll('[name="pain"]').forEach(input => { input.checked = input.value === painAliases[savedLp.pain]; });
  form.querySelectorAll('[name="purpose"]').forEach(input => { input.checked = input.value === purpose; });
  form.addEventListener('input', updatePreview);
  form.addEventListener('change', updatePreview);
  updatePreview();
  initializeLiff();
})();
