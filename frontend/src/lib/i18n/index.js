/**
 * Simple i18n: en.json / sv.json; expose t(key) and locale.
 * Use in Svelte: import { t, locale, setLocale } from '$lib/i18n';
 */

import { writable, get } from 'svelte/store';
import en from '../../../locales/en.json';
import sv from '../../../locales/sv.json';

const supportedLocales = ['en', 'sv'];
const defaultLocale = 'en';

/** @type {Record<string, Record<string, unknown>>} */
const messages = { en, sv };

/** @type {import('svelte/store').Writable<string>} */
export const locale = writable(defaultLocale);

/**
 * Get translated string by dot-path key (e.g. 'nav.dashboard').
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  const loc = get(locale);
  const dict = messages[loc] ?? messages[defaultLocale];
  if (!dict) return key;
  const parts = key.split('.');
  let value = dict;
  for (const part of parts) {
    value = value?.[part];
  }
  if (typeof value !== 'string') return key;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    value
  );
}

/**
 * Set current locale.
 * @param {string} loc
 */
export function setLocale(loc) {
  if (!supportedLocales.includes(loc)) return;
  locale.set(loc);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = loc;
  }
}

/**
 * Initialize i18n: set locale from param or browser (sv/en).
 * Call once at app startup.
 * @param {string} [initial]
 */
export function initI18n(initial) {
  const loc = initial ?? (typeof navigator !== 'undefined' && navigator.language?.startsWith('sv') ? 'sv' : 'en');
  setLocale(supportedLocales.includes(loc) ? loc : defaultLocale);
}
