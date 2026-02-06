# FeedMeSplitter Contract Deployment Status

## Current Status: PAUSED

Last updated: Feb 6, 2026

---

## What's Done

### 1. Contract Written
- **File**: `contracts/src/FeedMeSplitter.sol`
- **Features**:
  - `distribute(token, recipients[], bps[])` - Split ERC20 tokens
  - `distributeETH(recipients[], bps[])` - Split native ETH
  - Uses basis points (10000 = 100%) for precision
  - Last recipient gets remainder to avoid dust

### 2. Foundry Installed
- Forge, Cast, Anvil, Chisel all installed
- Version: 1.5.1-stable

### 3. Project Structure Created
```
contracts/
├── src/
│   └── FeedMeSplitter.sol
├── script/
│   └── Deploy.s.sol
├── foundry.toml
└── deploy.ts (alternative TS deployment)
```

---

## What's Remaining

### 1. Install Dependencies
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 2. Deploy to Base
```bash
source .env
forge script script/Deploy.s.sol --rpc-url https://mainnet.base.org --broadcast --verify
```

### 3. Update Frontend
- Add contract address to `src/lib/splitter.ts`
- Update `usePaymentQuote` to use Contract Calls API when splits enabled
- Restrict splits UI to Base only (disable for mainnet & arbitrum)

### 4. Update TECHNICAL_GUIDE.md
- Document splitter contract
- Document splits feature
- Document new "Your Monsters" page

---

## Deployment Plan

| Chain | Status | Contract Address |
|-------|--------|------------------|
| Base | Pending | TBD |
| Arbitrum | Deferred (needs funds) | - |
| Mainnet | Not planned (gas costs) | - |

---

## Environment Setup

Required in `.env`:
```
DEPLOYER_KEY=<private key without 0x prefix>
```

The deployer wallet needs ~0.001 ETH on Base for deployment gas.

---

## UI Changes Needed

1. **Setup page**: Only show SplitConfig when `selectedChain === 'base'`
2. **Feed page**: Only use splitter contract when:
   - Chain is Base
   - Splits are configured
   - Otherwise use existing direct LI.FI flow

---

## Notes

- Splits only work when explicitly enabled (existing flow unchanged)
- Contract is stateless - no admin, no upgrades, no fees
- Each split adds ~50k gas (~$0.01-0.05 on Base)
