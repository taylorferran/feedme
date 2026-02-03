import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { SUPPORTED_CHAINS, SUPPORTED_PROTOCOLS, SUPPORTED_TOKENS } from '../types/feedme'
import { useEnsOwner, useEnsResolver, useSetFeedMeConfig } from '../hooks/useEnsSetup'

const MONSTER_TYPES = [
  { id: 'octopus', emoji: '🐙', name: 'Octopus' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon' },
  { id: 'blob', emoji: '👾', name: 'Blob' },
  { id: 'kraken', emoji: '🦑', name: 'Kraken' },
  { id: 'plant', emoji: '🌱', name: 'Plant' },
]

export function Setup() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // Form state
  const [ensName, setEnsName] = useState('')
  const [selectedChain, setSelectedChain] = useState<string>('')
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [selectedProtocol, setSelectedProtocol] = useState<string>('')
  const [monsterName, setMonsterName] = useState('')
  const [monsterType, setMonsterType] = useState('octopus')

  // ENS hooks
  const { data: ensOwner, isLoading: isCheckingOwner } = useEnsOwner(ensName || undefined)
  const { data: resolverAddress } = useEnsResolver(ensName || undefined)
  const { setConfig, isPending, isConfirming, isSuccess, error, hash } = useSetFeedMeConfig(
    resolverAddress as `0x${string}` | undefined
  )

  const isOnMainnet = chainId === mainnet.id
  const isOwner = ensOwner && address && ensOwner.toLowerCase() === address.toLowerCase()
  const isFormComplete = ensName && selectedChain && selectedToken && selectedProtocol && monsterName

  const handleSubmit = () => {
    if (!isFormComplete) return

    setConfig(ensName, {
      chain: selectedChain,
      token: selectedToken,
      protocol: selectedProtocol,
      monsterName,
      monsterType,
    })
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Setup Your Monster</h1>
          <p className="text-zinc-400">
            Configure where your payments should go. Settings are stored on ENS (Ethereum mainnet).
          </p>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <ConnectButton />
          {isConnected && !isOnMainnet && (
            <button
              onClick={() => switchChain({ chainId: mainnet.id })}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm"
            >
              Switch to Ethereum
            </button>
          )}
        </div>

        {isConnected && isOnMainnet ? (
          <div className="space-y-6">
            {/* ENS Name Input */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm font-medium mb-3">
                Your ENS Name
              </label>
              <input
                type="text"
                value={ensName}
                onChange={(e) => setEnsName(e.target.value)}
                placeholder="yourname.eth"
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-purple-500 focus:outline-none"
              />
              {ensName && (
                <div className="mt-2 text-sm">
                  {isCheckingOwner ? (
                    <span className="text-zinc-500">Checking ownership...</span>
                  ) : isOwner ? (
                    <span className="text-green-400">✓ You own this name</span>
                  ) : ensOwner ? (
                    <span className="text-red-400">✗ You don't own this name</span>
                  ) : (
                    <span className="text-zinc-500">Name not found</span>
                  )}
                  {resolverAddress && (
                    <div className="text-zinc-500 text-xs mt-1">
                      Resolver: {resolverAddress.slice(0, 10)}...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chain Selection */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm font-medium mb-3">
                What chain does your monster live on?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedChain(key)}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedChain === key
                        ? 'bg-purple-600 border-purple-500'
                        : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                    }`}
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
                    onClick={() => setSelectedToken(token)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedToken === token
                        ? 'bg-purple-600 border-purple-500'
                        : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                    }`}
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
                    onClick={() => setSelectedProtocol(key)}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedProtocol === key
                        ? 'bg-purple-600 border-purple-500'
                        : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                    }`}
                  >
                    <span className="text-2xl">{protocol.icon}</span>
                    <div className="mt-2 font-medium">{protocol.name}</div>
                    <div className="text-xs text-zinc-500">{protocol.action}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Monster Name */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm font-medium mb-3">
                Name your monster
              </label>
              <input
                type="text"
                value={monsterName}
                onChange={(e) => setMonsterName(e.target.value)}
                placeholder="Chompy"
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Monster Type */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm font-medium mb-3">
                Choose your monster type
              </label>
              <div className="flex flex-wrap gap-3">
                {MONSTER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setMonsterType(type.id)}
                    className={`p-4 rounded-lg border transition-colors ${
                      monsterType === type.id
                        ? 'bg-purple-600 border-purple-500'
                        : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                    }`}
                  >
                    <span className="text-3xl">{type.emoji}</span>
                    <div className="mt-1 text-sm">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {isFormComplete && (
              <div className="bg-zinc-900 rounded-xl p-6 border border-purple-500/50">
                <h3 className="font-medium mb-3">Preview</h3>
                <div className="text-center py-4">
                  <span className="text-6xl">
                    {MONSTER_TYPES.find((t) => t.id === monsterType)?.emoji}
                  </span>
                  <div className="mt-3 text-xl font-bold">{monsterName}</div>
                  <p className="text-zinc-400 mt-2">
                    Lives in {SUPPORTED_PROTOCOLS[selectedProtocol as keyof typeof SUPPORTED_PROTOCOLS]?.name} on{' '}
                    {SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS]?.name}, eats {selectedToken}
                  </p>
                  <p className="text-sm text-zinc-500 mt-4">
                    feedme.finance/{ensName}
                  </p>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-xl p-4 text-red-400">
                Error: {error.message}
              </div>
            )}

            {/* Success display */}
            {isSuccess && hash && (
              <div className="bg-green-900/20 border border-green-500 rounded-xl p-4 text-green-400">
                <p>Success! Your FeedMe is configured.</p>
                <a
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  View transaction
                </a>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSubmit}
              disabled={!isFormComplete || !isOwner || isPending || isConfirming}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-medium transition-colors"
            >
              {isPending
                ? 'Confirm in wallet...'
                : isConfirming
                ? 'Saving to ENS...'
                : 'Save to ENS'}
            </button>

            {!isOwner && ensName && !isCheckingOwner && (
              <p className="text-center text-sm text-zinc-500">
                You must own the ENS name to save settings
              </p>
            )}
          </div>
        ) : isConnected ? (
          <div className="text-center py-12 text-zinc-500">
            Please switch to Ethereum mainnet to configure your ENS
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
