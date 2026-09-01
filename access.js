(() => {
  'use strict';

  const STORAGE_KEY = 'az_detector_static_access_v176';
  const ATTEMPT_KEY = 'az_detector_static_code_attempts_v176';
  const CODE_SALT = 'AZD-GITHUB-v176::KJ::';
  const CODE_DIGEST = '64e8fa01b193539f2f66d0ccb7d74716afc9728bbe53b37cb081db586aa9f4f9';
  const DEFAULT_LIMIT = 3;
  const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
  const MAX_ATTEMPTS = 5;

  const state = {
    authorized: false,
    accessType: 'trial',
    trialRemaining: DEFAULT_LIMIT,
    statusKnown: true,
    busy: false
  };

  const byId = id => document.getElementById(id);
  const limit = () => Number(window.DETECTOR_CONFIG?.trialLimit || DEFAULT_LIMIT);

  function safeParse(value, fallback) {
    if (typeof value !== 'string' || !value.trim()) return fallback;
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function readStored() {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY), {});
    const used = Math.max(0, Math.min(limit(), Number(saved.used || 0)));
    state.authorized = Boolean(saved.authorized);
    state.accessType = state.authorized ? String(saved.accessType || 'private-code') : 'trial';
    state.trialRemaining = state.authorized ? limit() : Math.max(0, limit() - used);
  }

  function writeStored() {
    const used = state.authorized ? 0 : Math.max(0, limit() - Number(state.trialRemaining || 0));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      authorized: state.authorized,
      accessType: state.accessType,
      used,
      updatedAt: new Date().toISOString()
    }));
  }

  function setMessage(message, kind = '') {
    const box = byId('accessMessage');
    if (!box) return;
    box.textContent = message || '';
    box.classList.remove('is-error', 'is-success', 'is-loading');
    if (kind) box.classList.add(`is-${kind}`);
  }

  function meterText() {
    if (state.authorized) return state.accessType === 'private-code' ? 'Private unlimited access' : 'Unlimited analyses';
    if (state.trialRemaining <= 0) return '3 free analyses used · purchase required';
    return `${state.trialRemaining} free ${state.trialRemaining === 1 ? 'analysis' : 'analyses'} remaining`;
  }

  function render() {
    const meter = byId('searchMeter');
    if (meter) {
      meter.textContent = meterText();
      meter.classList.toggle('paid-unlocked', state.authorized);
      meter.classList.toggle('limit-reached', !state.authorized && state.trialRemaining <= 0);
    }
    const purchase = byId('purchaseAppBtn');
    if (purchase) {
      purchase.textContent = state.authorized ? 'App unlocked' : 'Purchase app now';
      purchase.disabled = state.authorized || state.busy;
    }
    const panel = byId('purchaseAccessPanel');
    if (panel) panel.classList.toggle('is-unlocked', state.authorized);
    const install = byId('installBtn');
    if (install) install.classList.toggle('hidden', !state.authorized);
    document.body.classList.toggle('free-limit-reached', !state.authorized && state.trialRemaining <= 0);
    document.dispatchEvent(new CustomEvent('detector:access-updated', { detail: { ...state } }));
  }

  function apply(data = {}) {
    if (typeof data.authorized === 'boolean') state.authorized = data.authorized;
    if (data.accessType) state.accessType = data.accessType;
    if (Number.isFinite(Number(data.trialRemaining))) state.trialRemaining = Number(data.trialRemaining);
    state.statusKnown = true;
    writeStored();
    render();
  }

  async function refresh() {
    readStored();
    render();
    return { ...state };
  }

  async function analyze(text) {
    const source = String(text || '').trim();
    if (!source) throw new Error('Paste or load text before analyzing.');
    if (!state.authorized && state.trialRemaining <= 0) {
      showPurchaseRequired('Three free analyses have been used. Purchase the downloadable app for unlimited use.');
      const error = new Error('Purchase required.');
      error.code = 'PURCHASE_REQUIRED';
      throw error;
    }
    if (typeof window.detectorAnalyzeText !== 'function') {
      throw new Error('The local detector engine did not load. Refresh the page and try again.');
    }
    const result = window.detectorAnalyzeText(source);
    if (!result) throw new Error('The detector could not complete this analysis.');
    if (!state.authorized) {
      state.trialRemaining = Math.max(0, state.trialRemaining - 1);
      writeStored();
      render();
    }
    return result;
  }

  function showPurchaseRequired(message) {
    setMessage(message || 'Three free analyses have been used. Purchase the app for unlimited use.', 'error');
    const panel = byId('purchaseAccessPanel');
    if (panel) {
      panel.classList.add('requires-purchase');
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.body.classList.add('free-limit-reached');
  }

  function purchase() {
    const url = String(window.DETECTOR_CONFIG?.purchaseUrl || '').trim();
    if (!url) {
      setMessage('The purchase link has not been configured.', 'error');
      return;
    }
    setMessage('Opening Stripe checkout…', 'loading');
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.assign(url);
    window.setTimeout(() => setMessage('Stripe checkout opened in a new tab.', 'success'), 350);
  }

  function openCode() {
    const dialog = byId('accessCodeDialog');
    const input = byId('accessCodeInput');
    const status = byId('accessCodeStatus');
    if (status) status.textContent = '';
    if (input) input.value = '';
    if (dialog?.showModal) dialog.showModal();
    else dialog?.classList.remove('hidden');
    window.setTimeout(() => input?.focus(), 20);
  }

  function closeCode() {
    const dialog = byId('accessCodeDialog');
    if (dialog?.close) dialog.close();
    else dialog?.classList.add('hidden');
  }

  async function sha256Hex(value) {
    if (!window.crypto?.subtle) throw new Error('Secure code checking is unavailable in this browser.');
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function attemptState() {
    const now = Date.now();
    const saved = safeParse(localStorage.getItem(ATTEMPT_KEY), { start: now, count: 0 });
    if (!saved.start || now - Number(saved.start) > ATTEMPT_WINDOW_MS) return { start: now, count: 0 };
    return { start: Number(saved.start), count: Math.max(0, Number(saved.count || 0)) };
  }

  function recordAttempt(success) {
    if (success) {
      localStorage.removeItem(ATTEMPT_KEY);
      return;
    }
    const current = attemptState();
    current.count += 1;
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(current));
  }

  async function redeem(event) {
    event?.preventDefault();
    const input = byId('accessCodeInput');
    const submit = byId('redeemAccessCodeBtn');
    const status = byId('accessCodeStatus');
    const code = String(input?.value || '').trim();
    if (!/^\d{4}$/.test(code)) {
      if (status) status.textContent = 'Enter the four-digit code.';
      return;
    }
    const attempts = attemptState();
    if (attempts.count >= MAX_ATTEMPTS) {
      const minutes = Math.max(1, Math.ceil((ATTEMPT_WINDOW_MS - (Date.now() - attempts.start)) / 60000));
      if (status) status.textContent = `Too many attempts. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
      return;
    }
    if (submit) submit.disabled = true;
    if (status) status.textContent = 'Checking code…';
    try {
      const digest = await sha256Hex(CODE_SALT + code);
      const accepted = digest === CODE_DIGEST;
      recordAttempt(accepted);
      if (!accepted) throw new Error('Access code not accepted.');
      state.authorized = true;
      state.accessType = 'private-code';
      state.trialRemaining = limit();
      writeStored();
      render();
      if (status) status.textContent = 'Unlimited access unlocked on this browser.';
      setMessage('Private unlimited access unlocked on this browser.', 'success');
      window.setTimeout(closeCode, 650);
    } catch (error) {
      if (status) status.textContent = error.message || 'Access code not accepted.';
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  function init() {
    byId('purchaseAppBtn')?.addEventListener('click', purchase);
    byId('accessCodeLink')?.addEventListener('click', openCode);
    byId('accessCodeClose')?.addEventListener('click', closeCode);
    byId('accessCodeForm')?.addEventListener('submit', redeem);
    refresh();
  }

  window.DetectorAccess = Object.freeze({ state, refresh, analyze, apply, renderMeter: render, showPurchaseRequired, purchase, openCode });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
