import { useReducer, useEffect } from 'react'
import taxonomy from '../../data/taxonomy.json'
import { tagReducer, initialTagState } from './tagReducer.js'
import L1Chip from './L1Chip.jsx'

const noop = () => {}

export default function TagPanel({ onSelectionChange = noop }) {
  const [state, dispatch] = useReducer(tagReducer, initialTagState)

  useEffect(() => {
    onSelectionChange(state.selectedL1, state.selectedL2)
  }, [state.selectedL1, state.selectedL2, onSelectionChange])

  return (
    <section className="cma-tag-panel" aria-label="Content moderation tags">
      <div className="cma-tag-l1-list">
        {taxonomy.categories.map(cat => (
          <L1Chip
            key={cat.id}
            category={cat}
            isSelected={state.selectedL1.includes(cat.id)}
            selectedL2={state.selectedL2}
            onToggleL1={(id) => dispatch({ type: 'TOGGLE_L1', id })}
            onToggleL2={(id) => dispatch({ type: 'TOGGLE_L2', id })}
          />
        ))}
      </div>
    </section>
  )
}
