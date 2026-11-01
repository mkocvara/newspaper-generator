<script lang="ts">
  import type { TextElement } from '../../model/types'
  import { editor } from '../../state/editor.svelte'
  import EditableText from '../../ui/EditableText.svelte'
  import { fitText } from '../../ui/fitText'
  import { patchElement, PT_PX } from './edit'

  // A heading and body text at the page-wide sizes. If the text doesn't fit
  // the cell, both shrink together just enough to fit.
  let { element, leafId }: { element: TextElement; leafId: string } = $props()

  const sizes = $derived(editor.page.style.sizes)
  const set = (field: 'heading' | 'body') => (value: string) => patchElement<TextElement>(leafId, { [field]: value })
</script>

<div
  class="article"
  style:--heading-em={sizes.headingPt / sizes.bodyPt}
  {@attach fitText({ max: sizes.bodyPt * PT_PX, min: 3, watch: `${editor.page.style.fonts.heading}|${editor.page.style.fonts.body}` })}
>
  <div class="heading">
    <EditableText value={element.heading} onchange={set('heading')} placeholder="Heading" wrap />
  </div>
  <div class="body">
    <EditableText value={element.body} onchange={set('body')} placeholder="Article text" multiline />
  </div>
</div>

<style>
  .article {
    height: 100%;
    box-sizing: border-box;
    padding: 2mm 2.5mm;
    overflow: hidden;
    white-space: normal;
  }

  .heading {
    margin-bottom: 0.35em;
    font-family: var(--font-heading);
    font-size: calc(var(--heading-em) * 1em);
    font-weight: 700;
    line-height: 1.1;
    text-align: left;
  }

  .body {
    font-family: var(--font-body);
    line-height: 1.3;
    text-align: justify;
    hyphens: auto;
  }
</style>
