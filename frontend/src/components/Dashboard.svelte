<script>
  import { t, locale } from '$lib/i18n/index.js';
  import { stripRecommendationMarkdown } from '$lib/stripMarkdown.js';
  import * as api from '$lib/api.js';

  let latest = $state(null);
  let runs = $state([]);

  const recommendationText = $derived.by(() => {
    if (!latest) return '';
    $locale;
    const raw = ($locale === 'sv' && latest?.fullOutputSv) ? latest.fullOutputSv : (latest?.fullOutput ?? '');
    return stripRecommendationMarkdown(raw);
  });
  const hasRecommendation = $derived.by(() => {
    if (!latest) return false;
    return Boolean(latest.fullOutput || latest.fullOutputSv);
  });
  let loading = $state(true);
  let jobRunning = $state(false);
  let jobError = $state(null);

  async function load() {
    loading = true;
    jobError = null;
    try {
      const [rec, runList] = await Promise.all([api.getLatestRecommendation(), api.getRuns()]);
      latest = rec;
      runs = Array.isArray(runList) ? runList : [];
    } catch (e) {
      jobError = e?.message || String(e);
    } finally {
      loading = false;
    }
  }

  async function runJob() {
    jobRunning = true;
    jobError = null;
    try {
      const result = await api.runDailyJob();
      if (result?.ok === false && result?.error) {
        jobError = result.error;
      } else {
        await load();
      }
    } catch (e) {
      jobError = e?.message || String(e);
    } finally {
      jobRunning = false;
    }
  }

  $effect(() => {
    load();
  });
</script>

<section class="dashboard">
  <h2>{t('dashboard.title')}</h2>

  {#if loading}
    <p class="muted">{t('common.loading')}</p>
  {:else}
    <div class="latest">
      <h3>{t('dashboard.latestRecommendation')}</h3>
      {#if hasRecommendation}
        <div class="recommendation">{recommendationText}</div>
      {:else}
        <p class="muted">{t('dashboard.noRecommendation')}</p>
      {/if}
    </div>

    <div class="actions">
      <button
        type="button"
        disabled={jobRunning}
        onclick={runJob}
      >
        {jobRunning ? t('common.loading') : t('dashboard.runJob')}
      </button>
    </div>
    {#if jobError}
      <p class="error">{jobError}</p>
    {/if}

    <div class="runs">
      <h3>{t('dashboard.recentRuns')}</h3>
      {#if runs.length === 0}
        <p class="muted">{t('history.empty')}</p>
      {:else}
        <ul>
          {#each runs as run (run.id)}
            <li>
              <span class="date">{run.createdAt ? new Date(run.createdAt).toLocaleString() : '—'}</span>
              <span class="status">{run.status}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</section>

<style>
  .dashboard { margin-top: 1rem; }
  .latest { margin-bottom: 1.5rem; }
  .recommendation {
    white-space: pre-wrap;
    background: var(--bg-secondary, #f5f5f5);
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    max-height: 20rem;
    overflow-y: auto;
  }
  .actions { margin-bottom: 1rem; }
  .actions button {
    padding: 0.5rem 1rem;
    cursor: pointer;
    background: var(--accent, #333);
    color: #fff;
    border: none;
    border-radius: 6px;
  }
  .actions button:disabled { opacity: 0.6; cursor: not-allowed; }
  .error { color: #c00; font-size: 0.9rem; }
  .muted { color: #666; font-size: 0.9rem; }
  .runs ul { list-style: none; padding: 0; margin: 0; }
  .runs li { display: flex; gap: 1rem; padding: 0.25rem 0; font-size: 0.9rem; }
  .runs .date { color: #666; }
  .runs .status { text-transform: capitalize; }
</style>
