<script lang="ts">
  import { i18n, LANGUAGES, type Language } from '../i18n/i18n.svelte'
  import { exportBasename, exportPage, exportWorkFile, type ExportKind } from '../export'
  import { createDefaultPage } from '../model/defaults'
  import { decodePreset } from '../model/presetFile'
  import { editor } from '../state/editor.svelte'
  import Menu from '../ui/Menu.svelte'
  import { setContext } from 'svelte'
  import { PANEL_INLINE } from '../ui/Panel.svelte'
  import NewPaperDialog from './NewPaperDialog.svelte'
  import StylePanels from './StylePanels.svelte'

  // Sticky top bar. Unless pinned, it slides away when not hovered (a small tab
  // hints at it) and comes back when the pointer enters the strip it occupies. Showing and hiding is pure CSS (see the styles).
  // `height` reports the bar's height, which grows if it wraps onto a second
  // row in a narrow window (or with longer labels in another language), and
  // `docked` whether it's always shown (pinned, or on a phone).
  //
  // On a phone-sized screen it's a compact bar instead: Undo, Redo and a menu
  // button opening a sheet with all the tools, its panels as inline sections.
  let {
    pinned = $bindable(false),
    height = $bindable(56),
    docked = $bindable(true),
  }: { pinned?: boolean; height?: number; docked?: boolean } = $props()

  const PHONE = '(max-width: 700px)'
  let phone = $state(window.matchMedia(PHONE).matches)
  $effect(() => {
    const query = window.matchMedia(PHONE)
    const onChange = () => (phone = query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  })
  $effect(() => {
    docked = pinned || phone
  })

  let menuOpen = $state(false)
  $effect(() => {
    if (!phone) menuOpen = false
  })
  // Panels inside the phone menu open in place rather than as drop-downs.
  setContext(PANEL_INLINE, () => phone)

  let status = $state('')
  let statusTimer: ReturnType<typeof setTimeout> | undefined
  let busy = $state(false)
  let importInput = $state<HTMLInputElement>()

  function say(message: string) {
    status = message
    clearTimeout(statusTimer)
    statusTimer = setTimeout(() => (status = ''), 4000)
  }

  const basename = () => exportBasename(editor.page.header.name)

  async function runExport(kind: ExportKind | 'json') {
    if (busy) return
    busy = true
    say(i18n.t.status.exporting)
    try {
      if (kind === 'json') await exportWorkFile(editor.toWorkFile(), basename())
      else await exportPage(kind, basename())
      say(i18n.t.status.exported)
    } catch (error) {
      console.error(error)
      say(i18n.t.status.exportFailed)
    } finally {
      busy = false
    }
  }

  async function runImport(file: File | undefined) {
    if (!file) return
    try {
      const parsed = await decodePreset(file)
      if (!parsed) return say(i18n.t.status.notPreset(file.name))
      editor.importFile(parsed)
      say(i18n.t.status.imported(file.name))
    } catch {
      say(i18n.t.status.unreadable(file.name))
    }
  }
</script>

{#snippet undoRedo()}
  <button
    type="button"
    class="tb-button icon"
    title={i18n.t.toolbar.undoTitle}
    aria-label={i18n.t.toolbar.undo}
    disabled={!editor.canUndo}
    onclick={() => editor.undo()}>↶</button
  >
  <button
    type="button"
    class="tb-button icon"
    title={i18n.t.toolbar.redoTitle}
    aria-label={i18n.t.toolbar.redo}
    disabled={!editor.canRedo}
    onclick={() => editor.redo()}>↷</button
  >
{/snippet}

{#snippet fileTools()}
  <button type="button" class="tb-button" onclick={() => importInput?.click()}>{i18n.t.toolbar.import}</button>
  <input
    bind:this={importInput}
    type="file"
    accept=".newspaper,.json,application/json"
    hidden
    onchange={(e) => {
      runImport(e.currentTarget.files?.[0])
      e.currentTarget.value = ''
    }}
  />
  {#if phone}
    {#each [['png', i18n.t.toolbar.exportPng], ['jpeg', i18n.t.toolbar.exportJpg], ['pdf', i18n.t.toolbar.exportPdf], ['json', i18n.t.toolbar.exportPreset]] as [kind, label] (kind)}
      <button type="button" class="tb-button" disabled={busy} onclick={() => runExport(kind as ExportKind | 'json')}
        >{i18n.t.toolbar.export}: {label}</button
      >
    {/each}
  {:else}
    <div class="export">
      <Menu
        label={i18n.t.toolbar.export}
        icon={busy ? i18n.t.toolbar.exporting : i18n.t.toolbar.export}
        caret={!busy}
        items={[
          { label: i18n.t.toolbar.exportPng, action: () => runExport('png') },
          { label: i18n.t.toolbar.exportJpg, action: () => runExport('jpeg') },
          { label: i18n.t.toolbar.exportPdf, action: () => runExport('pdf') },
          'separator',
          { label: i18n.t.toolbar.exportPreset, action: () => runExport('json') },
        ]}
      />
    </div>
  {/if}
  <NewPaperDialog
    onexport={() => runExport('json')}
    onconfirm={() => {
      editor.reset(createDefaultPage(new Date(), i18n.t.page.footerDefault))
      menuOpen = false
      say(i18n.t.status.newPaper)
    }}
  />
{/snippet}

{#snippet language()}
  <div class="language" role="group" aria-label={i18n.t.toolbar.language}>
    {#each Object.entries(LANGUAGES) as [code, strings] (code)}
      <button
        type="button"
        class="tb-button"
        title={strings.languageName}
        aria-pressed={i18n.language === code}
        onclick={() => i18n.set(code as Language)}>{code.toUpperCase()}</button
      >
    {/each}
  </div>
{/snippet}

{#if phone}
  <div class="toolbar pinned phone" role="toolbar" aria-label={i18n.t.toolbar.tools} bind:offsetHeight={height}>
    <div class="group">{@render undoRedo()}</div>
    <span class="status" role="status">{status}</span>
    <button
      type="button"
      class="tb-button icon menu-button"
      aria-expanded={menuOpen}
      aria-controls="tools-sheet"
      aria-label={menuOpen ? i18n.t.toolbar.closeMenu : i18n.t.toolbar.menu}
      onclick={() => (menuOpen = !menuOpen)}>{menuOpen ? '✕' : '☰'}</button
    >
  </div>
  {#if menuOpen}
    <div
      id="tools-sheet"
      class="sheet"
      style:top="{height}px"
      role="dialog"
      aria-label={i18n.t.toolbar.menu}
      tabindex="-1"
      onkeydown={(e) => e.key === 'Escape' && (menuOpen = false)}
    >
      <section>
        <StylePanels />
      </section>
      <section class="actions">
        {@render fileTools()}
      </section>
      <section class="actions">
        <span class="label">{i18n.t.toolbar.language}</span>
        {@render language()}
      </section>
    </div>
  {/if}
{:else}
  <div class="hot-zone" aria-hidden="true" style:height="{height}px"><span class="hint-tab">▾</span></div>

  <div class="toolbar" class:pinned role="toolbar" aria-label={i18n.t.toolbar.tools} bind:offsetHeight={height}>
    <div class="group">{@render undoRedo()}</div>

    <div class="group">
      <StylePanels />
    </div>

    <div class="group">{@render fileTools()}</div>

    <span class="status" role="status">{status}</span>

    {@render language()}

    <button
      type="button"
      class="tb-button icon pin"
      class:active={pinned}
      aria-pressed={pinned}
      title={pinned ? i18n.t.toolbar.unpinTitle : i18n.t.toolbar.pinTitle}
      aria-label={i18n.t.toolbar.pin}
      onclick={() => (pinned = !pinned)}>📌</button
    >
  </div>
{/if}

<style>
  .hot-zone {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 99;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .hint-tab {
    height: 16px;
    padding: 0 14px;
    border-radius: 0 0 8px 8px;
    background: rgb(255 255 255 / 0.25);
    color: rgb(255 255 255 / 0.8);
    font: 20px/16px system-ui, sans-serif;
  }

  .toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 10px 12px;
    box-sizing: border-box;
    background: #2b2924;
    color: #eee;
    font: 13px/1.3 system-ui, sans-serif;
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.35);
    transform: translateY(-100%);
    /* Linger a moment before hiding, so it doesn't flicker away. */
    transition: transform 0.2s ease 0.4s;
  }

  .hot-zone:hover + .toolbar,
  .toolbar:hover,
  .toolbar:has(:global(.open)),
  .toolbar.pinned {
    transform: none;
    transition-delay: 0s;
  }

  .group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .group + .group {
    padding-left: 10px;
    border-left: 1px solid rgb(255 255 255 / 0.15);
  }

  .toolbar :global(.tb-button),
  .export :global(.trigger) {
    flex: none;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: auto;
    height: 36px;
    padding: 0 8px;
    border: 1px solid rgb(255 255 255 / 0.2);
    border-radius: 5px;
    background: rgb(255 255 255 / 0.08);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .toolbar :global(.tb-button:hover:not(:disabled)),
  .export :global(.trigger:hover) {
    background: rgb(255 255 255 / 0.18);
    border-color: rgb(255 255 255 / 0.35);
  }

  .toolbar :global(.tb-button:disabled) {
    opacity: 0.4;
    cursor: default;
  }

  .export :global(.caret) {
    font-size: 20px;
    line-height: 0;
    opacity: 0.6;
  }

  /* .toolbar raises specificity above the shared button rule's font: inherit. */
  .toolbar .icon {
    min-width: 34px;
    font-size: 20px;
  }

  /* Messages show as a notice just under the bar (even while it's hidden),
     so they need no room in it. */
  .status {
    position: absolute;
    top: calc(100% + 6px);
    right: 12px;
    max-width: min(480px, calc(100vw - 24px));
    padding: 5px 10px;
    border-radius: 6px;
    background: #2b2924;
    color: #e8e1d0;
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.35);
    pointer-events: none;
  }

  .status:empty {
    display: none;
  }

  /* Phone: Undo, Redo and the menu button, with the tools in a sheet below. */
  .toolbar.phone {
    flex-wrap: nowrap;
  }

  .toolbar.phone .status {
    left: 12px;
    right: 12px;
  }

  .menu-button {
    margin-left: auto;
  }

  .toolbar .menu-button {
    font-size: 20px;
  }

  .toolbar,
  .sheet {
    /* No double-tap zoom on the controls. */
    touch-action: manipulation;
  }

  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 105;
    overflow-y: auto;
    padding: 12px 12px 32px;
    box-sizing: border-box;
    background: #2b2924;
    color: #eee;
    font: 15px/1.3 system-ui, sans-serif;
    outline: none;
  }

  .sheet section {
    display: grid;
    /* Items never grow wider than the sheet. */
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .sheet section + section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgb(255 255 255 / 0.15);
  }

  .sheet :global(.tb-button) {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid rgb(255 255 255 / 0.2);
    border-radius: 6px;
    background: rgb(255 255 255 / 0.08);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .sheet :global(.tb-button:disabled) {
    opacity: 0.5;
  }

  .sheet .label {
    color: #cfc8b8;
    font-size: 13px;
  }

  .sheet .language {
    margin-left: 0;
  }

  .sheet .language .tb-button {
    justify-content: center;
    font-size: 15px;
  }

  /* Narrow windows: tighten everything so the whole bar still fits. */
  @media (max-width: 960px) {
    .toolbar {
      gap: 6px;
      padding: 10px 8px;
      font-size: 12px;
    }

    .group {
      gap: 4px;
    }

    .group + .group {
      padding-left: 6px;
    }

    .toolbar :global(.tb-button),
    .export :global(.trigger) {
      padding: 0 6px;
    }
  }

  /* EN | CS: two halves of one control. */
  .language {
    display: flex;
    margin-left: auto;
  }

  .language .tb-button {
    min-width: 34px;
    font-size: 12px;
    letter-spacing: 0.04em;
  }

  .language .tb-button:first-child {
    border-radius: 5px 0 0 5px;
  }

  .language .tb-button:last-child {
    border-left: none;
    border-radius: 0 5px 5px 0;
  }

  .language .tb-button[aria-pressed='true'] {
    background: rgb(255 255 255 / 0.25);
    border-color: rgb(255 255 255 / 0.4);
  }

  .toolbar .pin {
    font-size: 13px;
    opacity: 0.6;
  }

  .pin.active {
    opacity: 1;
    background: rgb(255 255 255 / 0.22);
  }
</style>
