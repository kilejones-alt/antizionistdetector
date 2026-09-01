(() => {
  'use strict';

  const DEFAULT_READER_BASE = 'https://r.jina.ai/';
  const MAX_URL_LENGTH = 2048;
  const PAGE_TIMEOUT_MS = 30000;
  const BLOCKED_HOST_PATTERNS = [
    /^localhost$/i,
    /\.localhost$/i,
    /\.local$/i,
    /^0\.0\.0\.0$/,
    /^127\./,
    /^10\./,
    /^169\.254\./,
    /^192\.168\./,
    /^172\.(?:1[6-9]|2\d|3[01])\./,
    /^\[?::1\]?$/i,
    /^fc[0-9a-f]{2}:/i,
    /^fd[0-9a-f]{2}:/i,
    /^fe80:/i
  ];
  const NON_PAGE_EXTENSIONS = /\.(?:7z|avi|avif|bmp|css|csv|doc|docx|epub|gif|gz|ico|jpeg|jpg|js|json|m4a|m4v|mov|mp3|mp4|mpeg|mpg|odp|ods|odt|pdf|png|ppt|pptx|rar|rss|svg|tar|tgz|tif|tiff|tsv|txt|wav|webm|webp|woff2?|xls|xlsx|xml|zip)(?:$|[?#])/i;

  function configuredReaderBase() {
    const configured = window.DETECTOR_CONFIG && window.DETECTOR_CONFIG.webReaderBase;
    const base = String(configured || DEFAULT_READER_BASE).trim();
    return base.endsWith('/') ? base : `${base}/`;
  }

  function normalizePublicUrl(value) {
    let raw = String(value || '').trim();
    if (!raw) throw new Error('Enter a public web-page URL.');
    if (raw.length > MAX_URL_LENGTH) throw new Error('The URL is too long.');
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;

    let parsed;
    try { parsed = new URL(raw); } catch { throw new Error('Enter a valid public web-page URL.'); }
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only HTTP and HTTPS web pages can be scanned.');
    if (!parsed.hostname) throw new Error('Enter a valid public web-page URL.');
    if (BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(parsed.hostname))) {
      throw new Error('Private, local-network, and localhost addresses cannot be scanned.');
    }

    parsed.username = '';
    parsed.password = '';
    return parsed.href;
  }

  function canonicalizeForCrawl(value, baseUrl) {
    let parsed;
    try { parsed = new URL(value, baseUrl); } catch { return null; }
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(parsed.hostname))) return null;
    if (NON_PAGE_EXTENSIONS.test(parsed.pathname)) return null;
    parsed.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'fbclid', 'mc_cid', 'mc_eid'].forEach(key => parsed.searchParams.delete(key));
    return parsed.href;
  }

  function extractMarkdownLinks(markdown, baseUrl) {
    const source = String(markdown || '');
    const found = [];
    const seen = new Set();
    const patterns = [
      /\[[^\]]{0,500}\]\((https?:\/\/[^\s)<>]+|\/[^\s)<>]+|\.\.?\/[^\s)<>]+)\)/gi,
      /(?:^|[\s<(])((?:https?:\/\/)[^\s<>"')\]]+)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source)) !== null) {
        const raw = match[1];
        const url = canonicalizeForCrawl(raw, baseUrl);
        if (!url || seen.has(url)) continue;
        seen.add(url);
        found.push(url);
      }
    }
    return found;
  }

  function wordCount(text) {
    const matches = String(text || '').trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  async function readPage(value, options = {}) {
    const targetUrl = normalizePublicUrl(value);
    const controller = new AbortController();
    const parentSignal = options.signal || null;
    const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : PAGE_TIMEOUT_MS;
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const abortFromParent = () => controller.abort();
    if (parentSignal) {
      if (parentSignal.aborted) controller.abort();
      else parentSignal.addEventListener('abort', abortFromParent, { once: true });
    }

    const endpoint = `${configuredReaderBase()}${targetUrl}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      });

      if (response.status === 429) {
        const error = new Error('The public web reader rate limit was reached. Try a smaller crawl or retry later.');
        error.code = 'RATE_LIMIT';
        throw error;
      }
      if (!response.ok) throw new Error(`The public page could not be retrieved (HTTP ${response.status}).`);

      let payload;
      try { payload = await response.json(); } catch { throw new Error('The public web reader returned an unreadable response.'); }
      const data = payload && payload.data ? payload.data : payload;
      if (!data || typeof data !== 'object') throw new Error('The public web reader returned no page data.');

      const content = String(data.content || '').trim();
      const warning = String(data.warning || '').trim();
      if (!content || content === 'Unknown.') {
        throw new Error(warning || 'No readable text was returned for this page.');
      }

      let finalUrl = targetUrl;
      try { finalUrl = normalizePublicUrl(data.url || targetUrl); } catch { /* keep requested URL */ }
      const title = String(data.title || '').trim();
      const links = [];
      const linkSeen = new Set();

      if (data.links && typeof data.links === 'object') {
        Object.values(data.links).forEach(link => {
          const normalized = canonicalizeForCrawl(String(link || ''), finalUrl);
          if (normalized && !linkSeen.has(normalized)) {
            linkSeen.add(normalized);
            links.push(normalized);
          }
        });
      }
      extractMarkdownLinks(content, finalUrl).forEach(link => {
        if (!linkSeen.has(link)) {
          linkSeen.add(link);
          links.push(link);
        }
      });

      return {
        url: finalUrl,
        title,
        text: content,
        words: wordCount(content),
        links,
        warning
      };
    } catch (error) {
      if (error && error.name === 'AbortError') {
        const timeoutError = new Error('The public page retrieval timed out.');
        timeoutError.name = 'AbortError';
        throw timeoutError;
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
      if (parentSignal) parentSignal.removeEventListener('abort', abortFromParent);
    }
  }

  window.DetectorWebReader = Object.freeze({
    readPage,
    normalizePublicUrl,
    canonicalizeForCrawl,
    wordCount,
    providerName: 'Jina Reader'
  });
})();
