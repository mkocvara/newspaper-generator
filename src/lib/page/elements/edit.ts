import { findNode } from '../../model/grid'
import type { Element } from '../../model/types'
import { editor } from '../../state/editor.svelte'

// Change fields of the element in a cell part, as one undoable step.
export function patchElement<T extends Element>(leafId: string, patch: Partial<T>) {
  editor.update((page) => {
    const leaf = findNode(page.grid, leafId)
    if (leaf?.kind === 'leaf' && leaf.element) Object.assign(leaf.element, patch)
  })
}

// Font sizes are set in points in the styling options.
export const PT_PX = 96 / 72
