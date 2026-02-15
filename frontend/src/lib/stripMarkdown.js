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
    .replace(/\*\*/g, '') // bold
    .replace(/(^|\n)\s*#{1,6}\s*/g, '$1') // headings: remove # ## ### etc
    .replace(/(^|\n)\s*-\s+/g, '$1• '); // list: - item → • item
  // Collapse 3+ newlines to 2
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}
