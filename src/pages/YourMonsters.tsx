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
}

export function YourMonsters() {
  const { isConnected, address } = useAccount()
  const { names, isLoading, error } = useUserEnsNames(address)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-zinc-500 hover:text-zinc-300 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Your Monsters</h1>
          <p className="text-zinc-400">
            View and manage your FeedMe configurations
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-zinc-400 mb-6">
              Connect your wallet to see your ENS names and monsters
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected wallet info */}
            <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="text-sm text-zinc-400">Connected as</div>
              <ConnectButton />
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
                <div className="text-4xl mb-4 animate-pulse">🔍</div>
                <p className="text-zinc-400">Looking for your ENS names...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-xl p-4 text-red-400">
                Error: {error}
              </div>
            )}

            {/* No names found */}
            {!isLoading && !error && names.length === 0 && (
              <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
                <div className="text-6xl mb-4">😢</div>
                <p className="text-zinc-400 mb-4">
                  No ENS names found for this wallet
                </p>
                <p className="text-zinc-500 text-sm mb-6">
                  You need an ENS name to create a FeedMe monster.
                </p>
                <a
                  href="https://app.ens.domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                >
                  Get an ENS Name →
                </a>
              </div>
            )}

            {/* ENS names list */}
            {!isLoading && names.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-zinc-400">Your ENS Names</h2>
                {names.map((ens) => (
                  <MonsterCard key={ens.name} ensName={ens.name} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Demo section */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">See an Example</h2>
          <Link
            to="/taylorferran.eth"
            className="block bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-purple-500/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🐉</div>
              <div className="flex-1">
                <div className="font-medium group-hover:text-purple-400 transition-colors">
                  taylorferran.eth
                </div>
                <div className="text-sm text-zinc-500">
                  View a configured FeedMe monster
                </div>
              </div>
              <div className="text-zinc-600 group-hover:text-purple-400 transition-colors">
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
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
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
          <div className="font-medium">{ensName}</div>
          {isLoading ? (
            <div className="text-sm text-zinc-500">Loading...</div>
          ) : isConfigured ? (
            <div className="text-sm text-green-400">
              {config?.monsterName} • {config?.protocol} on {config?.chain}
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Not configured yet</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isConfigured && (
            <Link
              to={`/${ensName}`}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              View
            </Link>
          )}
          <Link
            to="/setup"
            state={{ ensName }}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
          >
            {isConfigured ? 'Edit' : 'Setup'}
          </Link>
        </div>
      </div>
    </div>
  )
}
