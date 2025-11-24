# Confidential Prediction Market

A privacy-preserving prediction platform built with FHEVM (Fully Homomorphic Encryption Virtual Machine). Users can make predictions on binary outcome events while keeping their predictions completely private using on-chain encryption. No betting or financial aspects - pure prediction tracking with cryptographic privacy.

**Author**: [@Gengarthedev](https://x.com/Gengarthedev)

---

## Deployment Information

| Contract Name | Network | Contract Address |
|--------------|---------|------------------|
| ConfidentialPrediction | Sepolia | [`0x7407B9C63793546d97CD41A23bf4C461CC0ADC95`](https://sepolia.etherscan.io/address/0x7407B9C63793546d97CD41A23bf4C461CC0ADC95) |

---

## Table of Contents

- [Concept](#concept)
- [Architecture Overview](#architecture-overview)
- [Application Flows](#application-flows)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Contract Specifications](#contract-specifications)
- [Development Tools](#development-tools)
- [FHEVM v0.9 Migration](#fhevm-v09-migration)
- [Additional Resources](#additional-resources)
- [Contributing](#contributing)
- [License](#license)

---

## Concept

The Confidential Prediction Market revolutionizes prediction platforms by combining blockchain transparency with **cryptographic privacy**. Traditional prediction markets expose all predictions publicly, which can influence crowd behavior and compromise privacy. This solution leverages **homomorphic encryption** to keep predictions encrypted on-chain while still enabling verification of correctness after resolution.

### Key Features

- **Private Predictions**: All predictions are encrypted using FHEVM technology
- **Binary Markets**: Simple Yes/No questions with clear outcomes
- **Deadline-Based**: Markets have clear deadlines for making predictions
- **Resolution Tracking**: Check if you predicted correctly after market resolution
- **Self-Relaying Decryption**: Instant decryption with cryptographic proofs (FHEVM v0.9)
- **Zero-Knowledge**: Your predictions remain encrypted until you choose to decrypt them
- **User-Controlled**: Users sign and submit their own decryption requests
- **Privacy-First**: No one can see your prediction until you reveal it

---

## Architecture Overview

The platform consists of two main layers: **Smart Contracts** (on-chain logic) and **Frontend Application** (user interface with FHEVM integration).

### Smart Contract Architecture

```
┌─────────────────────────────────────────────────────┐
│         ConfidentialPrediction Contract             │
├─────────────────────────────────────────────────────┤
│  - Market Management                                │
│  - Encrypted Prediction Storage                     │
│  - Resolution Logic                                 │
│  - Decryption Workflow (v0.9 Self-Relaying)         │
└─────────────────────────────────────────────────────┘
                         │
                         │ Uses
                         ▼
┌─────────────────────────────────────────────────────┐
│              FHEVM Library (Zama)                   │
├─────────────────────────────────────────────────────┤
│  - FHE.asEbool() / FHE.fromExternal()               │
│  - FHE.makePubliclyDecryptable()                    │
│  - FHE.checkSignatures()                            │
│  - FHE.allow() - Permission management              │
└─────────────────────────────────────────────────────┘
```

---

## Application Flows

### 1. Market Creation Flow

```mermaid
sequenceDiagram
    participant User as Market Creator
    participant UI as Frontend
    participant Contract as ConfidentialPrediction

    User->>UI: Enter question, description, duration
    UI->>Contract: createMarket(question, description, duration)
    Contract->>Contract: Validate inputs
    Contract->>Contract: Create new market with ID
    Contract->>Contract: Set deadline = now + duration
    Contract-->>UI: MarketCreated event
    UI-->>User: Market created successfully
```

### 2. Make Prediction Flow

```mermaid
sequenceDiagram
    participant User as Predictor
    participant UI as Frontend
    participant SDK as FHEVM SDK
    participant Contract as ConfidentialPrediction

    User->>UI: Select YES or NO
    UI->>SDK: encryptBool(prediction)
    SDK->>SDK: Generate encrypted data + proof
    SDK-->>UI: {encryptedData, proof}
    UI->>Contract: predict(marketId, encryptedData, proof)
    Contract->>Contract: Verify proof (FHE.fromExternal)
    Contract->>Contract: Store encrypted prediction
    Contract->>Contract: Grant permissions (FHE.allow)
    Contract-->>UI: PredictionMade event
    UI-->>User: Prediction submitted successfully
```

### 3. Market Resolution Flow

```mermaid
sequenceDiagram
    participant Creator as Market Creator
    participant UI as Frontend
    participant Contract as ConfidentialPrediction

    Note over Creator,Contract: After deadline passes
    Creator->>UI: Select actual outcome (YES/NO)
    UI->>Contract: resolveMarket(marketId, outcome)
    Contract->>Contract: Check deadline passed
    Contract->>Contract: Check only creator
    Contract->>Contract: Set market.resolved = true
    Contract->>Contract: Record actual outcome
    Contract-->>UI: MarketResolved event
    UI-->>Creator: Market resolved successfully
```

### 4. Decrypt Prediction Flow (v0.9 Self-Relaying)

```mermaid
sequenceDiagram
    participant User as User
    participant UI as Frontend
    participant SDK as Relayer SDK
    participant Contract as ConfidentialPrediction

    User->>UI: Click "Decrypt My Prediction"

    Note over UI,Contract: Step 1: Mark as Decryptable
    UI->>Contract: requestMyPredictionDecryption(marketId)
    Contract->>Contract: FHE.makePubliclyDecryptable(prediction)
    Contract->>Contract: Set status = PROCESSING
    Contract-->>UI: Transaction confirmed

    Note over UI,Contract: Step 2: Get Encrypted Handle
    UI->>Contract: getEncryptedPredictionHandle(marketId, userAddress)
    Contract-->>UI: bytes32 handle

    Note over UI,SDK: Step 3: Decrypt with User Signature
    UI->>SDK: userDecrypt(handle, signature)
    SDK->>SDK: Generate keypair
    SDK->>SDK: Request EIP712 signature
    UI->>User: Sign decryption request
    User-->>UI: Signature
    SDK->>SDK: Decrypt value with signature
    SDK-->>UI: cleartext value

    Note over UI: Display Result
    UI->>UI: Compute wasCorrect = (prediction == actualOutcome)
    UI-->>User: Display: "You predicted YES/NO" + correctness
```

### 5. Encryption & Decryption Technical Flow

**Encryption Process:**

1. Boolean Value (YES = true, NO = false)
2. FHEVM SDK creates encrypted input
3. Generate encrypted value (ebool) + ZK Proof
4. Submit to smart contract for on-chain storage

**User-Signature Decryption Process (v0.9):**

1. User initiates decryption request
2. Mark encrypted value as decryptable via `FHE.makePubliclyDecryptable()`
3. Retrieve encrypted handle from contract
4. Generate keypair and create EIP712 signature request
5. User signs the decryption request in wallet
6. SDK decrypts with signature
7. Display decrypted value to user

#### Decryption Workflow Details

The platform uses **FHEVM v0.9 user-signature decryption** for secure and instant prediction decryption:

**User-Signature Process:**

1. **Mark as Decryptable**: Contract marks the encrypted prediction as publicly decryptable using `FHE.makePubliclyDecryptable()`
2. **Get Handle**: Frontend retrieves the encrypted handle from the contract via `getEncryptedPredictionHandle()`
3. **Sign & Decrypt**: SDK generates keypair, requests user signature (EIP712), and decrypts with signature

**Benefits:**
- **Instant**: No waiting for external services
- **Secure**: User signature required for decryption
- **User-controlled**: Only the predictor can decrypt their prediction
- **Cost-effective**: No reliance on third-party oracle services
- **Privacy-preserving**: Signature-based authentication ensures only owner can decrypt

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | >= 20.0.0 | Runtime environment |
| **npm** or **yarn** | Latest | Package manager |
| **Git** | Latest | Version control |
| **MetaMask** or compatible wallet | Latest | Web3 wallet |
| **Hardhat** | ^2.22.15 | Smart contract development |
| **TypeScript** | >= 5.0.0 | Type safety |

### Technology Stack

#### Smart Contracts
- **Solidity**: 0.8.24
- **FHEVM Core Contracts**: ^0.8.0
- **FHEVM Solidity**: ^0.9.1 (User-signature decryption)
- **FHEVM Hardhat Plugin**: ^0.3.0-1
- **Hardhat**: Development environment
- **TypeChain**: Type-safe contract interactions
- **Ethers v6**: Web3 library

#### Frontend
- **Next.js**: 15.0.0 (App Router)
- **React**: 19.1.0
- **TypeScript**: ^5.0.0
- **Viem**: ^2.21.53 (Ethereum client)
- **Ethers**: ^6.13.4 (Provider/Signer)
- **Privy**: ^3.0.1 (Wallet authentication)
- **Zama FHEVM Relayer SDK**: ^0.3.0-5 (Encryption/Decryption)
- **Tailwind CSS**: ^3.4.17 (Styling)

### Installation

#### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd confidential-prediction
```

#### 2. Install Contract Dependencies

```bash
npm install
```

#### 3. Install Frontend Dependencies

```bash
cd prediction-frontend
npm install
```

#### 4. Configure Environment Variables

**Root `.env` file** (for contract deployment):
```bash
# Create .env file in root directory
cp .env.example .env

# Add your configuration
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Frontend `.env.local` file**:
```bash
# Create .env.local in prediction-frontend/
cd prediction-frontend
cp .env.example .env.local

# Add your configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7407B9C63793546d97CD41A23bf4C461CC0ADC95
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_GATEWAY_URL=https://gateway.sepolia.zama.ai
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

### Development Workflow

#### Compile Contracts

```bash
npm run compile
```

This generates:
- Compiled artifacts in `artifacts/`
- TypeChain types in `types/`
- ABI files for frontend integration

#### Testing Contracts

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/ConfidentialPrediction.test.ts
```

#### Run Frontend Development Server

```bash
cd prediction-frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### Deploy to Sepolia Testnet

**Option 1: Using Hardhat Vars (Recommended)**

```bash
# Set your private key securely (only once)
npx hardhat vars set PRIVATE_KEY

# Deploy to Sepolia
npm run deploy:sepolia
```

**Option 2: Manual Deployment**

```bash
# Ensure .env is configured with PRIVATE_KEY
npx hardhat run scripts/deploy.ts --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

The deployment script will output:
```
ConfidentialPrediction deployed to: 0x...
```

Update this address in `prediction-frontend/.env.local`.

### Production Build

```bash
cd prediction-frontend
npm run build
npm start
```

---

## Contract Specifications

### Contract Address (Sepolia Testnet)

Update this value in your `.env.local` file:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7407B9C63793546d97CD41A23bf4C461CC0ADC95
NEXT_PUBLIC_CHAIN_ID=11155111
```

### ConfidentialPrediction.sol

**Address**: `0x7407B9C63793546d97CD41A23bf4C461CC0ADC95`

**Purpose**: Privacy-preserving prediction market contract

#### Key Functions

| Function | Parameters | Description | Access |
|----------|-----------|-------------|--------|
| `createMarket` | `question`, `description`, `duration` | Create new prediction market | Public |
| `predict` | `marketId`, `encryptedPrediction`, `proof` | Make encrypted prediction | Public |
| `resolveMarket` | `marketId`, `outcome` | Resolve market with actual outcome | Creator only |
| `cancelMarket` | `marketId` | Cancel unresolved market | Creator only |
| `requestMyPredictionDecryption` | `marketId` | Mark prediction as decryptable | Predictor |
| `getMarket` | `marketId` | Get market details | Public (read) |
| `getPredictionStatus` | `marketId`, `user` | Get decryption status | Public (read) |
| `getEncryptedPredictionHandle` | `marketId`, `user` | Get encrypted handle for decryption | Public (read) |
| `checkHasPrediction` | `marketId`, `user` | Check if user made prediction | Public (read) |

#### Events

- `MarketCreated(uint16 marketId, address creator, string question, uint256 deadline)`
- `PredictionMade(uint16 marketId, address predictor)`
- `MarketResolved(uint16 marketId, Outcome outcome)`
- `MarketCancelled(uint16 marketId)`

#### Enums

```solidity
enum Outcome {
    PENDING,    // 0 - Not resolved yet
    YES,        // 1 - Resolved as YES
    NO,         // 2 - Resolved as NO
    CANCELLED   // 3 - Market cancelled
}

enum DecryptStatus {
    IDLE,       // 0 - Not started
    PROCESSING, // 1 - Marked as decryptable
    DECRYPTED   // 2 - Decrypted (legacy, not used in signature flow)
}
```

#### Storage

- `Market[] public markets` - Array of all markets
- `mapping(uint16 => mapping(address => ebool)) encryptedPredictions` - Encrypted predictions
- `mapping(uint16 => mapping(address => bool)) hasPrediction` - Prediction existence tracker
- `mapping(uint16 => mapping(address => DecryptStatus)) decryptPredictionStatus` - Decryption status

#### Market Struct

```solidity
struct Market {
    address creator;
    string question;
    string description;
    uint256 deadline;
    Outcome outcome;
    bool resolved;
}
```

### Network Configuration

| Network | Chain ID | RPC URL | Block Explorer |
|---------|----------|---------|----------------|
| **Sepolia** | 11155111 | `https://ethereum-sepolia-rpc.publicnode.com` | https://sepolia.etherscan.io |
| **Localhost** | 31337 | `http://127.0.0.1:8545` | N/A |

### Compiler Configuration

```json
{
  "solidity": "0.8.24",
  "optimizer": {
    "enabled": true,
    "runs": 200,
    "viaIR": true
  },
  "evmVersion": "cancun"
}
```

**Note**: `viaIR: true` is **required** for FHEVM contracts to compile correctly.

### Security Features

- **Access Control**: Creator-only functions protected by `onlyCreator` modifier
- **FHE Permissions**: Strict permission management via `FHE.allow()` and `FHE.allowThis()`
- **Input Validation**: Comprehensive checks on all parameters
- **State Machine**: Market lifecycle enforced by state checks
- **Duplicate Prevention**: Users cannot predict twice on the same market
- **Signature-Based Decryption**: Only the predictor can decrypt their prediction with their signature
- **Deadline Enforcement**: Predictions blocked after deadline, resolution allowed only after

---

## Development Tools

### Flatten Contracts for Verification

If you need to verify contracts on Etherscan, you can flatten the contract:

```bash
npx hardhat flatten contracts/ConfidentialPrediction.sol > flattened/ConfidentialPrediction_flat.sol
```

**Note**: Remove duplicate SPDX license identifiers if the verifier shows warnings.

### Using Hardhat Console

```bash
# Connect to Sepolia
npx hardhat console --network sepolia

# Example: Check market count
const contract = await ethers.getContractAt("ConfidentialPrediction", "0x7407B9C63793546d97CD41A23bf4C461CC0ADC95");
const count = await contract.marketCount();
console.log("Total markets:", count.toString());
```

### Quick Demo Market Script

Create a short-duration market for demo videos:

```bash
# Create a 3-minute market (default)
npx hardhat run create-demo-market.js --network sepolia

# Create a 5-minute market with custom question
DURATION_MINUTES=5 QUESTION="Will BTC reach $100k?" npx hardhat run create-demo-market.js --network sepolia
```

---

## FHEVM v0.9 Migration

This project uses **FHEVM v0.9** with user-signature based decryption.

### Smart Contract Changes

**Removed (Deprecated):**
- `FHE.requestDecryption()` - Oracle-based decryption
- Oracle callback functions
- Proof submission methods

**Added (User-Signature):**
- `FHE.makePubliclyDecryptable()` - Marks values for decryption
- `requestMyPredictionDecryption()` - Mark prediction as decryptable
- `getEncryptedPredictionHandle()` - Get handle for SDK decryption

### Frontend Changes

**Package Updates:**
- `@fhevm/solidity`: ^0.8.0 → ^0.9.1
- `@zama-fhe/relayer-sdk`: ^0.2.0 → ^0.3.0-5
- Added: `@fhevm/hardhat-plugin`: ^0.3.0-1
- Removed: `@zama-fhe/oracle-solidity` (deprecated)

**New Workflow:**
```typescript
// 1. Mark as decryptable
await requestMyPredictionDecryption(marketId);

// 2. Get encrypted handle
const handle = await getEncryptedPredictionHandle(marketId, userAddress);

// 3. Decrypt with user signature
const cleartext = await decrypt(handle, contractAddress);

// 4. Display result
console.log("Your prediction:", cleartext ? "YES" : "NO");
```

**Benefits:**
- **Instant decryption** - No waiting for external services
- **More secure** - User signature required
- **Better UX** - Immediate feedback for users
- **Privacy-preserving** - Only predictor can decrypt with their signature

### Key Migration Points

1. **Contract must inherit `ZamaEthereumConfig`** - Provides ACL/KMS addresses
2. **Use signature-based decryption** - Requires user to sign EIP712 message
3. **Handle PROCESSING state** - If decryption was started but not completed
4. **Simplified workflow** - No proof submission needed (handled by SDK)

---

## Additional Resources

- **FHEVM Documentation**: https://docs.zama.org/protocol
- **FHEVM v0.9 Migration Guide**: https://docs.zama.org/protocol/solidity-guides/development-guide/migration
- **Relayer SDK Guides**: https://docs.zama.org/protocol/relayer-sdk-guides
- **Hardhat Documentation**: https://hardhat.org/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Privy Documentation**: https://docs.privy.io
- **Ethers.js Documentation**: https://docs.ethers.org/v6/

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

## Privacy & Security Notice

This platform uses **FHEVM (Fully Homomorphic Encryption)** to ensure:
- Predictions are **never** visible on-chain in plaintext
- Only the predictor can decrypt their own prediction
- Mathematical operations can be performed on encrypted data
- Zero-knowledge proofs validate encrypted values without revealing them
- No third party (including contract owner) can see your prediction

**Use Cases:**
- Unbiased prediction tracking without crowd influence
- Private opinion polling
- Research studies requiring prediction privacy
- Gaming and entertainment without spoilers
- Market sentiment analysis with privacy

**Security Audits**: This is an educational project. Use at your own risk.

---

**Author**: [@Gengarthedev](https://x.com/Gengarthedev) | **Technology**: Zama FHEVM
