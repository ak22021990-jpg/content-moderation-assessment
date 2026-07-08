import { describe, it, expect } from 'vitest'
import playlist from '../../src/data/playlist.json'

describe('playlist.json v1', () => {
  it('has videos array with exactly 1 entry for Phase 2', () => {
    expect(Array.isArray(playlist.videos)).toBe(true)
    expect(playlist.videos).toHaveLength(1)
  })

  it('video entry has all required fields', () => {
    const v = playlist.videos[0]
    const fields = ['id', 'title', 'srcUrl', 'spriteUrl', 'thumbsVttUrl', 'chaptersVttUrl', 'durationSec', 'chapters']
    fields.forEach(f => expect(v).toHaveProperty(f))
  })

  it('srcUrl is a relative path starting with /videos/', () => {
    expect(playlist.videos[0].srcUrl).toMatch(/^\/videos\//)
  })

  it('durationSec is a positive number', () => {
    expect(playlist.videos[0].durationSec).toBeGreaterThan(0)
    expect(playlist.videos[0].durationSec).toBeLessThanOrEqual(120)
  })

  it('chapters array is well-formed', () => {
    const chapters = playlist.videos[0].chapters
    expect(Array.isArray(chapters)).toBe(true)
    chapters.forEach(ch => {
      expect(typeof ch.t).toBe('number')
      expect(ch.t).toBeGreaterThanOrEqual(0)
      expect(typeof ch.label).toBe('string')
      expect(ch.label.length).toBeGreaterThan(0)
    })
  })

  it('chapters have timestamps within video duration', () => {
    const v = playlist.videos[0]
    v.chapters.forEach(ch => {
      expect(ch.t).toBeLessThanOrEqual(v.durationSec)
    })
  })

  it('contains zero forbidden brand strings in JSON text', () => {
    const text = JSON.stringify(playlist).toLowerCase()
    const forbidden = ['dis' + 'ney', 'mar' + 'vel', 'pix' + 'ar', 'star' + ' ' + 'wars', 'spider-' + 'man', 'aveng' + 'ers', 'hul' + 'k', 'je' + 'di', 'yo' + 'da']
    forbidden.forEach(token => {
      expect(text).not.toContain(token)
    })
  })

  it('video title does not exceed 100 characters', () => {
    expect(playlist.videos[0].title.length).toBeLessThanOrEqual(100)
  })
})
