<script lang="ts">
  import { editor } from '../state/editor.svelte'
  import EditableText from '../ui/EditableText.svelte'
  import { fitText } from '../ui/fitText'
  import ResizeHandle from '../ui/ResizeHandle.svelte'
  import FrameRule from './FrameRule.svelte'
  import { ornamentSymbols } from './nameDecoration'
  import { MM_PX } from './units'

  const MIN_HEIGHT_MM = 12
  const MAX_HEIGHT_MM = 80
  // Wrap the name or location onto more lines only for a clearly bigger font.
  const WRAP_GAIN = 1.3
  // Date and location text grows with the header height up to a cap, so
  // extra height goes to the newspaper name.
  const SIDE_TEXT_RATIO = 0.16
  const SIDE_TEXT_MAX_PX = 20

  const header = $derived(editor.page.header)
  const style = $derived(editor.page.style)
  const decoration = $derived(style.nameDecoration)
  const symbols = $derived(ornamentSymbols(decoration))
  // Presets have a fixed size; custom symbols can be scaled.
  const symbolScale = $derived(decoration.ornament === 'custom' ? decoration.customScale / 100 : 1)
  const sidePx = $derived(Math.min(SIDE_TEXT_MAX_PX, header.heightMm * MM_PX * SIDE_TEXT_RATIO))

  // The name stays centred on the page, so both side columns are as wide as
  // the wider side text. That width is measured on hidden copies at full
  // size; the visible side text only shrinks if it hits the column cap.
  let liveDate = $state('')
  let liveLocation = $state('')
  let dateWidth = $state(0)
  let locationWidth = $state(0)
  $effect.pre(() => {
    liveDate = header.date
    liveLocation = header.location
  })

  const set = (field: 'date' | 'name' | 'location') => (value: string) =>
    editor.update((p) => (p.header[field] = value))

  const liveText = (event: Event) => (event.target as HTMLElement).innerText

  let startHeight = 0
</script>

<header style:height="{header.heightMm}mm">
  <FrameRule kind={style.frameStyle} outer="top" />

  <div class="masthead" style:--side="{Math.max(dateWidth, locationWidth) + 1}px" style:--side-size="{sidePx}px">
    <div class="slot side" {@attach fitText({ max: sidePx, watch: style.fonts.headerFooter })}>
      <span class="measure" aria-hidden="true" bind:offsetWidth={dateWidth}>{liveDate || '<Date>'}</span>
      <div oninput={(e) => (liveDate = liveText(e))}>
        <EditableText value={header.date} onchange={set('date')} placeholder="Date" />
      </div>
    </div>

    <div
      class="slot name"
      {@attach fitText({
        max: header.heightMm * MM_PX,
        wrapGain: WRAP_GAIN,
        watch: `${style.fonts.name}|${decoration.ornament}|${symbols}|${symbolScale}`,
      })}
    >
      <!-- Ornaments are part of the name's space, so they scale with it. -->
      <div class="name-line effect-{decoration.effect}">
        {#if decoration.ornament === 'rules'}
          <span class="rule" aria-hidden="true"></span>
        {:else if symbols}
          <span class="ornament" aria-hidden="true" style:--scale={symbolScale}>{symbols[0]}</span>
        {/if}
        <EditableText value={header.name} onchange={set('name')} placeholder="Newspaper Name" wrap />
        {#if decoration.ornament === 'rules'}
          <span class="rule" aria-hidden="true"></span>
        {:else if symbols}
          <span class="ornament" aria-hidden="true" style:--scale={symbolScale}>{symbols[1]}</span>
        {/if}
      </div>
    </div>

    <div
      class="slot side right"
      {@attach fitText({ max: sidePx, wrapGain: WRAP_GAIN, watch: style.fonts.headerFooter })}
    >
      <span class="measure" aria-hidden="true" bind:offsetWidth={locationWidth}>{liveLocation || '<Location>'}</span>
      <div oninput={(e) => (liveLocation = liveText(e))}>
        <EditableText value={header.location} onchange={set('location')} placeholder="Location" wrap />
      </div>
    </div>
  </div>

  <FrameRule kind={style.frameStyle} outer="bottom" />

  <ResizeHandle
    edge="bottom"
    onstart={() => {
      startHeight = header.heightMm
      editor.beginGesture()
    }}
    onmove={(delta) => {
      const height = Math.min(MAX_HEIGHT_MM, Math.max(MIN_HEIGHT_MM, startHeight + delta))
      editor.page.header.heightMm = Math.round(height * 2) / 2
    }}
    onend={() => editor.endGesture()}
  />
</header>

<style>
  header {
    position: relative;
    flex: none;
    display: flex;
    flex-direction: column;
  }

  .masthead {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: min(var(--side), 28%) minmax(0, 1fr) min(var(--side), 28%);
    column-gap: 7mm;
    padding-block: 0.5mm;
  }

  .slot {
    position: relative;
    min-width: 0;
    overflow: hidden;
    display: flex;
    /* 'safe' keeps overflow on the end side, where fitText can detect it. */
    align-items: safe center;
    line-height: 1.1;
  }

  .side {
    font-family: var(--font-header-footer);
  }

  .side.right {
    justify-content: safe flex-end;
    text-align: right;
  }

  .name {
    justify-content: safe center;
    text-align: center;
    font-family: var(--font-name);
    font-weight: 700;
  }

  .name-line {
    display: flex;
    align-items: center;
    gap: 0.25em;
    max-width: 100%;
    flex: 1;
    justify-content: center;
  }

  /* Never narrower than its text (or longest word when wrapping), so the
     ornaments can't overlap it and fitText sees any overflow. */
  .name-line > :global(.editable) {
    min-width: min-content;
  }

  .ornament {
    flex: none;
    font-size: calc(0.6em * var(--scale, 1));
    font-weight: 400;
  }

  .rule {
    flex: 1 1 1.5em;
    min-width: 1.2em;
    height: 0.07em;
    background: var(--ink);
    box-shadow: 0 0.12em 0 var(--ink);
    transform: translateY(-0.06em);
  }

  /* Name effects. They decorate the ornaments too. Their tones are the ink
     thinned with paper or transparency, so they follow the ink colour. */
  .effect-shadow {
    text-shadow: 0.06em 0.06em 0 color-mix(in srgb, var(--ink) 30%, transparent);
  }

  .effect-extrude {
    --side: color-mix(in srgb, var(--ink) 70%, var(--paper));
    text-shadow:
      0.012em 0.012em 0 var(--side),
      0.024em 0.024em 0 var(--side),
      0.036em 0.036em 0 var(--side),
      0.048em 0.048em 0 var(--side),
      0.06em 0.06em 0 var(--side),
      0.09em 0.09em 0.03em color-mix(in srgb, var(--ink) 25%, transparent);
  }

  /* Pressed into the paper: lighter letters with a dark lip along their top
     edge and a bright one below, like a dent catching the light. */
  .effect-engraved {
    color: color-mix(in srgb, var(--ink) 60%, var(--paper));
    text-shadow:
      0 -0.035em 0 color-mix(in srgb, var(--ink) 90%, transparent),
      0 0.04em 0 rgb(255 255 255 / 0.95),
      0 0.06em 0.03em rgb(255 255 255 / 0.6);
  }

  .effect-outline {
    color: transparent;
    -webkit-text-stroke: 0.025em var(--ink);
    caret-color: var(--ink);
  }

  .effect-hatched {
    color: transparent;
    background-image: repeating-linear-gradient(135deg, var(--ink) 0 0.035em, transparent 0.035em 0.085em);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-stroke: 0.012em var(--ink);
    caret-color: var(--ink);
  }

  .measure {
    position: absolute;
    visibility: hidden;
    white-space: nowrap;
    font-size: var(--side-size);
  }
</style>
