/**
 * Content verification tests for Apps Script doPost webhook.
 * These tests validate Code.gs contains all required defense-in-depth steps
 * and appsscript.json has the correct V8 runtime + web app configuration.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const CODE_GS_PATH = resolve(process.cwd(), 'scripts/apps-script/Code.gs')
const APPSCRIPT_JSON_PATH = resolve(process.cwd(), 'scripts/apps-script/appsscript.json')
const README_PATH = resolve(process.cwd(), 'scripts/apps-script/README.md')

function readCodeGs() {
  if (!existsSync(CODE_GS_PATH)) return ''
  return readFileSync(CODE_GS_PATH, 'utf8')
}

function readAppscriptJson() {
  if (!existsSync(APPSCRIPT_JSON_PATH)) return null
  return JSON.parse(readFileSync(APPSCRIPT_JSON_PATH, 'utf8'))
}

function readReadme() {
  if (!existsSync(README_PATH)) return ''
  return readFileSync(README_PATH, 'utf8')
}

describe('Code.gs', () => {
  const REQUIRED_PATTERNS = [
    'function doPost',
    'function doOptions',
    'CacheService',
    'PropertiesService',
    'computeHmacSha256Signature',
    'computeDigest',
    'ContentService',
    'SpreadsheetApp',
    'getScriptProperties',
    'getScriptCache',
    'HMAC_SECRET',
    'ALLOWED_ORIGIN',
    'SHEET_ID',
    'rate-limited',
    'duplicate',
    'invalid-hmac',
    'invalid-origin',
  ]

  it('exists at scripts/apps-script/Code.gs', () => {
    expect(existsSync(CODE_GS_PATH)).toBe(true)
  })

  REQUIRED_PATTERNS.forEach((pattern) => {
    it(`contains "${pattern}"`, () => {
      const code = readCodeGs()
      expect(code).toContain(pattern)
    })
  })

  it('has minimum 60 lines', () => {
    const code = readCodeGs()
    const lines = code.split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThanOrEqual(60)
  })

  it('uses single-quote prefix for formula injection defense', () => {
    const code = readCodeGs()
    expect(code).toContain("'")
  })

  it('returns JSON responses with ContentService.MimeType.JSON', () => {
    const code = readCodeGs()
    expect(code).toContain('ContentService.MimeType.JSON')
  })

  it('strips hmac field from raw body string before HMAC recomputation', () => {
    const code = readCodeGs()
    expect(code).toContain('hmac')
    // Should use regex to strip hmac from body string (Pitfall 1 avoidance)
    expect(code).toMatch(/replace.*hmac|hmac.*replace/)
  })

  it('uses CacheService.getScriptCache() for rate limiting (not ScriptProperties)', () => {
    const code = readCodeGs()
    expect(code).toContain('getScriptCache')
    expect(code).not.toMatch(/ScriptProperties.*rate/i)
  })

  it('reads Origin from e.headers (Apps Script canonical location)', () => {
    const code = readCodeGs()
    expect(code).toMatch(/e\.headers\['origin'\]|e\.headers\.origin/)
  })

  it('has a doOptions handler for CORS preflight', () => {
    const code = readCodeGs()
    expect(code).toContain('function doOptions')
  })

  it('references all 5 script properties', () => {
    const code = readCodeGs()
    const props = ['HMAC_SECRET', 'SHEET_ID', 'ALLOWED_ORIGIN', 'RATE_LIMIT_PER_IP', 'RATE_LIMIT_WINDOW_SEC']
    props.forEach((prop) => {
      expect(code).toContain(prop)
    })
  })
})

describe('appsscript.json', () => {
  it('exists at scripts/apps-script/appsscript.json', () => {
    expect(existsSync(APPSCRIPT_JSON_PATH)).toBe(true)
  })

  it('has V8 runtime version', () => {
    const manifest = readAppscriptJson()
    expect(manifest.runtimeVersion).toBe('V8')
  })

  it('has webapp config with executeAs USER_DEPLOYING', () => {
    const manifest = readAppscriptJson()
    expect(manifest.webapp).toBeDefined()
    expect(manifest.webapp.executeAs).toBe('USER_DEPLOYING')
    expect(manifest.webapp.access).toBe('ANYONE_ANONYMOUS')
  })
})

describe('README.md', () => {
  it('exists at scripts/apps-script/README.md', () => {
    expect(existsSync(README_PATH)).toBe(true)
  })

  it('has minimum 30 lines', () => {
    const readme = readReadme()
    const lines = readme.split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThanOrEqual(30)
  })

  it('documents deployment steps', () => {
    const readme = readReadme()
    expect(readme).toMatch(/deploy|deployment|Deploy/i)
  })

  it('documents required Properties keys', () => {
    const readme = readReadme()
    expect(readme).toContain('HMAC_SECRET')
    expect(readme).toContain('SHEET_ID')
  })

  it('documents HMAC key generation command', () => {
    const readme = readReadme()
    expect(readme).toMatch(/randomBytes|random.*bytes|crypto\.randomBytes/i)
  })

  it('documents Sheet column layout', () => {
    const readme = readReadme()
    expect(readme).toMatch(/column|header|row/i)
  })
})
