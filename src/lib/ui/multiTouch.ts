// Counts the fingers on the screen. Two fingers pan and pinch-zoom the page
// (see Viewport), so when a second finger lands, any one-finger drag in
// progress (resizing, moving a cell, panning a cropped image) is cancelled
// and undone, and no new one starts while two fingers are down.

const touches = new Set<number>()
const cancels = new Set<() => void>()

if (typeof window !== 'undefined') {
  const options = { capture: true }
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'touch') return
      touches.add(event.pointerId)
      if (touches.size >= 2) for (const cancel of [...cancels]) cancel()
    },
    options,
  )
  const lift = (event: PointerEvent) => touches.delete(event.pointerId)
  window.addEventListener('pointerup', lift, options)
  window.addEventListener('pointercancel', lift, options)
}

// Whether two or more fingers are down (so a drag shouldn't start).
export const multiTouch = () => touches.size >= 2

// While a drag runs: `cancel` is called if a second finger lands. Returns
// the function to call when the drag ends normally.
export function cancelOnMultiTouch(cancel: () => void): () => void {
  const once = () => {
    cancels.delete(once)
    cancel()
  }
  cancels.add(once)
  return () => cancels.delete(once)
}
