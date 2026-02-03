import { http } from 'wagmi'
import { mainnet, base, arbitrum } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Use CORS-friendly public RPC endpoints
export const config = getDefaultConfig({
  appName: 'FeedMe',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mainnet, base, arbitrum],
  transports: {
    [mainnet.id]: http('https://mainnet.gateway.tenderly.co'),
    [base.id]: http('https://mainnet.base.org'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
