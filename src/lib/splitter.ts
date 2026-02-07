// FeedMeSplitter contract configuration
// Deployed on Base for splitting payments to multiple recipients

export const SPLITTER_ADDRESS: Record<number, string> = {
  8453: '0xdae12bd760ce15AaDdcD883E54a8F86f9084d3fB', // Base
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

// Convert percentage (1-100) to basis points (1-10000)
export function percentageToBps(percentage: number): number {
  return percentage * 100
}

// Convert basis points to percentage
export function bpsToPercentage(bps: number): number {
  return bps / 100
}
