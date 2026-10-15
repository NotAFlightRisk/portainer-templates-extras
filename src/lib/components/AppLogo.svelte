<script lang="ts">
  let {
    src,
    title,
    size = 44,
    eager = false
  }: { src: string; title: string; size?: number; eager?: boolean } = $props();

  let broken = $state(false);
</script>

<span class="tile" style:--size="{size}px">
  {#if broken}
    <span aria-hidden="true">{title[0]}</span>
  {:else}
    <img
      {src}
      alt=""
      width={size}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerpolicy="no-referrer"
      onerror={() => (broken = true)}
    />
  {/if}
</span>

<style>
  .tile {
    display: grid;
    flex: none;
    place-items: center;
    width: calc(var(--size) + 2 * var(--space-xs));
    aspect-ratio: 1;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-m);
    background: var(--surface-raised);
    color: var(--accent);
    font-weight: 700;
    font-size: calc(var(--size) * 0.5);

    & img {
      width: var(--size);
      height: var(--size);
      object-fit: contain;
    }
  }
</style>
