# 🚀 Installation & Setup Guide

Complete step-by-step guide to get your Confidential Prediction Market DApp running.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** (v20 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)
- **MetaMask** or compatible Web3 wallet
- **Sepolia testnet ETH** (for deployment) - [Get from faucet](https://sepoliafaucet.com/)
- **Privy Account** - [Sign up](https://privy.io/) for authentication

---

## 🔧 Part 1: Smart Contract Setup

### Step 1: Install Contract Dependencies

```bash
cd C:\Users\NghiaBe\confidential-prediction
npm install
```

This will install:
- Hardhat
- FHEVM libraries
- Zama Oracle SDK
- TypeScript and development tools

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your details:

```env
# Your wallet private key (NEVER commit this!)
PRIVATE_KEY=0xyour_private_key_here

# Sepolia RPC URL (get from Infura or Alchemy)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Etherscan API key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**⚠️ Security Warning**: Never commit your `.env` file or share your private key!

### Step 3: Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 15 Solidity files successfully
```

This generates:
- `artifacts/` - Compiled contract artifacts
- `typechain/` - TypeScript types
- `cache/` - Build cache

### Step 4: Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

Expected output:
```
Deploying ConfidentialPrediction with account: 0x...
✅ ConfidentialPrediction deployed to: 0xYourContractAddress
```

**📝 IMPORTANT**: Save the deployed contract address! You'll need it for the frontend.

### Step 5: Verify Contract (Optional)

```bash
npm run verify:sepolia
```

This makes your contract source code publicly visible on Etherscan.

---

## 🎨 Part 2: Frontend Setup

### Step 6: Install Frontend Dependencies

```bash
cd prediction-frontend
npm install
```

This will install:
- Next.js 15
- React 19
- FHEVM Relayer SDK
- Privy authentication
- Tailwind CSS

### Step 7: Get Privy App ID

1. Go to [privy.io](https://privy.io/)
2. Sign up / Log in
3. Create a new app
4. Copy your **App ID**
5. Configure:
   - **Allowed origins**: `http://localhost:3000`
   - **Networks**: Enable Sepolia
   - **Login methods**: Enable wallet connection

### Step 8: Configure Frontend Environment

Create `.env.local` in the `prediction-frontend/` directory:

```bash
cd prediction-frontend
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Contract address from deployment (Step 4)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Network configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Privy App ID from Step 7
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

### Step 9: Start Development Server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.5s
```

### Step 10: Open in Browser

Navigate to: **http://localhost:3000**

You should see the landing page with:
- "Confidential Prediction Market" header
- Feature cards explaining the platform
- "Connect Wallet" button

---

## ✅ Verification Checklist

Test each feature to ensure everything works:

### 1. Wallet Connection
- [ ] Click "Connect Wallet"
- [ ] Privy modal opens
- [ ] Connect with MetaMask
- [ ] Wallet address shows in navbar

### 2. Create Market
- [ ] Navigate to `/create`
- [ ] Fill in question and description
- [ ] Set duration
- [ ] Submit transaction
- [ ] Transaction confirms
- [ ] Redirected to markets page

### 3. Browse Markets
- [ ] Navigate to `/markets`
- [ ] See created market in list
- [ ] Click on market card
- [ ] Market details page loads

### 4. Make Prediction
- [ ] On market detail page
- [ ] Select YES or NO
- [ ] Click "Submit Prediction"
- [ ] Encryption happens
- [ ] Transaction confirms
- [ ] "Already predicted" message shows

### 5. Resolve Market (Creator Only)
- [ ] Wait for deadline to pass
- [ ] Go to market as creator
- [ ] See "Resolve Market" section
- [ ] Click "Resolve as YES" or "Resolve as NO"
- [ ] Transaction confirms

### 6. Decrypt Prediction
- [ ] Go to market you predicted on
- [ ] Click "Decrypt My Prediction"
- [ ] Transaction confirms
- [ ] Wait ~5-10 seconds
- [ ] Click again to view
- [ ] See your prediction
- [ ] See if you were correct (if resolved)

### 7. My Predictions
- [ ] Navigate to `/my-predictions`
- [ ] See list of markets you predicted on
- [ ] Click to view details
- [ ] Stats show correctly

---

## 🐛 Common Issues & Solutions

### Issue: "FHEVM not initialized"
**Solution**: Make sure FHEVM SDK loads properly. Check browser console for errors. Try refreshing the page.

### Issue: "Wallet not connected"
**Solution**: Disconnect and reconnect wallet. Make sure MetaMask is on Sepolia network.

### Issue: Transaction fails with "execution reverted"
**Possible causes**:
- Not enough Sepolia ETH for gas
- Deadline already passed (for predictions)
- Already made prediction on this market
- Not the market creator (for resolution)

### Issue: Contract not found
**Solution**:
1. Check contract address in `.env.local`
2. Make sure you're on Sepolia network
3. Verify contract deployed successfully

### Issue: Privy authentication fails
**Solution**:
1. Check App ID is correct
2. Make sure `http://localhost:3000` is in allowed origins
3. Clear browser cache and try again

### Issue: Decryption stuck in "Processing"
**Solution**:
- Wait 10-30 seconds for callback
- Refresh page and try again
- Check if gateway is responding (network tab)

---

## 🔄 Development Workflow

### Making Changes to Smart Contracts

1. Edit contract files in `contracts/`
2. Recompile: `npm run compile`
3. Redeploy: `npm run deploy:sepolia`
4. Update contract address in frontend `.env.local`
5. Restart frontend dev server

### Making Changes to Frontend

Hot reload is enabled! Just save files and see changes instantly.

For new pages:
- Add to `app/` directory
- Update navigation in `components/Navigation.tsx`

### Testing

```bash
# Test contracts (when you add tests)
npm test

# Lint frontend code
cd prediction-frontend
npm run lint
```

---

## 📦 Building for Production

### Build Frontend

```bash
cd prediction-frontend
npm run build
```

### Deploy Frontend

Deploy to:
- **Vercel**: Push to GitHub, connect repository
- **Netlify**: Drag & drop build folder
- **IPFS**: Use `ipfs add -r out/`

Update Privy allowed origins with your production domain!

---

## 🎉 You're All Set!

Your Confidential Prediction Market DApp is now fully functional!

### What's Next?

1. **Customize the UI**: Edit Tailwind classes for your brand
2. **Add Features**: More market types, comments, etc.
3. **Test Thoroughly**: Try different scenarios
4. **Deploy to Mainnet**: When ready, deploy to a production network

### Need Help?

- Check `PROJECT_SUMMARY.md` for architecture details
- Review `README.md` for feature explanations
- Look at inline code comments
- Check Zama FHEVM docs: https://docs.zama.ai/fhevm

Happy predicting! 🔮
