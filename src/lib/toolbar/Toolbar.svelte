<script lang="ts">
  import { exportBasename, exportPage, exportWorkFile, type ExportKind } from '../export'
  import { parseWorkFile } from '../model/workfile'
  import { editor } from '../state/editor.svelte'
  import Menu from '../ui/Menu.svelte'
  import NewPaperDialog from './NewPaperDialog.svelte'
  import StylePanels from './StylePanels.svelte'

  // Sticky top bar. Unless pinned, it slides away when not hovered (a small tab
  // hints at it) and comes back when the pointer enters the strip it occupies. Showing and hiding is pure CSS (see the styles).
  let { pinned = $bindable(false) }: { pinned?: boolean } = $props()

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
    say('Exporting…')
    try {
      if (kind === 'json') exportWorkFile(editor.toWorkFile(), basename())
      else await exportPage(kind, basename())
      say('Exported.')
    } catch (error) {
      console.error(error)
      say('Export failed. See the browser console for details.')
    } finally {
      busy = false
    }
  }

  async function runImport(file: File | undefined) {
    if (!file) return
    try {
      const parsed = parseWorkFile(JSON.parse(await file.text()))
      if (!parsed) return say(`${file.name} isn't a newspaper preset.`)
      editor.importFile(parsed)
      say(`Imported ${file.name}. Undo (Ctrl+Z) brings back the previous page.`)
    } catch {
      say(`Couldn't read ${file.name}.`)
    }
  }
</script>

<div class="hot-zone" aria-hidden="true"><span class="hint-tab">▾</span></div>

<div class="toolbar" class:pinned role="toolbar" aria-label="Newspaper tools">
  <div class="group">
    <button
      type="button"
      class="tb-button icon"
      title="Undo (Ctrl+Z)"
      aria-label="Undo"
      disabled={!editor.canUndo}
      onclick={() => editor.undo()}>↶</button
    >
    <button
      type="button"
      class="tb-button icon"
      title="Redo (Ctrl+Y)"
      aria-label="Redo"
      disabled={!editor.canRedo}
      onclick={() => editor.redo()}>↷</button
    >
  </div>

  <div class="group">
    <StylePanels />
  </div>

  <div class="group">
    <button type="button" class="tb-button" onclick={() => importInput?.click()}>Import</button>
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
        label="Export"
        icon={busy ? 'Exporting…' : 'Export'}
        caret={!busy}
        items={[
          { label: 'Image (PNG)', action: () => runExport('png') },
          { label: 'Image (JPG)', action: () => runExport('jpeg') },
          { label: 'PDF', action: () => runExport('pdf') },
          'separator',
          { label: 'Importable preset', action: () => runExport('json') },
        ]}
      />
    </div>
    <NewPaperDialog
      onexport={() => runExport('json')}
      onconfirm={() => {
        editor.reset()
        say('Started a new paper. Undo (Ctrl+Z) brings back the previous one.')
      }}
    />
  </div>

  <span class="status" role="status">{status}</span>

  <button
    type="button"
    class="tb-button icon pin"
    class:active={pinned}
    aria-pressed={pinned}
    title={pinned ? 'Unpin: hide the toolbar when not in use' : 'Pin: keep the toolbar visible'}
    aria-label="Pin toolbar"
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
    height: 56px;
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
    align-items: center;
    gap: 16px;
    height: 56px;
    padding: 0 16px;
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
    padding-left: 16px;
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
    padding: 0 10px;
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

  .status {
    flex: 1;
    min-width: 0;
    color: #cfc8b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
