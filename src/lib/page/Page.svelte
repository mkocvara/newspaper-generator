<script lang="ts">
  import { fontStack } from '../fonts'
  import { i18n } from '../i18n/i18n.svelte'
  import { editor } from '../state/editor.svelte'
  import './papers.css'
  import Footer from './Footer.svelte'
  import GridBody from './grid/GridBody.svelte'
  import Header from './Header.svelte'

  const style = $derived(editor.page.style)
</script>

<!-- A4 sheet. Its own lang (not just <html>'s) carries into image exports,
     which copy the page into a separate document: hyphenation needs it. -->
<article
  id="newspaper-page"
  lang={i18n.language}
  class="page paper-{style.paper}"
  style:--border-width="{style.border.widthPt}pt"
  style:--ink={style.ink}
  style:--font-body={fontStack(style.fonts.body)}
  style:--font-heading={fontStack(style.fonts.heading)}
  style:--font-caption={fontStack(style.fonts.caption)}
  style:--font-eyecatcher={fontStack(style.fonts.eyecatcher)}
  style:--font-header-footer={fontStack(style.fonts.headerFooter)}
  style:--font-name={fontStack(style.fonts.name)}
>
  <Header />

  <section class="body">
    <GridBody />
  </section>

  <Footer />
</article>

<style>
  .page {
    box-sizing: border-box;
    width: 210mm;
    height: 297mm;
    padding: 12mm;
    display: flex;
    flex-direction: column;
    gap: 3mm;
    /* Everything printed on the page is in the ink colour (set inline). The
       paper (background and --paper) comes from a class in papers.css. */
    color: var(--ink);
    box-shadow:
      0 2px 12px rgb(0 0 0 / 0.35),
      var(--paper-inset, 0 0 0 transparent);
  }

  .body {
    flex: 1;
    min-height: 0;
  }

  /* Editing affordances (drag handles etc.) never appear in exports. */
  .page:global(.exporting) :global(.ui-only) {
    display: none;
  }
</style>
