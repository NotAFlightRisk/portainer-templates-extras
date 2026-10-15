<script lang="ts">
  import Mark from './Mark.svelte';
  import { site, templateUrls } from '#lib/site.js';

  const columns = [
    {
      title: 'This list',
      links: [
        { label: 'GitHub repo', href: site.repo },
        { label: 'templates.json', href: templateUrls.extras },
        { label: 'Request an app', href: site.requestApp },
        { label: 'Add one yourself', href: `${site.repo}/blob/main/.github/CONTRIBUTING.md` }
      ]
    },
    {
      title: 'Elsewhere',
      links: [
        { label: 'The main Portainer Templates list', href: site.mainList },
        {
          label: 'Portainer docs on app templates',
          href: 'https://docs.portainer.io/user/docker/templates'
        }
      ]
    }
  ];
</script>

<footer>
  <div class="frame grid">
    <div class="about">
      <a class="brand" href="/" aria-label="{site.name} home"><Mark /></a>
      <p>
        One-click Portainer templates for self-hosted apps, each tested with the form left as it
        comes. The apps belong to their authors, and every page links back to the source.
      </p>
    </div>
    {#each columns as column (column.title)}
      <nav aria-label={column.title}>
        <h2>{column.title}</h2>
        <ul>
          {#each column.links as link (link.href)}
            <li><a href={link.href}>{link.label}</a></li>
          {/each}
        </ul>
      </nav>
    {/each}
  </div>
  <div class="band">
    <p class="frame legal">
      MIT licensed. Made by <a href={site.author}>NotAFlightRisk</a>, not affiliated with Portainer.
    </p>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--line-soft);
    color: var(--text-muted);
    font-size: var(--text-s);
  }

  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: var(--space-xl);
    padding-block: var(--space-2xl);

    @media (max-width: 48rem) {
      grid-template-columns: 1fr 1fr;

      & .about {
        grid-column: 1 / -1;
      }
    }
  }

  .about {
    display: grid;
    gap: var(--space-m);
    align-content: start;
    max-width: 26rem;
  }

  .brand {
    width: fit-content;
  }

  h2 {
    margin-bottom: var(--space-s);
    color: var(--text);
    font-size: var(--text-s);
    font-weight: 600;
    letter-spacing: 0;
  }

  ul {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    color: var(--text-muted);
    text-decoration: none;

    &:hover {
      color: var(--text);
    }
  }

  .legal {
    padding-block: var(--space-l);
    color: var(--text-faint);
    font-size: var(--text-xs);

    & a {
      color: inherit;
      text-decoration: underline;
    }
  }
</style>
