import type { NameDecoration, NameEffect, Ornament } from '../model/types'

// Presets for ornaments that need a mirrored pair at a tuned size; any other
// symbols are picked as custom symbols.
// Their names are in the UI text (i18n `name.ornamentStyles`).
export const ORNAMENTS: { value: Ornament; symbols?: [string, string] }[] = [
  { value: 'none' },
  { value: 'fleurons', symbols: ['❧', '☙'] },
  { value: 'guillemets-in', symbols: ['»', '«'] },
  { value: 'guillemets-out', symbols: ['«', '»'] },
  { value: 'hands', symbols: ['☛', '☚'] },
  { value: 'curls', symbols: ['⊰', '⊱'] },
  { value: 'rules' },
  { value: 'custom' },
]

export const EFFECTS: NameEffect[] = ['none', 'shadow', 'extrude', 'engraved', 'outline', 'hatched']

// The symbols to show before and after the name, if any.
export function ornamentSymbols(decoration: NameDecoration): [string, string] | null {
  if (decoration.ornament === 'custom') {
    const before = decoration.customBefore.trim()
    const after = decoration.customAfter.trim() || before
    return before || after ? [before, after] : null
  }
  return ORNAMENTS.find((o) => o.value === decoration.ornament)?.symbols ?? null
}

// Suggestions for custom ornaments, offered as a grid of buttons. All are
// text symbols (no emoji-style ones, which wouldn't take the ink colour),
// grouped loosely: stars, flowers and leaves, shapes, crosses and marks,
// brackets and lines.
export const SYMBOL_CHOICES = [
  ...'✦✧★☆✪✯✶✷✸✹✺✻✼❋❊⁂⋆',
  ...'❦❧☙❥✿❀❁✾❃❖⚜☘',
  ...'◆◇◈●○◉◎■□▪▲△▼▽◀▶',
  ...'✠✚✜☩✙†‡§¶※☼☾♠♣♦♛♔',
  ...'«»‹›⟨⟩〈〉【】⊰⊱☛☚┃|‖¦—~⁓≈',
]
