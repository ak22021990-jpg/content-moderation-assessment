import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { cleanup } from '@testing-library/react'
import SubmitDoneScreen from '../../src/components/SubmitDoneScreen.jsx'

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

beforeEach(() => {
  cleanup()
  vi.stubGlobal('sessionStorage', sessionStorageMock)
  sessionStorageMock.clear()
  vi.clearAllMocks()
})

describe('SubmitDoneScreen', () => {
  it('renders heading "Thank you, {name}" when identity has name', () => {
    render(<SubmitDoneScreen identity={{ name: 'Alice' }} />)
    expect(screen.getByText('Thank you, Alice')).toBeInTheDocument()
  })

  it('renders heading without name when identity.name is empty', () => {
    render(<SubmitDoneScreen identity={{ name: '' }} />)
    expect(screen.getByText(/Thank you/i)).toBeInTheDocument()
  })

  it('renders heading "Thank you" when identity is null', () => {
    render(<SubmitDoneScreen identity={null} />)
    expect(screen.getByText('Thank you')).toBeInTheDocument()
  })

  it('renders body text about results being sent', () => {
    render(<SubmitDoneScreen identity={{ name: 'Alice' }} />)
    expect(screen.getByText(/Your assessment results have been sent/i)).toBeInTheDocument()
  })

  it('renders body text mentioning contact your recruiter', () => {
    render(<SubmitDoneScreen identity={{ name: 'Alice' }} />)
    expect(screen.getByText(/contact your recruiter/i)).toBeInTheDocument()
  })

  it('has no buttons', () => {
    render(<SubmitDoneScreen identity={{ name: 'Alice' }} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('has no links', () => {
    render(<SubmitDoneScreen identity={{ name: 'Alice' }} />)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('clears sessionStorage cma_identity_v1 on mount', () => {
    sessionStorageMock.setItem('cma_identity_v1', JSON.stringify({ name: 'Alice' }))
    render(<SubmitDoneScreen identity={{ name: 'Alice' }} />)
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('cma_identity_v1')
  })

  it('handles sessionStorage.removeItem failure gracefully', () => {
    const brokenStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(() => { throw new Error('Blocked') }),
      clear: vi.fn(),
    }
    vi.stubGlobal('sessionStorage', brokenStorage)

    // Should not throw
    expect(() => render(<SubmitDoneScreen identity={{ name: 'Alice' }} />)).not.toThrow()
  })

  it('renders without crashing', () => {
    const { container } = render(<SubmitDoneScreen identity={{ name: 'Alice' }} />)
    expect(container).toBeTruthy()
  })
})
