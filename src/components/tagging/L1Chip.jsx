import L2Chip from './L2Chip.jsx'

export default function L1Chip({ category, isSelected, selectedL2, onToggleL1, onToggleL2 }) {
  return (
    <fieldset>
      <legend style={{ display: 'none' }}>{category.label}</legend>
      <button
        role="checkbox"
        aria-checked={isSelected}
        className={`cma-tag-chip cma-tag-chip--l1${isSelected ? ' cma-tag-chip--selected' : ''}`}
        onClick={() => onToggleL1(category.id)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onToggleL1(category.id)
          }
        }}
      >
        {category.label}
      </button>
      {isSelected && (
        <div className="cma-tag-l2-list">
          {category.subcategories.map(sub => (
            <L2Chip
              key={sub.id}
              subcategory={sub}
              isSelected={selectedL2.includes(sub.id)}
              onToggle={onToggleL2}
            />
          ))}
        </div>
      )}
    </fieldset>
  )
}
