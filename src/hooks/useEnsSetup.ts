import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import {
  ENS_CONTRACTS,
  ENS_REGISTRY_ABI,
  NAME_WRAPPER_ABI,
  PUBLIC_RESOLVER_ABI,
  getNamehash,
  encodeSetTextCalls,
  FEEDME_KEYS,
} from '../lib/ens'

export interface FeedMeSetupConfig {
  chain: string
  token: string
  protocol: string
  monsterName: string
  monsterType: string
  // V2: Payment splits (optional)
  splits?: string // Format: "recipient:percentage,recipient:percentage,..."
}

// Hook to get the actual owner of an ENS name (handles both wrapped and unwrapped names)
export function useEnsOwner(ensName: string | undefined) {
  // Normalize the ENS name - add .eth if not present
  const normalizedName = ensName
    ? ensName.endsWith('.eth')
      ? ensName.toLowerCase()
      : `${ensName.toLowerCase()}.eth`
    : undefined

  const node = normalizedName ? getNamehash(normalizedName) : undefined
  // For NameWrapper, the tokenId is the namehash as a uint256
  const tokenId = node ? BigInt(node) : undefined

  const { data, isLoading, error } = useReadContracts({
    contracts: node
      ? [
          // First check registry owner
          {
            address: ENS_CONTRACTS.registry,
            abi: ENS_REGISTRY_ABI,
            functionName: 'owner',
            args: [node],
            chainId: mainnet.id,
          },
          // Also check NameWrapper owner (in case it's wrapped)
          {
            address: ENS_CONTRACTS.nameWrapper,
            abi: NAME_WRAPPER_ABI,
            functionName: 'ownerOf',
            args: [tokenId!],
            chainId: mainnet.id,
          },
        ]
      : undefined,
    query: {
      enabled: !!node,
    },
  })

  // Determine the actual owner
  // If registry owner is NameWrapper, use NameWrapper's ownerOf result
  // Otherwise use registry owner
  let actualOwner: `0x${string}` | undefined = undefined

  if (data) {
    // Check if registry call succeeded
    const registryResult = data[0]
    const wrapperResult = data[1]

    const registryOwner =
      registryResult?.status === 'success' ? (registryResult.result as `0x${string}`) : undefined
    const wrapperOwner =
      wrapperResult?.status === 'success' ? (wrapperResult.result as `0x${string}`) : undefined

    // Debug logging
    console.log('ENS Ownership Check:', {
      name: normalizedName,
      node,
      registryResult,
      wrapperResult,
      registryOwner,
      wrapperOwner,
    })

    // Check if the name is wrapped (registry owner is NameWrapper contract)
    if (registryOwner?.toLowerCase() === ENS_CONTRACTS.nameWrapper.toLowerCase()) {
      // Name is wrapped, use NameWrapper owner
      actualOwner = wrapperOwner
    } else if (registryOwner && registryOwner !== '0x0000000000000000000000000000000000000000') {
      // Name is not wrapped but has an owner
      actualOwner = registryOwner
    }
    // If registryOwner is zero address or undefined, name doesn't exist
  }

  return {
    data: actualOwner,
    isLoading,
    error,
  }
}

export function useEnsResolver(ensName: string | undefined) {
  // Normalize the ENS name
  const normalizedName = ensName
    ? ensName.endsWith('.eth')
      ? ensName.toLowerCase()
      : `${ensName.toLowerCase()}.eth`
    : undefined

  const node = normalizedName ? getNamehash(normalizedName) : undefined

  const result = useReadContract({
    address: ENS_CONTRACTS.registry,
    abi: ENS_REGISTRY_ABI,
    functionName: 'resolver',
    args: node ? [node] : undefined,
    chainId: mainnet.id,
    query: {
      enabled: !!node,
    },
  })

  // Debug logging
  if (result.data) {
    console.log('ENS Resolver for', normalizedName, ':', result.data)
  }

  return result
}

export function useSetFeedMeConfig(resolverAddress?: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const setConfig = (ensName: string, config: FeedMeSetupConfig) => {
    // Normalize the ENS name
    const normalizedName = ensName.endsWith('.eth')
      ? ensName.toLowerCase()
      : `${ensName.toLowerCase()}.eth`

    const node = getNamehash(normalizedName)

    // Use the name's resolver, or fall back to public resolver
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
    const targetResolver = resolverAddress && resolverAddress !== ZERO_ADDRESS
      ? resolverAddress
      : ENS_CONTRACTS.publicResolver

    console.log('Setting config on resolver:', targetResolver, 'for name:', normalizedName)

    // Build the text records
    const records: Record<string, string> = {
      [FEEDME_KEYS.chain]: config.chain,
      [FEEDME_KEYS.token]: config.token,
      [FEEDME_KEYS.protocol]: config.protocol,
      [FEEDME_KEYS.monsterName]: config.monsterName,
      [FEEDME_KEYS.monsterType]: config.monsterType,
    }

    // V2: Add splits if provided
    if (config.splits !== undefined) {
      records[FEEDME_KEYS.splits] = config.splits
    }

    // Encode all setText calls
    const calls = encodeSetTextCalls(node, records)

    // Use multicall to set all records in one transaction
    writeContract({
      address: targetResolver,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: 'multicall',
      args: [calls],
      chainId: mainnet.id,
    })
  }

  return {
    setConfig,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
