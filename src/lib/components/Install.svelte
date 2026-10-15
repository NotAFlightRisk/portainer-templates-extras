<script lang="ts">
  import { highlight, inline } from '#lib/highlight.js';
  import Icon from './Icon.svelte';
  import type { Tab } from '#lib/types.js';

  let { tabs, name, id }: { tabs: Tab[]; name: string; id: string } = $props();

  let active = $state(0);
  let copied = $state('');
  let buttons: HTMLButtonElement[] = $state([]);
  let blocks: HTMLPreElement[] = $state([]);

  async function copy(tab: Tab, pre: HTMLPreElement) {
    try {
      await navigator.clipboard.writeText(tab.code);
      copied = tab.id;
      setTimeout(() => copied === tab.id && (copied = ''), 2000);
    } catch {
      getSelection()?.selectAllChildren(pre);
    }
  }

  const moves: Record<string, (i: number) => number> = {
    ArrowRight: (i) => (i + 1) % tabs.length,
    ArrowLeft: (i) => (i - 1 + tabs.length) % tabs.length,
    Home: () => 0,
    End: () => tabs.length - 1
  };

  function onkeydown(event: KeyboardEvent) {
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    active = move(active);
    buttons[active].focus();
  }
</script>

<div class="panel">
  <div class="strip">
    <div class="tabs" role="tablist" aria-label="Ways to install {name}" tabindex="-1" {onkeydown}>
      {#each tabs as tab, i (tab.id)}
        <button
          bind:this={buttons[i]}
          role="tab"
          id="{id}-{tab.id}-tab"
          aria-selected={i === active}
          aria-controls="{id}-{tab.id}"
          tabindex={i === active ? 0 : -1}
          onclick={() => (active = i)}>{tab.label}</button
        >
      {/each}
    </div>
    <span class="name" aria-hidden="true">{name}</span>
  </div>

  {#each tabs as tab, i (tab.id)}
    <div
      class="body"
      role="tabpanel"
      id="{id}-{tab.id}"
      aria-labelledby="{id}-{tab.id}-tab"
      hidden={i !== active}
    >
      <p class="intro">{@html inline(tab.intro)}</p>
      <div class="code">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <pre bind:this={blocks[i]} class:wrap={tab.lang === 'text'} tabindex="0"><code
            >{@html highlight(tab.code, tab.lang)}</code
          ></pre>
        <button class="copy" onclick={() => copy(tab, blocks[i])}>
          <Icon name={copied === tab.id ? 'check' : 'copy'} />
          <span>{copied === tab.id ? 'Copied' : 'Copy'}</span>
          <span class="visually-hidden">{tab.label}</span>
        </button>
      </div>
      {#if tab.note}
        <p class="note">{@html inline(tab.note)}</p>
      {/if}
      {#if tab.steps}
        <ol>
          {#each tab.steps as step (step)}
            <li>{@html inline(step)}</li>
          {/each}
        </ol>
      {/if}
    </div>
  {/each}
  <p class="visually-hidden" aria-live="polite">{copied && 'Copied to the clipboard'}</p>
</div>

<style>
  .panel {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--surface);
  }

  .strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-m);
    padding-right: var(--space-m);
    border-bottom: 1px solid var(--line);
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    min-width: 0;

    & button {
      flex: none;
      padding: var(--space-s) var(--space-m);
      border: 0;
      border-bottom: 1px solid transparent;
      margin-bottom: -1px;
      background: none;
      color: var(--text-faint);
      font: 500 0.8125rem / 1.5 var(--font-mono);
      cursor: pointer;
      transition: color 0.2s var(--ease-out);

      &:hover {
        color: var(--text);
      }

      &[aria-selected='true'] {
        border-bottom-color: var(--accent);
        color: var(--text);
      }

      &:focus-visible {
        outline-offset: -2px;
      }
    }
  }

  .name {
    flex: none;
    color: var(--text-faint);
    font: 500 0.6875rem / 1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;

    @media (max-width: 30rem) {
      display: none;
    }
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-m);
    padding: var(--space-l);

    &[hidden] {
      display: none;
    }
  }

  .intro,
  .note {
    color: var(--text-muted);
    font-size: var(--text-s);
  }

  .code {
    display: flex;
    align-items: start;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-s);
    background: var(--canvas);
  }

  pre {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: var(--space-m);
    max-height: 26rem;
    overflow: auto;
    color: rgb(255 255 255 / 0.9);
    font-size: 0.8125rem;
    line-height: 1.85;
    tab-size: 2;
    scrollbar-width: thin;

    &.wrap {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    & :global(.key) {
      color: var(--accent);
    }

    & :global(.var) {
      color: var(--stack);
    }

    & :global(.flag) {
      color: var(--syntax-flag);
    }

    & :global(.comment) {
      color: var(--text-faint);
    }
  }

  .copy {
    flex: none;
    display: inline-flex;
    margin: var(--space-s) var(--space-s) 0 0;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-2xs) var(--space-s);
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: var(--accent-ink);
    font: 600 var(--text-xs) / 1.5 var(--font-sans);
    cursor: pointer;
    transition: background-color 0.2s var(--ease-out);

    &:hover {
      background: var(--accent-hover);
    }

    & :global(svg) {
      width: 0.85rem;
      height: 0.85rem;
    }
  }

  ol {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding-left: var(--space-l);
    color: var(--text-muted);
    font-size: var(--text-s);

    & li::marker {
      color: var(--accent);
      font-family: var(--font-mono);
    }
  }
</style>
