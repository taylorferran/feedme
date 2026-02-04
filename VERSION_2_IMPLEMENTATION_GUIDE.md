# FeedMe v2 Implementation Guide

This guide covers the enhanced features for FeedMe v2, building on the core functionality.

---

## Overview

Version 2 adds three creative ENS-powered features:

1. **ENS Subdomains** - Multiple feed profiles under one name
2. **Payment Splits** - Automatic distribution to multiple recipients
3. **Recent Feeders** - Social recognition for senders

---

## Feature 1: ENS Subdomains for Multiple Feeds

**Goal:** Let users create purpose-specific feeds like `tips.yourname.eth`, `salary.yourname.eth`

### Why This Matters

- Different payment purposes need different destinations
- Tips → small amounts to spending wallet
- Salary → larger amounts to yield protocol
- Donations → split to charity

### User Flow

```
1. User visits /setup
2. Connects wallet, owns yourname.eth
3. Clicks "Add New Feed"
4. Enters subdomain: "tips"
5. Configures: Base → USDC → Aave
6. Names monster: "Tippy the Dragon"
7. Signs transaction (creates subdomain + sets records)
8. Share link: feedme.app/tips.yourname.eth
```

### Tasks

- [ ] **1.1** Create subdomain registration utilities
  - Check if subdomain exists
  - Create subdomain via NameWrapper (wrapped names) or Registry (unwrapped)
  - Set resolver for new subdomain

- [ ] **1.2** Update Setup page for subdomain creation
  - Add "Create New Feed" option
  - Subdomain name input with validation
  - Preview full name: `{subdomain}.{parent}.eth`

- [ ] **1.3** Add subdomain management UI
  - List existing subdomains
  - Edit/delete subdomain configs
  - Show which subdomains have FeedMe configured

- [ ] **1.4** Update Feed page to work with subdomains
  - Already works! Just needs testing with subdomain ENS names

### Technical Details

#### Creating Subdomains (Wrapped Names)

Most modern ENS names use the NameWrapper. To create a subdomain:

```typescript
import { namehash, labelhash } from 'viem'

const NAME_WRAPPER = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401'

// Create subdomain: tips.yourname.eth
const parentNode = namehash('yourname.eth')
const label = 'tips' // just the subdomain part

await walletClient.writeContract({
  address: NAME_WRAPPER,
  abi: NAME_WRAPPER_ABI,
  functionName: 'setSubnodeRecord',
  args: [
    parentNode,           // parent namehash
    label,                // subdomain label
    ownerAddress,         // owner of subdomain
    resolverAddress,      // resolver (usually public resolver)
    0n,                   // ttl
    0,                    // fuses (0 = no restrictions)
    0n,                   // expiry (0 = inherit from parent)
  ],
})
```

#### NameWrapper ABI (minimal)

```typescript
const NAME_WRAPPER_ABI = [
  {
    name: 'setSubnodeRecord',
    type: 'function',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
] as const
```

#### Creating Subdomains (Unwrapped Names)

For older unwrapped names, use the Registry directly:

```typescript
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

await walletClient.writeContract({
  address: ENS_REGISTRY,
  abi: ENS_REGISTRY_ABI,
  functionName: 'setSubnodeRecord',
  args: [
    parentNode,
    labelhash(label),
    ownerAddress,
    resolverAddress,
    0n, // ttl
  ],
})
```

### Files to Create/Modify

```
src/lib/ens-subdomains.ts      # New - subdomain creation utilities
src/hooks/useEnsSubdomains.ts  # New - list/manage subdomains
src/pages/Setup.tsx            # Modify - add subdomain creation flow
src/components/SubdomainList.tsx # New - display existing subdomains
```

---

## Feature 2: Payment Splits via Text Records

**Goal:** Automatically split incoming payments across multiple recipients

### Why This Matters

- Creators can share revenue with collaborators
- Projects can automatically fund their treasury + contributors
- Charitable giving built into every payment

### User Flow

```
1. User configures their feed on /setup
2. Enables "Payment Splits"
3. Adds recipients:
   - 50% → self (Aave on Base)
   - 30% → collaborator.eth
   - 20% → gitcoin.eth (charity)
4. Saves to ENS text record: feedme.splits
5. When someone feeds, payment automatically splits
```

### Text Record Format

```
feedme.splits = "0xABC123...:50,collaborator.eth:30,gitcoin.eth:20"
```

Format: `recipient:percentage,recipient:percentage,...`
- Recipient can be address or ENS name
- Percentages must sum to 100
- Self (main feedme config) can be omitted (implied remainder)

### Tasks

- [ ] **2.1** Create split configuration utilities
  - Parse splits text record
  - Validate percentages sum to 100
  - Resolve ENS names to addresses

- [ ] **2.2** Update Setup page with splits UI
  - Add/remove split recipients
  - Percentage sliders or inputs
  - ENS name resolution preview

- [ ] **2.3** Implement split execution strategies
  - Option A: Multiple LI.FI transactions (simple, more gas)
  - Option B: Single tx to splitter contract (complex, less gas)
  - Option C: LI.FI multi-destination (if supported)

- [ ] **2.4** Update Feed page to show splits
  - Display "Your payment will be split:"
  - Show each recipient + percentage
  - Resolve ENS names for display

### Technical Details

#### Parsing Splits

```typescript
interface Split {
  recipient: string // address or ENS name
  percentage: number
}

function parseSplits(splitsRecord: string): Split[] {
  if (!splitsRecord) return []

  return splitsRecord.split(',').map(part => {
    const [recipient, pct] = part.trim().split(':')
    return {
      recipient: recipient.trim(),
      percentage: parseInt(pct, 10),
    }
  })
}

// Example: "0xABC:50,vitalik.eth:30,gitcoin.eth:20"
// Returns: [
//   { recipient: "0xABC", percentage: 50 },
//   { recipient: "vitalik.eth", percentage: 30 },
//   { recipient: "gitcoin.eth", percentage: 20 },
// ]
```

#### Execution Strategy: Multiple Transactions

The simplest approach - execute one LI.FI transaction per split recipient:

```typescript
async function executeSplitPayment(
  splits: Split[],
  totalAmount: bigint,
  senderConfig: PaymentConfig
) {
  const results = []

  for (const split of splits) {
    const splitAmount = (totalAmount * BigInt(split.percentage)) / 100n
    const recipientAddress = await resolveAddress(split.recipient)

    // Get quote for this split
    const quote = await fetchQuote({
      ...senderConfig,
      toAddress: recipientAddress,
      fromAmount: splitAmount.toString(),
    })

    // Execute transaction
    const result = await executeRoute(quote)
    results.push(result)
  }

  return results
}
```

#### Execution Strategy: Splitter Contract (Advanced)

Deploy a simple splitter contract that receives tokens and distributes:

```solidity
// SimpleSplitter.sol
contract SimpleSplitter {
    function splitAndSend(
        address token,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        for (uint i = 0; i < recipients.length; i++) {
            uint256 amount = (balance * percentages[i]) / 100;
            IERC20(token).transfer(recipients[i], amount);
        }
    }
}
```

Then use LI.FI Composer to:
1. Swap/bridge to destination chain
2. Call splitter contract with recipients

### Files to Create/Modify

```
src/lib/splits.ts              # New - split parsing and validation
src/hooks/useSplitPayment.ts   # New - split execution logic
src/components/SplitConfig.tsx # New - split configuration UI
src/pages/Setup.tsx            # Modify - add splits section
src/pages/Feed.tsx             # Modify - show split preview
```

---

## Feature 3: Recent Feeders (Sender Recognition)

**Goal:** Show who has fed the monster, with ENS name resolution

### Why This Matters

- Social recognition encourages more feeding
- Creates community around each monster
- No on-chain storage needed - reads from transaction history

### User Flow

```
1. Visitor lands on /vitalik.eth
2. Sees the monster + payment form
3. Below the form: "Recent Feeders"
   - 🐙 alice.eth fed 0.5 ETH (2 hours ago)
   - 🐙 bob.eth fed 100 USDC (1 day ago)
   - 🐙 0x1234...5678 fed 0.1 ETH (3 days ago)
4. Motivation to join the list!
```

### Tasks

- [ ] **3.1** Create transaction history fetcher
  - Query LI.FI API for transactions to recipient
  - Or use block explorer API (Etherscan, Basescan, etc.)
  - Filter for FeedMe-related transactions

- [ ] **3.2** Create ENS reverse resolution utility
  - Batch resolve addresses to ENS names
  - Cache results to avoid repeated lookups

- [ ] **3.3** Build Recent Feeders component
  - Display sender ENS name or truncated address
  - Show amount and token
  - Relative timestamp ("2 hours ago")
  - Link to transaction on explorer

- [ ] **3.4** Add to Feed page
  - Position below payment form
  - Load asynchronously (don't block page render)
  - Limit to last 5-10 feeders

### Technical Details

#### Fetching Transaction History

**Option A: LI.FI Status API**

If we track transaction hashes after execution, we can query LI.FI:

```typescript
import { getStatus } from '@lifi/sdk'

// Returns transaction details including sender
const status = await getStatus({ txHash })
```

**Option B: Block Explorer APIs**

Query Etherscan/Basescan for incoming transactions:

```typescript
async function getRecentFeeders(recipientAddress: string, chainId: number) {
  const explorerApi = getExplorerApi(chainId)

  const response = await fetch(
    `${explorerApi}/api?module=account&action=tokentx&address=${recipientAddress}&sort=desc&page=1&offset=10`
  )

  const data = await response.json()
  return data.result.map(tx => ({
    sender: tx.from,
    amount: tx.value,
    token: tx.tokenSymbol,
    timestamp: tx.timeStamp,
    txHash: tx.hash,
  }))
}
```

**Option C: The Graph / Subgraph**

For production, index FeedMe transactions with a custom subgraph.

#### ENS Reverse Resolution

Batch resolve addresses to names:

```typescript
import { getEnsName } from 'viem/ens'

async function resolveFeederNames(feeders: Feeder[]) {
  const resolved = await Promise.all(
    feeders.map(async (feeder) => {
      const ensName = await publicClient.getEnsName({
        address: feeder.sender,
      })
      return {
        ...feeder,
        ensName: ensName || null,
      }
    })
  )
  return resolved
}
```

#### Recent Feeders Component

```typescript
interface Feeder {
  sender: string
  ensName: string | null
  amount: string
  token: string
  timestamp: number
  txHash: string
}

function RecentFeeders({ feeders }: { feeders: Feeder[] }) {
  return (
    <div className="recent-feeders">
      <h3>Recent Feeders</h3>
      {feeders.map((feeder) => (
        <div key={feeder.txHash} className="feeder">
          <span className="name">
            {feeder.ensName || truncateAddress(feeder.sender)}
          </span>
          <span className="amount">
            fed {formatAmount(feeder.amount)} {feeder.token}
          </span>
          <span className="time">
            {formatRelativeTime(feeder.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}
```

### Files to Create/Modify

```
src/lib/feeders.ts               # New - fetch transaction history
src/hooks/useRecentFeeders.ts    # New - hook for feeder data
src/components/RecentFeeders.tsx # New - display component
src/pages/Feed.tsx               # Modify - add Recent Feeders section
```

---

## Implementation Priority

Recommended order based on impact and complexity:

### Phase 1: Recent Feeders (Easiest, High Impact)
- Adds social proof immediately
- No ENS writes required
- Can start with mock data, then add real queries

### Phase 2: Payment Splits (Medium Complexity, High Creativity)
- Strong differentiator for ENS prize
- Multiple execution strategies to choose from
- Start with multi-tx approach, optimize later

### Phase 3: Subdomains (Most Complex, Nice to Have)
- Requires understanding NameWrapper vs Registry
- More edge cases (wrapped vs unwrapped)
- Can defer to v2.1

---

## Contract Addresses Reference

### ENS Contracts (Mainnet)

```
Registry:        0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
NameWrapper:     0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401
Public Resolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63
Reverse Registrar: 0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb
```

### Block Explorer APIs

```
Ethereum: https://api.etherscan.io
Base:     https://api.basescan.org
Arbitrum: https://api.arbiscan.io
```

---

## Testing Checklist

- [ ] Can create subdomain for owned ENS name
- [ ] Subdomain inherits resolver correctly
- [ ] Splits parse and validate correctly
- [ ] Split execution completes all transfers
- [ ] Recent feeders load without blocking page
- [ ] ENS names resolve for feeders
- [ ] All features work on mobile

---

## Notes for Hackathon Judges

These features demonstrate creative ENS usage:

1. **Subdomains as Multi-Profile System** - ENS hierarchy for organizing DeFi preferences
2. **Text Records as Payment Router** - ENS stores split configuration, enabling automated distribution
3. **Reverse Resolution for Social Layer** - ENS identity makes payments personal, not just addresses

All configuration lives in ENS - no separate database needed.
