<script lang="ts" module>
  export type MenuEntry = { label: string; action: () => void } | 'separator'
</script>

<script lang="ts">
  import { tick } from 'svelte'
  import type { Attachment } from 'svelte/attachments'

  // A small button that opens a list of actions. Editing UI only.
  //
  // The open list is moved to the end of the document and placed against the
  // window: inside the zoomed page it would otherwise take on the page's zoom,
  // sit under the controls of later cells, and could run off the screen.
  let {
    items,
    label,
    icon = '⋯',
    caret = false,
  }: { items: MenuEntry[]; label: string; icon?: string; caret?: boolean } = $props()

  let open = $state(false)
  let root = $state<HTMLElement>()
  let trigger = $state<HTMLElement>()
  let popover = $state<HTMLElement>()
  let place = $state({ left: 0, top: 0, maxHeight: 0 })

  const EDGE = 8
  const GAP = 4

  const toBody: Attachment<HTMLElement> = (node) => {
    document.body.append(node)
    return () => node.remove()
  }

  // Below the button and right-aligned to it, or above it if there's more room
  // there; always kept within the window.
  async function position() {
    await tick()
    if (!trigger || !popover) return
    const button = trigger.getBoundingClientRect()
    const width = popover.offsetWidth
    const height = popover.scrollHeight
    const below = window.innerHeight - button.bottom - GAP - EDGE
    const above = button.top - GAP - EDGE
    const up = height > below && above > below
    const room = up ? above : below
    const maxHeight = Math.max(room, 120)
    const shown = Math.min(height, maxHeight)
    place = {
      left: Math.min(Math.max(EDGE, button.right - width), window.innerWidth - width - EDGE),
      top: up ? Math.max(EDGE, button.top - GAP - shown) : Math.min(button.bottom + GAP, window.innerHeight - EDGE - shown),
      maxHeight,
    }
  }

  $effect(() => {
    if (!open) return
    position()
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!root?.contains(target) && !popover?.contains(target)) open = false
    }
    const onResize = () => (open = false)
    window.addEventListener('resize', onResize)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') open = false
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  })

  function toggle() {
    open = !open
  }
</script>

<div class="menu ui-only" class:open bind:this={root}>
  <button
    bind:this={trigger}
    class="trigger"
    type="button"
    title={label}
    aria-label={label}
    aria-expanded={open}
    onclick={toggle}
  >
    {icon}{#if caret}<span class="caret">▾</span>{/if}
  </button>
  {#if open}
    <div
      class="popover"
      role="menu"
      bind:this={popover}
      {@attach toBody}
      style:left="{place.left}px"
      style:top="{place.top}px"
      style:max-height="{place.maxHeight}px"
    >
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
    position: fixed;
    z-index: 300;
    box-sizing: border-box;
    min-width: 180px;
    max-width: calc(100vw - 16px);
    overflow-y: auto;
    padding: 4px;
    font: 13px/1.3 system-ui, sans-serif;
    border: 1px solid var(--menu-rule);
    border-radius: 6px;
    background: var(--menu-bg);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
  }

  .popover button {
    display: block;
    width: 100%;
    padding: 5px 8px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--menu-text);
    font: inherit;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }

  .popover button:hover {
    background: var(--menu-hover);
  }

  /* Fingers need bigger items. */
  @media (pointer: coarse) {
    .popover {
      font-size: 15px;
    }

    .popover button {
      padding: 11px 14px;
    }
  }

  hr {
    margin: 4px 0;
    border: none;
    border-top: 1px solid var(--menu-rule);
  }
</style>
