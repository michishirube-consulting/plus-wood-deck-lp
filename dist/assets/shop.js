(() => {
  'use strict';
  const config = window.WOODDECK_CONFIG || {};
  const productElement = document.getElementById('wooddeckProductData');
  const product = productElement ? JSON.parse(productElement.textContent) : null;
  const dialog = document.getElementById('shopLineDialog');
  const selections = {};
  let currentVariant = null;

  const officialLineUrl = value => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && ['lin.ee', 'line.me'].includes(url.hostname) && !url.username && !url.password && !url.port ? url.href : '';
    } catch { return ''; }
  };
  const officialLineId = value => typeof value === 'string' && /^@[a-z0-9._-]{3,50}$/i.test(value.trim()) ? value.trim() : '';
  const lineUrl = officialLineUrl(config.lineUrl);
  const lineId = officialLineId(config.lineId);
  const yen = value => `${Number(value).toLocaleString('ja-JP')}円`;
  const cleanOption = value => String(value || '').replace(/^.+?:/, '');
  const record = (event, properties = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...properties });
  };
  const consultationText = () => {
    if (!product) return 'ウッドデッキを相談したいです。\n施工希望地域（市区町村）：［入力］\n庭でしたいこと：［入力］\n商品やサイズはまだ決まっていません。';
    const lines = [
      'ウッドデッキを相談したいです。',
      `商品：${product.name}`,
      selections.width ? `幅：${cleanOption(selections.width)}` : '',
      selections.depth ? `奥行：${cleanOption(selections.depth)}` : '',
      selections.height ? `高さ：${cleanOption(selections.height)}` : '',
      currentVariant ? `税込・商品本体参考価格：${yen(Math.round(currentVariant.catalogPrice * product.rate))}` : '',
      '施工希望地域（市区町村）：［入力］',
      '庭でしたいこと：［入力］',
      '工事条件を確認して、正式な見積もりを相談したいです。'
    ];
    return lines.filter(Boolean).join('\n');
  };
  async function copyText(value) {
    try { await navigator.clipboard.writeText(value); return true; }
    catch {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.left = '-9999px';
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      return copied;
    }
  }
  function renderProduct() {
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
      try { sessionStorage.setItem('wooddeckPriceSelection', JSON.stringify({ product: product.slug, selections, price })); } catch {}
      record('wooddeck_price_result', { product_id: product.id, reference_price: price });
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
  document.querySelectorAll('.js-shop-line').forEach(button => button.addEventListener('click', async () => {
    if (button.disabled) return;
    const text = consultationText();
    record('wooddeck_line_click', { product_id: product?.id || '', has_price: Boolean(currentVariant) });
    if (lineId) {
      window.location.assign(`https://line.me/R/oaMessage/${lineId}/?${encodeURIComponent(text)}`);
    } else if (lineUrl) {
      await copyText(text);
      window.location.assign(lineUrl);
    } else {
      await copyText(text);
      dialog?.showModal();
    }
  }));
  document.querySelectorAll('[data-close-line]').forEach(button => button.addEventListener('click', () => dialog?.close()));
  dialog?.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
})();
