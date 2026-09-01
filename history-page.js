(() => {
  'use strict';
  const historyApi = window.DetectorHistory;
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function counts(values) {
    const map = new Map();
    values.forEach(value => map.set(value, (map.get(value) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }

  function observations(record) {
    return record && record.discourse_observations && typeof record.discourse_observations === 'object'
      ? record.discourse_observations
      : {};
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function widerCueText(record) {
    const obs = observations(record);
    const parts = [];
    if (number(obs.grandiosity_cues)) parts.push(`grandiosity ${number(obs.grandiosity_cues)}`);
    if (number(obs.double_standard_cues)) parts.push(`comparative ${number(obs.double_standard_cues)}`);
    if (number(obs.ritual_or_symbolic_cues)) parts.push(`ritual/symbol ${number(obs.ritual_or_symbolic_cues)}`);
    if (number(obs.israel_mentions)) parts.push(`Israel/Zionism references ${number(obs.israel_mentions)}`);
    return parts.join('; ');
  }

  function render() {
    const records = historyApi ? historyApi.list() : [];
    const corrections = historyApi ? historyApi.corrections() : [];
    const total = records.length;
    const flagged = records.filter(record => record.severity && record.severity !== 'None').length;
    const israelFocusItems = records.filter(record => number(observations(record).israel_mentions) > 0).length;
    const grandiosityCues = records.reduce((sum, record) => sum + number(observations(record).grandiosity_cues), 0);
    const doubleStandardCues = records.reduce((sum, record) => sum + number(observations(record).double_standard_cues), 0);
    const ritualCues = records.reduce((sum, record) => sum + number(observations(record).ritual_or_symbolic_cues), 0);
    const israelRelatedSentences = records.reduce((sum, record) => sum + number(observations(record).israel_related_sentences), 0);
    const sentenceCount = records.reduce((sum, record) => sum + number(observations(record).sentence_count), 0);

    document.getElementById('historyTotal').textContent = String(total);
    document.getElementById('historyCorrections').textContent = String(corrections.length);
    document.getElementById('historyFlagged').textContent = String(flagged);
    document.getElementById('historyIsraelFocus').textContent = String(israelFocusItems);
    document.getElementById('historyGrandiosity').textContent = String(grandiosityCues);
    document.getElementById('historyDoubleStandard').textContent = String(doubleStandardCues);
    document.getElementById('historyRitual').textContent = String(ritualCues);

    const patternNote = document.getElementById('historyPatternNote');
    if (!total) {
      patternNote.textContent = 'No saved wider-pattern data.';
    } else {
      const share = sentenceCount ? Math.round((israelRelatedSentences / sentenceCount) * 100) : 0;
      patternNote.textContent = `${israelFocusItems} of ${total} saved items mention Israel or Zionism. Across saved sentence-level observations, ${share}% are Israel/Zionism-related. Concentration is descriptive; review source purpose and subject specialization before calling it hyperfixation.`;
    }

    const categoryList = document.getElementById('topCategories');
    categoryList.innerHTML = counts(records.flatMap(record => record.pattern_categories || [])).slice(0, 10).map(([name, count]) => `<li><span>${escapeHtml(name)}</span><strong>${count}</strong></li>`).join('') || '<li>No saved category data.</li>';

    const tableBody = document.getElementById('historyRows');
    tableBody.innerHTML = records.slice(0, 250).map(record => `<tr><td>${escapeHtml(new Date(record.timestamp).toLocaleString())}</td><td>${escapeHtml(record.source && (record.source.label || record.source.url) || 'Pasted text')}</td><td>${escapeHtml(record.result_level || '')}</td><td>${escapeHtml(record.severity || '')}</td><td>${escapeHtml((record.trigger_terms || []).slice(0, 4).join('; '))}</td><td>${escapeHtml(widerCueText(record) || '—')}</td></tr>`).join('') || '<tr><td colspan="6">No saved analyses.</td></tr>';
  }

  function download(name, type, content) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function csvCell(value) {
    return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
  }

  document.getElementById('exportHistoryJson').addEventListener('click', () => {
    download('antizionism-detector-local-history.json', 'application/json', JSON.stringify({ analyses: historyApi.list(), corrections: historyApi.corrections() }, null, 2));
  });

  document.getElementById('exportHistoryCsv').addEventListener('click', () => {
    const rows = [['timestamp','source','result','severity','triggers','categories','israel_mentions','israel_sentence_share','grandiosity_cues','double_standard_cues','ritual_or_symbolic_cues']]
      .concat(historyApi.list().map(record => {
        const obs = observations(record);
        return [
          record.timestamp,
          record.source && (record.source.url || record.source.label) || '',
          record.result_level,
          record.severity,
          (record.trigger_terms || []).join(' | '),
          (record.pattern_categories || []).join(' | '),
          number(obs.israel_mentions),
          number(obs.israel_sentence_share),
          number(obs.grandiosity_cues),
          number(obs.double_standard_cues),
          number(obs.ritual_or_symbolic_cues)
        ];
      }));
    download('antizionism-detector-local-history.csv', 'text/csv;charset=utf-8', rows.map(row => row.map(csvCell).join(',')).join('\n'));
  });

  document.getElementById('clearHistory').addEventListener('click', () => {
    if (!confirm('Delete all locally saved detector history and corrections on this device?')) return;
    historyApi.clearAll();
    render();
  });

  render();
})();
