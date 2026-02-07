import { formatRelativeTime, truncateAddress, CHAIN_NAMES, type Feeder } from '../lib/feeders'

interface RecentFeedersProps {
  feeders: Feeder[]
  isLoading: boolean
  monsterEmoji?: string
}

export function RecentFeeders({ feeders, isLoading, monsterEmoji = '🐙' }: RecentFeedersProps) {
  if (isLoading) {
    return (
      <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
        <h3 className="text-xs font-brutal tracking-widest text-stone-600 mb-4">RECENT SACRIFICES</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-stone-900 rounded-sm" />
              <div className="flex-1">
                <div className="h-4 bg-stone-900 rounded-sm w-24 mb-1" />
                <div className="h-3 bg-stone-900 rounded-sm w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (feeders.length === 0) {
    return (
      <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
        <h3 className="text-xs font-brutal tracking-widest text-stone-600 mb-4">RECENT SACRIFICES</h3>
        <p className="text-stone-600 text-sm text-center py-4 font-mono">
          No offerings yet. Be the first! {monsterEmoji}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
      <h3 className="text-xs font-brutal tracking-widest text-stone-600 mb-4">RECENT SACRIFICES</h3>
      <div className="space-y-3">
        {feeders.map((feeder) => (
          <FeederRow key={feeder.id} feeder={feeder} monsterEmoji={monsterEmoji} />
        ))}
      </div>
    </div>
  )
}

function FeederRow({ feeder, monsterEmoji }: { feeder: Feeder; monsterEmoji: string }) {
  // Check if sender is a known contract/protocol
  const isContractSender = feeder.sender.includes(' ') || // Has spaces (contract name like "Aave Pool")
    feeder.sender === 'Aave' ||
    feeder.sender === 'LI.FI'

  // Prefer ENS name, then contract name, then truncated address
  const displayName = feeder.ensName
    ? feeder.ensName
    : isContractSender
    ? feeder.sender
    : truncateAddress(feeder.sender)

  const chainName = CHAIN_NAMES[feeder.chainId] || 'Unknown'

  // Build explorer URL for transaction
  const explorerUrl = getExplorerTxUrl(feeder.chainId, feeder.txHash)

  // Choose icon - use Aave icon for Aave deposits, otherwise monster
  const icon = feeder.isAaveDeposit ? '🏦' : monsterEmoji

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 -mx-2 rounded-sm hover:bg-stone-900/50 transition-colors group border border-transparent hover:border-stone-800"
    >
      <div className="w-8 h-8 bg-stone-900 rounded-sm flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-mono truncate ${feeder.ensName ? 'text-red-500' : isContractSender ? 'text-amber-500' : 'text-stone-400'}`}>
            {displayName}
          </span>
          {feeder.isAaveDeposit && (
            <span className="text-xs bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded-sm font-brutal tracking-wider">
              AAVE
            </span>
          )}
          <span className="text-stone-700 text-xs font-mono">
            {formatRelativeTime(feeder.timestamp)}
          </span>
        </div>
        <div className="text-sm text-stone-600 font-mono">
          offered <span className="text-green-500">{feeder.amount} {feeder.token}</span>
          <span className="text-stone-700"> on {chainName}</span>
        </div>
      </div>
      <div className="text-stone-700 group-hover:text-red-500 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
}

function getExplorerTxUrl(chainId: number, txHash: string): string {
  switch (chainId) {
    case 1:
      return `https://etherscan.io/tx/${txHash}`
    case 8453:
      return `https://basescan.org/tx/${txHash}`
    case 42161:
      return `https://arbiscan.io/tx/${txHash}`
    default:
      return `https://etherscan.io/tx/${txHash}`
  }
}
