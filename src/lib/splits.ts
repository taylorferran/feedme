// Payment splits - parse, validate, and manage split configurations

export interface Split {
  recipient: string // Address or ENS name
  percentage: number // 1-100
  resolvedAddress?: string // Resolved address (if ENS name)
}

export interface ParsedSplits {
  splits: Split[]
  isValid: boolean
  error?: string
  totalPercentage: number
}

/**
 * Parse splits from ENS text record format
 * Format: "recipient:percentage,recipient:percentage,..."
 * Example: "0xABC123...:50,collaborator.eth:30,gitcoin.eth:20"
 */
export function parseSplits(splitsRecord: string | undefined | null): ParsedSplits {
  if (!splitsRecord || splitsRecord.trim() === '') {
    return {
      splits: [],
      isValid: true,
      totalPercentage: 0,
    }
  }

  try {
    const parts = splitsRecord.split(',').map(p => p.trim()).filter(p => p)
    const splits: Split[] = []

    for (const part of parts) {
      const colonIndex = part.lastIndexOf(':')
      if (colonIndex === -1) {
        return {
          splits: [],
          isValid: false,
          error: `Invalid split format: "${part}" (missing colon)`,
          totalPercentage: 0,
        }
      }

      const recipient = part.slice(0, colonIndex).trim()
      const percentageStr = part.slice(colonIndex + 1).trim()
      const percentage = parseInt(percentageStr, 10)

      if (!recipient) {
        return {
          splits: [],
          isValid: false,
          error: 'Empty recipient in split',
          totalPercentage: 0,
        }
      }

      if (isNaN(percentage) || percentage < 1 || percentage > 100) {
        return {
          splits: [],
          isValid: false,
          error: `Invalid percentage "${percentageStr}" for ${recipient}`,
          totalPercentage: 0,
        }
      }

      splits.push({ recipient, percentage })
    }

    const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0)

    if (totalPercentage !== 100) {
      return {
        splits,
        isValid: false,
        error: `Percentages must sum to 100 (currently ${totalPercentage})`,
        totalPercentage,
      }
    }

    return {
      splits,
      isValid: true,
      totalPercentage,
    }
  } catch (error) {
    return {
      splits: [],
      isValid: false,
      error: 'Failed to parse splits',
      totalPercentage: 0,
    }
  }
}

/**
 * Serialize splits to ENS text record format
 */
export function serializeSplits(splits: Split[]): string {
  if (splits.length === 0) return ''
  return splits.map(s => `${s.recipient}:${s.percentage}`).join(',')
}

/**
 * Validate a single split entry
 */
export function validateSplit(split: Split): { isValid: boolean; error?: string } {
  if (!split.recipient || split.recipient.trim() === '') {
    return { isValid: false, error: 'Recipient is required' }
  }

  // Check if it's an address or ENS name
  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(split.recipient)
  const isEnsName = split.recipient.endsWith('.eth')

  if (!isAddress && !isEnsName) {
    return { isValid: false, error: 'Must be an address (0x...) or ENS name (*.eth)' }
  }

  if (split.percentage < 1 || split.percentage > 100 || !Number.isInteger(split.percentage)) {
    return { isValid: false, error: 'Percentage must be a whole number between 1-100' }
  }

  return { isValid: true }
}

/**
 * Validate entire splits configuration
 */
export function validateSplits(splits: Split[]): { isValid: boolean; error?: string } {
  if (splits.length === 0) {
    return { isValid: true } // Empty splits is valid (no splitting)
  }

  if (splits.length > 10) {
    return { isValid: false, error: 'Maximum 10 split recipients allowed' }
  }

  // Validate each split
  for (const split of splits) {
    const validation = validateSplit(split)
    if (!validation.isValid) {
      return validation
    }
  }

  // Check total percentage
  const total = splits.reduce((sum, s) => sum + s.percentage, 0)
  if (total !== 100) {
    return { isValid: false, error: `Percentages must sum to 100 (currently ${total})` }
  }

  // Check for duplicate recipients
  const recipients = splits.map(s => s.recipient.toLowerCase())
  const uniqueRecipients = new Set(recipients)
  if (uniqueRecipients.size !== recipients.length) {
    return { isValid: false, error: 'Duplicate recipients not allowed' }
  }

  return { isValid: true }
}

/**
 * Check if a recipient is an ENS name
 */
export function isEnsName(recipient: string): boolean {
  return recipient.endsWith('.eth')
}

/**
 * Check if a recipient is an address
 */
export function isAddress(recipient: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(recipient)
}

/**
 * Calculate split amounts from a total amount
 */
export function calculateSplitAmounts(
  totalAmount: bigint,
  splits: Split[]
): { recipient: string; amount: bigint; percentage: number }[] {
  if (splits.length === 0) {
    return []
  }

  return splits.map(split => ({
    recipient: split.resolvedAddress || split.recipient,
    amount: (totalAmount * BigInt(split.percentage)) / 100n,
    percentage: split.percentage,
  }))
}

/**
 * Format split for display
 */
export function formatSplitDisplay(split: Split): string {
  const recipient = split.resolvedAddress
    ? `${split.recipient} (${split.resolvedAddress.slice(0, 6)}...${split.resolvedAddress.slice(-4)})`
    : split.recipient.length === 42
    ? `${split.recipient.slice(0, 6)}...${split.recipient.slice(-4)}`
    : split.recipient

  return `${split.percentage}% → ${recipient}`
}
