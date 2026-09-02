(() => {
  'use strict';

  const REQUEST_TIMEOUT_MS = 35000;
  const MAX_SITE_CHARACTERS = 750000;
  const MAX_DISCOVERED_LINKS = 250;

  const panel = document.getElementById('siteCrawlPanel');
  const form = document.getElementById('siteCrawlForm');
  const urlInput = document.getElementById('siteCrawlInput');
  const limitInput = document.getElementById('siteCrawlLimit');
  const crawlButton = document.getElementById('crawlSiteBtn');
  const statusBox = document.getElementById('siteCrawlStatus');
  const resultsBox = document.getElementById('siteCrawlResults');
  const pageList = document.getElementById('siteCrawlPages');
  const textInput = document.getElementById('textInput');
  const clearButton = document.getElementById('clearBtn');

  if (!panel || !form || !urlInput || !limitInput || !crawlButton || !statusBox || !resultsBox || !pageList || !textInput || !window.DetectorWebReader) return;

  function setStatus(message, state = '') {
    statusBox.textContent = message;
    statusBox.classList.remove('is-loading', 'is-success', 'is-error');
    if (state) statusBox.classList.add(`is-${state}`);
  }

  function selectedLimit() {
    const value = Number.parseInt(limitInput.value, 10);
    return [5, 10, 20].includes(value) ? value : 10;
  }

  function clearResults() {
    pageList.replaceChildren();
    resultsBox.hidden = true;
  }

  function resetSiteState(options = {}) {
    if (!options.keepInput) urlInput.value = '';
    delete textInput.dataset.siteOrigin;
    delete textInput.dataset.sitePages;
    panel.classList.remove('has-site');
    clearResults();
    setStatus('');
  }

  function renderPages(pages) {
    pageList.replaceChildren();
    for (const page of pages || []) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = page.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = page.title || page.url;
      const detail = document.createElement('span');
      detail.textContent = `${Number(page.words || 0).toLocaleString()} ${Number(page.words || 0) === 1 ? 'word' : 'words'}`;
      item.append(link, detail);
      pageList.append(item);
    }
    resultsBox.hidden = !(pages && pages.length);
  }

  function sameSite(url, origin) {
    try { return new URL(url).origin === origin; } catch { return false; }
  }

  function appendPage(aggregate, page, number) {
    const header = `PAGE ${number}: ${page.title || page.url}\nSOURCE: ${page.url}\n\n`;
    const separator = aggregate.text ? '\n\n' : '';
    const addition = `${separator}${header}${page.text}`;
    if (aggregate.text.length + addition.length > MAX_SITE_CHARACTERS) return false;

    const start = aggregate.text.length + separator.length + header.length;
    aggregate.text += addition;
    const end = aggregate.text.length;
    aggregate.pages.push({
      number,
      title: page.title || '',
      url: page.url,
      words: page.words || window.DetectorWebReader.wordCount(page.text),
      start,
      end
    });
    aggregate.words += page.words || window.DetectorWebReader.wordCount(page.text);
    return true;
  }

  async function crawlSite() {
    let startUrl;
    try {
      startUrl = window.DetectorWebReader.normalizePublicUrl(urlInput.value);
    } catch (error) {
      setStatus(error.message, 'error');
      return;
    }

    const origin = new URL(startUrl).origin;
    const maxPages = selectedLimit();
    crawlButton.disabled = true;
    urlInput.disabled = true;
    limitInput.disabled = true;
    panel.classList.add('has-site');
    clearResults();
    setStatus(`Scanning up to ${maxPages} same-site public pages…`, 'loading');

    const controller = new AbortController();
    const queue = [startUrl];
    const queued = new Set([startUrl]);
    const visited = new Set();
    const aggregate = { text: '', pages: [], words: 0 };
    const warnings = [];

    try {
      while (queue.length && aggregate.pages.length < maxPages) {
        const current = queue.shift();
        if (!current || visited.has(current)) continue;
        visited.add(current);
        setStatus(`Scanning page ${aggregate.pages.length + 1} of up to ${maxPages}…`, 'loading');

        let page;
        try {
          page = await window.DetectorWebReader.readPage(current, { signal: controller.signal, timeoutMs: REQUEST_TIMEOUT_MS });
        } catch (error) {
          if (error && error.name === 'AbortError') throw error;
          if (error && error.code === 'RATE_LIMIT') {
            warnings.push('The web-reader rate limit stopped the crawl before the requested page limit.');
            break;
          }
          if (!aggregate.pages.length && current === startUrl) throw error;
          warnings.push(`Skipped an unreadable page: ${current}`);
          continue;
        }

        const pageUrl = window.DetectorWebReader.canonicalizeForCrawl(page.url || current, current) || current;
        if (!sameSite(pageUrl, origin)) continue;
        page.url = pageUrl;

        if (!appendPage(aggregate, page, aggregate.pages.length + 1)) {
          warnings.push('The crawl stopped at the app’s 750,000-character safety limit.');
          break;
        }
        if (page.warning) warnings.push(page.warning);

        for (const link of page.links || []) {
          if (queue.length + visited.size >= MAX_DISCOVERED_LINKS) break;
          const normalized = window.DetectorWebReader.canonicalizeForCrawl(link, pageUrl);
          if (!normalized || !sameSite(normalized, origin) || visited.has(normalized) || queued.has(normalized)) continue;
          queued.add(normalized);
          queue.push(normalized);
        }
      }

      if (!aggregate.text.trim()) throw new Error('No readable website text was returned.');

      textInput.value = aggregate.text;
      textInput.dataset.siteOrigin = origin;
      textInput.dataset.sitePages = String(aggregate.pages.length);
      if (typeof window.detectorSetSourceContext === 'function') {
        window.detectorSetSourceContext({
          type: 'site',
          label: origin,
          detail: `${aggregate.pages.length} pages included`,
          url: origin,
          locationMode: 'page',
          segments: aggregate.pages.map(page => ({
            label: page.title || page.url || `Page ${page.number}`,
            detail: page.url || '',
            url: page.url || '',
            start: page.start,
            end: page.end,
            page: page.number
          }))
        });
      }
      urlInput.value = origin;
      renderPages(aggregate.pages);
      const warningText = [...new Set(warnings)].slice(0, 3).join(' ');
      setStatus(`Loaded ${aggregate.pages.length.toLocaleString()} ${aggregate.pages.length === 1 ? 'page' : 'pages'} · ${aggregate.words.toLocaleString()} ${aggregate.words === 1 ? 'word' : 'words'}. Select Analyze to scan the collected text.${warningText ? ` ${warningText}` : ''}`, 'success');
      textInput.dispatchEvent(new Event('input', { bubbles: true }));
      document.dispatchEvent(new CustomEvent('detector:source-loaded', { detail: { source: 'site' } }));
    } catch (error) {
      panel.classList.remove('has-site');
      clearResults();
      setStatus(error && error.message ? error.message : 'The website could not be crawled.', 'error');
    } finally {
      crawlButton.disabled = false;
      urlInput.disabled = false;
      limitInput.disabled = false;
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    crawlSite();
  });

  document.addEventListener('detector:source-loaded', event => {
    if (!event.detail || event.detail.source !== 'site') resetSiteState();
  });

  textInput.addEventListener('input', event => {
    if (event.isTrusted && textInput.dataset.siteOrigin) resetSiteState({ keepInput: true });
  });

  if (clearButton) clearButton.addEventListener('click', resetSiteState);
})();
