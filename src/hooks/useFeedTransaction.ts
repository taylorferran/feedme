import { useSendTransaction, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi'
import { useState } from 'react'
import { type LiFiQuote } from '../lib/lifi'
import { getChainId } from '../lib/lifi'

export function useFeedTransaction() {
  const currentChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const [simulationError, setSimulationError] = useState<string | null>(null)

  const {
    sendTransaction,
    data: hash,
    isPending,
    error: sendError,
    reset: resetSend,
  } = useSendTransaction()

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const reset = () => {
    resetSend()
    setSimulationError(null)
  }

  const execute = async (quote: LiFiQuote, fromChainKey: string) => {
    if (!quote.transactionRequest) {
      console.error('No transaction request in quote')
      setSimulationError('No transaction request in quote')
      return
    }

    const { to, data, value, gasLimit } = quote.transactionRequest
    const targetChainId = getChainId(fromChainKey)

    console.log('Executing LI.FI transaction:', {
      to,
      value,
      gasLimit,
      targetChainId,
      currentChainId,
    })

    // Switch chain if needed
    if (currentChainId !== targetChainId) {
      console.log(`Switching from chain ${currentChainId} to ${targetChainId}`)
      try {
        await switchChainAsync({ chainId: targetChainId as 1 | 8453 | 42161 })
        // Small delay to let wallet update
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err) {
        console.error('Failed to switch chain:', err)
        // Don't set error - the wallet will show its own UI
        return
      }
    }

    // Execute the transaction
    sendTransaction({
      to: to as `0x${string}`,
      data: data as `0x${string}`,
      value: BigInt(value || '0'),
      gas: gasLimit ? BigInt(gasLimit) : undefined,
    })
  }

  return {
    execute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    simulationError,
    error: sendError || confirmError,
    reset,
  }
}
