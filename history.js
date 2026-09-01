(() => {
  'use strict';

  const HISTORY_KEY = 'antizionismdetector.history.v173';
  const CORRECTIONS_KEY = 'antizionismdetector.corrections.v173';
  const MAX_RECORDS = 1000;

  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function idFor(record) {
    const source = `${record.timestamp}|${record.severity}|${record.input_length}|${record.source && record.source.url || ''}`;
    let hash = 2166136261;
    for (let i = 0; i < source.length; i += 1) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `analysis-${(hash >>> 0).toString(16)}`;
  }

  function sanitizedAnalysis(data) {
    const record = {
      timestamp: new Date().toISOString(),
      result_level: String(data && data.result_level || ''),
      severity: String(data && data.severity || ''),
      severity_tier: String(data && data.severity_tier || ''),
      trigger_terms: Array.isArray(data && data.trigger_terms) ? data.trigger_terms.slice(0, 30) : [],
      pattern_categories: Array.isArray(data && data.pattern_categories) ? data.pattern_categories.slice(0, 30) : [],
      matched_evidence: Array.isArray(data && data.matched_sentences)
        ? data.matched_sentences.flatMap(item => Array.isArray(item.matched_text) ? item.matched_text : []).filter(Boolean).slice(0, 12)
        : [],
      source: data && data.source_context ? {
        type: String(data.source_context.type || ''),
        label: String(data.source_context.label || ''),
        detail: String(data.source_context.detail || ''),
        url: String(data.source_context.url || '')
      } : null,
      discourse_observations: data && data.discourse_observations ? data.discourse_observations : null,
      input_length: String(data && data.input_text || '').length,
      stores_full_text: false
    };
    record.id = idFor(record);
    return record;
  }

  function saveAnalysis(data) {
    if (!data) return null;
    const records = read(HISTORY_KEY);
    const record = sanitizedAnalysis(data);
    records.unshift(record);
    write(HISTORY_KEY, records.slice(0, MAX_RECORDS));
    updateSummary();
    return record;
  }

  function saveCorrection(correction) {
    const corrections = read(CORRECTIONS_KEY);
    const entry = {
      id: `correction-${Date.now()}`,
      timestamp: new Date().toISOString(),
      analysis_id: correction.analysis_id || '',
      original_result: correction.original_result || '',
      original_severity: correction.original_severity || '',
      corrected_label: correction.corrected_label || '',
      why_wrong: correction.why_wrong || ''
    };
    corrections.unshift(entry);
    write(CORRECTIONS_KEY, corrections.slice(0, MAX_RECORDS));
    updateSummary();
    return entry;
  }

  function stats() {
    const records = read(HISTORY_KEY);
    const corrections = read(CORRECTIONS_KEY);
    const flagged = records.filter(record => !/^none$/i.test(record.severity) && !/^no exact/i.test(record.result_level)).length;
    return { total: records.length, flagged, corrections: corrections.length };
  }

  function updateSummary() {
    const target = document.getElementById('historySummary');
    if (!target) return;
    const value = stats();
    target.textContent = `${value.total} analyses · ${value.flagged} with mapped language · ${value.corrections} corrections`;
  }

  function clearAll() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(CORRECTIONS_KEY);
    updateSummary();
  }

  window.DetectorHistory = {
    HISTORY_KEY,
    CORRECTIONS_KEY,
    list: () => read(HISTORY_KEY),
    corrections: () => read(CORRECTIONS_KEY),
    saveAnalysis,
    saveCorrection,
    stats,
    clearAll
  };

  document.addEventListener('detector:analysis-rendered', event => {
    const analysis = event.detail && event.detail.analysis;
    const record = saveAnalysis(analysis);
    if (analysis && record) analysis.local_history_id = record.id;
  });

  document.addEventListener('DOMContentLoaded', updateSummary);
})();
