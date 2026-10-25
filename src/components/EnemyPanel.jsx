import { ENEMY_MAX_HEALTH } from '../game/engine'

const INTENT_STYLES = {
  attack: { icon: '⚔', label: 'Attack', box: 'border-red-500 bg-red-950/60 text-red-200 shadow-red-500/40' },
  defend: { icon: '⛨', label: 'Shield', box: 'border-sky-500 bg-sky-950/60 text-sky-200 shadow-sky-500/40' },
}

function EnemyPanel({ health, shield, intent, defeated }) {
  const intentStyle = INTENT_STYLES[intent.type]
  const percent = (health / ENEMY_MAX_HEALTH) * 100

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:flex-nowrap">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-linear-to-br from-zinc-700 to-zinc-950 text-3xl">
        {defeated ? '✖' : '◈'}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-bold tracking-wide text-zinc-100">Corrupted Sentinel</h2>
          {shield > 0 && <span className="text-sm font-semibold text-sky-300">⛨ {shield}</span>}
        </div>
        <div className="relative mt-2 h-5 overflow-hidden rounded-full border border-zinc-700 bg-zinc-950">
          <div className="h-full bg-linear-to-r from-red-700 to-red-500 transition-all duration-300" style={{ width: `${percent}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {health} / {ENEMY_MAX_HEALTH}
          </span>
        </div>
      </div>

      {!defeated && (
        <div className={`flex shrink-0 flex-col items-center rounded-xl border-2 px-4 py-2 shadow-lg ${intentStyle.box}`}>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80">Intent</span>
          <span className="text-2xl font-black">
            {intentStyle.icon} {intent.value}
          </span>
          <span className="text-xs">{intentStyle.label}</span>
        </div>
      )}
    </section>
  )
}

export default EnemyPanel
