import Parser from "rss-parser";

export type NewsItemFromFeed = {
  title: string;
  url?: string;
  source?: string;
  snippet?: string;
  symbol?: string;
  displayName?: string;
};

const RSS_USER_AGENT =
  "Mozilla/5.0 (compatible; StonksGPT/1.0; +https://github.com/stonksgpt)";

const parser = new Parser({
  headers: { "User-Agent": RSS_USER_AGENT },
  timeout: 10000,
});

/** Yahoo Finance RSS: headline news for given symbols. Max 8 symbols to keep URL short. */
export async function getYahooFinanceNews(
  symbols: Array<{ symbol: string; displayName?: string }>,
  maxItemsTotal = 15
): Promise<NewsItemFromFeed[]> {
  if (symbols.length === 0) return [];
  const symbolList = symbols.slice(0, 8).map((s) => s.symbol.trim().toUpperCase()).join(",");
  const url = `https://finance.yahoo.com/rss/headline?s=${encodeURIComponent(symbolList)}`;
  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items ?? []).slice(0, maxItemsTotal).map((item) => {
      const title = String(item.title ?? "").trim();
      const link = item.link ? String(item.link).trim() : undefined;
      const source = "Yahoo Finance";
      const snippet = item.contentSnippet ? String(item.contentSnippet).slice(0, 200) : undefined;
      return { title, url: link, source, snippet };
    });
    return items;
  } catch {
    return [];
  }
}

/** Dagens Industri (DI) – Swedish business/finance news. RSS feed. */
const DI_RSS_URLS = [
  "https://www.di.se/rss",
  "https://di.se/rss",
  "https://www.di.se/nyheter/feed/",
];

export async function getDagensIndustriNews(maxItems = 8): Promise<NewsItemFromFeed[]> {
  for (const url of DI_RSS_URLS) {
    try {
      const feed = await parser.parseURL(url);
      const items = (feed.items ?? []).slice(0, maxItems).map((item) => {
        const title = String(item.title ?? "").trim();
        const link = item.link ? String(item.link).trim() : undefined;
        return {
          title,
          url: link,
          source: "DI (Dagens Industri)",
          snippet: item.contentSnippet ? String(item.contentSnippet).slice(0, 200) : undefined,
        };
      });
      if (items.length > 0) return items;
    } catch {
      continue;
    }
  }
  return [];
}
