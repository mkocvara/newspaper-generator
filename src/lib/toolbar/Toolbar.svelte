<script lang="ts">
  import { i18n, LANGUAGES, type Language } from '../i18n/i18n.svelte'
  import { exportBasename, exportPage, exportWorkFile, type ExportKind } from '../export'
  import { createDefaultPage } from '../model/defaults'
  import { parseWorkFile } from '../model/workfile'
  import { editor } from '../state/editor.svelte'
  import Menu from '../ui/Menu.svelte'
  import NewPaperDialog from './NewPaperDialog.svelte'
  import StylePanels from './StylePanels.svelte'

  // Sticky top bar. Unless pinned, it slides away when not hovered (a small tab
  // hints at it) and comes back when the pointer enters the strip it occupies. Showing and hiding is pure CSS (see the styles).
  // `height` reports the bar's height, which grows if it wraps onto a second
  // row in a narrow window (or with longer labels in another language).
  let { pinned = $bindable(false), height = $bindable(56) }: { pinned?: boolean; height?: number } = $props()

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
      if (kind === 'json') exportWorkFile(editor.toWorkFile(), basename())
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
      const parsed = parseWorkFile(JSON.parse(await file.text()))
      if (!parsed) return say(i18n.t.status.notPreset(file.name))
      editor.importFile(parsed)
      say(i18n.t.status.imported(file.name))
    } catch {
      say(i18n.t.status.unreadable(file.name))
    }
  }
</script>

<div class="hot-zone" aria-hidden="true" style:height="{height}px"><span class="hint-tab">▾</span></div>

<div class="toolbar" class:pinned role="toolbar" aria-label={i18n.t.toolbar.tools} bind:offsetHeight={height}>
  <div class="group">
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
  </div>

  <div class="group">
    <StylePanels />
  </div>

  <div class="group">
    <button type="button" class="tb-button" onclick={() => importInput?.click()}>{i18n.t.toolbar.import}</button>
    <input
      bind:this={importInput}
      type="file"
      accept=".json,application/json"
      hidden
      onchange={(e) => {
        runImport(e.currentTarget.files?.[0])
        e.currentTarget.value = ''
      }}
    />
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
    <NewPaperDialog
      onexport={() => runExport('json')}
      onconfirm={() => {
        editor.reset(createDefaultPage(new Date(), i18n.t.page.footerDefault))
        say(i18n.t.status.newPaper)
      }}
    />
  </div>

  <span class="status" role="status">{status}</span>

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
