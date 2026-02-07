// FeedMeSplitter contract configuration
// Deployed on Base for splitting payments to multiple recipients

export const SPLITTER_ADDRESS: Record<number, string> = {
  8453: '0xa3e22f29A1B91d672F600D90e28bca45C53ef456', // Base (v4 - with distributeToAave)
}

// Aave V3 Pool addresses per chain
export const AAVE_POOL_ADDRESS: Record<number, string> = {
  8453: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5', // Base Aave V3 Pool
}

export const SPLITTER_ABI = [
  {
    name: 'distribute',
    type: 'function',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'bps', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'distributeETH',
    type: 'function',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'bps', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'distributeToAave',
    type: 'function',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'aavePool', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'bps', type: 'uint256[]' },
    ],
    outputs: [],
  },
] as const

// Basis points denominator (100% = 10000)
export const BPS_DENOMINATOR = 10000

// Check if splitter is available on a chain
export function isSplitterSupported(chainId: number): boolean {
  return chainId in SPLITTER_ADDRESS
}

// Get splitter address for a chain
export function getSplitterAddress(chainId: number): string | undefined {
  return SPLITTER_ADDRESS[chainId]
}

// Get Aave pool address for a chain
export function getAavePoolAddress(chainId: number): string | undefined {
  return AAVE_POOL_ADDRESS[chainId]
}

// Convert percentage (1-100) to basis points (1-10000)
export function percentageToBps(percentage: number): number {
  return percentage * 100
}

// Convert basis points to percentage
export function bpsToPercentage(bps: number): number {
  return bps / 100
}
