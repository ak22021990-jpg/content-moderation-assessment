export default function AssessmentPlaceholderScreen({ onReset }) {
  return (
    <main aria-labelledby="cma-placeholder-title">
      <h1 id="cma-placeholder-title">Assessment placeholder</h1>
      <p>
        Assessment videos load in Phase 2. This is the placeholder terminus for
        Phase 1's App Shell slice.
      </p>
      {import.meta.env.DEV && onReset && (
        <button type="button" onClick={onReset}>
          [dev] Reset
        </button>
      )}
    </main>
  )
}
