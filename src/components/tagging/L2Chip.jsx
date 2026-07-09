import { motion, useReducedMotion } from 'framer-motion'
import Tooltip from '../ui/Tooltip.jsx'

export default function L2Chip({ subcategory, isSelected, onToggle }) {
  const reduce = useReducedMotion()
  const tooltipContent = `${subcategory.definition}${subcategory.example ? ` Example: ${subcategory.example}` : ''}`

  return (
    <Tooltip content={tooltipContent} placement="top">
      <motion.button
        className={`cma-tag-chip cma-tag-chip--l2${isSelected ? ' cma-tag-chip--selected' : ''}`}
        role="checkbox"
        aria-checked={isSelected}
        onClick={() => onToggle(subcategory.id)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onToggle(subcategory.id)
          }
        }}
        whileHover={reduce ? {} : { scale: 1.04, y: -1 }}
        whileTap={reduce ? {} : { scale: 0.96 }}
        style={{
          position: 'relative',
          background: isSelected
            ? 'var(--candy-mint)'
            : 'rgba(255, 255, 255, 0.7)',
          color: isSelected ? 'var(--candy-mint-ink)' : 'var(--text-primary)',
          border: `1.5px solid ${isSelected ? 'var(--candy-mint-ink)' : 'rgba(42, 27, 61, 0.10)'}`,
          borderRadius: 'var(--radius-pill)',
          padding: '10px 16px',
          minHeight: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          backdropFilter: 'blur(10px)',
          transition: 'background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s',
          boxShadow: isSelected
            ? 'inset 0 1px 0 rgba(255,255,255,0.55), 0 4px 12px -4px rgba(52, 199, 154, 0.35)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {subcategory.label}
      </motion.button>
    </Tooltip>
  )
}
