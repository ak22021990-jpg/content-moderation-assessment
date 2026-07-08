import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Node.js 22+ has a native localStorage that overrides happy-dom's.
// Without --localstorage-file flag, it's undefined. Polyfill it.
if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage === null) {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (index) => [...store.keys()][index] ?? null,
  }
}

afterEach(() => {
  cleanup()
})
