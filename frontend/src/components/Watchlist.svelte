<script>
  import { t } from '$lib/i18n/index.js';
  import * as api from '$lib/api.js';

  let list = $state([]);
  let suggested = $state([]);
  let loading = $state(true);
  let symbol = $state('');
  let type = $state('stock');
  let exchange = $state('');
  let submitting = $state(false);
  let addingId = $state(null);
  let error = $state(null);

  const suggestedByName = $derived.by(() => {
    const m = new Map();
    for (const s of suggested) {
      m.set(String(s.symbol).toUpperCase(), s.name);
    }
    return m;
  });

  function displayName(item) {
    const name = suggestedByName.get(String(item.symbol).toUpperCase());
    return name ? `${name} (${item.symbol})` : item.symbol;
  }

  async function load() {
    loading = true;
    error = null;
    try {
      const [watchlistRes, suggestedRes] = await Promise.all([
        api.getWatchlist(),
        api.getSuggestedMarkets(),
      ]);
      list = Array.isArray(watchlistRes) ? watchlistRes : [];
      suggested = Array.isArray(suggestedRes) ? suggestedRes : [];
    } catch (e) {
      error = e?.message || String(e);
    } finally {
      loading = false;
    }
  }

  async function add() {
    const s = symbol.trim();
    if (!s) return;
    submitting = true;
    error = null;
    try {
      await api.addWatchlistSymbol({ symbol: s, type, exchange: exchange.trim() || undefined });
      symbol = '';
      exchange = '';
      await load();
    } catch (e) {
      error = e?.message || String(e);
    } finally {
      submitting = false;
    }
  }

  async function addSuggested(market) {
    addingId = market.id;
    error = null;
    try {
      await api.addWatchlistSymbol({
        symbol: market.symbol,
        type: market.type || 'etf',
        exchange: market.exchange || undefined,
      });
      await load();
    } catch (e) {
      error = e?.message || String(e);
    } finally {
      addingId = null;
    }
  }

  $effect(() => {
    load();
  });
</script>

<section class="watchlist">
  <h2>{t('watchlist.title')}</h2>

  {#if loading}
    <p class="muted">{t('common.loading')}</p>
  {:else}
    <p class="hint">Recommendations can include these and your watchlist even if you add nothing. You can still add symbols manually below.</p>

    {#if suggested.length > 0}
      <div class="suggested">
        <h3>{t('watchlist.suggestedMarkets')}</h3>
        <div class="suggested-grid">
          {#each suggested as m (m.id)}
            <button
              type="button"
              class="suggested-btn"
              disabled={addingId === m.id || list.some((w) => String(w.symbol).toUpperCase() === String(m.symbol).toUpperCase())}
              onclick={() => addSuggested(m)}
            >
              <span class="suggested-name">{m.name}</span>
              <span class="suggested-symbol">{m.symbol}</span>
              {#if list.some((w) => String(w.symbol).toUpperCase() === String(m.symbol).toUpperCase())}
                <span class="suggested-check">✓</span>
              {:else}
                <span class="suggested-add">{addingId === m.id ? t('common.loading') : t('watchlist.addMarket')}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <form
      class="add-form"
      onsubmit={(e) => { e.preventDefault(); add(); }}
    >
      <input
        type="text"
        bind:value={symbol}
        placeholder={t('watchlist.symbol')}
        required
      />
      <select bind:value={type}>
        <option value="stock">Stock</option>
        <option value="etf">ETF</option>
        <option value="fund">Fund</option>
      </select>
      <input
        type="text"
        bind:value={exchange}
        placeholder="Exchange (e.g. US, LON)"
      />
      <button type="submit" disabled={submitting}>
        {t('watchlist.add')}
      </button>
    </form>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if list.length === 0}
      <p class="muted">{t('watchlist.empty')}</p>
    {:else}
      <h3>{t('watchlist.yourWatchlist')}</h3>
      <ul>
        {#each list as item (item.id)}
          <li>
            <strong>{displayName(item)}</strong>
            <span class="type">{item.type}</span>
            {#if item.exchange}
              <span class="exchange">{item.exchange}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style>
  .watchlist { margin-top: 1rem; }
  .hint {
    font-size: 0.9rem;
    color: #555;
    margin-bottom: 1rem;
  }
  .suggested { margin-bottom: 1.5rem; }
  .suggested h3 { font-size: 1rem; margin: 0 0 0.5rem 0; }
  .suggested-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .suggested-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
  }
  .suggested-btn:hover:not(:disabled) {
    background: #e5e5e5;
  }
  .suggested-btn:disabled {
    opacity: 0.8;
    cursor: default;
  }
  .suggested-name { font-weight: 500; }
  .suggested-symbol { color: #666; font-size: 0.85rem; }
  .suggested-add { color: var(--accent, #06c); font-size: 0.85rem; }
  .suggested-check { color: green; }
  .add-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .add-form input, .add-form select {
    padding: 0.4rem 0.6rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .add-form button {
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    background: var(--accent, #333);
    color: #fff;
    border: none;
    border-radius: 4px;
  }
  .add-form button:disabled { opacity: 0.6; }
  .error { color: #c00; font-size: 0.9rem; }
  .muted { color: #666; }
  ul { list-style: none; padding: 0; }
  ul li { padding: 0.35rem 0; font-size: 0.95rem; display: flex; gap: 0.5rem; align-items: center; }
  .type { text-transform: capitalize; color: #666; }
  .exchange { font-size: 0.85rem; color: #888; }
  h3 { font-size: 1rem; margin: 1rem 0 0.5rem 0; }
</style>
