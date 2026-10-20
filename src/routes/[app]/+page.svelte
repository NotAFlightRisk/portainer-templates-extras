<script lang="ts">
  import AppCard from '#lib/components/AppCard.svelte';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import Icon from '#lib/components/Icon.svelte';
  import Install from '#lib/components/Install.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { envDefault, hostPort, volumeNames, withDefaults } from '#lib/install.js';
  import { site } from '#lib/site.js';

  let { data } = $props();

  const app = $derived(data.app);
  const template = $derived(app.template);
  const env = $derived(template.env ?? []);
  const volumes = $derived(template.volumes ?? []);
  const files = $derived(`${site.repo}/tree/main/apps/${app.slug}`);
  const report = $derived(
    `${site.repo}/issues/new?template=broken_template.yml&title=${encodeURIComponent(`[Broken]: ${app.title}`)}`
  );
  const images = $derived(
    app.kind === 'stack' ? data.services.flatMap(({ image }) => image ?? []) : [template.image]
  );

  const clip = (text: string, max = 155) => {
    if (text.length <= max) return text;
    const cut = text.lastIndexOf(' ', max - 3);
    return `${text.slice(0, cut > 0 ? cut : max - 3)}...`;
  };

  const graph = $derived([
    {
      '@type': 'SoftwareApplication',
      name: app.title,
      description: app.blurb,
      url: `${site.url}/${app.slug}`,
      image: app.logo,
      sameAs: app.source,
      applicationCategory: app.categories.join(', '),
      operatingSystem: 'Linux (Docker)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Apps', item: site.url },
        { '@type': 'ListItem', position: 2, name: app.title, item: `${site.url}/${app.slug}` }
      ]
    }
  ]);
</script>

<Seo
  title="{app.title}: Portainer template and Docker Compose file"
  description={clip(
    `${app.blurb} Install ${app.title} with Portainer, Docker Compose or docker run.`
  )}
  {graph}
/>

<div class="band head">
  <div class="frame hero">
    <div class="intro">
      <nav class="crumbs" aria-label="Breadcrumb">
        <ol>
          <li><a href="/#apps">Apps</a></li>
          <li aria-current="page">{app.title}</li>
        </ol>
      </nav>
      <header>
        <AppLogo src={app.logo} title={app.title} size={56} eager />
        <div class="title">
          <h1>{app.title}</h1>
          <p class="tags">
            <span class={['badge', app.kind === 'stack' && 'stack']}>{app.kind}</span>
            <span>{app.categories.join(' / ')}</span>
          </p>
        </div>
      </header>
      <p class="lead">{app.blurb}</p>
      <div class="actions">
        <a class="pill ghost" href={app.source}><Icon name="github" /> Source code</a>
      </div>
    </div>

    <section id="install" class="install" aria-labelledby="install-title">
      <h2 id="install-title">Install {app.title}</h2>
      <p>
        {#if app.inMainList}
          It's in the main Portainer Templates list, so that's the URL to use, and you get hundreds
          of other apps with it.
        {:else}
          It isn't in the main Portainer Templates list yet, so use this one. Portainer takes one
          URL at a time, so it swaps out whatever list you had before.
        {/if}
      </p>
      <Install tabs={data.tabs} name={app.title} id="install" />
    </section>
  </div>
</div>

<div class="band">
  <div class="frame body">
    <div class="main">
      <section>
        <h2>Before you start</h2>
        <p class="note">{@html app.note}</p>
      </section>

      {#if env.length}
        <section>
          <h2>Settings</h2>
          <p>
            What the Portainer form asks for. With compose they go in
            {#if app.kind === 'stack'}the <code>.env</code> file{:else}the environment block{/if}
            instead.
          </p>
          <div class="table">
            <table>
              <thead>
                <tr
                  ><th scope="col">Variable</th><th scope="col">What it's for</th><th scope="col"
                    >Default</th
                  ></tr
                >
              </thead>
              <tbody>
                {#each env as variable (variable.name)}
                  <tr>
                    <td><code>{variable.name}</code></td>
                    <td data-label="What it's for">
                      <strong>{variable.label}</strong>
                      {#if variable.description}<span>{variable.description}</span>{/if}
                      {#if variable.select}
                        <span
                          >One of {variable.select.map((option) => option.value).join(', ')}.</span
                        >
                      {/if}
                    </td>
                    <td data-label="Default">
                      {#if data.required.includes(variable.name)}
                        <em>Needs filling in</em>
                      {:else if envDefault(variable)}
                        <code>{envDefault(variable)}</code>
                      {:else}
                        <em>Blank is fine</em>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/if}

      {#if app.kind === 'stack'}
        <section>
          <h2>Services</h2>
          <p>The containers this stack runs, with ports as they come out of the box.</p>
          <div class="table">
            <table>
              <thead>
                <tr
                  ><th scope="col">Service</th><th scope="col">Image</th><th scope="col">Ports</th
                  ></tr
                >
              </thead>
              <tbody>
                {#each data.services as service (service.name)}
                  <tr>
                    <td><code>{service.name}</code></td>
                    <td data-label="Image"><code>{service.image}</code></td>
                    <td data-label="Ports">
                      {#each service.ports as mapping (mapping)}
                        <code>{withDefaults(mapping)}</code>
                      {:else}
                        <em>Internal only</em>
                      {/each}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {:else}
        <section>
          <h2>Ports and storage</h2>
          <p>
            Change the left side of a port if it clashes with something else on your server. The
            volumes are where the data lives, so keep them when you update.
          </p>
          <div class="table">
            <table>
              <thead>
                <tr><th scope="col">On your server</th><th scope="col">In the container</th></tr>
              </thead>
              <tbody>
                {#each template.ports ?? [] as mapping (mapping)}
                  <tr>
                    <td><code>{hostPort(mapping)}</code></td>
                    <td data-label="In the container"><code>{mapping.split(':').at(-1)}</code></td>
                  </tr>
                {/each}
                {#each volumes as volume, i (volume.container)}
                  <tr>
                    <td><code>{volumeNames(app.slug, volumes)[i]}</code></td>
                    <td data-label="In the container">
                      <code>{volume.container}</code>
                      {#if volume.readonly}<em>read only</em>{/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/if}
    </div>

    <aside aria-labelledby="facts">
      <h2 id="facts">At a glance</h2>
      <dl>
        <div>
          <dt>Type</dt>
          <dd>
            {app.kind === 'stack' ? `Stack of ${data.services.length}` : 'Single container'}
          </dd>
        </div>
        <div>
          <dt>{images.length > 1 ? 'Images' : 'Image'}</dt>
          {#each images as image (image)}
            <dd><code>{image}</code></dd>
          {/each}
        </div>
        {#if data.port}
          <div>
            <dt>Opens on</dt>
            <dd><code>http://&lt;your-server&gt;:{data.port}</code></dd>
          </div>
        {/if}
        {#if volumes.length}
          <div>
            <dt>Data</dt>
            <dd>{volumes.length} {volumes.length === 1 ? 'volume' : 'volumes'}</dd>
          </div>
        {/if}
        <div>
          <dt>In the main list</dt>
          <dd>{app.inMainList ? 'Yes' : 'Not yet'}</dd>
        </div>
      </dl>
      <ul>
        <li><a class="arrow-link" href={app.source}>Source code <Icon name="arrow" /></a></li>
        <li><a class="arrow-link" href={files}>Template on GitHub <Icon name="arrow" /></a></li>
        <li>
          <a class="arrow-link" href={report}>Report a problem <Icon name="arrow" /></a>
        </li>
      </ul>
    </aside>
  </div>
</div>

{#if data.related.length}
  <section class="band">
    <div class="frame section">
      <div class="section-head">
        <h2>More apps</h2>
      </div>
      <ul class="related">
        {#each data.related as other (other.slug)}
          <li><AppCard app={other} /></li>
        {/each}
      </ul>
    </div>
  </section>
{/if}

<style>
  .head {
    border-top: 0;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: var(--space-2xl);
    align-items: start;
    padding-block: var(--space-xl) var(--space-2xl);

    @media (max-width: 60rem) {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-xl);
    }
  }

  .intro {
    display: grid;
    gap: var(--space-l);
  }

  .install {
    display: grid;
    gap: var(--space-s);
    padding-top: var(--space-xl);

    & h2 {
      font-size: var(--text-2xl);
      font-weight: 700;
    }

    & > p {
      color: var(--text-muted);
      font-size: var(--text-s);
    }

    @media (max-width: 60rem) {
      padding-top: 0;
    }
  }

  .crumbs ol {
    display: flex;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    color: var(--text-faint);
    font-size: var(--text-s);
    list-style: none;

    & li + li::before {
      content: '/';
      margin-right: var(--space-xs);
    }

    & a {
      color: var(--text-muted);
      text-decoration: none;

      &:hover {
        color: var(--text);
      }
    }
  }

  header {
    display: flex;
    align-items: center;
    gap: var(--space-l);
  }

  .title {
    flex: 1;
    display: grid;
    gap: var(--space-xs);
    container-type: inline-size;
  }

  h1 {
    font-size: min(var(--text-hero), 12cqi);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-s);
    color: var(--text-faint);
    font-size: var(--text-s);
  }

  .lead {
    max-width: 44rem;
    color: var(--text-muted);
    font-size: var(--text-l);
    line-height: 1.75;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s);
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 18rem;
    gap: var(--space-2xl);
    padding-block: var(--space-2xl) var(--space-3xl);

    @media (max-width: 60rem) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .main {
    display: grid;
    gap: var(--space-2xl);
    min-width: 0;

    & section {
      display: grid;
      gap: var(--space-m);
      align-content: start;
    }

    & h2 {
      font-size: var(--text-2xl);
      font-weight: 700;
    }

    & section > p {
      max-width: 44rem;
      color: var(--text-muted);
    }
  }

  .main section > .note {
    max-width: none;
    padding: var(--space-l);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-m);
    background: var(--surface);
    line-height: 1.75;

    & :global(b) {
      color: var(--text);
    }
  }

  .table {
    overflow-x: auto;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-m);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-s);
  }

  th {
    padding: var(--space-s) var(--space-m);
    border-bottom: 1px solid var(--line);
    background: var(--surface);
    color: var(--text-faint);
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
  }

  td {
    padding: var(--space-m);
    border-bottom: 1px solid var(--line-soft);
    color: var(--text-muted);
    vertical-align: top;

    & strong {
      display: block;
      color: var(--text);
      font-weight: 600;
    }

    & code {
      display: inline-block;
      margin-block: 0.1em;
      overflow-wrap: normal;
      white-space: nowrap;
    }

    & em {
      color: var(--text-faint);
      white-space: nowrap;
    }
  }

  tr:last-child td {
    border-bottom: 0;
  }

  @media (max-width: 40rem) {
    table,
    tbody {
      display: block;
    }

    thead {
      display: none;
    }

    tr {
      display: grid;
      gap: var(--space-xs);
      padding: var(--space-m);
      border-bottom: 1px solid var(--line-soft);

      &:last-child {
        border-bottom: 0;
      }
    }

    td {
      padding: 0;
      border: 0;

      &[data-label]::before {
        content: attr(data-label);
        display: block;
        color: var(--text-faint);
        font-size: var(--text-xs);
      }

      & code {
        white-space: normal;
        overflow-wrap: anywhere;
      }
    }
  }

  aside {
    position: sticky;
    top: var(--space-l);
    display: grid;
    gap: var(--space-l);
    align-self: start;
    padding: var(--space-l);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-l);
    background: var(--surface);

    & h2 {
      font-size: var(--text-l);
      font-weight: 600;

      &::after {
        content: '';
        display: block;
        width: 2.5rem;
        height: 1px;
        margin-top: var(--space-s);
        background: var(--accent);
      }
    }

    & dl {
      display: grid;
      gap: var(--space-m);
      margin: 0;
    }

    & dt {
      color: var(--text-faint);
      font-size: var(--text-xs);
    }

    & dd {
      margin: 0;
      font-size: var(--text-s);
      overflow-wrap: anywhere;
    }

    & ul {
      display: grid;
      gap: var(--space-xs);
      margin: 0;
      padding: var(--space-m) 0 0;
      border-top: 1px solid var(--line-soft);
      list-style: none;
    }

    @media (max-width: 60rem) {
      position: static;
    }
  }

  .related {
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
</style>
