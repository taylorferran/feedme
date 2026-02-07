import { useEffect, useState, useRef } from 'react'
import { usePublicClient } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { normalize } from 'viem/ens'
import type { Split } from '../lib/splits'

interface UseResolvedSplitsResult {
  splits: Split[]
  isResolving: boolean
  error: string | null
}

/**
 * Hook to resolve ENS names in splits to their addresses
 * Returns splits with resolvedAddress populated for ENS names
 */
export function useResolvedSplits(splits: Split[] | undefined): UseResolvedSplitsResult {
  const [resolvedSplits, setResolvedSplits] = useState<Split[]>([])
  const [isResolving, setIsResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publicClient = usePublicClient({ chainId: mainnet.id })

  // Use ref to store splits to avoid stale closure issues
  const splitsRef = useRef(splits)
  splitsRef.current = splits

  // Create a stable key from splits to prevent infinite loops
  // Only re-run when the actual content changes, not the reference
  const splitsKey = splits && splits.length > 0
    ? splits.map(s => `${s.recipient}:${s.percentage}`).join(',')
    : ''

  // Track the last resolved key to avoid duplicate resolutions
  const lastResolvedKeyRef = useRef<string>('')

  useEffect(() => {
    // Skip if no splits or already resolved this key
    if (!splitsKey) {
      setResolvedSplits([])
      setIsResolving(false)
      setError(null)
      return
    }

    // Skip if we already resolved this exact configuration
    if (splitsKey === lastResolvedKeyRef.current && resolvedSplits.length > 0) {
      return
    }

    const currentSplits = splitsRef.current
    if (!currentSplits || currentSplits.length === 0) {
      return
    }

    let isCancelled = false

    const resolveSplits = async () => {
      setIsResolving(true)
      setError(null)

      try {
        const resolved = await Promise.all(
          currentSplits.map(async (split) => {
            // If recipient is already an address, use it directly
            if (/^0x[a-fA-F0-9]{40}$/.test(split.recipient)) {
              return {
                ...split,
                resolvedAddress: split.recipient,
              }
            }

            // If it's an ENS name, resolve it
            if (split.recipient.endsWith('.eth') && publicClient) {
              try {
                const address = await publicClient.getEnsAddress({
                  name: normalize(split.recipient),
                })

                if (!address) {
                  throw new Error(`Could not resolve ${split.recipient}`)
                }

                return {
                  ...split,
                  resolvedAddress: address,
                }
              } catch (err) {
                console.error(`Failed to resolve ENS name ${split.recipient}:`, err)
                throw new Error(`Failed to resolve ${split.recipient}`)
              }
            }

            // Unknown format
            throw new Error(`Invalid recipient format: ${split.recipient}`)
          })
        )

        if (!isCancelled) {
          lastResolvedKeyRef.current = splitsKey
          setResolvedSplits(resolved)
          setError(null)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to resolve splits')
          setResolvedSplits([])
        }
      } finally {
        if (!isCancelled) {
          setIsResolving(false)
        }
      }
    }

    resolveSplits()

    return () => {
      isCancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitsKey, publicClient])

  return { splits: resolvedSplits, isResolving, error }
}
