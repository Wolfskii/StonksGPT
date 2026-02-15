<script>
  import { t, locale } from '$lib/i18n/index.js';
  import { stripRecommendationMarkdown, getRecommendationLines } from '$lib/stripMarkdown.js';
  import { getRiskFromStorage, setRiskInStorage, RISK_LEVELS } from '$lib/risk.js';
  import * as api from '$lib/api.js';

  let latest = $state(null);
  let runs = $state([]);
  let risk = $state(getRiskFromStorage());

  const recommendationText = $derived.by(() => {
    if (!latest) return '';
    $locale;
    const raw = ($locale === 'sv' && latest?.fullOutputSv) ? latest.fullOutputSv : (latest?.fullOutput ?? '');
    return stripRecommendationMarkdown(raw);
  });
  const recommendationLines = $derived.by(() => getRecommendationLines(recommendationText));
  const hasRecommendation = $derived.by(() => {
    if (!latest) return false;
    return Boolean(latest.fullOutput || latest.fullOutputSv);
  });
  let loading = $state(true);
  let jobRunning = $state(false);
  let jobError = $state(null);
  let promptOpen = $state(false);

  const runForLatest = $derived(runs.find((r) => r.id === latest?.runId));
  const snap = $derived(runForLatest?.inputSnapshot);
  const runRiskLevel = $derived(snap?.riskLevel);
  const promptText = $derived(snap?.promptHumanReadable);
  const newsItems = $derived(Array.isArray(snap?.newsItems) ? snap.newsItems : []);

  function setRisk(level) {
    risk = level;
    setRiskInStorage(level);
  }

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
      const result = await api.runDailyJob(risk);
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
    <div class="risk-section">
      <span class="risk-label">{t('dashboard.riskLabel')}</span>
      <div class="risk-slider" role="group" aria-label={t('dashboard.riskLabel')}>
        <div class="risk-track">
          {#each RISK_LEVELS as level (level)}
            <button
              type="button"
              class="risk-stop"
              class:active={risk === level}
              onclick={() => setRisk(level)}
              title={t('dashboard.risk' + level)}
            >
              <span class="risk-dot"></span>
            </button>
          {/each}
        </div>
        <p class="risk-desc">{t('dashboard.risk' + risk)}</p>
      </div>
    </div>

    <div class="latest">
      <h3>{t('dashboard.latestRecommendation')}</h3>
      {#if hasRecommendation}
        {#if runRiskLevel != null}
          <p class="run-meta"><strong>{t('history.riskLevel')}:</strong> {runRiskLevel} — {t('dashboard.risk' + runRiskLevel)}</p>
        {/if}
        <div class="recommendation">
          {#each recommendationLines as item, i (i)}
            <div class="rec-line {item.type}" class:rec-list-item={item.isList}>{item.line}</div>
          {/each}
        </div>
        {#if promptText}
          <div class="run-context">
            <button type="button" class="context-toggle" onclick={() => promptOpen = !promptOpen} aria-expanded={promptOpen}>
              {t('history.promptUsed')} — {promptOpen ? t('history.hidePrompt') : t('history.showPrompt')}
            </button>
            {#if promptOpen}
              <pre class="prompt-text">{promptText}</pre>
            {/if}
          </div>
        {/if}
        <div class="run-context">
          <strong>{t('history.newsUsed')}:</strong>
          {#if newsItems.length === 0}
            <span class="muted">{t('history.noNews')}</span>
          {:else}
            <ul class="news-list">
              {#each newsItems as item (item.title)}
                <li>
                  {#if item.url}
                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                  {:else}
                    {item.title}
                  {/if}
                  {#if item.source}<span class="news-source"> ({item.source})</span>{/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {:else}
        <p class="muted">{t('dashboard.noRecommendation')}</p>
      {/if}
    </div>

    <div class="actions">
      <button type="button" disabled={jobRunning} onclick={() => runJob()}>
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
              <span class="status">{run.status ? t('history.status' + run.status.charAt(0).toUpperCase() + run.status.slice(1)) : run.status}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</section>

<style>
  .dashboard { margin-top: 1rem; }
  .risk-section { margin-bottom: 1.5rem; }
  .risk-label { display: block; font-size: 0.9rem; color: #555; margin-bottom: 0.5rem; }
  .risk-slider { max-width: 28rem; }
  .risk-track {
    display: flex;
    align-items: center;
    gap: 0;
    position: relative;
  }
  .risk-track::before {
    content: '';
    position: absolute;
    left: 0.75rem;
    right: 0.75rem;
    top: 50%;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
    transform: translateY(-50%);
    pointer-events: none;
  }
  .risk-stop {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
  }
  .risk-dot {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #bbb;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px #999;
    transition: background 0.15s;
  }
  .risk-stop:hover .risk-dot { background: #888; }
  .risk-stop.active .risk-dot {
    background: var(--accent, #333);
    box-shadow: 0 0 0 2px var(--accent, #333);
  }
  .risk-desc { margin: 0.35rem 0 0 0; font-size: 0.85rem; color: #666; }
  .latest { margin-bottom: 1.5rem; }
  .run-meta { font-size: 0.9rem; color: #555; margin: 0 0 0.75rem 0; }
  .run-context { margin-top: 1rem; font-size: 0.9rem; }
  .context-toggle {
    background: none;
    border: none;
    color: var(--accent, #06c);
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    font-size: 0.9rem;
  }
  .prompt-text {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 6px;
    white-space: pre-wrap;
    font-size: 0.8rem;
    max-height: 12rem;
    overflow-y: auto;
  }
  .news-list { margin: 0.25rem 0 0 0; padding-left: 1.25rem; }
  .news-list li { margin-bottom: 0.25rem; }
  .news-source { color: #666; font-size: 0.85em; }
  .recommendation {
    background: var(--bg-secondary, #f5f5f5);
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    max-height: 20rem;
    overflow-y: auto;
  }
  .rec-line {
    line-height: 1.65;
    margin-bottom: 0.5em;
    color: #333;
  }
  .rec-line.positive { color: #0a6b0a; }
  .rec-line.negative { color: #c00; }
  .rec-line.neutral { color: #333; }
  .rec-line.rec-list-item { padding-left: 1.25rem; }
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
