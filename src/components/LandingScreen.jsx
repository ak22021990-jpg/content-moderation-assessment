import { useState, useRef, useEffect } from 'react'
import { validateName, validateEmail } from '../utils/validators.js'
import AlreadyCompletedScreen from './AlreadyCompletedScreen.jsx'

export default function LandingScreen({ onStart, hasAttempted }) {
  if (hasAttempted) return <AlreadyCompletedScreen />

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState({ name: false, email: false })
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const nameV = validateName(name)
  const emailV = validateEmail(email)
  const canSubmit = nameV.valid && emailV.valid

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    onStart({ name: name.trim(), email: email.trim() })
  }

  return (
    <main aria-labelledby="cma-landing-title">
      <h1 id="cma-landing-title">Content Moderation Assessment</h1>
      <p>
        Enter your name and email to begin the assessment. This takes about 20
        minutes.
      </p>
      <form noValidate onSubmit={handleSubmit}>
        <label htmlFor="cma-name">Full name</label>
        <input
          id="cma-name"
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          aria-invalid={touched.name && !nameV.valid}
          aria-describedby={
            touched.name && !nameV.valid ? 'cma-name-error' : undefined
          }
          maxLength={100}
          autoComplete="name"
          required
        />
        {touched.name && !nameV.valid && (
          <span id="cma-name-error" role="alert">
            {nameV.error}
          </span>
        )}

        <label htmlFor="cma-email">Email</label>
        <input
          id="cma-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          aria-invalid={touched.email && !emailV.valid}
          aria-describedby={
            touched.email && !emailV.valid ? 'cma-email-error' : undefined
          }
          maxLength={254}
          autoComplete="email"
          required
        />
        {touched.email && !emailV.valid && (
          <span id="cma-email-error" role="alert">
            {emailV.error}
          </span>
        )}

        <button type="submit" disabled={!canSubmit}>
          Start
        </button>
      </form>
    </main>
  )
}
