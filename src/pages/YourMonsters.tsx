import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useUserEnsNames } from '../hooks/useUserEnsNames'
import { useEnsConfig } from '../hooks/useEnsConfig'

const MONSTER_EMOJIS: Record<string, string> = {
  octopus: '🐙',
  dragon: '🐉',
  blob: '👾',
  kraken: '🦑',
  plant: '🌱',
  ghost: '👻',
}

export function YourMonsters() {
  const { isConnected, address } = useAccount()
  const { names, isLoading, error } = useUserEnsNames(address)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity text-sm mb-4">
            <img src="/logo.png" alt="FeedMe" className="w-8 h-8 rounded-sm" />
            <span className="font-horror text-lg text-red-800">FeedMe</span>
            <span className="text-stone-600 font-mono ml-2">← back to lair</span>
          </Link>
          <h1 className="text-4xl font-horror text-red-700 mb-2">Your Creatures</h1>
          <p className="text-stone-500">
            View and command your summoned creatures
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-stone-950 rounded-sm p-8 border-2 border-stone-800 text-center">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-stone-500 mb-6 font-brutal tracking-wider">
              CONNECT TO VIEW YOUR CREATURES
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected wallet info */}
            <div className="flex items-center justify-between bg-stone-950 rounded-sm p-4 border-2 border-stone-800">
              <div className="text-xs text-stone-600 font-brutal tracking-widest">CONNECTED AS</div>
              <ConnectButton />
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="bg-stone-950 rounded-sm p-8 border-2 border-stone-800 text-center">
                <div className="text-4xl mb-4 animate-pulse">🔍</div>
                <p className="text-stone-500 font-brutal tracking-wider">SEARCHING FOR YOUR CREATURES...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-red-950/50 border-2 border-red-800 rounded-sm p-4 text-red-400 font-mono">
                <span className="font-brutal tracking-wider text-red-500">ERROR:</span> {error}
              </div>
            )}

            {/* No names found */}
            {!isLoading && !error && names.length === 0 && (
              <div className="bg-stone-950 rounded-sm p-8 border-2 border-stone-800 text-center">
                <div className="text-6xl mb-4">💀</div>
                <p className="text-stone-400 mb-4 font-brutal tracking-wider">
                  NO ENS NAMES FOUND
                </p>
                <p className="text-stone-600 text-sm mb-6 font-mono">
                  You need an ENS name to summon a FeedMe creature.
                </p>
                <a
                  href="https://app.ens.domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-red-900 hover:bg-red-800 border-2 border-red-700 rounded-sm text-sm transition-all hover:shadow-[0_0_20px_rgba(153,27,27,0.3)] font-brutal tracking-wider"
                >
                  ACQUIRE ENS NAME →
                </a>
              </div>
            )}

            {/* ENS names list */}
            {!isLoading && names.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-brutal tracking-widest text-stone-600">YOUR ENS NAMES</h2>
                {names.map((ens) => (
                  <MonsterCard key={ens.name} ensName={ens.name} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Demo section */}
        <div className="mt-12 pt-8 border-t-2 border-stone-800">
          <h2 className="text-xs font-brutal tracking-widest text-stone-600 mb-4">WITNESS AN EXAMPLE</h2>
          <Link
            to="/taylorferran.eth"
            className="block bg-stone-950 rounded-sm p-4 border-2 border-stone-800 hover:border-red-800/50 transition-all group hover:shadow-[0_0_20px_rgba(153,27,27,0.2)]"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🐉</div>
              <div className="flex-1">
                <div className="font-mono group-hover:text-red-500 transition-colors">
                  taylorferran.eth
                </div>
                <div className="text-sm text-stone-600 font-mono">
                  View a summoned creature
                </div>
              </div>
              <div className="text-stone-700 group-hover:text-red-500 transition-colors">
                →
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function MonsterCard({ ensName }: { ensName: string }) {
  const { config, isLoading, isConfigured } = useEnsConfig(ensName)

  const monsterEmoji = config?.monsterType
    ? MONSTER_EMOJIS[config.monsterType] || '🐙'
    : '❓'

  return (
    <div className="bg-stone-950 rounded-sm p-4 border-2 border-stone-800">
      <div className="flex items-center gap-4">
        {/* Monster emoji or placeholder */}
        <div className="text-4xl">
          {isLoading ? (
            <span className="animate-pulse">🔄</span>
          ) : (
            monsterEmoji
          )}
        </div>

        {/* Name and status */}
        <div className="flex-1">
          <div className="font-mono">{ensName}</div>
          {isLoading ? (
            <div className="text-sm text-stone-600 font-mono">Loading...</div>
          ) : isConfigured ? (
            <div className="text-sm text-green-500 font-mono">
              {config?.monsterName} • {config?.protocol} on {config?.chain}
            </div>
          ) : (
            <div className="text-sm text-stone-600 font-mono">Not yet summoned</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isConfigured && (
            <Link
              to={`/${ensName}`}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-sm text-sm transition-colors font-mono"
            >
              View
            </Link>
          )}
          <Link
            to="/setup"
            state={{ ensName }}
            className="px-3 py-1.5 bg-red-900 hover:bg-red-800 border border-red-700 rounded-sm text-sm transition-all hover:shadow-[0_0_15px_rgba(153,27,27,0.3)] font-brutal tracking-wider"
          >
            {isConfigured ? 'EDIT' : 'SUMMON'}
          </Link>
        </div>
      </div>
    </div>
  )
}
