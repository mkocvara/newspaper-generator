<script lang="ts">
  import { i18n } from '../../i18n/i18n.svelte'
  import {
    canMergeLeafToward,
    canMergeLine,
    findNode,
    mergeLeafToward,
    mergeLine,
    setElement,
    splitLeaf,
    type Direction,
  } from '../../model/grid'
  import { createElement, type ElementType } from '../../model/elements'
  import type { CellNode, GridCell } from '../../model/types'
  import ElementView from '../elements/ElementView.svelte'
  import { editor } from '../../state/editor.svelte'
  import Menu, { type MenuEntry } from '../../ui/Menu.svelte'
  import ResizeHandle from '../../ui/ResizeHandle.svelte'
  import { MM_PX } from '../units'
  import CellNodeView from './CellNodeView.svelte'

  // The two halves of a split can't be dragged smaller than this.
  const MIN_PART_MM = 8

  let { node, cell }: { node: CellNode; cell: GridCell } = $props()

  // --- Split: drag the divider between the two halves.
  let widthPx = $state(0)
  let heightPx = $state(0)
  let startSizes: [number, number] = [1, 1]

  function resizeSplit(deltaMm: number) {
    if (node.kind !== 'split') return
    const lengthMm = (node.direction === 'row' ? widthPx : heightPx) / MM_PX
    const total = startSizes[0] + startSizes[1]
    const min = (MIN_PART_MM / lengthMm) * total
    const first = Math.max(min, Math.min(total - min, startSizes[0] + (deltaMm / lengthMm) * total))
    // Write to the live page (not the `node` prop) during the drag gesture.
    const live = findNode(editor.page.grid, node.id)
    if (live?.kind === 'split') live.sizes = [first, total - first]
  }

  // --- Leaf: layout actions menu.
  const MERGES: Direction[] = ['right', 'left', 'up', 'down']

  const menu = $derived.by((): MenuEntry[] => {
    const t = i18n.t.grid
    const grid = editor.page.grid
    const current = node.kind === 'leaf' ? node.element?.type : undefined
    const insert = (type: ElementType) => () => editor.updateGrid((g) => setElement(g, node.id, createElement(type)))
    const elements: MenuEntry[] = (['eyecatcher', 'text', 'image'] as const)
      .filter((type) => type !== current)
      .map((type) => ({ label: (current ? t.changeTo : t.insert)[type], action: insert(type) }))
    if (current) elements.push({ label: t.clearCell, action: () => editor.updateGrid((g) => setElement(g, node.id, null)) })

    const items: MenuEntry[] = [
      ...elements,
      'separator',
      { label: t.splitSideBySide, action: () => editor.updateGrid((g) => splitLeaf(g, node.id, 'row')) },
      { label: t.splitTopBottom, action: () => editor.updateGrid((g) => splitLeaf(g, node.id, 'column')) },
    ]
    // Within a split cell, a direction first means the neighbouring part.
    const merges: MenuEntry[] = MERGES.filter((dir) => canMergeLeafToward(grid, cell.id, node.id, dir)).map((dir) => ({
      label: t.merge[dir],
      action: () => editor.updateGrid((g) => mergeLeafToward(g, cell.id, node.id, dir)),
    }))
    for (const axis of ['column', 'row'] as const) {
      if (canMergeLine(grid, cell.id, axis)) {
        const label = axis === 'column' ? t.mergeColumn : t.mergeRow
        merges.push({ label, action: () => editor.updateGrid((g) => mergeLine(g, cell.id, axis)) })
      }
    }
    return merges.length ? [...items, 'separator', ...merges] : items
  })
</script>

{#if node.kind === 'split'}
  <div class="split" style:flex-direction={node.direction} bind:clientWidth={widthPx} bind:clientHeight={heightPx}>
    <div class="part divider {node.direction}" style:flex-grow={node.sizes[0]}>
      <CellNodeView node={node.children[0]} {cell} />
      <ResizeHandle
        edge={node.direction === 'row' ? 'right' : 'bottom'}
        onstart={() => {
          if (node.kind === 'split') startSizes = [...node.sizes]
          editor.beginGesture()
        }}
        onmove={resizeSplit}
        onend={() => editor.endGesture()}
        oncancel={() => editor.cancelGesture()}
        onreset={() =>
          editor.update((p) => {
            const live = findNode(p.grid, node.id)
            if (live?.kind === 'split') live.sizes = [1, 1]
          })}
      />
    </div>
    <div class="part" style:flex-grow={node.sizes[1]}>
      <CellNodeView node={node.children[1]} {cell} />
    </div>
  </div>
{:else}
  <div class="leaf">
    <!-- Empty cells show nothing. -->
    {#if node.element}
      <ElementView element={node.element} leafId={node.id} />
    {/if}
    <div class="controls">
      <Menu label={i18n.t.grid.cellLayout} items={menu} />
    </div>
  </div>
{/if}

<style>
  .split {
    display: flex;
    height: 100%;
  }

  .part {
    position: relative;
    flex-basis: 0;
    min-width: 0;
    min-height: 0;
  }

  .divider.row {
    border-right: var(--border-width) solid var(--ink);
  }

  .divider.column {
    border-bottom: var(--border-width) solid var(--ink);
  }

  .leaf {
    position: relative;
    height: 100%;
  }

  .controls {
    position: absolute;
    top: 3px;
    right: 3px;
    z-index: 3;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .leaf:hover > .controls,
  .controls:has(:global(.open)) {
    opacity: 1;
  }

  /* Touchscreens have no hover: shown on the selected cell, at a
     finger-friendly size whatever the zoom (--ui-scale is set by the
     viewport). */
  @media (hover: none) {
    .controls {
      visibility: hidden;
      transform: scale(calc(var(--ui-scale, 1) * 1.6));
      transform-origin: top right;
    }

    :global(.cell.selected) .controls {
      visibility: visible;
      opacity: 1;
    }
  }
</style>
