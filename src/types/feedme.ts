export interface FeedMeConfig {
  // Core preferences
  chain: string
  token: string

  // DeFi destination
  protocol: string
  action: string
  vault?: string

  // Optional: splits
  split?: string

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
