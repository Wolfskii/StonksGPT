<script>
  import { t } from '$lib/i18n/index.js';
  import * as api from '$lib/api.js';

  let list = $state([]);
  let loading = $state(true);
  let symbol = $state('');
  let type = $state('stock');
  let exchange = $state('');
  let submitting = $state(false);
  let error = $state(null);

  async function load() {
    loading = true;
    error = null;
    try {
      list = await api.getWatchlist();
      if (!Array.isArray(list)) list = [];
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

  $effect(() => {
    load();
  });
</script>

<section class="watchlist">
  <h2>{t('watchlist.title')}</h2>

  {#if loading}
    <p class="muted">{t('common.loading')}</p>
  {:else}
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
      <ul>
        {#each list as item (item.id)}
          <li>
            <strong>{item.symbol}</strong>
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
</style>
