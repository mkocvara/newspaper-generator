<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { loadFont } from './lib/fonts'
  import Page from './lib/page/Page.svelte'
  import { loadAutosave, saveAutosave } from './lib/state/autosave'
  import { editor } from './lib/state/editor.svelte'
  import { fontLibrary } from './lib/state/fontLibrary.svelte'
  import { flushEdits } from './lib/state/flush'
  import { handleHistoryShortcut } from './lib/state/shortcuts'
  import Toolbar from './lib/toolbar/Toolbar.svelte'
  import Viewport from './lib/view/Viewport.svelte'

  const AUTOSAVE_DELAY_MS = 500

  const PIN_KEY = 'newspaper:toolbar-pinned'
  // The pinned toolbar's height; the page's viewport starts below it.
  const TOOLBAR_HEIGHT = 56

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

  onMount(async () => {
    const saved = await loadAutosave()
    if (saved) editor.load(saved)
    ready = true
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

<Toolbar bind:pinned />

<Viewport top={pinned ? TOOLBAR_HEIGHT : 0}>
  {#if ready}
    <Page />
  {/if}
</Viewport>
