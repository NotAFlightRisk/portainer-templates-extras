<script lang="ts">
  import AppLogo from './AppLogo.svelte';
  import type { Card } from '#lib/types.js';

  let { app }: { app: Card } = $props();
</script>

<article class={['card', app.kind]}>
  <div class="top">
    <AppLogo src={app.logo} title={app.title} />
    <span class={['badge', app.kind === 'stack' && 'stack']}>{app.kind}</span>
  </div>
  <h3><a href="/{app.slug}">{app.title}</a></h3>
  <p class="blurb">{app.blurb}</p>
  <p class="categories">{app.categories.join(' / ')}</p>
</article>

<style>
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    padding: var(--space-l);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-l);
    background: var(--surface);
    transition:
      background-color 0.25s var(--ease-out),
      border-color 0.25s var(--ease-out);

    --edge: var(--accent);

    &.stack {
      --edge: var(--stack);
    }

    &:hover,
    &:focus-within {
      border-color: var(--line);
      background: var(--surface-raised);

      & h3::after {
        width: 4.5rem;
      }
    }
  }

  .top {
    display: flex;
    align-items: start;
    justify-content: space-between;
    margin-bottom: var(--space-2xs);
  }

  h3 {
    font-size: var(--text-xl);
    font-weight: 600;

    &::after {
      content: '';
      display: block;
      width: 2.5rem;
      height: 1px;
      margin-top: var(--space-s);
      background: var(--edge);
      transition: width 0.35s var(--ease-out);
    }

    & a {
      color: var(--text);
      text-decoration: none;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
      }
    }
  }

  .blurb {
    display: -webkit-box;
    overflow: hidden;
    color: var(--text-muted);
    font-size: var(--text-s);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .categories {
    margin-top: auto;
    padding-top: var(--space-xs);
    color: var(--text-faint);
    font-size: var(--text-xs);
  }
</style>
