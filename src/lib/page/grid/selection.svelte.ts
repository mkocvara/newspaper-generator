import type { Attachment } from 'svelte/attachments'

// Touchscreens have no hover, so a cell's editing controls (grip, menu,
// resize pills, image tools) appear once it's selected: the first tap on a
// cell selects it (without placing the cursor), later taps edit as usual, and
// a tap outside the cells deselects. Mouse users never select anything.

class CellSelection {
  cellId = $state<string | null>(null)
}

export const selection = new CellSelection()

const touchscreen = () => window.matchMedia('(hover: none)').matches

// How far a finger may move and still count as a tap, in px.
const TAP_SLOP = 10

// Calls `onTap` for single-finger taps inside the node (not drags or
// pinches); returning true from it cancels the tap's default (focus, click).
function onTaps(node: HTMLElement, onTap: (event: TouchEvent) => boolean): () => void {
  let start: { x: number; y: number } | null = null
  const onStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    start = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
  }
  const onMove = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (start && (event.touches.length > 1 || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > TAP_SLOP)) {
      start = null
    }
  }
  const onEnd = (event: TouchEvent) => {
    if (start && event.touches.length === 0 && touchscreen() && onTap(event)) event.preventDefault()
    start = null
  }
  const options = { capture: true }
  node.addEventListener('touchstart', onStart, { capture: true, passive: true })
  node.addEventListener('touchmove', onMove, { capture: true, passive: true })
  node.addEventListener('touchend', onEnd, options)
  return () => {
    node.removeEventListener('touchstart', onStart, options)
    node.removeEventListener('touchmove', onMove, options)
    node.removeEventListener('touchend', onEnd, options)
  }
}

// On a cell: its first tap selects it and does nothing else, except finish
// editing elsewhere (which commits that text and closes the keyboard).
export function selectOnTap(cellId: () => string): Attachment<HTMLElement> {
  return (node) =>
    onTaps(node, () => {
      if (selection.cellId === cellId()) return false
      selection.cellId = cellId()
      const active = document.activeElement
      if (active instanceof HTMLElement && !node.contains(active)) active.blur()
      return true
    })
}

// On the page's surroundings: a tap that isn't on a cell (or an open menu,
// which lives outside the page) deselects.
export const deselectOnTapOutside: Attachment<HTMLElement> = (node) =>
  onTaps(node, (event) => {
    const target = event.target as Element
    if (!target.closest('.cell, .popover')) selection.cellId = null
    return false
  })
