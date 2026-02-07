# FeedMeSplitter Contract Deployment Status

## Current Status: COMPLETE

Last updated: Feb 7, 2026

---

## Completed Work

### 1. Contract Written & Tested
- **File**: `contracts/src/FeedMeSplitter.sol`
- **Tests**: `contracts/test/FeedMeSplitter.t.sol` (15 tests passing)
- **Features**:
  - `distribute(token, recipients[], bps[])` - Split ERC20 tokens
  - `distributeETH(recipients[], bps[])` - Split native ETH
  - Uses basis points (10000 = 100%) for precision
  - Last recipient gets remainder to avoid dust

### 2. Deployed to Base
- **Address**: `0xdae12bd760ce15AaDdcD883E54a8F86f9084d3fB`
- **Gas Used**: ~26k gwei
- **Verified**: Broadcast saved to `contracts/broadcast/`

### 3. Frontend Integration
- **`src/lib/splitter.ts`**: Contract address and ABI
- **`src/lib/lifi.ts`**: Added `fetchSplitQuote()` for LI.FI Contract Calls API
- **`src/pages/Setup.tsx`**: Splits UI only shown when Base is selected

### 4. Documentation Updated
- **TECHNICAL_GUIDE.md**: Added splitter contract docs, Your Monsters page docs
- **Contract addresses section**: Added FeedMeSplitter address

---

## Deployment Summary

| Chain | Status | Contract Address |
|-------|--------|------------------|
| Base | **DEPLOYED** | `0xdae12bd760ce15AaDdcD883E54a8F86f9084d3fB` |
| Arbitrum | Deferred (needs funds) | - |
| Mainnet | Not planned (gas costs) | - |

---

## Project Structure

```
contracts/
├── src/
│   └── FeedMeSplitter.sol      # Main contract
├── test/
│   └── FeedMeSplitter.t.sol    # Unit tests (15 passing)
├── script/
│   └── Deploy.s.sol            # Foundry deploy script
├── lib/
│   └── openzeppelin-contracts/ # Dependencies
├── foundry.toml                # Foundry config
└── deploy.ts                   # Alternative TS deployment
```

---

## How Splits Work

1. User configures splits in Setup page (Base only)
2. Splits stored in ENS: `feedme.splits = "addr1:50,addr2:30,addr3:20"`
3. When someone pays:
   - LI.FI swaps/bridges to USDC on Base
   - Sends to FeedMeSplitter contract
   - Contract calls `distribute()` to split funds
   - Each recipient receives their percentage

---

## Notes

- Splits only work when explicitly enabled (existing flow unchanged)
- Contract is stateless - no admin, no upgrades, no fees
- Each split adds ~50k gas (~$0.01-0.05 on Base)
- Splits UI disabled on mainnet/arbitrum (only Base supported)
