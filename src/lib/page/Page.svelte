<script lang="ts">
  import { fontStack } from '../fonts'
  import { editor } from '../state/editor.svelte'
  import Footer from './Footer.svelte'
  import GridBody from './grid/GridBody.svelte'
  import Header from './Header.svelte'

  const style = $derived(editor.page.style)
</script>

<!-- A4 sheet. -->
<article
  class="page"
  style:--border-width="{style.border.widthPt}pt"
  style:--border-color={style.border.color}
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
    color: #1b1a17;
    box-shadow: 0 2px 12px rgb(0 0 0 / 0.35);

    /* Generated newsprint: warm off-white, faint grain, a soft vignette, and a
       vertical and horizontal fold crease through the middle. Kept subtle so
       text contrast isn't affected. The grain is a small PNG tile rather than
       an SVG noise filter, because image export renders SVG filters black. */
    background-color: #f2ede1;
    background-image:
      linear-gradient(
        to right,
        transparent calc(50% - 5mm),
        rgb(90 75 50 / 0.05) calc(50% - 0.3mm),
        rgb(90 75 50 / 0.12) 50%,
        rgb(255 255 255 / 0.35) calc(50% + 0.3mm),
        transparent calc(50% + 5mm)
      ),
      linear-gradient(
        to bottom,
        transparent calc(50% - 5mm),
        rgb(90 75 50 / 0.05) calc(50% - 0.3mm),
        rgb(90 75 50 / 0.12) 50%,
        rgb(255 255 255 / 0.35) calc(50% + 0.3mm),
        transparent calc(50% + 5mm)
      ),
      radial-gradient(ellipse at center, transparent 55%, rgb(120 100 60 / 0.1) 100%),
      url('../../assets/paper-grain.png');
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
