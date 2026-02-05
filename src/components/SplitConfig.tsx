import { useState } from 'react'
import { useEnsAddress } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { type Split, validateSplits, isEnsName } from '../lib/splits'

interface SplitConfigProps {
  splits: Split[]
  onChange: (splits: Split[]) => void
  disabled?: boolean
}

export function SplitConfig({ splits, onChange, disabled }: SplitConfigProps) {
  const [isEnabled, setIsEnabled] = useState(splits.length > 0)
  const validation = validateSplits(splits)

  // When enabling splits, add a default entry
  const handleToggle = () => {
    if (isEnabled) {
      // Disable - clear all splits
      onChange([])
      setIsEnabled(false)
    } else {
      // Enable - start with self at 100%
      onChange([{ recipient: '', percentage: 100 }])
      setIsEnabled(true)
    }
  }

  const handleAddRecipient = () => {
    if (splits.length >= 10) return
    // Distribute percentage from first recipient to new one
    const newSplits = [...splits]
    const firstSplit = newSplits[0]
    if (firstSplit && firstSplit.percentage > 10) {
      firstSplit.percentage -= 10
      newSplits.push({ recipient: '', percentage: 10 })
    } else {
      newSplits.push({ recipient: '', percentage: 0 })
    }
    onChange(newSplits)
  }

  const handleRemoveRecipient = (index: number) => {
    if (splits.length <= 1) return
    const newSplits = splits.filter((_, i) => i !== index)
    // Redistribute removed percentage to first recipient
    const removedPct = splits[index].percentage
    if (newSplits[0]) {
      newSplits[0].percentage += removedPct
    }
    onChange(newSplits)
  }

  const handleRecipientChange = (index: number, value: string) => {
    const newSplits = [...splits]
    newSplits[index] = { ...newSplits[index], recipient: value }
    onChange(newSplits)
  }

  const handlePercentageChange = (index: number, value: number) => {
    const newSplits = [...splits]
    newSplits[index] = { ...newSplits[index], percentage: value }
    onChange(newSplits)
  }

  if (!isEnabled) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium">Payment Splits</label>
            <p className="text-xs text-zinc-500 mt-1">
              Split incoming payments across multiple recipients
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={disabled}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
          >
            Enable Splits
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <label className="block text-sm font-medium">Payment Splits</label>
          <p className="text-xs text-zinc-500 mt-1">
            Percentages must sum to 100%
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={disabled}
          className="px-3 py-1 text-xs text-zinc-400 hover:text-red-400 transition-colors"
        >
          Disable
        </button>
      </div>

      <div className="space-y-3">
        {splits.map((split, index) => (
          <SplitRow
            key={index}
            split={split}
            index={index}
            canRemove={splits.length > 1}
            disabled={disabled}
            onRecipientChange={(value) => handleRecipientChange(index, value)}
            onPercentageChange={(value) => handlePercentageChange(index, value)}
            onRemove={() => handleRemoveRecipient(index)}
          />
        ))}
      </div>

      {/* Add recipient button */}
      {splits.length < 10 && (
        <button
          onClick={handleAddRecipient}
          disabled={disabled}
          className="mt-4 w-full py-2 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg text-sm text-zinc-500 hover:text-zinc-400 transition-colors disabled:opacity-50"
        >
          + Add Recipient
        </button>
      )}

      {/* Validation status */}
      <div className="mt-4 flex items-center gap-2">
        {validation.isValid ? (
          <span className="text-xs text-green-400">
            Total: {splits.reduce((sum, s) => sum + s.percentage, 0)}%
          </span>
        ) : (
          <span className="text-xs text-red-400">
            {validation.error}
          </span>
        )}
      </div>
    </div>
  )
}

interface SplitRowProps {
  split: Split
  index: number
  canRemove: boolean
  disabled?: boolean
  onRecipientChange: (value: string) => void
  onPercentageChange: (value: number) => void
  onRemove: () => void
}

function SplitRow({
  split,
  index,
  canRemove,
  disabled,
  onRecipientChange,
  onPercentageChange,
  onRemove,
}: SplitRowProps) {
  // Resolve ENS name if provided
  const shouldResolve = isEnsName(split.recipient)
  const { data: resolvedAddress, isLoading: isResolving } = useEnsAddress({
    name: shouldResolve ? split.recipient : undefined,
    chainId: mainnet.id,
  })

  return (
    <div className="flex items-center gap-3">
      {/* Recipient input */}
      <div className="flex-1">
        <input
          type="text"
          value={split.recipient}
          onChange={(e) => onRecipientChange(e.target.value)}
          disabled={disabled}
          placeholder={index === 0 ? "Your address or ENS (e.g., vitalik.eth)" : "Address or ENS name"}
          className="w-full px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-purple-500 focus:outline-none text-sm disabled:opacity-50"
        />
        {/* ENS resolution status */}
        {shouldResolve && (
          <div className="mt-1 text-xs">
            {isResolving ? (
              <span className="text-zinc-500">Resolving...</span>
            ) : resolvedAddress ? (
              <span className="text-green-400">
                {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
              </span>
            ) : (
              <span className="text-red-400">Could not resolve</span>
            )}
          </div>
        )}
      </div>

      {/* Percentage input */}
      <div className="w-24 flex items-center gap-1">
        <input
          type="number"
          min={1}
          max={100}
          value={split.percentage}
          onChange={(e) => onPercentageChange(parseInt(e.target.value, 10) || 0)}
          disabled={disabled}
          className="w-16 px-2 py-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-purple-500 focus:outline-none text-sm text-center disabled:opacity-50"
        />
        <span className="text-zinc-500 text-sm">%</span>
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={onRemove}
          disabled={disabled}
          className="p-2 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
          title="Remove recipient"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
