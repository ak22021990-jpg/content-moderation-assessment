import defaultTaxonomy from '../data/taxonomy.json'

export default function GuidelinesScreen({ onBegin, taxonomy = defaultTaxonomy }) {
  return (
    <article>
      <h1>Assessment Guidelines</h1>

      <section aria-labelledby="cma-guidelines-policy">
        <h2 id="cma-guidelines-policy">Before you begin</h2>
        <ul>
          <li>
            This is a one-attempt assessment. You cannot restart it from this
            browser once submitted.
          </li>
          <li>
            Each video runs on a 3-minute countdown. When the timer hits zero,
            your current tags and verdict submit automatically.
          </li>
          <li>
            For each video, tag every category and sub-category that applies
            (multi-select), then choose Approve or Decline. Approving with zero
            categories selected is a valid submission.
          </li>
        </ul>
      </section>

      <section aria-labelledby="cma-guidelines-categories">
        <h2 id="cma-guidelines-categories">Categories</h2>
        {taxonomy.categories.map((l1) => (
          <section key={l1.id} aria-labelledby={`cat-${l1.id}`}>
            <h3 id={`cat-${l1.id}`}>{l1.label}</h3>
            {l1.definition && <p>{l1.definition}</p>}
            <ul>
              {l1.subcategories.map((l2) => (
                <li key={l2.id}>
                  <strong>{l2.label}</strong>
                  {l2.definition && <> — {l2.definition}</>}
                  {l2.example && <> <em>Example: {l2.example}</em></>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <button type="button" onClick={onBegin}>
        Begin Assessment
      </button>
    </article>
  )
}
