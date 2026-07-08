export default function L2Chip({ subcategory, isSelected, onToggle }) {
  const descId = `l2-${subcategory.id.replace(/\./g, '-')}-desc`

  return (
    <button
      role="checkbox"
      aria-checked={isSelected}
      aria-describedby={descId}
      className={`cma-tag-chip cma-tag-chip--l2${isSelected ? ' cma-tag-chip--selected' : ''}`}
      onClick={() => onToggle(subcategory.id)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggle(subcategory.id)
        }
      }}
    >
      {subcategory.label}
      <span id={descId} className="cma-sr-only">
        {subcategory.definition} Example: {subcategory.example}
      </span>
    </button>
  )
}
