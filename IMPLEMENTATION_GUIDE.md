# FeedMe Implementation Guide

This guide walks through building FeedMe step by step. Each phase builds on the previous one.

---

## Current Status

**Phase 1 & 5 complete.** We can:
- Read FeedMe config from ENS text records
- Write FeedMe config to ENS text records
- Display monster based on saved preferences

**Next up:** Phase 2 (LI.FI Quote Integration) to show real swap quotes.

---

## Phase 1: ENS Integration (Read) ✅ COMPLETE

**Goal:** Fetch recipient preferences from ENS text records

### Tasks

- [x] **1.1** Create `useEnsConfig` hook
  - Use wagmi's `useReadContracts` to read text records
  - Read: `feedme.chain`, `feedme.token`, `feedme.protocol`
  - Read: `feedme.monsterName`, `feedme.monsterType`
  - Handle loading/error states

- [x] **1.2** Update Feed page to use real ENS data
  - Replace hardcoded config with `useEnsConfig(ens)`
  - Show loading skeleton while fetching
  - Handle "not configured" state gracefully

- [x] **1.3** Add ENS name display
  - Display recipient's ENS name prominently

### Files created
```
src/hooks/useEnsConfig.ts     ✅ Created
src/pages/Feed.tsx            ✅ Updated
```

---

## Phase 2: LI.FI Quote Integration ⬅️ CURRENT

**Goal:** Show users what they'll get before they send

### Tasks

- [ ] **2.1** Create LI.FI service module
  - Initialize LI.FI SDK
  - Create `getQuote` function
  - Handle errors (no route, insufficient liquidity)

- [ ] **2.2** Create `usePaymentQuote` hook
  - Input: sender token/chain/amount, recipient config
  - Output: expected output amount, gas estimate, route details
  - Debounce input changes

- [x] **2.3** Build token/chain selector components
  - Dropdown for sender's token selection ✅ Done
  - Dropdown for sender's chain selection ✅ Done
  - Show user's balances for each token (TODO)

- [ ] **2.4** Update Feed page with live quotes
  - Show quote while user types amount
  - Display route info (which DEXs/bridges used)
  - Show gas estimate and slippage

### Files to create/modify
```
src/lib/lifi.ts               # New - LI.FI SDK setup
src/hooks/usePaymentQuote.ts  # New - quote fetching
src/pages/Feed.tsx            # Modify - add quote display
```

### Key code pattern
```typescript
import { getQuote } from '@lifi/sdk'

const quote = await getQuote({
  fromChain: senderChainId,
  fromToken: senderTokenAddress,
  fromAmount: amountInWei,
  toChain: recipientChainId,
  toToken: recipientTokenAddress,
  fromAddress: senderAddress,
  toAddress: recipientAddress,
})
```

---

## Phase 3: LI.FI Composer (Contract Calls)

**Goal:** Execute cross-chain swaps that deposit directly into DeFi protocols

### Tasks

- [ ] **3.1** Create protocol call data generators
  - Aave: `supply(asset, amount, onBehalfOf, referralCode)`
  - Encode function calls for each supported protocol

- [ ] **3.2** Integrate LI.FI Composer
  - Add contract call to the swap request
  - The final step calls the DeFi protocol's deposit function

- [ ] **3.3** Create `useFeedTransaction` hook
  - Build full transaction request
  - Handle approval if needed (ERC20 tokens)
  - Execute transaction
  - Track transaction status

- [ ] **3.4** Build transaction status UI
  - Pending state with spinner
  - Tracking cross-chain progress
  - Success/failure states

### Files to create/modify
```
src/lib/protocols/aave.ts     # New - Aave call encoding
src/lib/protocols/index.ts    # New - protocol registry
src/hooks/useFeedTransaction.ts # New - tx execution
src/components/TxStatus.tsx   # New - transaction tracking
src/pages/Feed.tsx            # Modify - wire up feed button
```

### Key code pattern (Aave deposit encoding)
```typescript
import { encodeFunctionData } from 'viem'

const AAVE_POOL_ABI = [
  {
    name: 'supply',
    type: 'function',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
  },
] as const

function encodeAaveDeposit(asset: Address, amount: bigint, recipient: Address) {
  return encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: 'supply',
    args: [asset, amount, recipient, 0],
  })
}
```

### LI.FI Composer pattern
```typescript
import { getContractCallsQuote } from '@lifi/sdk'

const quote = await getContractCallsQuote({
  fromChain: senderChainId,
  fromToken: senderTokenAddress,
  fromAmount: amountInWei,
  fromAddress: senderAddress,
  toChain: recipientChainId,
  toToken: recipientTokenAddress,
  contractCalls: [
    {
      fromAmount: '0', // LI.FI calculates this
      fromTokenAddress: recipientTokenAddress,
      toContractAddress: aavePoolAddress,
      toContractCallData: encodeAaveDeposit(...),
      toContractGasLimit: '300000',
    },
  ],
})
```

---

## Phase 4: Monster Theme & Animations

**Goal:** Make it fun and memorable

### Tasks

- [ ] **4.1** Create Monster component
  - SVG or emoji-based monster display
  - Different monster types (octopus, dragon, blob, etc.)
  - Size varies based on... something fun (position size? recent feeds?)

- [ ] **4.2** Add monster animations
  - Idle animation (breathing, blinking)
  - Hungry animation (mouth opens, drools)
  - Eating animation (tokens fly in)
  - Satisfied animation (happy, burps)

- [ ] **4.3** Add speech bubbles
  - "I'm hungry..." when idle
  - "DELICIOUS!" after feeding
  - "More please!" after a while

- [ ] **4.4** Create feeding celebration
  - Confetti/particles on successful feed
  - Monster growth animation
  - Sound effects (optional)

### Files to create/modify
```
src/components/Monster.tsx    # New - monster display
src/components/FeedAnimation.tsx # New - feeding animation
src/assets/monsters/          # Monster SVGs or sprites
src/pages/Feed.tsx            # Modify - integrate monster
```

---

## Phase 5: ENS Setup Flow ✅ COMPLETE

**Goal:** Let recipients configure their FeedMe preferences

### Tasks

- [x] **5.1** Create ENS write utilities
  - Check if user owns the ENS name
  - Build text record update transaction
  - Handle resolver differences

- [x] **5.2** Build setup form
  - Connect wallet, verify ENS ownership
  - Choose chain, token, protocol
  - Name your monster + pick type
  - Preview & confirm

- [x] **5.3** Add setup preview
  - Show how the Feed page will look
  - Generate shareable link

- [x] **5.4** Handle gas for ENS updates
  - Support batching multiple text records (multicall)

### Files created
```
src/lib/ens.ts                ✅ Created
src/hooks/useEnsSetup.ts      ✅ Created
src/pages/Setup.tsx           ✅ Updated
```

---

## Phase 6: Polish & Edge Cases

**Goal:** Production-ready experience

### Tasks

- [ ] **6.1** Error handling
  - No route available
  - Insufficient balance
  - Transaction failed
  - ENS not found
  - User rejected transaction

- [ ] **6.2** Loading states
  - Skeleton loaders for ENS data
  - Quote loading indicator
  - Transaction pending states

- [ ] **6.3** Mobile responsiveness
  - Test on various screen sizes
  - Touch-friendly buttons
  - Proper viewport handling

- [ ] **6.4** SEO/sharing
  - Dynamic page titles (Feed alice.eth)
  - Open Graph meta tags
  - Twitter card support

---

## Contract Addresses Reference

### Aave V3 Pool Addresses (Mainnet)
```
Base:     0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
Arbitrum: 0x794a61358D6845594F94dc1DB02A252b5b4814aD
Mainnet:  0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
```

### Common Token Addresses (Mainnet)
```
# USDC
Base:     0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Arbitrum: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
Mainnet:  0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48

# WETH
Base:     0x4200000000000000000000000000000000000006
Arbitrum: 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1
Mainnet:  0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```

---

## Testing Checklist

- [x] Can connect wallet on multiple chains
- [x] ENS lookup works for real ENS names (taylortest.eth)
- [x] ENS write works (saved Ghosty the Kraken)
- [ ] Quote updates when amount changes
- [ ] Can execute swap on testnet
- [ ] Cross-chain transaction completes
- [ ] DeFi deposit is received by recipient

---

## Running the App

```bash
npm install
npm run dev
```

---

## Next Steps

**Phase 2** is next — integrate LI.FI to get real swap quotes.

Ready to implement?
