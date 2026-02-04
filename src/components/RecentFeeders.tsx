import { formatRelativeTime, truncateAddress, CHAIN_NAMES, type Feeder } from '../lib/feeders'

interface RecentFeedersProps {
  feeders: Feeder[]
  isLoading: boolean
  monsterEmoji?: string
}

export function RecentFeeders({ feeders, isLoading, monsterEmoji = '🐙' }: RecentFeedersProps) {
  if (isLoading) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Feeders</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-zinc-800 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-zinc-800 rounded w-24 mb-1" />
                <div className="h-3 bg-zinc-800 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (feeders.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Feeders</h3>
        <p className="text-zinc-500 text-sm text-center py-4">
          No feeders yet. Be the first! {monsterEmoji}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Feeders</h3>
      <div className="space-y-3">
        {feeders.map((feeder) => (
          <FeederRow key={feeder.txHash} feeder={feeder} monsterEmoji={monsterEmoji} />
        ))}
      </div>
    </div>
  )
}

function FeederRow({ feeder, monsterEmoji }: { feeder: Feeder; monsterEmoji: string }) {
  // Handle special sender names (Aave Pool, LI.FI, etc.)
  const isProtocolSender = feeder.sender === 'Aave Pool' || feeder.sender === 'Aave' || feeder.sender === 'LI.FI'
  const displayName = isProtocolSender
    ? feeder.sender
    : feeder.ensName || truncateAddress(feeder.sender)
  const chainName = CHAIN_NAMES[feeder.chainId] || 'Unknown'

  // Build explorer URL for transaction
  const explorerUrl = getExplorerTxUrl(feeder.chainId, feeder.txHash)

  // Choose icon based on source
  const icon = isProtocolSender ? '👻' : monsterEmoji

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-zinc-800/50 transition-colors group"
    >
      <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium truncate ${feeder.ensName ? 'text-purple-400' : isProtocolSender ? 'text-blue-400' : 'text-zinc-300'}`}>
            {displayName}
          </span>
          {feeder.isAaveDeposit && (
            <span className="text-xs bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded">
              Aave
            </span>
          )}
          <span className="text-zinc-600 text-xs">
            {formatRelativeTime(feeder.timestamp)}
          </span>
        </div>
        <div className="text-sm text-zinc-500">
          {isProtocolSender ? 'deposited' : 'fed'} <span className="text-green-400">{feeder.amount} {feeder.token}</span>
          <span className="text-zinc-600"> on {chainName}</span>
        </div>
      </div>
      <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
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
