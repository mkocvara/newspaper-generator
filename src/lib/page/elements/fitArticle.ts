import type { Attachment } from 'svelte/attachments'
import { overflows, refitOnChange, search } from '../../ui/fitText'
import { PT_PX } from './edit'

// Below these sizes an article gives up on fitting: the body is cut off with
// an ellipsis instead.
const BODY_MIN_PT = 5
const HEADING_MIN_PT = 6

const ITERATIONS = 10

export interface ArticleSizes {
  headingPt: number
  bodyPt: number
  // Anything else the fit depends on but can't observe (e.g. font family).
  watch?: unknown
}

// Fits an article's heading (.heading) and body (.body) into the article box,
// in order of preference:
// 1. the heading at its set size, the body shrunk to fit, down to BODY_MIN_PT;
// 2. the body at BODY_MIN_PT, the heading shrunk just enough to make room,
//    down to HEADING_MIN_PT;
// 3. both at their minimum, the body cut off with an ellipsis.
// Without body text the heading alone is shrunk to fit, if needed.
export function fitArticle({ headingPt, bodyPt }: ArticleSizes): Attachment<HTMLElement> {
  return (article) => {
    const heading = article.querySelector<HTMLElement>('.heading')!
    const body = article.querySelector<HTMLElement>('.body')!
    const headingMax = headingPt * PT_PX
    const headingMin = Math.min(headingMax, HEADING_MIN_PT * PT_PX)
    const bodyMax = bodyPt * PT_PX
    const bodyMin = Math.min(bodyMax, BODY_MIN_PT * PT_PX)

    const run = () => {
      body.style.removeProperty('-webkit-line-clamp')
      body.style.removeProperty('max-height')
      body.classList.remove('clamped')
      // Read from the DOM rather than the model, so it holds while typing.
      const hasBody = (body.textContent ?? '').trim() !== ''
      article.classList.toggle('has-body', hasBody)
      if (!hasBody) {
        search(heading, headingMax, headingMin)
        return
      }

      heading.style.fontSize = `${headingMax}px`
      search(body, bodyMax, bodyMin)
      if (!overflows(body)) return

      body.style.fontSize = `${bodyMin}px`
      heading.style.fontSize = `${headingMin}px`
      if (!overflows(body)) {
        let lo = headingMin
        let hi = headingMax
        for (let i = 0; i < ITERATIONS; i++) {
          const mid = (lo + hi) / 2
          heading.style.fontSize = `${mid}px`
          if (overflows(body)) hi = mid
          else lo = mid
        }
        heading.style.fontSize = `${lo}px`
        return
      }

      const style = getComputedStyle(body)
      const lineHeight = style.lineHeight.endsWith('px')
        ? parseFloat(style.lineHeight)
        : parseFloat(style.lineHeight) * parseFloat(style.fontSize)
      const lines = Math.max(1, Math.floor(body.clientHeight / lineHeight))
      body.style.setProperty('-webkit-line-clamp', String(lines))
      // Firefox draws the ellipsis but still paints the lines after it.
      body.style.maxHeight = `${lines * lineHeight}px`
      body.classList.add('clamped')
    }

    return refitOnChange(article, run)
  }
}
