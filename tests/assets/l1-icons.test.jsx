import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getL1Icon, ICONS } from '../../src/assets/icons/l1/index.js'

describe('L1 icon registry', () => {
  it('exports an icon component for every registered key', () => {
    expect(Object.keys(ICONS)).toHaveLength(10)
    Object.values(ICONS).forEach((Icon) => {
      expect(typeof Icon).toBe('function')
    })
  })

  it('returns the correct component for known keys', () => {
    expect(getL1Icon('copyright')).toBe(ICONS.copyright)
    expect(getL1Icon('hate')).toBe(ICONS.hate)
    expect(getL1Icon('community')).toBe(ICONS.community)
  })

  it('returns fallback for unknown keys', () => {
    expect(getL1Icon('unknown')).not.toBe(ICONS.copyright)
    expect(typeof getL1Icon('unknown')).toBe('function')
  })

  it('renders every icon as an svg', () => {
    Object.entries(ICONS).forEach(([key, Icon]) => {
      const { container } = render(<Icon data-testid={`icon-${key}`} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })
})
