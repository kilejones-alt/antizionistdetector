(() => {
  'use strict';

  const REQUEST_TIMEOUT_MS = 32000;
  const panel = document.getElementById('urlScanPanel');
  const form = document.getElementById('urlScanForm');
  const urlInput = document.getElementById('urlInput');
  const loadButton = document.getElementById('loadUrlBtn');
  const statusBox = document.getElementById('urlStatus');
  const textInput = document.getElementById('textInput');
  const clearButton = document.getElementById('clearBtn');

  if (!panel || !form || !urlInput || !loadButton || !statusBox || !textInput || !window.DetectorWebReader) return;

  function setStatus(message, state = '') {
    statusBox.textContent = message;
    statusBox.classList.remove('is-loading', 'is-success', 'is-error');
    if (state) statusBox.classList.add(`is-${state}`);
  }

  function resetUrlState(options = {}) {
    if (!options.keepInput) urlInput.value = '';
    delete textInput.dataset.pageUrl;
    delete textInput.dataset.pageTitle;
    panel.classList.remove('has-url');
    setStatus('');
  }

  async function loadUrl() {
    let pageUrl;
    try {
      pageUrl = window.DetectorWebReader.normalizePublicUrl(urlInput.value);
    } catch (error) {
      setStatus(error.message, 'error');
      return;
    }

    loadButton.disabled = true;
    urlInput.disabled = true;
    panel.classList.add('has-url');
    setStatus('Retrieving public page text…', 'loading');

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const data = await window.DetectorWebReader.readPage(pageUrl, { signal: controller.signal, timeoutMs: REQUEST_TIMEOUT_MS });
      textInput.value = data.text;
      textInput.dataset.pageUrl = data.url || pageUrl;
      textInput.dataset.pageTitle = data.title || '';
      if (typeof window.detectorSetSourceContext === 'function') {
        window.detectorSetSourceContext({
          type: 'url',
          label: data.title || data.url || pageUrl,
          detail: data.title ? (data.url || pageUrl) : '',
          url: data.url || pageUrl,
          locationMode: 'line',
          segments: [{
            label: data.title || 'Web page',
            detail: data.url || pageUrl,
            url: data.url || pageUrl,
            start: 0,
            end: data.text.length
          }]
        });
      }
      urlInput.value = data.url || pageUrl;
      const words = Number.isFinite(data.words) ? data.words : window.DetectorWebReader.wordCount(data.text);
      const title = data.title ? `“${data.title}” · ` : '';
      const warning = data.warning ? ` ${data.warning}` : '';
      setStatus(`Loaded ${title}${words.toLocaleString()} ${words === 1 ? 'word' : 'words'}. Select Analyze to scan this page.${warning}`, 'success');
      textInput.dispatchEvent(new Event('input', { bubbles: true }));
      document.dispatchEvent(new CustomEvent('detector:source-loaded', { detail: { source: 'url' } }));
    } catch (error) {
      panel.classList.remove('has-url');
      setStatus(error && error.message ? error.message : 'The web page could not be loaded.', 'error');
    } finally {
      window.clearTimeout(timer);
      loadButton.disabled = false;
      urlInput.disabled = false;
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    loadUrl();
  });

  document.addEventListener('detector:source-loaded', event => {
    if (!event.detail || event.detail.source !== 'url') resetUrlState();
  });

  textInput.addEventListener('input', event => {
    if (event.isTrusted && textInput.dataset.pageUrl) resetUrlState({ keepInput: true });
  });

  if (clearButton) clearButton.addEventListener('click', () => resetUrlState());
})();
