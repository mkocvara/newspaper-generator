<script lang="ts">
  import { editor } from '../state/editor.svelte'
  import Footer from './Footer.svelte'
  import GridBody from './GridBody.svelte'
  import Header from './Header.svelte'

  const style = $derived(editor.page.style)
  const family = (name: string) => `"${name}", Cambria, Georgia, serif`
</script>

<!-- A4 sheet. -->
<article
  class="page"
  style:--border-width="{style.border.widthPt}pt"
  style:--border-color={style.border.color}
  style:--font-body={family(style.fonts.body)}
  style:--font-heading={family(style.fonts.heading)}
  style:--font-caption={family(style.fonts.caption)}
  style:--font-eyecatcher={family(style.fonts.eyecatcher)}
  style:--font-header-footer={family(style.fonts.headerFooter)}
  style:--font-name={family(style.fonts.name)}
>
  <Header />

  <section class="body">
    <GridBody grid={editor.page.grid} />
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
       text contrast isn't affected. */
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
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0.18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
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
