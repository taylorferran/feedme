import { useEffect, useState } from 'react'

interface EnsName {
  name: string
  expiryDate?: string
}

interface UseUserEnsNamesResult {
  names: EnsName[]
  isLoading: boolean
  error: string | null
}

// ENS Subgraph endpoint
const ENS_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens'

export function useUserEnsNames(address: string | undefined): UseUserEnsNamesResult {
  const [names, setNames] = useState<EnsName[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

        const response = await fetch(ENS_SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { owner: address.toLowerCase() },
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch ENS names')
        }

        const data = await response.json()

        if (data.errors) {
          throw new Error(data.errors[0]?.message || 'GraphQL error')
        }

        // Filter to only .eth names and exclude subdomains for now
        const ethNames = (data.data?.domains || [])
          .filter((d: { name: string }) => d.name?.endsWith('.eth') && !d.name.includes('.eth.'))
          .map((d: { name: string; expiryDate?: string }) => ({
            name: d.name,
            expiryDate: d.expiryDate,
          }))

        setNames(ethNames)
      } catch (err) {
        console.error('Error fetching ENS names:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch ENS names')
        setNames([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNames()
  }, [address])

  return { names, isLoading, error }
}
