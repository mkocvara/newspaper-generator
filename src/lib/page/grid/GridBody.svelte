<script lang="ts">
  import { insertColumn, insertRow, removeColumn, removeRow } from '../../model/grid'
  import { editor } from '../../state/editor.svelte'
  import Menu, { type MenuEntry } from '../../ui/Menu.svelte'
  import { MM_PX } from '../units'
  import GridCellView from './GridCellView.svelte'

  const grid = $derived(editor.page.grid)

  // Layout size of the grid in mm, for converting drags into track sizes.
  let widthPx = $state(0)
  let heightPx = $state(0)
  const size = $derived({ width: widthPx / MM_PX, height: heightPx / MM_PX })

  // Each track's start and size as a percentage of the grid.
  function spans(tracks: number[]) {
    const total = tracks.reduce((a, b) => a + b, 0)
    let start = 0
    return tracks.map((t) => {
      const span = { start: (start / total) * 100, size: (t / total) * 100 }
      start += t
      return span
    })
  }

  const trackMenu = (axis: 'column' | 'row', index: number): MenuEntry[] => {
    const [insert, remove, count] =
      axis === 'column' ? [insertColumn, removeColumn, grid.cols.length] : [insertRow, removeRow, grid.rows.length]
    const [before, after] = axis === 'column' ? ['left', 'right'] : ['above', 'below']
    const items: MenuEntry[] = [
      { label: `Insert ${axis} ${before}`, action: () => editor.updateGrid((g) => insert(g, index)) },
      { label: `Insert ${axis} ${after}`, action: () => editor.updateGrid((g) => insert(g, index + 1)) },
    ]
    if (count > 1) items.push('separator', { label: `Delete ${axis}`, action: () => editor.updateGrid((g) => remove(g, index)) })
    return items
  }
</script>

<div class="grid-wrap">
  <div
    class="grid"
    bind:clientWidth={widthPx}
    bind:clientHeight={heightPx}
    style:grid-template-columns={grid.cols.map((w) => `${w}fr`).join(' ')}
    style:grid-template-rows={grid.rows.map((w) => `${w}fr`).join(' ')}
  >
    {#each grid.cells as cell (cell.id)}
      <GridCellView {cell} {grid} {size} />
    {/each}
  </div>

  <!-- Spreadsheet-style tabs for adding and removing columns and rows. -->
  {#each spans(grid.cols) as span, i (i)}
    <div class="tab col-tab ui-only" style:left="{span.start}%" style:width="{span.size}%">
      <Menu label="Column {i + 1}" icon="▾" items={trackMenu('column', i)} />
    </div>
  {/each}
  {#each spans(grid.rows) as span, i (i)}
    <div class="tab row-tab ui-only" style:top="{span.start}%" style:height="{span.size}%">
      <Menu label="Row {i + 1}" icon="▸" items={trackMenu('row', i)} />
    </div>
  {/each}
</div>

<style>
  .grid-wrap {
    position: relative;
    height: 100%;
  }

  .grid {
    display: grid;
    height: 100%;
  }

  .tab {
    position: absolute;
    /* Above the header's resize strip, which these overlap. */
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  .tab > :global(*) {
    pointer-events: auto;
  }

  .col-tab {
    top: -24px;
    height: 22px;
  }

  .row-tab {
    left: -26px;
    width: 22px;
  }

  .grid-wrap:hover .tab,
  .tab:has(:global(.open)) {
    opacity: 1;
  }
</style>
