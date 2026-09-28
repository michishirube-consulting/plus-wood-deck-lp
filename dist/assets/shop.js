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
  let currentRange = null;

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
  const liffId = typeof config.liffId === 'string' && /^[0-9]+-[a-z0-9]+$/i.test(config.liffId.trim()) ? config.liffId.trim() : '';
  const liffUrl = liffId ? `https://liff.line.me/${liffId}` : '';
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
    if (!product || (!currentVariant && !currentRange)) return null;
    const state = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productUrl: location.pathname + location.search,
      selections: { ...selections },
      qualifiers: qualifierValues(),
      updatedAt: new Date().toISOString()
    };
    if (currentVariant) state.price = Math.round(currentVariant.catalogPrice * product.rate);
    if (currentRange) {
      state.priceMin = currentRange.priceMin;
      state.priceMax = currentRange.priceMax;
    }
    return state;
  }

  function saveCurrentState() {
    const state = savedState();
    if (!state) return;
    try { sessionStorage.setItem('wooddeckPriceSelection', JSON.stringify(state)); } catch { /* Storage is optional. */ }
  }

  function consultationText() {
    const id = consultationId();
    const lp = readJson('wooddeckSelection', {});
    const price = savedState() || (!product ? readJson('wooddeckPriceSelection') : null);
    const qualifiers = price?.qualifiers || {};
    const lines = [id ? `相談番号：${id}` : '', 'ウッドデッキを相談したいです。'];
    lines.push(...sharedState.priceSelectionLines(price));
    if (!price?.productName) {
      lines.push('商品やサイズはまだ決まっていません。');
    }
    if (!qualifiers.city) lines.push('施工希望地域（市区町村）：［入力］');
    lines.push(...sharedState.lpSelectionLines(lp));
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
    const heightUnknown = selections.height === '__unknown__';
    currentVariant = complete && !heightUnknown
      ? product.variants.find(variant => variant.valid !== false && Object.entries(selections).every(([key, value]) => variant.selections[key] === value))
      : null;
    currentRange = null;
    if (complete && heightUnknown) {
      const matching = product.variants.filter(variant => variant.valid !== false
        && variant.selections.width === selections.width
        && variant.selections.depth === selections.depth);
      if (matching.length) {
        const prices = matching.map(variant => Math.round(variant.catalogPrice * product.rate));
        const catalogPrices = matching.map(variant => variant.catalogPrice);
        currentRange = {
          priceMin: Math.min(...prices),
          priceMax: Math.max(...prices),
          catalogMin: Math.min(...catalogPrices),
          catalogMax: Math.max(...catalogPrices)
        };
      }
    }
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
    } else if (currentRange) {
      reference.textContent = `${yen(currentRange.priceMin)}〜${yen(currentRange.priceMax)}`;
      catalog.textContent = `メーカー希望価格：${yen(currentRange.catalogMin)}〜${yen(currentRange.catalogMax)}`;
      summary.innerHTML = `<div><dt>商品</dt><dd>${product.name}</dd></div><div><dt>幅</dt><dd>${cleanOption(selections.width)}</dd></div><div><dt>奥行</dt><dd>${cleanOption(selections.depth)}</dd></div><div><dt>高さ</dt><dd>未定（現地で確認）</dd></div><div><dt>本体参考価格</dt><dd>${yen(currentRange.priceMin)}〜${yen(currentRange.priceMax)}（税込）</dd></div>`;
      button.disabled = false;
      saveCurrentState();
      if (shouldRecord) record('wooddeck_price_range_result', { product_id: product.id, reference_price_min: currentRange.priceMin, reference_price_max: currentRange.priceMax, height_unknown: true });
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
    record('wooddeck_line_click', { product_id: product?.id || '', has_price: Boolean(currentVariant || currentRange), height_unknown: Boolean(currentRange), cta_location: button.dataset.location || 'shop' });
    if (liffUrl) {
      saveCurrentState();
      window.location.assign(liffUrl);
      return;
    }
    if (lineId) {
      window.location.assign(`https://line.me/R/oaMessage/${lineId}/?${encodeURIComponent(text)}`);
      return;
    }
    const copied = await copyText(text);
    const status = document.getElementById('shopLineStatus');
    if (status) status.textContent = copied ? 'STEP 1　相談内容をコピーしました' : '自動コピーできませんでした。下の相談文を選択してコピーしてください。';
    if (dialogMessage) dialogMessage.textContent = text;
    if (dialogOpen) {
      dialogOpen.href = lineUrl || '#';
      dialogOpen.hidden = !lineUrl;
    }
    dialog?.showModal();
    record('wooddeck_line_handoff_view', { product_id: product?.id || '', has_price: Boolean(currentVariant || currentRange), height_unknown: Boolean(currentRange) });
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
