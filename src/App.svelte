<script lang="ts">
  import { onMount } from 'svelte'
  import Page from './lib/page/Page.svelte'
  import { loadAutosave, saveAutosave } from './lib/state/autosave'
  import { editor } from './lib/state/editor.svelte'
  import { flushEdits } from './lib/state/flush'
  import { handleHistoryShortcut } from './lib/state/shortcuts'

  const AUTOSAVE_DELAY_MS = 500

  let ready = $state(false)

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

<main>
  {#if ready}
    <Page />
  {/if}
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    padding: 48px 16px;
  }
</style>
