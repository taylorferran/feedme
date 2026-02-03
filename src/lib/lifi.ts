import { createConfig, getQuote, getTokens } from '@lifi/sdk'

// Initialize LI.FI SDK
createConfig({
  integrator: 'feedme',
  apiKey: import.meta.env.VITE_LIFI_API_KEY,
})

// Chain IDs (using raw numbers to avoid enum issues)
export const CHAIN_IDS = {
  // Testnets
  sepolia: 11155111,
  baseSepolia: 84532,
  arbitrumSepolia: 421614,
  // Mainnets (fallback for LI.FI which may not support all testnets)
  base: 8453,
  arbitrum: 42161,
  mainnet: 1,
} as const

// Native token address (used for ETH)
export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'

// Token addresses per chain
export const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  // Mainnet
  1: {
    ETH: NATIVE_TOKEN,
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EescdeCB5BE3830',
  },
  // Base
  8453: {
    ETH: NATIVE_TOKEN,
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  // Arbitrum
  42161: {
    ETH: NATIVE_TOKEN,
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  // Sepolia (testnet)
  11155111: {
    ETH: NATIVE_TOKEN,
    WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
}

// Map our chain keys to LI.FI chain IDs
// LI.FI doesn't support testnets, so ALL testnet keys map to mainnet equivalents
export function getChainId(chainKey: string): number {
  switch (chainKey) {
    case 'sepolia':
      return 1 // Sepolia → Ethereum mainnet for LI.FI
    case 'baseSepolia':
      return 8453 // Base Sepolia → Base mainnet for LI.FI
    case 'arbitrumSepolia':
      return 42161 // Arbitrum Sepolia → Arbitrum mainnet for LI.FI
    case 'base':
      return 8453
    case 'arbitrum':
      return 42161
    case 'mainnet':
      return 1
    default:
      return 1
  }
}

// Get token address for a chain
export function getTokenAddress(chainId: number, tokenSymbol: string): string {
  const chainTokens = TOKEN_ADDRESSES[chainId]
  if (!chainTokens) {
    // Fall back to mainnet Ethereum if chain not found
    const ethTokens = TOKEN_ADDRESSES[1]
    return ethTokens?.[tokenSymbol] || NATIVE_TOKEN
  }
  return chainTokens[tokenSymbol] || NATIVE_TOKEN
}

// Quote response type (simplified to avoid type import issues)
export interface LiFiQuote {
  estimate: {
    toAmount: string
    toAmountMin: string
    gasCosts?: Array<{
      amountUSD?: string
    }>
    approvalAddress?: string
  }
  action: {
    toToken?: {
      decimals: number
      symbol: string
    }
  }
  toolDetails?: {
    name: string
  }
  transactionRequest?: {
    to: string
    data: string
    value: string
    gasLimit: string
  }
}

// Fetch a quote from LI.FI
export async function fetchQuote(params: {
  fromChain: number
  toChain: number
  fromToken: string
  toToken: string
  fromAmount: string
  fromAddress: string
  toAddress: string
}): Promise<LiFiQuote> {
  const result = await getQuote({
    fromChain: params.fromChain,
    toChain: params.toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
  })

  return result as unknown as LiFiQuote
}

// Helper to format token amount from wei
export function formatTokenAmount(amount: string, decimals: number): string {
  const value = BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const integerPart = value / divisor
  const fractionalPart = value % divisor

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 2)
  return `${integerPart}.${fractionalStr}`
}

// Helper to parse token amount to wei
export function parseTokenAmount(amount: string, decimals: number): string {
  const [integerPart, fractionalPart = ''] = amount.split('.')
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals)
  const combined = integerPart + paddedFractional
  return BigInt(combined).toString()
}

// Export getTokens for fetching available tokens
export { getTokens }
