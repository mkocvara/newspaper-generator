<script lang="ts">
  import { editor } from '../state/editor.svelte'
  import EditableText from '../ui/EditableText.svelte'
  import { fitText } from '../ui/fitText'
  import ResizeHandle from '../ui/ResizeHandle.svelte'
  import FrameRule from './FrameRule.svelte'
  import { MM_PX } from './units'

  const MIN_HEIGHT_MM = 5
  const MAX_HEIGHT_MM = 40
  // Footer text size relative to the footer height.
  const TEXT_RATIO = 0.32

  const footer = $derived(editor.page.footer)
  const style = $derived(editor.page.style)
  const textPx = $derived(footer.heightMm * MM_PX * TEXT_RATIO)

  const slots = [
    // 'safe' keeps overflow on the end side, where fitText can detect it.
    { field: 'left', align: 'flex-start', placeholder: 'Left text' },
    { field: 'center', align: 'safe center', placeholder: 'Centre text' },
    { field: 'right', align: 'safe flex-end', placeholder: 'Right text' },
  ] as const

  let startHeight = 0
</script>

<footer style:height="{footer.heightMm}mm">
  <ResizeHandle
    edge="top"
    onstart={() => {
      startHeight = footer.heightMm
      editor.beginGesture()
    }}
    onmove={(delta) => {
      const height = Math.min(MAX_HEIGHT_MM, Math.max(MIN_HEIGHT_MM, startHeight - delta))
      editor.page.footer.heightMm = Math.round(height * 2) / 2
    }}
    onend={() => editor.endGesture()}
  />

  <FrameRule kind={style.frameStyle} outer="top" />

  <div class="footline">
    {#each slots as slot (slot.field)}
      <div
        class="slot"
        style:justify-content={slot.align}
        {@attach fitText({ max: textPx, watch: style.fonts.headerFooter })}
      >
        <EditableText
          value={footer[slot.field]}
          onchange={(value) => editor.update((p) => (p.footer[slot.field] = value))}
          placeholder={slot.placeholder}
        />
      </div>
    {/each}
  </div>
</footer>

<style>
  footer {
    position: relative;
    flex: none;
    display: flex;
    flex-direction: column;
  }

  .footline {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 4mm;
  }

  .slot {
    min-width: 0;
    overflow: hidden;
    display: flex;
    align-items: safe center;
    line-height: 1.1;
    font-family: var(--font-header-footer);
  }
</style>
