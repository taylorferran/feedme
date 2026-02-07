import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { SUPPORTED_CHAINS, SUPPORTED_PROTOCOLS, SUPPORTED_TOKENS, isProtocolAvailableOnChain, isTokenAcceptedByProtocol } from '../types/feedme'
import { useEnsOwner, useEnsResolver, useSetFeedMeConfig } from '../hooks/useEnsSetup'
import { SplitConfig } from '../components/SplitConfig'
import { type Split, serializeSplits, validateSplits } from '../lib/splits'
import { isSplitterSupported } from '../lib/splitter'
import { getChainId } from '../lib/lifi'

const MONSTER_TYPES = [
  { id: 'octopus', emoji: '🐙', name: 'Octopus' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon' },
  { id: 'blob', emoji: '👾', name: 'Blob' },
  { id: 'kraken', emoji: '🦑', name: 'Kraken' },
  { id: 'plant', emoji: '🌱', name: 'Plant' },
  { id: 'ghost', emoji: '👻', name: 'Ghost' },
]

export function Setup() {
  const navigate = useNavigate()
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
  const [splits, setSplits] = useState<Split[]>([])

  // ENS hooks
  const { data: ensOwner, isLoading: isCheckingOwner } = useEnsOwner(ensName || undefined)
  const { data: resolverAddress } = useEnsResolver(ensName || undefined)
  const { setConfig, isPending, isConfirming, isSuccess, error, hash } = useSetFeedMeConfig(
    resolverAddress as `0x${string}` | undefined
  )

  const isOnMainnet = chainId === mainnet.id
  const isOwner = ensOwner && address && ensOwner.toLowerCase() === address.toLowerCase()
  const splitsValidation = validateSplits(splits)
  const areSplitsValid = splits.length === 0 || splitsValidation.isValid
  const isFormComplete = ensName && selectedChain && selectedToken && selectedProtocol && monsterName && areSplitsValid

  // Redirect to monster page after successful setup
  useEffect(() => {
    if (isSuccess && ensName) {
      // Small delay to let user see the success message
      const timer = setTimeout(() => {
        const normalizedName = ensName.endsWith('.eth') ? ensName : `${ensName}.eth`
        navigate(`/${normalizedName}`)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, ensName, navigate])

  const handleSubmit = () => {
    if (!isFormComplete) return

    setConfig(ensName, {
      chain: selectedChain,
      token: selectedToken,
      protocol: selectedProtocol,
      monsterName,
      monsterType,
      // Only include splits if they're configured and valid
      splits: splits.length > 0 && splitsValidation.isValid ? serializeSplits(splits) : undefined,
    })
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-horror text-red-700 mb-2">Summon Your Creature</h1>
          <p className="text-stone-500">
            Configure where your payments should flow. Settings are inscribed on ENS (Ethereum mainnet).
          </p>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <ConnectButton />
          {isConnected && !isOnMainnet && (
            <button
              onClick={() => switchChain({ chainId: mainnet.id })}
              className="px-4 py-2 bg-amber-900 hover:bg-amber-800 border border-amber-700 rounded-sm text-sm font-brutal tracking-wider"
            >
              SWITCH TO ETHEREUM
            </button>
          )}
        </div>

        {isConnected && isOnMainnet ? (
          <div className="space-y-6">
            {/* ENS Name Input */}
            <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
              <label className="block text-xs font-brutal tracking-widest text-stone-500 mb-3">
                YOUR ENS NAME
              </label>
              <input
                type="text"
                value={ensName}
                onChange={(e) => setEnsName(e.target.value)}
                placeholder="yourname.eth"
                className="w-full px-4 py-3 bg-stone-900 rounded-sm border-2 border-stone-700 focus:border-red-700 focus:outline-none font-mono"
              />
              {ensName && (
                <div className="mt-2 text-sm font-mono">
                  {isCheckingOwner ? (
                    <span className="text-stone-600">Checking ownership...</span>
                  ) : isOwner ? (
                    <span className="text-green-500">✓ You control this name</span>
                  ) : ensOwner ? (
                    <span className="text-red-500">✗ You don't control this name</span>
                  ) : (
                    <span className="text-stone-600">Name not found</span>
                  )}
                  {resolverAddress && (
                    <div className="text-stone-700 text-xs mt-1">
                      Resolver: {resolverAddress.slice(0, 10)}...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chain Selection */}
            <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
              <label className="block text-xs font-brutal tracking-widest text-stone-500 mb-3">
                CREATURE'S REALM
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedChain(key)
                      // Clear protocol if it's not available on new chain
                      if (selectedProtocol && !isProtocolAvailableOnChain(selectedProtocol, key)) {
                        setSelectedProtocol('')
                      }
                      // Clear splits if new chain doesn't support splitter
                      const newChainId = getChainId(key)
                      if (!isSplitterSupported(newChainId) && splits.length > 0) {
                        setSplits([])
                      }
                    }}
                    className={`p-4 rounded-sm border-2 transition-all ${
                      selectedChain === key
                        ? 'bg-red-900/50 border-red-700 shadow-[0_0_20px_rgba(153,27,27,0.3)]'
                        : 'bg-stone-900 hover:bg-stone-800 border-stone-700 hover:border-stone-600'
                    }`}
                  >
                    <span className="text-2xl">{chain.icon}</span>
                    <div className="mt-2 font-brutal tracking-wider text-sm">{chain.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Protocol Selection */}
            <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
              <label className="block text-xs font-brutal tracking-widest text-stone-500 mb-3">
                CREATURE'S LAIR
              </label>
              {!selectedChain ? (
                <p className="text-stone-600 text-sm font-mono">Select a realm first</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(SUPPORTED_PROTOCOLS).map(([key, protocol]) => {
                    const isAvailable = isProtocolAvailableOnChain(key, selectedChain)
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (!isAvailable) return
                          setSelectedProtocol(key)
                          // Clear token if it's not accepted by new protocol
                          if (selectedToken && !isTokenAcceptedByProtocol(selectedToken, key)) {
                            setSelectedToken('')
                          }
                          // Clear splits if switching away from Aave (splits only work with Aave)
                          if (key !== 'aave' && splits.length > 0) {
                            setSplits([])
                          }
                        }}
                        disabled={!isAvailable}
                        className={`p-4 rounded-sm border-2 transition-all ${
                          selectedProtocol === key
                            ? 'bg-red-900/50 border-red-700 shadow-[0_0_20px_rgba(153,27,27,0.3)]'
                            : isAvailable
                            ? 'bg-stone-900 hover:bg-stone-800 border-stone-700 hover:border-stone-600'
                            : 'bg-stone-950 border-stone-900 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-2xl">{protocol.icon}</span>
                        <div className="mt-2 font-brutal tracking-wider text-sm">{protocol.name}</div>
                        <div className="text-xs text-stone-600 font-mono">
                          {isAvailable ? protocol.action : 'Not in this realm'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Token Selection */}
            <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
              <label className="block text-xs font-brutal tracking-widest text-stone-500 mb-3">
                CREATURE'S DIET
              </label>
              {!selectedProtocol ? (
                <p className="text-stone-600 text-sm font-mono">Select a lair first</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_TOKENS.map((token) => {
                    const isAccepted = isTokenAcceptedByProtocol(token, selectedProtocol)
                    return (
                      <button
                        key={token}
                        onClick={() => isAccepted && setSelectedToken(token)}
                        disabled={!isAccepted}
                        className={`px-4 py-2 rounded-sm border-2 transition-all font-mono ${
                          selectedToken === token
                            ? 'bg-red-900/50 border-red-700 shadow-[0_0_20px_rgba(153,27,27,0.3)]'
                            : isAccepted
                            ? 'bg-stone-900 hover:bg-stone-800 border-stone-700 hover:border-stone-600'
                            : 'bg-stone-950 border-stone-900 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        {token}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Monster Name */}
            <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
              <label className="block text-xs font-brutal tracking-widest text-stone-500 mb-3">
                NAME YOUR CREATURE
              </label>
              <input
                type="text"
                value={monsterName}
                onChange={(e) => setMonsterName(e.target.value)}
                placeholder="Chompy"
                className="w-full px-4 py-3 bg-stone-900 rounded-sm border-2 border-stone-700 focus:border-red-700 focus:outline-none font-mono"
              />
            </div>

            {/* Monster Type */}
            <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
              <label className="block text-xs font-brutal tracking-widest text-stone-500 mb-3">
                CREATURE FORM
              </label>
              <div className="flex flex-wrap gap-3">
                {MONSTER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setMonsterType(type.id)}
                    className={`p-4 rounded-sm border-2 transition-all ${
                      monsterType === type.id
                        ? 'bg-red-900/50 border-red-700 shadow-[0_0_20px_rgba(153,27,27,0.3)]'
                        : 'bg-stone-900 hover:bg-stone-800 border-stone-700 hover:border-stone-600'
                    }`}
                  >
                    <span className="text-3xl">{type.emoji}</span>
                    <div className="mt-1 text-xs font-brutal tracking-wider">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Splits - Only available with Aave on Base */}
            {selectedChain && selectedProtocol === 'aave' && isSplitterSupported(getChainId(selectedChain)) ? (
              <SplitConfig
                splits={splits}
                onChange={setSplits}
                disabled={isPending || isConfirming}
              />
            ) : selectedChain && selectedProtocol ? (
              <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
                <label className="block text-xs font-brutal tracking-widest text-stone-500 mb-3">
                  PAYMENT SPLITS
                </label>
                <p className="text-stone-600 text-sm font-mono">
                  {selectedProtocol !== 'aave'
                    ? 'Payment splits are only available with Aave protocol. Select Aave to enable splits.'
                    : !isSplitterSupported(getChainId(selectedChain))
                    ? 'Payment splits are only available on Base. Switch to Base to enable splits.'
                    : 'Select a protocol to configure splits.'}
                </p>
              </div>
            ) : null}

            {/* Preview */}
            {isFormComplete && (
              <div className="bg-stone-950 rounded-sm p-6 border-2 border-red-800/50 shadow-[0_0_30px_rgba(153,27,27,0.2)]">
                <h3 className="font-brutal tracking-widest text-stone-500 text-xs mb-3">CREATURE PREVIEW</h3>
                <div className="text-center py-4">
                  <span className="text-6xl drop-shadow-[0_0_30px_rgba(153,27,27,0.5)]">
                    {MONSTER_TYPES.find((t) => t.id === monsterType)?.emoji}
                  </span>
                  <div className="mt-3 text-2xl font-horror text-red-600">{monsterName}</div>
                  <p className="text-stone-500 mt-2 font-mono text-sm">
                    Dwells in {SUPPORTED_PROTOCOLS[selectedProtocol as keyof typeof SUPPORTED_PROTOCOLS]?.name} on{' '}
                    {SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS]?.name}, devours {selectedToken}
                  </p>
                  {splits.length > 0 && splitsValidation.isValid && (
                    <div className="mt-3 text-sm">
                      <span className="text-red-500 font-brutal tracking-wider text-xs">SPLITS ENABLED:</span>
                      <div className="mt-1 space-y-1 font-mono text-xs">
                        {splits.map((split, i) => (
                          <div key={i} className="text-stone-600">
                            {split.recipient.length > 20
                              ? `${split.recipient.slice(0, 10)}...${split.recipient.slice(-6)}`
                              : split.recipient || '(empty)'
                            }: {split.percentage}%
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-stone-700 mt-4 font-mono">
                    feedme.finance/{ensName}
                  </p>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="bg-red-950/50 border-2 border-red-800 rounded-sm p-4 text-red-400 font-mono text-sm">
                <span className="font-brutal tracking-wider text-red-500">ERROR:</span> {error.message}
              </div>
            )}

            {/* Success display */}
            {isSuccess && hash && (
              <div className="bg-green-950/30 border-2 border-green-800 rounded-sm p-4 text-green-400">
                <p className="font-brutal tracking-widest">CREATURE SUMMONED SUCCESSFULLY</p>
                <p className="text-sm mt-1 text-green-300 font-mono">Transporting to your creature...</p>
                <a
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono underline mt-2 inline-block hover:text-green-200"
                >
                  [ view transaction → ]
                </a>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSubmit}
              disabled={!isFormComplete || !isOwner || isPending || isConfirming}
              className="w-full py-4 bg-red-900 hover:bg-red-800 disabled:bg-stone-900 disabled:text-stone-600 disabled:border-stone-800 border-2 border-red-700 rounded-sm font-bold transition-all hover:shadow-[0_0_30px_rgba(153,27,27,0.4)] font-brutal tracking-widest text-lg"
            >
              {isPending
                ? 'CONFIRM IN WALLET...'
                : isConfirming
                ? 'INSCRIBING TO ENS...'
                : '🩸 SUMMON CREATURE'}
            </button>

            {!isOwner && ensName && !isCheckingOwner && (
              <p className="text-center text-sm text-stone-600 font-mono">
                You must control the ENS name to inscribe settings
              </p>
            )}
          </div>
        ) : isConnected ? (
          <div className="text-center py-12 text-stone-600 font-brutal tracking-wider">
            SWITCH TO ETHEREUM MAINNET TO INSCRIBE YOUR ENS
          </div>
        ) : (
          <div className="text-center py-12 text-stone-600 font-brutal tracking-wider">
            CONNECT YOUR WALLET TO BEGIN THE RITUAL
          </div>
        )}
      </div>
    </div>
  )
}
