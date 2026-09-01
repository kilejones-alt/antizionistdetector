(() => {
  'use strict';

  const panel = document.getElementById('reportExportPanel');
  const printButton = document.getElementById('printReportBtn');
  const htmlButton = document.getElementById('downloadHtmlReportBtn');
  const textButton = document.getElementById('downloadTextReportBtn');
  const jsonButton = document.getElementById('downloadJsonReportBtn');
  const textInput = document.getElementById('textInput');
  const pageList = document.getElementById('siteCrawlPages');
  const clearButton = document.getElementById('clearBtn');

  if (!panel || !printButton || !htmlButton || !textButton || !jsonButton || !textInput) return;

  let currentSource = 'text';

  function elementText(id) {
    const element = document.getElementById(id);
    return element ? String(element.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function wordCount(value) {
    const matches = String(value || '').trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeFilePart(value) {
    return String(value || 'analysis')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70)
      .toLowerCase() || 'analysis';
  }

  function timestampForFile() {
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  }

  function crawlPages() {
    if (!pageList) return [];
    return Array.from(pageList.querySelectorAll('li')).map(item => {
      const link = item.querySelector('a');
      const detail = item.querySelector('span');
      return {
        title: link ? String(link.textContent || '').trim() : '',
        url: link ? String(link.href || '').trim() : '',
        detail: detail ? String(detail.textContent || '').trim() : ''
      };
    }).filter(page => page.title || page.url);
  }

  function sourceMetadata() {
    const dataset = textInput.dataset || {};
    if (dataset.documentName) {
      return {
        type: 'Document',
        label: dataset.documentName,
        detail: dataset.documentType || 'Document',
        url: '',
        pages: []
      };
    }
    if (dataset.pageUrl) {
      return {
        type: 'Web page',
        label: dataset.pageTitle || dataset.pageUrl,
        detail: dataset.pageTitle ? dataset.pageUrl : '',
        url: dataset.pageUrl,
        pages: []
      };
    }
    if (dataset.siteOrigin) {
      const pages = crawlPages();
      return {
        type: 'Website crawl',
        label: dataset.siteOrigin,
        detail: `${dataset.sitePages || pages.length || 0} pages included`,
        url: dataset.siteOrigin,
        pages
      };
    }
    if (currentSource === 'example') {
      return { type: 'Sample text', label: 'Detector sample', detail: '', url: '', pages: [] };
    }
    return { type: 'Pasted text', label: 'Text entered in the detector', detail: '', url: '', pages: [] };
  }

  function matchedEvidence(analysis) {
    const rows = Array.isArray(analysis && analysis.matched_sentences) ? analysis.matched_sentences : [];
    const cap = 250;
    const items = rows.slice(0, cap).map(row => ({
      sentence: String(row && row.sentence || '').trim(),
      result: String(row && row.result || row && row.base_severity || '').trim(),
      stance: String(row && row.stance || row && row.who_says_it || '').trim(),
      triggers: Array.isArray(row && row.triggers) ? row.triggers : [],
      categories: Array.isArray(row && row.categories) ? row.categories : [],
      matched_text: Array.isArray(row && row.matched_text) ? row.matched_text : [],
      source_location: row && row.source_location && typeof row.source_location === 'object' ? row.source_location : null
    })).filter(row => row.sentence || row.triggers.length || row.categories.length);
    return { items, omitted: Math.max(0, rows.length - items.length), total: rows.length };
  }

  function buildModel() {
    const analysis = window.lastAnalysis || null;
    if (!analysis) throw new Error('Run an analysis before exporting a report.');
    const source = sourceMetadata();
    const inputText = String(analysis.input_text || textInput.value || '');
    const evidence = matchedEvidence(analysis);
    return {
      report_version: '173',
      generated_at: new Date().toISOString(),
      generated_display: new Date().toLocaleString(),
      source,
      input: {
        characters: inputText.length,
        words: wordCount(inputText)
      },
      result: {
        badge: elementText('severityBadge'),
        found_in_text: elementText('topSummary'),
        meaning: elementText('meaningBox'),
        why_it_matters: elementText('resultReason'),
        who_said_it: elementText('whoSaidBox'),
        source_context: elementText('sourceContextBox'),
        wider_language_pattern: elementText('discoursePatternBox'),
        type_of_language: elementText('categories'),
        attribution: elementText('stanceDetected'),
        more_detail: elementText('evidenceWhy'),
        bottom_line: elementText('ordinary')
      },
      evidence,
      analysis
    };
  }

  function reportFileBase(model) {
    return `antizionism-detector-report_${safeFilePart(model.source.label)}_${timestampForFile()}`;
  }

  function evidenceHtml(model) {
    const items = model.evidence.items;
    if (!items.length) return '<p class="muted">No matched evidence rows were produced.</p>';
    const rows = items.map((item, index) => {
      const details = [];
      if (item.result) details.push(`<span><strong>Result:</strong> ${escapeHtml(item.result)}</span>`);
      if (item.stance) details.push(`<span><strong>Context:</strong> ${escapeHtml(item.stance)}</span>`);
      if (item.triggers.length) details.push(`<span><strong>Matched wording:</strong> ${escapeHtml(item.triggers.join('; '))}</span>`);
      if (item.categories.length) details.push(`<span><strong>Type:</strong> ${escapeHtml(item.categories.join('; '))}</span>`);
      if (item.source_location && item.source_location.label) {
        const locationText = [item.source_location.label, item.source_location.detail].filter(Boolean).join(' · ');
        const locationValue = item.source_location.url
          ? `<a href="${escapeHtml(item.source_location.url)}">${escapeHtml(locationText)}</a>`
          : escapeHtml(locationText);
        details.push(`<span><strong>Source location:</strong> ${locationValue}</span>`);
      }
      return `<li><div class="evidence-number">${index + 1}</div><div><blockquote>${escapeHtml(item.sentence || '—')}</blockquote>${details.length ? `<div class="evidence-meta">${details.join('')}</div>` : ''}</div></li>`;
    }).join('');
    const omitted = model.evidence.omitted ? `<p class="muted">${model.evidence.omitted.toLocaleString()} additional evidence rows are retained in the JSON export.</p>` : '';
    return `<ol class="evidence-list">${rows}</ol>${omitted}`;
  }

  function pagesHtml(model) {
    if (!model.source.pages.length) return '';
    const rows = model.source.pages.map(page => `<li><a href="${escapeHtml(page.url)}">${escapeHtml(page.title || page.url)}</a>${page.detail ? `<span>${escapeHtml(page.detail)}</span>` : ''}</li>`).join('');
    return `<section><h2>Website pages included</h2><ol class="pages-list">${rows}</ol></section>`;
  }

  function buildHtml(model, autoPrint = false) {
    const sourceUrl = model.source.url ? `<a href="${escapeHtml(model.source.url)}">${escapeHtml(model.source.url)}</a>` : '';
    const sourceDetail = [model.source.detail, sourceUrl].filter(Boolean).join(' · ');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Antizionism Detector — Analysis Report</title>
<style>
:root{color-scheme:light;--ink:#171512;--muted:#6d675e;--paper:#f6f0e5;--line:#cfc4b4;--accent:#8b1e24;--soft:#ece3d5}*{box-sizing:border-box}body{margin:0;background:#d8d0c4;color:var(--ink);font-family:Georgia,'Times New Roman',serif;line-height:1.5}.page{max-width:920px;margin:32px auto;background:var(--paper);padding:56px 64px;box-shadow:0 12px 45px rgba(0,0,0,.14)}header{border-bottom:2px solid var(--ink);padding-bottom:22px;margin-bottom:30px}.kicker{font:700 12px/1.2 Arial,sans-serif;letter-spacing:.17em;text-transform:uppercase;color:var(--accent)}h1{font-size:40px;line-height:1.05;margin:9px 0 8px}h2{font-size:22px;margin:34px 0 12px;border-bottom:1px solid var(--line);padding-bottom:6px}p{margin:0 0 12px}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 24px;margin:0}.meta div,.result-grid article{border:1px solid var(--line);background:rgba(255,255,255,.28);padding:14px}.meta dt,.result-grid h3{font:700 11px/1.2 Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}.meta dd{margin:0;overflow-wrap:anywhere}.badge{display:inline-block;background:var(--ink);color:var(--paper);padding:7px 10px;font:700 12px/1 Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase}.result-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.result-grid article:first-child{grid-column:1/-1;border-top:4px solid var(--accent)}.result-grid h3{font-size:12px}.result-grid p{margin:0}.evidence-list{list-style:none;margin:0;padding:0}.evidence-list li{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:16px 0;border-top:1px solid var(--line)}.evidence-number{font:700 12px/1 Arial,sans-serif;color:var(--muted);padding-top:6px}blockquote{margin:0 0 8px;font-size:16px}.evidence-meta{display:flex;flex-direction:column;gap:3px;font:12px/1.45 Arial,sans-serif;color:var(--muted)}.pages-list{padding-left:22px}.pages-list li{padding:5px 0}.pages-list span{display:block;color:var(--muted);font:12px Arial,sans-serif}a{color:inherit;overflow-wrap:anywhere}.muted,footer{color:var(--muted);font:12px/1.5 Arial,sans-serif}footer{border-top:1px solid var(--line);margin-top:38px;padding-top:16px}.screen-actions{max-width:920px;margin:20px auto 0;display:flex;gap:8px}.screen-actions button{border:0;background:#171512;color:#fff;padding:10px 14px;font:700 13px Arial,sans-serif;cursor:pointer}@media(max-width:700px){.page{margin:0;padding:32px 22px}.meta,.result-grid{grid-template-columns:1fr}.result-grid article:first-child{grid-column:auto}.screen-actions{padding:0 12px}}@media print{body{background:#fff}.screen-actions{display:none}.page{max-width:none;margin:0;padding:0;box-shadow:none;background:#fff}a{text-decoration:none}section,article,li{break-inside:avoid}h2{break-after:avoid}@page{margin:17mm}}
</style>
</head>
<body>
<div class="screen-actions"><button type="button" onclick="window.print()">Print / Save PDF</button></div>
<main class="page">
<header><div class="kicker">The Antizionism Detector™</div><h1>Analysis Report</h1><span class="badge">${escapeHtml(model.result.badge || 'Result')}</span></header>
<dl class="meta">
<div><dt>Generated</dt><dd>${escapeHtml(model.generated_display)}</dd></div>
<div><dt>Source type</dt><dd>${escapeHtml(model.source.type)}</dd></div>
<div><dt>Source</dt><dd>${escapeHtml(model.source.label)}${sourceDetail ? `<br><span class="muted">${sourceDetail}</span>` : ''}</dd></div>
<div><dt>Analyzed text</dt><dd>${model.input.words.toLocaleString()} words · ${model.input.characters.toLocaleString()} characters</dd></div>
</dl>
<section><h2>Result</h2><div class="result-grid">
<article><h3>Found in text</h3><p>${escapeHtml(model.result.found_in_text || '—')}</p></article>
<article><h3>What this means</h3><p>${escapeHtml(model.result.meaning || '—')}</p></article>
<article><h3>Why it matters</h3><p>${escapeHtml(model.result.why_it_matters || '—')}</p></article>
<article><h3>Who said it</h3><p>${escapeHtml(model.result.who_said_it || '—')}</p></article>
<article><h3>Source context</h3><p>${escapeHtml(model.result.source_context || '—')}</p></article>
<article><h3>Wider language pattern</h3><p>${escapeHtml(model.result.wider_language_pattern || '—')}</p></article>
<article><h3>Type of language</h3><p>${escapeHtml(model.result.type_of_language || '—')}</p></article>
<article><h3>Attribution</h3><p>${escapeHtml(model.result.attribution || '—')}</p></article>
<article><h3>More detail</h3><p>${escapeHtml(model.result.more_detail || '—')}</p></article>
<article><h3>Bottom line</h3><p>${escapeHtml(model.result.bottom_line || '—')}</p></article>
</div></section>
<section><h2>Matched evidence</h2>${evidenceHtml(model)}</section>
${pagesHtml(model)}
<footer>Generated by The Antizionism Detector™. This report classifies language. Attribution and surrounding context remain separate review fields.</footer>
</main>
${autoPrint ? '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},180);});<\/script>' : ''}
</body></html>`;
  }

  function buildText(model) {
    const lines = [
      'THE ANTIZIONISM DETECTOR™ — ANALYSIS REPORT',
      '',
      `Generated: ${model.generated_display}`,
      `Source type: ${model.source.type}`,
      `Source: ${model.source.label}`,
      model.source.detail ? `Source detail: ${model.source.detail}` : '',
      model.source.url ? `Source URL: ${model.source.url}` : '',
      `Analyzed text: ${model.input.words.toLocaleString()} words; ${model.input.characters.toLocaleString()} characters`,
      '',
      `RESULT: ${model.result.badge || '—'}`,
      '',
      'FOUND IN TEXT', model.result.found_in_text || '—', '',
      'WHAT THIS MEANS', model.result.meaning || '—', '',
      'WHY IT MATTERS', model.result.why_it_matters || '—', '',
      'WHO SAID IT', model.result.who_said_it || '—', '',
      'SOURCE CONTEXT', model.result.source_context || '—', '',
      'WIDER LANGUAGE PATTERN', model.result.wider_language_pattern || '—', '',
      'TYPE OF LANGUAGE', model.result.type_of_language || '—', '',
      'ATTRIBUTION', model.result.attribution || '—', '',
      'MORE DETAIL', model.result.more_detail || '—', '',
      'BOTTOM LINE', model.result.bottom_line || '—', '',
      'MATCHED EVIDENCE'
    ].filter((value, index, array) => value !== '' || (index > 0 && array[index - 1] !== ''));

    if (!model.evidence.items.length) lines.push('No matched evidence rows were produced.');
    model.evidence.items.forEach((item, index) => {
      lines.push('', `${index + 1}. ${item.sentence || '—'}`);
      if (item.result) lines.push(`   Result: ${item.result}`);
      if (item.stance) lines.push(`   Context: ${item.stance}`);
      if (item.triggers.length) lines.push(`   Matched wording: ${item.triggers.join('; ')}`);
      if (item.categories.length) lines.push(`   Type: ${item.categories.join('; ')}`);
      if (item.source_location && item.source_location.label) {
        lines.push(`   Source location: ${[item.source_location.label, item.source_location.detail].filter(Boolean).join(' · ')}`);
        if (item.source_location.url) lines.push(`   Source URL: ${item.source_location.url}`);
      }
    });
    if (model.evidence.omitted) lines.push('', `${model.evidence.omitted} additional evidence rows are retained in the JSON export.`);
    if (model.source.pages.length) {
      lines.push('', 'WEBSITE PAGES INCLUDED');
      model.source.pages.forEach((page, index) => lines.push(`${index + 1}. ${page.title || page.url}${page.detail ? ` — ${page.detail}` : ''}\n   ${page.url}`));
    }
    lines.push('', 'Generated by The Antizionism Detector™. This report classifies language. Attribution and surrounding context remain separate review fields.');
    return lines.join('\n');
  }

  function download(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function withModel(action) {
    try {
      action(buildModel());
    } catch (error) {
      window.alert(error && error.message ? error.message : 'The report could not be created.');
    }
  }

  printButton.addEventListener('click', () => withModel(model => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      window.alert('Allow pop-ups for this site, then try Print / Save PDF again.');
      return;
    }
    try { reportWindow.opener = null; } catch (error) { /* browser controlled */ }
    reportWindow.document.open();
    reportWindow.document.write(buildHtml(model, true));
    reportWindow.document.close();
  }));

  htmlButton.addEventListener('click', () => withModel(model => {
    download(buildHtml(model, false), 'text/html;charset=utf-8', `${reportFileBase(model)}.html`);
  }));

  textButton.addEventListener('click', () => withModel(model => {
    download(buildText(model), 'text/plain;charset=utf-8', `${reportFileBase(model)}.txt`);
  }));

  jsonButton.addEventListener('click', () => withModel(model => {
    download(JSON.stringify(model, null, 2), 'application/json;charset=utf-8', `${reportFileBase(model)}.json`);
  }));

  document.addEventListener('detector:analysis-rendered', () => {
    panel.classList.remove('hidden');
  });

  document.addEventListener('detector:analysis-cleared', () => {
    panel.classList.add('hidden');
  });

  document.addEventListener('detector:source-loaded', event => {
    currentSource = event && event.detail && event.detail.source ? event.detail.source : 'text';
  });

  textInput.addEventListener('input', event => {
    if (!event.isTrusted) return;
    const dataset = textInput.dataset || {};
    if (!dataset.documentName && !dataset.pageUrl && !dataset.siteOrigin) currentSource = 'text';
  });

  if (clearButton) clearButton.addEventListener('click', () => { currentSource = 'text'; });
})();
