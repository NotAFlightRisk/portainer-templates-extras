<script lang="ts">
  import { page } from '$app/state';
  import { site } from '#lib/site.js';

  let {
    title,
    description,
    graph = []
  }: { title: string; description: string; graph?: object[] } = $props();

  const url = $derived(site.url + page.url.pathname);
  const jsonLd = $derived(
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content="{site.url}/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="{site.name}, one-click templates for self-hosted apps" />
  <meta name="twitter:card" content="summary_large_image" />
  {#if graph.length}
    {@html `<script type="application/ld+json">${jsonLd}</` + 'script>'}
  {/if}
</svelte:head>
