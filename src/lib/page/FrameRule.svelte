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

  // Zigzag and wave are drawn as a repeating SVG pattern; one period of the
  // path, in pt, scaled to px for the SVG.
  const PT = 96 / 72
  const PERIOD = 6
  const HEIGHT = 3
  const STROKE = 0.9
  const id = $props.id()
  const path = $derived.by(() => {
    const [w, h, s] = [PERIOD * PT, HEIGHT * PT, (STROKE * PT) / 2]
    if (kind === 'zigzag') return `M0 ${h - s} L${w / 2} ${s} L${w} ${h - s}`
    // A crest then a trough per period. A quadratic curve peaks halfway to its
    // control point, so that sits twice as far out as the crest.
    const mid = h / 2
    return `M0 ${mid} Q${w / 4} ${2 * s - mid} ${w / 2} ${mid} T${w} ${mid}`
  })
</script>

{#if kind === 'zigzag' || kind === 'wave'}
  <svg class="pattern" width="100%" height="{HEIGHT}pt" aria-hidden="true">
    <defs>
      <pattern id="{id}-p" width={PERIOD * PT} height={HEIGHT * PT} patternUnits="userSpaceOnUse">
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          stroke-width={STROKE * PT}
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#{id}-p)" />
  </svg>
{:else if kind === 'dashed' || kind === 'dotted' || kind === 'dash-dot'}
  <div class="rule"><div class="line {kind}"></div></div>
{:else}
  <div class="rule">
    {#each lines as height, i (i)}
      <div class="line" style:height></div>
    {/each}
  </div>
{/if}

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

  .pattern {
    flex: none;
    display: block;
    overflow: visible;
  }

  .line.dashed {
    height: 1.25pt;
    background: repeating-linear-gradient(90deg, currentColor 0 6pt, transparent 6pt 9pt);
  }

  .line.dotted {
    height: 2pt;
    background: radial-gradient(circle, currentColor 0.85pt, transparent 1pt) 0 50% / 4pt 2pt repeat-x;
  }

  /* A dash, then a round dot, per 14pt period. */
  .line.dash-dot {
    height: 2pt;
    background:
      linear-gradient(90deg, currentColor 8pt, transparent 8pt) 0 50% / 14pt 1.25pt repeat-x,
      radial-gradient(circle at 11pt 50%, currentColor 0.85pt, transparent 1pt) 0 0 / 14pt 2pt repeat-x;
  }
</style>
