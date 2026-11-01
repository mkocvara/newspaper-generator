<script lang="ts">
  import type { CellNode } from '../model/types'
  import CellNodeView from './CellNodeView.svelte'

  let { node }: { node: CellNode } = $props()
</script>

{#if node.kind === 'split'}
  <div
    class="split"
    style:flex-direction={node.direction}
  >
    <div class="part divider {node.direction}" style:flex-grow={node.sizes[0]}>
      <CellNodeView node={node.children[0]} />
    </div>
    <div class="part" style:flex-grow={node.sizes[1]}>
      <CellNodeView node={node.children[1]} />
    </div>
  </div>
{:else}
  <!-- Elements are rendered here from stage 4; empty cells show nothing. -->
  <div class="leaf"></div>
{/if}

<style>
  .split {
    display: flex;
    height: 100%;
  }

  .part {
    flex-basis: 0;
    min-width: 0;
    min-height: 0;
  }

  .divider.row {
    border-right: var(--border-width) solid var(--border-color);
  }

  .divider.column {
    border-bottom: var(--border-width) solid var(--border-color);
  }

  .leaf {
    height: 100%;
  }
</style>
