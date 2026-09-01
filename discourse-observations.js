(() => {
  'use strict';

  const ISRAEL_TERMS = /\b(israel|israeli|israelis|zionism|zionist|zionists|jewish state|idf|aipac|hasbara)\b/gi;
  const ISRAEL_TEST = /\b(israel|israeli|israelis|zionism|zionist|zionists|jewish state|idf|aipac|hasbara)\b/i;
  const DOUBLE_STANDARD_CUES = [
    /\bonly (?:country|state|nation)\b.{0,120}\b(israel|jewish state)\b/i,
    /\b(israel|jewish state)\b.{0,120}\bonly (?:country|state|nation)\b/i,
    /\bno other (?:country|state|nation)\b.{0,120}\b(israel|jewish state)\b/i,
    /\b(israel|jewish state)\b.{0,120}\bno other (?:country|state|nation)\b/i,
    /\buniquely\b.{0,100}\b(israel|zionis(?:m|t|ts)|jewish state)\b/i,
    /\b(israel|zionis(?:m|t|ts)|jewish state)\b.{0,100}\buniquely\b/i,
    /\bdouble standard(?:s)?\b.{0,120}\b(israel|zionis(?:m|t|ts)|jewish state)\b/i
  ];
  const GRANDIOSITY_CUES = [
    /\b(israel|zionis(?:m|t|ts))\b.{0,100}\b(causes?|caused|behind|responsible for)\b.{0,100}\b(all|every|most)\b.{0,60}\b(wars?|conflicts?|problems?|crises?|evil|instability)\b/i,
    /\b(all|every|most)\b.{0,60}\b(wars?|conflicts?|problems?|crises?|evil|instability)\b.{0,100}\b(caused by|because of|trace back to)\b.{0,80}\b(israel|zionis(?:m|t|ts))\b/i,
    /\b(israel|zionis(?:m|t|ts))\b.{0,100}\b(root|source|center|epicenter)\b.{0,80}\b(world|global|humanity|all oppression|all racism|all colonialism)\b/i,
    /\b(israel|zionists?)\b.{0,100}\b(control|controls|controlled|run|runs|own|owns|dictate|dictates)\b.{0,80}\b(the world|western governments?|global media|everything)\b/i
  ];

  const OBJECT_WIDENING_CUES = [
    /(this|that|the (?:strike|war|attack|operation|incident|policy|decision)).{0,160}(proves|shows|reveals).{0,120}(what israel has always been|what zionism is|zionism is (?:inherently )?(?:racist|colonial|genocidal|evil)|israel is (?:inherently )?(?:evil|genocidal|racist|colonial))/i
  ];
  const FETISHIZATION_CUES = [
    /(?:jewish|jew)\s+(?:writer|author|student|professor|scientist|musician|artist|speaker|employee|applicant|member).{0,200}(?:must|has to|had to|required to|needs to|needed to).{0,120}(?:denounce|disavow|reject|condemn).{0,80}(?:israel|zionism|zionist|gaza war)/i,
    /(?:denounce|disavow|reject|condemn).{0,80}(?:israel|zionism|zionist).{0,160}(?:before|to be allowed|to join|to speak|to participate|to perform|to belong)/i
  ];

  const RITUAL_CUES = [
    /\b(rally|protest|march|demonstration|encampment|chant|chanted|chanting|call[- ]and[- ]response|litmus test|pledge|denounce|normalization|no normalization)\b/i,
    /\b(keffiyeh|watermelon|handala|inverted red triangle|red triangle|paraglider|key of return|map without israel|erase israel|zionist[- ]free)\b/i
  ];

  function splitSentences(text) {
    return String(text || '').split(/(?<=[.!?])\s+|\n+/).map(v => v.trim()).filter(Boolean);
  }

  function countMatches(text, regex) {
    const matches = String(text || '').match(regex);
    return matches ? matches.length : 0;
  }

  function cueMatches(text, patterns) {
    return patterns.filter(pattern => pattern.test(text)).length;
  }

  function analyze(text) {
    const source = String(text || '');
    const sentences = splitSentences(source);
    const israelMentions = countMatches(source, ISRAEL_TERMS);
    const israelSentences = sentences.filter(sentence => ISRAEL_TEST.test(sentence));
    const doubleStandardCues = cueMatches(source, DOUBLE_STANDARD_CUES);
    const grandiosityCues = cueMatches(source, GRANDIOSITY_CUES);
    const ritualCues = cueMatches(source, RITUAL_CUES);
    const objectWideningCues = cueMatches(source, OBJECT_WIDENING_CUES);
    const fetishizationCues = cueMatches(source, FETISHIZATION_CUES);
    const sentenceShare = sentences.length ? israelSentences.length / sentences.length : 0;

    const notes = [];
    if (sentences.length >= 3) {
      notes.push(`Israel/Zionism appears in ${israelSentences.length} of ${sentences.length} sentence${sentences.length === 1 ? '' : 's'} (${Math.round(sentenceShare * 100)}%).`);
    } else if (israelMentions) {
      notes.push(`${israelMentions} Israel/Zionism reference${israelMentions === 1 ? '' : 's'} detected.`);
    }
    if (doubleStandardCues) notes.push(`${doubleStandardCues} explicit comparative or double-standard cue${doubleStandardCues === 1 ? '' : 's'} detected.`);
    if (grandiosityCues) notes.push(`${grandiosityCues} grandiose Israel-attribution cue${grandiosityCues === 1 ? '' : 's'} detected.`);
    if (ritualCues) notes.push(`${ritualCues} rally, ritual, affiliation, or iconographic cue${ritualCues === 1 ? '' : 's'} detected in the wording.`);
    if (objectWideningCues) notes.push(`${objectWideningCues} object-widening cue${objectWideningCues === 1 ? '' : 's'} detected: a specific act is widened into a claim about Israel or Zionism as such.`);
    if (fetishizationCues) notes.push(`${fetishizationCues} proxy or loyalty-test cue${fetishizationCues === 1 ? '' : 's'} detected in the wording.`);
    if (!notes.length) notes.push('No additional fixation, grandiosity, double-standard, or ritual-use cue was found in this item.');

    return {
      israel_mentions: israelMentions,
      sentence_count: sentences.length,
      israel_related_sentences: israelSentences.length,
      israel_sentence_share: sentenceShare,
      double_standard_cues: doubleStandardCues,
      grandiosity_cues: grandiosityCues,
      ritual_or_symbolic_cues: ritualCues,
      object_widening_cues: objectWideningCues,
      fetishization_or_proxy_cues: fetishizationCues,
      notes,
      limitation: 'These are observable language features. They do not diagnose a person, and concentration cannot be established from a short item alone.'
    };
  }

  window.detectorAnalyzeDiscoursePatterns = analyze;
})();
