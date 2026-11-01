<script lang="ts">
  // A thin draggable strip along one edge of its positioned parent. Reports
  // the drag distance in page millimetres, so callers don't care how the page
  // is scaled on screen. Double-clicking calls `onreset` (e.g. back to 50/50).
  let {
    edge,
    onstart,
    onmove,
    onend,
    onreset,
  }: {
    edge: 'top' | 'bottom' | 'left' | 'right'
    onstart: () => void
    onmove: (deltaMm: number) => void
    onend: () => void
    onreset?: () => void
  } = $props()

  const PAGE_WIDTH_MM = 210
  const vertical = $derived(edge === 'top' || edge === 'bottom')

  let start = 0
  let pxPerMm = 1

  function onpointerdown(event: PointerEvent) {
    const handle = event.currentTarget as HTMLElement
    const page = handle.closest('.page')
    if (!page) return
    event.preventDefault()
    handle.setPointerCapture(event.pointerId)
    pxPerMm = page.getBoundingClientRect().width / PAGE_WIDTH_MM
    start = vertical ? event.clientY : event.clientX
    onstart()
  }

  function onpointermove(event: PointerEvent) {
    const handle = event.currentTarget as HTMLElement
    if (!handle.hasPointerCapture(event.pointerId)) return
    const now = vertical ? event.clientY : event.clientX
    onmove((now - start) / pxPerMm)
  }

  function onpointerup(event: PointerEvent) {
    const handle = event.currentTarget as HTMLElement
    if (!handle.hasPointerCapture(event.pointerId)) return
    handle.releasePointerCapture(event.pointerId)
    onend()
  }
</script>

<div
  class="handle ui-only {edge}"
  class:vertical
  role="separator"
  aria-orientation={vertical ? 'horizontal' : 'vertical'}
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={onpointerup}
  ondblclick={onreset}
></div>

<style>
  .handle {
    position: absolute;
    z-index: 2;
    touch-action: none;
  }

  .handle.vertical {
    left: 0;
    right: 0;
    height: 8px;
    cursor: row-resize;
  }

  .handle:not(.vertical) {
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
  }

  .top {
    top: -4px;
  }
  .bottom {
    bottom: -4px;
  }
  .left {
    left: -4px;
  }
  .right {
    right: -4px;
  }

  .handle:hover,
  .handle:active {
    background: rgb(70 120 200 / 0.25);
  }

  /* Touchscreens: a finger-sized grab area in the middle of the border, with
     a pill showing it; just that area, not the whole border, so it doesn't
     cover the text beside the border. Sized against the zoom (--ui-scale). */
  @media (hover: none) {
    .handle {
      --size: calc(var(--ui-scale, 1) * 22px);
      --length: calc(var(--ui-scale, 1) * 64px);
      background: none;
    }

    .handle.vertical {
      left: calc(50% - var(--length) / 2);
      right: auto;
      width: var(--length);
    }

    .handle:not(.vertical) {
      top: calc(50% - var(--length) / 2);
      bottom: auto;
      height: var(--length);
    }

    .handle::after {
      content: '';
      position: absolute;
      inset: 50% auto auto 50%;
      translate: -50% -50%;
      border-radius: 999px;
      background: rgb(70 120 200 / 0.55);
    }

    .handle.vertical::after {
      width: calc(var(--ui-scale, 1) * 36px);
      height: calc(var(--ui-scale, 1) * 5px);
    }

    .handle:not(.vertical)::after {
      width: calc(var(--ui-scale, 1) * 5px);
      height: calc(var(--ui-scale, 1) * 36px);
    }

    .handle.vertical {
      height: var(--size);
    }

    .handle:not(.vertical) {
      width: var(--size);
    }

    .top {
      top: calc(var(--size) / -2);
    }
    .bottom {
      bottom: calc(var(--size) / -2);
    }
    .left {
      left: calc(var(--size) / -2);
    }
    .right {
      right: calc(var(--size) / -2);
    }
  }
</style>
