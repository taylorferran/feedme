
# FeedMe Technical Guide

This document explains how FeedMe works under the hood.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vite + React)                  │
│                                                                  │
│  /setup                           /:ens (e.g., /vitalik.eth)    │
│  ┌─────────────────────┐         ┌─────────────────────────────┐│
│  │ Setup Page          │         │ Feed Page                   ││
│  │ - Connect wallet    │         │ - Read ENS text records     ││
│  │ - Pick chain/token  │         │ - Display monster           ││
│  │ - Pick protocol     │         │ - Get LI.FI quote           ││
│  │ - Name monster      │         │ - Execute feed transaction  ││
│  │ - Write to ENS      │         │                             ││
│  └─────────────────────┘         └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENS (Ethereum Name Service)                   │
│                      on Ethereum Mainnet                         │
│                                                                  │
│  Registry: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e           │
│  Resolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63           │
│                                                                  │
│  Text Records for yourname.eth:                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ feedme.chain       = "base"                                 ││
│  │ feedme.token       = "USDC"                                 ││
│  │ feedme.protocol    = "aave"                                 ││
│  │ feedme.monsterName = "Chompy"                               ││
│  │ feedme.monsterType = "kraken"                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         LI.FI Protocol                           │
│                    (Cross-chain swap + bridge)                   │
│                       MAINNET ONLY                               │
│                                                                  │
│  1. Sender has ETH on Arbitrum                                  │
│  2. LI.FI swaps ETH → USDC                                      │
│  3. LI.FI bridges USDC to Base                                  │
│  4. LI.FI deposits USDC into Aave on behalf of recipient        │
│                                                                  │
│  All in ONE transaction from sender's perspective               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DeFi Protocol (Aave)                        │
│                                                                  │
│  Aave Pool.supply(asset, amount, onBehalfOf, referralCode)      │
│                                    ▲                             │
│                                    │                             │
│                          recipient's address                     │
│                          (resolved from ENS)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Important: ENS + LI.FI Network Requirements

### ENS (Ethereum Name Service)
- ENS names are registered on **Ethereum mainnet ONLY**
- Text records are stored on **Ethereum mainnet**
- Registration costs real ETH (~$5-15/year for a .eth name)
- Register at: https://app.ens.domains

### LI.FI
- LI.FI only supports **mainnet chains** (no testnets!)
- Supported: Ethereum, Base, Arbitrum, Polygon, Optimism, etc.
- Quotes and transactions require real funds

### How They Work Together
```
ENS (Ethereum mainnet)          LI.FI (any mainnet chain)
┌─────────────────────┐         ┌─────────────────────────┐
│ yourname.eth        │         │ Sender on Arbitrum      │
│ feedme.chain="base" │ ──────► │ Swaps ETH → USDC        │
│ feedme.token="USDC" │         │ Bridges to Base         │
│ feedme.protocol=    │         │ Deposits to Aave        │
│   "aave"            │         │ on behalf of recipient  │
└─────────────────────┘         └─────────────────────────┘
```

---

## Key Files

### Configuration

| File | Purpose |
|------|---------|
| `src/lib/wagmi.ts` | Wallet connection config (chains, transports) |
| `src/lib/ens.ts` | ENS contract addresses and ABIs |
| `src/lib/lifi.ts` | LI.FI SDK setup and quote fetching |
| `src/lib/splitter.ts` | FeedMeSplitter contract address and ABI |
| `src/lib/splits.ts` | Payment splits parsing and validation |
| `src/types/feedme.ts` | TypeScript types and constants |

### Hooks

| Hook | Purpose |
|------|---------|
| `useEnsConfig` | READ text records from ENS for a given name |
| `useEnsOwner` | Check who owns an ENS name |
| `useSetFeedMeConfig` | WRITE text records to ENS (multicall) |
| `usePaymentQuote` | Get live swap quotes from LI.FI |
| `useFeedTransaction` | Execute LI.FI swap/bridge/deposit transaction |

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Landing page |
| Setup | `/setup` | Configure your monster (writes to ENS) |
| Your Monsters | `/monsters` | View all your ENS names and their configs |
| Feed | `/:ens` | Payment page for a specific ENS name |

---

## How ENS Text Records Work

### The Namehash

ENS names are identified by a `namehash` - a bytes32 hash of the name:

```typescript
import { namehash } from 'viem'

namehash('vitalik.eth')
// Returns: 0x1234...abcd (32 bytes)
```

### Reading Records

To read a text record, call `text(node, key)` on the Public Resolver:

```typescript
const result = await publicClient.readContract({
  address: '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63', // Mainnet Resolver
  abi: [{
    name: 'text',
    type: 'function',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' }
    ],
    outputs: [{ type: 'string' }]
  }],
  functionName: 'text',
  args: [namehash('yourname.eth'), 'feedme.chain']
})
// Returns: "base"
```

### Writing Records

To write, you must own the ENS name. Call `setText(node, key, value)`:

```typescript
await walletClient.writeContract({
  address: '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63',
  abi: [...],
  functionName: 'setText',
  args: [namehash('yourname.eth'), 'feedme.chain', 'base']
})
```

### Batching with Multicall

We use `multicall` to set multiple records in one transaction:

```typescript
const calls = [
  encodeFunctionData({ functionName: 'setText', args: [node, 'feedme.chain', 'base'] }),
  encodeFunctionData({ functionName: 'setText', args: [node, 'feedme.token', 'USDC'] }),
  encodeFunctionData({ functionName: 'setText', args: [node, 'feedme.protocol', 'aave'] }),
]

await walletClient.writeContract({
  functionName: 'multicall',
  args: [calls]
})
```

---

## How LI.FI Quotes Work

### Overview

LI.FI aggregates DEXs and bridges to find the best route for cross-chain swaps.

### Quote Request Flow

```
User enters amount
       │
       ▼ (debounced 500ms)
┌──────────────────────────────────────────────────────────────┐
│ usePaymentQuote hook                                          │
│                                                               │
│ 1. Parse amount to wei (ETH=18 decimals, USDC=6 decimals)    │
│ 2. Map chain keys to LI.FI chain IDs                         │
│ 3. Get token addresses for each chain                        │
│ 4. Call LI.FI getQuote() API                                 │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ LI.FI API Response                                            │
│                                                               │
│ {                                                             │
│   estimate: {                                                 │
│     toAmount: "1234567890",      // Output in wei             │
│     gasCosts: [{ amountUSD: "2.50" }]                        │
│   },                                                          │
│   action: {                                                   │
│     toToken: { decimals: 6, symbol: "USDC" }                 │
│   },                                                          │
│   transactionRequest: { ... }    // Ready to sign            │
│ }                                                             │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
Display: "~1234.56 USDC" + "Gas: ~$2.50"
```

### Code Implementation

```typescript
// src/lib/lifi.ts
import { createConfig, getQuote } from '@lifi/sdk'

createConfig({
  integrator: 'feedme',
  apiKey: process.env.VITE_LIFI_API_KEY,
})

export async function fetchQuote(params) {
  return getQuote({
    fromChain: params.fromChain,    // e.g., 42161 (Arbitrum)
    toChain: params.toChain,        // e.g., 8453 (Base)
    fromToken: params.fromToken,    // e.g., native ETH address
    toToken: params.toToken,        // e.g., USDC address on Base
    fromAmount: params.fromAmount,  // Amount in wei
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
  })
}
```

### Chain ID Mapping

LI.FI only supports mainnet, so we map all chains:

```typescript
// src/lib/lifi.ts
export function getChainId(chainKey: string): number {
  switch (chainKey) {
    case 'base':
      return 8453      // Base mainnet
    case 'arbitrum':
      return 42161     // Arbitrum mainnet
    case 'mainnet':
      return 1         // Ethereum mainnet
    default:
      return 1
  }
}
```

### Token Addresses

Each chain has different token addresses:

```typescript
export const TOKEN_ADDRESSES = {
  // Ethereum mainnet
  1: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  // Base
  8453: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  // Arbitrum
  42161: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
}
```

---

## How LI.FI Execution Works (Phase 3)

### The Problem

Sender wants to pay with ETH on Arbitrum.
Recipient wants USDC deposited to Aave on Base.

Traditional approach: 4+ transactions
1. Sender swaps ETH → USDC on Arbitrum
2. Sender bridges USDC to Base
3. Sender approves USDC for Aave
4. Sender deposits to Aave... but it goes to sender's position!

### LI.FI Composer Solution

LI.FI Composer does it all in ONE transaction:

```typescript
import { getContractCallsQuote, executeRoute } from '@lifi/sdk'

// 1. Get a quote with contract call at the end
const quote = await getContractCallsQuote({
  fromChain: 42161,              // Arbitrum
  fromToken: ETH_ADDRESS,
  fromAmount: '1000000000000000000', // 1 ETH in wei
  fromAddress: senderAddress,

  toChain: 8453,                 // Base
  toToken: USDC_ADDRESS,

  // Magic: contract call runs AFTER the swap/bridge
  contractCalls: [{
    fromAmount: '0',             // LI.FI fills this in
    fromTokenAddress: USDC_ADDRESS,
    toContractAddress: AAVE_POOL_ADDRESS,
    toContractCallData: encodeAaveSupply(USDC_ADDRESS, recipientAddress),
    toContractGasLimit: '300000'
  }]
})

// 2. Execute the route
await executeRoute(quote)
```

### What Happens On-Chain

1. User signs ONE transaction on Arbitrum
2. LI.FI contract:
   - Swaps ETH → USDC via DEX aggregator
   - Bridges USDC to Base via optimal bridge
   - On Base, calls Aave's `supply()` with `onBehalfOf = recipient`
3. Recipient's Aave position increases
4. Sender never touched Base or Aave directly

---

## Data Flow: Setup

```
User clicks "Save to ENS"
        │
        ▼
┌─────────────────────────┐
│ useSetFeedMeConfig()    │
│ - Gets namehash         │
│ - Encodes setText calls │
│ - Calls multicall       │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ User's Wallet           │
│ - Signs transaction     │
│ - Pays gas (ETH mainnet)│
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ ENS Public Resolver     │
│ - Stores text records   │
│ - Emits events          │
└─────────────────────────┘
```

---

## Data Flow: Feed (Payment)

```
Sender visits /yourname.eth
        │
        ▼
┌─────────────────────────┐
│ useEnsConfig()          │  ✅ Implemented
│ - Reads all feedme.*    │
│   text records          │
│ - Returns config object │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ useEnsAddress()         │  ✅ Implemented (wagmi)
│ - Resolves ENS name     │
│   to Ethereum address   │
│ - Used for onBehalfOf   │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Feed Page renders       │
│ - Shows monster         │
│ - Shows recipient prefs │
│ - Shows recipient addr  │
└─────────────────────────┘
        │
        ▼
Sender enters amount, picks token/chain
        │
        ▼
┌─────────────────────────┐
│ usePaymentQuote()       │  ✅ Implemented
│ - Calls LI.FI API       │
│ - Gets estimated output │
│ - Shows route preview   │
└─────────────────────────┘
        │
        ▼
Sender clicks "FEED"
        │
        ▼
┌─────────────────────────┐
│ useFeedTransaction()    │  ✅ Implemented
│ - Executes LI.FI route  │
│ - Tracks tx status      │
│ - Shows success/error   │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Recipient's Aave        │
│ position increases!     │
└─────────────────────────┘
```

---

## Supported Chains (Mainnet)

| Chain | ID |
|-------|-----|
| Ethereum | 1 |
| Base | 8453 |
| Arbitrum | 42161 |

---

## Supported Protocols

| Protocol | Action | Contract Call |
|----------|--------|---------------|
| Aave V3 | Deposit | `supply(asset, amount, onBehalfOf, referralCode)` |
| Lido | Stake | `submit(referral)` + transfer to recipient |
| Aerodrome | LP | `addLiquidity(...)` |

---

## Contract Addresses (Mainnet)

### ENS
```
Registry:       0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
Public Resolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63
```

### FeedMeSplitter
```
Base: 0xdae12bd760ce15AaDdcD883E54a8F86f9084d3fB
```

### Aave V3 Pool
```
Ethereum: 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
Base:     0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
Arbitrum: 0x794a61358D6845594F94dc1DB02A252b5b4814aD
```

### USDC
```
Ethereum: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
Base:     0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Arbitrum: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

---

## Environment Variables

```bash
# .env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_LIFI_API_KEY=your_lifi_api_key
```

- WalletConnect: https://cloud.walletconnect.com
- LI.FI API Key: https://li.fi

---

## Debugging Tips

### Check ENS Records

Use the ENS app: https://app.ens.domains/yourname.eth

### Check LI.FI Transactions

Use the LI.FI explorer: https://scan.li.fi/

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Name not found" | ENS not registered | Register at app.ens.domains |
| "You don't own this name" | Wrong wallet | Connect wallet that owns the ENS |
| "No route available" | LI.FI can't find path | Try different token/chain combo |
| "Insufficient balance" | Not enough funds | Add funds to your wallet |

---

## ENS Ownership: Wrapped vs Unwrapped Names

### The Problem

Modern ENS names (registered after mid-2023) are "wrapped" in the NameWrapper contract. When you check the ENS Registry for the owner, it returns the NameWrapper contract address, not the actual user's address.

```
Registry.owner(namehash("yourname.eth"))
  → Returns: 0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401 (NameWrapper contract!)
  → NOT your wallet address
```

### The Solution

Check both the Registry AND the NameWrapper:

```typescript
// src/hooks/useEnsSetup.ts
export function useEnsOwner(ensName: string | undefined) {
  const node = getNamehash(ensName)
  const tokenId = BigInt(node) // NameWrapper uses namehash as ERC1155 tokenId

  // Fetch both in parallel
  const { data } = useReadContracts({
    contracts: [
      { address: ENS_CONTRACTS.registry, functionName: 'owner', args: [node] },
      { address: ENS_CONTRACTS.nameWrapper, functionName: 'ownerOf', args: [tokenId] },
    ]
  })

  // Determine actual owner
  const registryOwner = data[0].result
  const wrapperOwner = data[1].result

  // If registry owner is NameWrapper, use NameWrapper's ownerOf result
  if (registryOwner === ENS_CONTRACTS.nameWrapper) {
    return wrapperOwner // This is the actual user's address
  }
  return registryOwner // Unwrapped name, registry owner is the user
}
```

### Contract Addresses

```
ENS Registry:    0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
NameWrapper:     0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401
Public Resolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63
```

---

## ENS Address Resolution: Depositing to Someone Else's Position

### The Core Feature

FeedMe's key feature is that **anyone can deposit to someone else's Aave position**. When you visit `/taylor.eth`, your payment goes to Taylor's Aave position, not yours.

### How It Works

1. **Resolve ENS to Address**: Use wagmi's `useEnsAddress` hook to convert `taylor.eth` → `0x1234...abcd`
2. **Pass to LI.FI Quote**: The resolved address becomes the `toAddress` parameter
3. **Aave's onBehalfOf**: In the Aave supply call, this address is used for `onBehalfOf`

```typescript
// src/pages/Feed.tsx
import { useEnsAddress } from 'wagmi'
import { mainnet } from 'wagmi/chains'

// Resolve ENS name to address
const normalizedEns = ens?.endsWith('.eth') ? ens : `${ens}.eth`
const { data: ensOwnerAddress, isLoading: isResolvingEns } = useEnsAddress({
  name: normalizedEns,
  chainId: mainnet.id,
})

// Pass to quote hook - this address will receive the Aave deposit
const { quote } = usePaymentQuote({
  // ... other params
  recipientAddress: ensOwnerAddress || undefined,
  protocol: 'aave',
})
```

### Why Aave's onBehalfOf Works

Aave V3's `supply` function has an `onBehalfOf` parameter that explicitly supports third-party deposits:

```solidity
function supply(
  address asset,        // Token to deposit (e.g., USDC)
  uint256 amount,       // Amount to deposit
  address onBehalfOf,   // WHO receives the aTokens (the position)
  uint16 referralCode   // Optional referral
) external;
```

**Key insight**: No approval or permission is needed from the recipient. Anyone can deposit to anyone's position. This is by design - it enables:
- Gift deposits
- Payment forwarding
- Yield-bearing payments (like FeedMe!)

### The Full Flow

```
1. Sender visits /taylor.eth
2. Frontend resolves taylor.eth → 0xABC123...
3. Sender enters 0.1 ETH, clicks FEED
4. LI.FI quote generated with:
   - fromChain: Arbitrum (sender's chain)
   - toChain: Base (Taylor's preferred chain)
   - toAddress: 0xABC123... (Taylor's address)
5. Contract call encoded:
   supply(USDC, amount, 0xABC123..., 0)
                        ↑ Taylor's address
6. Sender signs ONE transaction
7. ~4 minutes later: Taylor's Aave position increases
8. Sender never touches Taylor's wallet
```

### UI Safeguards

The Feed page includes safeguards:

```typescript
// Disable button if ENS can't be resolved
disabled={!ensOwnerAddress}

// Show status in button
{isResolvingEns
  ? 'Resolving ENS...'
  : !ensOwnerAddress
  ? 'Cannot resolve ENS address'
  : `🍖 FEED ${monsterName.toUpperCase()}`}

// Display resolved address for transparency
{ensOwnerAddress && (
  <div className="text-xs text-zinc-600">
    {ensOwnerAddress.slice(0, 6)}...{ensOwnerAddress.slice(-4)}
  </div>
)}
```

---

## LI.FI Contract Calls API: Swap + Deposit in One Transaction

### The Two-Step Quote Process

For Aave deposits, we use LI.FI's Contract Calls API which requires knowing the output amount upfront:

```typescript
// src/lib/lifi.ts
export async function fetchContractCallsQuote(params) {
  // Step 1: Get preliminary quote to know expected output
  const preliminaryQuote = await fetchQuote({
    fromChain, toChain, fromToken, toToken, fromAmount, fromAddress, toAddress,
  })

  const expectedOutput = preliminaryQuote.estimate?.toAmountMin

  // Step 2: Encode Aave supply call with known amount
  const supplyCallData = encodeFunctionData({
    abi: AAVE_SUPPLY_ABI,
    functionName: 'supply',
    args: [
      toToken,              // asset
      BigInt(expectedOutput), // amount
      toAddress,            // onBehalfOf (recipient!)
      0,                    // referralCode
    ],
  })

  // Step 3: Call Contract Calls API
  const response = await fetch('https://li.quest/v1/quote/contractCalls', {
    method: 'POST',
    body: JSON.stringify({
      fromChain, toChain, fromToken, toToken, fromAmount, fromAddress,
      toAddress: AAVE_POOL_ADDRESS,  // Destination is Aave pool
      contractCalls: [{
        fromAmount: expectedOutput,
        fromTokenAddress: toToken,
        toContractAddress: AAVE_POOL_ADDRESS,
        toContractCallData: supplyCallData,
        toContractGasLimit: '300000',
      }],
      integrator: 'feedme',
      fee: '0',
    }),
  })

  return response.json()
}
```

### Cross-Chain Transaction Flow

When sender is on ETH mainnet and recipient wants USDC in Aave on Base:

```
ETH Mainnet (sender signs here)
├── 0.0001 ETH sent to LI.FI Diamond
├── Swapped to USDC via DEX (e.g., Magpie Router)
├── USDC sent to Stargate Pool
└── Bridged via LayerZero to Base

~4 minutes later...

Base (recipient's position updated)
├── USDC arrives from bridge
├── LI.FI executor calls Aave Pool.supply()
├── aUSDC minted to recipient's address
└── Recipient sees position in Aave dashboard
```

### Actual Transaction Example

ETH Side (sender):
- 0.0001 ETH → LI.FI Diamond
- Swapped to ~0.227 USDC via Magpie
- Bridged through Stargate/LayerZero

Base Side (recipient, ~4 min later):
- 0.223 aBasUSDC minted to recipient
- 0.003 USDC dust (slippage remainder)

---

## Transaction Execution: useFeedTransaction Hook

### Implementation

```typescript
// src/hooks/useFeedTransaction.ts
export function useFeedTransaction() {
  const currentChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransaction, data: hash, isPending } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const execute = async (quote: LiFiQuote, fromChainKey: string) => {
    const { to, data, value, gasLimit } = quote.transactionRequest
    const targetChainId = getChainId(fromChainKey)

    // Switch chain if needed
    if (currentChainId !== targetChainId) {
      await switchChainAsync({ chainId: targetChainId })
      await new Promise(resolve => setTimeout(resolve, 500)) // Let wallet update
    }

    // Execute transaction
    sendTransaction({
      to: to as `0x${string}`,
      data: data as `0x${string}`,
      value: BigInt(value || '0'),
      gas: gasLimit ? BigInt(gasLimit) : undefined,
    })
  }

  return { execute, hash, isPending, isConfirming, isSuccess }
}
```

### Transaction States

| State | User Sees | What's Happening |
|-------|-----------|------------------|
| `isPending` | "Confirm in wallet..." | Waiting for wallet signature |
| `isConfirming` | "Feeding Monster..." | Tx submitted, waiting for confirmation |
| `isSuccess` | "Fed successfully!" | Source chain tx confirmed |

Note: For cross-chain transactions, `isSuccess` means the source chain tx is confirmed. The destination chain deposit happens ~4 minutes later via the bridge.

---

## FeedMeSplitter Contract: Payment Splits

### Overview

The FeedMeSplitter contract enables splitting incoming payments to multiple recipients. When a sender pays to a monster with splits configured, the funds are distributed according to the configured percentages.

### Contract Details

```
Chain:    Base
Address:  0xdae12bd760ce15AaDdcD883E54a8F86f9084d3fB
```

### How Splits Work

```
Sender pays 1 ETH
       │
       ▼
┌──────────────────────────┐
│ LI.FI (swap/bridge)      │
│ - Swaps ETH → USDC       │
│ - Bridges to Base        │
│ - Sends to Splitter      │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ FeedMeSplitter Contract  │
│                          │
│ distribute(USDC, [       │
│   alice: 5000 bps (50%)  │
│   bob:   3000 bps (30%)  │
│   carol: 2000 bps (20%)  │
│ ])                       │
└──────────────────────────┘
       │
       ├──► Alice receives 500 USDC
       ├──► Bob receives 300 USDC
       └──► Carol receives 200 USDC
```

### Contract Functions

```solidity
// Distribute ERC20 tokens
function distribute(
    address token,           // Token to distribute
    address[] recipients,    // Array of recipient addresses
    uint256[] bps           // Basis points (10000 = 100%)
) external;

// Distribute native ETH
function distributeETH(
    address[] recipients,
    uint256[] bps
) external payable;
```

### Basis Points

We use basis points (bps) for precision:
- 10000 bps = 100%
- 5000 bps = 50%
- 100 bps = 1%

The last recipient gets the remainder to avoid dust from rounding.

### Chain Support

| Chain | Splitter Available | Address |
|-------|-------------------|---------|
| Base | Yes | `0xdae12bd760ce15AaDdcD883E54a8F86f9084d3fB` |
| Arbitrum | No (pending deployment) | - |
| Mainnet | No (gas too expensive) | - |

### UI Behavior

- Splits option only appears when Base is selected
- Switching to mainnet/arbitrum clears any configured splits
- Each split adds ~50k gas (~$0.01-0.05 on Base)

### ENS Text Record Format

Splits are stored in ENS as a comma-separated string:

```
feedme.splits = "recipient1:percentage,recipient2:percentage,..."
```

Example:
```
feedme.splits = "0x1234...abcd:50,collaborator.eth:30,gitcoin.eth:20"
```

### Code Reference

```typescript
// src/lib/splitter.ts - Contract address and ABI
// src/lib/splits.ts - Parsing and validation
// src/lib/lifi.ts - fetchSplitQuote() for LI.FI integration
```

---

## Your Monsters Page

### Overview

The `/monsters` page shows all ENS names owned by the connected wallet and their FeedMe configuration status.

### Features

1. **Owned Names**: Lists all .eth names you own
2. **Configuration Status**: Shows which names have FeedMe configured
3. **Quick Actions**: View, Edit, or Setup buttons for each name
4. **Demo Link**: Link to taylorferran.eth as example

### How It Works

```typescript
// src/hooks/useUserEnsNames.ts
// Queries the ENS Subgraph to find all names owned by an address

const query = `
  query GetNames($owner: String!) {
    domains(where: { owner: $owner }) {
      name
      labelhash
      createdAt
    }
  }
`
```

### Route

```
/monsters → YourMonsters component
```

This page is accessible from the home page "Your Monsters" button.
