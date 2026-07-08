import { describe, it, expect } from 'vitest'
import taxonomy from '../src/data/taxonomy.json'

// NOTE: Brand-token guard is handled by the pre-commit hook (.husky/pre-commit) and
// CI workflow (.github/workflows/brand-guard.yml) which scan all staged diffs against
// the pattern in docs/brand-guardrails.md. No in-test duplicate needed — the hook is
// the authoritative gate and runs on every commit.

describe('taxonomy.json schema', () => {
  it('has version field equal to 0.2.0-draft', () => {
    expect(taxonomy.version).toBe('0.2.0-draft')
  })

  it('has categories array with exactly 10 elements', () => {
    expect(Array.isArray(taxonomy.categories)).toBe(true)
    expect(taxonomy.categories).toHaveLength(10)
  })

  it('every category has non-empty string id and label', () => {
    for (const cat of taxonomy.categories) {
      expect(typeof cat.id).toBe('string')
      expect(cat.id.length).toBeGreaterThan(0)
      expect(typeof cat.label).toBe('string')
      expect(cat.label.length).toBeGreaterThan(0)
    }
  })

  it('every L1 has non-empty definition string', () => {
    for (const cat of taxonomy.categories) {
      expect(typeof cat.definition).toBe('string')
      expect(cat.definition.length).toBeGreaterThan(0)
    }
  })

  it('every L2 has non-empty definition string', () => {
    for (const cat of taxonomy.categories) {
      for (const sub of cat.subcategories) {
        expect(typeof sub.definition).toBe('string')
        expect(sub.definition.length).toBeGreaterThan(0)
      }
    }
  })

  it('every L2 has non-empty example string', () => {
    for (const cat of taxonomy.categories) {
      for (const sub of cat.subcategories) {
        expect(typeof sub.example).toBe('string')
        expect(sub.example.length).toBeGreaterThan(0)
      }
    }
  })

  it('every category has subcategories array with at least 1 element', () => {
    for (const cat of taxonomy.categories) {
      expect(Array.isArray(cat.subcategories)).toBe(true)
      expect(cat.subcategories.length).toBeGreaterThan(0)
    }
  })

  it('every subcategory has non-empty string id and label', () => {
    for (const cat of taxonomy.categories) {
      for (const sub of cat.subcategories) {
        expect(typeof sub.id).toBe('string')
        expect(sub.id.length).toBeGreaterThan(0)
        expect(typeof sub.label).toBe('string')
        expect(sub.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('subcategory ids follow parent.child format', () => {
    for (const cat of taxonomy.categories) {
      for (const sub of cat.subcategories) {
        expect(sub.id).toMatch(/^\d+\.\d+$/)
        expect(sub.id.startsWith(cat.id + '.')).toBe(true)
      }
    }
  })

  it('all ids across the taxonomy are unique', () => {
    const allIds = [
      ...taxonomy.categories.map((c) => c.id),
      ...taxonomy.categories.flatMap((c) => c.subcategories.map((s) => s.id)),
    ]
    const unique = new Set(allIds)
    expect(unique.size).toBe(allIds.length)
  })

  it('category ids are strings 1 through 10', () => {
    const ids = taxonomy.categories.map((c) => c.id)
    expect(ids).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
  })
})
