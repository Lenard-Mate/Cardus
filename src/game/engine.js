import { buildStarterDeck } from './cards.js'

export const PLAYER_MAX_HEALTH = 50
export const ENEMY_MAX_HEALTH = 40
export const MAX_ENERGY = 3
export const ENERGY_CAP = 6
export const HAND_LIMIT = 8
export const DRAW_PER_TURN = 5

function shuffle(cards) {
  const result = [...cards]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

export function rollIntent() {
  return Math.random() < 0.65
    ? { type: 'attack', value: randomInt(6, 12) }
    : { type: 'defend', value: randomInt(5, 8) }
}

// Draws one card at a time; an empty draw pile reshuffles the discard pile into it.
// Stops early when the hand is full or both piles are empty.
function drawCards(state, count) {
  let { drawPile, hand, discardPile } = state
  for (let i = 0; i < count && hand.length < HAND_LIMIT; i++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break
      drawPile = shuffle(discardPile)
      discardPile = []
    }
    hand = [...hand, drawPile[0]]
    drawPile = drawPile.slice(1)
  }
  return { ...state, drawPile, hand, discardPile }
}

// Damage hits shield first; whatever is left goes to health.
function applyDamage(health, shield, damage) {
  const blocked = Math.min(shield, damage)
  return { health: Math.max(0, health - (damage - blocked)), shield: shield - blocked, blocked }
}

export function createInitialState() {
  const state = {
    status: 'playing', // 'playing' | 'won' | 'lost'
    turn: 1,
    playerHealth: PLAYER_MAX_HEALTH,
    playerShield: 0,
    currentEnergy: MAX_ENERGY,
    enemyHealth: ENEMY_MAX_HEALTH,
    enemyShield: 0,
    enemyIntent: rollIntent(),
    drawPile: shuffle(buildStarterDeck()),
    hand: [],
    discardPile: [],
    log: ['A corrupted sentinel blocks the vault.'],
  }
  return drawCards(state, DRAW_PER_TURN)
}

const addLog = (state, message) => ({ ...state, log: [message, ...state.log].slice(0, 6) })

function playCard(state, uid) {
  const card = state.hand.find((c) => c.uid === uid)
  if (state.status !== 'playing' || !card || card.cost > state.currentEnergy) return state

  // Take the card out of the hand before resolving, so its own draw effect can't redraw it.
  let next = {
    ...state,
    currentEnergy: state.currentEnergy - card.cost,
    hand: state.hand.filter((c) => c.uid !== uid),
  }

  if (card.type === 'Attack' || card.id === 'ao') {
    const hit = applyDamage(next.enemyHealth, next.enemyShield, card.value)
    next = { ...next, enemyHealth: hit.health, enemyShield: hit.shield }
    const blockedText = hit.blocked ? ` (${hit.blocked} blocked)` : ''
    next = addLog(next, `${card.name} hits for ${card.value}${blockedText}.`)
  }
  if (card.type === 'Defend') {
    next = addLog({ ...next, playerShield: next.playerShield + card.value }, `${card.name}: +${card.value} Shield.`)
  }
  if (card.id === 'al') {
    next = { ...next, currentEnergy: Math.min(ENERGY_CAP, next.currentEnergy + card.value) }
    next = addLog(drawCards(next, 1), `${card.name}: +1 Energy, drew 1 card.`)
  }
  if (card.id === 'ao') {
    next = drawCards(next, 2)
  }

  next = { ...next, discardPile: [...next.discardPile, card] }

  if (next.enemyHealth === 0) {
    next = addLog({ ...next, status: 'won' }, 'The sentinel collapses. Vault breached!')
  }
  return next
}

function endTurn(state) {
  if (state.status !== 'playing') return state

  // Discard the remaining hand.
  let next = { ...state, discardPile: [...state.discardPile, ...state.hand], hand: [] }

  // The enemy acts. Its old shield expires when it takes its next action.
  const intent = state.enemyIntent
  next = { ...next, enemyShield: 0 }
  if (intent.type === 'attack') {
    const hit = applyDamage(next.playerHealth, next.playerShield, intent.value)
    next = { ...next, playerHealth: hit.health }
    const blockedText = hit.blocked ? ` (${hit.blocked} blocked)` : ''
    next = addLog(next, `Sentinel attacks for ${intent.value}${blockedText}.`)
  } else {
    next = addLog({ ...next, enemyShield: intent.value }, `Sentinel raises ${intent.value} Shield.`)
  }

  if (next.playerHealth === 0) {
    return addLog({ ...next, status: 'lost' }, 'Your systems fail. Run over.')
  }

  // New player turn: wipe shield, refill energy, draw, roll the next intent.
  next = {
    ...next,
    turn: next.turn + 1,
    playerShield: 0,
    currentEnergy: MAX_ENERGY,
    enemyIntent: rollIntent(),
  }
  return drawCards(next, DRAW_PER_TURN)
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'play':
      return playCard(state, action.uid)
    case 'endTurn':
      return endTurn(state)
    case 'restart':
      return createInitialState()
    default:
      return state
  }
}
