<script lang="ts">
  import AppLogo from './AppLogo.svelte';
  import type { Card } from '#lib/types.js';

  let { app }: { app: Card } = $props();
</script>

<article class={['card', app.kind]}>
  <div class="logo"><AppLogo src={app.logo} title={app.title} /></div>
  <span class={['badge', app.kind === 'stack' && 'stack']}>{app.kind}</span>
  <h3><a href="/{app.slug}">{app.title}</a></h3>
  <p class="blurb">{app.blurb}</p>
  <p class="categories">{app.categories.join(' / ')}</p>
</article>

<style>
  .card {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto 1fr auto;
    grid-template-areas:
      'logo badge'
      'title title'
      'blurb blurb'
      'categories categories';
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
        scale: 1.8 1;
      }
    }

    @media (max-width: 40rem) {
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto;
      grid-template-areas:
        'logo title badge'
        'blurb blurb blurb'
        'categories categories categories';
      align-items: center;
      column-gap: var(--space-m);
      padding: var(--space-m);

      & .blurb {
        -webkit-line-clamp: 2;
        line-clamp: 2;
      }
    }
  }

  .logo {
    grid-area: logo;
    margin-bottom: var(--space-2xs);
  }

  .badge {
    grid-area: badge;
    align-self: start;
    justify-self: end;
  }

  h3 {
    grid-area: title;
    font-size: var(--text-xl);
    font-weight: 600;

    &::after {
      content: '';
      display: block;
      width: 2.5rem;
      height: 1px;
      margin-top: var(--space-s);
      background: var(--edge);
      transform-origin: left;
      transition: scale 0.35s var(--ease-out);
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
    grid-area: blurb;
    display: -webkit-box;
    overflow: hidden;
    color: var(--text-muted);
    font-size: var(--text-s);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .categories {
    grid-area: categories;
    align-self: end;
    padding-top: var(--space-xs);
    color: var(--text-faint);
    font-size: var(--text-xs);
  }
</style>
