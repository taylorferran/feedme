import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import {
  ENS_CONTRACTS,
  ENS_REGISTRY_ABI,
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
}

export function useEnsOwner(ensName: string | undefined) {
  const node = ensName ? getNamehash(ensName) : undefined

  return useReadContract({
    address: ENS_CONTRACTS.registry,
    abi: ENS_REGISTRY_ABI,
    functionName: 'owner',
    args: node ? [node] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!node,
    },
  })
}

export function useEnsResolver(ensName: string | undefined) {
  const node = ensName ? getNamehash(ensName) : undefined

  return useReadContract({
    address: ENS_CONTRACTS.registry,
    abi: ENS_REGISTRY_ABI,
    functionName: 'resolver',
    args: node ? [node] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!node,
    },
  })
}

export function useSetFeedMeConfig() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const setConfig = (ensName: string, config: FeedMeSetupConfig) => {
    const node = getNamehash(ensName)

    // Build the text records
    const records: Record<string, string> = {
      [FEEDME_KEYS.chain]: config.chain,
      [FEEDME_KEYS.token]: config.token,
      [FEEDME_KEYS.protocol]: config.protocol,
      [FEEDME_KEYS.monsterName]: config.monsterName,
      [FEEDME_KEYS.monsterType]: config.monsterType,
    }

    // Encode all setText calls
    const calls = encodeSetTextCalls(node, records)

    // Use multicall to set all records in one transaction
    writeContract({
      address: ENS_CONTRACTS.publicResolver,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: 'multicall',
      args: [calls],
      chainId: sepolia.id,
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
