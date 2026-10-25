import { useReducer } from 'react'
import EnemyPanel from './components/EnemyPanel'
import Hand from './components/Hand'
import PlayerDashboard from './components/PlayerDashboard'
import { createInitialState, gameReducer } from './game/engine'

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const canAct = state.status === 'playing'

  return (
    <main className="min-h-svh bg-zinc-950 bg-[radial-gradient(ellipse_at_top,#27272a_0%,#09090b_70%)] text-zinc-200">
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-4 p-4">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-black tracking-[0.25em] text-zinc-100 uppercase">Aether Forge</h1>
          <span className="text-sm text-zinc-500">Turn {state.turn}</span>
        </header>

        <EnemyPanel
          health={state.enemyHealth}
          shield={state.enemyShield}
          intent={state.enemyIntent}
          defeated={state.status === 'won'}
        />

        {/* Center arena: combat log, or the end-of-run screen. */}
        <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-[repeating-linear-gradient(100deg,transparent_0_14px,rgba(148,163,184,0.04)_14px_15px)] p-6 text-center">
          {canAct ? (
            <ul className="space-y-1">
              {state.log.map((entry, i) => (
                <li key={state.log.length - i} className={i === 0 ? 'font-semibold text-zinc-100' : 'text-sm text-zinc-500'}>
                  {entry}
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <h2 className={`text-4xl font-black tracking-widest uppercase ${state.status === 'won' ? 'text-emerald-400' : 'text-red-500'}`}>
                {state.status === 'won' ? 'Victory' : 'Defeat'}
              </h2>
              <p className="mt-2 text-zinc-400">{state.log[0]}</p>
              <button
                type="button"
                onClick={() => dispatch({ type: 'restart' })}
                className="mt-5 rounded-lg border border-zinc-500 bg-zinc-800 px-5 py-2 font-bold tracking-wide text-zinc-100 uppercase hover:bg-zinc-700"
              >
                New Run
              </button>
            </div>
          )}
        </section>

        <PlayerDashboard
          health={state.playerHealth}
          shield={state.playerShield}
          energy={state.currentEnergy}
          drawCount={state.drawPile.length}
          discardCount={state.discardPile.length}
          canAct={canAct}
          onEndTurn={() => dispatch({ type: 'endTurn' })}
        />

        <Hand cards={state.hand} energy={state.currentEnergy} canAct={canAct} onPlay={(uid) => dispatch({ type: 'play', uid })} />
      </div>
    </main>
  )
}

export default App
