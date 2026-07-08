export const initialTagState = { selectedL1: [], selectedL2: [] }

export function tagReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_L1': {
      const l1Id = action.id
      if (state.selectedL1.includes(l1Id)) {
        const nextL1 = state.selectedL1.filter(id => id !== l1Id)
        const keptL2 = state.selectedL2.filter(l2Id => {
          const parentL1 = l2Id.split('.')[0]
          return nextL1.includes(parentL1)
        })
        return { ...state, selectedL1: nextL1, selectedL2: keptL2 }
      }
      return { ...state, selectedL1: [...state.selectedL1, l1Id] }
    }
    case 'TOGGLE_L2': {
      const l2Id = action.id
      if (state.selectedL2.includes(l2Id)) {
        return { ...state, selectedL2: state.selectedL2.filter(id => id !== l2Id) }
      }
      return { ...state, selectedL2: [...state.selectedL2, l2Id] }
    }
    case 'RESET':
      return initialTagState
    default:
      return state
  }
}
