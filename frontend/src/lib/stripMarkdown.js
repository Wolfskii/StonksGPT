/**
 * Remove disclaimer paragraph(s) – the app already shows one at the bottom of the page.
 * Strips blocks that look like the standard disclaimer (en/sv).
 */
function stripDisclaimerBlock(text) {
  if (typeof text !== 'string') return text;
  // English: from "Disclaimer:" or "*Disclaimer:" to end of paragraph (next \n\n or end)
  let out = text.replace(
    /\n?\s*\*?Disclaimer:[\s\S]*?(?=\n\n|$)/gi,
    '\n\n'
  );
  // Swedish: from "Ansvarsfriskrivning:" to end of paragraph
  out = out.replace(
    /\n?\s*\*?Ansvarsfriskrivning:[\s\S]*?(?=\n\n|$)/gi,
    '\n\n'
  );
  // Fallback: standalone line containing only disclaimer-style text (en/sv)
  out = out.replace(/\n\s*\*?This is general information[^*\n]*not financial advice[^*\n]*\.?\s*\*?\s*/gi, '\n\n');
  out = out.replace(/\n\s*\*?Detta är generell information[^*\n]*inte finansiell rådgivning[^*\n]*\.?\s*\*?\s*/gi, '\n\n');
  return out;
}

/**
 * Convert recommendation text from markdown-like formatting to plain readable text.
 * Removes **, ##, ###, # and converts list markers so the content displays without raw markdown.
 * Also strips the in-text disclaimer (the app shows one at page bottom).
 * @param {string} text
 * @returns {string}
 */
export function stripRecommendationMarkdown(text) {
  if (typeof text !== 'string') return '';
  let out = stripDisclaimerBlock(text);
  out = out
    .replace(/\*\*/g, '') // bold: **text** → text
    .replace(/\*([^*\n]+)\*/g, '$1') // italic / parenthetical: *text* → text (e.g. *(liten ökning)*)
    .replace(/_([^_\n]+)_/g, '$1') // underscore emphasis: _text_ → text
    .replace(/(^|\n)\s*#{1,6}\s*/g, '$1') // headings: remove # ## ### etc
    .replace(/(^|\n)\s*-\s+/g, '$1• '); // list: - item → • item
  // Collapse 3+ newlines to 2
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

const POSITIVE_KEYWORDS = /buy|add|köp|öka|consider adding|överväg att köpa|increase|bra för|rekommenderas|recommend/i;
const NEGATIVE_KEYWORDS = /avoid|undvik|sell|sälj|limit|begränsa|minska|concentrated|smal exponering|för de flesta.*undvik/i;

/**
 * Split recommendation text into lines with a type for styling (positive=green, negative=red, neutral=dark grey).
 * @param {string} text - Already stripped (plain) recommendation text
 * @returns {Array<{ line: string, type: 'positive'|'negative'|'neutral', isList: boolean }>}
 */
export function getRecommendationLines(text) {
  if (typeof text !== 'string') return [];
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  return lines.map((line) => {
    const isList = /^•\s/.test(line) || /^[-*]\s/.test(line);
    const lower = line.toLowerCase();
    let type = 'neutral';
    if (POSITIVE_KEYWORDS.test(lower) && !NEGATIVE_KEYWORDS.test(lower)) type = 'positive';
    else if (NEGATIVE_KEYWORDS.test(lower)) type = 'negative';
    return { line, type, isList };
  });
}

/**
 * Group recommendation lines by type for sectioned display (positive, negative, neutral) with dividers.
 * @param {string} text - Already stripped (plain) recommendation text
 * @returns {Array<{ type: 'positive'|'negative'|'neutral', lines: Array<{ line: string, isList: boolean }> }>}
 *   Only includes sections that have at least one line; order is positive → negative → neutral.
 */
export function getRecommendationSections(text) {
  const items = getRecommendationLines(text);
  const byType = { positive: [], negative: [], neutral: [] };
  for (const { line, type, isList } of items) {
    byType[type].push({ line, isList });
  }
  const sections = [];
  if (byType.positive.length) sections.push({ type: 'positive', lines: byType.positive });
  if (byType.negative.length) sections.push({ type: 'negative', lines: byType.negative });
  if (byType.neutral.length) sections.push({ type: 'neutral', lines: byType.neutral });
  return sections;
}
