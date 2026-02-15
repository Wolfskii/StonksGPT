<script>
  import { t } from '$lib/i18n/index.js';
  import * as api from '$lib/api.js';

  let list = $state([]);
  let loading = $state(true);
  let content = $state('');
  let noteDate = $state('');
  let submitting = $state(false);
  let error = $state(null);

  async function load() {
    loading = true;
    error = null;
    try {
      list = await api.getNotes();
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      error = e?.message || String(e);
    } finally {
      loading = false;
    }
  }

  async function add() {
    const c = content.trim();
    if (!c) return;
    submitting = true;
    error = null;
    try {
      await api.addNote({ content: c, noteDate: noteDate || null });
      content = '';
      noteDate = '';
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

<section class="notes">
  <h2>{t('notes.title')}</h2>

  {#if loading}
    <p class="muted">{t('common.loading')}</p>
  {:else}
    <form
      class="add-form"
      onsubmit={(e) => { e.preventDefault(); add(); }}
    >
      <textarea
        bind:value={content}
        placeholder={t('notes.placeholder')}
        rows="3"
        required
      ></textarea>
      <label>
        {t('notes.dateOptional')}
        <input type="date" bind:value={noteDate} />
      </label>
      <button type="submit" disabled={submitting}>
        {t('notes.add')}
      </button>
    </form>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if list.length === 0}
      <p class="muted">{t('notes.empty')}</p>
    {:else}
      <ul>
        {#each list as note (note.id)}
          <li>
            {#if note.noteDate}
              <span class="date">{new Date(note.noteDate).toLocaleDateString()}</span>
            {/if}
            <span class="content">{note.content}</span>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style>
  .notes { margin-top: 1rem; }
  .add-form { margin-bottom: 1rem; }
  .add-form textarea {
    width: 100%;
    max-width: 32rem;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
  }
  .add-form label { display: block; margin: 0.5rem 0; font-size: 0.9rem; color: #666; }
  .add-form input[type="date"] { margin-left: 0.5rem; }
  .add-form button {
    padding: 0.5rem 1rem;
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
  ul li { padding: 0.5rem 0; border-bottom: 1px solid #eee; font-size: 0.95rem; }
  ul li .date { color: #666; margin-right: 0.5rem; font-size: 0.85rem; }
</style>
