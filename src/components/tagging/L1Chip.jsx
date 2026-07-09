import { motion, useReducedMotion } from 'framer-motion'
import Tooltip from '../ui/Tooltip.jsx'
import L2Chip from './L2Chip.jsx'

export default function L1Chip({ category, isSelected, selectedL2, onToggleL1, onToggleL2 }) {
  const reduce = useReducedMotion()

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend style={{ display: 'none' }}>{category.label}</legend>
      <Tooltip content={category.definition} placement="top">
        <motion.button
          className={`cma-tag-chip cma-tag-chip--l1${isSelected ? ' cma-tag-chip--selected' : ''}`}
          role="checkbox"
          aria-checked={isSelected}
          onClick={() => onToggleL1(category.id)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              onToggleL1(category.id)
            }
          }}
          whileHover={reduce ? {} : { scale: 1.015, y: -1 }}
          whileTap={reduce ? {} : { scale: 0.985 }}
          style={{
            width: '100%',
            textAlign: 'left',
            background: isSelected
              ? 'var(--accent-gradient)'
              : 'rgba(255, 255, 255, 0.55)',
            color: isSelected ? '#fff' : 'var(--text-primary)',
            border: `1.5px solid ${isSelected ? 'transparent' : 'rgba(42, 27, 61, 0.10)'}`,
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            backdropFilter: 'blur(12px)',
            transition: 'background 0.25s, color 0.25s, border-color 0.25s, box-shadow 0.25s',
            boxShadow: isSelected
              ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 24px -6px rgba(233, 58, 154, 0.45)'
              : 'inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          {category.label}
        </motion.button>
      </Tooltip>

      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '8px 0 8px 12px',
            borderLeft: '2px solid rgba(233, 58, 154, 0.35)',
            marginLeft: '16px',
            marginTop: '8px',
          }}
        >
          {category.subcategories.map(sub => (
            <L2Chip
              key={sub.id}
              subcategory={sub}
              isSelected={selectedL2.includes(sub.id)}
              onToggle={onToggleL2}
            />
          ))}
        </motion.div>
      )}
    </fieldset>
  )
}
