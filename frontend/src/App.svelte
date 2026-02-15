<script>
  import { t, locale, setLocale } from '$lib/i18n/index.js';

  // Runes: $derived.by depends on $locale so translations update when locale changes
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
  const localeEn = $derived.by(() => {
    $locale;
    return t('locale.en');
  });
  const localeSv = $derived.by(() => {
    $locale;
    return t('locale.sv');
  });
</script>

<main>
  <header>
    <h1>{appName}</h1>
    <p>{tagline}</p>
    <div class="locale">
      <button
        class:active={$locale === 'en'}
        onclick={() => setLocale('en')}
      >{localeEn}</button>
      <button
        class:active={$locale === 'sv'}
        onclick={() => setLocale('sv')}
      >{localeSv}</button>
    </div>
  </header>
  <p class="disclaimer">{disclaimerText}</p>
</main>

<style>
  main {
    max-width: 40rem;
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
  .locale {
    margin-top: 0.75rem;
  }
  .locale button {
    margin-right: 0.5rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }
  .locale button.active {
    font-weight: bold;
  }
  .disclaimer {
    font-size: 0.875rem;
    color: #666;
  }
</style>
