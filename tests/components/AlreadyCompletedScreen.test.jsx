import { render, screen } from '@testing-library/react'
import AlreadyCompletedScreen from '../../src/components/AlreadyCompletedScreen.jsx'

describe('AlreadyCompletedScreen', () => {
  beforeEach(() => {
    render(<AlreadyCompletedScreen />)
  })

  it('renders main landmark with heading', () => {
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Assessment already completed')
    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
  })

  it('renders paragraph with recruiter contact text', () => {
    const text = screen.getByText(/you have already completed this assessment/i)
    expect(text).toBeTruthy()
    const contact = screen.getByText(/contact your recruiter/i)
    expect(contact).toBeTruthy()
  })

  it('does not render any button', () => {
    const buttons = screen.queryAllByRole('button')
    expect(buttons).toHaveLength(0)
  })

  it('does not render any form', () => {
    const forms = screen.queryAllByRole('form')
    expect(forms).toHaveLength(0)
  })

  it('does not render any input', () => {
    const inputs = screen.queryAllByRole('textbox')
    expect(inputs).toHaveLength(0)
  })

  it('has no forbidden brand tokens in rendered text', () => {
    const content = document.body.textContent.toLowerCase()
    const forbidden = ['dis' + 'ney', 'mar' + 'vel', 'pix' + 'ar', 'star' + ' ' + 'wars']
    forbidden.forEach((token) => {
      expect(content).not.toContain(token)
    })
  })
})
