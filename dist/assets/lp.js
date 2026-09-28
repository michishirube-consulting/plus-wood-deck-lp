(() => {
  'use strict';

  const config = window.WOODDECK_CONFIG || {};
  const sharedState = window.WOODDECK_STATE || {};
  const plans = {
    tree: {
      title: '植栽を囲むデッキ',
      alt: '植栽のための四角い開口を設け、庭の木を囲むオリジナル形状のウッドデッキ',
      description: '植栽のまわりに開口を設け、窓から庭への動線とつなぐ考え方です。木の成長や根への影響、床下の点検・排水を確認しながら、形と広さを検討します。',
      idea: '庭の木を残して、その周りを使える形にしたいです。',
      image: 'assets/portfolio/deck-tree-v1'
    },
    'outdoor-room': {
      title: '屋根付きの外の部屋',
      alt: '住宅の脇の細長い庭を、木の目隠しと半透明の屋根で囲ったウッドデッキ',
      description: '住宅の脇を利用する、屋根・目隠しと一体で考えるプランです。採光、風通し、雨の吹き込み、境界や設置条件を確認します。屋根を含む対応可否・仕様は個別に確認します。',
      idea: '家の横のスペースに、屋根や目隠しを組み合わせたいです。',
      image: 'assets/portfolio/deck-outdoor-room-v1'
    },
    courtyard: {
      title: '中庭をつなぐ回廊',
      alt: '中庭の植栽を残し、複数の部屋をコの字型の木の回廊でつないだ夕景',
      description: '複数の窓をデッキでつなぎ、庭を真ん中に残す配置の考え方です。窓ごとの高さや通路幅、排水・点検のしやすさまで確認します。照明の有無も含めて検討できます。',
      idea: '中庭を残しながら、複数の部屋をデッキでつなぎたいです。',
      image: 'assets/portfolio/deck-courtyard-v1'
    },
    terraced: {
      title: '段差を生かすテラス',
      alt: '高さの異なる床と幅広いステップを組み合わせ、芝生の庭へつなげたウッドデッキ',
      description: '床の高さや奥行きを変え、庭へのステップと過ごす場所を組み合わせるプランです。段差の寸法、歩く動線、転落対策、置きたい家具とのバランスを確認します。',
      idea: '庭との段差を生かして、ステップや腰掛ける場所をつくりたいです。',
      image: 'assets/portfolio/deck-terraced-v1'
    },
    canopy: {
      title: 'モダンな屋根付きデッキ',
      alt: '白い住宅にグレーのデッキと黒いフレームの屋根、縦格子の目隠しを合わせたプラン',
      description: 'デッキと屋根、目隠しの色・形を住宅の外観に合わせる考え方です。柱と窓の位置、日差し、雨水の流れ、屋根の構造・設置条件を確認し、対応可能な仕様を検討します。',
      idea: '家の外観に合う色で、屋根や目隠しも合わせて考えたいです。',
      image: 'assets/portfolio/deck-canopy-v1'
    },
    angled: {
      title: '敷地に沿う変形デッキ',
      alt: '斜めに角を落とした多角形のデッキで、住宅の横の通り道を残した小さな庭',
      description: '敷地や通路に合わせて角を落とすなど、床の輪郭から考えるプランです。採用する素材や商品の加工条件、必要な通路幅、室外機や点検口へのアクセスを確認します。',
      idea: '狭い庭の形に合わせて、通り道を残したデッキを考えたいです。',
      image: 'assets/portfolio/deck-angled-v1'
    }
  };
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
  const questions = {
    budget: '予算内でできる広さと、必要な工事を相談したいです。',
    dining: '椅子やテーブルを置く広さと費用を相談したいです。',
    laundry: '窓からの出入り・物干しの配置・費用を相談したいです。',
    undecided: 'わが家に合う形・サイズ・費用を相談したいです。'
  };
  const pains = {
    step: {
      label: '庭に出る段差が大きい',
      question: '窓から庭へ出やすい高さと、必要なステップを相談したいです。'
    },
    laundry: {
      label: '洗濯物を運びにくい',
      question: '物干しまでの動線と、無理なく出入りできる広さを相談したいです。'
    },
    narrow: {
      label: '庭が狭く、置けるか不安',
      question: '通り道を残しながら設置できる形と奥行きを相談したいです。'
    },
    privacy: {
      label: '道路・隣家の視線が気になる',
      question: '閉塞感を抑えながら、必要な位置だけ目隠しする方法を相談したいです。'
    },
    family: {
      label: '家族で過ごす場所がない',
      question: '家族で使う人数と置きたい家具に合う広さを相談したいです。'
    },
    price: {
      label: '総額の目安が分からない',
      question: '本体だけでなく、必要な工事を含む費用の考え方を相談したいです。'
    }
  };

  const lineDialog = document.getElementById('lineDialog');
  const planDialog = document.getElementById('planDialog');
  const fixed = document.getElementById('fixedCta');
  const fixedButton = fixed.querySelector('button');
  const fixedContext = document.getElementById('fixedCtaContext');
  const inlineButtons = [...document.querySelectorAll('.js-line:not([data-location="fixed"])')];
  const heroButton = document.querySelector('[data-location="hero"]');
  const message = document.getElementById('consultationMessage');
  const copyStatus = document.getElementById('copyStatus');
  const selectionNote = document.getElementById('selectionNote');
  const clearSelection = document.getElementById('clearSelection');
  const selectionLive = document.getElementById('selectionLive');
  const morePatternsToggle = document.getElementById('morePatternsToggle');
  const additionalPatterns = document.getElementById('additionalPatterns');
  const priceSelectionBox = document.getElementById('priceSelectionBox');
  const priceSelectionDetails = document.getElementById('priceSelectionDetails');
  const priceSelectionLink = document.getElementById('priceSelectionLink');
  const clearPriceSelection = document.getElementById('clearPriceSelection');
  const lineDialogMessage = document.getElementById('lineDialogMessage');
  const lineDialogStatus = document.getElementById('dialogStatus');
  const lineDialogOpen = document.getElementById('lineDialogOpen');
  const lineDialogCopy = document.getElementById('lineDialogCopy');
  let selectedPlan = '';
  let selectedSize = '';
  let selectedIntent = 'undecided';
  let selectedPain = '';
  let priceSelection = null;
  let viewedPlan = '';
  let framePending = false;

  function record(event, properties = {}) {
    if (typeof sharedState.record === 'function') {
      sharedState.record(event, properties);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...properties });
  }
  function officialLineUrl(value) {
    if (typeof sharedState.isAllowedLineUrl === 'function') return sharedState.isAllowedLineUrl(value);
    try {
      const url = new URL(value);
      const validHost = ['lin.ee', 'line.me'].includes(url.hostname) || (url.hostname === 'utage-system.com' && url.pathname.startsWith('/line/open/'));
      return url.protocol === 'https:' && validHost && !url.username && !url.password && !url.port ? url.href : '';
    } catch {
      return '';
    }
  }
  function officialLineId(value) {
    return typeof value === 'string' && /^@[a-z0-9._-]{3,50}$/i.test(value.trim()) ? value.trim() : '';
  }
  const lineUrl = officialLineUrl(config.lineUrl);
  const lineId = officialLineId(config.lineId);
  const liffId = typeof config.liffId === 'string' && /^[0-9]+-[a-z0-9]+$/i.test(config.liffId.trim()) ? config.liffId.trim() : '';
  const liffUrl = liffId ? 'https://liff.line.me/' + liffId : '';

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
    const visible = heroButton.getBoundingClientRect().bottom <= 0 && !inlineVisible && !dialogOpen;
    fixed.classList.toggle('visible', visible);
    fixed.setAttribute('aria-hidden', String(!visible));
    fixedButton.tabIndex = visible ? 0 : -1;
  }
  function queueFixed() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateFixed);
  }

  function consultationText() {
    const consultationId = typeof sharedState.getConsultationId === 'function' ? sharedState.getConsultationId() : '';
    const qualifiers = priceSelection?.qualifiers || {};
    const lines = [consultationId ? '相談番号：' + consultationId : '', intents[selectedIntent]];
    if (selectedPain) {
      lines.push('いま困っていること：' + pains[selectedPain].label);
      lines.push(pains[selectedPain].question);
    }
    if (priceSelection?.productName) {
      lines.push('価格診断の商品：' + priceSelection.productName);
      if (priceSelection.selections?.width) lines.push('幅：' + String(priceSelection.selections.width).replace(/^.+?:/, ''));
      if (priceSelection.selections?.depth) lines.push('奥行：' + String(priceSelection.selections.depth).replace(/^.+?:/, ''));
      if (priceSelection.selections?.height) {
        lines.push(priceSelection.selections.height === '__unknown__'
          ? '高さ：未定（窓・地面の高さを確認希望）'
          : '高さ：' + String(priceSelection.selections.height).replace(/^.+?:/, ''));
      }
      if (Number.isFinite(priceSelection.price)) lines.push('税込・商品本体参考価格：' + Number(priceSelection.price).toLocaleString('ja-JP') + '円');
      else if (Number.isFinite(priceSelection.priceMin) && Number.isFinite(priceSelection.priceMax)) {
        lines.push('税込・商品本体参考価格：' + Number(priceSelection.priceMin).toLocaleString('ja-JP') + '〜' + Number(priceSelection.priceMax).toLocaleString('ja-JP') + '円（高さ未定の範囲）');
      }
      if (qualifiers.city) lines.push('施工希望地域：' + qualifiers.city);
      if (qualifiers.purpose) lines.push('庭でしたいこと：' + qualifiers.purpose);
      if (qualifiers.existing) lines.push('既存デッキ：' + qualifiers.existing);
      if (qualifiers.ground) lines.push('設置場所の地面：' + qualifiers.ground);
      if (Array.isArray(qualifiers.extras) && qualifiers.extras.length) lines.push('一緒に相談したいもの：' + qualifiers.extras.join('、'));
    }
    if (selectedPlan) {
      lines.push('気になる形：LPの「' + plans[selectedPlan].title + '」');
      lines.push(plans[selectedPlan].idea);
    }
    if (selectedSize) {
      const example = sizeExamples[selectedSize];
      lines.push('広さの参考：' + example.label + '（' + example.size + '）');
      lines.push('寸法はまだ決めていません。');
    }
    if (!selectedPain) lines.push(questions[selectedIntent]);
    if (!qualifiers.city) lines.push('施工希望地域（市区町村）：［入力］');
    if (!selectedPlan && !selectedSize && !priceSelection?.productName) lines.push('商品やサイズはまだ決まっていません。');
    return lines.filter(Boolean).join('\n');
  }
  function saveSelection() {
    try {
      sessionStorage.setItem('wooddeckSelection', JSON.stringify({ plan: selectedPlan, size: selectedSize, intent: selectedIntent, pain: selectedPain }));
    } catch { /* Storage is optional. */ }
  }
  function renderSelection() {
    const references = [];
    if (selectedPain) references.push('悩み：' + pains[selectedPain].label);
    if (selectedPlan) references.push('形：' + plans[selectedPlan].title);
    if (selectedSize) references.push('広さ：' + sizeExamples[selectedSize].label + '（' + sizeExamples[selectedSize].size + '）');
    selectionNote.textContent = references.length ? '相談候補　' + references.join(' ／ ') : '';
    selectionNote.hidden = !references.length;
    clearSelection.hidden = !references.length;
    if (priceSelectionBox) {
      const hasExactPrice = Number.isFinite(priceSelection?.price);
      const hasPriceRange = Number.isFinite(priceSelection?.priceMin) && Number.isFinite(priceSelection?.priceMax);
      const hasPrice = Boolean(priceSelection?.productName && (hasExactPrice || hasPriceRange));
      priceSelectionBox.hidden = !hasPrice;
      if (hasPrice) {
        const dimensions = ['width', 'depth', 'height'].map(key => {
          const value = priceSelection.selections?.[key];
          if (!value) return '';
          return value === '__unknown__' ? '高さ未定' : String(value).replace(/^.+?:/, '');
        }).filter(Boolean).join(' × ');
        const priceLabel = hasExactPrice
          ? Number(priceSelection.price).toLocaleString('ja-JP') + '円（税込・商品本体参考価格）'
          : Number(priceSelection.priceMin).toLocaleString('ja-JP') + '〜' + Number(priceSelection.priceMax).toLocaleString('ja-JP') + '円（税込・高さ未定の範囲）';
        priceSelectionDetails.textContent = [priceSelection.productName, dimensions, priceLabel].filter(Boolean).join(' ／ ');
        const savedUrl = String(priceSelection.productUrl || '');
        priceSelectionLink.href = /^\/products\/wooddeck\/[a-z0-9-]+\/?(?:\?.*)?$/.test(savedUrl) ? savedUrl : 'wooddeck/';
      }
    }
    message.textContent = consultationText();
    fixedContext.textContent = references.length ? '選んだ内容をLINEへ引き継げます' : '市区町村と、庭でしたいことから';
    document.querySelectorAll('[data-select-plan]').forEach(button => {
      const active = button.dataset.selectPlan === selectedPlan;
      button.setAttribute('aria-pressed', String(active));
      button.querySelector('span').textContent = active ? '✓' : '＋';
      button.childNodes[0].textContent = active ? '相談候補に追加済み' : 'この形を相談候補に入れる';
    });
    document.querySelectorAll('[data-size]').forEach(button => {
      const active = button.dataset.size === selectedSize;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-pain]').forEach(button => {
      const active = button.dataset.pain === selectedPain;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    copyStatus.textContent = '';
    saveSelection();
    queueFixed();
  }
  function restoreSelection() {
    try {
      const state = JSON.parse(sessionStorage.getItem('wooddeckSelection') || '{}');
      if (plans[state.plan]) selectedPlan = state.plan;
      if (sizeExamples[state.size]) selectedSize = state.size;
      if (intents[state.intent]) selectedIntent = state.intent;
      if (pains[state.pain]) selectedPain = state.pain;
    } catch { /* Start from the default state. */ }
    try {
      const storedPrice = JSON.parse(sessionStorage.getItem('wooddeckPriceSelection') || 'null');
      if (storedPrice && typeof storedPrice === 'object') priceSelection = storedPrice;
    } catch { /* Price selection is optional. */ }
    const input = document.querySelector('[name="intent"][value="' + selectedIntent + '"]');
    if (input) input.checked = true;
  }

  async function copyConsultation(showStatus = true) {
    const text = consultationText();
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch { /* Fall through. */ }
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
    }
    if (showStatus) {
      copyStatus.textContent = copied
        ? 'コピーしました。LINEのトーク画面に貼り付けて送ってください。'
        : 'コピーできませんでした。表示された相談内容を選択してコピーしてください。';
    }
    if (copied) record('wooddeck_consultation_copy', { plan_id: selectedPlan || 'unselected', size_example: selectedSize || 'unselected', intent_id: selectedIntent });
    return copied;
  }

  window.addEventListener('scroll', queueFixed, { passive: true });
  window.addEventListener('resize', queueFixed);
  document.querySelectorAll('details').forEach(details => details.addEventListener('toggle', queueFixed));

  document.querySelectorAll('.js-line').forEach(button => {
    button.addEventListener('click', async () => {
      record(liffUrl || lineUrl || lineId ? 'wooddeck_line_click' : 'wooddeck_preview_cta_click', {
        cta_location: button.dataset.location,
        plan_id: selectedPlan || 'unselected',
        size_example: selectedSize || 'unselected',
        intent_id: selectedIntent
      });
      if (liffUrl) {
        window.location.assign(liffUrl);
      } else if (lineId) {
        window.location.assign('https://line.me/R/oaMessage/' + lineId + '/?' + encodeURIComponent(consultationText()));
      } else if (lineUrl) {
        const copied = await copyConsultation(false);
        lineDialogMessage.textContent = consultationText();
        lineDialogStatus.textContent = copied ? 'STEP 1　相談内容をコピーしました' : '相談内容を確認してください';
        lineDialogCopy.textContent = '相談内容をもう一度コピー';
        lineDialogOpen.href = lineUrl;
        lineDialog.showModal();
        lineDialogOpen.focus();
        updateFixed();
        record('wooddeck_line_handoff_view', { cta_location: button.dataset.location });
      } else {
        lineDialog.showModal();
        lineDialogOpen.focus();
        updateFixed();
      }
    });
  });

  lineDialogOpen?.addEventListener('click', () => record('wooddeck_line_open', { source: 'handoff_dialog' }));
  lineDialogCopy?.addEventListener('click', async () => {
    const copied = await copyConsultation(false);
    lineDialogCopy.textContent = copied ? 'コピーしました' : 'コピーできませんでした';
  });
  clearPriceSelection?.addEventListener('click', () => {
    try { sessionStorage.removeItem('wooddeckPriceSelection'); } catch { /* Storage is optional. */ }
    priceSelection = null;
    renderSelection();
    record('wooddeck_price_selection_clear');
  });

  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  [lineDialog, planDialog].forEach(dialog => {
    dialog.addEventListener('close', queueFixed);
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
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
      planDialog.querySelector('.plan-close-icon').focus();
      updateFixed();
      record('wooddeck_plan_view', { plan_id: viewedPlan });
    });
  });
  function selectPlan(id) {
    if (!plans[id]) return;
    selectedPlan = selectedPlan === id ? '' : id;
    renderSelection();
    selectionLive.textContent = selectedPlan ? '「' + plans[selectedPlan].title + '」を相談候補に追加しました。' : '相談候補から形を外しました。';
    record('wooddeck_plan_select', { plan_id: selectedPlan || 'unselected' });
  }
  document.querySelectorAll('[data-select-plan]').forEach(button => button.addEventListener('click', () => selectPlan(button.dataset.selectPlan)));
  document.getElementById('usePlan').addEventListener('click', () => {
    if (!plans[viewedPlan]) return;
    if (selectedPlan !== viewedPlan) selectPlan(viewedPlan);
    planDialog.close();
  });

  const sizeTabs = [...document.querySelectorAll('[data-size-tab]')];
  sizeTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const size = tab.dataset.sizeTab;
      sizeTabs.forEach(item => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      document.querySelectorAll('[data-size-card]').forEach(card => { card.hidden = card.dataset.sizeCard !== size; });
      record('wooddeck_size_tab', { size_example: size });
      queueFixed();
    });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? sizeTabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + sizeTabs.length) % sizeTabs.length;
      sizeTabs[nextIndex].click();
      sizeTabs[nextIndex].focus();
    });
  });
  document.querySelectorAll('[data-size]').forEach(button => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const size = button.dataset.size;
      if (!sizeExamples[size]) return;
      selectedSize = selectedSize === size ? '' : size;
      renderSelection();
      selectionLive.textContent = selectedSize ? '「' + sizeExamples[selectedSize].label + '」を広さの参考に追加しました。' : '相談候補から広さを外しました。';
      record('wooddeck_size_select', { size_example: selectedSize || 'unselected' });
    });
  });
  document.querySelectorAll('[name="intent"]').forEach(input => {
    input.addEventListener('change', () => {
      if (!intents[input.value]) return;
      selectedIntent = input.value;
      renderSelection();
      record('wooddeck_intent_select', { intent_id: selectedIntent });
    });
  });
  document.querySelectorAll('[data-pain]').forEach(button => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const pain = button.dataset.pain;
      if (!pains[pain]) return;
      selectedPain = selectedPain === pain ? '' : pain;
      renderSelection();
      selectionLive.textContent = selectedPain
        ? '「' + pains[selectedPain].label + '」を相談内容に追加しました。'
        : '相談内容から悩みを外しました。';
      record('wooddeck_pain_select', { pain_id: selectedPain || 'unselected' });
    });
  });
  clearSelection.addEventListener('click', () => {
    selectedPlan = '';
    selectedSize = '';
    selectedPain = '';
    renderSelection();
    selectionLive.textContent = '選択した悩み・形・広さを外しました。';
  });
  document.querySelector('[data-copy]').addEventListener('click', () => copyConsultation());

  document.querySelectorAll('.consult-model-list, .portfolio-list').forEach(scroller => {
    scroller.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      scroller.scrollBy({ left: direction * scroller.clientWidth * 0.86, behavior: 'smooth' });
    });
  });

  morePatternsToggle.addEventListener('click', () => {
    const expanded = morePatternsToggle.getAttribute('aria-expanded') === 'true';
    morePatternsToggle.setAttribute('aria-expanded', String(!expanded));
    morePatternsToggle.childNodes[0].textContent = expanded ? 'ほかの3つの形を見る' : '追加の3案を閉じる';
    morePatternsToggle.querySelector('span').textContent = expanded ? '＋' : '−';
    additionalPatterns.hidden = expanded;
    record('wooddeck_more_patterns', { expanded: !expanded });
    queueFixed();
  });

  restoreSelection();
  renderSelection();
  updateFixed();
})();
