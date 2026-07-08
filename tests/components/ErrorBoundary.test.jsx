import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../src/components/ErrorBoundary.jsx'

function ThrowingChild() {
  throw new Error('test error')
}

describe('ErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <div>normal content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('normal content')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders fallback when child throws during render', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toBeTruthy()
    expect(screen.getByText('Something went wrong.')).toBeTruthy()
    expect(screen.getByText(/contact your recruiter/)).toBeTruthy()
    // No stack trace leaked
    expect(screen.queryByText(/test error/)).toBeNull()

    spy.mockRestore()
  })
})
