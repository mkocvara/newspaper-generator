import type { Attachment } from 'svelte/attachments'

export interface FitOptions {
  // Largest font size to try, in px.
  max: number
  min?: number
  // If set, the text may wrap between words, but only when wrapping allows a
  // font at least this many times larger than keeping it on one line.
  wrapGain?: number
  // Anything else the fit depends on but can't observe (e.g. font family);
  // changing it re-creates the attachment and re-fits.
  watch?: unknown
}

const ITERATIONS = 10
const REFIT_EVENT = 'newspaper:refit'

// Re-fit all text now, e.g. after switching the page into export mode (which
// hides placeholders and so frees up space).
export function refitAll() {
  window.dispatchEvent(new Event(REFIT_EVENT))
}

function overflows(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + 0.5 || el.scrollHeight > el.clientHeight + 0.5
}

// Binary-search the largest font size at which the element's content fits
// inside its own box; leaves it applied and returns it.
function search(el: HTMLElement, max: number, min: number): number {
  el.style.fontSize = `${max}px`
  if (!overflows(el)) return max
  let lo = min
  let hi = max
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (lo + hi) / 2
    el.style.fontSize = `${mid}px`
    if (overflows(el)) hi = mid
    else lo = mid
  }
  el.style.fontSize = `${lo}px`
  return lo
}

// Fit the element's text to its box. The element needs a definite size and
// overflow: hidden. With `wrapGain`, its text must inherit `white-space`.
export function fit(el: HTMLElement, { max, min = 4, wrapGain }: FitOptions) {
  if (wrapGain === undefined) {
    search(el, max, min)
    return
  }
  el.style.whiteSpace = 'nowrap'
  const single = search(el, max, min)
  el.style.whiteSpace = 'normal'
  const wrapped = search(el, max, min)
  if (wrapped < single * wrapGain) {
    el.style.whiteSpace = 'nowrap'
    el.style.fontSize = `${single}px`
  }
}

// Keeps text fitted as the box resizes, the text changes, or fonts load.
export function fitText(options: FitOptions): Attachment<HTMLElement> {
  return (el) => {
    const run = () => fit(el, options)
    run()

    const resize = new ResizeObserver(run)
    resize.observe(el)
    const mutation = new MutationObserver(run)
    mutation.observe(el, { subtree: true, childList: true, characterData: true })
    document.fonts.addEventListener('loadingdone', run)
    window.addEventListener(REFIT_EVENT, run)

    return () => {
      resize.disconnect()
      mutation.disconnect()
      document.fonts.removeEventListener('loadingdone', run)
      window.removeEventListener(REFIT_EVENT, run)
    }
  }
}
