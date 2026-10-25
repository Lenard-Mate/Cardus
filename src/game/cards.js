const CARD_TYPES = {
  ps: { id: 'ps', name: 'Plasma Strike', type: 'Attack', cost: 1, value: 6, img: '/assets/plasma_strike.jpg', desc: 'Deal 6 damage.' },
  ag: { id: 'ag', name: 'Aegis Grid', type: 'Defend', cost: 1, value: 5, img: '/assets/aegis_grid.jpg', desc: 'Gain 5 Shield.' },
  sc: { id: 'sc', name: 'Shatter Core', type: 'Attack', cost: 2, value: 12, img: '/assets/shatter_core.jpg', desc: 'Deal 12 damage.' },
  iw: { id: 'iw', name: 'Iron Wall', type: 'Defend', cost: 2, value: 10, img: '/assets/iron_wall.jpg', desc: 'Gain 10 Shield.' },
  al: { id: 'al', name: 'Amplifier Loop', type: 'Overdrive', cost: 0, value: 1, img: '/assets/amplifier_loop.jpg', desc: 'Gain 1 Energy. Draw 1 card.' },
  ao: { id: 'ao', name: 'Aether Overload', type: 'Overdrive', cost: 3, value: 20, img: '/assets/aether_overload.jpg', desc: 'Deal 20 damage. Draw 2 cards.' },
}

// The 15-card starter deck: [card id, copies]
const STARTER_DECK = [
  ['ps', 4],
  ['ag', 4],
  ['sc', 2],
  ['iw', 2],
  ['al', 2],
  ['ao', 1],
]

// Each copy gets a unique `uid` so React can key it and we can find it in the hand.
export function buildStarterDeck() {
  return STARTER_DECK.flatMap(([id, copies]) =>
    Array.from({ length: copies }, (_, i) => ({ ...CARD_TYPES[id], uid: `${id}-${i}` })),
  )
}
