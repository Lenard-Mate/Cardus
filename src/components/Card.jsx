// Full class strings so Tailwind can find them at build time.
const TYPE_STYLES = {
  Attack: { border: 'border-red-500/60', glow: 'hover:shadow-red-500/40', badge: 'bg-red-600', label: 'text-red-300' },
  Defend: { border: 'border-sky-500/60', glow: 'hover:shadow-sky-500/40', badge: 'bg-sky-600', label: 'text-sky-300' },
  Overdrive: { border: 'border-purple-500/60', glow: 'hover:shadow-purple-500/40', badge: 'bg-purple-600', label: 'text-purple-300' },
}

function Card({ card, playable, onPlay }) {
  const style = TYPE_STYLES[card.type]

  return (
    <button
      type="button"
      onClick={() => onPlay(card.uid)}
      disabled={!playable}
      title={playable ? `Play ${card.name}` : 'Not enough energy'}
      className={`group relative h-60 w-40 shrink-0 overflow-hidden rounded-xl border-2 ${style.border} bg-zinc-900 bg-cover bg-center text-left shadow-lg shadow-black/60 transition-transform duration-200 hover:-translate-y-4 hover:scale-105 hover:shadow-xl ${style.glow} focus-visible:-translate-y-4 focus-visible:outline-2 focus-visible:outline-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale-60`}
      style={{ backgroundImage: `url(${card.img})` }}
    >
      {/* Dark gradient keeps the text readable over any artwork. */}
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/95" />

      <div
        className={`absolute top-2 left-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-zinc-950 ${style.badge} text-lg font-black text-white shadow-md`}
      >
        {card.cost}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${style.label}`}>{card.type}</p>
        <h3 className="text-base leading-tight font-bold text-white">{card.name}</h3>
        <p className="mt-1 text-xs leading-snug text-zinc-200">{card.desc}</p>
      </div>
    </button>
  )
}

export default Card
