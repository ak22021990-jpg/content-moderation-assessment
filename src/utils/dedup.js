// TODO(Phase 5): replace with Web Crypto SHA-256 per ATTEMPT-04 (normalize + hash for server dedup)
// Phase 1 ships trim + lowercase so downstream localStorage records have a recognizable-shape emailHash.
export function hashEmail(input) {
  return (input ?? '').trim().toLowerCase()
}
