<script lang="ts">
  import type { Snippet } from 'svelte'

  // A toolbar button that drops down a panel of controls.
  let { label, children }: { label: string; children: Snippet } = $props()

  let open = $state(false)
  let root = $state<HTMLElement>()

  $effect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root?.contains(event.target as Node)) open = false
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') open = false
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  })
</script>

<div class="panel-wrap" class:open bind:this={root}>
  <button type="button" class="tb-button" aria-expanded={open} onclick={() => (open = !open)}>
    {label} <span class="caret">▾</span>
  </button>
  {#if open}
    <div class="panel" role="dialog" aria-label={label}>
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .panel-wrap {
    position: relative;
  }

  .caret {
    font-size: 10px;
    opacity: 0.6;
  }

  .panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 110;
    min-width: 260px;
    max-height: calc(100vh - 80px);
    overflow: auto;
    padding: 12px;
    border: 1px solid rgb(0 0 0 / 0.15);
    border-radius: 8px;
    background: #fff;
    color: #222;
    box-shadow: 0 6px 24px rgb(0 0 0 / 0.25);
  }
</style>
