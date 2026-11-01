<script lang="ts">
  import { i18n } from '../../i18n/i18n.svelte'
  import type { TextElement } from '../../model/types'
  import { editor } from '../../state/editor.svelte'
  import EditableText from '../../ui/EditableText.svelte'
  import { patchElement, PT_PX } from './edit'
  import { fitArticle } from './fitArticle'

  // A heading and body text at the page-wide sizes, shrunk to fit the cell as
  // described in fitArticle.
  let { element, leafId }: { element: TextElement; leafId: string } = $props()

  const sizes = $derived(editor.page.style.sizes)
  const watch = $derived(`${editor.page.style.fonts.heading}|${editor.page.style.fonts.body}`)
  const set = (field: 'heading' | 'body') => (value: string) => patchElement<TextElement>(leafId, { [field]: value })
</script>

<div
  class="article"
  style:--heading-size="{sizes.headingPt * PT_PX}px"
  {@attach fitArticle({ headingPt: sizes.headingPt, bodyPt: sizes.bodyPt, watch })}
>
  <div class="heading">
    <EditableText value={element.heading} onchange={set('heading')} placeholder={i18n.t.elements.heading} wrap />
  </div>
  <div class="body">
    <EditableText value={element.body} onchange={set('body')} placeholder={i18n.t.elements.article} multiline />
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

  /* Without body text the heading takes the free space, so it can be fitted;
     with it, the heading is as tall as its text and the body takes the rest.
     has-body is set by fitArticle. */
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

  .article:global(.has-body) .heading {
    flex: none;
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

  .article:global(.has-body) .body {
    flex: 1;
    min-height: 0;
  }

  /* Cut off with an ellipsis (fitArticle sets the line count) when even the
     smallest sizes don't fit; shown in full while being edited. */
  .body:global(.clamped):not(:focus-within) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
  }
</style>
