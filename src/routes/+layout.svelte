<script lang="ts">
  import '@fontsource-variable/inter';
  import '@fontsource-variable/geist-mono';
  import '../app.css';
  import { onMount } from 'svelte';
  import Footer from '#lib/components/Footer.svelte';
  import Header from '#lib/components/Header.svelte';
  import { loadPlausible } from '#lib/plausible.js';

  let { children } = $props();

  onMount(() => loadPlausible());
</script>

<a class="skip pill primary" href="#content">Skip to content</a>
<Header />
<main id="content">
  {@render children()}
</main>
<Footer />

<style>
  .skip {
    position: absolute;
    top: var(--space-s);
    left: var(--space-s);
    z-index: 10;
    translate: 0 -200%;

    &:focus {
      translate: 0;
    }
  }
</style>
