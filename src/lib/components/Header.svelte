<script lang="ts">
  import Icon from './Icon.svelte';
  import Mark from './Mark.svelte';
  import { site } from '#lib/site.js';
</script>

<header>
  <div class="frame bar">
    <a class="brand" href="/">
      <Mark />
      <span>Portainer Templates <b>Extras</b></span>
    </a>
    <nav aria-label="Main">
      <a href="/#apps">Apps</a>
      <a href="/#how">How it works</a>
      <a href={site.requestApp}>Request an app</a>
    </nav>
    <a class="pill ghost star" href={site.repo}>
      <Icon name="star" />
      <span>Star <span class="wide">on GitHub</span></span>
    </a>
  </div>
</header>

<style>
  header {
    border-bottom: 1px solid var(--line-soft);
  }

  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-xl);
    min-height: 4.5rem;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--text);
    font-weight: 600;
    letter-spacing: var(--tracking-tight);
    text-decoration: none;

    & b {
      color: var(--accent);
      font-weight: 600;
    }

    &:hover {
      color: var(--text);
    }
  }

  nav {
    display: flex;
    gap: var(--space-2xs);
    margin-right: auto;

    & a {
      padding: var(--space-xs) var(--space-s);
      border-radius: var(--radius-pill);
      color: var(--text-muted);
      font-size: var(--text-s);
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s var(--ease-out);

      &:hover {
        color: var(--text);
      }
    }

    @media (max-width: 52rem) {
      display: none;
    }
  }

  .star {
    margin-left: auto;
    padding: var(--space-xs) var(--space-m);

    @media (max-width: 30rem) {
      & .wide {
        display: none;
      }
    }
  }
</style>
