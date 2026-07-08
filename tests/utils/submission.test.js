import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildSubmissionPayload, buildHmac, submitResults, getSubmissionConfig } from '../../src/utils/submission.js'

// Mock crypto.subtle for buildHmac tests
const mockSubtle = {
  digest: vi.fn(),
  importKey: vi.fn(),
  sign: vi.fn(),
}

beforeEach(() => {
  vi.stubGlobal('crypto', { subtle: mockSubtle })
  vi.clearAllMocks()
})

describe('buildSubmissionPayload', () => {
  const baseIdentity = {
    name: 'Alice',
    email: 'alice@example.com',
    startedAt: '2026-07-08T10:00:00.000Z',
  }

  const baseAnswers = [
    {
      videoId: 'v01',
      selectedL1: ['1'],
      selectedL2: ['1.1'],
      verdict: 'DECLINE',
      timeSpentMs: 45000,
      timedOut: false,
    },
    {
      videoId: 'v02',
      selectedL1: [],
      selectedL2: [],
      verdict: 'APPROVE',
      timeSpentMs: 30000,
      timedOut: false,
    },
  ]

  const baseScores = {
    overallPct: 72.5,
    perVideo: [
      { videoId: 'v01', score: 50 },
      { videoId: 'v02', score: 100 },
    ],
    perL1Accuracy: { '1': 50 },
    answerKeyVersion: '1.0.0-test',
  }

  const baseCompetency = {
    title: 'Proficient',
    strengthsWeaknesses: 'Good at spotting Copyright issues.',
  }

  it('returns object with all SUBMIT-02 fields present', () => {
    const payload = buildSubmissionPayload({
      identity: baseIdentity,
      answers: baseAnswers,
      scores: baseScores,
      competency: baseCompetency,
      taxonomyVersion: '0.2.0-draft',
      hmac: 'abc123',
    })

    expect(payload).toHaveProperty('name')
    expect(payload).toHaveProperty('email')
    expect(payload).toHaveProperty('emailHash')
    expect(payload).toHaveProperty('answers')
    expect(payload).toHaveProperty('scores')
    expect(payload).toHaveProperty('competency')
    expect(payload).toHaveProperty('strengthsWeaknesses')
    expect(payload).toHaveProperty('timeToCompleteMs')
    expect(payload).toHaveProperty('answerKeyVersion')
    expect(payload).toHaveProperty('taxonomyVersion')
    expect(payload).toHaveProperty('sessionStartedAt')
    expect(payload).toHaveProperty('sessionEndedAt')
    expect(payload).toHaveProperty('userAgent')
    expect(payload).toHaveProperty('screenResolution')
    expect(payload).toHaveProperty('hmac')
  })

  it('maps name and email from identity', () => {
    const payload = buildSubmissionPayload({
      identity: baseIdentity,
      answers: baseAnswers,
      scores: baseScores,
      competency: baseCompetency,
      taxonomyVersion: '0.2.0-draft',
      hmac: 'abc123',
    })

    expect(payload.name).toBe('Alice')
    expect(payload.email).toBe('alice@example.com')
  })

  it('maps each answer to correct shape', () => {
    const payload = buildSubmissionPayload({
      identity: baseIdentity,
      answers: baseAnswers,
      scores: baseScores,
      competency: baseCompetency,
      taxonomyVersion: '0.2.0-draft',
      hmac: 'abc123',
    })

    expect(payload.answers).toHaveLength(2)
    expect(payload.answers[0]).toMatchObject({
      videoId: 'v01',
      selectedL1: ['1'],
      selectedL2: ['1.1'],
      verdict: 'DECLINE',
      timeSpentMs: 45000,
      timedOut: false,
    })
  })

  it('computes timeToCompleteMs as sum of all answer timeSpentMs', () => {
    const payload = buildSubmissionPayload({
      identity: baseIdentity,
      answers: baseAnswers,
      scores: baseScores,
      competency: baseCompetency,
      taxonomyVersion: '0.2.0-draft',
      hmac: '',
    })

    expect(payload.timeToCompleteMs).toBe(75000)
  })

  it('produces empty answers array and zero total time when answers empty', () => {
    const payload = buildSubmissionPayload({
      identity: baseIdentity,
      answers: [],
      scores: baseScores,
      competency: baseCompetency,
      taxonomyVersion: '0.2.0-draft',
      hmac: '',
    })

    expect(payload.answers).toEqual([])
    expect(payload.timeToCompleteMs).toBe(0)
  })

  it('uses null for missing optional fields, never undefined', () => {
    const payload = buildSubmissionPayload({
      identity: { name: 'Bob' },
      answers: [],
      scores: { overallPct: null, perVideo: [], perL1Accuracy: {} },
      competency: {},
      taxonomyVersion: '',
      hmac: '',
    })

    // Verify no undefined values in the result
    const serialized = JSON.stringify(payload)
    const parsed = JSON.parse(serialized)

    // email should be null, not undefined
    expect(payload.email).toBeNull()
    expect(payload.competency).toBeNull()
    expect(payload.strengthsWeaknesses).toBeNull()

    // sessionStartedAt should be null when not provided
    expect(payload.sessionStartedAt).toBeNull()

    // Per-answer fields with missing data use defaults
    expect(payload.answers).toEqual([])

    // scores overallPct should be null
    expect(payload.scores.overallPct).toBeNull()
  })

  it('handles null identity gracefully', () => {
    const payload = buildSubmissionPayload({
      identity: null,
      answers: [],
      scores: baseScores,
      competency: baseCompetency,
      taxonomyVersion: '',
      hmac: '',
    })

    expect(payload.name).toBeNull()
    expect(payload.email).toBeNull()
  })

  it('includes screenResolution from window.screen', () => {
    vi.stubGlobal('window', { screen: { width: 1920, height: 1080 } })
    vi.stubGlobal('navigator', { userAgent: 'TestAgent/1.0' })

    const payload = buildSubmissionPayload({
      identity: baseIdentity,
      answers: baseAnswers,
      scores: baseScores,
      competency: baseCompetency,
      taxonomyVersion: '0.2.0-draft',
      hmac: '',
    })

    expect(payload.screenResolution).toBe('1920x1080')
    expect(payload.userAgent).toBe('TestAgent/1.0')
  })
})

describe('buildHmac', () => {
  it('returns hex string for valid payload and secret', async () => {
    const mockSign = vi.fn().mockResolvedValue(new Uint8Array([171, 205, 239]).buffer)
    const mockImportKey = vi.fn().mockResolvedValue({ type: 'secret' })
    vi.stubGlobal('crypto', {
      subtle: {
        importKey: mockImportKey,
        sign: mockSign,
      },
    })

    const result = await buildHmac({ name: 'test', hmac: '' }, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2')
    expect(typeof result).toBe('string')
    expect(result).toBe('abcdef')
  })

  it('returns empty string when secretHex is falsy', async () => {
    const result = await buildHmac({ name: 'test' }, '')
    expect(result).toBe('')
  })

  it('returns empty string when secretHex is null', async () => {
    const result = await buildHmac({ name: 'test' }, null)
    expect(result).toBe('')
  })

  it('excludes hmac field from signing payload', async () => {
    const mockSign = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer)
    const mockImportKey = vi.fn().mockResolvedValue({ type: 'secret' })
    vi.stubGlobal('crypto', {
      subtle: {
        importKey: mockImportKey,
        sign: mockSign,
      },
    })

    await buildHmac({ name: 'test', hmac: 'existing', secret: 'data' }, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2')

    // The sign call should NOT include the hmac field in the payload
    // crypto.subtle.sign(algorithm, key, data) — data is third arg
    const signedData = mockSign.mock.calls[0][2]
    // Convert Uint8Array to string manually (TextDecoder may not be available in test env)
    const signedString = Array.from(new Uint8Array(signedData))
      .map((c) => String.fromCharCode(c))
      .join('')
    expect(signedString).not.toContain('"hmac":"existing"')
    expect(signedString).toContain('"name":"test"')
  })

  it('handles crypto errors gracefully', async () => {
    vi.stubGlobal('crypto', {
      subtle: {
        importKey: vi.fn().mockRejectedValue(new Error('crypto unavailable')),
      },
    })

    const result = await buildHmac({ name: 'test' }, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2')
    expect(result).toBe('')
  })
})

describe('submitResults', () => {
  let mockFetch

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const payload = { name: 'Alice', email: 'a@t.com', hmac: 'abc123' }
  const endpoint = 'https://script.google.com/macros/s/test/exec'

  it('succeeds on first attempt (200 response)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '5' }),
    })

    const onProgress = vi.fn()
    const result = await submitResults({ payload, endpoint, onProgress })

    expect(result).toEqual({ ok: true, id: '5' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith({ attempt: 1, total: 3, phase: 'submitting' })
    expect(onProgress).toHaveBeenCalledWith({ attempt: 1, total: 3, phase: 'success' })
  })

  it('succeeds on third attempt after two 503 failures', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: '42' }) })

    const onProgress = vi.fn()
    const resultPromise = submitResults({ payload, endpoint, onProgress })

    // Attempt 1: 503, wait 1000ms
    await vi.advanceTimersByTimeAsync(1000)
    // Attempt 2: 503, wait 3000ms
    await vi.advanceTimersByTimeAsync(3000)

    const result = await resultPromise
    expect(result).toEqual({ ok: true, id: '42' })
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(onProgress).toHaveBeenCalledWith({ attempt: 1, total: 3, phase: 'submitting' })
    expect(onProgress).toHaveBeenCalledWith({ attempt: 2, total: 3, phase: 'submitting' })
    expect(onProgress).toHaveBeenCalledWith({ attempt: 3, total: 3, phase: 'submitting' })
    expect(onProgress).toHaveBeenCalledWith({ attempt: 3, total: 3, phase: 'success' })
  })

  it('surfaces 4xx error immediately without retry', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'invalid-hmac' }),
    })

    const onProgress = vi.fn()
    const result = await submitResults({ payload, endpoint, onProgress })

    expect(result).toEqual({ ok: false, error: 'invalid-hmac' })
    expect(mockFetch).toHaveBeenCalledTimes(1) // No retry!
    expect(onProgress).toHaveBeenCalledWith({ attempt: 1, total: 3, phase: 'error' })
  })

  it('retries on network error, fails on third attempt', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))

    const onProgress = vi.fn()
    const resultPromise = submitResults({ payload, endpoint, onProgress })

    await vi.advanceTimersByTimeAsync(1000) // attempt 1 delay
    await vi.advanceTimersByTimeAsync(3000) // attempt 2 delay

    const result = await resultPromise
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Network error')
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(onProgress).toHaveBeenCalledWith({ attempt: 3, total: 3, phase: 'error' })
  })

  it('calls onProgress with correct attempt/total/phase on each state change', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1' }),
    })

    const onProgress = vi.fn()
    await submitResults({ payload, endpoint, onProgress })

    expect(onProgress).toHaveBeenCalledWith({ attempt: 1, total: 3, phase: 'submitting' })
    expect(onProgress).toHaveBeenCalledWith({ attempt: 1, total: 3, phase: 'success' })
  })

  it('uses exponential delays: 1s, 3s, 9s between retries', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })

    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    const resultPromise = submitResults({ payload, endpoint })

    // Advance past first delay
    await vi.advanceTimersByTimeAsync(1500)
    // Advance past second delay
    await vi.advanceTimersByTimeAsync(4000)

    await resultPromise

    // Verify setTimeout was called with increasing delays (only between attempts)
    const delayCalls = setTimeoutSpy.mock.calls.filter(
      ([, ms]) => ms === 1000 || ms === 3000,
    )
    expect(delayCalls.length).toBe(2)

    setTimeoutSpy.mockRestore()
  })

  it('POSTs payload as JSON-stringified body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1' }),
    })

    await submitResults({ payload, endpoint })

    expect(mockFetch).toHaveBeenCalledWith(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('returns error on exhaustion when all 5xx responses', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValueOnce({ ok: false, status: 503 })

    const onProgress = vi.fn()
    const resultPromise = submitResults({ payload, endpoint, onProgress, maxAttempts: 3 })

    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(3000)

    const result = await resultPromise
    expect(result).toEqual({ ok: false, error: 'All retry attempts exhausted' })
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('falls back to generic error on 4xx with no json body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.reject(new Error('not json')),
    })

    const result = await submitResults({ payload, endpoint })
    expect(result).toEqual({ ok: false, error: 'Server rejected: 404' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns error immediately when maxAttempts is 0', async () => {
    const onProgress = vi.fn()
    const result = await submitResults({ payload, endpoint, onProgress, maxAttempts: 0 })

    expect(result).toEqual({ ok: false, error: 'All retry attempts exhausted' })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(onProgress).toHaveBeenCalledWith({ attempt: 0, total: 0, phase: 'error' })
  })
})

describe('getSubmissionConfig', () => {
  it('returns an object with endpoint and isFormspree properties', () => {
    const config = getSubmissionConfig()
    expect(config).toHaveProperty('endpoint')
    expect(config).toHaveProperty('isFormspree')
    expect(typeof config.endpoint).toBe('string')
    expect(typeof config.isFormspree).toBe('boolean')
  })

  it('defaults to isFormspree=false (apps-script mode)', () => {
    const config = getSubmissionConfig()
    expect(config.isFormspree).toBe(false)
  })
})
