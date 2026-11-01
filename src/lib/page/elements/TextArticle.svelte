<script lang="ts">
  import type { TextElement } from '../../model/types'
  import { editor } from '../../state/editor.svelte'
  import EditableText from '../../ui/EditableText.svelte'
  import { fitText } from '../../ui/fitText'
  import { patchElement, PT_PX } from './edit'

  // A heading and body text at the page-wide sizes. The heading keeps its size
  // and the body shrinks to fit the space below it; the heading only shrinks
  // if it doesn't fit the cell by itself.
  let { element, leafId }: { element: TextElement; leafId: string } = $props()

  const sizes = $derived(editor.page.style.sizes)
  const hasBody = $derived(element.body.trim() !== '')
  const watch = $derived(`${editor.page.style.fonts.heading}|${editor.page.style.fonts.body}`)
  const set = (field: 'heading' | 'body') => (value: string) => patchElement<TextElement>(leafId, { [field]: value })
</script>

<div class="article" class:has-body={hasBody} style:--heading-size="{sizes.headingPt * PT_PX}px">
  <div class="heading" {@attach fitText({ max: sizes.headingPt * PT_PX, min: 3, watch })}>
    <EditableText value={element.heading} onchange={set('heading')} placeholder="Heading" wrap />
  </div>
  <div class="body" {@attach fitText({ max: sizes.bodyPt * PT_PX, min: 3, watch })}>
    <EditableText value={element.body} onchange={set('body')} placeholder="Article text" multiline />
  </div>
</div>

<style>
  .article {
    height: 100%;
    box-sizing: border-box;
    padding: 2mm 0;
    overflow: hidden;
    white-space: normal;
    display: flex;
    flex-direction: column;
  }

  /* Without body text the heading takes the free space; with it, the heading
     is only as tall as its text but at most the whole article, so it shrinks
     only if it can't fit the cell by itself. */
  .heading {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    margin-bottom: 0.35em;
    padding: 0 2.5mm;
    font-family: var(--font-heading);
    font-size: var(--heading-size);
    font-weight: 700;
    line-height: 1.1;
    text-align: left;
  }

  .has-body .heading {
    flex: none;
    max-height: 100%;
    box-sizing: border-box;
  }

  /* Side padding sits on the fitted parts, not the article: Firefox counts the
     spaces hanging at the end of wrapped lines as overflow unless they fall
     into padding. */
  .body {
    flex: none;
    overflow: hidden;
    padding: 0 2.5mm;
    font-family: var(--font-body);
    line-height: 1.3;
    text-align: justify;
    hyphens: auto;
  }

  .has-body .body {
    flex: 1;
    min-height: 0;
  }
</style>
