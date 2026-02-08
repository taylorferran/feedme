# FeedMe

**Accept cross-chain payments, deposited directly to DeFi—configured through your ENS name.**

FeedMe is a payment portal that lets anyone pay you from Ethereum, Base, or Arbitrum in ETH, USDC, WETH, or other supported tokens. Your payment preferences—destination chain, token, and DeFi protocol—are stored on your ENS name. Senders sign once; LI.FI handles the swap, bridge, and deposit into protocols like Aave, Lido, or Aerodrome.

## Features

- **Cross-Chain Payments**: Accept ETH from Arbitrum and receive USDC on Base
- **DeFi Protocol Integration**: Payments deposit directly into Aave V3, Lido, or Aerodrome
- **ENS-Based Configuration**: Your payment preferences are stored as text records on your ENS name
- **Payment Splits**: Split incoming payments to multiple recipients (Aave on Base only)
- **One Transaction**: Senders sign once; LI.FI handles swap, bridge, and deposit

## How It Works

```
Sender (Ethereum, Base, or Arbitrum)
        |
        v
+---------------------------+
| LI.FI (swap + bridge)     |
| ETH on Arbitrum -> USDC   |
| Bridge to Base            |
+---------------------------+
        |
        v
+---------------------------+
| Aave V3 Pool              |
| supply(USDC, recipient)   |
+---------------------------+
        |
        v
Recipient's Aave position increases
(earning yield immediately)
```

### With Payment Splits

```
Sender pays 1000 USDC
        |
        v
+---------------------------+
| FeedMeSplitter Contract   |
| distributeToAave()        |
+---------------------------+
        |
        +---> Alice's Aave: +500 USDC (50%)
        +---> Bob's Aave: +300 USDC (30%)
        +---> Carol's Aave: +200 USDC (20%)
```

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: RainbowKit + wagmi + viem
- **Cross-Chain**: LI.FI SDK (swap + bridge + contract calls)
- **Identity**: ENS (Ethereum Name Service) for configuration storage
- **Contracts**: Solidity + Foundry
- **DeFi Protocols**: Aave V3, Lido, Aerodrome

## Getting Started

### Prerequisites

- Node.js 18+
- An ENS name (register at [app.ens.domains](https://app.ens.domains))
- Foundry (for contract development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd feedme

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Environment Variables

```bash
# .env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id  # Get from cloud.walletconnect.com
VITE_LIFI_API_KEY=your_lifi_api_key            # Optional, for higher rate limits

# For contract deployment
DEPLOYER_KEY=0x...                              # Private key for deployment
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Contract Development

```bash
cd contracts

# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Deploy to Base
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://mainnet.base.org \
  --private-key $DEPLOYER_KEY \
  --broadcast
```

## Project Structure

```
feedme/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   │   ├── useEnsConfig.ts       # Read ENS text records
│   │   ├── usePaymentQuote.ts    # Get LI.FI quotes
│   │   ├── useFeedTransaction.ts # Execute payments
│   │   └── useResolvedSplits.ts  # Resolve ENS in splits
│   ├── lib/             # Utilities and configs
│   │   ├── lifi.ts      # LI.FI SDK integration
│   │   ├── splitter.ts  # FeedMeSplitter contract config
│   │   ├── splits.ts    # Payment splits logic
│   │   └── ens.ts       # ENS contract addresses
│   ├── pages/           # Route pages
│   │   ├── Home.tsx     # Landing page
│   │   ├── Setup.tsx    # Configure your monster
│   │   ├── Feed.tsx     # Payment page (/:ens)
│   │   └── YourMonsters.tsx # View your ENS names
│   └── types/           # TypeScript types
├── contracts/
│   ├── src/
│   │   └── FeedMeSplitter.sol  # Payment splitting contract
│   ├── script/
│   │   └── Deploy.s.sol        # Deployment script
│   └── test/
│       └── FeedMeSplitter.t.sol
└── public/
```

## Contracts

### FeedMeSplitter

Splits incoming payments to multiple recipients with optional Aave deposits.

| Chain | Address |
|-------|---------|
| Base | `0xa3e22f29A1B91d672F600D90e28bca45C53ef456` |

**Functions:**

```solidity
// Split tokens to multiple Aave positions
function distributeToAave(
    address token,
    address aavePool,
    address[] recipients,
    uint256[] bps  // Basis points (10000 = 100%)
) external;

// Split tokens directly (no Aave)
function distribute(
    address token,
    address[] recipients,
    uint256[] bps
) external;

// Split native ETH
function distributeETH(
    address[] recipients,
    uint256[] bps
) external payable;
```

## Supported Chains

| Chain | ID | Aave | Splits |
|-------|-----|------|--------|
| Ethereum | 1 | Yes | No |
| Base | 8453 | Yes | Yes |
| Arbitrum | 42161 | Yes | No |

## Supported Protocols

| Protocol | Splits Support |
|----------|----------------|
| Aave V3 | Yes |
| Lido | No |
| Aerodrome | No |

**Note**: Payment splits are only available with Aave protocol on Base.

## ENS Text Records

FeedMe stores configuration in ENS text records:

| Key | Example | Description |
|-----|---------|-------------|
| `feedme.chain` | `base` | Destination chain |
| `feedme.token` | `USDC` | Token to receive |
| `feedme.protocol` | `aave` | DeFi protocol |
| `feedme.monsterName` | `Chompy` | Display name |
| `feedme.monsterType` | `kraken` | Monster emoji type |
| `feedme.splits` | `alice.eth:50,bob.eth:50` | Payment splits |

## Usage

### For Recipients (Setup)

1. Connect wallet on Ethereum mainnet
2. Enter your ENS name
3. Choose destination chain (Base recommended for splits)
4. Choose protocol (Aave for splits support)
5. Choose token (USDC, WETH, etc.)
6. Optionally configure payment splits
7. Save to ENS (one-time gas cost)

### For Senders (Pay)

1. Visit `yoururl.com/yourname.eth`
2. Connect wallet
3. Enter amount and select your token/chain
4. Click "FEED" and sign the transaction
5. Recipient's Aave position increases (no action needed from them)

## Architecture

```
+----------------------------------------------------------------+
|                         FRONTEND                                |
|  Setup Page -> Write ENS    |    Feed Page -> Execute Payment  |
+----------------------------------------------------------------+
                    |                           |
                    v                           v
+----------------------------------------------------------------+
|                    ENS (Ethereum Mainnet)                       |
|                    Text records storage                         |
+----------------------------------------------------------------+
                                    |
                                    v
+----------------------------------------------------------------+
|                         LI.FI Protocol                          |
|              Swap -> Bridge -> Contract Call                    |
+----------------------------------------------------------------+
                                    |
                    +---------------+---------------+
                    v                               v
+-------------------------------+   +-------------------------------+
|  FeedMeSplitter (for splits)  |   |  Aave V3 Pool (direct)        |
|  distributeToAave()           |-->|  supply(onBehalfOf)           |
+-------------------------------+   +-------------------------------+
```

## Security Considerations

- **No custody**: Funds flow directly from sender to recipient's DeFi position
- **Immutable config**: ENS records can only be changed by the ENS owner
- **Audited protocols**: Uses battle-tested Aave V3 and LI.FI
- **No admin keys**: FeedMeSplitter has no owner or upgrade mechanism

## Contributing

Contributions are welcome! Please read the [Technical Guide](TECHNICAL_GUIDE.md) for detailed architecture documentation.

## License

MIT
