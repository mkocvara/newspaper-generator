<script lang="ts">
  import type { FrameStyle } from '../model/types'

  // One horizontal frame bar. `outer` is the side facing away from the
  // header/footer text, so mirrored bars match: the header's top and bottom
  // bars (and the footer's bar) all have the same line on the outside.
  let { kind, outer }: { kind: FrameStyle; outer: 'top' | 'bottom' } = $props()

  const THICK = '2.5pt'
  const THIN = '0.75pt'

  const lines = $derived.by((): string[] => {
    if (kind === 'single') return ['1.25pt']
    if (kind === 'double') return [THIN, THIN]
    const [outerLine, innerLine] = kind === 'thick-outer' ? [THICK, THIN] : [THIN, THICK]
    return outer === 'top' ? [outerLine, innerLine] : [innerLine, outerLine]
  })
</script>

<div class="rule">
  {#each lines as height, i (i)}
    <div class="line" style:height></div>
  {/each}
</div>

<style>
  .rule {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 1.5pt;
  }

  .line {
    background: currentColor;
  }
</style>
