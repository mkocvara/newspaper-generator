<script lang="ts">
  import type { Grid } from '../model/types'
  import CellNodeView from './CellNodeView.svelte'

  let { grid }: { grid: Grid } = $props()
</script>

<div
  class="grid"
  style:grid-template-columns={grid.cols.map((w) => `${w}fr`).join(' ')}
  style:grid-template-rows={grid.rows.map((w) => `${w}fr`).join(' ')}
>
  {#each grid.cells as cell (cell.id)}
    <!-- Each internal edge is drawn once, by the cell to its left or above. -->
    <div
      class="cell"
      class:border-right={cell.col + cell.colSpan < grid.cols.length}
      class:border-bottom={cell.row + cell.rowSpan < grid.rows.length}
      style:grid-column="{cell.col + 1} / span {cell.colSpan}"
      style:grid-row="{cell.row + 1} / span {cell.rowSpan}"
    >
      <CellNodeView node={cell.node} />
    </div>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    height: 100%;
  }

  .cell {
    min-width: 0;
    min-height: 0;
  }

  .border-right {
    border-right: var(--border-width) solid var(--border-color);
  }

  .border-bottom {
    border-bottom: var(--border-width) solid var(--border-color);
  }
</style>
