// Recent feeders - fetch transaction history from Blockscout APIs

export interface Feeder {
  sender: string
  ensName: string | null
  amount: string
  token: string
  timestamp: number
  txHash: string
  chainId: number
  isAaveDeposit?: boolean
}

// Blockscout API endpoints (free, no API key required)
const BLOCKSCOUT_APIS: Record<number, string> = {
  1: 'https://eth.blockscout.com/api/v2',
  8453: 'https://base.blockscout.com/api/v2',
  42161: 'https://arbitrum.blockscout.com/api/v2',
}

// Zero address (used for mints)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Chain names for display
export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  42161: 'Arbitrum',
}

interface BlockscoutTokenTransfer {
  from: { hash: string; name?: string }
  to: { hash: string }
  token: {
    symbol: string
    decimals: string
    name: string
  }
  total: {
    value: string
    decimals: string
  }
  timestamp: string
  transaction_hash: string
  type: string
}

/**
 * Fetch recent feeders using Blockscout API
 */
export async function fetchRecentFeeders(
  recipientAddress: string,
  chainId: number,
  limit: number = 10
): Promise<Feeder[]> {
  const blockscoutApi = BLOCKSCOUT_APIS[chainId]
  if (!blockscoutApi) {
    console.warn(`No Blockscout API for chain ${chainId}`)
    return []
  }

  try {
    const url = `${blockscoutApi}/addresses/${recipientAddress}/token-transfers?type=ERC-20`
    console.log('Fetching feeders from:', url)

    const response = await fetch(url)
    const data = await response.json()

    if (!data.items || !Array.isArray(data.items)) {
      console.warn('Blockscout API returned no items')
      return []
    }

    console.log('Blockscout API returned', data.items.length, 'transfers')

    // Filter for incoming transfers only
    const incomingTxs = data.items.filter((tx: BlockscoutTokenTransfer) =>
      tx.to.hash.toLowerCase() === recipientAddress.toLowerCase()
    )

    console.log('Incoming transfers:', incomingTxs.length)

    const feeders: Feeder[] = incomingTxs
      .slice(0, limit)
      .map((tx: BlockscoutTokenTransfer): Feeder => {
        // Check if this is an aToken (Aave deposit) - minted from zero address
        const isAaveDeposit = tx.type === 'token_minting' ||
          tx.from.hash.toLowerCase() === ZERO_ADDRESS ||
          tx.token.symbol.toLowerCase().startsWith('a')

        // Determine display token name
        let displayToken = tx.token.symbol
        if (isAaveDeposit && tx.token.symbol.toLowerCase().startsWith('a')) {
          // Strip 'a' prefix and chain identifier for cleaner display
          displayToken = tx.token.symbol
            .replace(/^a(Bas|Arb|Eth)?/i, '')
            .toUpperCase() || tx.token.symbol
        }

        // Format sender
        let sender = tx.from.hash
        const lowerFrom = tx.from.hash.toLowerCase()

        if (lowerFrom === ZERO_ADDRESS) {
          sender = 'Aave' // Minted tokens from Aave
        } else if (tx.from.name) {
          // Use Blockscout's verified contract name
          sender = tx.from.name
        }

        // Format amount
        const decimals = parseInt(tx.total.decimals, 10) || 18
        const rawAmount = BigInt(tx.total.value)
        const divisor = BigInt(10 ** decimals)
        const wholePart = rawAmount / divisor
        const fractionalPart = rawAmount % divisor
        const formattedAmount = `${wholePart}.${fractionalPart.toString().padStart(decimals, '0').slice(0, 2)}`

        // Parse timestamp
        const timestamp = Math.floor(new Date(tx.timestamp).getTime() / 1000)

        return {
          sender,
          ensName: null, // Will be resolved by the hook
          amount: formattedAmount,
          token: displayToken,
          timestamp,
          txHash: tx.transaction_hash,
          chainId,
          isAaveDeposit,
        }
      })

    console.log('Processed feeders:', feeders.length)
    return feeders
  } catch (error) {
    console.error('Error fetching recent feeders:', error)
    return []
  }
}

/**
 * Fetch feeders across multiple chains
 */
export async function fetchRecentFeedersMultiChain(
  recipientAddress: string,
  chainIds: number[] = [8453, 42161, 1],
  limitPerChain: number = 5
): Promise<Feeder[]> {
  console.log('Fetching feeders for address:', recipientAddress, 'on chains:', chainIds)

  const results = await Promise.all(
    chainIds.map(chainId => fetchRecentFeeders(recipientAddress, chainId, limitPerChain))
  )

  // Combine and sort by timestamp (most recent first)
  const combined = results
    .flat()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)

  console.log('Total feeders found:', combined.length)
  return combined
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return `${Math.floor(diff / 604800)}w ago`
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
