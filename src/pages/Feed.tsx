import { useParams } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import { useEnsConfig } from '../hooks/useEnsConfig'
import { usePaymentQuote } from '../hooks/usePaymentQuote'
import { SUPPORTED_CHAINS, SUPPORTED_PROTOCOLS, SUPPORTED_TOKENS } from '../types/feedme'

const MONSTER_EMOJIS: Record<string, string> = {
  octopus: '🐙',
  dragon: '🐉',
  blob: '👾',
  kraken: '🦑',
  plant: '🌱',
}

export function Feed() {
  const { ens } = useParams<{ ens: string }>()
  const { isConnected, address } = useAccount()
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState('ETH')
  const [selectedChain, setSelectedChain] = useState('base')
  const [showTokenDropdown, setShowTokenDropdown] = useState(false)
  const [showChainDropdown, setShowChainDropdown] = useState(false)

  // Fetch real ENS config
  const { config, isLoading, isConfigured } = useEnsConfig(ens)

  // Get display values
  const monsterEmoji = MONSTER_EMOJIS[config?.monsterType || 'octopus'] || '🐙'
  const monsterName = config?.monsterName || 'Monster'
  const destChain = config?.chain ? SUPPORTED_CHAINS[config.chain as keyof typeof SUPPORTED_CHAINS] : null
  const destProtocol = config?.protocol ? SUPPORTED_PROTOCOLS[config.protocol as keyof typeof SUPPORTED_PROTOCOLS] : null
  const destToken = config?.token || 'USDC'

  // Get live quote from LI.FI
  const {
    quote,
    outputAmountFormatted,
    gasCostUSD,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = usePaymentQuote({
    fromChainKey: selectedChain,
    fromToken: selectedToken,
    fromAmount: amount,
    toChainKey: config?.chain || 'base',
    toToken: destToken,
    recipientAddress: address, // For now, use sender address. Later: resolve ENS to address
  })

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🐙</div>
          <p className="text-zinc-400">Loading monster...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold mb-2">Monster Not Found</h1>
          <p className="text-zinc-400 mb-4">
            {ens} hasn't set up their FeedMe yet.
          </p>
          <a href="/setup" className="text-purple-400 hover:underline">
            Set up your own monster →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        {/* Monster Display */}
        <div className="text-center mb-8">
          <div className="text-9xl mb-4 animate-bounce">{monsterEmoji}</div>
          <h1 className="text-3xl font-bold mb-2">{monsterName}</h1>
          <p className="text-zinc-400">{ens}'s hungry monster</p>
        </div>

        {/* Monster Speech */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-6 text-center">
          <p className="text-lg">
            "Feed me <span className="text-purple-400 font-bold">{destToken}</span>...
            I live in <span className="text-purple-400 font-bold">{destProtocol?.name || config?.protocol}</span> on{' '}
            <span className="text-purple-400 font-bold">{destChain?.name || config?.chain}</span>"
          </p>
        </div>

        {/* Connect or Payment Form */}
        {!isConnected ? (
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Connect your wallet to feed {monsterName}</p>
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
                {/* Token Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-2"
                  >
                    {selectedToken}
                    <span className="text-xs text-zinc-500">▼</span>
                  </button>
                  {showTokenDropdown && (
                    <div className="absolute top-full mt-1 right-0 bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden z-10">
                      {SUPPORTED_TOKENS.map((token) => (
                        <button
                          key={token}
                          onClick={() => {
                            setSelectedToken(token)
                            setShowTokenDropdown(false)
                          }}
                          className={`block w-full px-4 py-2 text-left hover:bg-zinc-700 ${
                            selectedToken === token ? 'bg-zinc-700' : ''
                          }`}
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Chain Selector */}
              <div className="relative mt-3">
                <button
                  onClick={() => setShowChainDropdown(!showChainDropdown)}
                  className="text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-1"
                >
                  on {SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS]?.name || selectedChain}
                  <span className="text-xs">▼</span>
                </button>
                {showChainDropdown && (
                  <div className="absolute top-full mt-1 left-0 bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden z-10">
                    {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedChain(key)
                          setShowChainDropdown(false)
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-zinc-700 ${
                          selectedChain === key ? 'bg-zinc-700' : ''
                        }`}
                      >
                        <span>{chain.icon}</span>
                        <span>{chain.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="text-center text-2xl text-zinc-600">↓</div>

            {/* Output Preview */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <label className="block text-sm text-zinc-400 mb-2">
                {monsterName} receives
              </label>

              {/* Quote loading state */}
              {isQuoteLoading ? (
                <div className="text-2xl font-bold text-zinc-500 animate-pulse">
                  Loading quote...
                </div>
              ) : quoteError ? (
                <div className="text-red-400 text-sm">{quoteError}</div>
              ) : quote ? (
                <>
                  <div className="text-2xl font-bold text-green-400">
                    ~{outputAmountFormatted} {destToken}
                  </div>
                  {parseFloat(gasCostUSD) > 0 && (
                    <div className="text-sm text-zinc-500 mt-1">
                      Gas: ~${gasCostUSD}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-2xl font-bold text-zinc-500">
                  -- {destToken}
                </div>
              )}

              <div className="text-sm text-zinc-500 mt-2">
                deposited to {destProtocol?.name || config?.protocol} on {destChain?.name || config?.chain}
              </div>
            </div>

            {/* Feed Button */}
            <button
              disabled={!amount || !quote || isQuoteLoading}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-bold text-xl transition-colors"
            >
              🍖 FEED {monsterName.toUpperCase()}
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
