# 🔮 Confidential Prediction Market

A privacy-preserving prediction platform built with **ZAMA FHEVM (Fully Homomorphic Encryption Virtual Machine)**. Users can make predictions on binary outcome events while keeping their predictions completely private using on-chain encryption.

---

## 📖 Concept

The Confidential Prediction Market allows users to:
- Make encrypted Yes/No predictions on various events
- Keep predictions private until they choose to reveal them
- Check if their predictions were correct after markets are resolved
- No betting or financial aspects - pure prediction tracking

### Key Features

- **🔒 Private Predictions**: All predictions are encrypted using FHEVM technology
- **❓ Binary Markets**: Simple Yes/No questions with clear outcomes
- **🎯 Deadline-Based**: Markets have clear deadlines for predictions
- **✅ Resolution Tracking**: See if you predicted correctly after resolution
- **🔐 Zero-Knowledge**: Your predictions remain private until you decrypt them

---

## 🏗️ Architecture

### Smart Contract

**ConfidentialPrediction.sol**
- Create prediction markets with binary outcomes
- Submit encrypted predictions (Yes/No)
- Resolve markets after deadline
- Decrypt individual predictions to check accuracy

---

## 🚀 Getting Started

### Prerequisites

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | >= 20.0.0 | Runtime environment |
| **npm** or **yarn** | Latest | Package manager |
| **Git** | Latest | Version control |
| **MetaMask** | Latest | Web3 wallet |
| **Hardhat** | ^2.22.15 | Smart contract development |
| **TypeScript** | >= 5.0.0 | Type safety |

### Technology Stack

#### Smart Contracts
- **Solidity**: 0.8.24
- **FHEVM Core Contracts**: ^0.8.0
- **FHEVM Solidity Library**: ^0.8.0
- **Zama Oracle SDK**: ^0.2.0
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
- **Zama FHEVM Relayer SDK**: ^0.2.0 (Encryption/Decryption)
- **Tailwind CSS**: ^3.4.17 (Styling)

### Installation

#### 1. Clone the Repository

```bash
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
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Frontend `.env.local` file**:
```bash
cd prediction-frontend
cp .env.example .env.local

NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

### Development Workflow

#### Compile Contracts

```bash
npm run compile
```

#### Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

#### Start Frontend

```bash
cd prediction-frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 📚 How It Works

### 1. Encryption Flow

1. User creates a prediction (Yes/No)
2. Prediction is encrypted client-side using FHEVM SDK
3. Encrypted prediction is submitted to smart contract
4. Prediction remains encrypted on-chain

### 2. Resolution Flow

1. Market creator resolves the market after deadline
2. Actual outcome is recorded (YES or NO)
3. Users can decrypt their predictions to see if they were correct

### 3. Decryption Flow

1. User requests to decrypt their prediction
2. FHEVM SDK signs the decryption request
3. Decrypted value is returned privately to the user
4. User can compare their prediction with the actual outcome

---

## 🔒 Privacy & Security

This platform uses **FHEVM (Fully Homomorphic Encryption)** to ensure:
- Predictions are **never** visible on-chain in plaintext
- Only the user who made a prediction can decrypt it
- Mathematical operations can be performed on encrypted data
- Zero-knowledge proofs validate encrypted values without revealing them

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

Built with Zama's FHEVM technology for complete on-chain privacy
