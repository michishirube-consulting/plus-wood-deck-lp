(() => {
  'use strict';
  const config = window.WOODDECK_CONFIG || {};
  const plans = {
  "tree": {
    "title": "植栽を囲むデッキ",
    "alt": "植栽のための四角い開口を設け、庭の木を囲むオリジナル形状のウッドデッキ",
    "description": "植栽のまわりに開口を設け、窓から庭への動線とつなぐ考え方です。木の成長や根への影響、床下の点検・排水を確認しながら、形と広さを検討します。",
    "idea": "庭の木を残して、その周りを使える形にしたいです。",
    "image": "assets/portfolio/deck-tree-v1"
  },
  "outdoor-room": {
    "title": "屋根付きの外の部屋",
    "alt": "住宅の脇の細長い庭を、木の目隠しと半透明の屋根で囲ったウッドデッキ",
    "description": "住宅の脇を利用する、屋根・目隠しと一体で考えるプランです。採光、風通し、雨の吹き込み、境界や設置条件を確認します。屋根を含む対応可否・仕様は個別に確認します。",
    "idea": "家の横のスペースに、屋根や目隠しを組み合わせたいです。",
    "image": "assets/portfolio/deck-outdoor-room-v1"
  },
  "courtyard": {
    "title": "中庭をつなぐ回廊",
    "alt": "中庭の植栽を残し、複数の部屋をコの字型の木の回廊でつないだ夕景",
    "description": "複数の窓をデッキでつなぎ、庭を真ん中に残す配置の考え方です。窓ごとの高さや通路幅、排水・点検のしやすさまで確認します。照明の有無も含めて検討できます。",
    "idea": "中庭を残しながら、複数の部屋をデッキでつなぎたいです。",
    "image": "assets/portfolio/deck-courtyard-v1"
  },
  "terraced": {
    "title": "段差を生かすテラス",
    "alt": "高さの異なる床と幅広いステップを組み合わせ、芝生の庭へつなげたウッドデッキ",
    "description": "床の高さや奥行きを変え、庭へのステップと過ごす場所を組み合わせるプランです。段差の寸法、歩く動線、転落対策、置きたい家具とのバランスを確認します。",
    "idea": "庭との段差を生かして、ステップや腰掛ける場所をつくりたいです。",
    "image": "assets/portfolio/deck-terraced-v1"
  },
  "canopy": {
    "title": "モダンな屋根付きデッキ",
    "alt": "白い住宅にグレーのデッキと黒いフレームの屋根、縦格子の目隠しを合わせたプラン",
    "description": "デッキと屋根、目隠しの色・形を住宅の外観に合わせる考え方です。柱と窓の位置、日差し、雨水の流れ、屋根の構造・設置条件を確認し、対応可能な仕様を検討します。",
    "idea": "家の外観に合う色で、屋根や目隠しも合わせて考えたいです。",
    "image": "assets/portfolio/deck-canopy-v1"
  },
  "angled": {
    "title": "敷地に沿う変形デッキ",
    "alt": "斜めに角を落とした多角形のデッキで、住宅の横の通り道を残した小さな庭",
    "description": "敷地や通路に合わせて角を落とすなど、床の輪郭から考えるプランです。採用する素材や商品の加工条件、必要な通路幅、室外機や点検口へのアクセスを確認します。",
    "idea": "狭い庭の形に合わせて、通り道を残したデッキを考えたいです。",
    "image": "assets/portfolio/deck-angled-v1"
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

  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const portfolioStories = [...document.querySelectorAll('.portfolio-story')];
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      filterButtons.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
      portfolioStories.forEach(story => {
        story.hidden = category !== 'all' && story.dataset.category !== category;
      });
      const count = portfolioStories.filter(story => !story.hidden).length;
      document.getElementById('portfolioCount').textContent =
        (category === 'all' ? '' : button.textContent + '：') + count + 'つのプランを表示';
      queueFixed();
      record('wooddeck_portfolio_filter', { category });
    });
  });

  document.querySelectorAll('[data-plan]').forEach(button => {
    button.addEventListener('click', () => {
      viewedPlan = button.dataset.plan;
      const plan = plans[viewedPlan];
      if (!plan) return;
      const image = document.getElementById('planImage');
      image.parentElement.querySelector('source').srcset = plan.image + '.webp';
      image.src = plan.image + '.jpg';
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
      lines.push(plans[selectedPlan].idea);
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
