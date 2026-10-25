import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildStarterDeck } from './cards.js'
import {
  DRAW_PER_TURN,
  ENEMY_MAX_HEALTH,
  ENERGY_CAP,
  HAND_LIMIT,
  MAX_ENERGY,
  PLAYER_MAX_HEALTH,
  createInitialState,
  gameReducer,
  rollIntent,
} from './engine.js'

// Pick specific cards out of a fresh starter deck, e.g. take('ps', 'ps', 'ag').
function take(...ids) {
  const deck = buildStarterDeck()
  return ids.map((id) => {
    const index = deck.findIndex((c) => c.id === id)
    return deck.splice(index, 1)[0]
  })
}

// A predictable state: starts from a real game, then overrides piles and stats.
function makeState(overrides = {}) {
  return {
    ...createInitialState(),
    hand: [],
    drawPile: [],
    discardPile: [],
    enemyIntent: { type: 'attack', value: 8 },
    ...overrides,
  }
}

const play = (state, card) => gameReducer(state, { type: 'play', uid: card.uid })
const endTurn = (state) => gameReducer(state, { type: 'endTurn' })
const pileTotal = (s) => s.drawPile.length + s.hand.length + s.discardPile.length

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createInitialState', () => {
  it('starts with full stats and a 5-card hand from a 15-card deck', () => {
    const state = createInitialState()

    expect(state.status).toBe('playing')
    expect(state.turn).toBe(1)
    expect(state.playerHealth).toBe(PLAYER_MAX_HEALTH)
    expect(state.playerShield).toBe(0)
    expect(state.currentEnergy).toBe(MAX_ENERGY)
    expect(state.enemyHealth).toBe(ENEMY_MAX_HEALTH)
    expect(state.hand).toHaveLength(DRAW_PER_TURN)
    expect(state.drawPile).toHaveLength(15 - DRAW_PER_TURN)
    expect(state.discardPile).toHaveLength(0)
  })
})

describe('rollIntent', () => {
  it('rolls an attack of 6-12 on a low roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(rollIntent()).toEqual({ type: 'attack', value: 6 })
  })

  it('rolls a defend of 5-8 on a high roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    expect(rollIntent()).toEqual({ type: 'defend', value: 8 })
  })

  it('always stays within range', () => {
    for (let i = 0; i < 500; i++) {
      const intent = rollIntent()
      const [min, max] = intent.type === 'attack' ? [6, 12] : [5, 8]
      expect(intent.value).toBeGreaterThanOrEqual(min)
      expect(intent.value).toBeLessThanOrEqual(max)
    }
  })
})

describe('playing cards', () => {
  it('Plasma Strike spends 1 energy, deals 6 damage and goes to the discard pile', () => {
    const [strike] = take('ps')
    const next = play(makeState({ hand: [strike] }), strike)

    expect(next.currentEnergy).toBe(MAX_ENERGY - 1)
    expect(next.enemyHealth).toBe(ENEMY_MAX_HEALTH - 6)
    expect(next.hand).toHaveLength(0)
    expect(next.discardPile).toEqual([strike])
  })

  it('Aegis Grid adds 5 shield', () => {
    const [grid] = take('ag')
    expect(play(makeState({ hand: [grid] }), grid).playerShield).toBe(5)
  })

  it('stacks shield from several Defend cards', () => {
    const [grid, wall] = take('ag', 'iw')
    const state = play(play(makeState({ hand: [grid, wall] }), grid), wall)
    expect(state.playerShield).toBe(15)
  })

  it('Amplifier Loop costs nothing, gains 1 energy and draws 1 card', () => {
    const [loop, strike] = take('al', 'ps')
    const next = play(makeState({ hand: [loop], drawPile: [strike] }), loop)

    expect(next.currentEnergy).toBe(MAX_ENERGY + 1)
    expect(next.hand).toEqual([strike])
    expect(next.discardPile).toEqual([loop])
  })

  it('Amplifier Loop cannot push energy past the cap', () => {
    const [loop] = take('al')
    const next = play(makeState({ hand: [loop], currentEnergy: ENERGY_CAP }), loop)
    expect(next.currentEnergy).toBe(ENERGY_CAP)
  })

  it('Aether Overload deals 20 damage and draws 2 cards', () => {
    const [overload, a, b] = take('ao', 'ps', 'ag')
    const next = play(makeState({ hand: [overload], drawPile: [a, b] }), overload)

    expect(next.currentEnergy).toBe(0)
    expect(next.enemyHealth).toBe(ENEMY_MAX_HEALTH - 20)
    expect(next.hand).toEqual([a, b])
  })

  it('a draw effect cannot redraw the card that triggered it', () => {
    const [loop] = take('al')
    // Empty draw pile and empty discard: the only card around is the one being played.
    const next = play(makeState({ hand: [loop] }), loop)

    expect(next.hand).toHaveLength(0)
    expect(next.discardPile).toEqual([loop])
  })

  it('rejects a card the player cannot afford', () => {
    const [core] = take('sc')
    const state = makeState({ hand: [core], currentEnergy: 1 })
    expect(play(state, core)).toBe(state)
  })

  it('ignores a card that is not in the hand', () => {
    const [strike] = take('ps')
    const state = makeState({ drawPile: [strike] })
    expect(play(state, strike)).toBe(state)
  })

  it('enemy shield absorbs damage before health', () => {
    const [core] = take('sc')
    const next = play(makeState({ hand: [core], enemyShield: 8 }), core)

    expect(next.enemyShield).toBe(0)
    expect(next.enemyHealth).toBe(ENEMY_MAX_HEALTH - 4)
  })

  it('wins when the enemy reaches 0 health, without going negative', () => {
    const [core] = take('sc')
    const next = play(makeState({ hand: [core], enemyHealth: 5 }), core)

    expect(next.enemyHealth).toBe(0)
    expect(next.status).toBe('won')
  })

  it('ignores plays once the game is over', () => {
    const [strike] = take('ps')
    const state = makeState({ hand: [strike], status: 'won' })
    expect(play(state, strike)).toBe(state)
  })
})

describe('drawing', () => {
  it('shuffles the discard pile into an empty draw pile', () => {
    const [loop, ...discard] = take('al', 'ps', 'ag', 'sc')
    const next = play(makeState({ hand: [loop], discardPile: discard }), loop)

    expect(next.hand).toHaveLength(1)
    expect(discard).toContainEqual(next.hand[0])
    expect(next.drawPile).toHaveLength(2)
    expect(next.discardPile).toEqual([loop])
  })

  it(`never draws past the ${HAND_LIMIT}-card hand limit`, () => {
    const deck = buildStarterDeck()
    const loop = deck.find((c) => c.id === 'al')
    const others = deck.filter((c) => c !== loop)
    const hand = [loop, ...others.slice(0, HAND_LIMIT)] // one over the limit, minus the card being played
    const next = play(makeState({ hand, drawPile: others.slice(HAND_LIMIT) }), loop)

    expect(next.hand).toHaveLength(HAND_LIMIT)
    expect(next.drawPile).toHaveLength(others.length - HAND_LIMIT)
  })
})

describe('ending the turn', () => {
  it('discards the hand, refills energy, wipes shield and draws 5', () => {
    const deck = buildStarterDeck()
    const state = makeState({
      hand: deck.slice(0, 3),
      drawPile: deck.slice(3),
      currentEnergy: 0,
      playerShield: 20,
      enemyIntent: { type: 'defend', value: 6 },
    })
    const next = endTurn(state)

    expect(next.turn).toBe(2)
    expect(next.currentEnergy).toBe(MAX_ENERGY)
    expect(next.playerShield).toBe(0)
    expect(next.hand).toHaveLength(DRAW_PER_TURN)
    expect(next.discardPile).toEqual(deck.slice(0, 3))
    expect(pileTotal(next)).toBe(15)
  })

  it('an enemy attack is blocked fully by enough shield', () => {
    const next = endTurn(makeState({ playerShield: 10, enemyIntent: { type: 'attack', value: 8 } }))
    expect(next.playerHealth).toBe(PLAYER_MAX_HEALTH)
  })

  it('an enemy attack carries the leftover damage into health', () => {
    const next = endTurn(makeState({ playerShield: 3, enemyIntent: { type: 'attack', value: 8 } }))
    expect(next.playerHealth).toBe(PLAYER_MAX_HEALTH - 5)
  })

  it('an enemy defend gives it shield that replaces its old shield', () => {
    const next = endTurn(makeState({ enemyShield: 4, enemyIntent: { type: 'defend', value: 6 } }))
    expect(next.enemyShield).toBe(6)
    expect(next.playerHealth).toBe(PLAYER_MAX_HEALTH)
  })

  it("the enemy's shield expires when it attacks", () => {
    const next = endTurn(makeState({ enemyShield: 6, enemyIntent: { type: 'attack', value: 8 } }))
    expect(next.enemyShield).toBe(0)
  })

  it('rolls a new intent for the next turn', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const next = endTurn(makeState({ enemyIntent: { type: 'attack', value: 8 } }))
    expect(next.enemyIntent).toEqual({ type: 'defend', value: 8 })
  })

  it('loses when health reaches 0, and stops the turn there', () => {
    const next = endTurn(makeState({ playerHealth: 5, enemyIntent: { type: 'attack', value: 12 } }))

    expect(next.playerHealth).toBe(0)
    expect(next.status).toBe('lost')
    expect(next.turn).toBe(1)
    expect(next.hand).toHaveLength(0)
  })

  it('does nothing once the game is over', () => {
    const state = makeState({ status: 'lost' })
    expect(endTurn(state)).toBe(state)
  })
})

describe('restart', () => {
  it('starts a fresh game', () => {
    const next = gameReducer(makeState({ status: 'lost', playerHealth: 0, turn: 9 }), { type: 'restart' })

    expect(next.status).toBe('playing')
    expect(next.turn).toBe(1)
    expect(next.playerHealth).toBe(PLAYER_MAX_HEALTH)
    expect(next.hand).toHaveLength(DRAW_PER_TURN)
  })
})

describe('full games', () => {
  it('keeps all 15 cards and valid stats through random play', () => {
    for (let run = 0; run < 200; run++) {
      let state = createInitialState()
      while (state.status === 'playing' && state.turn < 50) {
        const playable = state.hand.filter((c) => c.cost <= state.currentEnergy)
        state = playable.length ? play(state, playable[0]) : endTurn(state)

        expect(pileTotal(state)).toBe(15)
        expect(state.hand.length).toBeLessThanOrEqual(HAND_LIMIT)
        expect(state.currentEnergy).toBeGreaterThanOrEqual(0)
        expect(state.currentEnergy).toBeLessThanOrEqual(ENERGY_CAP)
      }
      expect(state.status).not.toBe('playing')
    }
  })
})
