import { useParams } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState } from 'react'

export function Feed() {
  const { ens } = useParams<{ ens: string }>()
  const { isConnected } = useAccount()
  const [amount, setAmount] = useState('')

  // TODO: Fetch ENS text records to get FeedMe config
  // For now, using hardcoded demo data
  const monsterConfig = {
    name: 'Chompy',
    owner: ens || 'unknown.eth',
    chain: 'Base',
    token: 'USDC',
    protocol: 'Aave',
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        {/* Monster Display */}
        <div className="text-center mb-8">
          <div className="text-9xl mb-4 animate-bounce">🐙</div>
          <h1 className="text-3xl font-bold mb-2">{monsterConfig.name}</h1>
          <p className="text-zinc-400">
            {monsterConfig.owner}'s hungry monster
          </p>
        </div>

        {/* Monster Speech */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-6 text-center">
          <p className="text-lg">
            "Feed me <span className="text-purple-400 font-bold">{monsterConfig.token}</span>...
            I live in <span className="text-purple-400 font-bold">{monsterConfig.protocol}</span> on{' '}
            <span className="text-purple-400 font-bold">{monsterConfig.chain}</span>"
          </p>
        </div>

        {/* Connect or Payment Form */}
        {!isConnected ? (
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Connect your wallet to feed {monsterConfig.name}</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Input */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm text-zinc-400 mb-2">You send</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 text-2xl bg-transparent focus:outline-none"
                />
                <button className="px-4 py-2 bg-zinc-800 rounded-lg flex items-center gap-2">
                  ETH
                  <span className="text-xs text-zinc-500">▼</span>
                </button>
              </div>
              <div className="text-sm text-zinc-500 mt-2">on Arbitrum</div>
            </div>

            {/* Arrow */}
            <div className="text-center text-2xl text-zinc-600">↓</div>

            {/* Output Preview */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm text-zinc-400 mb-2">
                {monsterConfig.name} receives
              </label>
              <div className="text-2xl font-bold text-green-400">
                {amount ? `~${(parseFloat(amount) * 2400).toFixed(2)} USDC` : '-- USDC'}
              </div>
              <div className="text-sm text-zinc-500 mt-2">
                deposited to {monsterConfig.protocol} on {monsterConfig.chain}
              </div>
            </div>

            {/* Feed Button */}
            <button
              disabled={!amount}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-bold text-xl transition-colors"
            >
              🍖 FEED {monsterConfig.name.toUpperCase()}
            </button>

            {/* Info */}
            <p className="text-center text-sm text-zinc-500">
              Powered by LI.FI — swap, bridge & deposit in one transaction
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
