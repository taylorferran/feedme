import { useEffect, useState } from 'react'
import { useEnsName } from 'wagmi'
import { mainnet } from 'wagmi/chains'

interface EnsName {
  name: string
  expiryDate?: string
}

interface UseUserEnsNamesResult {
  names: EnsName[]
  isLoading: boolean
  error: string | null
}

// ENS Subgraph - using hosted service (deprecated but may still work)
// For production, get an API key from https://thegraph.com/studio/
const ENS_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens'

export function useUserEnsNames(address: string | undefined): UseUserEnsNamesResult {
  const [names, setNames] = useState<EnsName[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get primary ENS name using wagmi (this always works)
  const { data: primaryName, isLoading: isPrimaryLoading } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: mainnet.id,
  })

  useEffect(() => {
    if (!address) {
      setNames([])
      return
    }

    const fetchNames = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Query the ENS subgraph for domains owned by this address
        const query = `
          query GetDomains($owner: String!) {
            domains(
              where: { owner: $owner, name_not: null }
              orderBy: name
              first: 100
            ) {
              name
              expiryDate
            }
          }
        `

        // Try the subgraph (might still work for read queries)
        const response = await fetch(ENS_SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { owner: address.toLowerCase() },
          }),
        })

        if (!response.ok) {
          throw new Error('Subgraph unavailable')
        }

        const data = await response.json()

        if (data.errors) {
          throw new Error(data.errors[0]?.message || 'GraphQL error')
        }

        // Filter to only .eth names and exclude subdomains
        const ethNames = (data.data?.domains || [])
          .filter((d: { name: string }) => d.name?.endsWith('.eth') && !d.name.includes('.eth.'))
          .map((d: { name: string; expiryDate?: string }) => ({
            name: d.name,
            expiryDate: d.expiryDate,
          }))

        setNames(ethNames)
        setError(null)
      } catch (err) {
        console.error('Error fetching ENS names from subgraph:', err)

        // Fallback: If we have a primary name from wagmi, use that
        if (primaryName) {
          setNames([{ name: primaryName }])
          setError(null)
        } else {
          setError('ENS lookup unavailable. Try again later.')
          setNames([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchNames()
  }, [address, primaryName])

  return {
    names,
    isLoading: isLoading || isPrimaryLoading,
    error
  }
}
