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
  let itemToRemove = $state(null);
  let removing = $state(false);
  let suggestions = $state([]);
  let searchResults = $state([]);
  let searchLoading = $state(false);
  let searchTimeoutId = null;

  const suggestedByName = $derived.by(() => {
    const m = new Map();
    for (const s of suggested) {
      m.set(String(s.symbol).toUpperCase(), s.name);
    }
    return m;
  });

  function displayLabel(item) {
    const name = item.displayName ?? suggestedByName.get(String(item.symbol).toUpperCase());
    return name ? `${name} (${item.symbol})` : item.symbol;
  }

  function runSymbolSearch() {
    const q = symbol.trim();
    if (q.length < 2) {
      searchResults = [];
      return;
    }
    searchLoading = true;
    searchResults = [];
    api.searchWatchlistSymbols(q)
      .then((data) => {
        const list = data.suggestions ?? [];
        if (symbol.trim() === q) searchResults = list;
      })
      .catch(() => {
        if (symbol.trim() === q) searchResults = [];
      })
      .finally(() => {
        searchLoading = false;
      });
  }

  function onSymbolInput() {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    searchResults = [];
    const q = symbol.trim();
    if (q.length < 2) return;
    searchTimeoutId = setTimeout(() => {
      searchTimeoutId = null;
      runSymbolSearch();
    }, 2000);
  }

  function selectSearchResult(sug) {
    symbol = sug.symbol;
    searchResults = [];
  }

  function onSymbolBlur() {
    setTimeout(() => { searchResults = []; }, 150);
  }

  async function addSearchResult(sug) {
    searchResults = [];
    error = null;
    try {
      await api.addWatchlistSymbol({
        symbol: sug.symbol,
        type,
        exchange: exchange.trim() || undefined,
        displayName: sug.description || undefined,
      });
      await load();
    } catch (e) {
      error = e?.message || String(e);
      suggestions = e?.suggestions ?? [];
    }
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
    suggestions = [];
    searchResults = [];
    try {
      await api.addWatchlistSymbol({ symbol: s, type, exchange: exchange.trim() || undefined });
      symbol = '';
      exchange = '';
      suggestions = [];
      searchResults = [];
      await load();
    } catch (e) {
      error = e?.message || String(e);
      suggestions = e?.suggestions ?? [];
    } finally {
      submitting = false;
    }
  }

  async function addSuggestion(sug) {
    error = null;
    suggestions = [];
    try {
      await api.addWatchlistSymbol({ symbol: sug.symbol, type, exchange: exchange.trim() || undefined });
      await load();
    } catch (e) {
      error = e?.message || String(e);
      suggestions = e?.suggestions ?? [];
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
        displayName: market.name || undefined,
      });
      await load();
    } catch (e) {
      error = e?.message || String(e);
    } finally {
      addingId = null;
    }
  }

  function openRemoveConfirm(item) {
    itemToRemove = item;
  }

  function closeRemoveConfirm() {
    if (!removing) itemToRemove = null;
  }

  async function confirmRemove() {
    if (!itemToRemove) return;
    removing = true;
    error = null;
    try {
      await api.deleteWatchlistItem(itemToRemove.id);
      itemToRemove = null;
      await load();
    } catch (e) {
      error = e?.message || String(e);
    } finally {
      removing = false;
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
    <p class="hint">{t('watchlist.hint')}</p>

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
      <div class="symbol-search-wrap">
        <input
          type="text"
          bind:value={symbol}
          oninput={onSymbolInput}
          onblur={onSymbolBlur}
          placeholder={t('watchlist.symbol')}
          required
          autocomplete="off"
        />
        {#if searchLoading}
          <div class="search-dropdown search-loading">{t('common.loading')}</div>
        {:else if searchResults.length > 0}
          <div class="search-dropdown" role="listbox">
            {#each searchResults as sug (sug.symbol)}
              <div class="search-dropdown-item" role="option">
                <button type="button" class="search-dropdown-row" onclick={() => selectSearchResult(sug)}>
                  <span class="search-symbol">{sug.symbol}</span>
                  {#if sug.description}
                    <span class="search-desc"> – {sug.description}</span>
                  {/if}
                </button>
                <button type="button" class="search-add-btn" onclick={(e) => { e.stopPropagation(); addSearchResult(sug); }} title={t('watchlist.addMarket')}>
                  {t('watchlist.addMarket')}
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <select bind:value={type}>
        <option value="stock">{t('watchlist.typeStock')}</option>
        <option value="etf">{t('watchlist.typeEtf')}</option>
        <option value="fund">{t('watchlist.typeFund')}</option>
      </select>
      <input
        type="text"
        bind:value={exchange}
        placeholder={t('watchlist.exchangePlaceholder')}
      />
      <button type="submit" disabled={submitting}>
        {t('watchlist.add')}
      </button>
    </form>
    {#if error}
      <p class="error">{suggestions.length > 0 ? t('watchlist.symbolNotFound') : error}</p>
      {#if suggestions.length > 0}
        <p class="suggestions-label">{t('watchlist.didYouMean')}</p>
        <ul class="suggestions-list">
          {#each suggestions as sug (sug.symbol)}
            <li>
              <button type="button" class="suggestion-btn" onclick={() => addSuggestion(sug)}>
                <span class="suggestion-symbol">{sug.symbol}</span>
                {#if sug.description}
                  <span class="suggestion-desc"> – {sug.description}</span>
                {/if}
                <span class="suggestion-add"> {t('watchlist.addMarket')}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
    {#if list.length === 0}
      <p class="muted">{t('watchlist.empty')}</p>
    {:else}
      <h3>{t('watchlist.yourWatchlist')}</h3>
      <ul>
        {#each list as item (item.id)}
          <li>
            <strong>{displayLabel(item)}</strong>
            <span class="type">{item.type}</span>
            {#if item.exchange}
              <span class="exchange">{item.exchange}</span>
            {/if}
            <button type="button" class="link link-danger" onclick={() => openRemoveConfirm(item)}>
              {t('watchlist.remove')}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

{#if itemToRemove}
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="watchlist-confirm-title">
    <div class="modal-content modal-confirm">
      <h3 id="watchlist-confirm-title">{t('watchlist.confirmRemove')}</h3>
      <p class="confirm-symbol">{displayLabel(itemToRemove)}</p>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" onclick={closeRemoveConfirm} disabled={removing}>
          {t('common.cancel')}
        </button>
        <button type="button" class="btn-remove" onclick={confirmRemove} disabled={removing}>
          {removing ? t('common.loading') : t('watchlist.remove')}
        </button>
      </div>
    </div>
  </div>
{/if}

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
  .symbol-search-wrap { position: relative; }
  .add-form input, .add-form select {
    padding: 0.4rem 0.6rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .search-dropdown {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    margin-top: 2px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-height: 16rem;
    overflow-y: auto;
    z-index: 5;
  }
  .search-loading { padding: 0.75rem; color: #666; font-size: 0.9rem; }
  .search-dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid #eee;
  }
  .search-dropdown-item:last-child { border-bottom: none; }
  .search-dropdown-row {
    flex: 1;
    background: none;
    border: none;
    padding: 0.35rem 0;
    cursor: pointer;
    text-align: left;
    font-size: 0.9rem;
  }
  .search-dropdown-row:hover { background: #f5f5f5; }
  .search-symbol { font-weight: 500; }
  .search-desc { color: #666; font-size: 0.85rem; }
  .search-add-btn {
    flex-shrink: 0;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    background: var(--accent, #333);
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .search-add-btn:hover { opacity: 0.9; }
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
  .suggestions-label { font-size: 0.9rem; margin: 0.5rem 0 0.25rem 0; color: #555; }
  .suggestions-list { list-style: none; padding: 0; margin: 0 0 1rem 0; }
  .suggestions-list li { padding: 0.25rem 0; }
  .suggestion-btn {
    background: none;
    border: none;
    padding: 0.25rem 0;
    cursor: pointer;
    font-size: 0.9rem;
    text-align: left;
    color: var(--accent, #06c);
    text-decoration: underline;
  }
  .suggestion-btn:hover { color: #004499; }
  .suggestion-symbol { font-weight: 500; }
  .suggestion-desc { color: #666; }
  .suggestion-add { font-size: 0.85rem; }
  .muted { color: #666; }
  ul { list-style: none; padding: 0; }
  ul li { padding: 0.35rem 0; font-size: 0.95rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  ul li .link { margin-left: auto; }
  .type { text-transform: capitalize; color: #666; }
  .exchange { font-size: 0.85rem; color: #888; }
  h3 { font-size: 1rem; margin: 1rem 0 0.5rem 0; }
  .link {
    background: none;
    border: none;
    color: var(--accent, #06c);
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    font-size: 0.9rem;
  }
  .link-danger { color: #c00; }
  .link-danger:hover { color: #a00; }
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    padding: 1rem;
  }
  .modal-content.modal-confirm { background: #fff; border-radius: 8px; padding: 1.5rem; max-width: 22rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  .modal-content .confirm-symbol { font-weight: 500; margin: 0.5rem 0; color: #333; }
  .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }
  .modal-actions .btn-cancel { padding: 0.5rem 1rem; cursor: pointer; background: #eee; border: 1px solid #ccc; border-radius: 4px; }
  .modal-actions .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
  .modal-actions .btn-remove { padding: 0.5rem 1rem; cursor: pointer; background: #c00; color: #fff; border: none; border-radius: 4px; }
  .modal-actions .btn-remove:hover:not(:disabled) { background: #a00; }
  .modal-actions .btn-remove:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
