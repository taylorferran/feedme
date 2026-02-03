import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { parseEther, parseUnits } from 'viem'
import { fetchQuote, getChainId, getTokenAddress, formatTokenAmount, type LiFiQuote } from '../lib/lifi'

interface UsePaymentQuoteParams {
  fromChainKey: string
  fromToken: string
  fromAmount: string
  toChainKey: string
  toToken: string
  recipientAddress?: string
}

interface QuoteResult {
  quote: LiFiQuote | null
  outputAmount: string
  outputAmountFormatted: string
  gasCostUSD: string
  route: string[]
  isLoading: boolean
  error: string | null
}

export function usePaymentQuote({
  fromChainKey,
  fromToken,
  fromAmount,
  toChainKey,
  toToken,
  recipientAddress,
}: UsePaymentQuoteParams): QuoteResult {
  const { address } = useAccount()
  const [quote, setQuote] = useState<LiFiQuote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuoteDebounced = useCallback(async () => {
    // Validate inputs
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null)
      setError(null)
      return
    }

    if (!address) {
      setError('Connect wallet to get quote')
      return
    }

    const toAddress = recipientAddress || address

    setIsLoading(true)
    setError(null)

    try {
      const fromChainId = getChainId(fromChainKey)
      const toChainId = getChainId(toChainKey)
      const fromTokenAddress = getTokenAddress(fromChainId, fromToken)
      const toTokenAddress = getTokenAddress(toChainId, toToken)

      // Parse amount based on token (ETH = 18 decimals, USDC = 6, etc.)
      let fromAmountWei: string
      if (fromToken === 'ETH' || fromToken === 'WETH') {
        fromAmountWei = parseEther(fromAmount).toString()
      } else if (fromToken === 'USDC' || fromToken === 'USDT') {
        fromAmountWei = parseUnits(fromAmount, 6).toString()
      } else {
        fromAmountWei = parseUnits(fromAmount, 18).toString()
      }

      const result = await fetchQuote({
        fromChain: fromChainId,
        toChain: toChainId,
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        fromAmount: fromAmountWei,
        fromAddress: address,
        toAddress: toAddress,
      })

      setQuote(result)
      setError(null)
    } catch (err) {
      console.error('Quote error:', err)
      setQuote(null)

      // Parse error message
      if (err instanceof Error) {
        if (err.message.includes('No routes found')) {
          setError('No route available for this swap')
        } else if (err.message.includes('insufficient')) {
          setError('Insufficient liquidity')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to get quote')
      }
    } finally {
      setIsLoading(false)
    }
  }, [fromChainKey, fromToken, fromAmount, toChainKey, toToken, address, recipientAddress])

  // Debounce the quote fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuoteDebounced()
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [fetchQuoteDebounced])

  // Extract formatted values from quote
  const outputAmount = quote?.estimate?.toAmount || '0'
  const outputDecimals = quote?.action?.toToken?.decimals || 18
  const outputAmountFormatted = quote
    ? formatTokenAmount(outputAmount, outputDecimals)
    : '0.00'

  // Gas cost in USD
  const gasCostUSD = quote?.estimate?.gasCosts?.[0]?.amountUSD || '0.00'

  // Route steps
  const route = quote?.estimate?.approvalAddress
    ? [`Swap via ${quote.toolDetails?.name || 'LI.FI'}`]
    : []

  return {
    quote,
    outputAmount,
    outputAmountFormatted,
    gasCostUSD,
    route,
    isLoading,
    error,
  }
}
