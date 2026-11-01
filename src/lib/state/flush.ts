// Lets the app ask the focused text box to commit its in-progress edit
// (e.g. right before autosaving when the tab is hidden or closed).
const EVENT = 'newspaper:flush-edits'

export function flushEdits() {
  window.dispatchEvent(new Event(EVENT))
}

export function onFlushEdits(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}
