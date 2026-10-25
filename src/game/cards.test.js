import { describe, expect, it } from 'vitest'
import { buildStarterDeck } from './cards.js'

describe('buildStarterDeck', () => {
  it('builds the 15-card starter deck with the right copy counts', () => {
    const deck = buildStarterDeck()
    const counts = Object.fromEntries(['ps', 'ag', 'sc', 'iw', 'al', 'ao'].map((id) => [id, deck.filter((c) => c.id === id).length]))

    expect(deck).toHaveLength(15)
    expect(counts).toEqual({ ps: 4, ag: 4, sc: 2, iw: 2, al: 2, ao: 1 })
  })

  it('gives every copy a unique uid', () => {
    const uids = buildStarterDeck().map((c) => c.uid)
    expect(new Set(uids).size).toBe(uids.length)
  })

  it('returns a fresh deck each call', () => {
    const a = buildStarterDeck()
    const b = buildStarterDeck()
    a[0].value = 999
    expect(b[0].value).not.toBe(999)
  })
})
