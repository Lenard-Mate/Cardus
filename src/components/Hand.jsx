import Card from './Card'

function Hand({ cards, energy, canAct, onPlay }) {
  return (
    <section className="flex min-h-64 items-end gap-3 overflow-x-auto px-2 pt-6 pb-2 sm:justify-center">
      {cards.length === 0 && <p className="self-center text-sm text-zinc-500">No cards in hand.</p>}
      {cards.map((card) => (
        <Card key={card.uid} card={card} playable={canAct && card.cost <= energy} onPlay={onPlay} />
      ))}
    </section>
  )
}

export default Hand
