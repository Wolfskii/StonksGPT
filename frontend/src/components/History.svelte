<script>
  import { t } from '$lib/i18n/index.js';
  import * as api from '$lib/api.js';

  let runs = $state([]);
  let loading = $state(true);
  let error = $state(null);
  let viewingRunId = $state(null);
  let viewingRec = $state(null);

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
    viewingRec = null;
    try {
      viewingRec = await api.getRecommendationByRunId(run.id);
    } catch {
      viewingRec = { fullOutput: t('common.error') };
    }
  }

  function closeView() {
    viewingRunId = null;
    viewingRec = null;
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
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each runs as run (run.id)}
          <tr>
            <td>{run.createdAt ? new Date(run.createdAt).toLocaleString() : '—'}</td>
            <td><span class="status">{run.status}</span></td>
            <td>
              <button type="button" class="link" onclick={() => viewRun(run)}>
                {t('history.view')}
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
      <h3>{t('dashboard.latestRecommendation')} — Run #{viewingRunId}</h3>
      <div class="recommendation">{viewingRec.fullOutput}</div>
      <button type="button" onclick={closeView}>{t('common.back')}</button>
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
  }
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
  .modal-content {
    background: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 36rem;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
  .modal-content .recommendation {
    white-space: pre-wrap;
    font-size: 0.95rem;
    margin: 1rem 0;
    max-height: 40vh;
    overflow-y: auto;
  }
  .modal-content button {
    padding: 0.5rem 1rem;
    cursor: pointer;
    background: var(--accent, #333);
    color: #fff;
    border: none;
    border-radius: 4px;
  }
</style>
