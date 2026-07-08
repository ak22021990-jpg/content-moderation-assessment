import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Phase 1 has no telemetry backend — log to console for dev
    // Phase 5+ can wire this to a real service (out of scope)
    // eslint-disable-next-line no-console
    console.error('[cma] uncaught render error', error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h1>Something went wrong.</h1>
          <p>Please refresh the page. If the problem persists, contact your recruiter.</p>
        </div>
      )
    }
    return this.props.children
  }
}
