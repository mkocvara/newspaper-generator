<script lang="ts">
  import { i18n } from '../../i18n/i18n.svelte'
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

  // How far the grid sits from the page's top and left edges (layout px). On
  // touchscreens the column and row tabs go just off the page, clear of the
  // header text and page content they would otherwise cover at finger size.
  let wrap = $state<HTMLElement>()
  let gridTop = $state(0)
  let gridLeft = $state(0)
  $effect(() => {
    if (!wrap) return
    const page = wrap.closest('article.page') as HTMLElement | null
    if (!page) return
    const measure = () => {
      const pageRect = page.getBoundingClientRect()
      const zoom = pageRect.width / page.offsetWidth || 1
      const rect = wrap!.getBoundingClientRect()
      gridTop = (rect.top - pageRect.top) / zoom
      gridLeft = (rect.left - pageRect.left) / zoom
    }
    const observer = new ResizeObserver(measure)
    observer.observe(wrap)
    observer.observe(page)
    measure()
    return () => observer.disconnect()
  })

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
    const t = i18n.t.grid
    const [before, after, del] =
      axis === 'column'
        ? [t.insertColumnLeft, t.insertColumnRight, t.deleteColumn]
        : [t.insertRowAbove, t.insertRowBelow, t.deleteRow]
    const items: MenuEntry[] = [
      { label: before, action: () => editor.updateGrid((g) => insert(g, index)) },
      { label: after, action: () => editor.updateGrid((g) => insert(g, index + 1)) },
    ]
    if (count > 1) items.push('separator', { label: del, action: () => editor.updateGrid((g) => remove(g, index)) })
    return items
  }
</script>

<div class="grid-wrap" bind:this={wrap} style:--grid-top="{gridTop}px" style:--grid-left="{gridLeft}px">
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
      <Menu label={i18n.t.grid.column(i + 1)} icon="▾" items={trackMenu('column', i)} />
    </div>
  {/each}
  {#each spans(grid.rows) as span, i (i)}
    <div class="tab row-tab ui-only" style:top="{span.start}%" style:height="{span.size}%">
      <Menu label={i18n.t.grid.row(i + 1)} icon="▸" items={trackMenu('row', i)} />
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

  /* Touchscreens: always shown, finger-sized at any zoom, growing away from
     the grid. */
  @media (hover: none) {
    .tab {
      opacity: 1;
    }

    /* Just above the page's top edge, growing upwards off the page. */
    .col-tab {
      top: calc(-1 * var(--grid-top) - 26px);
      transform: scale(calc(var(--ui-scale, 1) * 1.6));
      transform-origin: bottom center;
    }

    /* Just left of the page's left edge, growing leftwards off the page. */
    .row-tab {
      left: calc(-1 * var(--grid-left) - 26px);
      transform: scale(calc(var(--ui-scale, 1) * 1.6));
      transform-origin: right center;
    }
  }
</style>
