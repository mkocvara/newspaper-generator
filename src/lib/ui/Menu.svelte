<script lang="ts" module>
  export type MenuEntry = { label: string; action: () => void } | 'separator'
</script>

<script lang="ts">
  // A small button that opens a list of actions. Editing UI only.
  let { items, label, icon = '⋯' }: { items: MenuEntry[]; label: string; icon?: string } = $props()

  let open = $state(false)
  let flipUp = $state(false)
  let root = $state<HTMLElement>()
  let popover = $state<HTMLElement>()

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

  // Open upwards when there's no room below.
  $effect(() => {
    if (popover) flipUp = popover.getBoundingClientRect().bottom > window.innerHeight
  })

  function toggle() {
    flipUp = false
    open = !open
  }
</script>

<div class="menu ui-only" class:open bind:this={root}>
  <button class="trigger" type="button" title={label} aria-label={label} aria-expanded={open} onclick={toggle}>
    {icon}
  </button>
  {#if open}
    <div class="popover" class:up={flipUp} role="menu" bind:this={popover}>
      {#each items as item, i (i)}
        {#if item === 'separator'}
          <hr />
        {:else}
          <button
            type="button"
            role="menuitem"
            onclick={() => {
              open = false
              item.action()
            }}>{item.label}</button
          >
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .menu {
    position: relative;
    font: 13px/1.3 system-ui, sans-serif;
  }

  .trigger {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 1px solid rgb(0 0 0 / 0.2);
    border-radius: 4px;
    background: rgb(255 255 255 / 0.9);
    color: #333;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
  }

  .trigger:hover,
  .open .trigger {
    background: #fff;
    border-color: rgb(70 120 200 / 0.6);
  }

  .popover {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 20;
    min-width: 180px;
    padding: 4px;
    border: 1px solid rgb(0 0 0 / 0.15);
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
  }

  .popover.up {
    top: auto;
    bottom: calc(100% + 4px);
  }

  .popover button {
    display: block;
    width: 100%;
    padding: 5px 8px;
    border: none;
    border-radius: 4px;
    background: none;
    color: #222;
    font: inherit;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }

  .popover button:hover {
    background: rgb(70 120 200 / 0.12);
  }

  hr {
    margin: 4px 0;
    border: none;
    border-top: 1px solid rgb(0 0 0 / 0.1);
  }
</style>
