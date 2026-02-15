/**
 * Simple i18n: en.json / sv.json; expose t(key) and locale.
 * Use in Svelte: import { t, locale, setLocale } from '$lib/i18n';
 * Language choice is persisted in localStorage.
 */

import { writable, get } from 'svelte/store';
import en from '../../../locales/en.json';
import sv from '../../../locales/sv.json';

const LOCAL_STORAGE_KEY = 'stonksgpt-locale';

export const supportedLocales = ['en', 'sv'];
const defaultLocale = 'en';

/** Options for locale dropdown: code, labelKey for t(), flag emoji */
export const localeOptions = [
  { code: 'en', labelKey: 'locale.en', flag: '🇺🇸' },
  { code: 'sv', labelKey: 'locale.sv', flag: '🇸🇪' },
];

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
 * Set current locale. Persists to localStorage so choice is kept across sessions.
 * @param {string} loc
 */
export function setLocale(loc) {
  if (!supportedLocales.includes(loc)) return;
  locale.set(loc);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = loc;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, loc);
    } catch (_) {}
  }
}

/**
 * Initialize i18n: prefer saved locale (localStorage), then param, then browser (sv/en).
 * Call once at app startup.
 * @param {string} [initial]
 */
export function initI18n(initial) {
  let loc = defaultLocale;
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && supportedLocales.includes(saved)) {
      loc = saved;
    } else if (typeof navigator !== 'undefined' && navigator.language?.startsWith('sv')) {
      loc = 'sv';
    }
  }
  if (initial && supportedLocales.includes(initial)) loc = initial;
  setLocale(loc);
}
