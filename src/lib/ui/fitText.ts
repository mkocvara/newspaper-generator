import type { Attachment } from 'svelte/attachments'

export interface FitOptions {
  // Largest font size to try, in px.
  max: number
  min?: number
  // Anything else the fit depends on but can't observe (e.g. font family);
  // changing it re-creates the attachment and re-fits.
  watch?: unknown
}

const ITERATIONS = 10

function overflows(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + 0.5 || el.scrollHeight > el.clientHeight + 0.5
}

// Binary-search the largest font size at which the element's content fits
// inside its own box. The element needs a definite size and overflow: hidden.
export function fit(el: HTMLElement, max: number, min = 4) {
  el.style.fontSize = `${max}px`
  if (!overflows(el)) return
  let lo = min
  let hi = max
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (lo + hi) / 2
    el.style.fontSize = `${mid}px`
    if (overflows(el)) hi = mid
    else lo = mid
  }
  el.style.fontSize = `${lo}px`
}

// Keeps text fitted as the box resizes, the text changes, or fonts load.
export function fitText(options: FitOptions): Attachment<HTMLElement> {
  return (el) => {
    const run = () => fit(el, options.max, options.min)
    run()

    const resize = new ResizeObserver(run)
    resize.observe(el)
    const mutation = new MutationObserver(run)
    mutation.observe(el, { subtree: true, childList: true, characterData: true })
    document.fonts.addEventListener('loadingdone', run)

    return () => {
      resize.disconnect()
      mutation.disconnect()
      document.fonts.removeEventListener('loadingdone', run)
    }
  }
}
