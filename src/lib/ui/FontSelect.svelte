<script lang="ts">
  import { tick } from 'svelte'
  import { fontStack } from '../fonts'

  // A drop-down for picking a font, listing each name in its own font. A native
  // <select> can't do this in Firefox: it draws the open list outside the page,
  // where the page's web fonts aren't available.
  let {
    value,
    options,
    label,
    onchange,
  }: { value: string; options: string[]; label: string; onchange: (family: string) => void } = $props()

  const id = $props.id()
  let open = $state(false)
  let active = $state(0)
  let button = $state<HTMLButtonElement>()
  let list = $state<HTMLElement>()
  // The list is fixed to the viewport so the panel around it doesn't scroll.
  let place = $state({ left: 0, top: 0, width: 0, maxHeight: 0, up: false })

  async function show() {
    if (!button) return
    const rect = button.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - 8
    const above = rect.top - 8
    const up = below < 200 && above > below
    place = {
      left: rect.left,
      top: up ? rect.top - 4 : rect.bottom + 4,
      width: rect.width,
      maxHeight: Math.min(320, up ? above : below),
      up,
    }
    active = Math.max(0, options.indexOf(value))
    open = true
    await tick()
    list?.focus()
    scrollToActive()
  }

  function close(refocus = true) {
    open = false
    if (refocus) button?.focus()
  }

  function choose(index: number) {
    const family = options[index]
    close()
    if (family !== undefined && family !== value) onchange(family)
  }

  // Scroll only the list (scrollIntoView could also scroll whatever the
  // list sits in, which counts as an outside scroll and closes it).
  function scrollToActive() {
    const option = list?.querySelector<HTMLElement>(`#${CSS.escape(`${id}-${active}`)}`)
    if (!list || !option) return
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight
    }
  }

  function move(to: number) {
    active = Math.min(options.length - 1, Math.max(0, to))
    scrollToActive()
  }

  function onButtonKey(event: KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      show()
    }
  }

  function onListKey(event: KeyboardEvent) {
    const page = 8
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active + 1),
      ArrowUp: () => move(active - 1),
      PageDown: () => move(active + page),
      PageUp: () => move(active - page),
      Home: () => move(0),
      End: () => move(options.length - 1),
      Enter: () => choose(active),
      ' ': () => choose(active),
      // Keep Escape from also closing the panel this sits in.
      Escape: () => close(),
    }
    const action = keys[event.key]
    if (action) {
      event.preventDefault()
      event.stopPropagation()
      action()
    } else if (event.key === 'Tab') {
      close(false)
    } else if (event.key.length === 1) {
      // Jump to the next name starting with the typed letter.
      const letter = event.key.toLowerCase()
      const order = [...options.keys()].map((i) => (active + 1 + i) % options.length)
      const match = order.find((i) => options[i].toLowerCase().startsWith(letter))
      if (match !== undefined) move(match)
    }
  }

  $effect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!list?.contains(target) && !button?.contains(target)) close(false)
    }
    // A fixed list would drift away from its button if anything scrolled.
    const onScroll = (event: Event) => {
      if (!list?.contains(event.target as Node)) close(false)
    }
    const onResize = () => close(false)
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  })
</script>

<button
  bind:this={button}
  type="button"
  class="font-select"
  aria-label={label}
  aria-haspopup="listbox"
  aria-expanded={open}
  aria-controls={open ? `${id}-list` : undefined}
  onclick={() => (open ? close() : show())}
  onkeydown={onButtonKey}
>
  <span class="value">{value}</span>
  <span class="arrow" aria-hidden="true">▾</span>
</button>

{#if open}
  <div
    bind:this={list}
    id="{id}-list"
    class="list"
    class:up={place.up}
    role="listbox"
    tabindex="-1"
    aria-label={label}
    aria-activedescendant="{id}-{active}"
    style:left="{place.left}px"
    style:top="{place.top}px"
    style:min-width="{place.width}px"
    style:max-height="{place.maxHeight}px"
    onkeydown={onListKey}
  >
    {#each options as family, i (family)}
      <div
        id="{id}-{i}"
        class="option"
        class:active={i === active}
        class:selected={family === value}
        role="option"
        tabindex="-1"
        aria-selected={family === value}
        style:font-family={fontStack(family)}
        onpointermove={() => (active = i)}
        onclick={() => choose(i)}
        onkeydown={onListKey}
      >
        {family}
      </div>
    {/each}
  </div>
{/if}

<style>
  .font-select {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 190px;
    padding: 3px 6px;
    border: 1px solid rgb(0 0 0 / 0.25);
    border-radius: 4px;
    background: #fff;
    color: #222;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .arrow {
    font-size: 11px;
    opacity: 0.6;
  }

  .list {
    position: fixed;
    z-index: 200;
    box-sizing: border-box;
    overflow-y: auto;
    padding: 4px;
    border: 1px solid rgb(0 0 0 / 0.15);
    border-radius: 6px;
    background: #fff;
    color: #222;
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.25);
    outline: none;
  }

  .list.up {
    transform: translateY(-100%);
  }

  .option {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 16px;
    line-height: 1.3;
    white-space: nowrap;
    cursor: pointer;
  }

  .option.selected {
    box-shadow: inset 3px 0 #2f5ea8;
  }

  .option.active {
    background: rgb(70 120 200 / 0.14);
  }
</style>
