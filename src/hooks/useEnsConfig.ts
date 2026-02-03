import { useReadContract, useReadContracts } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { ENS_CONTRACTS, ENS_REGISTRY_ABI, PUBLIC_RESOLVER_ABI, getNamehash, FEEDME_KEYS } from '../lib/ens'
import type { FeedMeConfig, MonsterType } from '../types/feedme'

export function useEnsConfig(ensName: string | undefined) {
  // Normalize the ENS name
  const normalizedName = ensName
    ? ensName.endsWith('.eth')
      ? ensName.toLowerCase()
      : `${ensName.toLowerCase()}.eth`
    : undefined

  const node = normalizedName ? getNamehash(normalizedName) : undefined

  // First, get the resolver for this name
  const { data: resolverAddress } = useReadContract({
    address: ENS_CONTRACTS.registry,
    abi: ENS_REGISTRY_ABI,
    functionName: 'resolver',
    args: node ? [node] : undefined,
    chainId: mainnet.id,
    query: {
      enabled: !!node,
    },
  })

  // Use the name's resolver, or fall back to public resolver
  const targetResolver = (resolverAddress as `0x${string}`) || ENS_CONTRACTS.publicResolver

  console.log('Reading config from resolver:', targetResolver, 'for name:', normalizedName)

  const { data, isLoading, error } = useReadContracts({
    contracts: node && resolverAddress
      ? [
          {
            address: targetResolver,
            abi: PUBLIC_RESOLVER_ABI,
            functionName: 'text',
            args: [node, FEEDME_KEYS.chain],
            chainId: mainnet.id,
          },
          {
            address: targetResolver,
            abi: PUBLIC_RESOLVER_ABI,
            functionName: 'text',
            args: [node, FEEDME_KEYS.token],
            chainId: mainnet.id,
          },
          {
            address: targetResolver,
            abi: PUBLIC_RESOLVER_ABI,
            functionName: 'text',
            args: [node, FEEDME_KEYS.protocol],
            chainId: mainnet.id,
          },
          {
            address: targetResolver,
            abi: PUBLIC_RESOLVER_ABI,
            functionName: 'text',
            args: [node, FEEDME_KEYS.monsterName],
            chainId: mainnet.id,
          },
          {
            address: targetResolver,
            abi: PUBLIC_RESOLVER_ABI,
            functionName: 'text',
            args: [node, FEEDME_KEYS.monsterType],
            chainId: mainnet.id,
          },
        ]
      : undefined,
    query: {
      enabled: !!node && !!resolverAddress,
    },
  })

  // Parse results into FeedMeConfig
  const config: FeedMeConfig | null =
    data && data[0]?.result
      ? {
          chain: (data[0]?.result as string) || '',
          token: (data[1]?.result as string) || '',
          protocol: (data[2]?.result as string) || '',
          action: 'deposit', // Default action
          monsterName: (data[3]?.result as string) || 'Monster',
          monsterType: ((data[4]?.result as string) || 'octopus') as MonsterType,
        }
      : null

  const isConfigured = !!config?.chain && !!config?.token && !!config?.protocol

  return {
    config,
    isLoading,
    error,
    isConfigured,
  }
}
