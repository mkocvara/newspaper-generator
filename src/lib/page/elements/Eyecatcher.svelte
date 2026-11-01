<script lang="ts">
  import { i18n } from '../../i18n/i18n.svelte'
  import type { EyecatcherElement } from '../../model/types'
  import { editor } from '../../state/editor.svelte'
  import EditableText from '../../ui/EditableText.svelte'
  import { fitText } from '../../ui/fitText'
  import { patchElement } from './edit'

  // Big blocky capitals that fill the cell. The secondary line is optional:
  // when it's empty it takes no space at all, and is offered as a hint
  // overlaid at the bottom of the cell while hovering.
  let { element, leafId }: { element: EyecatcherElement; leafId: string } = $props()

  let heightPx = $state(0)

  const set = (field: 'main' | 'sub') => (value: string) => patchElement<EyecatcherElement>(leafId, { [field]: value })
</script>

<div class="eyecatcher" bind:clientHeight={heightPx}>
  <div class="fit" {@attach fitText({ max: Math.max(8, heightPx), watch: editor.page.style.fonts.eyecatcher })}>
    <div class="main">
      <EditableText value={element.main} onchange={set('main')} placeholder={i18n.t.elements.eyecatcher} wrap />
    </div>
    {#if element.sub !== ''}
      <div class="sub">
        <EditableText value={element.sub} onchange={set('sub')} placeholder={i18n.t.elements.secondary} wrap />
      </div>
    {/if}
  </div>

  {#if element.sub === ''}
    <div class="sub sub-hint ui-only">
      <EditableText value="" onchange={set('sub')} placeholder={i18n.t.elements.secondary} wrap />
    </div>
  {/if}
</div>

<style>
  .eyecatcher {
    position: relative;
    height: 100%;
    box-sizing: border-box;
    padding: 2mm 2.5mm;
    font-family: var(--font-eyecatcher);
    text-transform: uppercase;
    text-align: center;
  }

  .fit {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    /* 'safe' keeps overflow on the end side, where fitText can detect it. */
    justify-content: safe center;
    white-space: normal;
  }

  .main {
    font-weight: 700;
    line-height: 0.95;
  }

  .sub {
    margin-top: 0.12em;
    font-size: 0.32em;
    font-weight: 400;
    line-height: 1.1;
  }

  .sub-hint {
    position: absolute;
    left: 2.5mm;
    right: 2.5mm;
    bottom: 1.5mm;
    margin: 0;
    font-size: 11px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .eyecatcher:hover .sub-hint,
  .sub-hint:focus-within {
    opacity: 1;
  }
</style>
