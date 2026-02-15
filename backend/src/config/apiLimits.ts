/**
 * API limits for free-tier providers. Adjust when upgrading.
 */

export const FINNHUB_MAX_SYMBOLS = 50;
export const FINNHUB_MAX_CALLS_PER_MINUTE = 60;

export const ALPHA_VANTAGE_MAX_REQUESTS_PER_DAY = 25;
export const ALPHA_VANTAGE_MAX_REQUESTS_PER_MINUTE = 5;

/** Max watchlist symbols for ex-US (Alpha Vantage daily cap). */
export const EX_US_SYMBOLS_CAP = 25;
