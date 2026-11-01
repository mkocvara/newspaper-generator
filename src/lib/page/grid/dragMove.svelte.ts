// The cell being dragged to a new place, and the cell under the pointer.
export const drag = $state<{ fromId: string | null; overId: string | null }>({ fromId: null, overId: null })
