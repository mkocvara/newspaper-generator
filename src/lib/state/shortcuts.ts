import type { Editor } from './editor.svelte'

// Inside a text box, Ctrl+Z / Ctrl+Y belong to the browser's native text undo.
function isTextEditing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
}

export function handleHistoryShortcut(event: KeyboardEvent, editor: Editor) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return
  if (isTextEditing(event.target)) return

  const key = event.key.toLowerCase()
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault()
    editor.undo()
  } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
    event.preventDefault()
    editor.redo()
  }
}
