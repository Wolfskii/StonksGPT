<script>
  import { t, locale, setLocale, localeOptions } from '$lib/i18n/index.js';
  import Dashboard from './components/Dashboard.svelte';
  import Watchlist from './components/Watchlist.svelte';
  import Notes from './components/Notes.svelte';
  import History from './components/History.svelte';

  const appName = $derived.by(() => {
    $locale;
    return t('app.name');
  });
  const tagline = $derived.by(() => {
    $locale;
    return t('app.tagline');
  });
  const disclaimerText = $derived.by(() => {
    $locale;
    return t('disclaimer');
  });

  let page = $state('dashboard');
</script>

<main>
  <header>
    <h1>{appName}</h1>
    <p>{tagline}</p>
    <nav class="nav">
      <button
        class:active={page === 'dashboard'}
        onclick={() => page = 'dashboard'}
      >{t('nav.dashboard')}</button>
      <button
        class:active={page === 'watchlist'}
        onclick={() => page = 'watchlist'}
      >{t('nav.watchlist')}</button>
      <button
        class:active={page === 'notes'}
        onclick={() => page = 'notes'}
      >{t('nav.notes')}</button>
      <button
        class:active={page === 'history'}
        onclick={() => page = 'history'}
      >{t('nav.history')}</button>
    </nav>
    <div class="locale">
      <label for="locale-select" class="locale-label">{t('common.language')}</label>
      <select
        id="locale-select"
        class="locale-select"
        value={$locale}
        onchange={(e) => setLocale(e.currentTarget.value)}
      >
        {#each localeOptions as opt (opt.code)}
          <option value={opt.code}>{opt.flag} {t(opt.labelKey)}</option>
        {/each}
      </select>
    </div>
  </header>

  {#if page === 'dashboard'}
    <Dashboard />
  {:else if page === 'watchlist'}
    <Watchlist />
  {:else if page === 'notes'}
    <Notes />
  {:else if page === 'history'}
    <History />
  {/if}

  <p class="disclaimer">{disclaimerText}</p>
</main>

<style>
  main {
    max-width: 44rem;
    margin: 2rem auto;
    padding: 0 1rem;
    font-family: system-ui, sans-serif;
  }
  header {
    margin-bottom: 1.5rem;
  }
  h1 {
    font-size: 1.5rem;
    margin: 0 0 0.25rem 0;
  }
  .nav {
    margin-top: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .nav button {
    padding: 0.35rem 0.6rem;
    cursor: pointer;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  .nav button:hover {
    background: #e8e8e8;
  }
  .nav button.active {
    font-weight: bold;
    background: var(--accent, #333);
    color: #fff;
    border-color: var(--accent, #333);
  }
  .locale {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .locale-label {
    font-size: 0.9rem;
    color: #555;
  }
  .locale-select {
    padding: 0.35rem 0.5rem;
    font-size: 0.9rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }
  .locale-select option {
    padding: 0.25rem;
  }
  .disclaimer {
    margin-top: 2rem;
    font-size: 0.875rem;
    color: #666;
  }
</style>
