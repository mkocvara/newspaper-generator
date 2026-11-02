<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { loadFont } from './lib/fonts'
  import { i18n } from './lib/i18n/i18n.svelte'
  import { createDefaultPage } from './lib/model/defaults'
  import { decodePreset } from './lib/model/presetFile'
  import defaultPageUrl from './assets/default-page.newspaper?url'
  import { toWorkFile } from './lib/model/workfile'
  import Page from './lib/page/Page.svelte'
  import { loadAutosave, saveAutosave } from './lib/state/autosave'
  import { editor } from './lib/state/editor.svelte'
  import { fontLibrary } from './lib/state/fontLibrary.svelte'
  import { flushEdits } from './lib/state/flush'
  import { handleHistoryShortcut } from './lib/state/shortcuts'
  import Toolbar from './lib/toolbar/Toolbar.svelte'
  import Viewport from './lib/view/Viewport.svelte'
  import { deselectOnTapOutside } from './lib/page/grid/selection.svelte'

  const AUTOSAVE_DELAY_MS = 500

  const PIN_KEY = 'newspaper:toolbar-pinned'
  // The docked toolbar's height; the page's viewport starts below it.
  let toolbarHeight = $state(56)
  let toolbarDocked = $state(true)

  let ready = $state(false)

  // Whether the toolbar is pinned is remembered per browser; pinned by default.
  let pinned = $state(readPinned())
  function readPinned() {
    try {
      return localStorage.getItem(PIN_KEY) !== 'false'
    } catch {
      return true
    }
  }
  $effect(() => {
    try {
      localStorage.setItem(PIN_KEY, String(pinned))
    } catch {
      // Storage unavailable (e.g. private mode); pinning just isn't remembered.
    }
  })

  // Load every font the page uses (including after undo or import).
  $effect(() => {
    const { fonts, customFonts } = editor.page.style
    for (const family of Object.values(fonts)) loadFont(family, [...customFonts, ...fontLibrary.fonts])
  })

  // Fonts a page uses join the font list, e.g. after importing a work file
  // made elsewhere or undoing a font's removal.
  $effect(() => {
    const style = $state.snapshot(editor.page.style)
    untrack(() => fontLibrary.adopt(style))
  })

  // With nothing saved (a first visit, or cleared site data) the app opens on
  // an example newspaper, shipped as a preset; failing that, a blank page in
  // the UI language. New Paper still starts from the blank page.
  async function examplePage() {
    try {
      const response = await fetch(defaultPageUrl)
      return response.ok ? await decodePreset(await response.blob()) : null
    } catch (error) {
      console.warn('Could not load the example page', error)
      return null
    }
  }

  onMount(async () => {
    const saved = (await loadAutosave()) ?? (await examplePage())
    editor.load(saved ?? toWorkFile(createDefaultPage(new Date(), i18n.t.page.footerDefault), {}))
    ready = true
  })

  // Touchscreens: a tap outside the grid's cells deselects the selected cell.
  $effect(() => deselectOnTapOutside(document.body))

  // Lets the browser use the right hyphenation and spelling rules.
  $effect(() => {
    document.documentElement.lang = i18n.language
  })

  // Cache the work in progress shortly after every change.
  $effect(() => {
    if (!ready) return
    const file = editor.toWorkFile()
    const timer = setTimeout(() => saveAutosave(file), AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  })

  // Leaving the tab (or closing it) commits the text box being typed in and
  // saves right away rather than after the usual delay.
  function saveNow() {
    if (!ready) return
    flushEdits()
    saveAutosave(editor.toWorkFile())
  }
</script>

<svelte:window onkeydown={(event) => handleHistoryShortcut(event, editor)} onpagehide={saveNow} />
<svelte:document onvisibilitychange={() => document.visibilityState === 'hidden' && saveNow()} />

<Toolbar bind:pinned bind:height={toolbarHeight} bind:docked={toolbarDocked} />

<Viewport top={toolbarDocked ? toolbarHeight : 0}>
  {#if ready}
    <Page />
  {/if}
</Viewport>
