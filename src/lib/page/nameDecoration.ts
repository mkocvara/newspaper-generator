import type { NameDecoration, NameEffect, Ornament } from '../model/types'

// Presets for ornaments that need a mirrored pair at a tuned size; any other
// symbols are picked as custom symbols.
export const ORNAMENTS: { value: Ornament; label: string; symbols?: [string, string] }[] = [
  { value: 'none', label: 'None' },
  { value: 'fleurons', label: 'Fleurons', symbols: ['❧', '☙'] },
  { value: 'rules', label: 'Extending rules' },
  { value: 'custom', label: 'Custom symbols' },
]

export const EFFECTS: { value: NameEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'shadow', label: 'Drop shadow' },
  { value: 'extrude', label: '3D extrude' },
  { value: 'engraved', label: 'Engraved' },
  { value: 'outline', label: 'Outline' },
  { value: 'hatched', label: 'Hatched' },
]

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
  ...'«»‹›⟨⟩〈〉【】┃|‖¦—~⁓≈',
]
