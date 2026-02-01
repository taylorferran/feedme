import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { SUPPORTED_CHAINS, SUPPORTED_PROTOCOLS, SUPPORTED_TOKENS } from '../types/feedme'

export function Setup() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Setup Your Monster</h1>
          <p className="text-zinc-400">
            Configure where your payments should go
          </p>
        </div>

        <div className="mb-8">
          <ConnectButton />
        </div>

        {isConnected ? (
          <div className="space-y-6">
            {/* Chain Selection */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm font-medium mb-3">
                What chain does your monster live on?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                  <button
                    key={key}
                    className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
                  >
                    <span className="text-2xl">{chain.icon}</span>
                    <div className="mt-2 font-medium">{chain.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Token Selection */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm font-medium mb-3">
                What does your monster eat?
              </label>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_TOKENS.map((token) => (
                  <button
                    key={token}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Protocol Selection */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm font-medium mb-3">
                Where does your monster live?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SUPPORTED_PROTOCOLS).map(([key, protocol]) => (
                  <button
                    key={key}
                    className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
                  >
                    <span className="text-2xl">{protocol.icon}</span>
                    <div className="mt-2 font-medium">{protocol.name}</div>
                    <div className="text-xs text-zinc-500">{protocol.action}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Monster Customization */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm font-medium mb-3">
                Name your monster
              </label>
              <input
                type="text"
                placeholder="Chompy"
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Save Button */}
            <button className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors">
              Save to ENS (Coming Soon)
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            Connect your wallet to get started
          </div>
        )}
      </div>
    </div>
  )
}
