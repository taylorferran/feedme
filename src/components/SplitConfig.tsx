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
      <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-brutal tracking-widest text-stone-500">PAYMENT SPLITS</label>
            <p className="text-xs text-stone-600 mt-1 font-mono">
              Split offerings across multiple recipients
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={disabled}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 disabled:opacity-50 rounded-sm text-sm transition-colors font-brutal tracking-wider"
          >
            ENABLE
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-stone-950 rounded-sm p-6 border-2 border-stone-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <label className="block text-xs font-brutal tracking-widest text-stone-500">PAYMENT SPLITS</label>
          <p className="text-xs text-stone-600 mt-1 font-mono">
            Percentages must sum to 100%
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={disabled}
          className="px-3 py-1 text-xs text-stone-500 hover:text-red-500 transition-colors font-mono"
        >
          [ disable ]
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
          className="mt-4 w-full py-2 border-2 border-dashed border-stone-700 hover:border-stone-600 rounded-sm text-sm text-stone-600 hover:text-stone-400 transition-colors disabled:opacity-50 font-mono"
        >
          + add recipient
        </button>
      )}

      {/* Validation status */}
      <div className="mt-4 flex items-center gap-2 font-mono text-xs">
        {validation.isValid ? (
          <span className="text-green-500">
            ✓ Total: {splits.reduce((sum, s) => sum + s.percentage, 0)}%
          </span>
        ) : (
          <span className="text-red-500">
            ✗ {validation.error}
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
          className="w-full px-3 py-2 bg-stone-900 rounded-sm border-2 border-stone-700 focus:border-red-700 focus:outline-none text-sm disabled:opacity-50 font-mono"
        />
        {/* ENS resolution status */}
        {shouldResolve && (
          <div className="mt-1 text-xs font-mono">
            {isResolving ? (
              <span className="text-stone-600">Resolving...</span>
            ) : resolvedAddress ? (
              <span className="text-green-500">
                {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
              </span>
            ) : (
              <span className="text-red-500">Could not resolve</span>
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
          className="w-16 px-2 py-2 bg-stone-900 rounded-sm border-2 border-stone-700 focus:border-red-700 focus:outline-none text-sm text-center disabled:opacity-50 font-mono"
        />
        <span className="text-stone-600 text-sm font-mono">%</span>
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={onRemove}
          disabled={disabled}
          className="p-2 text-stone-600 hover:text-red-500 transition-colors disabled:opacity-50"
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
