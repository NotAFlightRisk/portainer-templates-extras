<script lang="ts">
  import AppCard from '#lib/components/AppCard.svelte';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import Icon from '#lib/components/Icon.svelte';
  import Install from '#lib/components/Install.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { portainerTab } from '#lib/install.js';
  import { site, templateUrls } from '#lib/site.js';
  import type { Card, Kind } from '#lib/types.js';

  let { data } = $props();

  const total = $derived(data.apps.length);
  const allInMain = $derived(data.inMain === total);
  const coverage = $derived(
    allInMain
      ? 'Everything on this page is in it.'
      : data.inMain
        ? `${data.inMain} of the ${total} here are in it so far.`
        : `The ${total} here aren't in it yet, so use the other tab for those.`
  );
  const tabs = $derived.by(() => {
    const next = ['Open App Templates, pick an app and hit Deploy.'];
    const ours = {
      ...portainerTab(templateUrls.extras, next),
      id: 'extras',
      label: 'these apps',
      note: `Gets you all ${total} apps on this page, and nothing else.`
    };
    const main = {
      ...portainerTab(templateUrls.main, next),
      id: 'main',
      label: 'main list',
      note: `The main Portainer Templates list, with ${data.mainCount} apps. ${coverage}`
    };
    return allInMain ? [main, ours] : [ours, main];
  });

  let query = $state('');
  let kind: Kind | 'all' = $state('all');
  let category = $state('');

  const kinds = [
    { value: 'all', label: 'All' },
    { value: 'container', label: 'Containers' },
    { value: 'stack', label: 'Stacks' }
  ];
  const categories = $derived([...new Set(data.apps.flatMap((app) => app.categories))].sort());
  const words = $derived(query.toLowerCase().split(/\s+/).filter(Boolean));
  const matches = (app: Card) => {
    const text = [app.title, app.blurb, ...app.categories].join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  };
  const shown = $derived(
    data.apps.filter(
      (app) =>
        (kind === 'all' || app.kind === kind) &&
        (!category || app.categories.includes(category)) &&
        matches(app)
    )
  );

  const strip = 14;
  const steps = [
    {
      title: 'Add the URL',
      text: 'In Portainer, paste the templates URL into Settings --> App Templates and save.'
    },
    {
      title: 'Pick an app',
      text: 'It turns up under App Templates with everything else in the list. Search for it by name.'
    },
    {
      title: 'Deploy it',
      text: "Most work with the form as it comes. Stacks with a database want a password first, and each app's page here says what to fill in and where its data lives."
    }
  ];

  const graph = $derived([
    {
      '@type': 'WebSite',
      name: site.name,
      url: site.url,
      description: 'One-click Portainer templates for self-hosted apps.'
    },
    {
      '@type': 'ItemList',
      name: 'Self-hosted apps with Portainer templates',
      numberOfItems: total,
      itemListElement: data.apps.map((app, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${site.url}/${app.slug}`,
        name: app.title
      }))
    }
  ]);
</script>

<Seo
  title="{site.name} - one-click Portainer templates for self-hosted apps"
  description="Tested Portainer templates for {total} self-hosted apps, each with a Docker Compose file and a docker run command. Add one URL to Portainer and deploy with a click."
  {graph}
/>

<section class="hero">
  <div class="frame layout">
    <div class="pitch">
      <h1>
        One-click Portainer templates <span>for <span class="nowrap">self-hosted</span> apps</span>
      </h1>
      <p class="lead">
        Tested templates for self-hosted apps the big lists were missing. Each one deploys with
        Portainer's form left alone (or a password filled in), and every app comes with a compose
        file for when you'd rather skip Portainer.
      </p>
      <div class="actions">
        <a class="pill primary" href="#apps">Browse the apps <Icon name="down" /></a>
        <a class="pill ghost" href={site.requestApp}>Request an app</a>
      </div>
    </div>
    <div id="install" class="install">
      <Install {tabs} name="Portainer" id="list" />
    </div>
  </div>
</section>

<div class="frame strip-frame">
  <div class="strip">
    <p>In the list</p>
    <ul>
      {#each data.apps.slice(0, strip) as app (app.slug)}
        <li>
          <a href="/{app.slug}" title={app.title}>
            <AppLogo src={app.logo} title={app.title} size={28} eager />
            <span class="visually-hidden">{app.title}</span>
          </a>
        </li>
      {/each}
      {#if total > strip}
        <li><a class="more" href="#apps">+{total - strip} more</a></li>
      {/if}
    </ul>
  </div>
</div>

<section id="apps" class="band">
  <div class="frame section">
    <div class="section-head">
      <h2>Every app in the list</h2>
      <p>Pick one for its install steps, compose file and settings.</p>
    </div>

    <form class="filters" role="search" onsubmit={(event) => event.preventDefault()}>
      <label class="search">
        <Icon name="search" />
        <span class="visually-hidden">Search apps</span>
        <input type="search" bind:value={query} placeholder="Search by name or what it does" />
      </label>
      <fieldset class="kinds">
        <legend class="visually-hidden">Type</legend>
        {#each kinds as option (option.value)}
          <label>
            <input type="radio" name="kind" value={option.value} bind:group={kind} />
            {option.label}
          </label>
        {/each}
      </fieldset>
      <label class="category">
        <span class="visually-hidden">Category</span>
        <select bind:value={category}>
          <option value="">All categories</option>
          {#each categories as name (name)}
            <option value={name}>{name}</option>
          {/each}
        </select>
      </label>
    </form>

    <p class="count" aria-live="polite">
      {shown.length === total ? `All ${total} apps` : `${shown.length} of ${total} apps`}
    </p>

    {#if shown.length}
      <ul class="grid">
        {#each shown as app (app.slug)}
          <li><AppCard {app} /></li>
        {/each}
      </ul>
    {:else}
      <p class="empty">
        Nothing matches that. Try another word, or <a href={site.requestApp}>ask for the app</a> and someone
        might add it.
      </p>
    {/if}
  </div>
</section>

<section id="how" class="band">
  <div class="frame section">
    <div class="section-head">
      <h2>From URL to running app</h2>
      <p>No Portainer? Every app's page has a compose file and a docker run command as well.</p>
    </div>
    <ol class="steps">
      {#each steps as step, i (step.title)}
        <li>
          <span class="number" aria-hidden="true">0{i + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

<section class="band">
  <div class="frame section paths">
    <article class="path">
      <span class="badge">{data.mainCount} templates</span>
      <h2>The main list</h2>
      <p>
        The big one. It pulls in templates from all over, so one URL in Portainer gets you hundreds
        of apps. {coverage}
      </p>
      <a class="arrow-link" href={site.mainList}>See the main list <Icon name="arrow" /></a>
    </article>
    <article class="path stack">
      <span class="badge stack">Open source</span>
      <h2>Missing an app?</h2>
      <p>
        Ask for it, or add it yourself. Each app is one JSON file, and CI checks it starts before it
        goes in.
      </p>
      <div class="links">
        <a class="arrow-link" href={site.requestApp}>Request an app <Icon name="arrow" /></a>
        <a class="arrow-link" href="{site.repo}/blob/main/.github/CONTRIBUTING.md"
          >Contributing guide <Icon name="arrow" /></a
        >
      </div>
    </article>
  </div>
</section>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: var(--space-2xl);
    align-items: center;
    padding-block: var(--space-3xl);

    @media (max-width: 60rem) {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-xl);
      padding-block: var(--space-2xl);
    }
  }

  .pitch {
    display: grid;
    gap: var(--space-l);
  }

  h1 {
    font-size: var(--text-hero);
    font-weight: 800;
    line-height: 1.02;
    letter-spacing: -0.03em;

    & > span {
      display: block;
      color: var(--accent);
    }

    & .nowrap {
      white-space: nowrap;
    }
  }

  .lead {
    max-width: 34rem;
    color: var(--text-muted);
    font-size: var(--text-l);
    line-height: 1.75;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s);
    padding-top: var(--space-xs);
  }

  .strip-frame {
    padding-bottom: var(--space-2xl);
  }

  .strip {
    display: grid;
    grid-template-columns: auto 1fr;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-l);
    background: var(--surface);

    & > p {
      display: flex;
      align-items: center;
      padding: var(--space-m) var(--space-l);
      border-right: 1px solid var(--line-soft);
      color: var(--text-faint);
      font-size: var(--text-s);
    }

    & ul {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-s);
      margin: 0;
      padding: var(--space-m) var(--space-l);
      list-style: none;
    }

    & a {
      display: block;
      border-radius: var(--radius-m);
      filter: grayscale(1) brightness(1.3);
      opacity: 0.8;
      transition:
        filter 0.3s var(--ease-out),
        opacity 0.3s var(--ease-out);

      &:hover,
      &:focus-visible {
        filter: none;
        opacity: 1;
      }
    }

    & .more {
      padding-inline: var(--space-xs);
      color: var(--text-muted);
      filter: none;
      font-size: var(--text-s);
      text-decoration: none;
    }

    @media (max-width: 40rem) {
      grid-template-columns: 1fr;

      & > p {
        border-right: 0;
        border-bottom: 1px solid var(--line-soft);
      }
    }
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s);
  }

  .search {
    display: flex;
    flex: 1 1 18rem;
    align-items: center;
    gap: var(--space-xs);
    padding-inline: var(--space-m);
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    background: var(--surface);
    color: var(--text-faint);

    &:focus-within {
      border-color: var(--accent);
    }

    & :global(svg) {
      flex: none;
      width: 1.1rem;
      height: 1.1rem;
    }

    & input {
      flex: 1;
      min-width: 0;
      padding-block: var(--space-s);
      border: 0;
      background: none;
      color: var(--text);
      font: inherit;
      outline: none;

      &::placeholder {
        color: var(--text-faint);
      }
    }
  }

  .kinds {
    display: flex;
    margin: 0;
    padding: var(--space-2xs);
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);

    & label {
      padding: var(--space-xs) var(--space-m);
      border-radius: var(--radius-pill);
      color: var(--text-muted);
      font-size: var(--text-s);
      font-weight: 600;
      cursor: pointer;
      transition:
        background-color 0.2s var(--ease-out),
        color 0.2s var(--ease-out);

      &:has(:checked) {
        background: var(--surface-hover);
        color: var(--text);
      }

      &:has(:focus-visible) {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
    }

    & input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
  }

  .category select {
    height: 100%;
    padding: var(--space-s) var(--space-xl) var(--space-s) var(--space-m);
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    background: var(--surface)
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
      no-repeat right var(--space-m) center / 1rem;
    color: var(--text);
    font: 600 var(--text-s) / 1.4 var(--font-sans);
    appearance: none;
    cursor: pointer;
  }

  .count {
    margin-top: calc(var(--space-l) * -1);
    color: var(--text-faint);
    font-size: var(--text-s);
    font-variant-numeric: tabular-nums;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: var(--space-m);
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      display: grid;
    }
  }

  .empty {
    padding: var(--space-2xl) var(--space-l);
    border: 1px dashed var(--line);
    border-radius: var(--radius-l);
    color: var(--text-muted);
    text-align: center;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: var(--space-m);
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      display: grid;
      align-content: start;
      gap: var(--space-s);
      padding: var(--space-l);
      border: 1px solid var(--line-soft);
      border-radius: var(--radius-l);
    }

    & .number {
      width: fit-content;
      padding-bottom: var(--space-xs);
      border-bottom: 1px solid var(--accent);
      color: var(--text-faint);
      font: 500 var(--text-xs) / 1 var(--font-mono);
    }

    & h3 {
      font-size: var(--text-l);
      font-weight: 600;
    }

    & p {
      color: var(--text-muted);
      font-size: var(--text-s);
    }
  }

  .paths {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: var(--space-m);
  }

  .path {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: var(--space-m);
    padding: var(--space-xl);
    border: 1px solid var(--accent);
    border-radius: var(--radius-l);
    background: var(--surface);

    &.stack {
      border-color: var(--stack);

      & .arrow-link {
        color: var(--stack);
      }
    }

    & h2 {
      font-size: var(--text-2xl);
      font-weight: 700;
    }

    & p {
      max-width: 32rem;
      color: var(--text-muted);
    }

    & .links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-l);
    }
  }
</style>
