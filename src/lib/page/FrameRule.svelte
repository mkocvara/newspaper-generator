<script lang="ts">
  import type { FrameStyle } from '../model/types'

  // One horizontal frame bar. For the asymmetric thick-and-thin style, the
  // thick line goes on the side given by `thick` (header and footer bars put
  // it away from their text, framing the body consistently).
  let { kind, thick = 'top' }: { kind: FrameStyle; thick?: 'top' | 'bottom' } = $props()

  const lines = $derived.by((): string[] => {
    if (kind === 'single') return ['1.25pt']
    if (kind === 'double') return ['0.75pt', '0.75pt']
    return thick === 'top' ? ['2.5pt', '0.75pt'] : ['0.75pt', '2.5pt']
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
