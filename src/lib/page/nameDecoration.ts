import type { NameDecoration, NameEffect, Ornament } from '../model/types'

export const ORNAMENTS: { value: Ornament; label: string; symbols?: [string, string] }[] = [
  { value: 'none', label: 'None' },
  { value: 'bars', label: 'Vertical bars', symbols: ['┃', '┃'] },
  { value: 'double-bars', label: 'Double bars', symbols: ['‖', '‖'] },
  { value: 'stars', label: 'Stars', symbols: ['★', '★'] },
  { value: 'diamonds', label: 'Diamonds', symbols: ['◆', '◆'] },
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
