<script>
  import { t, locale } from '$lib/i18n/index.js';
  import { stripRecommendationMarkdown, getRecommendationSections } from '$lib/stripMarkdown.js';
  import * as api from '$lib/api.js';

  let runs = $state([]);
  let loading = $state(true);
  let error = $state(null);
  let viewingRunId = $state(null);
  let viewingRun = $state(null);
  let viewingRec = $state(null);
  let promptOpen = $state(false);
  let runToDelete = $state(null);
  let deleting = $state(false);

  async function load() {
    loading = true;
    error = null;
    try {
      runs = await api.getRuns();
      if (!Array.isArray(runs)) runs = [];
    } catch (e) {
      error = e?.message || String(e);
    } finally {
      loading = false;
    }
  }

  async function viewRun(run) {
    viewingRunId = run.id;
    viewingRun = run;
    viewingRec = null;
    promptOpen = false;
    try {
      viewingRec = await api.getRecommendationByRunId(run.id);
    } catch {
      viewingRec = { fullOutput: t('common.error') };
    }
  }

  function closeView() {
    viewingRunId = null;
    viewingRun = null;
    viewingRec = null;
    promptOpen = false;
  }

  const snap = $derived(viewingRun?.inputSnapshot);
  const riskLevel = $derived(snap?.riskLevel);
  const promptText = $derived(snap?.promptHumanReadable);
  const newsItems = $derived(Array.isArray(snap?.newsItems) ? snap.newsItems : []);
  const viewingRecText = $derived(
    viewingRec
      ? stripRecommendationMarkdown(
          $locale === 'sv' && viewingRec.fullOutputSv ? viewingRec.fullOutputSv : viewingRec.fullOutput
        )
      : ''
  );
  const viewingSections = $derived(getRecommendationSections(viewingRecText));

  function openConfirmRemove(run) {
    runToDelete = run;
  }

  function closeConfirmRemove() {
    if (!deleting) runToDelete = null;
  }

  async function confirmRemove() {
    if (!runToDelete) return;
    deleting = true;
    error = null;
    try {
      await api.deleteRun(runToDelete.id);
      runToDelete = null;
      await load();
    } catch (e) {
      error = e?.message || String(e);
    } finally {
      deleting = false;
    }
  }

  $effect(() => {
    load();
  });
</script>

<section class="history">
  <h2>{t('history.title')}</h2>

  {#if loading}
    <p class="muted">{t('common.loading')}</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if runs.length === 0}
    <p class="muted">{t('history.empty')}</p>
  {:else}
    <table class="runs-table">
      <thead>
        <tr>
          <th>{t('history.date')}</th>
          <th>{t('history.status')}</th>
          <th>{t('history.riskLevel')}</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each runs as run (run.id)}
          <tr>
            <td>{run.createdAt ? new Date(run.createdAt).toLocaleString() : '—'}</td>
            <td><span class="status">{run.status ? t('history.status' + run.status.charAt(0).toUpperCase() + run.status.slice(1)) : run.status}</span></td>
            <td>{run.inputSnapshot?.riskLevel != null ? run.inputSnapshot.riskLevel : '—'}</td>
            <td>
              <button type="button" class="link" onclick={() => viewRun(run)}>
                {t('history.view')}
              </button>
            </td>
            <td>
              <button type="button" class="link link-danger" onclick={() => openConfirmRemove(run)}>
                {t('history.remove')}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

{#if viewingRunId && viewingRec}
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-content">
      <h3>{t('dashboard.latestRecommendation')} — {t('history.runNumber')}{viewingRunId}</h3>
      {#if riskLevel != null}
        <p class="run-meta"><strong>{t('history.riskLevel')}:</strong> {riskLevel} — {t('dashboard.risk' + riskLevel)}</p>
      {/if}
      <div class="recommendation">
        {#each viewingSections as section, idx (section.type + String(idx))}
          {#if idx > 0}
            <div class="rec-divider" aria-hidden="true"></div>
          {/if}
          <div class="rec-section rec-section-{section.type}">
            {#each section.lines as item (item.line)}
              <div class="rec-line {section.type}" class:rec-list-item={item.isList}>{item.line}</div>
            {/each}
          </div>
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
            {#each newsItems as item (item.title + (item.symbol ?? ''))}
              <li>
                {#if item.symbol || item.displayName}
                  <span class="news-symbol">{item.symbol}{#if item.displayName} ({item.displayName}):{:else}: {/if} </span>
                {/if}
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
      <button type="button" onclick={closeView}>{t('common.back')}</button>
    </div>
  </div>
{/if}

{#if runToDelete}
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-remove-title">
    <div class="modal-content modal-confirm">
      <h3 id="confirm-remove-title">{t('history.confirmRemoveTitle')}</h3>
      <p class="confirm-message">{t('history.confirmRemoveMessage')}</p>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" onclick={closeConfirmRemove} disabled={deleting}>
          {t('common.cancel')}
        </button>
        <button type="button" class="btn-remove" onclick={confirmRemove} disabled={deleting}>
          {deleting ? t('common.loading') : t('history.remove')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .history { margin-top: 1rem; }
  .muted { color: #666; }
  .error { color: #c00; }
  .runs-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .runs-table th, .runs-table td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; }
  .runs-table .status { text-transform: capitalize; }
  .runs-table .link {
    background: none;
    border: none;
    color: var(--accent, #06c);
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    margin-right: 0.75rem;
  }
  .runs-table .link-danger {
    color: #c00;
  }
  .runs-table .link-danger:hover {
    color: #a00;
  }
  .modal-confirm .confirm-message { margin: 1rem 0; color: #444; }
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  .modal-actions .btn-cancel {
    padding: 0.5rem 1rem;
    cursor: pointer;
    background: #eee;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .modal-actions .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
  .modal-actions .btn-remove {
    padding: 0.5rem 1rem;
    cursor: pointer;
    background: #c00;
    color: #fff;
    border: none;
    border-radius: 4px;
  }
  .modal-actions .btn-remove:hover:not(:disabled) { background: #a00; }
  .modal-actions .btn-remove:disabled { opacity: 0.6; cursor: not-allowed; }
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
    background: #f5f5f5;
    border-radius: 6px;
    white-space: pre-wrap;
    font-size: 0.8rem;
    max-height: 12rem;
    overflow-y: auto;
  }
  .news-list { margin: 0.25rem 0 0 0; padding-left: 1.25rem; }
  .news-list li { margin-bottom: 0.25rem; }
  .news-symbol { color: #555; font-size: 0.9em; font-weight: 600; }
  .news-source { color: #666; font-size: 0.85em; }
  .modal-content {
    background: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 36rem;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
  .rec-divider {
    border: none;
    height: 1px;
    margin: 1rem 0;
    background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.12), transparent);
  }
  .rec-section { margin: 0; }
  .rec-section-positive { border-left: 3px solid #0a6b0a; padding-left: 0.75rem; margin-left: 2px; }
  .rec-section-negative { border-left: 3px solid #c00; padding-left: 0.75rem; margin-left: 2px; }
  .rec-section-neutral { border-left: 3px solid #666; padding-left: 0.75rem; margin-left: 2px; }
  .modal-content .recommendation {
    font-size: 0.95rem;
    margin: 1rem 0;
    max-height: 40vh;
    overflow-y: auto;
  }
  .modal-content .rec-line {
    line-height: 1.65;
    margin-bottom: 0.5em;
    color: inherit;
  }
  .modal-content .rec-section-positive .rec-line { color: #0a6b0a; }
  .modal-content .rec-section-negative .rec-line { color: #c00; }
  .modal-content .rec-section-neutral .rec-line { color: #333; }
  .modal-content .rec-line.rec-list-item { padding-left: 1.25rem; }
  .modal-content button {
    padding: 0.5rem 1rem;
    cursor: pointer;
    background: var(--accent, #333);
    color: #fff;
    border: none;
    border-radius: 4px;
  }
</style>
