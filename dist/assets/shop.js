(() => {
  'use strict';

  const config = window.WOODDECK_CONFIG || {};
  const sharedState = window.WOODDECK_STATE || {};
  const productElement = document.getElementById('wooddeckProductData');
  const product = productElement ? JSON.parse(productElement.textContent) : null;
  const dialog = document.getElementById('shopLineDialog');
  const dialogMessage = document.getElementById('shopLineMessage');
  const dialogOpen = document.getElementById('shopLineOpen');
  const dialogCopy = document.getElementById('shopLineCopy');
  const selections = {};
  let currentVariant = null;

  const allowedLineUrl = value => {
    if (typeof sharedState.isAllowedLineUrl === 'function') return sharedState.isAllowedLineUrl(value);
    try {
      const url = new URL(value);
      const allowed = ['lin.ee', 'line.me'].includes(url.hostname) || (url.hostname === 'utage-system.com' && url.pathname.startsWith('/line/open/'));
      return url.protocol === 'https:' && allowed && !url.username && !url.password && !url.port ? url.href : '';
    } catch { return ''; }
  };
  const officialLineId = value => typeof value === 'string' && /^@[a-z0-9._-]{3,50}$/i.test(value.trim()) ? value.trim() : '';
  const lineUrl = allowedLineUrl(config.lineUrl);
  const lineId = officialLineId(config.lineId);
  const yen = value => `${Number(value).toLocaleString('ja-JP')}円`;
  const cleanOption = value => String(value || '').replace(/^.+?:/, '');
  const clean = (value, max = 80) => typeof sharedState.clean === 'function' ? sharedState.clean(value, max) : String(value || '').trim().slice(0, max);
  const record = (event, properties = {}) => {
    if (typeof sharedState.record === 'function') return sharedState.record(event, properties);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...properties });
  };
  const readJson = (key, fallback = null) => {
    if (typeof sharedState.readJson === 'function') return sharedState.readJson(key, fallback);
    try { return JSON.parse(sessionStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  };
  const consultationId = () => typeof sharedState.getConsultationId === 'function' ? sharedState.getConsultationId() : '';

  function qualifierValues() {
    const form = document.getElementById('siteConditionsForm');
    if (!form) return {};
    const data = new FormData(form);
    return {
      city: clean(data.get('city'), 40),
      purpose: clean(data.get('purpose'), 40),
      existing: clean(data.get('existing'), 40),
      ground: clean(data.get('ground'), 40),
      extras: data.getAll('extras').map(value => clean(value, 40)).filter(Boolean)
    };
  }

  function savedState() {
    if (!product || !currentVariant) return null;
    return {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productUrl: location.pathname + location.search,
      selections: { ...selections },
      qualifiers: qualifierValues(),
      price: Math.round(currentVariant.catalogPrice * product.rate),
      updatedAt: new Date().toISOString()
    };
  }

  function saveCurrentState() {
    const state = savedState();
    if (!state) return;
    try { sessionStorage.setItem('wooddeckPriceSelection', JSON.stringify(state)); } catch { /* Storage is optional. */ }
  }

  function consultationText() {
    const id = consultationId();
    const lp = readJson('wooddeckSelection', {});
    const qualifiers = qualifierValues();
    const lines = [id ? `相談番号：${id}` : '', 'ウッドデッキを相談したいです。'];
    if (product) {
      lines.push(`商品：${product.name}`);
      if (selections.width) lines.push(`幅：${cleanOption(selections.width)}`);
      if (selections.depth) lines.push(`奥行：${cleanOption(selections.depth)}`);
      if (selections.height) lines.push(`高さ：${cleanOption(selections.height)}`);
      if (currentVariant) lines.push(`税込・商品本体参考価格：${yen(Math.round(currentVariant.catalogPrice * product.rate))}`);
    } else {
      lines.push('商品やサイズはまだ決まっていません。');
    }
    if (qualifiers.city) lines.push(`施工希望地域：${qualifiers.city}`);
    else lines.push('施工希望地域（市区町村）：［入力］');
    if (qualifiers.purpose) lines.push(`庭でしたいこと：${qualifiers.purpose}`);
    if (qualifiers.existing) lines.push(`既存デッキ：${qualifiers.existing}`);
    if (qualifiers.ground) lines.push(`設置場所の地面：${qualifiers.ground}`);
    if (qualifiers.extras?.length) lines.push(`一緒に相談したいもの：${qualifiers.extras.join('、')}`);
    if (lp.plan || lp.size || lp.intent) lines.push('LPで選んだ使い方・形の候補もあわせて相談したいです。');
    lines.push('現地条件を確認して、正式な見積もりを相談したいです。');
    return lines.filter(Boolean).join('\n');
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(value); return true; } catch { /* Use fallback. */ }
    }
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    field.remove();
    return copied;
  }

  function renderProduct(shouldRecord = true) {
    if (!product) return;
    const complete = ['width', 'depth', 'height'].every(key => selections[key]);
    currentVariant = complete ? product.variants.find(variant => variant.valid !== false && Object.entries(selections).every(([key, value]) => variant.selections[key] === value)) : null;
    const reference = document.getElementById('referencePrice');
    const catalog = document.getElementById('catalogPrice');
    const summary = document.getElementById('selectionSummary');
    const button = document.querySelector('.selected-summary .js-shop-line');
    if (currentVariant) {
      const price = Math.round(currentVariant.catalogPrice * product.rate);
      reference.textContent = yen(price);
      catalog.textContent = `メーカー希望価格：${yen(currentVariant.catalogPrice)}`;
      summary.innerHTML = `<div><dt>商品</dt><dd>${product.name}</dd></div><div><dt>幅</dt><dd>${cleanOption(selections.width)}</dd></div><div><dt>奥行</dt><dd>${cleanOption(selections.depth)}</dd></div><div><dt>高さ</dt><dd>${cleanOption(selections.height)}</dd></div><div><dt>本体参考価格</dt><dd>${yen(price)}（税込）</dd></div>`;
      button.disabled = false;
      saveCurrentState();
      if (shouldRecord) record('wooddeck_price_result', { product_id: product.id, reference_price: price });
    } else {
      reference.textContent = `${yen(product.referencePriceMin)}〜${yen(product.referencePriceMax)}`;
      catalog.textContent = `メーカー希望価格：${yen(product.catalogPriceMin)}〜${yen(product.catalogPriceMax)}`;
      button.disabled = true;
    }
  }

  document.querySelectorAll('[data-dimension] input').forEach(input => input.addEventListener('change', () => {
    selections[input.name] = input.value;
    record('wooddeck_spec_select', { product_id: product?.id || '', dimension: input.name });
    renderProduct();
  }));
  document.getElementById('siteConditionsForm')?.addEventListener('change', () => {
    saveCurrentState();
    record('wooddeck_site_condition_change', { product_id: product?.id || '' });
  });
  document.querySelector('[name="city"]')?.addEventListener('input', saveCurrentState);

  document.querySelectorAll('.js-shop-line').forEach(button => button.addEventListener('click', async () => {
    if (button.disabled) return;
    const text = consultationText();
    record('wooddeck_line_click', { product_id: product?.id || '', has_price: Boolean(currentVariant), cta_location: button.dataset.location || 'shop' });
    if (lineId) {
      window.location.assign(`https://line.me/R/oaMessage/${lineId}/?${encodeURIComponent(text)}`);
      return;
    }
    await copyText(text);
    if (dialogMessage) dialogMessage.textContent = text;
    if (dialogOpen) {
      dialogOpen.href = lineUrl || '#';
      dialogOpen.hidden = !lineUrl;
    }
    dialog?.showModal();
    record('wooddeck_line_handoff_view', { product_id: product?.id || '', has_price: Boolean(currentVariant) });
  }));

  dialogOpen?.addEventListener('click', () => record('wooddeck_line_open', { product_id: product?.id || '', source: 'handoff_dialog' }));
  dialogCopy?.addEventListener('click', async () => {
    const copied = await copyText(consultationText());
    dialogCopy.textContent = copied ? 'コピーしました' : 'コピーできませんでした';
  });
  document.querySelectorAll('[data-close-line]').forEach(button => button.addEventListener('click', () => dialog?.close()));
  dialog?.addEventListener('close', () => { if (dialogCopy) dialogCopy.textContent = '相談内容をもう一度コピー'; });
  dialog?.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });

  function restoreProductState() {
    if (!product) return;
    const stored = readJson('wooddeckPriceSelection', null);
    if (!stored || String(stored.productId) !== String(product.id)) return;
    Object.assign(selections, stored.selections || {});
    document.querySelectorAll('[data-dimension] input').forEach(input => {
      input.checked = selections[input.name] === input.value;
    });
    const qualifiers = stored.qualifiers || {};
    const city = document.querySelector('[name="city"]');
    if (city && qualifiers.city) city.value = clean(qualifiers.city, 40);
    document.querySelectorAll('#siteConditionsForm input[type="radio"]').forEach(input => {
      input.checked = qualifiers[input.name] === input.value;
    });
    document.querySelectorAll('#siteConditionsForm input[type="checkbox"]').forEach(input => {
      input.checked = Array.isArray(qualifiers.extras) && qualifiers.extras.includes(input.value);
    });
    renderProduct(false);
  }

  restoreProductState();
})();
