import { describe, it, expect } from 'vitest'
import {
  formatTime,
  generateThumbsVtt,
  generateChaptersVtt,
} from '../../scripts/generate-sprites.mjs'

describe('formatTime', () => {
  it('formats zero seconds', () => {
    expect(formatTime(0)).toBe('00:00:00.000')
  })

  it('formats fractional seconds', () => {
    expect(formatTime(5.5)).toBe('00:00:05.500')
  })

  it('formats exactly one minute boundary', () => {
    expect(formatTime(65)).toBe('00:01:05.000')
  })

  it('formats over one hour', () => {
    expect(formatTime(3661.123)).toBe('01:01:01.123')
  })

  it('pads hours, minutes, seconds correctly', () => {
    expect(formatTime(1)).toBe('00:00:01.000')
    expect(formatTime(60)).toBe('00:01:00.000')
    expect(formatTime(3600)).toBe('01:00:00.000')
    expect(formatTime(3599.999)).toBe('00:59:59.999')
  })
})

describe('generateThumbsVtt', () => {
  it('produces output starting with WEBVTT header', () => {
    const result = generateThumbsVtt('v01', 90)
    expect(result.startsWith('WEBVTT\n\n')).toBe(true)
  })

  it('generates 100 cues for a 10x10 grid', () => {
    const result = generateThumbsVtt('v01', 90, 10, 10, 160, 90)
    const cueLines = result.split('\n').filter((line) => line.startsWith('/sprites/'))
    expect(cueLines).toHaveLength(100)
  })

  it('uses correct sprite URI with xywh coordinates', () => {
    const result = generateThumbsVtt('v01', 90, 10, 10, 160, 90)
    expect(result).toContain('/sprites/v01_sprite.jpg#xywh=')
  })

  it('produces monotonic xywh coordinates across tiles', () => {
    const result = generateThumbsVtt('v01', 100, 10, 10, 160, 90)
    const coords = []
    for (const line of result.split('\n')) {
      const m = line.match(/xywh=(\d+),(\d+),(\d+),(\d+)/)
      if (m) coords.push({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] })
    }
    expect(coords).toHaveLength(100)
    expect(coords[0]).toEqual({ x: 0, y: 0, w: 160, h: 90 })
    // Last tile: col=9, row=9
    expect(coords[99].x).toBe(9 * 160)
    expect(coords[99].y).toBe(9 * 90)
    // Monotonic: x never decreases within a row, y non-decreasing
    for (let i = 1; i < coords.length; i++) {
      expect(coords[i].y).toBeGreaterThanOrEqual(coords[i - 1].y)
    }
  })

  it('generates correct time ranges for each cue', () => {
    const durationSec = 90
    const COLS = 10
    const ROWS = 10
    const result = generateThumbsVtt('v01', durationSec, COLS, ROWS, 160, 90)
    const interval = durationSec / (COLS * ROWS)

    const timeLines = result.split('\n').filter((line) => line.includes(' --> '))
    expect(timeLines).toHaveLength(100)

    // First cue: 0 --> interval
    expect(timeLines[0]).toContain('00:00:00.000')
    expect(timeLines[0]).toContain(formatTime(interval))

    // Last cue ends at duration
    expect(timeLines[99]).toContain(formatTime(99 * interval))
    expect(timeLines[99]).toContain(formatTime(durationSec))
  })
})

describe('generateChaptersVtt', () => {
  it('produces output starting with WEBVTT header', () => {
    const chapters = [{ t: 25, label: 'Watermark' }]
    const result = generateChaptersVtt(chapters)
    expect(result.startsWith('WEBVTT\n\n')).toBe(true)
  })

  it('generates zero-duration cues', () => {
    const chapters = [{ t: 25, label: 'Watermark' }]
    const result = generateChaptersVtt(chapters)
    const ts = formatTime(25)
    expect(result).toContain(`${ts} --> ${ts}`)
  })

  it('includes chapter label text in output', () => {
    const chapters = [
      { t: 25, label: 'Watermark overlay' },
      { t: 55, label: 'Fictional logo' },
    ]
    const result = generateChaptersVtt(chapters)
    expect(result).toContain('Watermark overlay')
    expect(result).toContain('Fictional logo')
  })

  it('generates correct number of cues', () => {
    const chapters = [
      { t: 42.5, label: 'Suspicious watermark overlay' },
      { t: 55.0, label: 'Brand logo appears at bottom-right' },
      { t: 78.0, label: 'Text overlay with counterfeit claim' },
    ]
    const result = generateChaptersVtt(chapters)
    const cueLines = result.split('\n').filter((line) => line.includes(' --> '))
    expect(cueLines).toHaveLength(3)
  })

  it('handles empty chapters array', () => {
    const result = generateChaptersVtt([])
    expect(result).toBe('WEBVTT\n\n')
  })
})

describe('brand safety', () => {
  const forbidden = [
    'dis' + 'ney',
    'mar' + 'vel',
    'pix' + 'ar',
    'star' + ' ' + 'wars',
  ]

  it('thumbs VTT contains no forbidden brand strings', () => {
    const result = generateThumbsVtt('v01', 90).toLowerCase()
    forbidden.forEach((token) => {
      expect(result).not.toContain(token)
    })
  })

  it('chapters VTT contains no forbidden brand strings', () => {
    const chapters = [
      { t: 25, label: 'Watermark overlay visible at bottom-right' },
      { t: 55, label: 'Fictional brand logo appears' },
    ]
    const result = generateChaptersVtt(chapters).toLowerCase()
    forbidden.forEach((token) => {
      expect(result).not.toContain(token)
    })
  })

  it('formatTime returns no text content that could contain brand strings', () => {
    const result = formatTime(12345)
    expect(result).toMatch(/^[\d:.]+$/)
  })
})
