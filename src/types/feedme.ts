export interface FeedMeConfig {
  // Core preferences
  chain: string
  token: string

  // DeFi destination
  protocol: string
  action: string
  vault?: string

  // Optional: payment splits (V2)
  // Format: "recipient:percentage,recipient:percentage,..."
  splits?: string

  // Optional: constraints
  minAmount?: string
  maxSlippage?: string

  // Optional: fun
  monsterName?: string
  monsterType?: MonsterType
}

export type MonsterType = 'octopus' | 'dragon' | 'blob' | 'kraken' | 'plant'

export interface MonsterState {
  name: string
  type: MonsterType
  mood: 'hungry' | 'eating' | 'satisfied' | 'sleeping'
  size: 'small' | 'medium' | 'large'
}

export interface PaymentPreview {
  inputToken: string
  inputChain: string
  inputAmount: string
  outputToken: string
  outputChain: string
  outputAmount: string
  protocol: string
  estimatedGas: string
  slippage: number
}

export const SUPPORTED_CHAINS = {
  base: {
    id: 8453,
    name: 'Base',
    icon: '🔵',
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    icon: '🔷',
  },
  mainnet: {
    id: 1,
    name: 'Ethereum',
    icon: '⟠',
  },
} as const

export const SUPPORTED_TOKENS = ['USDC', 'ETH', 'USDT', 'DAI', 'WETH'] as const

export const SUPPORTED_PROTOCOLS = {
  aave: {
    name: 'Aave',
    action: 'deposit',
    icon: '👻',
  },
  lido: {
    name: 'Lido',
    action: 'stake',
    icon: '🌊',
  },
  aerodrome: {
    name: 'Aerodrome',
    action: 'addLiquidity',
    icon: '✈️',
  },
} as const

// Which protocols are available on which chains
export const PROTOCOL_CHAINS: Record<string, string[]> = {
  aave: ['mainnet', 'base', 'arbitrum'], // Aave V3 on all chains
  lido: ['mainnet'],                      // Lido staking only on Ethereum
  aerodrome: ['base'],                    // Aerodrome is Base-native
}

// Helper: get available protocols for a chain
export function getProtocolsForChain(chainKey: string): string[] {
  return Object.entries(PROTOCOL_CHAINS)
    .filter(([_, chains]) => chains.includes(chainKey))
    .map(([protocol]) => protocol)
}

// Helper: check if a protocol is available on a chain
export function isProtocolAvailableOnChain(protocol: string, chainKey: string): boolean {
  return PROTOCOL_CHAINS[protocol]?.includes(chainKey) ?? false
}

// Which tokens each protocol accepts
export const PROTOCOL_TOKENS: Record<string, readonly string[]> = {
  aave: ['USDC', 'ETH', 'USDT', 'DAI', 'WETH'], // Aave accepts most major tokens
  lido: ['ETH'],                                  // Lido only stakes ETH
  aerodrome: ['USDC', 'ETH', 'WETH'],            // Aerodrome main pairs
}

// Helper: get available tokens for a protocol
export function getTokensForProtocol(protocol: string): readonly string[] {
  return PROTOCOL_TOKENS[protocol] ?? SUPPORTED_TOKENS
}

// Helper: check if a token is accepted by a protocol
export function isTokenAcceptedByProtocol(token: string, protocol: string): boolean {
  return PROTOCOL_TOKENS[protocol]?.includes(token) ?? true
}
