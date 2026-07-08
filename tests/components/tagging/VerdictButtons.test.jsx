import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

vi.mock('../../../src/stores/useAssessmentStore.js', () => ({
  default: vi.fn(),
}))

import useAssessmentStore from '../../../src/stores/useAssessmentStore.js'
import VerdictButtons from '../../../src/components/tagging/VerdictButtons.jsx'

describe('VerdictButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockStore({ isRunning = true } = {}) {
    useAssessmentStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ isRunning })
      }
      return { isRunning }
    })
  }

  it('renders Approve and Decline buttons', () => {
    mockStore({ isRunning: true })
    render(React.createElement(VerdictButtons, { onVerdict: vi.fn(), submitting: false }))
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
  })

  it('buttons disabled when isRunning is false', () => {
    mockStore({ isRunning: false })
    render(React.createElement(VerdictButtons, { onVerdict: vi.fn(), submitting: false }))
    const approveBtn = screen.getByRole('button', { name: /approve/i })
    const declineBtn = screen.getByRole('button', { name: /decline/i })
    expect(approveBtn).toBeDisabled()
    expect(declineBtn).toBeDisabled()
  })

  it('buttons enabled when isRunning is true', () => {
    mockStore({ isRunning: true })
    render(React.createElement(VerdictButtons, { onVerdict: vi.fn(), submitting: false }))
    const approveBtn = screen.getByRole('button', { name: /approve/i })
    const declineBtn = screen.getByRole('button', { name: /decline/i })
    expect(approveBtn).toBeEnabled()
    expect(declineBtn).toBeEnabled()
  })

  it('buttons disabled when submitting is true', () => {
    mockStore({ isRunning: true })
    render(React.createElement(VerdictButtons, { onVerdict: vi.fn(), submitting: true }))
    const approveBtn = screen.getByRole('button', { name: /approve/i })
    const declineBtn = screen.getByRole('button', { name: /decline/i })
    expect(approveBtn).toBeDisabled()
    expect(declineBtn).toBeDisabled()
  })

  it('clicking Approve calls onVerdict with APPROVE', async () => {
    const user = userEvent.setup()
    const onVerdict = vi.fn()
    mockStore({ isRunning: true })
    render(React.createElement(VerdictButtons, { onVerdict, submitting: false }))
    await user.click(screen.getByRole('button', { name: /approve/i }))
    expect(onVerdict).toHaveBeenCalledWith('APPROVE')
  })

  it('clicking Decline calls onVerdict with DECLINE', async () => {
    const user = userEvent.setup()
    const onVerdict = vi.fn()
    mockStore({ isRunning: true })
    render(React.createElement(VerdictButtons, { onVerdict, submitting: false }))
    await user.click(screen.getByRole('button', { name: /decline/i }))
    expect(onVerdict).toHaveBeenCalledWith('DECLINE')
  })

  it('buttons have correct aria-label attributes', () => {
    mockStore({ isRunning: true })
    render(React.createElement(VerdictButtons, { onVerdict: vi.fn(), submitting: false }))
    expect(screen.getByRole('button', { name: /approve this video/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline this video/i })).toBeInTheDocument()
  })
})
