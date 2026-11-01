import type { Element } from './types'

export type ElementType = Element['type']

export const ELEMENT_NAMES: Record<ElementType, string> = {
  eyecatcher: 'eyecatcher',
  text: 'text',
  image: 'image',
}

export function createElement(type: ElementType): Element {
  if (type === 'eyecatcher') return { type, main: '', sub: '' }
  if (type === 'text') return { type, heading: '', body: '' }
  return { type, assetId: null, caption: '', greyscale: false, fit: 'scale' }
}
