import { MAX_ENERGY, PLAYER_MAX_HEALTH } from '../game/engine'

function PlayerDashboard({ health, shield, energy, drawCount, discardCount, canAct, onEndTurn }) {
  // Show at least MAX_ENERGY nodes; extra nodes appear when Overdrive pushes energy above it.
  const nodes = Math.max(MAX_ENERGY, energy)

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="flex items-center gap-5">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">Health</p>
          <p className="text-2xl font-black text-emerald-400">
            {health}
            <span className="text-sm font-semibold text-zinc-500"> / {PLAYER_MAX_HEALTH}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">Shield</p>
          <p className="text-2xl font-black text-sky-400">⛨ {shield}</p>
        </div>
        <div className="hidden text-xs text-zinc-400 sm:block">
          <p>Draw pile: {drawCount}</p>
          <p>Discard: {discardCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" aria-label={`${energy} of ${MAX_ENERGY} energy`}>
          {Array.from({ length: nodes }, (_, i) => (
            <span
              key={i}
              className={`h-5 w-5 rounded-full border-2 ${
                i < energy ? 'border-amber-200 bg-amber-400 shadow-[0_0_12px] shadow-amber-400' : 'border-zinc-600 bg-zinc-800'
              }`}
            />
          ))}
          <span className="ml-1 font-bold text-amber-300">
            {energy}/{MAX_ENERGY}
          </span>
        </div>
        <button
          type="button"
          onClick={onEndTurn}
          disabled={!canAct}
          className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-2 font-bold tracking-wide text-amber-200 uppercase transition-colors hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          End Turn
        </button>
      </div>
    </section>
  )
}

export default PlayerDashboard
