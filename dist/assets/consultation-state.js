(() => {
  'use strict';

  const ID_KEY = 'wooddeckConsultationId';
  const ATTRIBUTION_KEY = 'wooddeckAttribution';
  const ATTRIBUTION_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function readJson(key, fallback = null, storage = sessionStorage) {
    try {
      const value = JSON.parse(storage.getItem(key) || 'null');
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value, storage = sessionStorage) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function clean(value, max = 100) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
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

  window.WOODDECK_STATE = Object.freeze({ readJson, writeJson, clean, getConsultationId, captureAttribution, context, record, isAllowedLineUrl });
  captureAttribution();
})();
