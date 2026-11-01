<script lang="ts">
  import { canMove, equalizeTracks, moveCell, resizeTracks } from '../../model/grid'
  import type { Grid, GridCell } from '../../model/types'
  import { editor } from '../../state/editor.svelte'
  import ResizeHandle from '../../ui/ResizeHandle.svelte'
  import CellNodeView from './CellNodeView.svelte'
  import { drag } from './dragMove.svelte'

  // Columns and rows can't be dragged narrower than this.
  const MIN_TRACK_MM = 10

  let { cell, grid, size }: { cell: GridCell; grid: Grid; size: { width: number; height: number } } = $props()

  const right = $derived(cell.col + cell.colSpan < grid.cols.length)
  const bottom = $derived(cell.row + cell.rowSpan < grid.rows.length)

  // --- Resizing the column/row border on this cell's right or bottom edge.
  let startTracks: number[] = []

  function resizer(axis: 'cols' | 'rows') {
    const border = axis === 'cols' ? cell.col + cell.colSpan : cell.row + cell.rowSpan
    const lengthMm = () => (axis === 'cols' ? size.width : size.height)
    return {
      onstart: () => {
        startTracks = [...grid[axis]]
        editor.beginGesture()
      },
      onmove: (deltaMm: number) => {
        const total = startTracks.reduce((a, b) => a + b, 0)
        const perMm = total / lengthMm()
        editor.page.grid[axis] = resizeTracks(startTracks, border, deltaMm * perMm, MIN_TRACK_MM * perMm)
      },
      onend: () => editor.endGesture(),
      onreset: () =>
        editor.update((p) => {
          p.grid[axis] = equalizeTracks(p.grid[axis], border)
        }),
    }
  }

  // --- Dragging this cell to another place in its column or row.
  const dragging = $derived(drag.fromId !== null)
  const droppable = $derived(dragging && drag.fromId !== cell.id && canMove(grid, drag.fromId!, cell.id))

  function cellUnder(event: PointerEvent): string | null {
    const target = document.elementFromPoint(event.clientX, event.clientY)
    return target?.closest<HTMLElement>('[data-cell-id]')?.dataset.cellId ?? null
  }

  function onpointerdown(event: PointerEvent) {
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    drag.fromId = cell.id
    drag.overId = cell.id
  }

  function onpointermove(event: PointerEvent) {
    if (drag.fromId === cell.id) drag.overId = cellUnder(event)
  }

  function onpointerup() {
    if (drag.fromId !== cell.id) return
    const { fromId, overId } = drag
    drag.fromId = drag.overId = null
    if (overId && overId !== fromId) editor.updateGrid((g) => moveCell(g, fromId, overId))
  }
</script>

<!-- Each internal border is drawn once, by the cell to its left or above. -->
<div
  class="cell"
  data-cell-id={cell.id}
  class:border-right={right}
  class:border-bottom={bottom}
  class:drag-source={drag.fromId === cell.id}
  class:droppable
  class:drop-here={droppable && drag.overId === cell.id}
  style:grid-column="{cell.col + 1} / span {cell.colSpan}"
  style:grid-row="{cell.row + 1} / span {cell.rowSpan}"
>
  <CellNodeView node={cell.node} {cell} />

  <button
    class="grip ui-only"
    type="button"
    title="Drag to move this cell along its column or row"
    aria-label="Move cell"
    {onpointerdown}
    {onpointermove}
    {onpointerup}
    onpointercancel={() => (drag.fromId = drag.overId = null)}>⠿</button
  >

  {#if right}
    <ResizeHandle edge="right" {...resizer('cols')} />
  {/if}
  {#if bottom}
    <ResizeHandle edge="bottom" {...resizer('rows')} />
  {/if}
</div>

<style>
  .cell {
    position: relative;
    min-width: 0;
    min-height: 0;
  }

  .border-right {
    border-right: var(--border-width) solid var(--ink);
  }

  .border-bottom {
    border-bottom: var(--border-width) solid var(--ink);
  }

  .grip {
    position: absolute;
    top: 3px;
    left: 3px;
    z-index: 3;
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
    cursor: grab;
    touch-action: none;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .cell:hover > .grip,
  .drag-source > .grip {
    opacity: 1;
  }

  .drag-source {
    opacity: 0.45;
  }

  .drag-source > .grip {
    cursor: grabbing;
  }

  .droppable {
    outline: 2px dashed rgb(70 120 200 / 0.5);
    outline-offset: -4px;
  }

  .drop-here {
    background: rgb(70 120 200 / 0.12);
  }
</style>
