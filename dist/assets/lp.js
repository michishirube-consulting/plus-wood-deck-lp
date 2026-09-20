(() => {
  'use strict';
  const config = window.WOODDECK_CONFIG || {};
  const plans = {
  "compact": {
    "title": "コンパクト",
    "alt": "窓の前に小さなベンチを置いたコンパクトなウッドデッキ",
    "description": "腰掛けたり、庭へ出たりする場所に。窓の幅と、庭に残したい広さから考えます。"
  },
  "wide": {
    "title": "横長タイプ",
    "alt": "2つの掃き出し窓に沿って設けた横長ウッドデッキ",
    "description": "部屋と部屋、庭への動線をつなぐ形。窓や室外機の位置を確認して検討します。"
  },
  "deep": {
    "title": "奥行きタイプ",
    "alt": "4人掛けのテーブルと椅子を置いた奥行きのあるウッドデッキ",
    "description": "椅子を置くだけでなく、後ろを通る余白も大切に。使う家具と人数から考えます。"
  },
  "lshape": {
    "title": "L字タイプ",
    "alt": "建物の角を囲み2つの窓をつなぐL字型のウッドデッキ",
    "description": "建物の形に合わせた配置例です。2つの窓からの出入りや、庭の残し方を検討します。"
  },
  "steps": {
    "title": "幅広ステップ",
    "alt": "庭へ降りる幅広のステップを設けたウッドデッキ",
    "description": "庭へ降りる場所と段差をまとめて考える形。高さや踏面などは現地で確認します。"
  },
  "privacy": {
    "title": "目隠し付き",
    "alt": "横格子の目隠しと椅子を組み合わせたウッドデッキ",
    "description": "隣家や道路からの視線に配慮する配置例。風通しや圧迫感、必要な高さも確認します。"
  }
};
  const lineDialog = document.getElementById('lineDialog');
  const planDialog = document.getElementById('planDialog');
  const fixed = document.getElementById('fixedCta');
  const fixedButton = fixed.querySelector('button');
  const inlineButtons = [...document.querySelectorAll('.js-line:not([data-location="fixed"])')];
  const heroButton = document.querySelector('[data-location="hero"]');
  const message = document.getElementById('consultationMessage');
  const copyStatus = document.getElementById('copyStatus');
  const extra = document.getElementById('consultationExtra');
  const sizeExamples = {
    compact: { label: 'ひと休み・庭へ出る', size: '1.8 × 1.2m' },
    pair: { label: '2人でお茶を楽しむ', size: '2.7 × 1.8m' },
    family: { label: '家族でテーブルを囲む', size: '3.6 × 2.4m' }
  };
  const intents = {
    budget: '予算に合わせたウッドデッキを考えています。',
    dining: '庭でお茶や食事ができるデッキを考えています。',
    laundry: '洗濯物を干すときに使えるデッキを考えています。',
    undecided: 'ウッドデッキを検討しています。'
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selectedPlan = '';
  let selectedSize = '';
  let selectedIntent = 'undecided';
  let viewedPlan = '';
  let framePending = false;

  // Events stay local unless the approved analytics integration consumes dataLayer.
  // Never include the consultation text, photos, address or other personal data.
  function record(event, properties = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...properties });
  }
  function officialLineUrl(value) {
    try {
      const url = new URL(value);
      const officialHost = ['lin.ee', 'line.me'].includes(url.hostname);
      return url.protocol === 'https:' && officialHost && !url.username && !url.password && !url.port
        ? url.href : '';
    } catch { return ''; }
  }
  const lineUrl = officialLineUrl(config.lineUrl);
  document.querySelectorAll('[data-service-area]').forEach(element => {
    if (typeof config.serviceArea === 'string' && config.serviceArea.trim()) {
      element.textContent = '対応エリア：' + config.serviceArea.trim();
      element.hidden = false;
    }
  });

  function updateFixed() {
    framePending = false;
    const dialogOpen = lineDialog.open || planDialog.open;
    const inlineVisible = inlineButtons.some(button => {
      const rect = button.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    const editing = document.activeElement === extra;
    const visible = heroButton.getBoundingClientRect().bottom <= 0 && !inlineVisible && !dialogOpen && !editing;
    fixed.classList.toggle('visible', visible);
    fixed.setAttribute('aria-hidden', String(!visible));
    fixedButton.tabIndex = visible ? 0 : -1;
  }
  function queueFixed() {
    if (!framePending) {
      framePending = true;
      window.requestAnimationFrame(updateFixed);
    }
  }
  window.addEventListener('scroll', queueFixed, { passive: true });
  window.addEventListener('resize', queueFixed);
  document.querySelectorAll('.js-line').forEach(button => {
    button.addEventListener('click', () => {
      record(lineUrl ? 'wooddeck_line_click' : 'wooddeck_preview_cta_click', {
        cta_location: button.dataset.location,
        plan_id: selectedPlan || 'unselected',
        size_example: selectedSize || 'unselected',
        intent_id: selectedIntent
      });
      if (lineUrl) {
        window.location.assign(lineUrl);
      } else {
        lineDialog.showModal();
        updateFixed();
      }
    });
  });

  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  [lineDialog, planDialog].forEach(dialog => {
    dialog.addEventListener('close', queueFixed);
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog &&
          (event.clientX < rect.left || event.clientX > rect.right ||
           event.clientY < rect.top || event.clientY > rect.bottom)) {
        dialog.close();
      }
    });
  });

  document.querySelectorAll('[data-plan]').forEach(button => {
    button.addEventListener('click', () => {
      viewedPlan = button.dataset.plan;
      const plan = plans[viewedPlan];
      if (!plan) return;
      const image = document.getElementById('planImage');
      image.src = 'assets/patterns/deck-' + viewedPlan + '.jpg';
      image.parentElement.querySelector('source').srcset = 'assets/patterns/deck-' + viewedPlan + '.webp';
      image.alt = plan.alt + '。生成したプランイメージ';
      document.getElementById('planTitle').textContent = plan.title;
      document.getElementById('planDescription').textContent = plan.description;
      planDialog.showModal();
      updateFixed();
      record('wooddeck_plan_view', { plan_id: viewedPlan });
    });
  });
  document.getElementById('usePlan').addEventListener('click', () => {
    if (!plans[viewedPlan]) return;
    selectedPlan = viewedPlan;
    selectedSize = '';
    renderMessage();
    copyStatus.textContent = '選んだ形を相談文に入れました。コピーして使えます。';
    planDialog.close();
    showMessage();
    record('wooddeck_plan_select', { plan_id: selectedPlan });
  });

  function renderMessage() {
    const lines = [intents[selectedIntent]];
    let reference = '';
    if (selectedPlan) {
      reference = '気になる形：' + plans[selectedPlan].title;
      lines.push('LPの「' + plans[selectedPlan].title + '」のプランイメージが気になっています。');
    }
    if (selectedSize) {
      const example = sizeExamples[selectedSize];
      reference = '気になる配置例：' + example.label + '（' + example.size + '）';
      lines.push('LPの「' + example.label + '」の配置例（' + example.size + '）が気になっています。寸法はまだ決めていません。');
    }
    const questions = {
      budget: '予算内でできる広さと、必要な工事を相談したいです。',
      dining: '椅子やテーブルを置く広さと費用を相談したいです。',
      laundry: '窓からの出入り・物干しの配置・費用を相談したいです。',
      undecided: 'わが家に合うサイズと費用を相談したいです。'
    };
    lines.push(questions[selectedIntent]);
    if (!selectedPlan && !selectedSize) lines.push('サイズ・商品はまだ決まっていません。');
    message.textContent = lines.join('\n');
    const note = document.getElementById('selectionNote');
    note.textContent = reference;
    note.hidden = !reference;
    document.getElementById('clearSelection').hidden = !reference;
    copyStatus.textContent = '';
    queueFixed();
  }
  function showMessage() {
    document.getElementById('message-builder').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    document.querySelector('[name="intent"]:checked').focus({ preventScroll: true });
  }
  document.querySelectorAll('[name="intent"]').forEach(input => {
    input.addEventListener('change', () => {
      if (!intents[input.value]) return;
      selectedIntent = input.value;
      renderMessage();
      record('wooddeck_intent_select', { intent_id: selectedIntent });
    });
  });
  document.querySelectorAll('[data-size]').forEach(button => {
    button.addEventListener('click', () => {
      if (!sizeExamples[button.dataset.size]) return;
      selectedSize = button.dataset.size;
      selectedPlan = '';
      renderMessage();
      copyStatus.textContent = '配置例を相談文に入れました。実際のサイズは相談して決められます。';
      showMessage();
      record('wooddeck_size_select', { size_example: selectedSize });
    });
  });
  document.getElementById('clearSelection').addEventListener('click', () => {
    selectedPlan = '';
    selectedSize = '';
    renderMessage();
    document.querySelector('[name="intent"]:checked').focus({ preventScroll: true });
  });
  extra.addEventListener('input', () => { copyStatus.textContent = ''; });
  extra.addEventListener('focus', queueFixed);
  extra.addEventListener('blur', queueFixed);

  document.querySelector('[data-copy]').addEventListener('click', async () => {
    const text = message.innerText + (extra.value.trim() ? '\n\n補足：' + extra.value.trim() : '');
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); copied = true; } catch { /* Allow a manual fallback. */ }
    }
    if (!copied) {
      const field = document.createElement('textarea');
      field.value = text;
      field.readOnly = true;
      field.className = 'clipboard-field';
      document.body.append(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      field.remove();
      document.querySelector('[data-copy]').focus({ preventScroll: true });
    }
    copyStatus.textContent = copied
      ? 'コピーしました。LINEのトーク画面に貼り付けて送ってください。'
      : 'コピーできませんでした。相談文と補足をそれぞれ選択してコピーしてください。';
    if (copied) record('wooddeck_consultation_copy', { plan_id: selectedPlan || 'unselected', size_example: selectedSize || 'unselected', intent_id: selectedIntent });
  });

  const scroller = document.getElementById('caseScroller');
  const cards = [...scroller.querySelectorAll('.case-card')];
  const dots = [...document.querySelectorAll('.scroll-hint i')];
  const slideButtons = [...document.querySelectorAll('[data-slide]')];
  let currentSlide = 0;
  function cardOffset(index) {
    return cards[index].offsetLeft - cards[0].offsetLeft;
  }
  function updateSlides() {
    currentSlide = cards.reduce((nearest, card, index) =>
      Math.abs(scroller.scrollLeft - cardOffset(index)) <
      Math.abs(scroller.scrollLeft - cardOffset(nearest)) ? index : nearest, 0);
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
    slideButtons.forEach(button => {
      button.disabled = Number(button.dataset.slide) < 0
        ? currentSlide === 0 : currentSlide === cards.length - 1;
    });
  }
  function moveSlide(direction) {
    const index = Math.max(0, Math.min(cards.length - 1, currentSlide + direction));
    scroller.scrollTo({
      left: cardOffset(index),
      behavior: reduceMotion.matches ? 'auto' : 'smooth'
    });
  }
  slideButtons.forEach(button => button.addEventListener('click', () => moveSlide(Number(button.dataset.slide))));
  scroller.addEventListener('scroll', updateSlides, { passive: true });
  window.addEventListener('resize', updateSlides);
  scroller.addEventListener('keydown', event => {
    if (event.target !== scroller || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    moveSlide(event.key === 'ArrowRight' ? 1 : -1);
  });
  document.querySelectorAll('details').forEach(details => details.addEventListener('toggle', queueFixed));
  updateSlides();
  updateFixed();
})();
