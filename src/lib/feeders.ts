// Recent feeders - fetch transaction history from Blockscout APIs

export interface Feeder {
  id: string // Unique ID for React keys (txHash + token)
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

// Whitelist of legitimate tokens (lowercase symbols)
// This filters out spam/scam airdrops
const LEGITIMATE_TOKENS = new Set([
  // Stablecoins
  'usdc', 'usdt', 'dai', 'usdc.e', 'usdce',
  'usdt0', // Bridged USDT (Stargate/LayerZero)
  // ETH variants
  'eth', 'weth',
  // Aave aTokens (Ethereum)
  'ausdc', 'ausdt', 'adai', 'aweth', 'aeth',
  // Aave aTokens (Base) - format: aBasUSDC
  'abasusdc', 'abasweth', 'abasdai',
  // Aave aTokens (Arbitrum) - format: aArbUSDC
  'aarbusdc', 'aarbusdt', 'aarbweth', 'aarbdai',
  // Aave variable debt tokens (to filter out, but recognize as legitimate)
  'variabledebtethusdc', 'variabledebtbasusdc', 'variabledebtarbusdc',
])

interface BlockscoutTokenTransfer {
  from: { hash: string; name?: string }
  to: { hash: string }
  token: {
    symbol: string
    decimals: string
    name: string
    address: string
  }
  total: {
    value: string
    decimals: string
  }
  timestamp: string
  transaction_hash: string
  type: string
}

interface BlockscoutTransaction {
  hash: string
  from: { hash: string }
  to: { hash: string } | null
  timestamp: string
}

/**
 * Check if a token is legitimate (not spam)
 */
function isLegitimateToken(symbol: string): boolean {
  const lowerSymbol = symbol.toLowerCase()
  return LEGITIMATE_TOKENS.has(lowerSymbol)
}

/**
 * Fetch transaction details to get the original sender
 */
async function fetchTransactionSender(
  blockscoutApi: string,
  txHash: string
): Promise<string | null> {
  try {
    const response = await fetch(`${blockscoutApi}/transactions/${txHash}`)
    const data: BlockscoutTransaction = await response.json()
    return data.from?.hash || null
  } catch {
    return null
  }
}

/**
 * Fetch recent feeders using Blockscout API
 * Only returns legitimate token transfers (filters out spam airdrops)
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

    const response = await fetch(url)
    const data = await response.json()

    if (!data.items || !Array.isArray(data.items)) {
      return []
    }

    // Filter for incoming transfers of legitimate tokens only
    const incomingTxs = data.items.filter((tx: BlockscoutTokenTransfer) => {
      const isIncoming = tx.to.hash.toLowerCase() === recipientAddress.toLowerCase()
      const isLegitimate = isLegitimateToken(tx.token.symbol)
      return isIncoming && isLegitimate
    })

    // Process all transfers in parallel
    const txsToProcess = incomingTxs.slice(0, limit)

    // First pass: identify which txs need sender lookup (Aave deposits from zero address)
    const needsSenderLookup: { index: number; txHash: string }[] = []

    const feeders: Feeder[] = txsToProcess.map((tx: BlockscoutTokenTransfer, index: number) => {
      // Check if this is an aToken (Aave deposit) - minted from zero address
      const isAaveDeposit = tx.type === 'token_minting' ||
        tx.from.hash.toLowerCase() === ZERO_ADDRESS ||
        tx.token.symbol.toLowerCase().startsWith('a')

      // Determine display token name
      let displayToken = tx.token.symbol
      if (isAaveDeposit && tx.token.symbol.toLowerCase().startsWith('a')) {
        displayToken = tx.token.symbol
          .replace(/^a(Bas|Arb|Eth)?/i, '')
          .toUpperCase() || tx.token.symbol
      }

      // Get sender - mark for lookup if it's a zero address mint
      let sender = tx.from.hash
      const lowerFrom = tx.from.hash.toLowerCase()

      if (lowerFrom === ZERO_ADDRESS && isAaveDeposit) {
        sender = 'Aave' // Default, will be updated in parallel
        needsSenderLookup.push({ index, txHash: tx.transaction_hash })
      } else if (tx.from.name) {
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

      // Create unique ID (txHash + token address to handle multiple tokens in same tx)
      const id = `${tx.transaction_hash}-${tx.token.address}`

      return {
        id,
        sender,
        ensName: null,
        amount: formattedAmount,
        token: displayToken,
        timestamp,
        txHash: tx.transaction_hash,
        chainId,
        isAaveDeposit,
      }
    })

    // Fetch original senders in parallel (for Aave deposits)
    if (needsSenderLookup.length > 0) {
      const senderResults = await Promise.all(
        needsSenderLookup.map(({ txHash }) =>
          fetchTransactionSender(blockscoutApi, txHash)
        )
      )

      // Update feeders with resolved senders
      senderResults.forEach((sender, i) => {
        if (sender) {
          feeders[needsSenderLookup[i].index].sender = sender
        }
      })
    }

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
  const results = await Promise.all(
    chainIds.map(chainId => fetchRecentFeeders(recipientAddress, chainId, limitPerChain))
  )

  // Combine, deduplicate by id, and sort by timestamp (most recent first)
  const seen = new Set<string>()
  const combined = results
    .flat()
    .filter(feeder => {
      if (seen.has(feeder.id)) return false
      seen.add(feeder.id)
      return true
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)

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
