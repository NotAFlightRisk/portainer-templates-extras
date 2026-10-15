<script lang="ts">
  import { page } from '$app/state';
  import { site } from '#lib/site.js';

  const missing = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{missing ? 'Not found' : 'Something broke'} - {site.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="frame">
  <p class="status">{page.status}</p>
  <h1>{missing ? "That app isn't in the list" : 'Something broke on our end'}</h1>
  <p>
    {#if missing}
      It might have a different name here, or it's not been added yet. Have a look through the list,
      or ask for it.
    {:else}
      Give it a minute and try again. It's been reported, so someone will have a look.
    {/if}
  </p>
  <div class="actions">
    <a class="pill primary" href="/#apps">See every app</a>
    {#if missing}<a class="pill ghost" href={site.requestApp}>Request an app</a>{/if}
  </div>
</section>

<style>
  section {
    display: grid;
    gap: var(--space-l);
    justify-items: start;
    padding-block: var(--space-3xl);
  }

  .status {
    color: var(--accent);
    font: 500 var(--text-s) / 1 var(--font-mono);
  }

  h1 {
    font-size: var(--text-hero);
    font-weight: 800;
    line-height: 1.05;
  }

  p {
    max-width: 36rem;
    color: var(--text-muted);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s);
  }
</style>
