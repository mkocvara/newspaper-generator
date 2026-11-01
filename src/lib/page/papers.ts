import type { PaperStyle } from '../model/types'

// The papers on offer; their look is in papers.css (class `paper-<value>`).
export const PAPERS: { value: PaperStyle; label: string }[] = [
  { value: 'newsprint', label: 'Newsprint' },
  { value: 'aged', label: 'Old & stained' },
  { value: 'modern', label: 'Modern plain' },
  { value: 'modern-creased', label: 'Modern, creased' },
  { value: 'white', label: 'Plain white' },
]
