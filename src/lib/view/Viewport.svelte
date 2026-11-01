<script lang="ts">
  import type { Snippet } from 'svelte'
  import { i18n } from '../i18n/i18n.svelte'

  // The area the page sits in, with its own zoom and pan, so zooming never
  // affects the toolbar. The page is scaled with a transform: its layout (and
  // so text fitting and exports) is unchanged. The wheel zooms towards the
  // pointer, dragging with the middle mouse button pans, and floating bars on
  // the left and bottom show and drag the visible part. The corner box shows
  // the zoom level; clicking it returns to 100%.
  let { top = 0, children }: { top?: number; children: Snippet } = $props()

  const MIN_ZOOM = 0.25
  const MAX_ZOOM = 4
  // Space around the page when fitting it to the window, in px.
  const MARGIN = 32
  // Panning stops once only this share of the window (or the whole page, if
  // smaller) still shows the page, so its edge never leaves the view.
  const KEEP_VISIBLE = 0.25

  let viewport = $state<HTMLElement>()
  let stage = $state<HTMLElement>()
  let view = $state({ width: 0, height: 0 })
  let page = $state({ width: 0, height: 0 })
  let zoom = $state(1)
  let x = $state(0)
  let y = $state(0)
  let fitted = false

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

  // The range the page's position can take on one axis.
  function limits(pageSize: number, viewSize: number) {
    const scaled = pageSize * zoom
    const keep = Math.min(scaled, viewSize * KEEP_VISIBLE)
    return { min: keep - scaled, max: viewSize - keep }
  }

  function clampAxis(pos: number, pageSize: number, viewSize: number) {
    const { min, max } = limits(pageSize, viewSize)
    return Math.min(max, Math.max(min, pos))
  }

  function clamp() {
    x = clampAxis(x, page.width, view.width)
    y = clampAxis(y, page.height, view.height)
  }

  // Zoom to `next`, keeping the page point under (px, py) in place.
  function zoomAt(next: number, px: number, py: number) {
    next = clampZoom(next)
    x = px - ((px - x) * next) / zoom
    y = py - ((py - y) * next) / zoom
    zoom = next
    clamp()
  }

  function fit() {
    zoom = clampZoom(
      Math.min((view.width - 2 * MARGIN) / page.width, (view.height - 2 * MARGIN) / page.height),
    )
    x = (view.width - page.width * zoom) / 2
    y = (view.height - page.height * zoom) / 2
    clamp()
  }

  const resetZoom = () => zoomAt(1, view.width / 2, view.height / 2)

  // Track the viewport's size and the page's unscaled size (a transform
  // doesn't change offset sizes); fit the page once both are known.
  $effect(() => {
    if (!viewport || !stage) return
    const observer = new ResizeObserver(() => {
      view = { width: viewport!.clientWidth, height: viewport!.clientHeight }
      page = { width: stage!.offsetWidth, height: stage!.offsetHeight }
      if (!view.width || !page.width) return
      if (!fitted) {
        fitted = true
        fit()
      } else clamp()
    })
    observer.observe(viewport)
    observer.observe(stage)
    return () => observer.disconnect()
  })

  // The wheel zooms (Ctrl+wheel is left to the browser's own zoom). Listened
  // to directly so the default scroll can be prevented.
  $effect(() => {
    if (!viewport) return
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.deltaY) return
      event.preventDefault()
      const lines = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1
      const rect = viewport!.getBoundingClientRect()
      zoomAt(zoom * Math.exp(-event.deltaY * lines * 0.0015), event.clientX - rect.left, event.clientY - rect.top)
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport!.removeEventListener('wheel', onWheel)
  })

  // Middle-button drag pans, anywhere over the page or around it.
  function onPointerDown(event: PointerEvent) {
    if (event.button !== 1) return
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture(event.pointerId)
    let lastX = event.clientX
    let lastY = event.clientY
    const onMove = (move: PointerEvent) => {
      x += move.clientX - lastX
      y += move.clientY - lastY
      lastX = move.clientX
      lastY = move.clientY
      clamp()
    }
    const onUp = () => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  // --- Floating bars. The track stands for every view the panning allows;
  // the thumb is the current view within it.
  function axis(pos: number, pageSize: number, viewSize: number) {
    const { min, max } = limits(pageSize, viewSize)
    const content = max - min + viewSize
    if (!pageSize || !content) return { size: 1, offset: 0, content: viewSize, max }
    return { size: viewSize / content, offset: (max - pos) / content, content, max }
  }
  const horizontal = $derived(axis(x, page.width, view.width))
  const vertical = $derived(axis(y, page.height, view.height))

  // With a bar focused, the arrow keys pan.
  const KEY_STEP = 40
  function onTrackKey(event: KeyboardEvent, along: 'x' | 'y') {
    const step = { ArrowLeft: KEY_STEP, ArrowUp: KEY_STEP, ArrowRight: -KEY_STEP, ArrowDown: -KEY_STEP }[event.key]
    if (step === undefined) return
    event.preventDefault()
    if (along === 'x') x += step
    else y += step
    clamp()
  }

  // Drag a thumb, or press the track to centre the thumb there and keep dragging.
  function onTrackDown(event: PointerEvent, along: 'x' | 'y') {
    if (event.button !== 0) return
    event.preventDefault()
    const track = event.currentTarget as HTMLElement
    const rect = track.getBoundingClientRect()
    const length = along === 'x' ? rect.width : rect.height
    const info = along === 'x' ? horizontal : vertical
    const toPan = info.content / length
    const point = (e: PointerEvent) => (along === 'x' ? e.clientX - rect.left : e.clientY - rect.top)

    if (!(event.target as HTMLElement).classList.contains('thumb')) {
      // Centre the thumb on the pressed point.
      const offset = point(event) / length - info.size / 2
      if (along === 'x') x = info.max - offset * info.content
      else y = info.max - offset * info.content
      clamp()
    }

    track.setPointerCapture(event.pointerId)
    let last = point(event)
    const onMove = (move: PointerEvent) => {
      const now = point(move)
      if (along === 'x') x -= (now - last) * toPan
      else y -= (now - last) * toPan
      last = now
      clamp()
    }
    const onUp = () => {
      track.removeEventListener('pointermove', onMove)
      track.removeEventListener('pointerup', onUp)
      track.removeEventListener('pointercancel', onUp)
    }
    track.addEventListener('pointermove', onMove)
    track.addEventListener('pointerup', onUp)
    track.addEventListener('pointercancel', onUp)
  }
</script>

<!-- Middle-click would otherwise paste on Linux or start autoscroll. -->
<div
  class="viewport"
  style:top="{top}px"
  bind:this={viewport}
  onpointerdown={onPointerDown}
  onauxclick={(e) => e.button === 1 && e.preventDefault()}
  onmousedown={(e) => e.button === 1 && e.preventDefault()}
  role="presentation"
>
  <div class="stage" bind:this={stage} style:transform="translate({x}px, {y}px) scale({zoom})">
    {@render children()}
  </div>

  <div class="bars ui-only">
    <div
      class="track vertical"
      role="scrollbar"
      aria-label={i18n.t.view.panVertical}
      aria-orientation="vertical"
      aria-controls="newspaper-page"
      aria-valuenow={Math.round(vertical.offset * 100)}
      tabindex="0"
      onpointerdown={(e) => onTrackDown(e, 'y')}
      onkeydown={(e) => onTrackKey(e, 'y')}
    >
      <div class="thumb" style:top="{vertical.offset * 100}%" style:height="{vertical.size * 100}%"></div>
    </div>
    <div
      class="track horizontal"
      role="scrollbar"
      aria-label={i18n.t.view.panHorizontal}
      aria-orientation="horizontal"
      aria-controls="newspaper-page"
      aria-valuenow={Math.round(horizontal.offset * 100)}
      tabindex="0"
      onpointerdown={(e) => onTrackDown(e, 'x')}
      onkeydown={(e) => onTrackKey(e, 'x')}
    >
      <div class="thumb" style:left="{horizontal.offset * 100}%" style:width="{horizontal.size * 100}%"></div>
    </div>
    <button type="button" class="zoom-level" title={i18n.t.view.zoomTitle} onclick={resetZoom}>
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8" />
        <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      {i18n.t.percent(Math.round(zoom * 100))}
    </button>
  </div>
</div>

<style>
  .viewport {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  .stage {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
  }

  /* Floating bars: the zoom box sits in the bottom-left corner, the vertical
     bar above it and the horizontal bar to its right. */
  .bars {
    --inset: 8px;
    /* Space at each end of a bar: by the zoom box and at the far end. */
    --gap: 18px;
    --end: 48px;
    --box-w: 68px;
    --box-h: 26px;
    --bar: 10px;
    font: 12px/1 system-ui, sans-serif;
  }

  .track {
    position: absolute;
    z-index: 50;
    border-radius: 999px;
    background: rgb(20 18 15 / 0.55);
    box-shadow: 0 1px 6px rgb(0 0 0 / 0.3);
    cursor: pointer;
    touch-action: none;
  }

  .track.vertical {
    left: calc(var(--inset) + (var(--box-w) - var(--bar)) / 2);
    top: var(--end);
    bottom: calc(var(--inset) + var(--box-h) + var(--gap));
    width: var(--bar);
  }

  .track.horizontal {
    left: calc(var(--inset) + var(--box-w) + var(--gap));
    right: var(--end);
    bottom: calc(var(--inset) + (var(--box-h) - var(--bar)) / 2);
    height: var(--bar);
  }

  .thumb {
    position: absolute;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.55);
    cursor: grab;
  }

  .thumb:hover {
    background: rgb(255 255 255 / 0.8);
  }

  .vertical .thumb {
    left: 2px;
    right: 2px;
  }

  .horizontal .thumb {
    top: 2px;
    bottom: 2px;
  }

  .zoom-level {
    position: absolute;
    z-index: 50;
    left: var(--inset);
    bottom: var(--inset);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: var(--box-w);
    height: var(--box-h);
    padding: 0;
    border: 1px solid rgb(255 255 255 / 0.2);
    border-radius: 6px;
    background: rgb(20 18 15 / 0.8);
    color: #eee;
    font: inherit;
    font-variant-numeric: tabular-nums;
    box-shadow: 0 1px 6px rgb(0 0 0 / 0.3);
    cursor: pointer;
  }

  .zoom-level:hover {
    background: rgb(40 37 32 / 0.95);
  }
</style>
