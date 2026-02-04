import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { fetchRecentFeedersMultiChain, type Feeder } from '../lib/feeders'
import { getChainId } from '../lib/lifi'

interface UseRecentFeedersResult {
  feeders: Feeder[]
  isLoading: boolean
  error: string | null
}

/**
 * Hook to fetch recent feeders for a given recipient address
 * Includes ENS reverse resolution for sender addresses
 */
export function useRecentFeeders(
  recipientAddress: string | undefined,
  preferredChainKey?: string
): UseRecentFeedersResult {
  const [feeders, setFeeders] = useState<Feeder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get public client for ENS resolution (always on mainnet)
  const publicClient = usePublicClient({ chainId: mainnet.id })

  useEffect(() => {
    if (!recipientAddress) {
      setFeeders([])
      return
    }

    let isCancelled = false

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Determine which chains to query
        // Prioritize the user's preferred chain, but also check others
        const chainIds: number[] = []

        if (preferredChainKey) {
          const preferredChainId = getChainId(preferredChainKey)
          chainIds.push(preferredChainId)
        }

        // Add other chains (deduplicated)
        const allChains = [8453, 42161, 1] // Base, Arbitrum, Mainnet
        for (const chainId of allChains) {
          if (!chainIds.includes(chainId)) {
            chainIds.push(chainId)
          }
        }

        // Fetch feeders from block explorers
        const rawFeeders = await fetchRecentFeedersMultiChain(
          recipientAddress,
          chainIds,
          5 // 5 per chain
        )

        if (isCancelled) return

        // Resolve ENS names for all unique sender addresses
        const uniqueSenders = [...new Set(rawFeeders.map(f => f.sender))]
        const ensNames: Record<string, string | null> = {}

        if (publicClient) {
          // Batch resolve ENS names
          const resolutions = await Promise.all(
            uniqueSenders.map(async (address) => {
              try {
                const name = await publicClient.getEnsName({
                  address: address as `0x${string}`,
                })
                return { address, name }
              } catch {
                return { address, name: null }
              }
            })
          )

          for (const { address, name } of resolutions) {
            ensNames[address.toLowerCase()] = name
          }
        }

        if (isCancelled) return

        // Attach ENS names to feeders
        const feedersWithEns = rawFeeders.map(feeder => ({
          ...feeder,
          ensName: ensNames[feeder.sender.toLowerCase()] || null,
        }))

        setFeeders(feedersWithEns)
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching recent feeders:', err)
          setError('Failed to load recent feeders')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [recipientAddress, preferredChainKey, publicClient])

  return { feeders, isLoading, error }
}
