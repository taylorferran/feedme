import { useParams } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain, useEnsAddress } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { useState } from 'react'
import { useEnsConfig } from '../hooks/useEnsConfig'
import { usePaymentQuote } from '../hooks/usePaymentQuote'
import { useFeedTransaction } from '../hooks/useFeedTransaction'
import { useRecentFeeders } from '../hooks/useRecentFeeders'
import { useResolvedSplits } from '../hooks/useResolvedSplits'
import { RecentFeeders } from '../components/RecentFeeders'
import { SUPPORTED_CHAINS, SUPPORTED_PROTOCOLS, SUPPORTED_TOKENS } from '../types/feedme'
import { getChainId } from '../lib/lifi'
import { parseSplits } from '../lib/splits'

const MONSTER_EMOJIS: Record<string, string> = {
  octopus: '🐙',
  dragon: '🐉',
  blob: '👾',
  kraken: '🦑',
  plant: '🌱',
  ghost: '👻',
}

export function Feed() {
  const { ens } = useParams<{ ens: string }>()
  const { isConnected } = useAccount()
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState('ETH')
  const [selectedChain, setSelectedChain] = useState('base')
  const [showTokenDropdown, setShowTokenDropdown] = useState(false)
  const [showChainDropdown, setShowChainDropdown] = useState(false)

  // Check if on the correct chain
  const targetChainId = getChainId(selectedChain)
  const isOnCorrectChain = currentChainId === targetChainId

  // Fetch real ENS config
  const { config, isLoading, isConfigured } = useEnsConfig(ens)

  // Resolve ENS name to address (for depositing to owner's Aave position)
  const normalizedEns = ens?.endsWith('.eth') ? ens : `${ens}.eth`
  const { data: ensOwnerAddress, isLoading: isResolvingEns } = useEnsAddress({
    name: normalizedEns,
    chainId: mainnet.id,
  })

  // Get display values
  const monsterEmoji = MONSTER_EMOJIS[config?.monsterType || 'octopus'] || '🐙'
  const monsterName = config?.monsterName || 'Monster'
  const destChain = config?.chain ? SUPPORTED_CHAINS[config.chain as keyof typeof SUPPORTED_CHAINS] : null
  const destProtocol = config?.protocol ? SUPPORTED_PROTOCOLS[config.protocol as keyof typeof SUPPORTED_PROTOCOLS] : null
  const destToken = config?.token || 'USDC'

  // Parse payment splits if configured
  const parsedSplits = parseSplits(config?.splits)
  const hasSplits = parsedSplits.isValid && parsedSplits.splits.length > 0

  // Resolve ENS names in splits to addresses
  const {
    splits: resolvedSplits,
    isResolving: isResolvingSplits,
    error: splitsError,
  } = useResolvedSplits(hasSplits ? parsedSplits.splits : undefined)

  // Check if all splits are resolved (have addresses)
  const splitsReady = !hasSplits || (resolvedSplits.length > 0 && !isResolvingSplits)

  // Get live quote from LI.FI (with Aave deposit or splits if configured)
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
    recipientAddress: ensOwnerAddress || undefined, // Deposit to ENS owner's Aave position
    protocol: config?.protocol, // Pass protocol for Aave deposit
    // Pass resolved splits (with addresses) - the hook will use splitter contract on Base
    splits: splitsReady && resolvedSplits.length > 0 ? resolvedSplits : undefined,
  })

  // Transaction execution
  const {
    execute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    simulationError,
    error: txError,
    reset,
  } = useFeedTransaction()

  // Recent feeders (loads asynchronously)
  const { feeders, isLoading: isFeedersLoading } = useRecentFeeders(
    ensOwnerAddress || undefined,
    config?.chain
  )

  const handleFeed = () => {
    if (!quote) return
    execute(quote, selectedChain)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse drop-shadow-[0_0_30px_rgba(153,27,27,0.5)]">🐙</div>
          <p className="text-stone-500 font-brutal tracking-wider">AWAKENING CREATURE...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💀</div>
          <h1 className="text-2xl font-bold mb-2 font-brutal tracking-wider">CREATURE NOT FOUND</h1>
          <p className="text-stone-500 mb-4">
            {ens} hasn't summoned their FeedMe yet.
          </p>
          <a href="/setup" className="text-red-500 hover:text-red-400 hover:underline font-mono">
            [ summon your own creature → ]
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 relative overflow-hidden">
      {/* Subtle gothic background */}
      <div
        className="absolute inset-0 opacity-8 bg-cover bg-center"
        style={{ backgroundImage: 'url(/cover.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/95 to-[#0a0a0a]" />

      <div className="max-w-md mx-auto relative z-10">
        {/* Brand mark */}
        <div className="flex justify-center mb-4">
          <a href="/" className="opacity-60 hover:opacity-100 transition-opacity">
            <img src="/logo.png" alt="FeedMe" className="w-10 h-10 rounded-sm" />
          </a>
        </div>

        {/* Monster Display - animates based on feeding state */}
        <div className="text-center mb-8">
          <div className={`text-9xl mb-4 drop-shadow-[0_0_40px_rgba(153,27,27,0.5)] transition-all duration-300 ${
            isConfirming
              ? 'animate-scary-shake scale-110'
              : isPending
              ? 'animate-pulse scale-105'
              : amount && parseFloat(amount) > 0
              ? 'animate-bounce'
              : 'animate-pulse'
          }`}>{monsterEmoji}</div>
          <h1 className={`text-4xl font-bold mb-2 font-horror transition-colors duration-300 ${
            isConfirming ? 'text-green-500 animate-flicker' : 'text-red-700'
          }`}>{monsterName}</h1>
          <p className="text-stone-500 font-mono text-sm">
            {isConfirming
              ? 'DEVOURING YOUR OFFERING...'
              : isPending
              ? 'AWAITING YOUR SACRIFICE...'
              : `${ens}'s hungry creature`}
          </p>
        </div>

        {/* Monster Speech */}
        <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800 mb-6 text-center relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-950 px-3 text-xs text-stone-600 font-brutal tracking-widest">
            THE CREATURE SPEAKS
          </div>
          <p className="text-lg italic">
            "Feed me <span className="text-red-500 font-bold">{destToken}</span>...
            I dwell in <span className="text-red-500 font-bold">{destProtocol?.name || config?.protocol}</span> on{' '}
            <span className="text-red-500 font-bold">{destChain?.name || config?.chain}</span>"
          </p>
        </div>

        {/* Payment Form - always visible for previewing */}
        <div className="space-y-4">
            {/* Input - with bleeding animation when amount entered */}
            <div className={`bg-stone-950 rounded-sm p-6 border-2 transition-all duration-300 ${
              amount && parseFloat(amount) > 0
                ? 'border-red-800 animate-blood-drip shadow-[0_0_20px_rgba(153,27,27,0.3)]'
                : 'border-stone-800'
            }`}>
              <label className="block text-xs text-stone-500 mb-2 font-brutal tracking-widest">
                {amount && parseFloat(amount) > 0 ? '🩸 YOU SACRIFICE 🩸' : 'YOU SACRIFICE'}
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.0"
                  className={`flex-1 text-2xl bg-transparent focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    amount && parseFloat(amount) > 0 ? 'text-red-400' : ''
                  }`}
                />
                {/* Token Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-sm flex items-center gap-2 font-mono"
                  >
                    {selectedToken}
                    <span className="text-xs text-stone-600">▼</span>
                  </button>
                  {showTokenDropdown && (
                    <div className="absolute top-full mt-1 right-0 bg-stone-900 rounded-sm border-2 border-stone-700 overflow-hidden z-10">
                      {SUPPORTED_TOKENS.map((token) => (
                        <button
                          key={token}
                          onClick={() => {
                            setSelectedToken(token)
                            setShowTokenDropdown(false)
                          }}
                          className={`block w-full px-4 py-2 text-left hover:bg-stone-800 font-mono ${
                            selectedToken === token ? 'bg-stone-800 text-red-500' : ''
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
                  className="text-sm text-stone-500 hover:text-stone-300 flex items-center gap-1 font-mono"
                >
                  on {SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS]?.name || selectedChain}
                  <span className="text-xs">▼</span>
                </button>
                {showChainDropdown && (
                  <div className="absolute top-full mt-1 left-0 bg-stone-900 rounded-sm border-2 border-stone-700 overflow-hidden z-10">
                    {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedChain(key)
                          setShowChainDropdown(false)
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-stone-800 ${
                          selectedChain === key ? 'bg-stone-800 text-red-500' : ''
                        }`}
                      >
                        <span>{chain.icon}</span>
                        <span className="font-mono">{chain.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="text-center text-3xl text-red-900">⬇</div>

            {/* Output Preview */}
            <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
              <label className="block text-xs text-stone-500 mb-2 font-brutal tracking-widest">
                {monsterName.toUpperCase()} DEVOURS
              </label>

              {/* Quote loading state */}
              {isResolvingSplits ? (
                <div className="text-2xl font-bold text-stone-600 animate-pulse font-mono">
                  Resolving splits...
                </div>
              ) : splitsError ? (
                <div className="text-red-500 text-sm font-mono">{splitsError}</div>
              ) : isQuoteLoading ? (
                <div className="text-2xl font-bold text-stone-600 animate-pulse font-mono">
                  Calculating...
                </div>
              ) : quoteError ? (
                <div className="text-red-500 text-sm font-mono">{quoteError}</div>
              ) : quote ? (
                <>
                  <div className="text-2xl font-bold text-green-500 font-mono">
                    ~{outputAmountFormatted} {destToken}
                  </div>
                  {parseFloat(gasCostUSD) > 0 && (
                    <div className="text-sm text-stone-600 mt-1 font-mono">
                      Gas: ~${gasCostUSD}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-2xl font-bold text-stone-600 font-mono">
                  -- {destToken}
                </div>
              )}

              <div className="text-sm text-stone-600 mt-2 font-mono">
                deposited to {ens}'s {destProtocol?.name || config?.protocol} on {destChain?.name || config?.chain}
              </div>
              {ensOwnerAddress && (
                <div className="text-xs text-stone-700 mt-1 font-mono">
                  {ensOwnerAddress.slice(0, 6)}...{ensOwnerAddress.slice(-4)}
                </div>
              )}

              {/* Payment Splits Preview */}
              {hasSplits && (
                <div className="mt-4 pt-4 border-t border-stone-800">
                  <div className="text-xs text-red-500 mb-2 font-brutal tracking-widest">PAYMENT SPLITS:</div>
                  <div className="space-y-1">
                    {parsedSplits.splits.map((split, i) => {
                      const displayRecipient = split.recipient.endsWith('.eth')
                        ? split.recipient
                        : `${split.recipient.slice(0, 8)}...${split.recipient.slice(-6)}`
                      // Calculate split amount from the formatted output
                      const splitAmount = outputAmountFormatted
                        ? (parseFloat(outputAmountFormatted) * split.percentage / 100).toFixed(4)
                        : '--'
                      return (
                        <div key={i} className="flex justify-between text-xs font-mono">
                          <span className="text-stone-500">{displayRecipient}</span>
                          <span className="text-stone-400">
                            {splitAmount} {destToken} ({split.percentage}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Error */}
            {(txError || simulationError) && (
              <div className="bg-red-950/50 border-2 border-red-800 rounded-sm p-4 text-red-400 font-mono text-sm">
                <span className="font-brutal tracking-wider text-red-500">ERROR:</span> {simulationError || txError?.message}
              </div>
            )}

            {/* Transaction Success - with scary celebration animation */}
            {isSuccess && hash && (
              <div className="bg-green-950/30 border-2 border-green-800 rounded-sm p-4 text-green-400 animate-success-scream">
                <div className="text-center text-4xl mb-2 animate-scary-shake">{monsterEmoji}</div>
                <p className="font-bold mb-2 font-brutal tracking-wider text-center animate-flicker">THE CREATURE IS SATISFIED!</p>
                <div className="space-y-2 font-mono text-sm">
                  <a
                    href={
                      selectedChain === 'base'
                        ? `https://basescan.org/tx/${hash}`
                        : selectedChain === 'arbitrum'
                        ? `https://arbiscan.io/tx/${hash}`
                        : `https://etherscan.io/tx/${hash}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block underline hover:text-green-300"
                  >
                    [ view transaction → ]
                  </a>
                  {config?.protocol === 'aave' && (
                    <a
                      href={`https://app.aave.com/?marketName=proto_${config?.chain === 'base' ? 'base' : config?.chain === 'arbitrum' ? 'arbitrum' : 'mainnet'}_v3`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block underline hover:text-green-300"
                    >
                      [ view Aave position → ]
                    </a>
                  )}
                </div>
                <button
                  onClick={() => {
                    reset()
                    setAmount('')
                  }}
                  className="block mt-3 text-sm text-green-300 hover:underline font-mono"
                >
                  [ feed again ]
                </button>
              </div>
            )}

            {/* Connect / Switch Network / Feed Button */}
            {!isSuccess && (
              !isConnected ? (
                <div className="flex flex-col items-center gap-3">
                  <ConnectButton />
                  <p className="text-xs text-stone-600 font-brutal tracking-wider">CONNECT WALLET TO FEED {monsterName.toUpperCase()}</p>
                </div>
              ) : !isOnCorrectChain ? (
                <button
                  onClick={() => switchChain({ chainId: targetChainId as 1 | 8453 | 42161 })}
                  className="w-full py-4 bg-amber-900 hover:bg-amber-800 border-2 border-amber-700 rounded-sm font-bold text-xl transition-all font-brutal tracking-widest"
                >
                  SWITCH TO {SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS]?.name.toUpperCase()}
                </button>
              ) : (
                <button
                  onClick={handleFeed}
                  disabled={!amount || !quote || isQuoteLoading || isPending || isConfirming || !ensOwnerAddress || isResolvingSplits || !!splitsError}
                  className={`w-full py-4 bg-red-900 hover:bg-red-800 disabled:bg-stone-900 disabled:text-stone-600 disabled:border-stone-800 border-2 border-red-700 rounded-sm font-bold text-xl transition-all font-brutal tracking-widest ${
                    isConfirming
                      ? 'animate-demon-glow animate-scary-shake'
                      : isPending
                      ? 'animate-blood-pulse text-white'
                      : amount && quote
                      ? 'hover:shadow-[0_0_30px_rgba(153,27,27,0.4)]'
                      : ''
                  }`}
                >
                  {isResolvingEns
                    ? 'RESOLVING ENS...'
                    : isResolvingSplits
                    ? 'RESOLVING SPLITS...'
                    : !ensOwnerAddress
                    ? 'CANNOT RESOLVE ENS'
                    : splitsError
                    ? 'SPLIT RESOLUTION FAILED'
                    : isPending
                    ? '⏳ CONFIRM IN WALLET...'
                    : isConfirming
                    ? `👹 DEVOURING...`
                    : `🩸 FEED ${monsterName.toUpperCase()}`}
                </button>
              )
            )}

            {/* Info */}
            <p className="text-center text-xs text-stone-600 font-mono">
              Powered by LI.FI — swap, bridge & deposit in one transaction
            </p>

            {/* Recent Feeders */}
            <RecentFeeders
              feeders={feeders}
              isLoading={isFeedersLoading}
              monsterEmoji={monsterEmoji}
            />
          </div>
      </div>
    </div>
  )
}
