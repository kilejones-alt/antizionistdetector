const severityRank = { "None": 0, "Context": 1, "Low/Context": 2, "Medium/Context": 3, "Adjacent": 3.5, "Medium": 4, "High": 5, "Critical": 6 };
const tierRank = { "A-low": 1, "A-medium": 2, "A-high": 3, "A-critical": 4 };
const resultCard = document.getElementById('resultCard');
const textInput = document.getElementById('textInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const installBtn = document.getElementById('installBtn');
const installHint = document.getElementById('installHint');
let deferredPrompt = null;

const REJECTION_CUES = [
  'false', 'i quote', 'quote:', 'appeared in', 'sign read', 'sign reads', 'flyer read', 'flyer says', 'the phrase', 'the slogan', 'lie', 'a lie', 'falsely claim', 'falsely claims', 'falsely accused', 'dangerous', 'antisemitic', 'trope', 'conspiracy theory', 'slur', 'became a slur', 'is a slur', 'not true', 'not accurate', 'is wrong', 'it is wrong', 'that is wrong', 'did not rule', 'has not ruled', 'did not find', 'has not found', 'do not support', 'does not support', 'do not think', 'don’t think', "don't think", 'do not believe', 'don’t believe', "don't believe", 'does not say', 'does not conclude', 'does not mean', 'do not mean', 'criticized the phrase', 'criticized the claim', 'no one should say', 'not a settler-colonial', 'not settler-colonial', 'not a colonial', 'is not racism', 'not racism', 'can mean different things', 'not necessarily eliminationist', 'but i disagree', 'i disagree with',
  'should not', 'reject', 'rejected', 'condemn', 'condemned', 'do not say',
  'not endorsing', 'does not endorse', 'without endorsing', 'not a moral duty', 'not banned', 'not acceptable',
  'criticized as', 'described as dangerous', 'called dangerous', 'is eliminationist',
  'repugnant', 'abhorrent', 'disgusting', 'offensive things', 'worst comments',
  'should not be chanted', 'do not globalize', 'should be debated, not banned', 'oppose the chant', 'opposes the chant', 'oppose the slogan', 'opposes the slogan', 'oppose the phrase', 'opposes the phrase', 'oppose people who chant', 'oppose people who say', 'opposes people who chant', 'opposes people who say', 'should not target', 'do not target', 'never justified', 'not starving gaza', 'not starving palestinians', 'not claiming that', 'not saying it is', 'not saying that', 'i am not claiming', 'i am not saying', 'denied saying', 'denies that', 'dismissed the claim', 'dismissed the accusation', 'researching the claim', 'researching the slogan', 'researching the phrase', 'studies how', 'study of the slur', 'history of the slur', 'is misleading', 'misleading', 'oppose the idea', 'opposes the idea', 'oppose banning', 'opposes banning', 'oppose ban', 'opposes ban', 'not ending israel', 'not ending the jewish state', 'did not join them', 'i did not join', 'not saying'
];

const REPORTING_PATTERNS = [
  "\\b(one|a|the)\\s+speaker\\s+(said|says|claimed|claims|argued|argues|wrote|writes)\\b",
  "\\b(he|she|they)\\s+(said|says|claimed|claims|argued|argues|wrote|writes|posted|posts|streamed|streams|called|calls)\\b",
  "\\bquoted\\s+(activists|protesters|students|critics|supporters)\\s+(saying|who said|that said|chanting|who chanted)\\b",
  "\\b(the|a|an)\\s+article\\s+quoted\\s+(a|the)?\\s*(flyer|sign|poster|chant|slogan|claim)\\b",
  "\\b(i\\s+quote|quote:)\\b",
  "\\b(the\\s+)?(phrase|slogan|chant|sign|flyer|poster|shirt)\\b.{0,120}\\b(appeared|read|reads|said|says|stated|states|quoted|displayed)\\b",
  "\\b(i|we)\\s+(saw|noticed|photographed|reported)\\b.{0,120}\\b(sign|flyer|poster|shirt|banner|graffiti)\\b.{0,120}\\b(reading|saying|that said|that says|read|reads|said|says)\\b",
  "\\b(i|we)\\s+(wonder|wondered|ask|asked|am asking|are asking)\\b.{0,120}\\b(whether|if)\\b",
  "\\b(the question is|the question was|question is|question was)\\b.{0,120}\\b(whether|if)\\b",
  "\\b(israel|israelis?|idf|zionists?|jewish state)\\b.{0,120}\\b(is|are|was|were)\\s+accused\\s+of\\b",
  "\\b([A-Z]{2,}|Hamas|Hezbollah|PIJ|PFLP)\\s+(said|says|claimed|claims|argued|argues|posted|posts|stated|states|called|calls)\\b",
  "\\b(the|a|an)?\\s*(campus group|student group|student organization|student org|organization|group|review)\\s+(discussed|debated|examined|considered|notes|noted|reports|reported|describes|described)\\b",
  "\\baccording to\\b",
  "\\b(i|we)\\s+(read|watched|heard|listened to|saw)\\b.{0,120}\\b(article|report|memo|legal memo|paper|essay|book|interview|speech|clip|video|post|thread|op-ed)\\b.{0,120}\\b(arguing|claiming|saying|alleging|describing|calling|accusing)\\b",
  "\\b(the|a|an)\\s+(article|report|memo|legal memo|paper|essay|book|interview|speech|clip|video|post|thread|op-ed)\\b.{0,120}\\b(argues|argued|claims|claimed|says|said|alleges|alleged|describes|described|calls|called|accuses|accused|quotes|quoted|asks whether|asked whether|examines|examined)\\b",
  "\\b(scholars|experts|lawyers|judges|analysts|historians|academics|legal scholars)\\s+(debate|debated|discuss|discussed|examine|examined|argue|argued|claim|claimed|say|said|ask|asked)\\b",
  "\\b(my|our|his|her|their)\\s+(mother|mom|father|dad|parent|parents|grandmother|grandma|grandfather|grandpa|sister|brother|friend|teacher|professor|classmate|student|coworker|neighbor|uncle|aunt|cousin|wife|husband|partner)\\s+(thinks|think|believes|believe|says|said|claims|claimed|argues|argued|calls|called|considers|considered|describes|described|discusses|discussed|asks|asked)\\b",
  "\\b(someone|some people|many people|critics|activists|some activists|students|professors|scholars|commentators)\\s+(think|thinks|believe|believes|say|said|claim|claimed|argue|argued|call|called)\\b",
  "\\b(a|one|the)\\s+(student|professor|teacher|speaker|person|activist|critic|commentator)\\s+(asked|asks|wondered|wonders)\\s+whether\\b",
  "\\b(the\\s+)?(crowd|protesters|students|activists)\\s+(chanted|chant|chants|shouted|yelled)\\b",
  "\\b(reported|reports|reporting|summarized|summarizes|described|describes|examined|examines|cited|cites|wrote|writes|published|stated|states)\\b",
  "\\b([A-Z][A-Za-z.-]+(?:\\s+[A-Z][A-Za-z.-]+){0,3})\\s+(suggests|suggested|thinks|thought|believes|believed|says|said|writes|wrote|posted|posts|tweeted|tweets|streamed|streams|published|stated|states|claims|claimed|argues|argued|alleges|alleged|calls|called|notes|noted)\\b",
  "\\b(things|comments|statements|remarks|views|quotes)\\b[^.!?]{0,100}\\b(he|she|they)(?:[’']s|\\s+has|\\s+had|\\s+have)?\\s+(said|written|posted|claimed|argued|streamed)\\b",
  "\\b(he|she|they|[A-Z][A-Za-z.-]+)\\s+(has\\s+also\\s+said|has\\s+said|had\\s+said|said|claimed|argued|called)\\b\\s*:",
  "\\b(critics|activists|protesters|students|scholars|historians|commentators|opponents|supporters)\\s+(?:said|say|wrote|write|writes|published|stated|state|states|argued|argue|claimed|claim|alleged|allege|accused|accuse|called|call)\\b",
  "\\b(the|an|a)\\s+(article|report|paper|book|essay|speech|speaker|author|historian|professor|group|organization)\\s+(said|says|argued|argues|claimed|claims|reported|reports|described|describes|summarized|summarizes|examined|examines|cited|cites|called|calls)\\b",
  "\\b(assigned|assigns|included|includes)\\s+(a|the)?\\s*(reading|article|paper|essay|book)\\b.{0,80}\\b(arguing|argues|claiming|claims|saying|says)\\b",
  "\\b(slogan|phrase|chant|claim|idea|accusation|allegation)\\b.*\\b(said|used|reported|described|quoted|called|criticized|discussed)\\b",
  "\\bwas\\s+(accused|reported|described|quoted|called|criticized|discussed)\\b",
  "\\bwere\\s+(accused|reported|described|quoted|called|criticized|discussed)\\b"
];

const DIRECT_ADOPTION_PATTERNS = [
  '\\b(i|we)\\s+(argue|believe|conclude|maintain|contend|adopt|endorse)\\b',
  '\\b(our position|my position|the correct position)\\s+is\\b',
  '\\b(this essay|this article|this post|this paper|this piece)\\s+(argues|concludes|shows|demonstrates|adopts)\\b',
  '\\b(the class|class|course|lecture)\\s+concluded\\b',
  '\\btherefore\\b',
  '\\bthus\\b',
  '\\bwe must\\b',
  '\\bmust be\\b',
  '\\bshould be\\b',
  '\\bshould not exist\\b'
];

function unique(values) { return [...new Set(values.filter(Boolean))]; }

function testRegex(pattern, text) {
  try { return new RegExp(pattern, 'i').test(text); }
  catch (err) { console.warn('Bad pattern', pattern, err); return false; }
}

function matchRegex(pattern, text) {
  try { return text.match(new RegExp(pattern, 'i')); }
  catch (err) { console.warn('Bad pattern', pattern, err); return null; }
}


function isNeutralDescriptorContext(text, rule) {
  const t = (text || '').toLowerCase();
  if (!rule || !['Anti-Zionism descriptor', 'Anti-Zionist identity predicate'].includes(rule.name)) return false;
  const neutralCues = [
    'hosted a debate', 'debate about', 'debate on', 'discussion of', 'discussed the term',
    'history of', 'historical overview', 'course on', 'class on', 'lecture on', 'seminar on',
    'exhibit discussed', 'museum exhibit', 'assigned a reading', 'assigned an article',
    'defined anti-zionism', 'definition of anti-zionism', 'about zionism, anti-zionism',
    'zionism, anti-zionism, and jewish identity',
    'discussed zionism and anti-zionism', 'discusses zionism and anti-zionism', 'debated zionism and anti-zionism', 'some jews are anti-zionist', 'there are anti-zionist jews', 'anti-zionist writers', 'compares zionist and anti-zionist', 'compare zionist and anti-zionist'
  ];
  return neutralCues.some(cue => t.includes(cue));
}


function isNeutralWashingContext(text, rule) {
  if (!rule || !/Washing accusation/i.test(rule.name || '')) return false;
  const t = (text || '').toLowerCase();
  const descriptiveCue = /\b(article|report|paper|book|essay|study|studies|studied|examines|examined|describes|described|discussion|debate|glossary|history|term|phrase|concept|accusation|label|used against|applied to|directed at)\b/.test(t);
  if (!descriptiveCue) return false;
  const evilIntentCue = /\b(hide|hides|hiding|mask|masks|masking|cover|covers|covering|conceal|conceals|concealing|launder|launders|laundering|whitewash|whitewashes|whitewashing|distract|distracts|distracting|deflect|deflects|deflecting|justify|justifies|justifying|excuse|excuses|excusing|sanitize|sanitizes|sanitizing|propaganda|pr campaign|public relations|cynical|evil intent|bad faith|weaponize|weaponizes|weaponizing|use gay rights|uses gay rights|use environmentalism|uses environmentalism|use culture|uses culture|use sports|uses sports)\b/.test(t);
  return !evilIntentCue;
}



function isNeutralHashtagContext(text, rule) {
  if (!rule || !/hashtag|compressed/i.test(rule.name || rule.category || '')) return false;
  if (rule.severity === 'Context' || /Context-only/i.test(rule.output || '')) return false;
  const t = (text || '').toLowerCase();
  return /\b(article|report|paper|book|essay|study|studies|studied|examines|examined|describes|described|discussion|debate|glossary|history|term|phrase|concept|hashtag|slogan|used against|applied to|directed at|definition|defined|lecture|class|course|academic|research|scholarship)\b/.test(t) && !/\b(i|we)\s+(agree|endorse|support|use|chant|say)\b/.test(t);
}

function contextualWashingRuleFor(sentence, contextWindow) {
  const sentenceText = sentence || '';
  const contextText = contextWindow || sentenceText;
  const s = sentenceText.toLowerCase();
  const w = contextText.toLowerCase();
  const washingTerm = /\b(pink[- ]?washing|green[- ]?washing|rainbow[- ]?washing|queer[- ]?washing|sports[- ]?washing|art[- ]?washing|culture[- ]?washing|tech[- ]?washing|faith[- ]?washing|vegan[- ]?washing|pinkwashes|greenwashes|rainbowwashes|queerwashes|sportswashes|artwashes|culturewashes|techwashes|faithwashes|veganwashes)\b/i;
  const termMatch = sentenceText.match(washingTerm);
  if (!termMatch) return null;

  const targetCue = /\b(israel|israeli state|jewish state|zionism|zionists?|zionist state|idf)\b/.test(w);
  const evilIntentCue = /\b(hide|hides|hiding|hidden|mask|masks|masking|cover up|covers up|covering up|cover|covers|covering|conceal|conceals|concealing|launder|launders|laundering|whitewash|whitewashes|whitewashing|distract|distracts|distracting|deflect|deflects|deflecting|justify|justifies|justifying|excuse|excuses|excusing|sanitize|sanitizes|sanitizing|propaganda|pr campaign|public relations|cynical|evil intent|bad faith|weaponize|weaponizes|weaponizing|make itself look good|make israel look good|look good|cover story|cover for|fig leaf|smokescreen|smoke screen|disguise|disguises|disguising)\b/.test(w);
  const conversationalAdoptionCue = /\b(yeah|yes|exactly|right|correct|classic|that is|that's|that’s|sounds like|it is|it's|its)\b/.test(s);
  const descriptiveCue = /\b(article|report|paper|book|essay|study|studies|studied|examines|examined|describes|described|discussion|debate|glossary|history|term|phrase|concept|accusation|label|used against|applied to|directed at)\b/.test(w);
  const rejectionCue = /\b(rejects?|rejected|condemns?|condemned|criticizes?|criticized|debunks?|debunked|false claim|misleading claim|not true|not accurate|is wrong|was wrong)\b/.test(w);

  if (!targetCue || !evilIntentCue) return null;
  if (descriptiveCue && !conversationalAdoptionCue) return null;
  if (rejectionCue) return null;

  const pairedLibelCue = /\b(apartheid|genocide|genocidal|ethnic cleansing|war crimes?|crimes?|occupation|settler[- ]?colonial|colonialism|colonizer|coloniser|jewish supremacy|zionist supremacy|nazi|zionazi|baby killers?|child killers?|open[- ]air prison|collective punishment|oppression|atrocities|violence)\b/.test(w);

  return {
    name: pairedLibelCue ? 'Contextual washing accusation paired with mapped libel trigger' : 'Contextual washing accusation in dialogue',
    matched_text: termMatch[0],
    category: pairedLibelCue ? 'Antizionist washing accusation paired with genocide/apartheid/crimes libel supplied by nearby context' : 'Antizionist washing accusation against Israel/Zionism supplied by nearby concealment or propaganda context',
    severity: pairedLibelCue ? 'High' : 'Medium',
    output: 'Flag'
  };
}


function contextualReplyRuleFor(sentence, contextWindow) {
  const sentenceText = sentence || '';
  const contextText = contextWindow || sentenceText;
  const s = sentenceText.toLowerCase();
  const w = contextText.toLowerCase();

  const targetCue = /\b(israel|israeli state|israelis?|jewish state|zionism|zionists?|zionist state|zionist entity|idf|hillel|chabad|birthright|aipac|pro[- ]israel|jewish institutions?|jewish organizations?|synagogue|temple)\b/.test(w);
  if (!targetCue) return null;

  const descriptiveCue = /\b(article|report|paper|book|essay|study|studies|studied|examines|examined|describes|described|discussion|debate|glossary|history|term|phrase|concept|accusation|label|used against|applied to|directed at|definition|defined|lecture|class|course|academic|research|scholarship)\b/.test(w);
  const rejectionCue = /\b(rejects?|rejected|condemns?|condemned|criticizes?|criticized|debunks?|debunked|false claim|misleading claim|lazy accusation|not true|not accurate|is wrong|was wrong|isn['’]?t accurate|isn['’]?t right|not right|do not think|don['’]?t think|does not mean|doesn['’]?t mean|do not agree|don['’]?t agree|disagree|opposes?|opposed|should not say|shouldn['’]?t say|not saying|not claiming|is\s+not|are\s+not|was\s+not|were\s+not|isn['’]?t|aren['’]?t|wasn['’]?t|weren['’]?t|not\s+(?:racism|racist|apartheid|genocide|genocidal|ethnostate|colonial|settler[- ]?colonial|supremacy|supremacist|nazi|zionazi|pink[- ]?washing|green[- ]?washing))\b/.test(w);

  const sentenceWithoutSpeaker = s
    .replace(/^\s*(friend|reply|me|them|they|student|speaker|person|someone|professor|teacher|classmate|activist|protester|user|commenter)\s*:\s*/i, '')
    .trim();

  const adoptionCue = /^\s*(yeah|yes|yep|exactly|right|correct|true|classic|obviously|clearly|that is|that['’]?s|this is|it is|it['’]?s|its|sounds like|same|agreed|for sure|of course)\b/.test(sentenceWithoutSpeaker);
  // Explicitly affirming a mapped claim counts as authorial adoption even when the sentence
  // uses descriptive nouns such as “claim” or “accusation.” This implements the controlling
  // stance rule: endorsement/acceptance/affirmation counts; mere mention or attribution does not.
  const explicitClaimAffirmationCue = /\b(i|we)\s+(agree|agreed)\s+(?:with\s+)?(?:that|this|it|the\s+(?:claim|accusation|statement|slogan|phrase))\b|\b(i|we)\s+(endorse|endorsed|accept|accepted|condone|condoned|approve|approved|affirm|affirmed|back|backed)\s+(?:that|this|it|the\s+(?:claim|accusation|statement|slogan|phrase))\b|\b(?:the|this|that)\s+(?:claim|accusation|statement|slogan|phrase)\b.{0,100}\b(?:is|was|remains)\s+(?:true|correct|accurate|right|valid)\b|\b(?:genocide|apartheid|colonial|occupation|open[- ]air prison|free palestine)\s+(?:claim|accusation|framing|slogan|phrase)\b.{0,100}\b(?:is|was|remains)\s+(?:true|correct|accurate|right|valid)\b/.test(w);

  const termGroups = [
    { pattern: /\b(settler[- ]?colonial(?:ism)?|settler colonial state|colonial project|colonial state|colonial regime|colonial entity|colonizer state|coloniser state|colonizers?|colonisers?)\b/i, category: 'Colonial / decolonization language', severity: 'High' },
    { pattern: /\b(apartheid(?: state| regime| system)?|apartheid israel|apartheid state)\b/i, category: 'Apartheid accusation', severity: 'High' },
    { pattern: /\b(genocide|genocidal|genocidaire|extermination)\b/i, category: 'Genocide accusation', severity: 'High' },
    { pattern: /\b(ethnostate|ethno[- ]?state|jewish ethnostate)\b/i, category: 'Ethnostate / supremacy accusation', severity: 'High' },
    { pattern: /\b(jewish supremacy|zionist supremacy|israeli supremacy|supremacist(?:s)?|supremacy|ethno[- ]?supremacy|ethno[- ]?superiority|ethno[- ]?nationalism)\b/i, category: 'Ethnostate / supremacy accusation', severity: 'High' },
    { pattern: /\b(imperialist|imperialism|empire|western proxy|american proxy|u\.?s\.? proxy|western outpost|imperial outpost|satellite state|satellite of america)\b/i, category: 'Western outpost / imperial language', severity: 'High' },
    { pattern: /\b(open[- ]air prison|carceral state|carceral regime|prison camp|giant prison)\b/i, category: 'Carceral / confinement accusation', severity: 'High' },
    { pattern: /\b(ethnic cleansing|ethnically cleansed|ethnically cleanse|ethnically cleansing)\b/i, category: 'Humanitarian atrocity / war-crimes accusation', severity: 'High' },
    { pattern: /\b(zio[- ]?nazi|zionazi|nazi[- ]?like|nazis?|holocaust inversion|gaza is auschwitz)\b/i, category: 'Zionism/Nazi inversion', severity: 'High' },
    { pattern: /\b(white settler|white settlers|white european|white europeans|european settlers?|european colonizers?|european invaders?|rich white jews?|privileged white jews?)\b/i, category: 'Jewish indigeneity denial', severity: 'High' },
    { pattern: /\b(child killers?|baby killers?|murdering babies|murder babies|kills children|killing children|slaughtering children|slaughtering kids)\b/i, category: 'Israeli / Zionist collective demonization', severity: 'High' },
    { pattern: /\b(zionist entity|zionist regime|zionist project|zionist state)\b/i, category: 'Israel elimination / replacement language', severity: 'High' },
    { pattern: /\b(from the river to the sea|river to the sea)\b/i, category: 'Israel elimination / replacement language', severity: 'Medium' },
    { pattern: /\b(globalize the intifada|globalise the intifada|intifada revolution|by any means necessary|resistance by any means|resistance is justified|resistance is not terrorism)\b/i, category: 'Intifada / violence-escalation language', severity: 'Critical' },
    { pattern: /\b(zionism is racism|racist state|racist ideology|racism)\b/i, category: 'Zionism-racism equation', severity: 'High' },
    { pattern: /\b(bds|boycott[, ]+divest(?:ment)?(?: and sanctions?)?|boycott divest(?:ment)? sanctions?)\b/i, category: 'Boycott / anti-normalization pressure', severity: 'Medium' },
    { pattern: /\b(anti[- ]?normalization|no normalization|normalization is betrayal)\b/i, category: 'Boycott / anti-normalization pressure', severity: 'High' },
    { pattern: /\b(no zionists?|no[- ]zionist|zionist[- ]free|zionists? not welcome|ban zionists?|exclude zionists?)\b/i, category: 'Zionist exclusion / antizionist social exclusion', severity: 'High' },
    { pattern: /\b(hasbara|propaganda front|zionist propaganda|zio propaganda|targeting|front)\b/i, category: 'Hasbara dismissal', severity: 'Medium' },
    { pattern: /\b(antisemitism is hasbara|antisemitism claims are hasbara|jewish safety is hasbara|hostage story is hasbara|hostage posters are hasbara|birthright is propaganda|hillel launders|jewish federations? are fronts?)\b/i, category: 'Hasbara dismissal', severity: 'High' },
    { pattern: /\b((?:victims?\s+)?became (?:the )?oppressors?|learned from (?:(?:their|its) )?persecutors?|gaza is (?:the )?new warsaw ghetto|gaza is warsaw|became what they hated)\b/i, category: 'Zionism/Nazi inversion', severity: 'High' },
    { pattern: /\b(aipac owns|aipac controls|aipac bought|aipac writes|aipac dictates|aipac decides|zionist lobby controls|israel lobby controls|pro[- ]israel lobby controls|controls congress|owns congress|controls the media|controls media|controls money|controls universities|writes our laws|dictates foreign policy)\b/i, category: 'Zionist control claim', severity: 'High' },
    { pattern: /\b(collective punishment|collectively punishing|collectively punished)\b/i, category: 'Humanitarian atrocity / war-crimes accusation', severity: 'Medium' },
    { pattern: /\b(bantustanization|bantustanisation|bantustans?)\b/i, category: 'Carceral / confinement accusation', severity: 'Medium' },
    { pattern: /\b(chauvinist nationalism|chauvinism|militarism|militarist)\b/i, category: 'Militarized state / security-state accusation', severity: 'Medium' },
    { pattern: /\b(hostage posters?|zio propaganda|zionist propaganda)\b/i, category: 'Hasbara dismissal', severity: 'High' },
    { pattern: /\b(stolen land|stole the land|land theft|fake jews?|khazars?|organ harvesting|organ theft|body theft|blood libel)\b/i, category: 'Israel/Zionism blood-or-body libel', severity: 'High' },
    { pattern: /\bz[i1!|]o[- ]?(?:s|fascists?|fascism|entity|lobby|propaganda|media|money|control|regime|state|project)\b|\bzios?\b/i, category: 'Zionist slur / hostile label', severity: 'High' }
  ];

  let found = null;
  for (const group of termGroups) {
    const m = sentenceText.match(group.pattern);
    if (m) { found = { ...group, match: m[0] }; break; }
  }
  if (!found) return null;

  const priorAdoptionCue = new RegExp('\\b(?:yeah|yes|yep|exactly|right|correct|agreed)\\s*[.!?]\\s*' + escapeRegExp(found.match), 'i').test(contextWindow);

  if (rejectionCue || (descriptiveCue && !adoptionCue && !priorAdoptionCue && !explicitClaimAffirmationCue)) {
    const pureNonEndorsementCue = /\b(asked whether|question is whether|question was whether|right legal term|did not endorse|does not endorse|didn['’]?t endorse|without endorsing)\b/.test(w);
    if (pureNonEndorsementCue) return null;
    return {
      name: 'Contextual descriptive/rejected mapped term mention',
      matched_text: found.match,
      category: `Descriptive or rejected mapped-term context — ${found.category}`,
      severity: 'Context',
      output: 'Context-only'
    };
  }

  const bareOrShort = sentenceWithoutSpeaker.length <= 170;
  const bareTermOnly = new RegExp('^\\s*(?:' + escapeRegExp(found.match) + ')(?:\\s+(?:state|regime|system|project|entity|settlers?|colonizers?|colonisers?|ideology|movement|policy|policies|practice|practices|people))*\\s*[.!?]*\\s*$', 'i').test(sentenceWithoutSpeaker);
  const pronounOrImpliedTarget = /^(they|these people|those people|that state|the state|that country|the country|it|that|this|their(?: whole)? project|the(?: whole)? project|their movement|the movement)\b.{0,130}$/i.test(sentenceWithoutSpeaker) && /\b(is|are|was|were|means|amounts to|looks like|sounds like|became|become|turn(?:ed)? into|not welcome|should be|must be|hasbara|propaganda|colonizers?|apartheid|genocide|ethnostate|racism|nazi|zionazi|supremacy|bantustans?|open[- ]air prison|stolen land|oppressors?)\b/i.test(sentenceWithoutSpeaker);
  const targetSentenceWithTerm = /\b(israel|israeli state|jewish state|zionism|zionists?|zionist state|idf|hillel|chabad|birthright|synagogue|temple)\b/i.test(sentenceWithoutSpeaker);
  const shortAnswerWithTerm = bareOrShort && (adoptionCue || bareTermOnly || pronounOrImpliedTarget || priorAdoptionCue || targetSentenceWithTerm);
  if (!shortAnswerWithTerm) return null;

  return {
    name: 'Contextual short-reply mapped term adoption',
    matched_text: found.match,
    category: found.category,
    severity: found.severity,
    output: 'Flag'
  };
}


function isNeutralZioLettersContext(text, rule) {
  if (!rule || !/\bZio\b|Zio variants/i.test(rule.name || '')) return false;
  const t = (text || '').toLowerCase();
  const metaCue = /\b(word|letters?|substring|spelling|sequence|contains|contained|only as letters|not as a slur|not a slur)\b/.test(t);
  const notSlurCue = /\b(only as letters|not as a slur|not a slur|substring)\b/.test(t);
  const explicitUseCue = /\b(zios?\s+(control|run|own|silence|ban|exclude|destroy|are|must|should)|hate\s+zios?|no\s+zios?)\b/.test(t);
  return metaCue && notSlurCue && !explicitUseCue;
}

function rulesForText(text) {
  return DETECTOR_RULES.map(rule => {
    const match = matchRegex(rule.pattern, text);
    return match ? { ...rule, matched_text: match[0] } : null;
  }).filter(Boolean).filter(rule => {
    if (rule.name === 'Obfuscated Zionist spelling' && /^zionists?$/i.test((rule.matched_text || '').trim())) return false;
    if (isNeutralDescriptorContext(text, rule)) return false;
    if (isNeutralWashingContext(text, rule)) return false;
    if (isNeutralHashtagContext(text, rule)) return false;
    if (isNeutralZioLettersContext(text, rule)) return false;
    return true;
  });
}

function isAdjacentRiskRule(rule) {
  const hay = `${rule.name || ''} ${rule.category || ''} ${rule.family || ''} ${rule.internal_category || ''} ${rule.output || ''} ${rule.scope_status || ''}`;
  return /antizionism-adjacent|adjacent jew-hatred/i.test(hay) || /Adjacent-risk/i.test(rule.output || '') || rule.severity === 'Adjacent' || rule.scope_status === 'Antizionist-adjacent Jew-hatred';
}

function isOutsideAntizionismRule(rule) {
  // Keep adjacent Jew-hatred risk inside the review stream, but filter clearly outside-scope context rules.
  const hay = `${rule.name || ''} ${rule.category || ''} ${rule.family || ''} ${rule.internal_category || ''} ${rule.output || ''} ${rule.scope_status || ''}`;
  return /outside app scope|outside antizionism criteria/i.test(hay) && !isAdjacentRiskRule(rule);
}

function antizionismMatches(matches) {
  return (matches || []).filter(rule => !isOutsideAntizionismRule(rule));
}

function matchSetKind(matches) {
  const list = matches || [];
  if (!list.length) return 'none';
  const hasAntizionist = list.some(rule => !isAdjacentRiskRule(rule));
  const hasAdjacent = list.some(isAdjacentRiskRule);
  if (hasAntizionist && hasAdjacent) return 'mixed';
  if (hasAdjacent) return 'adjacent';
  return 'antizionist';
}

function isContextSeverity(severity) {
  return ["Context", "Low/Context", "Medium/Context"].includes(severity);
}

function ruleTier(rule) {
  const hay = `${rule.name || ''} ${rule.category || ''} ${rule.family || ''} ${rule.internal_category || ''} ${rule.output || ''}`.toLowerCase();
  const matchedHay = `${rule.matched_text || ''}`.toLowerCase();

  if (isAdjacentRiskRule(rule)) return 'B';
  if (isContextSeverity(rule.severity)) return 'C';
  if (rule.severity === 'Critical') return 'A-critical';

  if (hay.includes('contextual short-reply mapped term adoption') && rule.severity !== 'Critical') return rule.severity === 'Medium' ? 'A-medium' : 'A-high';
  if (hay.includes('decolonize palestine')) return 'A-medium';
  if (hay.includes('zionist entity/regime/state')) return 'A-high';
  if (rule.severity === 'Medium' && (hay.includes('stigma / distrust') || hay.includes('person-targeting label'))) return 'A-medium';

  // Low A: a standalone slogan finding, not equivalent to libel, conspiracy, exclusion, or elimination.
  if (hay.includes('standalone free palestine') || hay.includes('stop the genocide')) return 'A-low';

  // Medium A: affirmative boycott/occupation formulations and other mapped ideology/register language below the libel/conspiracy tier.
  if (
    hay.includes('from the river to the sea') ||
    hay.includes('moral duty') ||
    hay.includes('boycott / exclusion campaign against israel endorsed directly') ||
    hay.includes('bds / boycott campaign used affirmatively') ||
    hay.includes('academic/cultural boycott used affirmatively') ||
    hay.includes('end-the-occupation framing used affirmatively') ||
    hay.includes('end/lift-blockade framing used affirmatively') ||
    hay.includes('end/lift/break-siege framing used affirmatively') ||
    hay.includes('occupation-is-a-crime chant used affirmatively') ||
    hay.includes('occupied-palestine framing used affirmatively')
  ) return 'A-medium';

  // High A additions from the August 10–12 coding guide.
  if (
    hay.includes('october 7 denial') ||
    hay.includes('inherent-character demonization') ||
    hay.includes('bloodlust') ||
    hay.includes('poisoning-water') ||
    hay.includes('poisoning-food') ||
    hay.includes('dual-loyalty') ||
    hay.includes('israel-allegiance') ||
    hay.includes('loyalty test') ||
    hay.includes('object widening') ||
    hay.includes('uniquely-evil') ||
    hay.includes('grandiose uniqueness') ||
    hay.includes('jewish peoplehood') ||
    hay.includes('october 7 minimization') ||
    hay.includes('hamas explicitly endorsed') ||
    hay.includes('violence-shielding')
  ) return 'A-high';

  // Critical A: direct removal/replacement of Israel or Jewish statehood, or violence-escalation slogans.
  if (
    hay.includes('globalize the intifada') ||
    hay.includes('globalizetheintifada') ||
    matchedHay.includes('globalizetheintifada') ||
    hay.includes('intifada revolution') ||
    hay.includes('by any means necessary') ||
    hay.includes('stone throwing birthright') ||
    hay.includes('antizionist resistance/violence justification') ||
    hay.includes('antizionist violence/resistance justification') ||
    hay.includes('resistance violence') ||
    hay.includes('al aqsa') ||
    hay.includes('should not exist') ||
    hay.includes('no-right-to-exist') ||
    hay.includes('no right to exist') ||
    hay.includes('abolish/dismantle/end israel') ||
    hay.includes('should be replaced') ||
    hay.includes('must fall') ||
    hay.includes('must be dismantled') ||
    hay.includes('should be dismantled') ||
    hay.includes('must end') ||
    hay.includes('should end') ||
    hay.includes('there should be no jewish state') ||
    hay.includes('no jewish state anywhere') ||
    hay.includes('removal language') ||
    hay.includes('replacement language') && !hay.includes('from the river to the sea')
  ) return 'A-critical';

  // High A: libel register, Holocaust inversion bridge, conspiracy/control, exclusion, slurs, or institution-targeting in an antizionist language.
  if (
    hay.includes('question-as-accusation') ||
    hay.includes('compressed hashtag') ||
    hay.includes('obfuscated spelling') ||
    hay.includes('hasbara used to dismiss') ||
    hay.includes('hasbara as dismissal') ||
    hay.includes('washing accusation paired') ||
    hay.includes('institutional targeting') ||
    hay.includes('institution-targeting') ||
    hay.includes('Jewish-institution-targeting') ||
    hay.includes('moral inversion') ||
    hay.includes('soft control verbs') ||
    hay.includes('symbol/emoji shorthand') ||
    hay.includes('emoji') ||
    hay.includes('statehood denial') ||
    hay.includes('delegitimization') ||
    hay.includes('zionism-as-racism') ||
    hay.includes('racism language') ||
    hay.includes('genocide') ||
    hay.includes('apartheid') ||
    hay.includes('ethnic cleansing') ||
    hay.includes('settler-colonial') ||
    hay.includes('colonial-apartheid') ||
    hay.includes('colonial/genocide') ||
    hay.includes('colonial libel') ||
    hay.includes('supremacy') ||
    hay.includes('holocaust') ||
    hay.includes('nazi') ||
    hay.includes('conspiracy') ||
    hay.includes('control') ||
    hay.includes('money') ||
    hay.includes('puppet') ||
    hay.includes('zog') ||
    hay.includes('exclusion') ||
    hay.includes('not welcome') ||
    hay.includes('ban') ||
    hay.includes('exclude') ||
    hay.includes('slur') ||
    hay.includes('violence justification') ||
    hay.includes('dehuman') ||
    hay.includes('blood-libel') ||
    hay.includes('body-theft') ||
    hay.includes('organ') ||
    hay.includes('child-killer') ||
    hay.includes('famine') ||
    hay.includes('starvation') ||
    hay.includes('foreign-settler') ||
    hay.includes('foreign-invader') ||
    hay.includes('colonizer register') ||
    hay.includes('zionist occupation') ||
    hay.includes('stole land') ||
    hay.includes('stolen land') ||
    hay.includes('blood-libel bridge') ||
    hay.includes('body-theft') ||
    hay.includes('organ-stealing') ||
    hay.includes('fake-jew') ||
    hay.includes('khazar') ||
    hay.includes('indigeneity denial') ||
    hay.includes('institutional exclusion') ||
    hay.includes('jewish institution') ||
    hay.includes('synagogue') ||
    hay.includes('temple') ||
    hay.includes('zionist outpost') ||
    hay.includes('zionist targeting') ||
    hay.includes('imperialist') ||
    hay.includes('empire') ||
    hay.includes('targeting register') ||
    hay.includes('satellite') ||
    hay.includes('open-air-prison') ||
    hay.includes('carceral')
  ) return 'A-high';

  // Medium A: delegitimizing ideology/register without direct elimination, conspiracy, or violence.
  return 'A-medium';
}

function antizionistTier(matches = []) {
  const tiers = (matches || [])
    .filter(rule => !isAdjacentRiskRule(rule))
    .map(ruleTier)
    .filter(tier => tier && tier.startsWith('A-'));
  if (!tiers.length) return '';
  return tiers.reduce((best, tier) => (tierRank[tier] || 0) > (tierRank[best] || 0) ? tier : best, 'A-low');
}

function tierExplanation(tier) {
  if (tier === 'A-low') return 'Low severity: an antizionist slogan or identity signal that requires context and should not be equated with elimination, conspiracy, or libel language.';
  if (tier === 'A-medium') return 'Medium severity: a mapped antizionist language or endorsement, without the strongest elimination, conspiracy, violence, or libel features.';
  if (tier === 'A-high') return 'High severity: mapped antizionist libel, conspiracy, exclusion, Holocaust-inversion bridge, or institution-targeting language.';
  if (tier === 'A-critical') return 'Critical severity: direct elimination/replacement language, or violence-escalation language tied to the antizionist language.';
  return '';
}


function antizionismCriteriaText(hasTriggers, severity, matches = []) {
  if (!hasTriggers) return 'No mapped pattern';
  if (severity === 'Adjacent' || matchSetKind(matches) === 'adjacent') return 'Antizionism-adjacent Jew-hatred risk';
  if (isContextSeverity(severity)) return 'Context-only / needs human review';
  const tier = antizionistTier(matches);
  return tier ? `Yes — mapped antizionist pattern (${tier})` : 'Yes — mapped antizionist pattern';
}

function maxSeverity(matches) {
  if (!matches.length) return "None";
  return matches.reduce((best, rule) => (severityRank[rule.severity] || 0) > (severityRank[best] || 0) ? rule.severity : best, "Context");
}

function resultFromSeverity(severity, hasTriggers, matches = []) {
  if (!hasTriggers) return { level: "No exact antizionist map hit", text: "No exact antizionist map hit", css: "nohit", tier: "D" };
  if (isContextSeverity(severity)) return { level: "Context-only / human review", text: "Context-only / human review", css: "context", tier: "C" };
  if (severity === "Adjacent" || matchSetKind(matches) === 'adjacent') return { level: "Antizionism-adjacent Jew-hatred risk", text: "Antizionism-adjacent Jew-hatred risk", css: "context", tier: "B" };
  const tier = antizionistTier(matches) || 'A-medium';
  const label = `Antizionist pattern detected — ${tier}`;
  return { level: label, text: label, css: (tier === 'A-high' || tier === 'A-critical') ? "high" : "flagged", tier };
}

function explanationFor(result, severity, hasTriggers, stance, matches = []) {
  if (!hasTriggers) return "No mapped antizionist phrase was found in this text.";
  if (stance === "Quoted / rejected claim") return "The writer mentions the phrase in order to quote, reject, debunk, or criticize it.";
  if (stance === "Reported claim") return "The writer reports or describes what someone else said, rather than making the claim directly.";
  if (stance === "Ambiguous / needs review") return "The app found mapped language, but it cannot clearly tell who is endorsing it.";
  if (severity === "Adjacent" || matchSetKind(matches) === 'adjacent') return "This may be Jew-hatred, but it is not core antizionist language unless the surrounding text ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, Jewish institutions, antizionist libels, or antizionist chants.";
  if (isContextSeverity(severity)) return "The phrase is context-sensitive and needs review before treating it as an antizionist claim.";
  const tier = antizionistTier(matches) || 'A-medium';
  return `The writer states a mapped antizionist claim directly. ${tierExplanation(tier)}`;
}

function splitSentences(text) {
  const marker = '§EXCL§';
  const cleaned = (text || '').replace(/([A-Za-z])!([A-Za-z])/g, `$1${marker}$2`).replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const parts = cleaned.match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/g) || [cleaned];
  return parts.map(s => s.replaceAll(marker, '!').trim()).filter(Boolean);
}

function hasCue(patterns, text) {
  return patterns.some(pattern => testRegex(pattern, text));
}

function hasLiteralCue(cues, text) {
  const lower = String(text || '').toLowerCase();
  return cues.some(cue => {
    const literal = String(cue || '').toLowerCase().trim();
    if (!literal) return false;
    const escaped = escapeRegExp(literal);
    const startsWord = /^[a-z0-9]/.test(literal);
    const endsWord = /[a-z0-9]$/.test(literal);
    const pattern = `${startsWord ? '(?:^|[^a-z0-9])' : ''}${escaped}${endsWord ? '(?=$|[^a-z0-9])' : ''}`;
    return new RegExp(pattern, 'i').test(lower);
  });
}

function normalizedForAttribution(text) {
  return (text || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}


function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractQuotedSegments(sentence) {
  const text = sentence || '';
  const segments = [];
  const patterns = [
    /“([^”]{1,280})”/g,
    /"([^"]{1,280})"/g,
    /‘([^’]{1,220})’/g
  ];
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ text: match[1], start: match.index, end: match.index + match[0].length });
    }
  });
  return segments;
}

function quoteBoundaryInfo(sentence, matches) {
  const segments = extractQuotedSegments(sentence);
  if (!segments.length || !matches || !matches.length) return { hasQuotedMatch: false, quotedSegments: [] };
  const lowerSegments = segments.map(seg => ({ ...seg, lower: seg.text.toLowerCase() }));
  const quotedSegments = [];

  matches.forEach(rule => {
    const matched = (rule.matched_text || '').toLowerCase().replace(/[“”"‘’]/g, '').trim();
    if (!matched) return;
    const matchedWords = matched.split(/\s+/).filter(w => w.length > 3);
    lowerSegments.forEach(seg => {
      const segWords = seg.lower.split(/\s+/).filter(w => w.length > 3);
      const segmentHasMatch = seg.lower.includes(matched) || matched.includes(seg.lower) || matchedWords.some(w => seg.lower.includes(w)) || segWords.some(w => matched.includes(w));
      if (segmentHasMatch) quotedSegments.push(seg.text);
    });
  });

  return { hasQuotedMatch: quotedSegments.length > 0, quotedSegments: unique(quotedSegments) };
}

function hasAttributionCarryover(sentence, contextWindow) {
  const s = normalizedForAttribution(sentence).toLowerCase();
  const w = normalizedForAttribution(contextWindow).toLowerCase();
  const startsAsList = /^\s*(among them|examples include|these include|including)\b/.test(s);
  const priorSaidCue = /\b(things|comments|statements|remarks|views|quotes)\b[^.!?]{0,120}\b(he|she|they)(?:'s|\s+has|\s+had|\s+have)?\s+(said|written|posted|claimed|argued|streamed)\b/.test(w);
  const namedSaidCue = /\b[A-Z][A-Za-z.-]+(?:\s+[A-Z][A-Za-z.-]+){0,2}(?:'s)?\s+(?:years|comments|statements|remarks|views|streaming)\b/i.test(contextWindow) && /\b(things|comments|statements|remarks|views|quotes)\b/.test(w);
  const colonQuoteCue = /\b(he|she|they|[A-Z][A-Za-z.-]+)\s+(has\s+also\s+said|has\s+said|had\s+said|said|wrote|writes|published|stated|states|claimed|argued|called)\b\s*:/.test(normalizedForAttribution(contextWindow));
  return (startsAsList && (priorSaidCue || namedSaidCue)) || colonQuoteCue;
}

function detectSentenceStance(sentence, contextWindow, matches = []) {
  const s = sentence.toLowerCase();
  const w = contextWindow.toLowerCase();

  const quoteInfo = quoteBoundaryInfo(sentence, matches);

  const answeredYesAfterQuestion = /\?\s*(yes|yes\.|yes,|yes —|yes -|because\b|i answer yes|my answer is yes|that is true|it is true)\b/i.test(contextWindow);
  const answeredNoAfterQuestion = /\?\s*(no|no\.|no,|no —|no -|i answer no|my answer is no|that is false|it is false|not true)\b/i.test(contextWindow);
  if (/\?\s*$/.test(sentence.trim()) && answeredYesAfterQuestion) {
    return {
      stance: "Direct claim",
      note: "The mapped question is immediately answered affirmatively, so the expression is treated as adopted by the writer."
    };
  }
  if (/\?\s*$/.test(sentence.trim()) && answeredNoAfterQuestion) {
    return {
      stance: "Quoted / rejected claim",
      note: "The mapped question is immediately answered negatively, so it is not treated as the writer's endorsed claim."
    };
  }

  const accusatoryQuestion = /\?\s*$/.test(sentence.trim()) && /\b(how|why)\s+(?:is|are|was|were|isn['’]?t|aren['’]?t|is\s+not|are\s+not)\b.{0,120}\b(israel|israeli state|jewish state|zionism|zionists?|idf)\b.{0,140}\b(apartheid|genocide|genocidal|ethnostate|ethno[- ]?state|settler[- ]?colonial|colonial|colonizer|coloniser|racist|racism|jewish supremacy|zionist supremacy|ethnic cleansing|nazi|zionazi|baby killers?|child killers?)\b/i.test(sentence) && !/\b(ask|asked|asking|wonder|wondered|whether|if|debate|debated|discuss|discussed|article|report|paper|study|class|course)\b/i.test(sentence);
  if (accusatoryQuestion) {
    return {
      stance: "Direct claim",
      note: "The mapped language appears in a rhetorical question phrased as an accusation."
    };
  }

  const isQuestionOnly = /\?\s*$/.test(sentence.trim());
  const inquiryCue = /\b(i|we)\s+(wonder|wondered|ask|asked|am asking|are asking)\b.{0,160}\b(whether|if)\b|\b(it is worth asking|worth asking)\b.{0,160}\b(whether|if)\b|\b(the question is|the question was|question is|question was)\b.{0,160}\b(whether|if)\b|\bnot claiming that\b|\bnot saying it is\b|\bnot saying that\b|\bi am not claiming\b|\bi am not saying\b/.test(w);
  if (isQuestionOnly || inquiryCue) {
    return {
      stance: "Ambiguous / needs review",
      note: "The mapped language appears in a question, inquiry, or explicit non-endorsement rather than as a direct claim."
    };
  }

  const directStandaloneChant = /^(?:\s*)(?:from the river to the sea|globalize the intifada|long live the intifada|there is only one solution|resistance is justified|we\s+(?:don['’]?t|do not)\s+want\s+(?:two|2)\s+states?|we\s+want\s+['’]?48|palestine is arab|we\s+(?:don['’]?t|do not)\s+want\s+zionists?\s+here|no\s+zionists?\s+here)/i.test(sentence.trim())
    && !/\b(article|report|paper|book|essay|study|describes|described|reported|reports|quoted|quotes|criticized|criticises|criticizes|rejected|rejects|opposes|opposed|condemns|condemned|said|says|claimed|claims|argued|argues|asked|asks|whether|if|according to|dangerous|harmful|violent|hateful|eliminationist|should not be chanted|shouldn['’]?t be chanted|bad slogan)\b/i.test(sentence);
  if (directStandaloneChant) {
    return {
      stance: "Direct claim",
      note: "The mapped slogan or chant appears directly, without reporting or rejection cues."
    };
  }

  const statehoodRemovalDirect = /\b(israel|the jewish state|jewish state)\b.{0,120}\b(should not|must not|cannot|has no right to|does not deserve to)\s+exist\b|\b(israel|the jewish state|jewish state)\b.{0,120}\b(stop|stops|stopped)\s+being\s+(a\s+)?jewish state\b/.test(s);
  const statehoodRemovalRejected = /\b(false|not true|wrong|lie|do not say|should not say|reject|condemn|oppose)\b.{0,160}\b(israel|the jewish state|jewish state)\b.{0,120}\b(should not|must not|cannot|has no right to|does not deserve to)\s+exist\b/.test(w);
  const statehoodRemovalAttributed = hasCue(REPORTING_PATTERNS, sentence) || /\b(said|says|claimed|claims|argued|argues|wrote|writes|posted|posts|streamed|streams|reported|reports|according to)\b/.test(s);
  if (statehoodRemovalDirect && !statehoodRemovalRejected && !statehoodRemovalAttributed) {
    return {
      stance: "Direct claim",
      note: "Denial of Israel or the Jewish state existing as such is treated as a direct statehood-removal claim, not as a generic negation."
    };
  }

  const agreementCue = /\b(i|we)\s+agree\b|\bi answer yes\b|\bmy answer is yes\b|\bi agree with (him|her|them|it|that|both|both claims)\b|\b(agree|agrees|agreed)\s+(that|with)\b|\b(i|we)\s+(endorse|support|accept|condone|approve|affirm|embrace|back)\b|\b(i|we)\s+stand\s+by\b|\b(endorse|endorses|endorsed|support|supports|supported|accept|accepts|accepted|condone|condones|condoned|approve|approves|approved|affirm|affirms|affirmed|back|backs|backed)\s+(it|that|the claim|the statement|the accusation|the slogan|the chant)\b|\bit is correct\b|\bit is true\b|\bthe accusation is true\b|\bthat is correct\b|\bthat is true\b|\bthis is correct\b|\bthis is true\b|\b(they|both)\s+(are|were)\s+(right|correct)\b|\bthey['’]?re\s+(right|correct)\b|\bhonestly\b.{0,60}\b(right|correct|true)\b|\bthey\s+(are|were)\s+both\s+(right|correct)\b|\bboth claims\s+(are|were)\s+(right|correct|true)\b|\b(he|she|they)\s+(is|are)\s+right\b|\b(i|we)\s+support\s+(the sign|the slogan|the chant|it|that)\b|\b(is|was) true\b|\bendorses? it\b|\bendorses? the claim\b|\bsupports? it\b|\bthe claim is true\b|\bthe phrase[^.!?]{0,80}is true\b|\bthe slogan[^.!?]{0,80}is true\b|(?:^|[.!?]\s*)(correct|right)\.?\s*$/i.test(w);
  const reportedClaimCue = /\b(one speaker|a speaker|the speaker|critics|supporters|activists|protesters|scholars|commentators|professors|students|opponents|some people|many people|people|he|she|they|piker|owens|hass|levy|sfard|hamas|the author|the article|the report|the post|the essay|the speaker|my mother|my mom|my father|my dad|my grandmother|my grandma|my grandfather|my grandpa|my friend)\s+(keep\s+saying|say|says|said|argue|argues|argued|claim|claims|claimed|call|called|wrote|writes|posted|posts|thinks|believes|quotes|quoted)\b|\b[A-Z][A-Za-z.-]+(?:\s+[A-Z][A-Za-z.-]+){0,3}\s+(said|says|wrote|writes|argued|argues|claimed|claims|posted|posts|streamed|streams)\b|\b(the phrase|the slogan|the claim|the accusation|the allegation|the sign|sign read|sign reads|the author quotes|the article quotes|asks whether|asked whether|question is whether|quote:)\b/i.test(contextWindow);
  const adoptsReportedClaim = agreementCue && reportedClaimCue;
  if (adoptsReportedClaim) {
    return {
      stance: "Direct claim",
      note: "The writer adopts an attributed or quoted mapped claim with agreement language nearby."
    };
  }

  if (/\bfalse flag\b/.test(s) && /\b(israel|zionis(m|t|ts)|idf|mossad)\b/.test(s)) {
    return {
      stance: "Direct claim",
      note: "False-flag wording is treated as a conspiracy claim, not as rejection merely because it contains the word false."
    };
  }

  if (/\b(the )?holocaust\b.{0,80}\b(never happened|fake|hoax|myth|exaggerated|fabricated)\b|\bholocaust hoax\b/.test(s) && !/\b(false|wrong|lie|myth is false|hoax is false|denial is wrong)\b/.test(s) && !/\b(the phrase|the slogan|appeared|example of|lesson)\b/.test(s)) {
    return {
      stance: "Direct claim",
      note: "Holocaust-denial wording in the current sentence is treated as the writer's direct statement unless the sentence itself rejects it."
    };
  }

  const directCurrentSentenceEarly = /\b(i|we)\s+(argue|believe|conclude|maintain|contend|adopt|endorse)\b|\b(our position|my position|the correct position)\s+is\b|\b(this essay|this article|this post|this paper|this piece)\s+(argues|concludes|shows|demonstrates|adopts)\b|\btherefore\b|\bthus\b|\bwe must\b/.test(s) && !hasCue(REPORTING_PATTERNS, s) && !/\b(said|says|claimed|claims|argued|argues|reported|reports|quoted|quotes|wrote|writes|posted|posts|streamed|streams)\b/.test(s);
  if (directCurrentSentenceEarly) {
    return {
      stance: "Direct claim",
      note: "The matched language appears in the writer’s own sentence with direct endorsement or argument language."
    };
  }

  const directHasbaraDismissal = /\b(antisemitic|antisemitism|anti[- ]semitism|jewish safety|hostage posters?|hostage story|october 7)\b.{0,120}\b(zionist\s+)?hasbara\b|\bcalling\s+it\s+antisemitic\b.{0,120}\bhasbara\b/i.test(sentence);
  if (directHasbaraDismissal) {
    return {
      stance: "Direct claim",
      note: "Hasbara wording is used to dismiss antisemitism, Jewish safety, hostage, or October 7 concerns."
    };
  }

  const directResistanceNotTerrorism = /\bresistance\s+is\s+not\s+terrorism\b.{0,140}\b(zionists?|israel|israeli state|jewish state|idf|zionist entity)\b|\b(zionists?|israel|israeli state|jewish state|idf|zionist entity)\b.{0,140}\bresistance\s+is\s+not\s+terrorism\b/i.test(sentence) && !/\b(reject|rejected|condemn|condemned|false|wrong|not true|do not agree|don['’]?t agree|oppose|opposed)\b/i.test(contextWindow);
  if (directResistanceNotTerrorism) {
    return {
      stance: "Direct claim",
      note: "Resistance-not-terrorism wording is used directly against Zionists/Israel."
    };
  }

  const mixedReportedThenAdopted = /\b(article|report|paper|post|someone|critics|activists|students|speaker)\b.{0,160}\b(discussed|quoted|reported|called|said|claimed|argued)\b.{0,220}\b(but|and)\b.{0,80}\b(i|we)\s+(think|believe|agree|say|argue)\b.{0,140}\b(really\s+do|do|are|is|control|own|run|dictate|silence|bought|true|right|correct)\b/i.test(contextWindow);
  if (mixedReportedThenAdopted) {
    return {
      stance: "Direct claim",
      note: "The sentence reports or discusses a mapped expression, then appears to adopt a mapped claim with the writer’s own agreement language."
    };
  }

  const directLobbyControl = /\b(aipac|zionist lobby|israel lobby|pro[- ]israel lobby|zionist donors?|pro[- ]israel donors?)\b.{0,100}\b(write|writes|wrote|dictate|dictates|decide|decides|shape|shapes|own|owns|control|controls|buy|buys|bought|capture|captures)\b.{0,100}\b(laws?|policy|foreign policy|campus policy|speech|media|universities|congress|elections?)\b/i.test(sentence) && !/\b(according to|reported|reports|said|says|say|claimed|claims|argued|argues|critics|wrote in|writes in|article|report|does not mean|do not think|don['’]?t think|lie|false|wrong|not true|reject|rejected|debunk|debunked|conspiracy theory|trope)\b/i.test(sentence);
  if (directLobbyControl) {
    return {
      stance: "Direct claim",
      note: "Lobby/control wording is used as the writer’s own claim, not as a report."
    };
  }


  const directHiddenPowerControl = /\b(?:donor\s+class|powerful\s+few|powerful\s+donors?|the\s+lobby|a\s+lobby)\b.{0,180}\b(?:steer|steers|control|controls|run|runs|own|owns|dictate|dictates|buy|buys|bought|silence|silences|capture|captures)\b.{0,120}\b(?:government|congress|media|news|universit(?:y|ies)|campus|politics|policy|elections?)\b/i.test(sentence)
    && !/\b(?:according to|reported|reports|said|says|claimed|claims|argued|argues|article|report|study|criticized|criticises|criticizes|rejected|rejects|false|wrong|not true|debunk|debunked|conspiracy theory|trope)\b/i.test(sentence);
  if (directHiddenPowerControl) {
    return {
      stance: "Direct claim",
      note: "Hidden-power or donor-control wording is used as the writer’s own claim."
    };
  }

  const overrideHit = OVERRIDE_PATTERNS.some(pattern => testRegex(pattern, w));
  const rejectionHit = overrideHit || hasLiteralCue(REJECTION_CUES, w);
  if (rejectionHit) {
    return {
      stance: "Quoted / rejected claim",
      note: "Nearby wording looks like quotation, rejection, debunking, non-endorsement, nonviolence, or anti-targeting language."
    };
  }

  const firstPersonFreePalestine = false;
  if (firstPersonFreePalestine) {
    return {
      stance: "Direct claim",
      note: "The writer uses or joins the mapped slogan directly, even if the same sentence also contains other policy context."
    };
  }

  const directCurrentSentence = hasCue(DIRECT_ADOPTION_PATTERNS, s);
  if (directCurrentSentence) {
    return {
      stance: "Direct claim",
      note: "The matched language appears in the writer’s own sentence with direct endorsement or argument language."
    };
  }

  const descriptiveMappedMention = /\b(article|report|paper|book|essay|study|studies|studied|examines|examined|describes|described|discussion|debate|glossary|history|term|phrase|concept|accusation|accusations|allegation|allegations|label|used against|applied to|directed at|definition|defined|lecture|class|course|academic|research|scholarship)\b/i.test(s) && !agreementCue && !/\b(is true|are true|that is true|this is true|right|correct|i agree|we agree|i endorse|we endorse|i support the claim|we support the claim)\b/i.test(w);
  if (descriptiveMappedMention) {
    return {
      stance: "Reported claim",
      note: "The mapped language appears in descriptive, academic, reporting, or term-discussion context rather than as the writer’s endorsed claim."
    };
  }

  const attributionCarryover = hasAttributionCarryover(sentence, contextWindow);
  const reportingHit = attributionCarryover || hasCue(REPORTING_PATTERNS, sentence) || /["“”\'‘’]/.test(sentence) && /\b(slogan|phrase|claim|chant|quote|quoted|said|comments|statements|remarks|views)\b/.test(w);
  if (reportingHit) {
    return {
      stance: "Reported claim",
      note: "The matched language is attributed to another person, group, article, report, slogan, or source."
    };
  }

  if (quoteInfo.hasQuotedMatch) {
    return {
      stance: "Ambiguous / needs review",
      note: `A mapped phrase appears inside quotation marks (${quoteInfo.quotedSegments.map(q => '“' + q + '”').join(', ')}). The app will not assign it to the author without clearer endorsement cues.`
    };
  }

  const directHit = !/\b(according to|said|says|claimed|claims|argued|argues|reported|reports|quoted|quotes|wrote|writes|posted|posts|streamed|streams|described|describes|examined|examines|summarized|summarizes)\b/.test(s);
  if (directHit) {
    return {
      stance: "Direct claim",
      note: "No clear reporting or rejection cue was found near the matched language. Treat as the writer’s direct claim unless human review shows otherwise."
    };
  }

  return {
    stance: "Ambiguous / needs review",
    note: "The app cannot reliably tell whether the writer endorses the matched language. Human review is needed."
  };
}

function cleanSourceLabel(raw) {
  if (!raw) return '';
  return raw
    .replace(/[“”"'‘’]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(the|an|a)\s+/i, '$1 ')
    .trim()
    .replace(/[,:;.-]+$/, '');
}

function firstCapture(patterns, text) {
  for (const pattern of patterns) {
    try {
      const match = text.match(new RegExp(pattern, 'i'));
      if (match && match[1]) return cleanSourceLabel(match[1]);
    } catch (err) {
      console.warn('Bad source pattern', pattern, err);
    }
  }
  return '';
}

function detectAttributionSource(sentence, contextWindow, stance) {
  const sourcePatterns = [
    "\\b((?:my|our|his|her|their)\\s+(?:mother|mom|father|dad|parent|parents|grandmother|grandma|grandfather|grandpa|sister|brother|friend|teacher|professor|classmate|student|coworker|neighbor|uncle|aunt|cousin|wife|husband|partner))\\s+(?:thinks|think|believes|believe|says|said|writes|wrote|posted|posts|tweeted|tweets|streamed|streams|published|stated|states|claims|claimed|argues|argued|calls|called|considers|considered|describes|described)\\b",
    "\\b(someone|some people|many people|critics|activists|some activists|students|professors|scholars|commentators)\\s+(?:think|thinks|believe|believes|say|said|write|writes|wrote|post|posts|posted|tweet|tweets|tweeted|stream|streams|streamed|published|state|states|stated|claim|claimed|argue|argued|call|called)\\b",
    "\\baccording to\\s+([^,.!?;:]{2,80})",
    "\\b([A-Z][A-Za-z.-]+(?:\\s+[A-Z][A-Za-z.-]+){0,3})\\s+(?:suggests|suggested|thinks|thought|believes|believed|says|said|writes|wrote|posted|posts|tweeted|tweets|streamed|streams|published|stated|states|claims|claimed|argues|argued|alleges|alleged)\\b",
    "\\b([A-Z][A-Za-z.-]+(?:\\s+[A-Z][A-Za-z.-]+){0,2})[’']s\\s+(?:years|comments|statements|remarks|views|streaming)\\b",
    "\\b([A-Z][A-Za-z.-]+(?:\\s+[A-Z][A-Za-z.-]+){0,2})\\s+(?:has\\s+also\\s+said|has\\s+said|had\\s+said|said|claimed|argued|called)\\b",
    "\\b(critics|activists|protesters|students|scholars|historians|commentators|opponents|supporters)\\s+(?:said|say|wrote|write|writes|published|stated|state|states|argued|argue|claimed|claim|alleged|allege|accused|accuse|called|call)\\b",
    "\\b((?:the|an|a)\\s+(?:article|report|paper|book|essay|speech|speaker|author|historian|professor|group|organization))\\s+(?:said|says|wrote|writes|published|stated|states|argued|argues|claimed|claims|reported|reports|described|describes|summarized|summarizes|examined|examines|cited|cites|called|calls)\\b",
    "\\b((?:slogan|phrase|chant|claim|idea|accusation|allegation))\\b.*\\b(?:said|used|reported|described|quoted|called|criticized|discussed)\\b"
  ];

  if (stance === 'Reported claim' || stance === 'Quoted / rejected claim') {
    const combined = normalizedForAttribution(`${sentence} ${contextWindow}`);
    const source = firstCapture(sourcePatterns, combined);
    if (source && /\bPiker\b/.test(source)) return /\bHasan Piker\b/.test(combined) ? 'Hasan Piker' : 'Piker';
    if (source && /\bStreamer\b/i.test(source) && /\bPiker[’']s years\b|\bthings\s+he[’']s\s+said\b/i.test(combined)) return /\bHasan Piker\b/.test(combined) ? 'Hasan Piker' : 'Piker';
    if (source) return source;
    if (/\bHasan Piker\b/.test(combined)) return 'Hasan Piker';
    if (/\bPiker\b/.test(combined)) return 'Piker';
    if (/\bhe\s+(?:has\s+also\s+said|has\s+said|said|claimed|argued|called)\b/i.test(combined)) return 'the person being discussed';
    return 'another speaker/source';
  }

  if (stance === 'Direct claim') return 'the author';
  return 'unclear / needs human review';
}

function speakerLineFor(item) {
  const fragments = unique(item.matches.map(m => (m.matched_text || '').trim()).filter(Boolean));
  const quotedText = fragments.length ? fragments.map(f => `“${f}”`).join(', ') : `“${item.sentence}”`;
  const source = detectAttributionSource(item.sentence, item.contextWindow || item.sentence, item.stance);

  if (item.stance === 'Direct claim') {
    return `Who says what: Author says ${quotedText}.`;
  }
  if (item.stance === 'Reported claim') {
    return `Who says what: Author reports/refers to what ${source} said or argued: ${quotedText}.`;
  }
  if (item.stance === 'Quoted / rejected claim') {
    if (source && source !== 'another speaker/source') {
      return `Who says what: Author quotes, mentions, criticizes, or rejects what ${source} said or argued: ${quotedText}.`;
    }
    return `Who says what: Author quotes, mentions, criticizes, or rejects the referenced claim: ${quotedText}.`;
  }
  return `Who says what: Unclear who endorses ${quotedText}; human review needed.`;
}


function statementTextFor(item) {
  const fragments = unique(item.matches.map(m => (m.matched_text || '').trim()).filter(Boolean));
  return fragments.length ? fragments.map(f => `“${f}”`).join(', ') : `“${item.sentence}”`;
}

function writerRoleForStance(stance) {
  if (stance === 'Direct claim') return 'directly saying it';
  if (stance === 'Reported claim') return 'reporting / referring to it';
  if (stance === 'Quoted / rejected claim') return 'quoting / rejecting it';
  return 'unclear';
}

function whoSaysLabel(item) {
  const source = detectAttributionSource(item.sentence, item.contextWindow || item.sentence, item.stance);
  if (item.stance === 'Direct claim') return 'Author';
  if (item.stance === 'Reported claim') return source || 'Another speaker/source';
  if (item.stance === 'Quoted / rejected claim') return source && source !== 'another speaker/source' ? source : 'Referenced claim';
  return 'Unclear';
}

function resultReasonForStance(stance) {
  if (stance === 'Direct claim') return 'Kept as a direct claim because no clear reporting or rejection cue was found nearby.';
  if (stance === 'Reported claim') return 'Attribution preserved: the language is classified, but the writer is not treated as the speaker.';
  if (stance === 'Quoted / rejected claim') return 'Attribution preserved: the language is classified, but the writer may be quoting, rejecting, debunking, or criticizing it.';
  return 'Needs review because the app cannot clearly tell who is endorsing the phrase.';
}


function resultLabelForSeverity(severity, matches = []) {
  if (severity === 'None') return 'No exact antizionist map hit';
  if (severity === 'Adjacent' || matchSetKind(matches) === 'adjacent') return 'Antizionism-adjacent Jew-hatred risk';
  if (isContextSeverity(severity)) return 'Context-only / human review';
  const tier = antizionistTier(matches) || 'A-medium';
  return `Antizionist pattern detected — ${tier}`;
}

function shortSentence(sentence, limit = 260) {
  const clean = (sentence || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  return clean.slice(0, limit - 1).trimEnd() + '…';
}

function bucketLabelFor(item) {
  if (item.stance === 'Direct claim') return 'Author';
  if (item.stance === 'Reported claim') return 'Attributed to others';
  if (item.stance === 'Quoted / rejected claim') return 'Quoted / rejected';
  return 'Unclear / needs review';
}

function buildSpeakerBuckets(sentenceAnalyses) {
  const buckets = {
    author: [],
    attributed: [],
    rejected: [],
    unclear: []
  };

  sentenceAnalyses.forEach(item => {
    const entry = {
      speaker: whoSaysLabel(item),
      role: writerRoleForStance(item.stance),
      stance: item.stance,
      result: resultLabelForSeverity(item.base_severity, item.matches),
      severity: item.base_severity,
      statement: statementTextFor(item),
      sentence: item.sentence,
      triggers: unique(item.matches.map(m => m.name)),
      categories: unique(item.matches.map(m => m.category))
    };

    if (item.stance === 'Direct claim') buckets.author.push(entry);
    else if (item.stance === 'Reported claim') buckets.attributed.push(entry);
    else if (item.stance === 'Quoted / rejected claim') buckets.rejected.push(entry);
    else buckets.unclear.push(entry);
  });

  return buckets;
}

function formatBucketEntry(entry) {
  const triggerText = entry.triggers.length ? entry.triggers.join(', ') : 'mapped phrase';
  return `• ${entry.speaker}: ${entry.result} (${entry.severity})\n  Statement: ${entry.statement}\n  Sentence: “${shortSentence(entry.sentence)}”\n  Why: ${entry.role}; matched ${triggerText}.`;
}

function formatSpeakerBuckets(buckets) {
  const sections = [];
  if (buckets.author.length) {
    sections.push(`AUTHOR’S OWN MAPPED STATEMENTS\n${buckets.author.map(formatBucketEntry).join('\n\n')}`);
  } else {
    sections.push('AUTHOR’S OWN MAPPED STATEMENTS\n• No direct author antizionist mapped claim found.');
  }

  if (buckets.attributed.length) {
    sections.push(`ATTRIBUTED TO OTHERS\n${buckets.attributed.map(formatBucketEntry).join('\n\n')}`);
  } else {
    sections.push('ATTRIBUTED TO OTHERS\n• No reported mapped claim found.');
  }

  if (buckets.rejected.length) {
    sections.push(`QUOTED / REJECTED / CRITICIZED\n${buckets.rejected.map(formatBucketEntry).join('\n\n')}`);
  } else {
    sections.push('QUOTED / REJECTED / CRITICIZED\n• No quoted or rejected mapped claim found.');
  }

  if (buckets.unclear.length) {
    sections.push(`UNCLEAR / NEEDS REVIEW\n${buckets.unclear.map(formatBucketEntry).join('\n\n')}`);
  }

  return sections.join('\n\n');
}

function formatSubjectExpressionGrades(buckets) {
  const attributed = (buckets && buckets.attributed) || [];
  const rejected = (buckets && buckets.rejected) || [];
  const unclear = (buckets && buckets.unclear) || [];

  const lines = [];

  if (attributed.length) {
    lines.push('ATTRIBUTED EXPRESSION GRADE');
    attributed.forEach(entry => {
      lines.push(`• ${entry.speaker}: ${entry.result} (${entry.severity})`);
      lines.push(`  Expression graded: ${entry.statement}`);
      lines.push('  Assigned to writer: No — writer is reporting/referring to this expression.');
    });
  }

  if (rejected.length) {
    if (lines.length) lines.push('');
    lines.push('QUOTED / REJECTED EXPRESSION GRADE');
    rejected.forEach(entry => {
      lines.push(`• ${entry.speaker}: ${entry.result} (${entry.severity})`);
      lines.push(`  Expression graded: ${entry.statement}`);
      lines.push('  Assigned to writer: No — writer quotes, rejects, criticizes, or debunks it.');
    });
  }

  if (unclear.length) {
    if (lines.length) lines.push('');
    lines.push('UNCLEAR EXPRESSION GRADE');
    unclear.forEach(entry => {
      lines.push(`• ${entry.speaker}: ${entry.result} (${entry.severity})`);
      lines.push(`  Expression graded: ${entry.statement}`);
      lines.push('  Assigned to writer: Unclear — human review needed.');
    });
  }

  if (!lines.length) {
    return 'No reported, quoted, rejected, or unclear flagged expression found. If the writer states the flagged phrase directly, the grade appears as the main writer grade above.';
  }

  return lines.join('\n');
}


function normalizeName(name) {
  return (name || '').replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
}

function isSloganOrConceptSubject(name) {
  const n = normalizeName(name).toLowerCase();
  const blocked = new Set([
    'free palestine', 'from the river to the sea', 'globalize the intifada',
    'decolonize palestine', 'anti-zionism', 'antizionism', 'zionism',
    'zionist entity', 'jewish state', 'israel', 'palestine', 'gaza',
    'west bank', 'east jerusalem', 'al aqsa flood', 'al-aqsa flood',
    'october 7', 'netanyahu', 'idf', 'aipac', 'adl', 'hillel', 'chabad'
  ]);
  if (blocked.has(n)) return true;
  if (/^(free|from|globalize|decolonize|end|ban|boycott|no|one|all)\b/i.test(name)) return true;
  if (/\b(palestine|zionism|zionist|israel|jewish state|intifada|apartheid|genocide|occupation)\b/i.test(name) && name.split(/\s+/).length <= 4) return true;
  return false;
}

function detectBylineAuthor(text) {
  const raw = (text || '').replace(/\r/g, '');
  const patterns = [
    /^\s*By[ \t]+([A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?(?:[ \t]+[A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?){1,3})\b/m,
    /\n\s*By[ \t]+([A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?(?:[ \t]+[A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?){1,3})\b/m,
    /\n\s*([A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?(?:[ \t]+[A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?){1,3})\s*\n\s*By[ \t]+\1\b/m,
    /\n\s*([A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?(?:[ \t]+[A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?){1,3})\s*\n\s*Opinion Columnist\b/m
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match && match[1]) return normalizeName(match[1]);
  }
  return '';
}

function detectNameCandidates(text, bylineAuthor) {
  const raw = text || '';
  const stop = new Set([
    'New York Times', 'The New York Times', 'Opinion Columnist', 'Site Index', 'Site Information', 'Privacy Policy', 'Cookie Policy', 'Terms Of Service', 'Terms Of Sale', 'Your Privacy Choices', 'Google Drive', 'OpenAI', 'SKIP ADVERTISEMENT', 'Jewish Americans', 'Older Americans', 'New York Times Opinion', 'Home Screen', 'Add To Home', 'Free Palestine', 'From The River', 'From The River To The Sea', 'Anti Zionism', 'Anti-Zionism', 'Zionist Entity', 'Jewish State', 'Globalize The Intifada', 'Decolonize Palestine'
  ]);
  const matches = raw.match(/\b[A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?(?:[ \t]+[A-Z][A-Za-z]+(?:[-’'][A-Z][A-Za-z]+)?){1,3}\b/g) || [];
  const counts = new Map();
  matches.forEach(name => {
    let clean = normalizeName(name).replace(/\b(D\.S\.A|M\.M\.A)\b/g, '').trim();
    clean = clean.replace(/^(Senators|Senator|Representatives|Representative|Gov|Governor|Mr|Mrs|Ms|Dr|Professor)\s+/i, '').trim();
    if (!clean || stop.has(clean)) return;
    if (/^(After|That|This|But|Among|Yes|No|If|It|Is|And|For|Of|In|On|By|The|A|An|Advertisement|Final|Subscribe|Related Content|Editors Picks|SKIP ADVERTISEMENT)\b/.test(clean)) return;
    if (bylineAuthor && clean === bylineAuthor) return;
    if (isSloganOrConceptSubject(clean)) return;
    counts.set(clean, (counts.get(clean) || 0) + 1);
  });

  const textLower = raw.toLowerCase();
  const scored = [...counts.entries()].map(([name, baseCount]) => {
    const last = name.split(/\s+/).slice(-1)[0].replace(/[^A-Za-z-]/g, '');
    const lastCount = last && last.length > 3 ? (textLower.match(new RegExp('\\b' + escapeRegExp(last.toLowerCase()) + '\\b', 'g')) || []).length : 0;
    return { name, count: baseCount + lastCount };
  });

  return scored.sort((a, b) => b.count - a.count).map(item => item.name);
}

function detectDocumentRoles(text, buckets) {
  const bylineAuthor = detectBylineAuthor(text);
  const subjectCandidates = detectNameCandidates(text, bylineAuthor).slice(0, 5);
  const attributedSpeakers = unique([...buckets.attributed, ...buckets.rejected]
    .map(entry => entry.speaker)
    .filter(name => name && !/^Author$|^Referenced claim$|^Unclear/i.test(name)));
  const directAuthorCount = buckets.author.length;
  return {
    byline_author: bylineAuthor || 'Not detected',
    likely_subjects: subjectCandidates,
    attributed_speakers: attributedSpeakers,
    direct_author_count: directAuthorCount,
    note: 'Author-vs-subject mode separates the byline writer’s own mapped statements from claims attributed to people being discussed or quoted.'
  };
}

function formatDocumentRoles(roles) {
  return [
    `Byline author: ${roles.byline_author}`,
    `Likely named subject(s)/sources: ${roles.likely_subjects.length ? roles.likely_subjects.join(', ') : 'Not detected'}`,
    `Attributed / quoted speakers: ${roles.attributed_speakers.length ? roles.attributed_speakers.join(', ') : 'None detected'}`,
    `Author’s own mapped items: ${roles.direct_author_count}`,
    `Mode: ${roles.note}`
  ].join('\n');
}

function topSummaryFromBuckets(buckets, hasTriggers) {
  if (!hasTriggers) return 'No antizionism detected.';
  const authorAdjacent = buckets.author.filter(entry => entry.severity === 'Adjacent' || entry.result === 'Jew-hatred possible');
  const authorHighOrFlagged = buckets.author.filter(entry => severityRank[entry.severity] >= severityRank.Medium && entry.severity !== 'Adjacent');
  const authorContext = buckets.author.filter(entry => severityRank[entry.severity] < severityRank.Medium);
  const speakers = unique([...buckets.attributed, ...buckets.rejected].map(entry => entry.speaker).filter(Boolean));

  if (authorHighOrFlagged.length) {
    const first = authorHighOrFlagged[0];
    const also = speakers.length ? ` Also found flagged language attributed to: ${speakers.join(', ')}.` : '';
    return `The writer uses antizionist language: ${first.statement}.${also}`;
  }
  if (authorAdjacent.length) {
    const first = authorAdjacent[0];
    const also = speakers.length ? ` Also found flagged language attributed to: ${speakers.join(', ')}.` : '';
    return `This depends on use: ${first.statement}.${also}`;
  }
  const strongAttributed = [...buckets.attributed, ...buckets.rejected].filter(entry => severityRank[entry.severity] >= severityRank.Medium && entry.severity !== 'Adjacent');
  if (strongAttributed.length) {
    const who = unique(strongAttributed.map(entry => entry.speaker).filter(Boolean));
    return `The text contains antizionist language attributed to or quoted from: ${who.length ? who.join(', ') : 'another source'}.`;
  }
  if (authorContext.length) {
    const first = authorContext[0];
    const also = speakers.length ? ` Also found flagged language attributed to: ${speakers.join(', ')}.` : '';
    return `The writer uses context-dependent antizionist language: ${first.statement}.${also}`;
  }
  if (speakers.length) {
    return `The writer is not treated as saying it directly. The flagged language is attributed to or quoted from: ${speakers.join(', ')}.`;
  }
  return 'Context Dependent / Human Review: the app found antizionist language, but who is saying it needs review.';
}

function resultReasonFromBuckets(buckets, stance) {
  if (buckets.author.some(entry => severityRank[entry.severity] >= severityRank.Medium && entry.severity !== 'Adjacent')) {
    return 'Direct antizionist language in the pasted text.';
  }
  if (buckets.author.some(entry => entry.severity === 'Adjacent' || entry.result === 'Jew-hatred possible')) {
    return 'This depends on use: review surrounding words, repetition, and any paired claim.';
  }
  if (buckets.author.length) {
    return 'Context Dependent / Human Review. Human review is needed before treating it as direct antizionist language.';
  }
  const strongAttributed = [...buckets.attributed, ...buckets.rejected].some(entry => severityRank[entry.severity] >= severityRank.Medium && entry.severity !== 'Adjacent');
  if (strongAttributed) {
    return 'Antizionist language found, with attribution preserved. The writer is not treated as the speaker unless the text adopts it.';
  }
  if (buckets.attributed.length || buckets.rejected.length) {
    return 'Reported or quoted expression. The writer is not treated as endorsing it.';
  }
  return resultReasonForStance(stance);
}

function succinctSentenceReview(item) {
  return [
    `Sentence: “${item.sentence}”`,
    `Who says it: ${whoSaysLabel(item)}`,
    `Writer’s role: ${writerRoleForStance(item.stance)}`,
    `Statement mentioned: ${statementTextFor(item)}`,
    `Why this result: ${resultReasonForStance(item.stance)}`
  ].join('\n');
}

function mainReviewSummary(sentenceAnalyses) {
  if (!sentenceAnalyses.length) return 'No flagged sentence found.';
  return sentenceAnalyses.map((item, index) => `Sentence ${index + 1}\n${succinctSentenceReview(item)}`).join('\n\n');
}

function topSummaryLine(sentenceAnalyses, hasTriggers) {
  if (!hasTriggers || !sentenceAnalyses.length) return 'No antizionism detected.';
  const direct = sentenceAnalyses.find(item => item.stance === 'Direct claim');
  const rejected = sentenceAnalyses.find(item => item.stance === 'Quoted / rejected claim');
  const reported = sentenceAnalyses.find(item => item.stance === 'Reported claim');
  const ambiguous = sentenceAnalyses.find(item => item.stance === 'Ambiguous / needs review');
  const item = direct || rejected || reported || ambiguous || sentenceAnalyses[0];
  if (item.stance === 'Direct claim') return `The writer directly says: ${statementTextFor(item)}.`;
  if (item.stance === 'Reported claim') return `The writer reports what ${whoSaysLabel(item)} said: ${statementTextFor(item)}.`;
  if (item.stance === 'Quoted / rejected claim') return `The writer quotes, mentions, criticizes, or rejects what ${whoSaysLabel(item)} said: ${statementTextFor(item)}.`;
  return `The app found ${statementTextFor(item)}, but who endorses it is unclear.`;
}

function whyMattersFor(hasTriggers, stance, matches = []) {
  if (!hasTriggers) {
    return 'No antizionism detected. The app checks specific antizionist language, not every sentence about Israel, Jews, or Palestinians.';
  }

  if (stance === 'Reported claim') {
    return 'This matters because the text attributes the language to someone else. The app classifies the antizionist language while separating it from the writer’s own voice.';
  }

  if (stance === 'Quoted / rejected claim') {
    return 'This matters because quoted, rejected, condemned, or debunked language is not the same as endorsement. The app keeps the antizionist classification visible while preserving attribution.';
  }

  if (stance === 'Ambiguous / needs review') {
    return 'The app found mapped language but cannot reliably tell who endorses it. Human review is needed before treating the text as direct antizionist language.';
  }

  if (matchSetKind(matches) === 'adjacent') {
    return 'This may be Jew-hatred, but it is not core antizionist language unless the text ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, Jewish institutions, antizionist libels, or antizionist chants.';
  }

  const tier = antizionistTier(matches) || 'A-medium';
  if (tier === 'A-low') {
    return 'Some slogans can function as antizionist signals while still requiring context. The app does not treat this the same as elimination, conspiracy, exclusion, or libel language.';
  }
  if (tier === 'A-medium') {
    return 'The text uses antizionist language that treats Zionism, Israel, or Jewish national existence as illegitimate, without reaching the strongest libel, conspiracy, exclusion, violence, or replacement categories.';
  }
  if (tier === 'A-high') {
    return 'The text uses high-risk antizionist language: libel, conspiracy, exclusion, Jewish-institution targeting, Zionism/Nazi inversion, or demonizing language aimed at Israel, Zionism, Zionists, Israelis, or Jewish national existence.';
  }
  if (tier === 'A-critical') {
    return 'The text reaches the most severe antizionist category: elimination, replacement, dismantling, or violence-escalation language tied to antizionism.';
  }

  return 'The app treats antizionism as its own source category: a culture of libels, slogans, exclusion, and targeting tied to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or Jewish institutions.';
}


function adoptionFollows(sentences, index) {
  const next = (sentences || []).slice(index + 1, index + 3).join(' ').toLowerCase();
  if (!next.trim()) return false;
  if (/\b(i|we)\s+(disagree|reject|oppose|condemn|do not agree|don't agree|don’t agree)\b|\b(that|this|the claim|the statement|the slogan|the chant)\s+(is|was)\s+(wrong|false|hateful|dangerous|disgusting|repugnant|abhorrent)\b|\bfalse\b|\bnot true\b|\bnot accurate\b|\bnever justified\b/.test(next)) return false;
  return /\b(i|we)\s+agree\b|\bi agree with\s+(him|her|them|that|it|both|both claims)\b|\b(i|we)\s+(endorse|support|accept|condone|approve|affirm|embrace|back)\s+(the claim|the statement|the accusation|the slogan|the chant|it|that)\b|\b(i|we)\s+stand\s+by\s+(the claim|the statement|the accusation|the slogan|the chant|it|that)\b|\b(my view is that|our view is that)\s+(they|both)\s+(are|were)\s+both\s+(right|correct)\b|\b(they|both)\s+(are|were)\s+both\s+(right|correct)\b|\b(they|both)\s+(are|were)\s+(right|correct)\b|\b(correct|right)\.?\s*$|\b(that|this|the claim|the statement|the accusation|the slogan|the chant)\s+(is|was)\s+(right|correct|true)\b|\bthe claim is true\b|\bthe accusation is true\b/.test(next);
}

function contextualStatehoodBeliefRuleFor(sentence) {
  const source = String(sentence || '');
  const match = source.match(/\b(?:do|does|did)\s+not\s+think\s+(?:that\s+)?(?:israel|the\s+jewish\s+state|jewish\s+state)\s+should\s+exist\b/i)
    || source.match(/\b(?:don[’']?t|doesn[’']?t|didn[’']?t)\s+think\s+(?:that\s+)?(?:israel|the\s+jewish\s+state|jewish\s+state)\s+should\s+exist\b/i);
  if (!match) return null;
  return {
    name: 'Israel should not exist reported belief',
    matched_text: match[0],
    category: 'Israel elimination / replacement language',
    severity: 'Critical',
    output: 'Flag',
    family: 'Israel elimination / replacement language',
    subtype: 'Jewish statehood denial / no-right-to-exist belief construction',
    anchor_type: 'Jewish statehood anchor',
    scope_status: 'Core antizionist language',
    internal_category: 'Jewish statehood denial / no-right-to-exist belief construction'
  };
}


function analyzeSentences(text) {
  const sentences = splitSentences(text);
  const analyses = [];

  sentences.forEach((sentence, index) => {
    const contextWindow = [sentences[index - 2] || '', sentences[index - 1] || '', sentence, sentences[index + 1] || '', sentences[index + 2] || ''].join(' ');
    const contextualWashing = contextualWashingRuleFor(sentence, contextWindow);
    const contextualReply = contextualReplyRuleFor(sentence, contextWindow);
    const contextualStatehoodBelief = contextualStatehoodBeliefRuleFor(sentence);
    const contextMatches = [contextualWashing, contextualReply, contextualStatehoodBelief].filter(Boolean);
    const matches = contextMatches.length ? [...rulesForText(sentence), ...contextMatches] : rulesForText(sentence);
    if (!matches.length) return;

    let stanceInfo = detectSentenceStance(sentence, contextWindow, matches);
    if (stanceInfo.stance !== 'Direct claim' && adoptionFollows(sentences, index)) {
      stanceInfo = { stance: 'Direct claim', note: 'The writer adopts the attributed or quoted mapped expression in the following sentence.' };
    }
    analyses.push({ sentence, index, contextWindow, matches, base_severity: maxSeverity(matches), ...stanceInfo });
  });

  return analyses;
}

function categoryReason(categories) {
  const joined = categories.join(' | ').toLowerCase();
  if (joined.includes('antizionism-adjacent')) {
    return 'the matched rule concerns a classic Jew-hatred trope that can overlap with antizionism, but needs an Israel/Zionism anchor before it becomes a direct antizionist language';
  }
  if (joined.includes('statehood') || joined.includes('replacement') || joined.includes('removal') || joined.includes('existence')) {
    return 'the matched rule concerns denial, removal, or replacement of Jewish national existence';
  }
  if (joined.includes('colonial') || joined.includes('settler') || joined.includes('occup')) {
    return 'the matched rule concerns the antizionist political register of occupier, colonial, settler-colonial, or illegitimate-statehood language';
  }
  if (joined.includes('genocide') || joined.includes('apartheid') || joined.includes('ethnic cleansing') || joined.includes('supremacy')) {
    return 'the matched rule concerns the antizionist libel register of genocide, apartheid, ethnic-cleansing, or supremacy language';
  }
  if (joined.includes('holocaust') || joined.includes('nazi')) {
    return 'the matched rule concerns Holocaust inversion used against Israel, Zionism, Zionists, or the Jewish state';
  }
  if (joined.includes('control') || joined.includes('money') || joined.includes('puppet')) {
    return 'the matched rule concerns an older Jew-hatred trope repackaged through Zionist, Israel, lobby, or Jewish-institution-targeting language';
  }
  if (joined.includes('violence') || joined.includes('resistance') || joined.includes('intifada')) {
    return 'the matched rule concerns violence, resistance, escalation, or civilian-harm justification tied to Israel/Zionism context';
  }
  if (joined.includes('exclusion') || joined.includes('normalization') || joined.includes('boycott')) {
    return 'the matched rule concerns exclusion, anti-normalization, boycott, or social exclusion of Zionists / Israel-linked Jewish institutions';
  }
  if (joined.includes('institution') || joined.includes('synagogue') || joined.includes('hillel') || joined.includes('diaspora')) {
    return 'the matched rule concerns Jewish institutions or diaspora Jews targeted within an antizionist language';
  }
  if (joined.includes('dehuman') || joined.includes('slur')) {
    return 'the matched rule concerns dehumanizing or slur language tied to Zionists/Israelis';
  }
  if (joined.includes('blockade') || joined.includes('protest') || joined.includes('context')) {
    return 'the matched rule is context-sensitive and may be reporting, quoted language, ordinary protest wording, or antizionist rhetoric depending on use';
  }
  return 'the sentence includes flagged antizionist rhetoric';
}

function sentenceExplanation(item) {
  const triggers = unique(item.matches.map(m => m.name));
  const categories = unique(item.matches.map(m => m.category));
  const categoryWhy = categoryReason(categories);
  return [
    succinctSentenceReview(item),
    `Trigger terms: ${triggers.join(', ')}`,
    `Base severity: ${item.base_severity}`,
    `Why it matters here: ${categoryWhy}.`
  ].join('\n');
}

function buildDetailedReview(sentenceAnalyses) {
  if (!sentenceAnalyses.length) return 'No flagged sentence found.';
  return sentenceAnalyses.map((item, index) => `Sentence ${index + 1}\n${sentenceExplanation(item)}`).join('\n\n');
}

function combineStance(sentenceAnalyses) {
  if (!sentenceAnalyses.length) return { stance: "No matched claim", note: "No flagged language was found." };

  const authorItems = sentenceAnalyses.filter(item => item.stance === "Direct claim");
  const attributedItems = sentenceAnalyses.filter(item => item.stance === "Reported claim");
  const rejectedItems = sentenceAnalyses.filter(item => item.stance === "Quoted / rejected claim");
  const unclearItems = sentenceAnalyses.filter(item => item.stance === "Ambiguous / needs review");

  if (authorItems.length) {
    const authorSeverity = maxSeverity(authorItems.flatMap(item => item.matches));
    if (authorSeverity === "Adjacent") {
      return { stance: "Author adjacent-risk claim", note: "The author uses antizionism-adjacent Jew-hatred language, but the text does not itself supply a clear Israel/Zionism anchor." };
    }
    if (severityRank[authorSeverity] >= severityRank["Medium"]) {
      return { stance: "Author direct claim", note: "At least one flagged sentence is the author’s own statement. Attributed and quoted material is separated below." };
    }
    return { stance: "Author context-level claim", note: "The author has context-level flagged language. Stronger claims, if any, are separated as attributed or quoted material." };
  }

  if (unclearItems.length) {
    return { stance: "Ambiguous / needs review", note: "Flagged language appeared, but the writer’s stance is unclear." };
  }
  if (rejectedItems.length && !attributedItems.length) {
    return { stance: "Quoted / rejected claim", note: "The matched language is quoted, rejected, criticized, or debunked." };
  }
  return { stance: "Reported claim", note: "The matched language is attributed to someone else rather than stated directly by the author." };
}


function mergeRuleMatches(lists) {
  const seen = new Set();
  const merged = [];
  (lists || []).flat().filter(Boolean).forEach(rule => {
    const key = `${rule.name || ''}|${rule.category || ''}|${rule.matched_text || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(rule);
  });
  return merged;
}


function publicRuleFamily(rule) {
  return (rule && (rule.family || rule.category || rule.internal_category || '') || '').trim();
}

function publicRuleFamilies(matches) {
  return unique((matches || []).map(publicRuleFamily).filter(Boolean));
}

function internalRuleCategories(matches) {
  return unique((matches || []).map(m => (m.internal_category || m.category || '').trim()).filter(Boolean));
}

function hiddenAnchorTypes(matches) {
  return unique((matches || []).map(m => (m.anchor_type || '').trim()).filter(Boolean));
}

function hiddenScopeStatuses(matches) {
  return unique((matches || []).map(m => (m.scope_status || '').trim()).filter(Boolean));
}

function analyze(text) {
  const normalized = (text || '').toLowerCase();
  if (!normalized.trim()) return null;

  const rawGlobalMatches = rulesForText(normalized);
  const rawSentenceAnalyses = analyzeSentences(text);
  const globalMatches = antizionismMatches(rawGlobalMatches);
  const sentenceAnalyses = rawSentenceAnalyses.map(item => ({
    ...item,
    matches: antizionismMatches(item.matches),
    base_severity: maxSeverity(antizionismMatches(item.matches))
  })).filter(item => item.matches.length);
  const allMatches = mergeRuleMatches([globalMatches, sentenceAnalyses.flatMap(item => item.matches)]);
  const endorsedMatches = mergeRuleMatches(sentenceAnalyses
    .filter(item => item.stance === "Direct claim")
    .flatMap(item => item.matches));
  // Controlling stance rule: mapped wording counts toward the result only when the author
  // states/adopts it affirmatively. Quoted, reported, rejected, descriptive, or unclear uses
  // remain visible for attribution but do not count as the author's antizionist language.
  const hasTriggers = endorsedMatches.length > 0;
  const hasObservedMappedLanguage = allMatches.length > 0;
  const stanceInfo = combineStance(sentenceAnalyses);
  const severity = hasTriggers ? maxSeverity(endorsedMatches) : "None";

  const result = resultFromSeverity(severity, hasTriggers, endorsedMatches);
  const speakerBuckets = buildSpeakerBuckets(sentenceAnalyses);
  const documentRoles = detectDocumentRoles(text, speakerBuckets);
  const nonEndorsedNote = hasObservedMappedLanguage && !hasTriggers
    ? "Mapped wording appears only as quoted, reported, rejected, descriptive, or attribution-unclear language. It is not counted as the author's antizionist language."
    : "";
  return {
    input_text: text,
    result_level: result.level,
    severity,
    severity_tier: result.tier || severity,
    result_text: result.text,
    trigger_terms: unique(endorsedMatches.map(m => m.name)),
    pattern_categories: publicRuleFamilies(endorsedMatches),
    internal_categories: internalRuleCategories(endorsedMatches),
    anchor_types: hiddenAnchorTypes(endorsedMatches),
    scope_statuses: hiddenScopeStatuses(endorsedMatches),
    observed_trigger_terms: unique(allMatches.map(m => m.name)),
    observed_pattern_categories: publicRuleFamilies(allMatches),
    observed_internal_categories: internalRuleCategories(allMatches),
    observed_anchor_types: hiddenAnchorTypes(allMatches),
    observed_scope_statuses: hiddenScopeStatuses(allMatches),
    non_endorsed_mapped_language: !!(hasObservedMappedLanguage && !hasTriggers),
    within_antizionism_criteria: hasTriggers ? antizionismCriteriaText(true, severity, endorsedMatches) : (hasObservedMappedLanguage ? 'No — mapped language not endorsed by the author' : 'No mapped pattern'),
    speaker_stance_detected: stanceInfo.stance,
    stance_note: stanceInfo.note,
    top_summary: hasTriggers ? topSummaryFromBuckets(speakerBuckets, true) : (nonEndorsedNote || "No endorsed antizionist language was found."),
    result_reason: hasTriggers ? resultReasonFromBuckets(speakerBuckets, stanceInfo.stance) : (nonEndorsedNote || "No endorsed antizionist language was found."),
    document_roles: documentRoles,
    document_roles_text: formatDocumentRoles(documentRoles),
    speaker_buckets: speakerBuckets,
    speaker_buckets_text: formatSpeakerBuckets(speakerBuckets),
    subject_expression_grade_text: formatSubjectExpressionGrades(speakerBuckets),
    why_matters: hasTriggers ? whyMattersFor(true, stanceInfo.stance, endorsedMatches) : (nonEndorsedNote || whyMattersFor(false, stanceInfo.stance, [])),
    explanation: hasTriggers ? explanationFor(result, severity, true, stanceInfo.stance, endorsedMatches) : (nonEndorsedNote || "No endorsed mapped antizionist phrase was found in this text."),
    review_note: "If this result is wrong, add a corrected label and reason in the Correction Log below.",
    matched_sentences: sentenceAnalyses.map(item => ({
      sentence: item.sentence,
      context_window: item.contextWindow,
      who_says_what: speakerLineFor(item),
      who_says_it: whoSaysLabel(item),
      writer_role: writerRoleForStance(item.stance),
      statement_mentioned: statementTextFor(item),
      stance: item.stance,
      base_severity: item.base_severity,
      triggers: unique(item.matches.map(m => m.name)),
      categories: publicRuleFamilies(item.matches),
      internal_categories: internalRuleCategories(item.matches),
      anchor_types: hiddenAnchorTypes(item.matches),
      scope_statuses: hiddenScopeStatuses(item.matches),
      matched_text: unique(item.matches.map(m => (m.matched_text || '').trim()).filter(Boolean)),
      explanation: sentenceExplanation(item)
    })),
    detailed_sentence_review: buildDetailedReview(sentenceAnalyses),
    css: result.css
  };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}


function hasMappedTriggers(data) {
  return !!(data && Array.isArray(data.trigger_terms) && data.trigger_terms.length);
}

function isPolicyFocusedText(raw) {
  const text = String(raw || '').toLowerCase();
  if (!text.trim()) return false;
  const hasPolicySubject = /\b(netanyahu|likud|knesset|coalition|government|minister|settlement|settlements|settlers|west bank|gaza war|rafah|military operation|airstrike|ceasefire|judicial reform|hostage deal|border|checkpoint|annexation|security cabinet|idf policy|rules of engagement|war conduct|civilian casualties|humanitarian aid)\b/.test(text);
  const hasPolicyVerb = /\b(oppose|support|criticize|criticise|object to|disagree with|vote|policy|policies|law|bill|decision|strategy|conduct|operation|expand|expansion|withdraw|negotiate|ceasefire|settle|settlements)\b/.test(text);
  return hasPolicySubject || (hasPolicyVerb && /\b(israel|israeli|idf|netanyahu|settlement|settlements|gaza|west bank)\b/.test(text));
}

function noMappedSummaryText(data) {
  if (data && data.non_endorsed_mapped_language) return 'No endorsed antizionism detected. Mapped wording is quoted, reported, rejected, descriptive, or unclear.';
  return isPolicyFocusedText(data && data.input_text) ? 'No antizionism detected. Policy-focused.' : 'No antizionism detected.';
}

function noMappedWhyText(data) {
  if (data && data.non_endorsed_mapped_language) return 'The mapped wording is not counted because the author does not clearly endorse, accept, condone, or adopt it.';
  return isPolicyFocusedText(data && data.input_text)
    ? 'Policy-focused text. No antizionism detected.'
    : 'No antizionism detected.';
}

function standaloneContextTerm(data) {
  if (data && Array.isArray(data.observed_trigger_terms) && data.observed_trigger_terms.length && !hasMappedTriggers(data)) return false;
  const raw = data && typeof data.input_text === 'string' ? data.input_text : '';
  const normalized = raw
    .toLowerCase()
    .replace(/[“”"'.!?]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const terms = new Set([
    'apartheid',
    'genocide',
    'colonizer',
    'coloniser',
    'ethnostate',
    'ethno-state',
    'occupation',
    'resistance',
    'decolonize',
    'imperialist',
    'supremacist',
    'hasbara',
    'bds',
    'open-air prison',
    'open-air-prison',
    'occupier',
    'free palestine',
    'free gaza',
    'free free palestine',
    'free free gaza',
    'medical apartheid',
    'vaccine apartheid',
    'water apartheid',
    'pinkwashing',
    'pink-washing',
    'greenwashing',
    'green-washing',
    'bluewashing',
    'blue-washing',
    'artwashing',
    'art-washing',
    'sportswashing',
    'sports-washing',
    'faithwashing',
    'faith-washing',
    'culture-washing',
    'culture washing',
    'academic-washing',
    'academic washing',
    'imperial state',
    'imperialist state',
    'colonial',
    'weapons testing',
    'surveillance testing',
    'greater israel',
    'jews are white',
    'jews are european',
    'jews as white',
    'jews as european'
  ]);

  return terms.has(normalized);
}

function standaloneNeutralDescriptor(data) {
  const raw = data && typeof data.input_text === 'string' ? data.input_text : '';
  const normalized = raw
    .toLowerCase()
    .replace(/[“”"'.!?]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return new Set(['zionist', 'zionists', 'zionism', 'antizionism', 'anti-zionism', 'anti zionism']).has(normalized);
}

function standaloneContextWhy() {
  return 'Context-sensitive terms require enough language to determine target and use. Quoted, reported, rejected, or merely discussed wording is not counted as the author’s endorsement.';
}

function publicAnswerLabel(data) {
  const tier = data && (data.severity_tier || data.severity || '');
  const result = data && data.result_text ? data.result_text : '';
  if (!data || !result) return 'PASTE TEXT TO ANALYZE';
  if (standaloneNeutralDescriptor(data)) return 'NO ANTIZIONISM DETECTED';
  if (standaloneContextTerm(data)) return 'ANTIZIONIST LANGUAGE FOUND';
  if (!hasMappedTriggers(data) || tier === 'D' || /no exact/i.test(result)) return 'NO ANTIZIONISM DETECTED';
  if (tier === 'C' || /context/i.test(result)) return 'ANTIZIONIST LANGUAGE FOUND';
  if (tier === 'B' || /adjacent/i.test(result) || /depends on use/i.test(result)) return 'NO ANTIZIONISM DETECTED';
  if (tier === 'A-high' || tier === 'A-critical') return 'STRONG ANTIZIONIST LANGUAGE';
  if (tier === 'A-low' || tier === 'A-medium' || /^A-/.test(tier)) return 'ANTIZIONIST LANGUAGE FOUND';
  return result.toUpperCase();
}

function publicAnswerBadge(data) {
  const tier = data && (data.severity_tier || data.severity || '');
  const result = data && data.result_text ? data.result_text : '';
  if (!data || !result) return 'Ready';
  if (standaloneNeutralDescriptor(data)) return 'No antizionism detected';
  if (standaloneContextTerm(data)) return 'Antizionist language found';
  if (!hasMappedTriggers(data) || tier === 'D' || /no exact/i.test(result)) return 'No antizionism detected';
  if (tier === 'C' || /context/i.test(result)) return 'Antizionist language found';
  if (tier === 'B' || /adjacent/i.test(result) || /depends on use/i.test(result)) return 'Jew-hatred possible';
  if (tier === 'A-high' || tier === 'A-critical') return 'Strong antizionist language';
  return 'Antizionist language found';
}

function cleanMatchSnippet(value) {
  return String(value || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}


const EDUCATIONAL_SCREEN_WORDING = {
  "from the river to the sea": {
    "term": "From the river to the sea",
    "type": "Israel elimination / replacement language",
    "meaning": "This names the whole land between the Jordan River and the Mediterranean Sea, including Israel.",
    "why": "This names the whole land between the Jordan River and the Mediterranean Sea, including Israel. Hamas uses the same geography while rejecting recognition of Israel. The slogan asks the listener to picture that land with the Jewish state removed.",
    "more": "This names the whole land between the Jordan River and the Mediterranean Sea, including Israel. Hamas uses the same geography while rejecting recognition of Israel. The slogan asks the listener to picture that land with the Jewish state removed.",
    "bottom": "This is antizionist language."
  },
  "we don t want two states we want 48": {
    "term": "We don’t want two states, we want ’48",
    "type": "Israel elimination / replacement language",
    "meaning": "This rejects partition and points back before Israel’s founding.",
    "why": "This rejects partition and points back before Israel’s founding. It does not object to one border, leader, settlement, or law. It asks for the condition that existed before there was a Jewish state.",
    "more": "This rejects partition and points back before Israel’s founding. It does not object to one border, leader, settlement, or law. It asks for the condition that existed before there was a Jewish state.",
    "bottom": "This is antizionist language."
  },
  "no israel in our lifetime": {
    "term": "No Israel in our lifetime",
    "type": "Israel elimination / replacement language",
    "meaning": "The slogan says Israel should not survive.",
    "why": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "more": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "bottom": "This is antizionist language."
  },
  "there is no such thing as israel": {
    "term": "There is no such thing as Israel",
    "type": "Israel elimination / replacement language",
    "meaning": "The slogan says Israel should not survive.",
    "why": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "more": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "bottom": "This is antizionist language."
  },
  "israel does not exist": {
    "term": "Israel does not exist",
    "type": "Israel elimination / replacement language",
    "meaning": "The slogan says Israel should not survive.",
    "why": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "more": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "bottom": "This is antizionist language."
  },
  "israel isn t real": {
    "term": "Israel isn’t real",
    "type": "Israel elimination / replacement language",
    "meaning": "The slogan says Israel should not survive.",
    "why": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "more": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "bottom": "This is antizionist language."
  },
  "israel is not real": {
    "term": "Israel is not real",
    "type": "Israel elimination / replacement language",
    "meaning": "The slogan says Israel should not survive.",
    "why": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "more": "The slogan says Israel should not survive. It does not ask for ceasefire, withdrawal, reform, or equal civil rights. It says the Jewish state should end while the chanters are alive.",
    "bottom": "This is antizionist language."
  },
  "israel out of palestine": {
    "term": "Israel out of Palestine",
    "type": "Israel elimination / replacement language",
    "why": "“Israel out of Palestine” points beyond policy-focused text toward replacing or undoing Israel as a Jewish state.",
    "more": "This language appears in rejectionist and protest vocabularies that treat Israel as a political object to be removed, replaced, or denied normal country status. Chants such as “from the river to the sea” and “we want ’48” carry this meaning in antizionist movement settings.",
    "bottom": "This is antizionist language."
  },
  "palestine is arab": {
    "term": "Palestine is Arab",
    "type": "Israel elimination / replacement language",
    "why": "“Palestine is Arab” points beyond policy-focused text toward replacing or undoing Israel as a Jewish state.",
    "more": "This language appears in rejectionist and protest vocabularies that treat Israel as a political object to be removed, replaced, or denied normal country status. Chants such as “from the river to the sea” and “we want ’48” carry this meaning in antizionist movement settings.",
    "bottom": "This is antizionist language."
  },
  "globalize the intifada": {
    "term": "Globalize the intifada",
    "type": "Intifada / violence-escalation language",
    "meaning": "This takes intifada language beyond Israel.",
    "why": "This takes intifada language beyond Israel. The Second Intifada meant suicide bombings, shootings, stabbings, buses, cafés, nightclubs, and Israeli civilians murdered. “Globalize” tells that violence to travel outward toward Jews, Israelis, and Zionists.",
    "more": "This takes intifada language beyond Israel. The Second Intifada meant suicide bombings, shootings, stabbings, buses, cafés, nightclubs, and Israeli civilians murdered. “Globalize” tells that violence to travel outward toward Jews, Israelis, and Zionists.",
    "bottom": "This is antizionist language."
  },
  "there is only one solution intifada revolution": {
    "term": "There is only one solution / Intifada revolution",
    "type": "Intifada / violence-escalation language",
    "meaning": "This joins “solution” to intifada.",
    "why": "This joins “solution” to intifada. It offers revolt against Israel in place of coexistence or compromise. The slogan gives Jews one answer: no Jewish national future there.",
    "more": "This joins “solution” to intifada. It offers revolt against Israel in place of coexistence or compromise. The slogan gives Jews one answer: no Jewish national future there.",
    "bottom": "This is antizionist language."
  },
  "long live the intifada": {
    "term": "Long live the intifada",
    "type": "Intifada / violence-escalation language",
    "meaning": "This praises the intifada as something that should continue.",
    "why": "This praises the intifada as something that should continue. For Israelis, that word carries buses blown apart, cafés attacked, families killed, and civilians hunted. The chant does not remember the victims; it salutes the violence.",
    "more": "This praises the intifada as something that should continue. For Israelis, that word carries buses blown apart, cafés attacked, families killed, and civilians hunted. The chant does not remember the victims; it salutes the violence.",
    "bottom": "This is antizionist language."
  },
  "resistance is justified": {
    "term": "Resistance is justified",
    "type": "Resistance / violence-shielding language",
    "why": "“Resistance is justified” can justify or soften violence when tied to Israel, Zionism, Israelis, or the IDF.",
    "more": "In antizionist chants and campaigns, resistance language often appears beside intifada, decolonization, occupation, and liberation slogans. If the text is about violence against Israelis, Jews, Zionists, or the IDF, it should be treated more severely.",
    "bottom": "Context Dependent / Human Review unless the target is clear."
  },
  "resistance now": {
    "term": "Resistance now",
    "type": "Resistance / violence-shielding language",
    "why": "“Resistance now” can justify or soften violence when tied to Israel, Zionism, Israelis, or the IDF.",
    "more": "In antizionist chants and campaigns, resistance language often appears beside intifada, decolonization, occupation, and liberation slogans. If the text is about violence against Israelis, Jews, Zionists, or the IDF, it should be treated more severely.",
    "bottom": "Context Dependent / Human Review unless the target is clear."
  },
  "by any means necessary": {
    "term": "By any means necessary",
    "type": "Resistance / violence-shielding language",
    "why": "“By any means necessary” can justify or soften violence when tied to Israel, Zionism, Israelis, or the IDF.",
    "more": "In antizionist chants and campaigns, resistance language often appears beside intifada, decolonization, occupation, and liberation slogans. If the text is about violence against Israelis, Jews, Zionists, or the IDF, it should be treated more severely.",
    "bottom": "Context Dependent / Human Review unless the target is clear."
  },
  "death to the idf": {
    "term": "Death to the IDF",
    "type": "Anti-IDF death slogan / violence endorsement",
    "why": "“Death to the IDF” is a direct death slogan aimed at the Israeli military.",
    "more": "This is not policy-focused text about a military action. It uses death-language against the IDF/IOF as a target, which places it in the violence-endorsement lane of antizionist language.",
    "bottom": "This is strong antizionist language."
  },
  "death to iof": {
    "term": "Death to IOF",
    "type": "Anti-IDF death slogan / violence endorsement",
    "why": "“Death to IOF” is a direct death slogan aimed at the Israeli military.",
    "more": "This is not policy-focused text about a military action. It uses death-language against the IDF/IOF as a target, which places it in the violence-endorsement lane of antizionist language.",
    "bottom": "This is strong antizionist language."
  },
  "bds": {
    "term": "BDS",
    "type": "Boycott / anti-normalization pressure",
    "meaning": "BDS began as a 2005 boycott, divestment, and sanctions call against Israel.",
    "why": "BDS began as a 2005 boycott, divestment, and sanctions call against Israel. Its demands include refugee “return,” meaning millions of Palestinian descendants entering Israel. That would end Israel as a Jewish state by numbers, not argument.",
    "more": "BDS began as a 2005 boycott, divestment, and sanctions call against Israel. Its demands include refugee “return,” meaning millions of Palestinian descendants entering Israel. That would end Israel as a Jewish state by numbers, not argument.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "free gaza": {
    "term": "Free Gaza",
    "type": "Palestine liberation slogan",
    "why": "“Free Gaza” is a liberation slogan whose meaning depends on surrounding language.",
    "more": "Within protest culture, this wording often appears near river-to-sea, intifada, decolonization, and anti-normalization chants. Alone, it should remain context-dependent; with replacement or violence language, it becomes core antizionist.",
    "bottom": "Context Dependent / Human Review."
  },
  "free palestine": {
    "term": "Free Palestine",
    "type": "Palestine liberation slogan",
    "meaning": "The phrase sounds like a chant for liberation, but here it calls for the destruction of the Jewish state.",
    "why": "The phrase sounds like a chant for liberation, but here it calls for the destruction of the Jewish state. “Free” means no Israel. It turns Palestinian freedom into Israel’s erasure.",
    "more": "The phrase sounds like a chant for liberation, but here it calls for the destruction of the Jewish state. “Free” means no Israel. It turns Palestinian freedom into Israel’s erasure.",
    "bottom": "Context Dependent / Human Review."
  },
  "palestine will be free": {
    "term": "Palestine will be free",
    "type": "Palestine liberation slogan",
    "why": "“Palestine will be free” is a liberation slogan whose meaning depends on surrounding language.",
    "more": "Within protest culture, this wording often appears near river-to-sea, intifada, decolonization, and anti-normalization chants. Alone, it should remain context-dependent; with replacement or violence language, it becomes core antizionist.",
    "bottom": "Context Dependent / Human Review."
  },
  "liberate palestine": {
    "term": "Liberate Palestine",
    "type": "Palestine liberation slogan",
    "why": "“Liberate Palestine” is a liberation slogan whose meaning depends on surrounding language.",
    "more": "Within protest culture, this wording often appears near river-to-sea, intifada, decolonization, and anti-normalization chants. Alone, it should remain context-dependent; with replacement or violence language, it becomes core antizionist.",
    "bottom": "Context Dependent / Human Review."
  },
  "end the occupation": {
    "term": "End the occupation",
    "type": "Occupation / liberation slogan",
    "why": "“End the occupation” uses occupation/liberation language that depends on territory and end-state.",
    "more": "The wording can be policy-focused if it refers to a specific disputed territory or policy. It becomes antizionist when it uses “occupation” to mean Israel’s existence as a country, or when paired with replacement, intifada, or decolonization slogans.",
    "bottom": "Context Dependent / Human Review."
  },
  "occupation is a crime": {
    "term": "Occupation is a crime",
    "type": "Occupation / liberation slogan",
    "why": "“Occupation is a crime” uses occupation/liberation language that depends on territory and end-state.",
    "more": "The wording can be policy-focused if it refers to a specific disputed territory or policy. It becomes antizionist when it uses “occupation” to mean Israel’s existence as a country, or when paired with replacement, intifada, or decolonization slogans.",
    "bottom": "Context Dependent / Human Review."
  },
  "occupier": {
    "term": "Occupier",
    "type": "Occupation / liberation slogan",
    "meaning": "Occupation is a legal term for control of territory in war.",
    "why": "Occupation is a legal term for control of territory in war. Used for all of Israel, not disputed territory, it says Jews are trespassers. The word moves the target from 1967 to 1948.",
    "more": "Occupation is a legal term for control of territory in war. Used for all of Israel, not disputed territory, it says Jews are trespassers. The word moves the target from 1967 to 1948.",
    "bottom": "Context Dependent / Human Review."
  },
  "israeli occupier": {
    "term": "Israeli occupier",
    "type": "Occupation / liberation slogan",
    "meaning": "Occupation is a legal term for control of territory in war.",
    "why": "Occupation is a legal term for control of territory in war. Used for all of Israel, not disputed territory, it says Jews are trespassers. The word moves the target from 1967 to 1948.",
    "more": "Occupation is a legal term for control of territory in war. Used for all of Israel, not disputed territory, it says Jews are trespassers. The word moves the target from 1967 to 1948.",
    "bottom": "Context Dependent / Human Review."
  },
  "zionist occupier": {
    "term": "Zionist occupier",
    "type": "Occupation / liberation slogan",
    "meaning": "Occupation is a legal term for control of territory in war.",
    "why": "Occupation is a legal term for control of territory in war. Used for all of Israel, not disputed territory, it says Jews are trespassers. The word moves the target from 1967 to 1948.",
    "more": "Occupation is a legal term for control of territory in war. Used for all of Israel, not disputed territory, it says Jews are trespassers. The word moves the target from 1967 to 1948.",
    "bottom": "Context Dependent / Human Review."
  },
  "colonizer": {
    "term": "Colonizer",
    "type": "Colonial / decolonization language",
    "why": "“Colonizer” places Israel/Zionism inside colonizer or settler-colonial language.",
    "more": "This line runs through Palestinian and Arab nationalist antizionist writing, including Fayez Sayegh’s Zionist Colonialism in Palestine, and through later campus/decolonial vocabularies. It casts Israel as a colonial project rather than a Jewish nation-state.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "colonial": {
    "term": "Colonial",
    "type": "Colonial / decolonization language",
    "why": "“Colonial” places Israel/Zionism inside colonizer or settler-colonial language.",
    "more": "This line runs through Palestinian and Arab nationalist antizionist writing, including Fayez Sayegh’s Zionist Colonialism in Palestine, and through later campus/decolonial vocabularies. It casts Israel as a colonial project rather than a Jewish nation-state.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "settler colonial": {
    "term": "Settler-colonial",
    "type": "Colonial / decolonization language",
    "meaning": "This term comes from studies of European settlement on Indigenous land.",
    "why": "This term comes from studies of European settlement on Indigenous land. Applied to Israel, it casts Jews as Europeans planted in someone else’s country. It cuts Jews away from Hebrew, Jerusalem, Jewish law, exile, return, and continuous Jewish life in the land.",
    "more": "This term comes from studies of European settlement on Indigenous land. Applied to Israel, it casts Jews as Europeans planted in someone else’s country. It cuts Jews away from Hebrew, Jerusalem, Jewish law, exile, return, and continuous Jewish life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "settler colonizer": {
    "term": "Settler-colonizer",
    "type": "Colonial / decolonization language",
    "meaning": "This term comes from studies of European settlement on Indigenous land.",
    "why": "This term comes from studies of European settlement on Indigenous land. Applied to Israel, it casts Jews as Europeans planted in someone else’s country. It cuts Jews away from Hebrew, Jerusalem, Jewish law, exile, return, and continuous Jewish life in the land.",
    "more": "This term comes from studies of European settlement on Indigenous land. Applied to Israel, it casts Jews as Europeans planted in someone else’s country. It cuts Jews away from Hebrew, Jerusalem, Jewish law, exile, return, and continuous Jewish life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "settler colonialist entity": {
    "term": "Settler-Colonialist Entity",
    "type": "Colonial / decolonization language",
    "meaning": "This term comes from studies of European settlement on Indigenous land.",
    "why": "This term comes from studies of European settlement on Indigenous land. Applied to Israel, it casts Jews as Europeans planted in someone else’s country. It cuts Jews away from Hebrew, Jerusalem, Jewish law, exile, return, and continuous Jewish life in the land.",
    "more": "This term comes from studies of European settlement on Indigenous land. Applied to Israel, it casts Jews as Europeans planted in someone else’s country. It cuts Jews away from Hebrew, Jerusalem, Jewish law, exile, return, and continuous Jewish life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "decolonize": {
    "term": "Decolonize",
    "type": "Colonial / decolonization language",
    "meaning": "This takes anti-colonial language and points it at Jewish national life.",
    "why": "This takes anti-colonial language and points it at Jewish national life. It does not ask for coexistence, two states, or equal rights. It calls for Israel to be destroyed and replaced.",
    "more": "This takes anti-colonial language and points it at Jewish national life. It does not ask for coexistence, two states, or equal rights. It calls for Israel to be destroyed and replaced.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "decolonize palestine": {
    "term": "Decolonize Palestine",
    "type": "Colonial / decolonization language",
    "meaning": "This takes anti-colonial language and points it at Jewish national life.",
    "why": "This takes anti-colonial language and points it at Jewish national life. It does not ask for coexistence, two states, or equal rights. It calls for Israel to be destroyed and replaced.",
    "more": "This takes anti-colonial language and points it at Jewish national life. It does not ask for coexistence, two states, or equal rights. It calls for Israel to be destroyed and replaced.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "zio imperialist": {
    "term": "Zio-Imperialist",
    "type": "Colonial / decolonization language",
    "why": "“Zio-Imperialist” places Israel/Zionism inside colonizer or settler-colonial language.",
    "more": "This line runs through Palestinian and Arab nationalist antizionist writing, including Fayez Sayegh’s Zionist Colonialism in Palestine, and through later campus/decolonial vocabularies. It casts Israel as a colonial project rather than a Jewish nation-state.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "imperialist": {
    "term": "Imperialist",
    "type": "Colonial / decolonization language",
    "why": "“Imperialist” places Israel/Zionism inside colonizer or settler-colonial language.",
    "more": "This line runs through Palestinian and Arab nationalist antizionist writing, including Fayez Sayegh’s Zionist Colonialism in Palestine, and through later campus/decolonial vocabularies. It casts Israel as a colonial project rather than a Jewish nation-state.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "imperial state": {
    "term": "Imperial state",
    "type": "Colonial / decolonization language",
    "why": "“Imperial state” places Israel/Zionism inside colonizer or settler-colonial language.",
    "more": "This line runs through Palestinian and Arab nationalist antizionist writing, including Fayez Sayegh’s Zionist Colonialism in Palestine, and through later campus/decolonial vocabularies. It casts Israel as a colonial project rather than a Jewish nation-state.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "crusader state": {
    "term": "Crusader State",
    "type": "Colonial / decolonization language",
    "why": "“Crusader State” places Israel/Zionism inside colonizer or settler-colonial language.",
    "more": "This line runs through Palestinian and Arab nationalist antizionist writing, including Fayez Sayegh’s Zionist Colonialism in Palestine, and through later campus/decolonial vocabularies. It casts Israel as a colonial project rather than a Jewish nation-state.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "western settler project": {
    "term": "Western settler project",
    "type": "Colonial / decolonization language",
    "why": "“Western settler project” places Israel/Zionism inside colonizer or settler-colonial language.",
    "more": "This line runs through Palestinian and Arab nationalist antizionist writing, including Fayez Sayegh’s Zionist Colonialism in Palestine, and through later campus/decolonial vocabularies. It casts Israel as a colonial project rather than a Jewish nation-state.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "western satellite": {
    "term": "Western satellite",
    "type": "Western proxy / imperial outpost language",
    "why": "“Western satellite” casts Israel as a foreign Western implant or proxy state.",
    "more": "This language treats Israel less as a country with its own people and history than as a satellite, outpost, puppet, or colonial extension of Western power. It overlaps with anti-Western, Arab nationalist, Soviet/Russian, and Western-left antizionist traditions.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "western outpost": {
    "term": "Western outpost",
    "type": "Western proxy / imperial outpost language",
    "why": "“Western outpost” casts Israel as a foreign Western implant or proxy state.",
    "more": "This language treats Israel less as a country with its own people and history than as a satellite, outpost, puppet, or colonial extension of Western power. It overlaps with anti-Western, Arab nationalist, Soviet/Russian, and Western-left antizionist traditions.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "us puppet": {
    "term": "US-Puppet",
    "type": "Western proxy / imperial outpost language",
    "why": "“US-Puppet” casts Israel as a foreign Western implant or proxy state.",
    "more": "This language treats Israel less as a country with its own people and history than as a satellite, outpost, puppet, or colonial extension of Western power. It overlaps with anti-Western, Arab nationalist, Soviet/Russian, and Western-left antizionist traditions.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "israel as western satellite state": {
    "term": "Israel as Western satellite state",
    "type": "Western proxy / imperial outpost language",
    "why": "“Israel as Western satellite state” casts Israel as a foreign Western implant or proxy state.",
    "more": "This language treats Israel less as a country with its own people and history than as a satellite, outpost, puppet, or colonial extension of Western power. It overlaps with anti-Western, Arab nationalist, Soviet/Russian, and Western-left antizionist traditions.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "imperial outpost": {
    "term": "Imperial outpost",
    "type": "Western proxy / imperial outpost language",
    "why": "“Imperial outpost” casts Israel as a foreign Western implant or proxy state.",
    "more": "This language treats Israel less as a country with its own people and history than as a satellite, outpost, puppet, or colonial extension of Western power. It overlaps with anti-Western, Arab nationalist, Soviet/Russian, and Western-left antizionist traditions.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "american colony": {
    "term": "American colony",
    "type": "Western proxy / imperial outpost language",
    "why": "“American colony” casts Israel as a foreign Western implant or proxy state.",
    "more": "This language treats Israel less as a country with its own people and history than as a satellite, outpost, puppet, or colonial extension of Western power. It overlaps with anti-Western, Arab nationalist, Soviet/Russian, and Western-left antizionist traditions.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "apartheid": {
    "term": "Apartheid",
    "type": "Apartheid accusation",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "apartheid state": {
    "term": "Apartheid State",
    "type": "Apartheid accusation",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "apartheidist": {
    "term": "Apartheidist",
    "type": "Apartheid accusation",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "medical apartheid": {
    "term": "Medical apartheid",
    "type": "Apartheid accusation",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "vaccine apartheid": {
    "term": "Vaccine apartheid",
    "type": "Apartheid accusation",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "water apartheid": {
    "term": "Water apartheid",
    "type": "Apartheid accusation",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "israeli apartheid": {
    "term": "Israeli apartheid",
    "type": "Apartheid accusation",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "zionist apartheid": {
    "term": "Zionist apartheid",
    "type": "Apartheid accusation",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "genocide": {
    "term": "Genocide",
    "type": "Genocide accusation",
    "meaning": "Genocide is a legal crime requiring intent to destroy a protected people.",
    "why": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "more": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "genocidal state": {
    "term": "Genocidal state",
    "type": "Genocide accusation",
    "meaning": "Genocide is a legal crime requiring intent to destroy a protected people.",
    "why": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "more": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "israel is committing genocide": {
    "term": "Israel is committing genocide",
    "type": "Genocide accusation",
    "meaning": "Genocide is a legal crime requiring intent to destroy a protected people.",
    "why": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "more": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "zionist genocide": {
    "term": "Zionist genocide",
    "type": "Genocide accusation",
    "meaning": "Genocide is a legal crime requiring intent to destroy a protected people.",
    "why": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "more": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "genocide in gaza": {
    "term": "Genocide in Gaza",
    "type": "Genocide accusation",
    "meaning": "Genocide is a legal crime requiring intent to destroy a protected people.",
    "why": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "more": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "genocidaires": {
    "term": "Genocidaires",
    "type": "Israeli / Zionist collective demonization",
    "why": "“Genocidaires” labels Israelis, Zionists, or the IDF as inherently murderous or evil.",
    "more": "This family covers blanket labels such as baby-killer, child-killer, genocidaires, and similar terms when applied broadly to Israelis, Zionists, or the IDF rather than to a specific proven act.",
    "bottom": "This is antizionist language when used as a broad identity label."
  },
  "ethnostate": {
    "term": "Ethnostate",
    "type": "Ethnostate / supremacy accusation",
    "meaning": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech.",
    "why": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech. Applied to Israel, Hebrew, Jewish holidays, Jewish symbols, and Jewish immigration are treated as proof of racial rule. The double standard is the evidence: ordinary national features are made sinister when Jews have them.",
    "more": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech. Applied to Israel, Hebrew, Jewish holidays, Jewish symbols, and Jewish immigration are treated as proof of racial rule. The double standard is the evidence: ordinary national features are made sinister when Jews have them.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "ethno state": {
    "term": "Ethno-state",
    "type": "Ethnostate / supremacy accusation",
    "meaning": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech.",
    "why": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech. Applied to Israel, Hebrew, Jewish holidays, Jewish symbols, and Jewish immigration are treated as proof of racial rule. The double standard is the evidence: ordinary national features are made sinister when Jews have them.",
    "more": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech. Applied to Israel, Hebrew, Jewish holidays, Jewish symbols, and Jewish immigration are treated as proof of racial rule. The double standard is the evidence: ordinary national features are made sinister when Jews have them.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "jewish ethnostate": {
    "term": "Jewish ethnostate",
    "type": "Ethnostate / supremacy accusation",
    "meaning": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech.",
    "why": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech. Applied to Israel, Hebrew, Jewish holidays, Jewish symbols, and Jewish immigration are treated as proof of racial rule. The double standard is the evidence: ordinary national features are made sinister when Jews have them.",
    "more": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech. Applied to Israel, Hebrew, Jewish holidays, Jewish symbols, and Jewish immigration are treated as proof of racial rule. The double standard is the evidence: ordinary national features are made sinister when Jews have them.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "jewish supremacy": {
    "term": "Jewish supremacy",
    "type": "Ethnostate / supremacy accusation",
    "meaning": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination.",
    "why": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination. It claims Jewish safety, Jewish symbols, and Jewish majority life prove Jews seek power over others. It makes Jewish refuge and self-defense sound tyrannical.",
    "more": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination. It claims Jewish safety, Jewish symbols, and Jewish majority life prove Jews seek power over others. It makes Jewish refuge and self-defense sound tyrannical.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "zionist supremacy": {
    "term": "Zionist supremacy",
    "type": "Ethnostate / supremacy accusation",
    "meaning": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination.",
    "why": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination. It claims Jewish safety, Jewish symbols, and Jewish majority life prove Jews seek power over others. It makes Jewish refuge and self-defense sound tyrannical.",
    "more": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination. It claims Jewish safety, Jewish symbols, and Jewish majority life prove Jews seek power over others. It makes Jewish refuge and self-defense sound tyrannical.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "supremacist": {
    "term": "Supremacist",
    "type": "Ethnostate / supremacy accusation",
    "why": "“Supremacist” casts Israel/Jewish statehood as ethnic or racial supremacy.",
    "more": "This language treats the Jewish state as inherently supremacist or racially exclusionary. It overlaps with ethnostate, Jewish supremacy, Zionist supremacy, and related labels used to delegitimize Israel as a country.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "supremacist state": {
    "term": "Supremacist state",
    "type": "Ethnostate / supremacy accusation",
    "why": "“Supremacist state” casts Israel/Jewish statehood as ethnic or racial supremacy.",
    "more": "This language treats the Jewish state as inherently supremacist or racially exclusionary. It overlaps with ethnostate, Jewish supremacy, Zionist supremacy, and related labels used to delegitimize Israel as a country.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "zionist supremacist": {
    "term": "Zionist supremacist",
    "type": "Ethnostate / supremacy accusation",
    "meaning": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination.",
    "why": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination. It claims Jewish safety, Jewish symbols, and Jewish majority life prove Jews seek power over others. It makes Jewish refuge and self-defense sound tyrannical.",
    "more": "This phrase borrows the force of “white supremacy” and applies it to Jewish self-determination. It claims Jewish safety, Jewish symbols, and Jewish majority life prove Jews seek power over others. It makes Jewish refuge and self-defense sound tyrannical.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "zionism is racism": {
    "term": "Zionism is racism",
    "type": "Zionism-racism equation",
    "meaning": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991.",
    "why": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "more": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "bottom": "This is core antizionist language."
  },
  "zionism racism": {
    "term": "Zionism = racism",
    "type": "Zionism-racism equation",
    "meaning": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991.",
    "why": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "more": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "bottom": "This is core antizionist language."
  },
  "racist ideology of zionism": {
    "term": "Racist ideology of Zionism",
    "type": "Zionism-racism equation",
    "meaning": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991.",
    "why": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "more": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "bottom": "This is core antizionist language."
  },
  "zionist racism": {
    "term": "Zionist racism",
    "type": "Zionism-racism equation",
    "meaning": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991.",
    "why": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "more": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "bottom": "This is core antizionist language."
  },
  "racist zionist project": {
    "term": "Racist Zionist project",
    "type": "Zionism-racism equation",
    "meaning": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991.",
    "why": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "more": "This phrase comes from the 1975 UN smear that declared Zionism a form of racism, later revoked in 1991. It does not criticize an Israeli law; it condemns Jewish self-determination at the root. The phrase says the Jewish state is born guilty.",
    "bottom": "This is core antizionist language."
  },
  "zionazi": {
    "term": "Zionazi",
    "type": "Zionism/Nazi inversion",
    "meaning": "This uses Nazi language against the movement for Jewish self-determination.",
    "why": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "more": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "bottom": "This is severe antizionist language when anchored to Zionism/Israel."
  },
  "nazionist": {
    "term": "Nazionist",
    "type": "Zionism/Nazi inversion",
    "meaning": "This uses Nazi language against the movement for Jewish self-determination.",
    "why": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "more": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "bottom": "This is severe antizionist language when anchored to Zionism/Israel."
  },
  "zionism is nazism": {
    "term": "Zionism is Nazism",
    "type": "Zionism/Nazi inversion",
    "meaning": "This uses Nazi language against the movement for Jewish self-determination.",
    "why": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "more": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "bottom": "This is severe antizionist language when anchored to Zionism/Israel."
  },
  "zionists are nazis": {
    "term": "Zionists are Nazis",
    "type": "Zionism/Nazi inversion",
    "meaning": "This uses Nazi language against the movement for Jewish self-determination.",
    "why": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "more": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "bottom": "This is severe antizionist language when anchored to Zionism/Israel."
  },
  "zio fascist": {
    "term": "Zio-fascist",
    "type": "Zionism/Nazi inversion",
    "meaning": "This uses Nazi language against the movement for Jewish self-determination.",
    "why": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "more": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "bottom": "This is severe antizionist language when anchored to Zionism/Israel."
  },
  "israel nazi germany": {
    "term": "Israel = Nazi Germany",
    "type": "Zionism/Nazi inversion",
    "meaning": "This uses Nazi language against the movement for Jewish self-determination.",
    "why": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "more": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "bottom": "This is severe antizionist language when anchored to Zionism/Israel."
  },
  "idf are nazis": {
    "term": "IDF are Nazis",
    "type": "Zionism/Nazi inversion",
    "meaning": "This uses Nazi language against the movement for Jewish self-determination.",
    "why": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "more": "This uses Nazi language against the movement for Jewish self-determination. IHRA treats Nazi comparisons to Israel as antisemitic because they turn Holocaust memory against Jews. The phrase makes the victims’ vocabulary serve their murderers’ image.",
    "bottom": "This is severe antizionist language when anchored to Zionism/Israel."
  },
  "gaza is auschwitz": {
    "term": "Gaza is Auschwitz",
    "type": "Adjacent Jew-hatred",
    "why": "“Gaza is Auschwitz” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "ashke nazi": {
    "term": "Ashke-Nazi",
    "type": "Adjacent Jew-hatred",
    "why": "“Ashke-Nazi” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "judeo nazi": {
    "term": "Judeo-Nazi",
    "type": "Adjacent Jew-hatred",
    "why": "“Judeo-Nazi” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "aipac": {
    "term": "AIPAC",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“AIPAC” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "powerful lobby": {
    "term": "Powerful lobby",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“Powerful lobby” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "the zionist lobby": {
    "term": "The Zionist Lobby",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“The Zionist Lobby” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "zionist lobby": {
    "term": "Zionist Lobby",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“Zionist Lobby” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "zionist lobbyist": {
    "term": "Zionist Lobbyist",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“Zionist Lobbyist” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "israel lobby": {
    "term": "Israel lobby",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“Israel lobby” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "pro israel lobby": {
    "term": "Pro-Israel lobby",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“Pro-Israel lobby” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "aipac pressures congress": {
    "term": "AIPAC pressures Congress",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“AIPAC pressures Congress” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "aipac funds campaigns": {
    "term": "AIPAC funds campaigns",
    "type": "AIPAC / pro-Israel lobby claim",
    "why": "“AIPAC funds campaigns” belongs to the pro-Israel lobby claim family.",
    "more": "This family covers AIPAC, the Israel lobby, campaign money, donor pressure, and organized pro-Israel advocacy. It is lower severity when it stays specific; it becomes more severe when it moves into control, ownership, puppet-master, money-control, or loyalty language.",
    "bottom": "Context matters; control language is more severe."
  },
  "zog": {
    "term": "ZOG",
    "type": "Zionist control claim",
    "why": "“ZOG” presents Zionist or pro-Israel influence as control.",
    "more": "This family includes government-control, media-control, money-control, puppet-master, and ZOG-style claims when tied to Zionism/Israel. The key move is from influence or lobbying into domination or secret control.",
    "bottom": "This is antizionist control language."
  },
  "zionist occupied government": {
    "term": "Zionist Occupied Government",
    "type": "Zionist control claim",
    "meaning": "This recycles the old claim that Jews secretly control money, media, or government.",
    "why": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "more": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "bottom": "This is antizionist control language."
  },
  "zionist puppet master": {
    "term": "Zionist puppet master",
    "type": "Zionist control claim",
    "meaning": "This recycles the old claim that Jews secretly control money, media, or government.",
    "why": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "more": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "bottom": "This is antizionist control language."
  },
  "puppet master": {
    "term": "Puppet Master",
    "type": "Adjacent Jew-hatred",
    "why": "“Puppet Master” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "zio media": {
    "term": "Zio-Media",
    "type": "Zionist control claim",
    "meaning": "This recycles the old claim that Jews secretly control money, media, or government.",
    "why": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "more": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "bottom": "This is antizionist control language."
  },
  "zionist media": {
    "term": "Zionist media",
    "type": "Zionist control claim",
    "meaning": "This recycles the old claim that Jews secretly control money, media, or government.",
    "why": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "more": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "bottom": "This is antizionist control language."
  },
  "zionist money controls congress": {
    "term": "Zionist money controls Congress",
    "type": "Zionist control claim",
    "meaning": "This recycles the old claim that Jews secretly control money, media, or government.",
    "why": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "more": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "bottom": "This is antizionist control language."
  },
  "aipac controls congress": {
    "term": "AIPAC controls Congress",
    "type": "Zionist control claim",
    "meaning": "This recycles the old claim that Jews secretly control money, media, or government.",
    "why": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "more": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "bottom": "This is antizionist control language."
  },
  "globalist elite": {
    "term": "Globalist Elite",
    "type": "Adjacent Jew-hatred",
    "why": "“Globalist Elite” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "israel owns congress": {
    "term": "Israel owns Congress",
    "type": "Zionist control claim",
    "meaning": "This recycles the old claim that Jews secretly control money, media, or government.",
    "why": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "more": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "bottom": "This is antizionist control language."
  },
  "zionist lobby controls government": {
    "term": "Zionist lobby controls government",
    "type": "Zionist control claim",
    "meaning": "This recycles the old claim that Jews secretly control money, media, or government.",
    "why": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "more": "This recycles the old claim that Jews secretly control money, media, or government. Replacing “Jews” with “Zionists” keeps the conspiracy while updating the label. It teaches the listener to see Jewish influence where ordinary civic participation exists.",
    "bottom": "This is antizionist control language."
  },
  "israel firster": {
    "term": "Israel-Firster",
    "type": "Zionist dual-loyalty / foreign-allegiance claim",
    "why": "“Israel-Firster” casts Zionists, Jews, or Israel supporters as serving a foreign allegiance.",
    "more": "This family includes Israel-Firster, foreign agent, rootless Zionist, and loyalty-to-Israel claims when tied to Israel/Zionism. It is not about disagreement; it questions belonging or loyalty.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "rootless cosmopolitan": {
    "term": "Rootless Cosmopolitan",
    "type": "Adjacent Jew-hatred",
    "why": "“Rootless Cosmopolitan” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "foreign agents for israel": {
    "term": "Foreign agents for Israel",
    "type": "Zionist dual-loyalty / foreign-allegiance claim",
    "why": "“Foreign agents for Israel” casts Zionists, Jews, or Israel supporters as serving a foreign allegiance.",
    "more": "This family includes Israel-Firster, foreign agent, rootless Zionist, and loyalty-to-Israel claims when tied to Israel/Zionism. It is not about disagreement; it questions belonging or loyalty.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "loyal to israel first": {
    "term": "Loyal to Israel first",
    "type": "Zionist dual-loyalty / foreign-allegiance claim",
    "why": "“Loyal to Israel first” casts Zionists, Jews, or Israel supporters as serving a foreign allegiance.",
    "more": "This family includes Israel-Firster, foreign agent, rootless Zionist, and loyalty-to-Israel claims when tied to Israel/Zionism. It is not about disagreement; it questions belonging or loyalty.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "zionist dual loyalists": {
    "term": "Zionist dual loyalists",
    "type": "Zionist dual-loyalty / foreign-allegiance claim",
    "why": "“Zionist dual loyalists” casts Zionists, Jews, or Israel supporters as serving a foreign allegiance.",
    "more": "This family includes Israel-Firster, foreign agent, rootless Zionist, and loyalty-to-Israel claims when tied to Israel/Zionism. It is not about disagreement; it questions belonging or loyalty.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "more loyal to israel than america": {
    "term": "More loyal to Israel than America",
    "type": "Zionist dual-loyalty / foreign-allegiance claim",
    "why": "“More loyal to Israel than America” casts Zionists, Jews, or Israel supporters as serving a foreign allegiance.",
    "more": "This family includes Israel-Firster, foreign agent, rootless Zionist, and loyalty-to-Israel claims when tied to Israel/Zionism. It is not about disagreement; it questions belonging or loyalty.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "israeli agents": {
    "term": "Israeli agents",
    "type": "Zionist dual-loyalty / foreign-allegiance claim",
    "why": "“Israeli agents” casts Zionists, Jews, or Israel supporters as serving a foreign allegiance.",
    "more": "This family includes Israel-Firster, foreign agent, rootless Zionist, and loyalty-to-Israel claims when tied to Israel/Zionism. It is not about disagreement; it questions belonging or loyalty.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "iof": {
    "term": "IOF",
    "type": "IDF / Israel delegitimizing label",
    "why": "“IOF” renames Israel or the IDF in a way that denies normal state or military legitimacy.",
    "more": "These labels replace ordinary names such as Israel or IDF with terms such as entity, IOF, or occupying force. The function is to mark the country or its military as inherently invalid, foreign, criminal, or temporary.",
    "bottom": "This is antizionist language."
  },
  "israhell": {
    "term": "Israhell",
    "type": "IDF / Israel delegitimizing label",
    "why": "“Israhell” renames Israel or the IDF in a way that denies normal state or military legitimacy.",
    "more": "These labels replace ordinary names such as Israel or IDF with terms such as entity, IOF, or occupying force. The function is to mark the country or its military as inherently invalid, foreign, criminal, or temporary.",
    "bottom": "This is antizionist language."
  },
  "israeled": {
    "term": "Israeled",
    "type": "IDF / Israel delegitimizing label",
    "why": "“Israeled” renames Israel or the IDF in a way that denies normal state or military legitimacy.",
    "more": "These labels replace ordinary names such as Israel or IDF with terms such as entity, IOF, or occupying force. The function is to mark the country or its military as inherently invalid, foreign, criminal, or temporary.",
    "bottom": "This is antizionist language."
  },
  "israeling": {
    "term": "Israeling",
    "type": "IDF / Israel delegitimizing label",
    "why": "“Israeling” renames Israel or the IDF in a way that denies normal state or military legitimacy.",
    "more": "These labels replace ordinary names such as Israel or IDF with terms such as entity, IOF, or occupying force. The function is to mark the country or its military as inherently invalid, foreign, criminal, or temporary.",
    "bottom": "This is antizionist language."
  },
  "occupying entity": {
    "term": "Occupying Entity",
    "type": "IDF / Israel delegitimizing label",
    "why": "“Occupying Entity” renames Israel or the IDF in a way that denies normal state or military legitimacy.",
    "more": "These labels replace ordinary names such as Israel or IDF with terms such as entity, IOF, or occupying force. The function is to mark the country or its military as inherently invalid, foreign, criminal, or temporary.",
    "bottom": "This is antizionist language."
  },
  "zionist entity": {
    "term": "Zionist Entity",
    "type": "Israel elimination / replacement language",
    "meaning": "The phrase comes from movements that refuse to say Israel.",
    "why": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "more": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "bottom": "This is antizionist language."
  },
  "the zionist entity": {
    "term": "The Zionist Entity",
    "type": "Israel elimination / replacement language",
    "meaning": "The phrase comes from movements that refuse to say Israel.",
    "why": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "more": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "bottom": "This is antizionist language."
  },
  "terrorist state": {
    "term": "Terrorist state",
    "type": "IDF / Israel delegitimizing label",
    "why": "“Terrorist state” renames Israel or the IDF in a way that denies normal state or military legitimacy.",
    "more": "These labels replace ordinary names such as Israel or IDF with terms such as entity, IOF, or occupying force. The function is to mark the country or its military as inherently invalid, foreign, criminal, or temporary.",
    "bottom": "This is antizionist language."
  },
  "frankenstein state": {
    "term": "Frankenstein State",
    "type": "IDF / Israel delegitimizing label",
    "why": "“Frankenstein State” renames Israel or the IDF in a way that denies normal state or military legitimacy.",
    "more": "These labels replace ordinary names such as Israel or IDF with terms such as entity, IOF, or occupying force. The function is to mark the country or its military as inherently invalid, foreign, criminal, or temporary.",
    "bottom": "This is antizionist language."
  },
  "pariah state": {
    "term": "Pariah State",
    "type": "Delegitimizing state label",
    "why": "“Pariah State” treats Israel as an abnormal or illegitimate country rather than a state that can be criticized like any other.",
    "more": "This label category includes phrases that cast Israel as artificial, monstrous, temporary, diseased, or outside the family of nations. The issue is not disagreement with a policy; it is denial of normal state status.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "artificial state": {
    "term": "Artificial State",
    "type": "Delegitimizing state label",
    "why": "“Artificial State” treats Israel as an abnormal or illegitimate country rather than a state that can be criticized like any other.",
    "more": "This label category includes phrases that cast Israel as artificial, monstrous, temporary, diseased, or outside the family of nations. The issue is not disagreement with a policy; it is denial of normal state status.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "rogue state": {
    "term": "Rogue state",
    "type": "Delegitimizing state label",
    "why": "“Rogue state” treats Israel as an abnormal or illegitimate country rather than a state that can be criticized like any other.",
    "more": "This label category includes phrases that cast Israel as artificial, monstrous, temporary, diseased, or outside the family of nations. The issue is not disagreement with a policy; it is denial of normal state status.",
    "bottom": "This is antizionist language when aimed at Israel as such."
  },
  "cancerous tumor": {
    "term": "Cancerous Tumor",
    "type": "Eliminationist / dehumanizing state metaphor",
    "why": "“Cancerous Tumor” uses disease, monster, or removal imagery for Israel.",
    "more": "Iranian state rhetoric has used cancer/tumor language for Israel, and similar metaphors present the country as something to be cut out rather than a normal state in conflict. This is dehumanizing state-language, not policy-focused text.",
    "bottom": "This is severe antizionist language when aimed at Israel."
  },
  "zio": {
    "term": "Zio",
    "type": "Zionist slur / hostile label",
    "meaning": "This is a hostile shortening of Zionist.",
    "why": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "more": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "bottom": "This is antizionist language."
  },
  "zio pig": {
    "term": "Zio-Pig",
    "type": "Zionist slur / hostile label",
    "meaning": "This is a hostile shortening of Zionist.",
    "why": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "more": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "bottom": "This is antizionist language."
  },
  "zio bots": {
    "term": "Zio-Bots",
    "type": "Zionist slur / hostile label",
    "meaning": "This is a hostile shortening of Zionist.",
    "why": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "more": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "bottom": "This is antizionist language."
  },
  "zio trolls": {
    "term": "Zio-Trolls",
    "type": "Zionist slur / hostile label",
    "meaning": "This is a hostile shortening of Zionist.",
    "why": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "more": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "bottom": "This is antizionist language."
  },
  "zionist tears": {
    "term": "Zionist Tears",
    "type": "Zionist slur / hostile label",
    "meaning": "This is a hostile shortening of Zionist.",
    "why": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "more": "This is a hostile shortening of Zionist. It became common in extremist and anti-Israel speech as a quick way to sneer at Jews, Israelis, and pro-Israel people. The slur works by making Jewish national attachment sound dirty.",
    "bottom": "This is antizionist language."
  },
  "hasbara bot": {
    "term": "Hasbara Bot",
    "type": "Hasbara dismissal",
    "meaning": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy.",
    "why": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "more": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "bottom": "Context Dependent / Human Review unless used as a dismissal."
  },
  "hasbara troll": {
    "term": "Hasbara Troll",
    "type": "Hasbara dismissal",
    "meaning": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy.",
    "why": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "more": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "bottom": "Context Dependent / Human Review unless used as a dismissal."
  },
  "juifzinite": {
    "term": "Juifzinite",
    "type": "Zionist slur / hostile label",
    "why": "“Juifzinite” is hostile shorthand aimed at Zionists, Israelis, or Israel supporters.",
    "more": "The slur function matters: it turns Zionist identity or association with Israel into a stigma. Some terms in this family also overlap with hasbara dismissal or control language depending on the sentence.",
    "bottom": "This is antizionist language."
  },
  "hasbara": {
    "term": "Hasbara",
    "type": "Hasbara dismissal",
    "meaning": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy.",
    "why": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "more": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "bottom": "Context Dependent / Human Review unless used as a dismissal."
  },
  "hasbara agent": {
    "term": "Hasbara Agent",
    "type": "Hasbara dismissal",
    "meaning": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy.",
    "why": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "more": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "bottom": "Context Dependent / Human Review unless used as a dismissal."
  },
  "paid hasbara": {
    "term": "Paid hasbara",
    "type": "Hasbara dismissal",
    "meaning": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy.",
    "why": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "more": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "bottom": "Context Dependent / Human Review unless used as a dismissal."
  },
  "hasbara shill": {
    "term": "Hasbara shill",
    "type": "Hasbara dismissal",
    "meaning": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy.",
    "why": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "more": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "bottom": "Context Dependent / Human Review unless used as a dismissal."
  },
  "organ harvester": {
    "term": "Organ Harvester",
    "type": "Adjacent Jew-hatred",
    "meaning": "This belongs to the blood-libel family.",
    "why": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "more": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "israeli organ harvesters": {
    "term": "Israeli organ harvesters",
    "type": "Israel/Zionism blood-or-body libel",
    "meaning": "This belongs to the blood-libel family.",
    "why": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "more": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "bottom": "This is severe antizionist language when anchored to Israel/Zionism."
  },
  "idf organ harvesting": {
    "term": "IDF organ harvesting",
    "type": "Israel/Zionism blood-or-body libel",
    "meaning": "This belongs to the blood-libel family.",
    "why": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "more": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "bottom": "This is severe antizionist language when anchored to Israel/Zionism."
  },
  "zionist organ harvesting": {
    "term": "Zionist organ harvesting",
    "type": "Israel/Zionism blood-or-body libel",
    "meaning": "This belongs to the blood-libel family.",
    "why": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "more": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "bottom": "This is severe antizionist language when anchored to Israel/Zionism."
  },
  "blood drinkers": {
    "term": "Blood-Drinkers",
    "type": "Adjacent Jew-hatred",
    "why": "“Blood-Drinkers” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "zionist blood drinkers": {
    "term": "Zionist blood-drinkers",
    "type": "Israel/Zionism blood-or-body libel",
    "meaning": "This belongs to the blood-libel family.",
    "why": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "more": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "bottom": "This is severe antizionist language when anchored to Israel/Zionism."
  },
  "israelis drink palestinian blood": {
    "term": "Israelis drink Palestinian blood",
    "type": "Israel/Zionism blood-or-body libel",
    "meaning": "This belongs to the blood-libel family.",
    "why": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "more": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "bottom": "This is severe antizionist language when anchored to Israel/Zionism."
  },
  "body theft by israel": {
    "term": "Body theft by Israel",
    "type": "Israel/Zionism blood-or-body libel",
    "meaning": "This belongs to the blood-libel family.",
    "why": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "more": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "bottom": "This is severe antizionist language when anchored to Israel/Zionism."
  },
  "stealing palestinian organs": {
    "term": "Stealing Palestinian organs",
    "type": "Israel/Zionism blood-or-body libel",
    "meaning": "This belongs to the blood-libel family.",
    "why": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "more": "This belongs to the blood-libel family. It accuses Israel or Zionists of stealing Palestinian bodies, organs, or blood. The old myth said Jews preyed on Christian children; the updated version moves the same horror story into Israel language.",
    "bottom": "This is severe antizionist language when anchored to Israel/Zionism."
  },
  "baby killer": {
    "term": "Baby-killer",
    "type": "Adjacent Jew-hatred",
    "why": "“Baby-killer” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "child killer": {
    "term": "Child-killer",
    "type": "Adjacent Jew-hatred",
    "why": "“Child-killer” is not primarily antizionist by itself, but it is close enough to require separation from ordinary text.",
    "more": "Treat it as adjacent unless the sentence ties it to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, or recognized antizionist vocabulary. With that anchor, it may become core antizionist language.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "child murdering entity": {
    "term": "Child-Murdering Entity",
    "type": "Israeli / Zionist collective demonization",
    "why": "“Child-Murdering Entity” labels Israelis, Zionists, or the IDF as inherently murderous or evil.",
    "more": "This family covers blanket labels such as baby-killer, child-killer, genocidaires, and similar terms when applied broadly to Israelis, Zionists, or the IDF rather than to a specific proven act.",
    "bottom": "This is antizionist language when used as a broad identity label."
  },
  "judaoterrorist": {
    "term": "Judaoterrorist",
    "type": "Israeli / Zionist collective demonization",
    "why": "“Judaoterrorist” labels Israelis, Zionists, or the IDF as inherently murderous or evil.",
    "more": "This family covers blanket labels such as baby-killer, child-killer, genocidaires, and similar terms when applied broadly to Israelis, Zionists, or the IDF rather than to a specific proven act.",
    "bottom": "This is antizionist language when used as a broad identity label."
  },
  "zionists are monsters": {
    "term": "Zionists are monsters",
    "type": "Israeli / Zionist collective demonization",
    "why": "“Zionists are monsters” labels Israelis, Zionists, or the IDF as inherently murderous or evil.",
    "more": "This family covers blanket labels such as baby-killer, child-killer, genocidaires, and similar terms when applied broadly to Israelis, Zionists, or the IDF rather than to a specific proven act.",
    "bottom": "This is antizionist language when used as a broad identity label."
  },
  "israelis are murderers": {
    "term": "Israelis are murderers",
    "type": "Israeli / Zionist collective demonization",
    "why": "“Israelis are murderers” labels Israelis, Zionists, or the IDF as inherently murderous or evil.",
    "more": "This family covers blanket labels such as baby-killer, child-killer, genocidaires, and similar terms when applied broadly to Israelis, Zionists, or the IDF rather than to a specific proven act.",
    "bottom": "This is antizionist language when used as a broad identity label."
  },
  "idf are baby killers": {
    "term": "IDF are baby-killers",
    "type": "Israeli / Zionist collective demonization",
    "why": "“IDF are baby-killers” labels Israelis, Zionists, or the IDF as inherently murderous or evil.",
    "more": "This family covers blanket labels such as baby-killer, child-killer, genocidaires, and similar terms when applied broadly to Israelis, Zionists, or the IDF rather than to a specific proven act.",
    "bottom": "This is antizionist language when used as a broad identity label."
  },
  "hillel as zionist target": {
    "term": "Hillel as Zionist target",
    "type": "Jewish institution targeting in antizionist language",
    "why": "“Hillel as Zionist target” targets a Jewish institution through antizionist logic.",
    "more": "This includes Hillel, Chabad, synagogues, Jewish federations, JCCs, Birthright, and Jewish student groups when targeted because of Israel/Zionism. The issue is direct antizionist targeting, not a hidden proxy label on screen.",
    "bottom": "This is antizionist language when the institution is targeted through Israel/Zionism."
  },
  "chabad as zionist target": {
    "term": "Chabad as Zionist target",
    "type": "Jewish institution targeting in antizionist language",
    "why": "“Chabad as Zionist target” targets a Jewish institution through antizionist logic.",
    "more": "This includes Hillel, Chabad, synagogues, Jewish federations, JCCs, Birthright, and Jewish student groups when targeted because of Israel/Zionism. The issue is direct antizionist targeting, not a hidden proxy label on screen.",
    "bottom": "This is antizionist language when the institution is targeted through Israel/Zionism."
  },
  "synagogues targeted over israel zionism": {
    "term": "Synagogues targeted over Israel/Zionism",
    "type": "Jewish institution targeting in antizionist language",
    "why": "“Synagogues targeted over Israel/Zionism” targets a Jewish institution through antizionist logic.",
    "more": "This includes Hillel, Chabad, synagogues, Jewish federations, JCCs, Birthright, and Jewish student groups when targeted because of Israel/Zionism. The issue is direct antizionist targeting, not a hidden proxy label on screen.",
    "bottom": "This is antizionist language when the institution is targeted through Israel/Zionism."
  },
  "jewish federation targeted over israel zionism": {
    "term": "Jewish federation targeted over Israel/Zionism",
    "type": "Jewish institution targeting in antizionist language",
    "why": "“Jewish federation targeted over Israel/Zionism” targets a Jewish institution through antizionist logic.",
    "more": "This includes Hillel, Chabad, synagogues, Jewish federations, JCCs, Birthright, and Jewish student groups when targeted because of Israel/Zionism. The issue is direct antizionist targeting, not a hidden proxy label on screen.",
    "bottom": "This is antizionist language when the institution is targeted through Israel/Zionism."
  },
  "jcc targeted over israel zionism": {
    "term": "JCC targeted over Israel/Zionism",
    "type": "Jewish institution targeting in antizionist language",
    "why": "“JCC targeted over Israel/Zionism” targets a Jewish institution through antizionist logic.",
    "more": "This includes Hillel, Chabad, synagogues, Jewish federations, JCCs, Birthright, and Jewish student groups when targeted because of Israel/Zionism. The issue is direct antizionist targeting, not a hidden proxy label on screen.",
    "bottom": "This is antizionist language when the institution is targeted through Israel/Zionism."
  },
  "birthright treated as an enemy institution": {
    "term": "Birthright treated as an enemy institution",
    "type": "Jewish institution targeting in antizionist language",
    "why": "“Birthright treated as an enemy institution” targets a Jewish institution through antizionist logic.",
    "more": "This includes Hillel, Chabad, synagogues, Jewish federations, JCCs, Birthright, and Jewish student groups when targeted because of Israel/Zionism. The issue is direct antizionist targeting, not a hidden proxy label on screen.",
    "bottom": "This is antizionist language when the institution is targeted through Israel/Zionism."
  },
  "jewish student groups excluded as zionist institutions": {
    "term": "Jewish student groups excluded as Zionist institutions",
    "type": "Jewish institution targeting in antizionist language",
    "why": "“Jewish student groups excluded as Zionist institutions” targets a Jewish institution through antizionist logic.",
    "more": "This includes Hillel, Chabad, synagogues, Jewish federations, JCCs, Birthright, and Jewish student groups when targeted because of Israel/Zionism. The issue is direct antizionist targeting, not a hidden proxy label on screen.",
    "bottom": "This is antizionist language when the institution is targeted through Israel/Zionism."
  },
  "no zionists": {
    "term": "No Zionists",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“No Zionists” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "zionists not welcome": {
    "term": "Zionists not welcome",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“Zionists not welcome” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "we don t want zionists here": {
    "term": "We don’t want Zionists here",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“We don’t want Zionists here” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "zionists out": {
    "term": "Zionists out",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“Zionists out” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "don t date zionists": {
    "term": "Don’t date Zionists",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“Don’t date Zionists” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "don t hire zionists": {
    "term": "Don’t hire Zionists",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“Don’t hire Zionists” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "blacklist zionists": {
    "term": "Blacklist Zionists",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“Blacklist Zionists” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "no normalization with zionists": {
    "term": "No normalization with Zionists",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“No normalization with Zionists” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "exclude israeli academics": {
    "term": "Exclude Israeli academics",
    "type": "Zionist exclusion / antizionist social exclusion",
    "why": "“Exclude Israeli academics” excludes Zionists, Israelis, or Israel-linked Jews from social, campus, cultural, or professional spaces.",
    "more": "This language appears in antizionist movement practice as shunning, refusal, no-normalization, blacklist, and “not welcome” formulas. Kelner’s account of American antizionism helps explain why practice and exclusion matter, not only slogans.",
    "bottom": "This is antizionist exclusion language."
  },
  "academic boycott": {
    "term": "Academic boycott",
    "type": "Boycott / anti-normalization pressure",
    "why": "“Academic boycott” belongs to boycott or anti-normalization pressure aimed at Israel/Zionism.",
    "more": "BDS began as a 2005 Palestinian civil society call for boycott, divestment, and sanctions against Israel. In app logic, boycott language becomes stronger when it targets Israelis, Zionists, Jewish institutions, artists, academics, or normal contact as such.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "cultural boycott": {
    "term": "Cultural boycott",
    "type": "Boycott / anti-normalization pressure",
    "why": "“Cultural boycott” belongs to boycott or anti-normalization pressure aimed at Israel/Zionism.",
    "more": "BDS began as a 2005 Palestinian civil society call for boycott, divestment, and sanctions against Israel. In app logic, boycott language becomes stronger when it targets Israelis, Zionists, Jewish institutions, artists, academics, or normal contact as such.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "boycott israeli institutions": {
    "term": "Boycott Israeli institutions",
    "type": "Boycott / anti-normalization pressure",
    "why": "“Boycott Israeli institutions” belongs to boycott or anti-normalization pressure aimed at Israel/Zionism.",
    "more": "BDS began as a 2005 Palestinian civil society call for boycott, divestment, and sanctions against Israel. In app logic, boycott language becomes stronger when it targets Israelis, Zionists, Jewish institutions, artists, academics, or normal contact as such.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "no normalization": {
    "term": "No normalization",
    "type": "Boycott / anti-normalization pressure",
    "why": "“No normalization” belongs to boycott or anti-normalization pressure aimed at Israel/Zionism.",
    "more": "BDS began as a 2005 Palestinian civil society call for boycott, divestment, and sanctions against Israel. In app logic, boycott language becomes stronger when it targets Israelis, Zionists, Jewish institutions, artists, academics, or normal contact as such.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "anti normalization": {
    "term": "Anti-normalization",
    "type": "Boycott / anti-normalization pressure",
    "why": "“Anti-normalization” belongs to boycott or anti-normalization pressure aimed at Israel/Zionism.",
    "more": "BDS began as a 2005 Palestinian civil society call for boycott, divestment, and sanctions against Israel. In app logic, boycott language becomes stronger when it targets Israelis, Zionists, Jewish institutions, artists, academics, or normal contact as such.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "do not work with zionists": {
    "term": "Do not work with Zionists",
    "type": "Boycott / anti-normalization pressure",
    "why": "“Do not work with Zionists” belongs to boycott or anti-normalization pressure aimed at Israel/Zionism.",
    "more": "BDS began as a 2005 Palestinian civil society call for boycott, divestment, and sanctions against Israel. In app logic, boycott language becomes stronger when it targets Israelis, Zionists, Jewish institutions, artists, academics, or normal contact as such.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "boycott zionist businesses": {
    "term": "Boycott Zionist businesses",
    "type": "Boycott / anti-normalization pressure",
    "why": "“Boycott Zionist businesses” belongs to boycott or anti-normalization pressure aimed at Israel/Zionism.",
    "more": "BDS began as a 2005 Palestinian civil society call for boycott, divestment, and sanctions against Israel. In app logic, boycott language becomes stronger when it targets Israelis, Zionists, Jewish institutions, artists, academics, or normal contact as such.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "divest from zionism": {
    "term": "Divest from Zionism",
    "type": "Boycott / anti-normalization pressure",
    "why": "“Divest from Zionism” belongs to boycott or anti-normalization pressure aimed at Israel/Zionism.",
    "more": "BDS began as a 2005 Palestinian civil society call for boycott, divestment, and sanctions against Israel. In app logic, boycott language becomes stronger when it targets Israelis, Zionists, Jewish institutions, artists, academics, or normal contact as such.",
    "bottom": "Context determines whether this is pressure language or antizionist exclusion."
  },
  "pinkwashing": {
    "term": "Pinkwashing",
    "type": "Bad-faith laundering claim",
    "why": "“Pinkwashing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "greenwashing": {
    "term": "Greenwashing",
    "type": "Bad-faith laundering claim",
    "why": "“Greenwashing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "bluewashing": {
    "term": "Bluewashing",
    "type": "Bad-faith laundering claim",
    "why": "“Bluewashing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "artwashing": {
    "term": "Artwashing",
    "type": "Bad-faith laundering claim",
    "why": "“Artwashing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "sportswashing": {
    "term": "Sportswashing",
    "type": "Bad-faith laundering claim",
    "why": "“Sportswashing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "faithwashing": {
    "term": "Faithwashing",
    "type": "Bad-faith laundering claim",
    "why": "“Faithwashing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "culture washing": {
    "term": "Culture-washing",
    "type": "Bad-faith laundering claim",
    "why": "“Culture-washing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "academic washing": {
    "term": "Academic-washing",
    "type": "Bad-faith laundering claim",
    "why": "“Academic-washing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "tech washing": {
    "term": "Tech-washing",
    "type": "Bad-faith laundering claim",
    "why": "“Tech-washing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "medical washing": {
    "term": "Medical-washing",
    "type": "Bad-faith laundering claim",
    "why": "“Medical-washing” belongs to the “washing” accusation family.",
    "more": "Pinkwashing, greenwashing, bluewashing, artwashing, sportswashing, faithwashing, and related terms claim Israel uses a good cause or achievement to hide criminality. This is a recurring bad-faith-laundering accusation pattern in antizionist language.",
    "bottom": "This is antizionist language when aimed at Israel/Zionism."
  },
  "open air prison": {
    "term": "Open-air prison",
    "type": "Carceral / confinement accusation",
    "meaning": "This phrase is used for Gaza after Israel’s withdrawal and Hamas’s takeover.",
    "why": "This phrase is used for Gaza after Israel’s withdrawal and Hamas’s takeover. It names Israel as jailer while hiding Hamas rule, rockets, tunnels, hostages, weapons, and Egypt’s border. The phrase gives the audience one villain before the facts appear.",
    "more": "This phrase is used for Gaza after Israel’s withdrawal and Hamas’s takeover. It names Israel as jailer while hiding Hamas rule, rockets, tunnels, hostages, weapons, and Egypt’s border. The phrase gives the audience one villain before the facts appear.",
    "bottom": "Context Dependent / Human Review unless clearly tied to Israel/Zionism."
  },
  "carceral state": {
    "term": "Carceral state",
    "type": "Carceral / confinement accusation",
    "why": "“Carceral state” casts Israel/Zionism as jailer, cage, prison, or confinement system.",
    "more": "This family includes open-air prison, carceral state, siege-state, cage, and prison-state language. It becomes core antizionist when tied to Israel/Zionism as an inherent carceral order rather than a specific policy claim.",
    "bottom": "Context Dependent / Human Review unless clearly tied to Israel/Zionism."
  },
  "carceral zionism": {
    "term": "Carceral Zionism",
    "type": "Carceral / confinement accusation",
    "why": "“Carceral Zionism” casts Israel/Zionism as jailer, cage, prison, or confinement system.",
    "more": "This family includes open-air prison, carceral state, siege-state, cage, and prison-state language. It becomes core antizionist when tied to Israel/Zionism as an inherent carceral order rather than a specific policy claim.",
    "bottom": "Context Dependent / Human Review unless clearly tied to Israel/Zionism."
  },
  "prison state": {
    "term": "Prison-state",
    "type": "Carceral / confinement accusation",
    "why": "“Prison-state” casts Israel/Zionism as jailer, cage, prison, or confinement system.",
    "more": "This family includes open-air prison, carceral state, siege-state, cage, and prison-state language. It becomes core antizionist when tied to Israel/Zionism as an inherent carceral order rather than a specific policy claim.",
    "bottom": "Context Dependent / Human Review unless clearly tied to Israel/Zionism."
  },
  "gaza as cage": {
    "term": "Gaza as cage",
    "type": "Carceral / confinement accusation",
    "why": "“Gaza as cage” casts Israel/Zionism as jailer, cage, prison, or confinement system.",
    "more": "This family includes open-air prison, carceral state, siege-state, cage, and prison-state language. It becomes core antizionist when tied to Israel/Zionism as an inherent carceral order rather than a specific policy claim.",
    "bottom": "Context Dependent / Human Review unless clearly tied to Israel/Zionism."
  },
  "israel as jailer": {
    "term": "Israel as jailer",
    "type": "Carceral / confinement accusation",
    "why": "“Israel as jailer” casts Israel/Zionism as jailer, cage, prison, or confinement system.",
    "more": "This family includes open-air prison, carceral state, siege-state, cage, and prison-state language. It becomes core antizionist when tied to Israel/Zionism as an inherent carceral order rather than a specific policy claim.",
    "bottom": "Context Dependent / Human Review unless clearly tied to Israel/Zionism."
  },
  "siege state": {
    "term": "Siege state",
    "type": "Carceral / confinement accusation",
    "why": "“Siege state” casts Israel/Zionism as jailer, cage, prison, or confinement system.",
    "more": "This family includes open-air prison, carceral state, siege-state, cage, and prison-state language. It becomes core antizionist when tied to Israel/Zionism as an inherent carceral order rather than a specific policy claim.",
    "bottom": "Context Dependent / Human Review unless clearly tied to Israel/Zionism."
  },
  "cultural erasure": {
    "term": "Cultural erasure",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Cultural erasure” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "stealing archaeology": {
    "term": "Stealing archaeology",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Stealing archaeology” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "stealing food recipes": {
    "term": "Stealing food recipes",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Stealing food recipes” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "food appropriation": {
    "term": "Food appropriation",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Food appropriation” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "linguistic colonialism": {
    "term": "Linguistic colonialism",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Linguistic colonialism” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "hebrew as colonial imposition": {
    "term": "Hebrew as colonial imposition",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Hebrew as colonial imposition” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "stealing palestinian culture": {
    "term": "Stealing Palestinian culture",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Stealing Palestinian culture” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "erasing palestinian memory": {
    "term": "Erasing Palestinian memory",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Erasing Palestinian memory” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "archaeology theft": {
    "term": "Archaeology theft",
    "type": "Cultural erasure / appropriation accusation",
    "why": "“Archaeology theft” accuses Israel or Jews of stealing, erasing, or fabricating culture/history.",
    "more": "This family covers food, archaeology, language, memory, maps, place names, and cultural ownership. It becomes antizionist when used to deny Jewish belonging, Jewish history, or the legitimacy of Jewish national life in the land.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "judaization": {
    "term": "Judaization",
    "type": "Judaization / Hebraization accusation",
    "why": "“Judaization” treats Jewish or Hebrew presence as demographic or cultural takeover.",
    "more": "Hamas’s 2017 principles document uses “Judaization” in its rejectionist language. In the app, Judaization/Hebraization terms should be treated as antizionist when they present Jewish place names, Jewish life, Hebrew, or Jewish statehood as illegitimate imposition.",
    "bottom": "This is antizionist language when tied to Jewish statehood or Israel."
  },
  "hebraization": {
    "term": "Hebraization",
    "type": "Judaization / Hebraization accusation",
    "why": "“Hebraization” treats Jewish or Hebrew presence as demographic or cultural takeover.",
    "more": "Hamas’s 2017 principles document uses “Judaization” in its rejectionist language. In the app, Judaization/Hebraization terms should be treated as antizionist when they present Jewish place names, Jewish life, Hebrew, or Jewish statehood as illegitimate imposition.",
    "bottom": "This is antizionist language when tied to Jewish statehood or Israel."
  },
  "hebraization of place names": {
    "term": "Hebraization of place names",
    "type": "Judaization / Hebraization accusation",
    "why": "“Hebraization of place names” treats Jewish or Hebrew presence as demographic or cultural takeover.",
    "more": "Hamas’s 2017 principles document uses “Judaization” in its rejectionist language. In the app, Judaization/Hebraization terms should be treated as antizionist when they present Jewish place names, Jewish life, Hebrew, or Jewish statehood as illegitimate imposition.",
    "bottom": "This is antizionist language when tied to Jewish statehood or Israel."
  },
  "judaizing jerusalem": {
    "term": "Judaizing Jerusalem",
    "type": "Judaization / Hebraization accusation",
    "why": "“Judaizing Jerusalem” treats Jewish or Hebrew presence as demographic or cultural takeover.",
    "more": "Hamas’s 2017 principles document uses “Judaization” in its rejectionist language. In the app, Judaization/Hebraization terms should be treated as antizionist when they present Jewish place names, Jewish life, Hebrew, or Jewish statehood as illegitimate imposition.",
    "bottom": "This is antizionist language when tied to Jewish statehood or Israel."
  },
  "judaizing palestine": {
    "term": "Judaizing Palestine",
    "type": "Judaization / Hebraization accusation",
    "why": "“Judaizing Palestine” treats Jewish or Hebrew presence as demographic or cultural takeover.",
    "more": "Hamas’s 2017 principles document uses “Judaization” in its rejectionist language. In the app, Judaization/Hebraization terms should be treated as antizionist when they present Jewish place names, Jewish life, Hebrew, or Jewish statehood as illegitimate imposition.",
    "bottom": "This is antizionist language when tied to Jewish statehood or Israel."
  },
  "demographic engineering": {
    "term": "Demographic engineering",
    "type": "Judaization / Hebraization accusation",
    "why": "“Demographic engineering” treats Jewish or Hebrew presence as demographic or cultural takeover.",
    "more": "Hamas’s 2017 principles document uses “Judaization” in its rejectionist language. In the app, Judaization/Hebraization terms should be treated as antizionist when they present Jewish place names, Jewish life, Hebrew, or Jewish statehood as illegitimate imposition.",
    "bottom": "This is antizionist language when tied to Jewish statehood or Israel."
  },
  "greater israel expansionism": {
    "term": "Greater Israel expansionism",
    "type": "Expansionist / annexation accusation",
    "why": "“Greater Israel expansionism” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "expansionist": {
    "term": "Expansionist",
    "type": "Expansionist / annexation accusation",
    "why": "“Expansionist” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "expansionist state": {
    "term": "Expansionist state",
    "type": "Expansionist / annexation accusation",
    "why": "“Expansionist state” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "mapping imperialism": {
    "term": "Mapping imperialism",
    "type": "Expansionist / annexation accusation",
    "why": "“Mapping imperialism” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "map erasure": {
    "term": "Map erasure",
    "type": "Expansionist / annexation accusation",
    "why": "“Map erasure” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "annexation project": {
    "term": "Annexation project",
    "type": "Expansionist / annexation accusation",
    "why": "“Annexation project” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "israel wants all the land": {
    "term": "Israel wants all the land",
    "type": "Expansionist / annexation accusation",
    "why": "“Israel wants all the land” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "zionist expansion": {
    "term": "Zionist expansion",
    "type": "Expansionist / annexation accusation",
    "why": "“Zionist expansion” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "greater israel project": {
    "term": "Greater Israel project",
    "type": "Expansionist / annexation accusation",
    "why": "“Greater Israel project” casts Israel/Zionism as inherently expansionist or annexationist.",
    "more": "This family covers Greater Israel, map erasure, mapping imperialism, annexation project, and “Israel wants all the land” claims. It is stronger when it treats expansion as Israel’s inherent identity rather than a specific policy question.",
    "bottom": "Context Dependent / Human Review unless aimed at Israel/Zionism as such."
  },
  "weapons testing": {
    "term": "Weapons testing",
    "type": "Militarized experimentation accusation",
    "why": "“Weapons testing” alleges Israel uses Palestinians as a weapons, surveillance, or security laboratory.",
    "more": "This family is separate from genocide or apartheid language. It claims Palestinians are test subjects for Israeli weapons, surveillance, crowd-control, or military technology.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "israel tests weapons on palestinians": {
    "term": "Israel tests weapons on Palestinians",
    "type": "Militarized experimentation accusation",
    "why": "“Israel tests weapons on Palestinians” alleges Israel uses Palestinians as a weapons, surveillance, or security laboratory.",
    "more": "This family is separate from genocide or apartheid language. It claims Palestinians are test subjects for Israeli weapons, surveillance, crowd-control, or military technology.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "gaza as weapons lab": {
    "term": "Gaza as weapons lab",
    "type": "Militarized experimentation accusation",
    "why": "“Gaza as weapons lab” alleges Israel uses Palestinians as a weapons, surveillance, or security laboratory.",
    "more": "This family is separate from genocide or apartheid language. It claims Palestinians are test subjects for Israeli weapons, surveillance, crowd-control, or military technology.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "surveillance testing": {
    "term": "Surveillance testing",
    "type": "Militarized experimentation accusation",
    "why": "“Surveillance testing” alleges Israel uses Palestinians as a weapons, surveillance, or security laboratory.",
    "more": "This family is separate from genocide or apartheid language. It claims Palestinians are test subjects for Israeli weapons, surveillance, crowd-control, or military technology.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "crowd control testing": {
    "term": "Crowd-control testing",
    "type": "Militarized experimentation accusation",
    "why": "“Crowd-control testing” alleges Israel uses Palestinians as a weapons, surveillance, or security laboratory.",
    "more": "This family is separate from genocide or apartheid language. It claims Palestinians are test subjects for Israeli weapons, surveillance, crowd-control, or military technology.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "military tech lab": {
    "term": "Military-tech lab",
    "type": "Militarized experimentation accusation",
    "why": "“Military-tech lab” alleges Israel uses Palestinians as a weapons, surveillance, or security laboratory.",
    "more": "This family is separate from genocide or apartheid language. It claims Palestinians are test subjects for Israeli weapons, surveillance, crowd-control, or military technology.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "palestinians as test subjects": {
    "term": "Palestinians as test subjects",
    "type": "Militarized experimentation accusation",
    "why": "“Palestinians as test subjects” alleges Israel uses Palestinians as a weapons, surveillance, or security laboratory.",
    "more": "This family is separate from genocide or apartheid language. It claims Palestinians are test subjects for Israeli weapons, surveillance, crowd-control, or military technology.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "militarism": {
    "term": "Militarism",
    "type": "Militarized state / security-state accusation",
    "why": "“Militarism” casts Israel/Zionism as inherently militarized or security-obsessed.",
    "more": "This family includes Zionist militarism, militarized state, security state, IDF state, and war-machine language. It becomes core antizionist when it treats militarism as Israel’s inherent national identity rather than a specific policy issue.",
    "bottom": "Context Dependent / Human Review unless tied to Israel/Zionism as such."
  },
  "zionist militarism": {
    "term": "Zionist militarism",
    "type": "Militarized state / security-state accusation",
    "why": "“Zionist militarism” casts Israel/Zionism as inherently militarized or security-obsessed.",
    "more": "This family includes Zionist militarism, militarized state, security state, IDF state, and war-machine language. It becomes core antizionist when it treats militarism as Israel’s inherent national identity rather than a specific policy issue.",
    "bottom": "Context Dependent / Human Review unless tied to Israel/Zionism as such."
  },
  "militarized state": {
    "term": "Militarized state",
    "type": "Militarized state / security-state accusation",
    "why": "“Militarized state” casts Israel/Zionism as inherently militarized or security-obsessed.",
    "more": "This family includes Zionist militarism, militarized state, security state, IDF state, and war-machine language. It becomes core antizionist when it treats militarism as Israel’s inherent national identity rather than a specific policy issue.",
    "bottom": "Context Dependent / Human Review unless tied to Israel/Zionism as such."
  },
  "security state": {
    "term": "Security state",
    "type": "Militarized state / security-state accusation",
    "why": "“Security state” casts Israel/Zionism as inherently militarized or security-obsessed.",
    "more": "This family includes Zionist militarism, militarized state, security state, IDF state, and war-machine language. It becomes core antizionist when it treats militarism as Israel’s inherent national identity rather than a specific policy issue.",
    "bottom": "Context Dependent / Human Review unless tied to Israel/Zionism as such."
  },
  "militarized society": {
    "term": "Militarized society",
    "type": "Militarized state / security-state accusation",
    "why": "“Militarized society” casts Israel/Zionism as inherently militarized or security-obsessed.",
    "more": "This family includes Zionist militarism, militarized state, security state, IDF state, and war-machine language. It becomes core antizionist when it treats militarism as Israel’s inherent national identity rather than a specific policy issue.",
    "bottom": "Context Dependent / Human Review unless tied to Israel/Zionism as such."
  },
  "idf state": {
    "term": "IDF state",
    "type": "Militarized state / security-state accusation",
    "why": "“IDF state” casts Israel/Zionism as inherently militarized or security-obsessed.",
    "more": "This family includes Zionist militarism, militarized state, security state, IDF state, and war-machine language. It becomes core antizionist when it treats militarism as Israel’s inherent national identity rather than a specific policy issue.",
    "bottom": "Context Dependent / Human Review unless tied to Israel/Zionism as such."
  },
  "war machine": {
    "term": "War machine",
    "type": "Militarized state / security-state accusation",
    "why": "“War machine” casts Israel/Zionism as inherently militarized or security-obsessed.",
    "more": "This family includes Zionist militarism, militarized state, security state, IDF state, and war-machine language. It becomes core antizionist when it treats militarism as Israel’s inherent national identity rather than a specific policy issue.",
    "bottom": "Context Dependent / Human Review unless tied to Israel/Zionism as such."
  },
  "jews as white": {
    "term": "Jews as white",
    "type": "Jewish indigeneity denial",
    "meaning": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East.",
    "why": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East. It deletes Mizrahi Jews, ancient Jewish presence, exile, persecution, and return. It turns Jewish refuge and national revival into theft.",
    "more": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East. It deletes Mizrahi Jews, ancient Jewish presence, exile, persecution, and return. It turns Jewish refuge and national revival into theft.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "jews as european": {
    "term": "Jews as European",
    "type": "Jewish indigeneity denial",
    "meaning": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East.",
    "why": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East. It deletes Mizrahi Jews, ancient Jewish presence, exile, persecution, and return. It turns Jewish refuge and national revival into theft.",
    "more": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East. It deletes Mizrahi Jews, ancient Jewish presence, exile, persecution, and return. It turns Jewish refuge and national revival into theft.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "european settlers": {
    "term": "European settlers",
    "type": "Jewish indigeneity denial",
    "meaning": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East.",
    "why": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East. It deletes Mizrahi Jews, ancient Jewish presence, exile, persecution, and return. It turns Jewish refuge and national revival into theft.",
    "more": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East. It deletes Mizrahi Jews, ancient Jewish presence, exile, persecution, and return. It turns Jewish refuge and national revival into theft.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "white colonizers": {
    "term": "White colonizers",
    "type": "Jewish indigeneity denial",
    "meaning": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East.",
    "why": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East. It deletes Mizrahi Jews, ancient Jewish presence, exile, persecution, and return. It turns Jewish refuge and national revival into theft.",
    "more": "This erases Jewish history by pretending Jews are foreign Europeans in the Middle East. It deletes Mizrahi Jews, ancient Jewish presence, exile, persecution, and return. It turns Jewish refuge and national revival into theft.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "khazar": {
    "term": "Khazar",
    "type": "Adjacent Jew-hatred",
    "meaning": "The Khazar claim is pseudo-history used to steal Jewish ancestry.",
    "why": "The Khazar claim is pseudo-history used to steal Jewish ancestry. It cuts Jews away from peoplehood, Hebrew, Jerusalem, exile, and return. It tells the listener Jews are frauds in their own story.",
    "more": "The Khazar claim is pseudo-history used to steal Jewish ancestry. It cuts Jews away from peoplehood, Hebrew, Jerusalem, exile, and return. It tells the listener Jews are frauds in their own story.",
    "bottom": "No antizionism detected in this form; Jew-hatred possible."
  },
  "fake indigenous jews": {
    "term": "Fake indigenous Jews",
    "type": "Jewish indigeneity denial",
    "why": "“Fake indigenous Jews” denies Jewish historical belonging to Israel or the land.",
    "more": "These claims recast Jews as white Europeans, Khazars, foreign settlers, or fake natives. The point is to detach Jews from the land and make Jewish statehood look like a foreign implant.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "jews have no roots in the land": {
    "term": "Jews have no roots in the land",
    "type": "Jewish indigeneity denial",
    "why": "“Jews have no roots in the land” denies Jewish historical belonging to Israel or the land.",
    "more": "These claims recast Jews as white Europeans, Khazars, foreign settlers, or fake natives. The point is to detach Jews from the land and make Jewish statehood look like a foreign implant.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "ashkenazim are europeans": {
    "term": "Ashkenazim are Europeans",
    "type": "Jewish indigeneity denial",
    "meaning": "The Khazar claim is pseudo-history used to steal Jewish ancestry.",
    "why": "The Khazar claim is pseudo-history used to steal Jewish ancestry. It cuts Jews away from peoplehood, Hebrew, Jerusalem, exile, and return. It tells the listener Jews are frauds in their own story.",
    "more": "The Khazar claim is pseudo-history used to steal Jewish ancestry. It cuts Jews away from peoplehood, Hebrew, Jerusalem, exile, and return. It tells the listener Jews are frauds in their own story.",
    "bottom": "This is antizionist language when tied to Israel/Zionism."
  },
  "no jewish state": {
    "term": "No Jewish state",
    "type": "Jewish statehood denial",
    "why": "“No Jewish state” denies or rejects Jewish statehood in the land.",
    "more": "This family covers claims that Jews may not have a nation-state, that Israel has no right to exist, or that Jewish national life in the land is illegitimate. Use “statehood,” “state,” or “country” in public wording, not technical legal language.",
    "bottom": "This is core antizionist language."
  },
  "abolish zionism": {
    "term": "Abolish Zionism",
    "type": "Jewish statehood denial",
    "why": "“Abolish Zionism” denies or rejects Jewish statehood in the land.",
    "more": "This family covers claims that Jews may not have a nation-state, that Israel has no right to exist, or that Jewish national life in the land is illegitimate. Use “statehood,” “state,” or “country” in public wording, not technical legal language.",
    "bottom": "This is core antizionist language."
  },
  "end zionism": {
    "term": "End Zionism",
    "type": "Jewish statehood denial",
    "why": "“End Zionism” denies or rejects Jewish statehood in the land.",
    "more": "This family covers claims that Jews may not have a nation-state, that Israel has no right to exist, or that Jewish national life in the land is illegitimate. Use “statehood,” “state,” or “country” in public wording, not technical legal language.",
    "bottom": "This is core antizionist language."
  },
  "israel has no right to exist": {
    "term": "Israel has no right to exist",
    "type": "Jewish statehood denial",
    "why": "“Israel has no right to exist” denies or rejects Jewish statehood in the land.",
    "more": "This family covers claims that Jews may not have a nation-state, that Israel has no right to exist, or that Jewish national life in the land is illegitimate. Use “statehood,” “state,” or “country” in public wording, not technical legal language.",
    "bottom": "This is core antizionist language."
  },
  "jewish state is illegitimate": {
    "term": "Jewish state is illegitimate",
    "type": "Jewish statehood denial",
    "why": "“Jewish state is illegitimate” denies or rejects Jewish statehood in the land.",
    "more": "This family covers claims that Jews may not have a nation-state, that Israel has no right to exist, or that Jewish national life in the land is illegitimate. Use “statehood,” “state,” or “country” in public wording, not technical legal language.",
    "bottom": "This is core antizionist language."
  },
  "genocide alone": {
    "term": "Genocide alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "Genocide is a legal crime requiring intent to destroy a protected people.",
    "why": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "more": "Genocide is a legal crime requiring intent to destroy a protected people. In anti-Israel use, civilian death is treated as proof by itself. That removes Hamas’s massacre, hostages, tunnels, combatants, warnings, and human-shield warfare from the listener’s view.",
    "bottom": "Context Dependent / Human Review."
  },
  "apartheid alone": {
    "term": "Apartheid alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "Apartheid was South Africa’s legal system of racial separation and caste.",
    "why": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "more": "Apartheid was South Africa’s legal system of racial separation and caste. Applied to Israel, the word imports that history onto a state where Arab citizens vote, form parties, sit in the Knesset, use the courts, and have served on the Supreme Court. It teaches South Africa before Israel’s facts are heard.",
    "bottom": "Context Dependent / Human Review."
  },
  "ethnostate alone": {
    "term": "Ethnostate alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech.",
    "why": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech. Applied to Israel, Hebrew, Jewish holidays, Jewish symbols, and Jewish immigration are treated as proof of racial rule. The double standard is the evidence: ordinary national features are made sinister when Jews have them.",
    "more": "The term comes from ethnicity-and-nationalism writing and later racial separatist speech. Applied to Israel, Hebrew, Jewish holidays, Jewish symbols, and Jewish immigration are treated as proof of racial rule. The double standard is the evidence: ordinary national features are made sinister when Jews have them.",
    "bottom": "Context Dependent / Human Review."
  },
  "settler colonial alone": {
    "term": "Settler-colonial alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "This term comes from studies of European settlement on Indigenous land.",
    "why": "This term comes from studies of European settlement on Indigenous land. Applied to Israel, it casts Jews as Europeans planted in someone else’s country. It cuts Jews away from Hebrew, Jerusalem, Jewish law, exile, return, and continuous Jewish life in the land.",
    "more": "This term comes from studies of European settlement on Indigenous land. Applied to Israel, it casts Jews as Europeans planted in someone else’s country. It cuts Jews away from Hebrew, Jerusalem, Jewish law, exile, return, and continuous Jewish life in the land.",
    "bottom": "Context Dependent / Human Review."
  },
  "colonizer alone": {
    "term": "Colonizer alone",
    "type": "Context-dependent antizionist vocabulary",
    "why": "“Colonizer” can appear in antizionist accusation language, but the word alone is not enough.",
    "more": "The app should check whether the term is tied to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, antizionist libels, or antizionist chants. If clearly unrelated, it should not be treated as antizionism.",
    "bottom": "Context Dependent / Human Review."
  },
  "imperialist alone": {
    "term": "Imperialist alone",
    "type": "Context-dependent antizionist vocabulary",
    "why": "“Imperialist” can appear in antizionist accusation language, but the word alone is not enough.",
    "more": "The app should check whether the term is tied to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, antizionist libels, or antizionist chants. If clearly unrelated, it should not be treated as antizionism.",
    "bottom": "Context Dependent / Human Review."
  },
  "occupation alone": {
    "term": "Occupation alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "Occupation is a legal term for control of territory in war.",
    "why": "Occupation is a legal term for control of territory in war. Used for all of Israel, not disputed territory, it says Jews are trespassers. The word moves the target from 1967 to 1948.",
    "more": "Occupation is a legal term for control of territory in war. Used for all of Israel, not disputed territory, it says Jews are trespassers. The word moves the target from 1967 to 1948.",
    "bottom": "Context Dependent / Human Review."
  },
  "resistance alone": {
    "term": "Resistance alone",
    "type": "Context-dependent antizionist vocabulary",
    "why": "“Resistance” can appear in antizionist slogan language, but the word alone is not enough.",
    "more": "The app should check whether the term is tied to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, antizionist libels, or antizionist chants. If clearly unrelated, it should not be treated as antizionism.",
    "bottom": "Context Dependent / Human Review."
  },
  "hasbara alone": {
    "term": "Hasbara alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy.",
    "why": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "more": "Hasbara is Hebrew for explanation and is tied to Israeli public diplomacy. In anti-Israel use, it tells the listener that pro-Israel speech is propaganda before the claim is heard. The word teaches dismissal before listening.",
    "bottom": "Context Dependent / Human Review."
  },
  "bds alone": {
    "term": "BDS alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "BDS began as a 2005 boycott, divestment, and sanctions call against Israel.",
    "why": "BDS began as a 2005 boycott, divestment, and sanctions call against Israel. Its demands include refugee “return,” meaning millions of Palestinian descendants entering Israel. That would end Israel as a Jewish state by numbers, not argument.",
    "more": "BDS began as a 2005 boycott, divestment, and sanctions call against Israel. Its demands include refugee “return,” meaning millions of Palestinian descendants entering Israel. That would end Israel as a Jewish state by numbers, not argument.",
    "bottom": "Context Dependent / Human Review."
  },
  "free palestine alone": {
    "term": "Free Palestine alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "The phrase sounds like a chant for liberation, but here it calls for the destruction of the Jewish state.",
    "why": "The phrase sounds like a chant for liberation, but here it calls for the destruction of the Jewish state. “Free” means no Israel. It turns Palestinian freedom into Israel’s erasure.",
    "more": "The phrase sounds like a chant for liberation, but here it calls for the destruction of the Jewish state. “Free” means no Israel. It turns Palestinian freedom into Israel’s erasure.",
    "bottom": "Context Dependent / Human Review."
  },
  "free gaza alone": {
    "term": "Free Gaza alone",
    "type": "Context-dependent antizionist vocabulary",
    "why": "“Free Gaza” can appear in liberation slogan language, but the phrase alone is not enough.",
    "more": "The app should check whether the term is tied to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, antizionist libels, or antizionist chants. If clearly unrelated, it should not be treated as antizionism.",
    "bottom": "Context Dependent / Human Review."
  },
  "decolonize alone": {
    "term": "Decolonize alone",
    "type": "Context-dependent antizionist vocabulary",
    "meaning": "This takes anti-colonial language and points it at Jewish national life.",
    "why": "This takes anti-colonial language and points it at Jewish national life. It does not ask for coexistence, two states, or equal rights. It calls for Israel to be destroyed and replaced.",
    "more": "This takes anti-colonial language and points it at Jewish national life. It does not ask for coexistence, two states, or equal rights. It calls for Israel to be destroyed and replaced.",
    "bottom": "Context Dependent / Human Review."
  },
  "supremacist alone": {
    "term": "Supremacist alone",
    "type": "Context-dependent antizionist vocabulary",
    "why": "“Supremacist” can appear in antizionist accusation language, but the word alone is not enough.",
    "more": "The app should check whether the term is tied to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, antizionist libels, or antizionist chants. If clearly unrelated, it should not be treated as antizionism.",
    "bottom": "Context Dependent / Human Review."
  },
  "zionist regime": {
    "term": "Zionist Entity",
    "type": "Israel elimination / replacement language",
    "meaning": "The phrase comes from movements that refuse to say Israel.",
    "why": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "more": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "bottom": "This is antizionist language."
  },
  "zionist state": {
    "term": "Zionist Entity",
    "type": "Israel elimination / replacement language",
    "meaning": "The phrase comes from movements that refuse to say Israel.",
    "why": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "more": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "bottom": "This is antizionist language."
  },
  "zionist project": {
    "term": "Zionist Entity",
    "type": "Israel elimination / replacement language",
    "meaning": "The phrase comes from movements that refuse to say Israel.",
    "why": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "more": "The phrase comes from movements that refuse to say Israel. Hamas and Iran use it because calling Israel by its name treats it as a real country. Hamas’s 2017 document uses “Zionist entity” while saying there shall be no recognition of Israel.",
    "bottom": "This is antizionist language."
  },
  "we dont want two states we want 48": {
    "term": "We don’t want two states, we want ’48",
    "type": "Israel elimination / replacement language",
    "meaning": "This rejects partition and points back before Israel’s founding.",
    "why": "This rejects partition and points back before Israel’s founding. It does not object to one border, leader, settlement, or law. It asks for the condition that existed before there was a Jewish state.",
    "more": "This rejects partition and points back before Israel’s founding. It does not object to one border, leader, settlement, or law. It asks for the condition that existed before there was a Jewish state.",
    "bottom": "This is antizionist language."
  },
  "we do not want two states we want 48": {
    "term": "We don’t want two states, we want ’48",
    "type": "Israel elimination / replacement language",
    "meaning": "This rejects partition and points back before Israel’s founding.",
    "why": "This rejects partition and points back before Israel’s founding. It does not object to one border, leader, settlement, or law. It asks for the condition that existed before there was a Jewish state.",
    "more": "This rejects partition and points back before Israel’s founding. It does not object to one border, leader, settlement, or law. It asks for the condition that existed before there was a Jewish state.",
    "bottom": "This is antizionist language."
  }
};

const CATEGORY_SCREEN_WORDING = {
  "AIPAC / pro-Israel lobby claim": {
    type: "AIPAC and lobby",
    meaning: "The AIPAC and lobby claim says a hidden Jewish lobby buys politicians and runs American foreign policy.",
    why: "It matters because antizionism here recycles the Protocols, turning an ordinary advocacy group into proof that Jews secretly rule, so every pro-Israel vote becomes corruption and every Jewish donor a suspect."
  },
  "Zionism/Nazi inversion": {
    type: "Nazi and Holocaust inversion",
    meaning: "Nazi and Holocaust inversion brands Jews and Israel as the new Nazis, through slurs like \"Zionazi\" and claims that the Holocaust is Zionist propaganda.",
    why: "It matters because antizionism uses the inversion to turn the Jews' deepest wound into their indictment, erasing the six million while licensing hatred as antifascism."
  },
  "Genocide accusation": {
    type: "Genocide",
    meaning: "The genocide accusation charges Israel with exterminating the Palestinian people, stated as verdict rather than claim.",
    why: "It matters because it is antizionism's supreme libel, casting genocide survivors as its new perpetrators, and anyone who believes it sees attacks on Jews as rescue."
  },
  "Apartheid accusation": {
    type: "Apartheid",
    meaning: "The apartheid accusation labels Israel a race-based segregation regime, borrowing South Africa's crime.",
    why: "It matters because apartheid states get abolished, not reformed, so antizionism uses the label to schedule Israel for dismantlement and brand every Zionist a racist, despite two million Arab citizens who vote, judge, and legislate."
  },
  "Ethnostate / supremacy accusation": {
    type: "Ethnostate and supremacy",
    meaning: "The ethnostate and supremacy charge calls Israel a \"Jewish supremacist\" state built on ethnic purity.",
    why: "It matters because dozens of states have crosses on flags or Islam in constitutions, yet antizionism condemns only the Jewish one, and that single exception exposes the target."
  },
  "Hasbara dismissal": {
    type: "Hasbara",
    meaning: "The hasbara dismissal rejects any fact favorable to Israel, and anyone stating it, as paid propaganda.",
    why: "It matters because antizionism uses it to disqualify evidence in advance, reviving the old charge that Jewish speech is inherently deceitful."
  },
  "Israel elimination / replacement language": {
    type: "River-to-sea and replacement",
    meaning: "River-to-sea and replacement language calls for Israel's end, from \"from the river to the sea\" to \"wipe Israel off the map\" and \"Isnotreal.\"",
    why: "It matters because the geography leaves no Jewish state and no future for its seven million Jews, which is why the Hamas charter claims the same map."
  },
  "Intifada / violence-escalation language": {
    type: "Intifada and violence escalation",
    meaning: "Intifada language calls for uprising against Israel and Jews, as in \"globalize the intifada.\"",
    why: "It matters because the word has a body count, over 1,000 Israelis murdered in the Second Intifada, and \"globalize\" exports that program to Jews everywhere, as the DC museum murders showed."
  },
  "Resistance / violence-shielding language": {
    type: "Resistance and violence shielding",
    meaning: "Resistance language renames violence against Jews as \"resistance,\" as in \"resistance is justified\" and \"October 7 justified.\"",
    why: "It matters because this is the inversion antizionism runs on, converting massacre into virtue and Jewish self-defense into crime, pre-approving the next attack."
  },
  "Anti-IDF death slogan / violence endorsement": {
    type: "Resistance and violence shielding",
    meaning: "Resistance language renames violence against Jews as \"resistance,\" as in \"resistance is justified\" and \"October 7 justified.\"",
    why: "It matters because this is the inversion antizionism runs on, converting massacre into virtue and Jewish self-defense into crime, pre-approving the next attack."
  },
  "Zionist exclusion / antizionist social exclusion": {
    type: "Zionist exclusion",
    meaning: "Zionist exclusion bars \"Zionists\" from spaces and groups, as in \"no Zionists allowed\" and loyalty tests demanding Jews denounce Israel.",
    why: "It matters because most Jews hold some attachment to Israel, so \"no Zionists\" works as \"no Jews\" with deniability, the guild exclusion rebuilt in progressive rooms."
  },
  "Boycott / anti-normalization pressure": {
    type: "BDS and boycott",
    meaning: "BDS and anti-normalization organize the shunning of Israelis and their institutions from academic, cultural, and economic life.",
    why: "It matters because its founders openly seek Israel's end, not reform, and its penalties land on people: disinvited scholars, expelled Jewish student groups, picketed kosher shops."
  },
  "Jewish institution targeting in antizionist language": {
    type: "Jewish institutions",
    meaning: "Jewish institution targeting treats synagogues, Hillels, and Chabads as \"Zionist fronts\" to ban, remove, or attack.",
    why: "It matters because it is antizionism's clearest tell: politics has an address at the embassy, but these campaigns march past it to reach Jews where they gather, from Bondi Beach to the Capital Jewish Museum."
  },
  "Zionist control claim": {
    type: "Control and hidden power",
    meaning: "The control claim says Zionists run the media, money, and politics, as in \"AIPAC buys politicians\" and \"Zionist media.\"",
    why: "It matters because no critique of Israeli policy requires a theory of hidden Jewish power over your own country; only Jew-hatred does, and it is the Protocols with a find-and-replace."
  },
  "Zionist dual-loyalty / foreign-allegiance claim": {
    type: "Dual loyalty",
    meaning: "The dual-loyalty charge accuses Jews of serving Israel over their own countries, as in \"Israel-firster.\"",
    why: "It matters because antizionism uses it to mark diaspora Jews as resident foreigners, the accusation behind Dreyfus and Stalin's purges, now aimed at any Jew insufficiently hostile to Israel."
  },
  "Colonial / decolonization language": {
    type: "Colonial and decolonization",
    meaning: "Colonial language brands Jews as European settlers on someone else's land and their removal as \"decolonization.\"",
    why: "It matters because it inverts the oldest documented indigeneity claim on earth, and since Jews have no mother country to return to, the only \"decolonized\" outcome is their elimination, which activists cheered as such on October 7."
  },
  "Occupation / liberation slogan": {
    type: "Occupation and liberation",
    meaning: "Occupation and liberation language calls all of Israel \"occupied\" and its removal \"liberation.\"",
    why: "It matters because dating the \"occupation\" to 1948 marks the state's birth as the crime, so antizionism converts Israel's existence into an offense that only dismantlement can end."
  },
  "Jewish statehood denial": {
    type: "Jewish state denial",
    meaning: "Jewish state denial rejects Israel's right to exist in any borders, as in \"born in sin\" and \"not a real country.\"",
    why: "It matters because it is antizionism's floor, the position every libel is built to justify, offering Jews the one arrangement history has already tested and failed: minority status at the mercy of others."
  },
  "Jewish indigeneity denial": {
    type: "Jewish indigeneity denial",
    meaning: "Indigeneity denial calls Jews foreign to the land, through \"go back to Europe,\" the Khazar claim, and \"fake Jews.\"",
    why: "It matters because antizionism needs Jews rootless: a people foreign to the land can be told to leave it, which requires erasing three millennia of presence and the Mizrahi majority expelled from Arab lands."
  },
  "Israel/Zionism blood-or-body libel": {
    type: "Blood and body libels",
    meaning: "Blood and body libels accuse Israel of organ harvesting, blood-drinking, and child predation.",
    why: "It matters because this is the medieval blood libel transferred intact from Norwich in 1144 to viral posts, and it needs no evidence because it never had any, only the conviction that Jews kill children by nature."
  },
  "Israeli / Zionist collective demonization": {
    type: "Demonization and slurs",
    meaning: "Demonization slurs mark Jews and Israel as vermin and monsters, through \"Zio,\" \"Israhell,\" \"baby-killer,\" and \"cancerous tumor state.\"",
    why: "It matters because disease and vermin language is the oldest pre-massacre vocabulary on record, and a tumor has one treatment: removal."
  },
  "Zionist slur / hostile label": {
    type: "Demonization and slurs",
    meaning: "Demonization slurs mark Jews and Israel as vermin and monsters, through \"Zio,\" \"Israhell,\" \"baby-killer,\" and \"cancerous tumor state.\"",
    why: "It matters because disease and vermin language is the oldest pre-massacre vocabulary on record, and a tumor has one treatment: removal."
  },
  "Eliminationist / dehumanizing state metaphor": {
    type: "Demonization and slurs",
    meaning: "Demonization slurs mark Jews and Israel as vermin and monsters, through \"Zio,\" \"Israhell,\" \"baby-killer,\" and \"cancerous tumor state.\"",
    why: "It matters because disease and vermin language is the oldest pre-massacre vocabulary on record, and a tumor has one treatment: removal."
  },
  "Western proxy / imperial outpost language": {
    type: "Western proxy and empire",
    meaning: "The proxy claim says Israel is an imperial outpost, a Western weapon rather than a nation.",
    why: "It matters because the vocabulary is inherited Soviet antizionism from the 1975 Zionism-is-racism campaign, and it strips Israelis of their own history so their state becomes a thing to dismantle, not a people to negotiate with."
  },
  "Bad-faith laundering claim": {
    type: "Washing claims",
    meaning: "Washing claims, like pinkwashing and medical-washing, say every Israeli virtue is a cover for crime.",
    why: "It matters because the device makes Israel unfalsifiable to antizionism: gay rights, field hospitals, and vaccines all become propaganda, so nothing Jews do can ever count in their favor."
  },
  "Context-dependent antizionist vocabulary": {
    type: "Other context terms",
    meaning: "Context terms like \"Free Palestine,\" \"lift the siege,\" and \"blood on your hands\" are dual-use phrases whose meaning depends on cluster and target.",
    why: "It matters because these words carry the antizionist charge when they arrive braided with the lexicon or aimed at Jewish targets, as when \"Free, free Palestine\" was shouted over the bodies at the Capital Jewish Museum, and reading the braid is how the Detector tells politics from Jew-hatred."
  },
  "Palestine liberation slogan": {
    type: "Other context terms",
    meaning: "Context terms like \"Free Palestine,\" \"lift the siege,\" and \"blood on your hands\" are dual-use phrases whose meaning depends on cluster and target.",
    why: "It matters because these words carry the antizionist charge when they arrive braided with the lexicon or aimed at Jewish targets, as when \"Free, free Palestine\" was shouted over the bodies at the Capital Jewish Museum, and reading the braid is how the Detector tells politics from Jew-hatred."
  }
};

const GLOSSARY_BASE_URL = 'https://kilejones-alt.github.io/TheAntizionistGlossary/';

function glossaryResource(title, slug) {
  return { title, url: GLOSSARY_BASE_URL + slug };
}

const DEFAULT_GLOSSARY_RESOURCES = [
  glossaryResource('The Antizionist Glossary A–Z', 'glossary.html'),
  glossaryResource('Introduction', 'introduction.html')
];

const TERM_GLOSSARY_RESOURCE_RULES = [
  { terms: ['aipac', 'israel lobby', 'zionist lobby', 'pro israel lobby', 'pro-israel lobby', 'powerful lobby', 'lobbyists'], resources: [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')] },
  { terms: ['zionazi', 'zio nazi', 'zionazi', 'zio', 'zios', 'modern day nazis', 'nazi state', 'idf are nazis', 'holocaust inversion', 'holocaust as zionist propaganda'], resources: [glossaryResource('Zio / Zionazi', 'zio-zionazi.html'), glossaryResource('Modern-Day Nazis / Nazi State', 'modern-day-nazis.html')] },
  { terms: ['genocide', 'genocidal', 'stop the genocide', 'stop the genocide in gaza', 'zionism is genocide'], resources: [glossaryResource('Genocide / Genocidal', 'genocide.html'), glossaryResource('Stop the Genocide', 'stop-the-genocide.html')] },
  { terms: ['apartheid', 'apartheid state', 'medical apartheid', 'bantustanization', 'apartheid wall'], resources: [glossaryResource('Apartheid', 'apartheid.html'), glossaryResource('Apartheid Wall', 'apartheid-wall.html')] },
  { terms: ['ethnostate', 'jewish ethnostate', 'jewish supremacy', 'zionist supremacy', 'ethno supremacy', 'ethno superiority'], resources: [glossaryResource('Ethnostate', 'ethnostate.html'), glossaryResource('Jewish Supremacy', 'jewish-supremacy.html')] },
  { terms: ['hasbara', 'hasbara agent', 'hasbara shill', 'hasbara bot'], resources: [glossaryResource('Hasbara', 'hasbara.html')] },
  { terms: ['from the river to the sea', 'river to the sea', 'free palestine', 'wipe israel off the map', 'isnotreal', 'abolish israel', 'dismantle israel'], resources: [glossaryResource('From the River to the Sea', 'from-the-river-to-the-sea.html'), glossaryResource('Free Palestine', 'free-palestine.html')] },
  { terms: ['globalize the intifada', 'long live the intifada', 'intifada revolution', 'intifada uprising', 'intifada'], resources: [glossaryResource('Globalize the Intifada', 'globalize-the-intifada.html')] },
  { terms: ['resistance is justified', 'by any means necessary', 'resistance is not terrorism', 'october 7 justified', 'al aqsa flood justified'], resources: [glossaryResource('By Any Means Necessary', 'by-any-means-necessary.html')] },
  { terms: ['no zionists allowed', 'keep zionists out', 'zionists should be banned', 'no zionist space', 'zionist speakers ban'], resources: [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')] },
  { terms: ['bds', 'boycott israel', 'boycott israeli institutions', 'academic boycott', 'cultural boycott', 'anti normalization', 'anti-normalization'], resources: [glossaryResource('Boycott, Divestment, Sanctions (BDS)', 'boycott-divestment-sanctions.html')] },
  { terms: ['hillel', 'chabad', 'synagogue', 'jewish institution', 'zionist front'], resources: [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')] },
  { terms: ['zionists control', 'zionist media', 'zio media', 'aipac controls', 'aipac buys', 'zionist money', 'zionist lobby controls'], resources: [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')] },
  { terms: ['israel firster', 'dual loyalty', 'foreign allegiance'], resources: [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')] },
  { terms: ['settler colonial', 'settler colonialism', 'colonizer', 'colonizers', 'zionism is colonialism', 'colonial entity', 'colonial project'], resources: [glossaryResource('Settler-Colonialism', 'settler-colonialism.html'), glossaryResource('Settler-Colonialism', 'settler-colonialism.html')] },
  { terms: ['occupation', 'occupier', 'occupiers', 'israeli occupier', 'israeli occupiers', 'zionist occupier', 'zionist occupiers', 'end the occupation', 'occupied palestine', 'liberation', 'end the blockade', 'lift the siege', 'break the siege', 'open air prison'], resources: [glossaryResource('End the Occupation', 'end-the-occupation.html'), glossaryResource('End the Blockade', 'end-the-blockade.html'), glossaryResource('Open-Air Prison', 'open-air-prison.html')] },
  { terms: ['jewish state illegitimate', 'israel never should have been created', 'born in sin', 'not a real country', 'israel stole palestine'], resources: [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')] },
  { terms: ['go back to europe', 'white europeans', 'khazar', 'fake jews', 'foreign colonizers', 'white colonial settlers'], resources: [glossaryResource('Zionism', 'zionism.html'), glossaryResource('Settler-Colonialism', 'settler-colonialism.html'), glossaryResource('Settler-Colonialism', 'settler-colonialism.html')] },
  { terms: ['organ harvesting', 'blood on your hands', 'blood drinkers', 'blood libel', 'child blood', 'kill children for sport'], resources: [glossaryResource('Blood on Your Hands', 'blood-on-your-hands.html'), glossaryResource('Child Killers', 'child-killers.html')] },
  { terms: ['zio bot', 'zio-bot', 'zio troll', 'zio-troll', 'zio tears', 'zionist tears', 'israhell', 'baby killer', 'baby-killer', 'child killer', 'child-killer', 'child killers', 'child-killers', 'vermin', 'cancerous tumor'], resources: [glossaryResource('Zio / Zionazi', 'zio-zionazi.html'), glossaryResource('Child Killers', 'child-killers.html'), glossaryResource('Butcher(s) of Gaza', 'butcher-of-gaza.html')] },
  { terms: ['ethnic cleansing', 'collective punishment', 'war crimes', 'war crime', 'humanitarian atrocity', 'atrocity'], resources: [glossaryResource('Collective Punishment', 'collective-punishment.html')] },
  { terms: ['imperial state', 'western proxy', 'western outpost', 'imperial outpost', 'empire proxy'], resources: [glossaryResource('Imperial State', 'imperial-state.html')] },
  { terms: ['pinkwashing', 'bluewashing', 'medical washing', 'medical-washing', 'academic washing', 'academic-washing', 'greenwashing', 'green-washing', 'sportswashing', 'sports-washing'], resources: [glossaryResource('Pinkwashing', 'pinkwashing.html'), glossaryResource('Apartheid', 'apartheid.html')] },
  { terms: ['zionism is racism', 'zionism racism'], resources: [glossaryResource('Zionism Is Racism', 'zionism-is-racism.html')] },
];

const CATEGORY_GLOSSARY_RESOURCES = {
  'AIPAC and lobby': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')],
  'AIPAC / pro-Israel lobby claim': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')],
  'Adjacent Jew-hatred': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Blood on Your Hands', 'blood-on-your-hands.html')],
  'Apartheid': [glossaryResource('Apartheid', 'apartheid.html'), glossaryResource('Apartheid Wall', 'apartheid-wall.html')],
  'Apartheid accusation': [glossaryResource('Apartheid', 'apartheid.html'), glossaryResource('Apartheid Wall', 'apartheid-wall.html')],
  'Bad-faith laundering claim': [glossaryResource('Hasbara', 'hasbara.html'), glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html')],
  'BDS and boycott': [glossaryResource('Boycott, Divestment, Sanctions (BDS)', 'boycott-divestment-sanctions.html')],
  'Boycott / anti-normalization pressure': [glossaryResource('Boycott, Divestment, Sanctions (BDS)', 'boycott-divestment-sanctions.html')],
  'Carceral / confinement accusation': [glossaryResource('Open-Air Prison', 'open-air-prison.html'), glossaryResource('End the Blockade', 'end-the-blockade.html')],
  'Colonial and decolonization': [glossaryResource('Settler-Colonialism', 'settler-colonialism.html'), glossaryResource('Settler-Colonialism', 'settler-colonialism.html')],
  'Colonial / decolonization language': [glossaryResource('Settler-Colonialism', 'settler-colonialism.html'), glossaryResource('Settler-Colonialism', 'settler-colonialism.html')],
  'Context-dependent antizionist language': [glossaryResource('Introduction', 'introduction.html'), glossaryResource('Glossary A–Z', 'glossary.html')],
  'Context-dependent antizionist vocabulary': [glossaryResource('Introduction', 'introduction.html'), glossaryResource('Glossary A–Z', 'glossary.html')],
  'Cultural erasure / appropriation accusation': [glossaryResource('Zionism', 'zionism.html')],
  'Delegitimizing state label': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism Is Racism', 'zionism-is-racism.html')],
  'Direct antizionist identification / endorsement': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')],
  'Demonization and slurs': [glossaryResource('Zio / Zionazi', 'zio-zionazi.html'), glossaryResource('Child Killers', 'child-killers.html')],
  'Eliminationist / dehumanizing state metaphor': [glossaryResource('Zio / Zionazi', 'zio-zionazi.html'), glossaryResource('Butcher(s) of Gaza', 'butcher-of-gaza.html')],
  'Ethnostate and supremacy': [glossaryResource('Ethnostate', 'ethnostate.html'), glossaryResource('Jewish Supremacy', 'jewish-supremacy.html')],
  'Ethnostate / supremacy accusation': [glossaryResource('Ethnostate', 'ethnostate.html'), glossaryResource('Jewish Supremacy', 'jewish-supremacy.html')],
  'Expansionist / annexation accusation': [glossaryResource('Imperial State', 'imperial-state.html')],
  'Genocide': [glossaryResource('Genocide / Genocidal', 'genocide.html'), glossaryResource('Stop the Genocide', 'stop-the-genocide.html')],
  'Genocide accusation': [glossaryResource('Genocide / Genocidal', 'genocide.html'), glossaryResource('Stop the Genocide', 'stop-the-genocide.html')],
  'Hasbara': [glossaryResource('Hasbara', 'hasbara.html')],
  'Hasbara dismissal': [glossaryResource('Hasbara', 'hasbara.html')],
  'Humanitarian atrocity / war-crimes accusation': [glossaryResource('Collective Punishment', 'collective-punishment.html'), glossaryResource('Child Killers', 'child-killers.html')],
  'IDF / Israel delegitimizing label': [glossaryResource('Butcher(s) of Gaza', 'butcher-of-gaza.html'), glossaryResource('Child Killers', 'child-killers.html')],
  'Intifada and violence escalation': [glossaryResource('Globalize the Intifada', 'globalize-the-intifada.html')],
  'Intifada / violence-escalation language': [glossaryResource('Globalize the Intifada', 'globalize-the-intifada.html')],
  'Israel elimination / replacement language': [glossaryResource('From the River to the Sea', 'from-the-river-to-the-sea.html'), glossaryResource('Free Palestine', 'free-palestine.html')],
  'Israel/Zionism blood-or-body libel': [glossaryResource('Blood on Your Hands', 'blood-on-your-hands.html'), glossaryResource('Child Killers', 'child-killers.html')],
  'Israeli / Zionist collective demonization': [glossaryResource('Zio / Zionazi', 'zio-zionazi.html'), glossaryResource('Child Killers', 'child-killers.html')],
  'Jewish indigeneity denial': [glossaryResource('Zionism', 'zionism.html'), glossaryResource('Settler-Colonialism', 'settler-colonialism.html'), glossaryResource('Settler-Colonialism', 'settler-colonialism.html')],
  'Jewish institution targeting in antizionist language': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')],
  'Jewish statehood denial': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')],
  'Militarized experimentation accusation': [glossaryResource('Pinkwashing', 'pinkwashing.html'), glossaryResource('Apartheid', 'apartheid.html')],
  'Nazi and Holocaust inversion': [glossaryResource('Zio / Zionazi', 'zio-zionazi.html'), glossaryResource('Modern-Day Nazis / Nazi State', 'modern-day-nazis.html')],
  'Occupation and liberation': [glossaryResource('End the Occupation', 'end-the-occupation.html'), glossaryResource('Free Palestine', 'free-palestine.html')],
  'Occupation / liberation language': [glossaryResource('End the Occupation', 'end-the-occupation.html'), glossaryResource('Free Palestine', 'free-palestine.html')],
  'Occupation / liberation slogan': [glossaryResource('End the Occupation', 'end-the-occupation.html'), glossaryResource('Free Palestine', 'free-palestine.html')],
  'Palestine liberation slogan': [glossaryResource('Free Palestine', 'free-palestine.html'), glossaryResource('From the River to the Sea', 'from-the-river-to-the-sea.html')],
  'Question-as-accusation using antizionist labels': [glossaryResource('Glossary A–Z', 'glossary.html'), glossaryResource('Introduction', 'introduction.html')],
  'Resistance and violence shielding': [glossaryResource('By Any Means Necessary', 'by-any-means-necessary.html'), glossaryResource('Globalize the Intifada', 'globalize-the-intifada.html')],
  'Resistance / violence-shielding language': [glossaryResource('By Any Means Necessary', 'by-any-means-necessary.html'), glossaryResource('Globalize the Intifada', 'globalize-the-intifada.html')],
  'River-to-sea and replacement': [glossaryResource('From the River to the Sea', 'from-the-river-to-the-sea.html'), glossaryResource('Free Palestine', 'free-palestine.html')],
  'Western outpost / imperial language': [glossaryResource('Imperial State', 'imperial-state.html')],
  'Western proxy and empire': [glossaryResource('Imperial State', 'imperial-state.html')],
  'Western proxy / imperial outpost frame': [glossaryResource('Imperial State', 'imperial-state.html')],
  'Zionism-racism equation': [glossaryResource('Zionism Is Racism', 'zionism-is-racism.html')],
  'Zionist control claim': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')],
  'Zionist dual-loyalty / foreign-allegiance claim': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')],
  'Zionist exclusion / antizionist social exclusion': [glossaryResource('Anti-Zionism / Antizionism', 'anti-zionism.html'), glossaryResource('Zionism', 'zionism.html')],
  'Zionist slur / hostile label': [glossaryResource('Zio / Zionazi', 'zio-zionazi.html'), glossaryResource('Zionism', 'zionism.html')],
  'Zionist slur / person-targeting label': [glossaryResource('Zio / Zionazi', 'zio-zionazi.html'), glossaryResource('Zionism', 'zionism.html')],
  'Zionism/Nazi inversion': [glossaryResource('Modern-Day Nazis / Nazi State', 'modern-day-nazis.html'), glossaryResource('Zio / Zionazi', 'zio-zionazi.html')],
  'Outside app scope': DEFAULT_GLOSSARY_RESOURCES,
  'Other context terms': DEFAULT_GLOSSARY_RESOURCES
};

function addUniqueResources(target, resources) {
  (resources || []).forEach(resource => {
    if (!resource || !resource.title || !resource.url) return;
    if (!target.some(x => x.url === resource.url)) target.push(resource);
  });
}

function dataResourceCandidates(data, standaloneContext = false) {
  const candidates = [];
  publicMatchSnippets(data).forEach(x => candidates.push(x));
  ((data && data.trigger_terms) || []).forEach(x => candidates.push(x));
  ((data && data.pattern_categories) || []).forEach(x => candidates.push(x));
  ((data && data.matched_sentences) || []).forEach(item => {
    ((item && item.matched_text) || []).forEach(x => candidates.push(x));
    ((item && item.triggers) || []).forEach(x => candidates.push(x));
    ((item && item.categories) || []).forEach(x => candidates.push(x));
  });
  const screenEntry = screenWordingEntryForData(data);
  if (screenEntry && screenEntry.type) candidates.push(screenEntry.type);
  if (standaloneContext && data && data.input_text) candidates.push(data.input_text);
  return unique(candidates.map(x => String(x || '').trim()).filter(Boolean));
}

function glossaryResourcesForData(data, hasMapped = false, standaloneContext = false) {
  const resources = [];
  const defaults = [];
  const candidates = dataResourceCandidates(data, standaloneContext);
  const candidateText = candidates.join(' | ');
  TERM_GLOSSARY_RESOURCE_RULES.forEach(rule => {
    const matched = (rule.terms || []).some(term => candidates.some(candidate => phraseContains(candidate, term)) || phraseContains(candidateText, term));
    if (matched) addUniqueResources(resources, rule.resources);
  });
  candidates.forEach(candidate => {
    const direct = CATEGORY_GLOSSARY_RESOURCES[candidate];
    if (!direct) return;
    if (direct === DEFAULT_GLOSSARY_RESOURCES || candidate === 'Other context terms' || /Context-dependent antizionist/.test(candidate)) {
      addUniqueResources(defaults, direct);
    } else {
      addUniqueResources(resources, direct);
    }
  });
  if (!resources.length) addUniqueResources(resources, defaults.length ? defaults : DEFAULT_GLOSSARY_RESOURCES);
  return resources.slice(0, 4);
}

function renderResourcesBox(data, hasMapped = false, standaloneContext = false) {
  const target = document.getElementById('resourcesBox');
  if (!target) return;
  target.textContent = '';
  const resources = glossaryResourcesForData(data, hasMapped, standaloneContext);
  if (!resources.length) return;
  const list = document.createElement('ul');
  list.className = 'resource-links';
  resources.forEach(resource => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = resource.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = resource.title;
    item.appendChild(link);
    list.appendChild(item);
  });
  target.appendChild(list);
}


function screenCategoryOverride(entry) {
  if (!entry || !entry.type) return entry;
  const override = CATEGORY_SCREEN_WORDING[entry.type];
  if (!override) return entry;
  return {
    ...entry,
    type: override.type || entry.type,
    meaning: override.meaning || entry.meaning,
    why: override.why || entry.why,
    more: override.more || override.why || entry.more
  };
}

function categoryScreenWordingFromData(data) {
  const candidates = [];
  ((data && data.pattern_categories) || []).forEach(x => candidates.push(x));
  ((data && data.matched_sentences) || []).forEach(item => {
    ((item && item.categories) || []).forEach(x => candidates.push(x));
  });
  for (const raw of candidates) {
    const direct = CATEGORY_SCREEN_WORDING[String(raw || '').trim()];
    if (direct) return { ...direct, bottom: 'This is antizionist language.' };
  }
  return null;
}

function normalizeScreenTerm(value) {
  return String(value || '')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function phraseContains(haystack, needle) {
  const h = normalizeScreenTerm(haystack);
  const n = normalizeScreenTerm(needle);
  if (!h || !n) return false;
  if (h === n) return true;
  if (n.length < 4) return false;
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(?:^| )' + escaped + '(?: |$)').test(h);
}

function screenWordingEntryForData(data) {
  if (!data) return null;
  const candidates = [];
  publicMatchSnippets(data).forEach(x => candidates.push(x));
  ((data && data.trigger_terms) || []).forEach(x => candidates.push(x));
  ((data && data.matched_sentences) || []).forEach(item => {
    (item.matched_text || []).forEach(x => candidates.push(x));
    (item.triggers || []).forEach(x => candidates.push(x));
  });
  const normalizedCandidates = candidates.map(normalizeScreenTerm).filter(Boolean);
  let best = null;
  let bestLen = 0;
  for (const [key, entry] of Object.entries(EDUCATIONAL_SCREEN_WORDING)) {
    if (!key) continue;
    const inCandidates = normalizedCandidates.some(c => phraseContains(c, key) || (key.length >= 8 && phraseContains(key, c)));
    if (inCandidates && key.length > bestLen) {
      best = entry;
      bestLen = key.length;
    }
  }
  const categoryEntry = categoryScreenWordingFromData(data);
  if (best) {
    const bestEntry = screenCategoryOverride(best);
    const bestType = String((bestEntry && bestEntry.type) || '');
    const categoryType = String((categoryEntry && categoryEntry.type) || '');
    const bestIsContext = /^(Other context terms|Context-dependent antizionist vocabulary)$/i.test(bestType);
    const categoryIsSpecific = categoryEntry && !/^(Other context terms|Context-dependent antizionist vocabulary)$/i.test(categoryType);
    if (bestIsContext && categoryIsSpecific) return categoryEntry;
    return bestEntry;
  }
  return categoryEntry;
}

function publicMatchSnippets(data) {
  if (!hasMappedTriggers(data)) return [];
  const snippets = [];
  (data.matched_sentences || []).forEach(item => {
    const cleanedFragments = unique((item.matched_text || [])
      .map(fragment => cleanMatchSnippet(fragment))
      .filter(Boolean))
      .filter((fragment, _, list) => !list.some(other => other !== fragment && other.length > fragment.length && other.toLowerCase().includes(fragment.toLowerCase())));
    cleanedFragments.forEach(cleaned => {
      if (cleaned && !snippets.some(x => x.toLowerCase() === cleaned.toLowerCase())) snippets.push(cleaned);
    });
  });
  if (!snippets.length) {
    (data.trigger_terms || []).forEach(term => {
      const cleaned = cleanMatchSnippet(term);
      if (cleaned && !snippets.some(x => x.toLowerCase() === cleaned.toLowerCase())) snippets.push(cleaned);
    });
  }
  return snippets;
}

function shortMatchText(value, max = 96) {
  const text = cleanMatchSnippet(value) || 'Mapped phrase';
  return text.length > max ? text.slice(0, max - 1).trim() + '…' : text;
}

function publicMatchedSummary(data) {
  const snippets = publicMatchSnippets(data);
  const first = snippets[0] || 'Mapped phrase';
  const shortFirst = shortMatchText(first, 100);
  return snippets.length > 1 ? `${shortFirst} + ${snippets.length - 1} more` : shortFirst;
}


function collectMatchedRows(data) {
  const rows = [];
  const bySentence = new Map();

  ((data && data.matched_sentences) || []).forEach(item => {
    const sentence = cleanMatchSnippet(item.sentence || item.context_window || item.contextWindow || '');
    const fragments = unique(((item && item.matched_text) || [])
      .map(fragment => cleanMatchSnippet(fragment))
      .filter(Boolean))
      .filter((fragment, _, list) => !list.some(other => other !== fragment && other.length > fragment.length && other.toLowerCase().includes(fragment.toLowerCase())));
    if (!sentence && !fragments.length) return;
    const text = sentence || fragments.join(', ');
    const key = text.toLowerCase();
    if (!bySentence.has(key)) {
      const row = { text, fragments: [] };
      bySentence.set(key, row);
      rows.push(row);
    }
    const row = bySentence.get(key);
    fragments.forEach(fragment => {
      if (!row.fragments.some(existing => existing.toLowerCase() === fragment.toLowerCase())) row.fragments.push(fragment);
    });
  });

  if (!rows.length) {
    const snippets = publicMatchSnippets(data);
    snippets.forEach(snippet => rows.push({ text: snippet, fragments: [snippet] }));
  }

  return rows;
}

function renderHighlightedText(target, text, fragments = []) {
  if (!target) return;
  target.textContent = '';
  const source = String(text || '—');
  const terms = unique((fragments || [])
    .map(fragment => cleanMatchSnippet(fragment))
    .filter(Boolean))
    .sort((a, b) => b.length - a.length);

  if (!terms.length) {
    target.textContent = source;
    return;
  }

  const matcher = new RegExp(terms.map(escapeRegExp).join('|'), 'gi');
  let lastIndex = 0;
  let match;
  let found = false;

  while ((match = matcher.exec(source)) !== null) {
    if (match.index > lastIndex) target.appendChild(document.createTextNode(source.slice(lastIndex, match.index)));
    const mark = document.createElement('mark');
    mark.className = 'match-highlight';
    mark.textContent = match[0];
    target.appendChild(mark);
    lastIndex = matcher.lastIndex;
    found = true;
    if (matcher.lastIndex === match.index) matcher.lastIndex += 1;
  }

  if (lastIndex < source.length) target.appendChild(document.createTextNode(source.slice(lastIndex)));
  if (!found) target.textContent = source;
}

function renderTopMatches(data, hasMapped, standaloneContext = false) {
  const target = document.getElementById('topSummary');
  if (!target) return;
  target.textContent = '';
  if (!hasMapped) {
    target.dataset.expanded = 'false';
    target.textContent = standaloneContext ? cleanMatchSnippet((data && data.input_text) || 'Context Dependent / Human Review.') : noMappedSummaryText(data);
    return;
  }

  const rows = collectMatchedRows(data);
  if (!rows.length) {
    target.textContent = 'Mapped phrase';
    return;
  }

  const list = document.createElement('div');
  list.className = 'match-summary-list match-highlight-list';
  rows.forEach(row => {
    const line = document.createElement('div');
    line.className = 'match-summary-line';
    renderHighlightedText(line, row.text, row.fragments);
    list.appendChild(line);
  });
  target.appendChild(list);
}
function highlightFragmentsForData(data, standaloneContext = false) {
  const fragments = [];
  ((data && data.matched_sentences) || []).forEach(item => {
    ((item && item.matched_text) || []).forEach(fragment => {
      const clean = cleanMatchSnippet(fragment);
      if (clean) fragments.push(clean);
    });
  });
  publicMatchSnippets(data).forEach(fragment => {
    const clean = cleanMatchSnippet(fragment);
    if (clean) fragments.push(clean);
  });
  if (standaloneContext && data && data.input_text) {
    const clean = cleanMatchSnippet(data.input_text);
    if (clean) fragments.push(clean);
  }
  return unique(fragments)
    .filter(fragment => fragment.length >= 2)
    .sort((a, b) => b.length - a.length);
}

function setHighlightedText(id, value, fragments = []) {
  const el = document.getElementById(id);
  if (!el) return;
  renderHighlightedText(el, value, fragments);
}

function selectedMatchedItem(data) {
  const items = (data && data.matched_sentences) || [];
  if (!items.length) return null;
  const tier = data && (data.severity_tier || data.severity || '');
  const result = data && (data.result_text || data.result_level || '');
  const isContextResult = tier === 'C' || /context/i.test(result);
  const nonDirect = items.filter(item => item.stance !== 'Direct claim');
  const strongNonDirect = nonDirect.find(item => /High|Critical|Medium/i.test(item.base_severity || ''));
  if (isContextResult) {
    return strongNonDirect || nonDirect[0] || items[0];
  }
  const direct = items.find(item => item.stance === 'Direct claim');
  if (direct && strongNonDirect && severityRank[direct.base_severity || 'None'] < severityRank['Medium']) return strongNonDirect;
  return direct || strongNonDirect || items[0];
}

function displaySourceName(source) {
  const clean = String(source || '').replace(/\s+/g, ' ').trim();
  if (!clean || /another speaker\/source|referenced claim|unclear/i.test(clean)) return 'Someone else';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function contextUseDetails(item) {
  if (!item) {
    return { label: 'No antizionism detected', why: 'No antizionism detected.', matters: false };
  }
  const combined = normalizedForAttribution(`${item.sentence || ''} ${item.context_window || item.contextWindow || ''}`);
  const lower = combined.toLowerCase();
  const source = displaySourceName(item.who_says_it || whoSaysLabel(item));
  const hasQuotes = /[“”"]/.test(combined) || /quote[ds]?|quoted/.test(lower);
  const rejected = /(reject|rejected|rejects|condemn|condemned|condemns|criticize|criticized|criticizes|criticised|debunk|debunked|debunks|false|not true|wrong|lie|do not think|don['’]?t think|does not think|is not saying|not saying|not claiming)/.test(lower);
  const studied = /(study|studied|studies|academic|class|course|paper|report|article|book|essay|glossary|definition|defines|defined|explain|explained|explains|examine|examined|examines|discuss|discussed|discusses|descriptive|described as a term|used as a term)/.test(lower);

  if (item.stance === 'Direct claim') {
    return { label: '', why: 'The author uses the flagged language directly.', matters: false };
  }
  if (rejected) {
    return { label: `Quoted/rejected. Source: ${source}.`, why: 'The surrounding text rejects, criticizes, or distances itself from the flagged language.', matters: true };
  }
  if (item.stance === 'Reported claim') {
    return { label: `Attributed to: ${source}.`, why: `The app treats this as language attributed to ${source}, not as the writer’s own wording.`, matters: true };
  }
  if (studied) {
    return { label: `Discussed or studied. Source: ${source}.`, why: 'The flagged language is a term being discussed, explained, or studied.', matters: true };
  }
  if (hasQuotes || item.stance === 'Quoted / rejected claim') {
    return { label: `Quoted or referenced. Source: ${source}.`, why: 'The flagged language is quoted or referenced language, not a direct statement by the writer.', matters: true };
  }
  return { label: 'Attribution unclear. Human review needed.', why: 'The app found mapped language, but the surrounding text does not make the writer’s role clear.', matters: true };
}

function contextUseDetailsForData(data) {
  return contextUseDetails(selectedMatchedItem(data));
}

function evidenceMatchedWording(data, maxItems = 8) {
  const snippets = publicMatchSnippets(data).slice(0, maxItems).map(x => shortMatchText(x, 80));
  if (snippets.length) return snippets.join(', ');
  return 'Flagged language';
}

function visiblePatternCategories(data) {
  const cats = Array.isArray(data && data.pattern_categories) ? data.pattern_categories : [];
  const scopes = (data && data.scope_statuses || []).join(' | ').toLowerCase();
  const hasCore = scopes.includes('core antizionist') || cats.some(c => !/adjacent jew-hatred|context-dependent antizionist vocabulary/i.test(c));
  if (!hasCore) return cats;
  const filtered = cats.filter(c => !/adjacent jew-hatred|context-dependent antizionist vocabulary/i.test(c));
  return filtered.length ? filtered : cats;
}

function friendlyPatternTypes(categories = [], data = null) {
  const result = data && data.result_text ? data.result_text : '';
  const tier = data && (data.severity_tier || data.severity || '');
  if (tier === 'B' || /adjacent/i.test(result) || /depends on use/i.test(result)) return 'Jew-hatred possible';
  if (standaloneContextTerm(data)) return 'Context-dependent antizionist vocabulary';
  if (tier === 'C' || /context/i.test(result)) {
    const selected = selectedMatchedItem(data);
    if (selected && Array.isArray(selected.categories) && selected.categories.length) {
      const contextTypes = unique(selected.categories
        .map(x => String(x || '').replace(/^Descriptive or rejected mapped-term context —\s*/i, '').trim())
        .filter(Boolean));
      if (contextTypes.length) return contextTypes.slice(0, 4).join(', ');
    }
  }
  const educationalEntry = screenWordingEntryForData(data);
  if (educationalEntry && educationalEntry.type) return educationalEntry.type;

  const directTypes = unique((categories || [])
    .map(x => String(x || '').trim())
    .filter(Boolean)
    .filter(x => !/outside app scope/i.test(x)));
  if (directTypes.length && directTypes.every(x => !/mapped|contextual|register|trope/i.test(x))) return directTypes.slice(0, 4).join(', ');

  const joined = categories.join(' | ').toLowerCase();
  const types = [];
  const add = label => { if (!types.includes(label)) types.push(label); };

  if (joined.includes('holocaust') || joined.includes('nazi')) add('Zionism/Nazi inversion');
  if (joined.includes('genocide')) add('Genocide accusation');
  if (joined.includes('apartheid')) add('Apartheid accusation');
  if (joined.includes('ethnostate') || joined.includes('ethno-state') || joined.includes('supremacy')) add('Ethnostate / supremacy accusation');
  if (joined.includes('replacement') || joined.includes('removal') || joined.includes('existence') || joined.includes('statehood')) add('Israel elimination / replacement language');
  if (joined.includes('exclusion') || joined.includes('shunning')) add('Zionist exclusion / antizionist social exclusion');
  if (joined.includes('normalization') || joined.includes('boycott') || joined.includes('bds')) add('Boycott / anti-normalization pressure');
  if (joined.includes('intifada')) add('Intifada / violence-escalation language');
  if (joined.includes('violence') || joined.includes('resistance')) add('Resistance / violence-shielding language');
  if (joined.includes('institution') || joined.includes('hillel') || joined.includes('synagogue') || joined.includes('federation')) add('Jewish institution targeting in antizionist language');
  if (joined.includes('open-air') || joined.includes('carceral')) add('Carceral / confinement accusation');
  if (joined.includes('colonial') || joined.includes('settler') || joined.includes('colonizer') || joined.includes('coloniser')) add('Colonial / decolonization language');
  if (joined.includes('occup')) add('Occupation / liberation language');
  if (joined.includes('washing') || joined.includes('laundering')) add('Bad-faith laundering claim');
  if (joined.includes('lobby') || joined.includes('aipac')) add('AIPAC / pro-Israel lobby claim');
  if (joined.includes('control') || joined.includes('money') || joined.includes('conspiracy') || joined.includes('puppet') || joined.includes('zog')) add('Zionist control claim');
  if (joined.includes('slur') || joined.includes('stigma') || joined.includes('dehuman')) add('Zionist slur / hostile label');
  if (joined.includes('entity') || joined.includes('delegitim')) add('IDF / Israel delegitimizing label');

  return types.length ? types.slice(0, 4).join(', ') : 'Antizionist language';
}

function publicCriteriaBoundary(data) {
  if (standaloneContextTerm(data)) return 'Antizionist language found; human review needed for speaker, target, and use.';
  if (!hasMappedTriggers(data)) return 'No antizionism detected';
  const tier = data.severity_tier || data.severity || '';
  const result = data.result_text || '';
  const selected = selectedMatchedItem(data);
  const selectedStance = (selected && selected.stance) || data.speaker_stance_detected || '';
  const attributed = selected && selected.stance !== 'Direct claim' || /reported|quoted|rejected|ambiguous/i.test(selectedStance);
  if (tier === 'C' || /context/i.test(result)) return 'Antizionist language found; human review needed for speaker, target, and use.';
  if (tier === 'B' || /adjacent/i.test(result) || /depends on use/i.test(result)) return 'No core antizionism detected; Jew-hatred possible.';
  if (attributed && (tier === 'A-high' || tier === 'A-critical')) return 'Strong antizionist language found, with attribution.';
  if (attributed && /^A-/.test(tier)) return 'Antizionist language found, with attribution.';
  const educationalEntry = screenWordingEntryForData(data);
  if (educationalEntry && educationalEntry.bottom) {
    const bottom = String(educationalEntry.bottom || '');
    if (/context dependent|context determines|unless/i.test(bottom)) return 'Antizionist language found; human review needed for speaker, target, and use.';
    return bottom;
  }
  if (tier === 'A-high' || tier === 'A-critical') return 'Strong antizionist language found.';
  return 'Antizionist language found.';
}

function publicWhySummary(data) {
  if (!hasMappedTriggers(data)) return '';
  const tier = data.severity_tier || data.severity || '';
  const result = data.result_text || '';
  const selected = selectedMatchedItem(data);
  const selectedStance = (selected && selected.stance) || data.speaker_stance_detected || '';
  const categories = visiblePatternCategories(data).join(' | ').toLowerCase();
  if (tier === 'C' || /context/i.test(result)) return contextUseDetailsForData(data).why;
  if (selected && selected.stance !== 'Direct claim' && /^A-/.test(tier)) return contextUseDetailsForData(data).why;
  if (/reported|quoted|rejected|ambiguous/i.test(selectedStance) && /^A-/.test(tier)) return contextUseDetailsForData(data).why;
  if (tier === 'B' || /adjacent/i.test(result) || /depends on use/i.test(result)) return 'No antizionism detected unless the wording is tied to Israel, Zionism, Zionists, Israelis, the IDF, Jewish statehood, Jewish indigeneity, Jewish institutions, antizionist libels, or antizionist chants.';
  const educationalEntry = screenWordingEntryForData(data);
  if (educationalEntry && educationalEntry.why) return educationalEntry.why;
  if (categories.includes('stigma') || categories.includes('distrust')) return 'Zionist category used as person-targeting stigma.';
  if (categories.includes('shunning') || categories.includes('exclusion') || categories.includes('normalization') || categories.includes('boycott')) return 'Exclusion, shunning, or anti-normalization language.';
  if (categories.includes('holocaust') || categories.includes('nazi')) return 'Zionism/Nazi inversion language.';
  if (categories.includes('control') || categories.includes('money') || categories.includes('lobby') || categories.includes('conspiracy') || categories.includes('puppet')) return 'Zionist control or lobby language.';
  if (categories.includes('violence') || categories.includes('resistance') || categories.includes('intifada')) return 'Resistance, violence-shielding, or intifada language.';
  if (categories.includes('statehood') || categories.includes('replacement') || categories.includes('removal') || categories.includes('existence')) return 'Jewish statehood denial or replacement language.';
  if (categories.includes('genocide') || categories.includes('apartheid') || categories.includes('ethnic cleansing') || categories.includes('supremacy')) return 'Genocide, apartheid, or supremacy accusation language.';
  if (categories.includes('colonial') || categories.includes('settler') || categories.includes('occup')) return 'Colonial / decolonization language.';
  if (categories.includes('slur') || categories.includes('dehuman')) return 'Zionist slur or hostile label.';
  return data.result_reason || 'Antizionist language found.';
}

function publicGradeSummary(data) {
  return publicMatchedSummary(data) || '—';
}

function publicShortExplanation(data) {
  return '';
}

function publicMeaningExplanation(data, hasMapped, standaloneContext = false) {
  if (standaloneContext) {
    const term = cleanMatchSnippet((data && data.input_text) || 'This term');
    return `“${term}” is recognized antizionist vocabulary that needs context. The app needs speaker, target, and use before deciding how the word or phrase is being used.`;
  }
  if (!hasMapped) return 'No mapped antizionist term or sentence was found.';

  const educationalEntry = screenWordingEntryForData(data);
  if (educationalEntry && educationalEntry.meaning) return educationalEntry.meaning;
  if (educationalEntry && educationalEntry.more) return educationalEntry.more;
  if (educationalEntry && educationalEntry.why) return educationalEntry.why;

  const selected = selectedMatchedItem(data);
  if (selected && selected.stance && selected.stance !== 'Direct claim') {
    return `${contextUseDetails(selected).why} The wording remains antizionist language for this detector; attribution affects who used it, not whether the wording is recognized.`;
  }

  const categories = visiblePatternCategories(data);
  const type = friendlyPatternTypes(categories, data);
  const why = publicWhySummary(data);
  if (type && why && type !== why) return `This wording is classified as ${type}. ${why}`;
  return why || 'The detector found antizionist language in the pasted text.';
}


const ATTRIBUTION_SUBJECT_PATTERN = [
  '(?:[Mm]y|[Oo]ur|[Hh]is|[Hh]er|[Tt]heir)\\s+(?:mother|mom|father|dad|parent|parents|grandmother|grandma|grandfather|grandpa|sister|brother|friend|teacher|professor|classmate|student|coworker|neighbor|uncle|aunt|cousin|wife|husband|partner)',
  '(?:[Tt]he|[Aa]|[Aa]n)\\s+(?:article|report|paper|book|essay|speech|speaker|author|historian|professor|group|organization|student group|campus group|post|thread|op-ed|interview)',
  '(?:[Pp]rotesters|[Ss]tudents|[Aa]ctivists|[Cc]ritics|[Ss]upporters|[Ss]cholars|[Cc]ommentators|[Oo]pponents|[Ss]peakers|[Oo]rganizers|[Cc]rowd)',
  '(?:Hamas|Hezbollah|PIJ|PFLP|AIPAC|ADL|Hillel|Chabad)',
  '(?:[A-Z][A-Za-z.-]+(?:\\s+[A-Z][A-Za-z.-]+){0,3})'
].join('|');

const ATTRIBUTION_VERB_PATTERN = [
  'said', 'says', 'claim(?:ed|s)?', 'argu(?:ed|es)', 'wrote', 'writes', 'post(?:ed|s)?',
  'tweet(?:ed|s)?', 'stream(?:ed|s)?', 'report(?:ed|s)?', 'stat(?:ed|es)', 'alleg(?:ed|es)',
  'call(?:ed|s)?', 'chant(?:ed|s)?', 'yell(?:ed|s|ing)', 'shout(?:ed|s|ing)', 'told', 'tells',
  'not(?:ed|es)', 'describ(?:ed|es)', 'explain(?:ed|s)', 'announc(?:ed|es)', 'insist(?:ed|s)',
  'believ(?:ed|es)', 'thought', 'thinks', 'think', 'does\\s+not\\s+think', "doesn[’']?t\\s+think", 'did\\s+not\\s+think', "didn[’']?t\\s+think"
].join('|');

function cleanAttributionSubject(value) {
  let clean = String(value || '')
    .replace(/[“”"'‘’]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(that|then|and|but)\s+/i, '')
    .replace(/[,:;.-]+$/g, '')
    .trim();
  if (!clean) return '';
  if (/^(the|a|an|my|our|his|her|their)\b/i.test(clean)) return clean.charAt(0).toUpperCase() + clean.slice(1);
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function normalizeAttributionVerb(value) {
  const v = String(value || '').toLowerCase();
  if (/chant/.test(v)) return 'chanted';
  if (/yell|shout/.test(v)) return 'yelled';
  if (/report/.test(v)) return 'reported';
  if (/post|tweet/.test(v)) return 'posted';
  if (/wrote|write/.test(v)) return 'wrote';
  if (/claim/.test(v)) return 'claimed';
  if (/argu/.test(v)) return 'argued';
  if (/alleg/.test(v)) return 'alleged';
  if (/believ|think|thought/.test(v)) return 'believed';
  if (/call/.test(v)) return 'called';
  return 'said';
}

function extractAttributionChainFromText(text) {
  const source = normalizedForAttribution(String(text || ''));
  if (!source.trim()) return [];
  const regex = new RegExp('\\b(' + ATTRIBUTION_SUBJECT_PATTERN + ')\\s+(?:(?:was|were|is|are|has been|had been|have been)\\s+)?(' + ATTRIBUTION_VERB_PATTERN + ')\\b', 'g');
  const chain = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    const subject = cleanAttributionSubject(match[1]);
    if (!subject) continue;
    if (/^(Israel|Zionism|Zionist|Jewish State|Palestine|Gaza)$/i.test(subject)) continue;
    const verb = normalizeAttributionVerb(match[2]);
    const key = `${subject.toLowerCase()}|${verb}`;
    if (chain.some(item => item.key === key)) continue;
    chain.push({ subject, verb, index: match.index, key });
  }
  return chain.map(({ subject, verb, index }) => ({ subject, verb, index }));
}

function finalAttributionPhrase(entry) {
  if (!entry || !entry.subject) return 'Speaker unclear.';
  if (entry.verb === 'chanted') return `${entry.subject} chanted it.`;
  if (entry.verb === 'yelled') return `${entry.subject} yelled it.`;
  if (entry.verb === 'reported') return `${entry.subject} reported to have said it.`;
  if (entry.verb === 'posted') return `${entry.subject} posted it.`;
  if (entry.verb === 'wrote') return `${entry.subject} wrote it.`;
  if (entry.verb === 'claimed') return `${entry.subject} claimed it.`;
  if (entry.verb === 'argued') return `${entry.subject} argued it.`;
  if (entry.verb === 'alleged') return `${entry.subject} alleged it.`;
  if (entry.verb === 'believed') return `${entry.subject} said or believed it.`;
  return `${entry.subject} said it.`;
}

function formatAttributionChain(chain) {
  const cleanChain = (chain || []).filter(item => item && item.subject);
  if (!cleanChain.length) return '';
  const finalSpeaker = cleanChain[cleanChain.length - 1];
  const reporters = cleanChain.slice(0, -1).reverse();
  let line = finalAttributionPhrase(finalSpeaker);
  if (reporters.length) {
    line += ' Reported by ' + reporters.map((item, index) => index === 0 ? item.subject : `who was reported by ${item.subject}`).join(', ') + '.';
  }
  return line;
}

function selectedAttributionText(data, selected) {
  if (selected && selected.sentence) return selected.sentence;
  return (data && data.input_text) || '';
}

function publicWhoSaidExplanation(data, hasMapped, standaloneContext = false) {
  if (!hasMapped && !standaloneContext) return '—';
  const selected = selectedMatchedItem(data);
  let chain = extractAttributionChainFromText(selectedAttributionText(data, selected));
  if (!chain.length && selected && selected.context_window) chain = extractAttributionChainFromText(selected.context_window);
  if (chain.length) return formatAttributionChain(chain);
  if (selected && selected.stance === 'Direct claim') return 'Direct use by pasted-text author.';
  if (selected && selected.who_says_it && !/author|unclear|referenced claim|another speaker\/source/i.test(selected.who_says_it)) {
    return `Attributed to: ${displaySourceName(selected.who_says_it)}.`;
  }
  if (standaloneContext) return 'Direct use by pasted-text author unless surrounding text shows attribution.';
  if (selected && selected.stance && selected.stance !== 'Direct claim') return 'Speaker unclear; human review needed.';
  return 'Direct use by pasted-text author.';
}


function firstMatchedSentence(data) {
  const first = data && data.matched_sentences && data.matched_sentences[0];
  if (!first) return 'No matched sentence.';
  return first.sentence || '—';
}

function firstEvidenceWhy(data) {
  const first = selectedMatchedItem(data);
  if (!first) {
    return data && data.result_reason ? data.result_reason : 'No flagged antizionist language was found.';
  }
  if (first.stance && first.stance !== 'Direct claim') {
    return contextUseDetails(first).why;
  }
  const educationalEntry = screenWordingEntryForData(data);
  if (educationalEntry && educationalEntry.why) return educationalEntry.why;
  if (educationalEntry && educationalEntry.more) return educationalEntry.more;
  return publicWhySummary(data);
}


function markResultMotion() {
  if (!resultCard || !resultCard.classList) return;
  resultCard.classList.remove('result-updated');
  const addClass = () => resultCard.classList && resultCard.classList.add('result-updated');
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => window.requestAnimationFrame(addClass));
  } else {
    addClass();
  }
}

function initMotionSystem() {
  if (typeof document === 'undefined' || !document.body) return;
  document.body.classList.add('motion-loaded');
  const revealItems = document.querySelectorAll ? Array.from(document.querySelectorAll('.reveal-item')) : [];
  if (!revealItems.length) return;
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || typeof IntersectionObserver === 'undefined') {
    revealItems.forEach(item => item.classList && item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach(item => observer.observe(item));
}

async function runAnalysis() {
  let data;
  try {
    data = window.DetectorAccess && typeof window.DetectorAccess.analyze === 'function'
      ? await window.DetectorAccess.analyze(textInput.value)
      : analyze(textInput.value);
  } catch (error) {
    if (error && error.code === 'PURCHASE_REQUIRED') return;
    console.error(error);
    return;
  }
  if (!data) { resetResult(); return; }
  window.lastAnalysis = data;
  render(data);
  markResultMotion();
  if (document.body && document.body.classList) document.body.classList.add('has-result');
  const workbench = document.getElementById('analysisWorkbench');
  (workbench || resultCard).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setHidden(el, hidden) {
  if (!el) return;
  if (hidden) el.classList.add('hidden');
  else el.classList.remove('hidden');
}

function render(data) {
  const rawHasMapped = hasMappedTriggers(data);
  const neutralStandalone = standaloneNeutralDescriptor(data);
  const standaloneContext = standaloneContextTerm(data) && !neutralStandalone;
  const hasMapped = rawHasMapped && !neutralStandalone && !standaloneContext;
  const showEvidence = hasMapped || standaloneContext;
  setText('resultText', publicAnswerLabel(data));
  setText('severityBadge', publicAnswerBadge(data));
  setText('explanation', publicShortExplanation(data));
  renderTopMatches(data, hasMapped, standaloneContext);
  const highlightFragments = highlightFragmentsForData(data, standaloneContext);
  setHighlightedText('meaningBox', publicMeaningExplanation(data, hasMapped, standaloneContext), highlightFragments);
  setHighlightedText('whoSaidBox', publicWhoSaidExplanation(data, hasMapped, standaloneContext), highlightFragments);
  renderResourcesBox(data, hasMapped, standaloneContext);
  setHighlightedText('resultReason', hasMapped ? publicWhySummary(data) : (standaloneContext ? standaloneContextWhy() : noMappedWhyText(data)), highlightFragments);
  setHighlightedText('triggers', hasMapped ? evidenceMatchedWording(data) : (standaloneContext ? cleanMatchSnippet(data.input_text || '') : '—'), highlightFragments);
  const visibleCats = visiblePatternCategories(data);
  setHighlightedText('categories', hasMapped && visibleCats.length ? friendlyPatternTypes(visibleCats, data) : (standaloneContext ? 'Context-dependent antizionist vocabulary' : '—'), highlightFragments);
  setHighlightedText('ordinary', hasMapped ? publicCriteriaBoundary(data) : (standaloneContext ? 'Antizionist language found; human review needed for speaker, target, and use.' : '—'), highlightFragments);
  const attributionDetails = hasMapped ? contextUseDetailsForData(data) : { label: '—', matters: false };
  setHighlightedText('stanceDetected', attributionDetails.label || '—', highlightFragments);
  setHighlightedText('evidenceWhy', hasMapped ? firstEvidenceWhy(data) : (standaloneContext ? standaloneContextWhy() : '—'), highlightFragments);
  const attributionRow = document.getElementById('attributionRow');
  setHidden(attributionRow, !hasMapped || !attributionDetails.matters);
  const evidencePanel = document.getElementById('evidencePanel');
  setHidden(evidencePanel, !showEvidence);
  const displayCss = standaloneContext ? 'flagged' : (neutralStandalone ? 'nohit' : ((data.css === 'context' && publicAnswerBadge(data) === 'Antizionist language found') ? 'flagged' : data.css));
  resultCard.className = `result-card ${displayCss} analyzed${showEvidence ? '' : ' no-mapped-result'}`;
}

function resetResult() {
  setText('resultText', '');
  setText('severityBadge', 'Ready');
  setText('explanation', '');
  const topSummary = document.getElementById('topSummary');
  if (topSummary) { topSummary.dataset.expanded = 'false'; topSummary.textContent = '—'; }
  setText('resultReason', '—');
  setText('meaningBox', '—');
  setText('whoSaidBox', '—');
  const resourcesBox = document.getElementById('resourcesBox');
  if (resourcesBox) resourcesBox.textContent = '';
  setText('triggers', '—');
  setText('categories', '—');
  setText('ordinary', '—');
  setText('stanceDetected', '—');
  setText('evidenceWhy', '—');
  const attributionRow = document.getElementById('attributionRow');
  setHidden(attributionRow, true);
  const evidencePanel = document.getElementById('evidencePanel');
  setHidden(evidencePanel, true);
  resultCard.className = 'result-card neutral awaiting';
  if (document.body && document.body.classList) document.body.classList.remove('has-result');
}


window.detectorAnalyzeText = analyze;


initMotionSystem();

analyzeBtn.addEventListener('click', runAnalysis);

function shouldAnalyzeFromEnter(event) {
  if (!event || event.key !== 'Enter') return false;
  if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return false;
  const target = event.target;
  if (!target) return false;
  if (target === textInput) return true;
  if (target.closest && target.closest('button, a, summary, details')) return false;
  return target === document.body || target === document.documentElement;
}

function analyzeFromEnter(event) {
  if (!shouldAnalyzeFromEnter(event)) return;
  event.preventDefault();
  runAnalysis();
}

textInput.addEventListener('keydown', analyzeFromEnter);
document.addEventListener('keydown', analyzeFromEnter);

if (document.addEventListener) {
  document.addEventListener('pointerdown', (event) => {
    const target = event.target && event.target.closest ? event.target.closest('button, a, summary, h1, h2, h3, p, label, dt, dd, span, mark, .match-highlight, .match-summary-line, .summary-box, .guide-card, .v87-difference, .v87-sample-group') : null;
    if (!target) return;
    target.classList.add('text-active');
    window.setTimeout(() => target.classList.remove('text-active'), 260);
  }, { passive: true });
}

clearBtn.addEventListener('click', () => { textInput.value = ''; resetResult(); });

if (document.querySelectorAll) {
  document.querySelectorAll('.example-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const example = button.getAttribute('data-example') || button.textContent || '';
      textInput.value = example.trim();
      runAnalysis();
      textInput.focus();
    });
  });
}

const saveCorrectionBtn = document.getElementById('saveCorrection');
if (saveCorrectionBtn) saveCorrectionBtn.addEventListener('click', () => {
  const entry = {
    timestamp: new Date().toISOString(),
    analysis: window.lastAnalysis || null,
    corrected_label: document.getElementById('correctLabel').value,
    why_wrong: document.getElementById('whyWrong').value
  };
  const saved = JSON.parse(localStorage.getItem('corrections') || '[]');
  saved.push(entry);
  localStorage.setItem('corrections', JSON.stringify(saved));
  document.getElementById('saveStatus').textContent = 'Saved locally on this device.';
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); deferredPrompt = event; installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; installBtn.classList.add('hidden');
});


if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
  installHint.textContent = 'On iPhone: open in Safari, tap Share, then Add to Home Screen.';
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js?v=179').catch(console.warn));
}
