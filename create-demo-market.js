const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Quick script to create a demo market
 *
 * Usage:
 *   npx hardhat run create-demo-market.js --network sepolia
 *
 * Customize:
 *   DURATION_MINUTES=5 npx hardhat run create-demo-market.js --network sepolia
 *   QUESTION="Will BTC reach $100k?" DURATION_MINUTES=10 npx hardhat run create-demo-market.js --network sepolia
 */

async function main() {
  const config = {
    contractAddress: "0x7407B9C63793546d97CD41A23bf4C461CC0ADC95",
    question: process.env.QUESTION || "Will the demo go smoothly?",
    description: process.env.DESCRIPTION || "A quick prediction market for demo purposes",
    durationMinutes: parseInt(process.env.DURATION_MINUTES || "3"),
  };

  // Convert minutes to seconds
  const durationSeconds = config.durationMinutes * 60;

  console.log("=".repeat(60));
  console.log("🎬 CREATING DEMO MARKET FOR VIDEO");
  console.log("=".repeat(60));
  console.log("\n📋 Configuration:");
  console.log(`  Contract Address: ${config.contractAddress}`);
  console.log(`  Network: ${hre.network.name}`);
  console.log(`  Question: "${config.question}"`);
  console.log(`  Description: "${config.description}"`);
  console.log(`  Duration: ${config.durationMinutes} minute(s) (${durationSeconds} seconds)`);
  console.log();

  // Get the signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Creator: ${signer.address}`);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);
  console.log();

  // Connect to the contract
  const contract = await hre.ethers.getContractAt("ConfidentialPrediction", config.contractAddress);

  // Create the market
  console.log("📝 Creating market...");
  const tx = await contract.createMarket(
    config.question,
    config.description,
    durationSeconds
  );

  console.log(`⏳ Transaction submitted: ${tx.hash}`);
  console.log("   Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
  console.log();

  // Extract market ID from the MarketCreated event
  const marketCreatedEvent = receipt.logs.find(
    log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === "MarketCreated";
      } catch {
        return false;
      }
    }
  );

  if (!marketCreatedEvent) {
    console.error("❌ Could not find MarketCreated event in transaction logs");
    process.exit(1);
  }

  const parsedEvent = contract.interface.parseLog(marketCreatedEvent);
  const marketId = parsedEvent.args.marketId;

  // Calculate deadline
  const currentBlock = await hre.ethers.provider.getBlock(receipt.blockNumber);
  const deadline = currentBlock.timestamp + durationSeconds;

  // Save market ID to file for easy access by resolve script
  const marketDataPath = path.join(__dirname, ".last-demo-market.json");
  const marketData = {
    marketId: marketId.toString(),
    contractAddress: config.contractAddress,
    network: hre.network.name,
    question: config.question,
    createdAt: Date.now(),
    deadline: deadline * 1000
  };

  fs.writeFileSync(marketDataPath, JSON.stringify(marketData, null, 2));
  console.log(`💾 Market ID saved to .last-demo-market.json`);
  console.log();

  console.log("=".repeat(60));
  console.log("🎉 MARKET CREATED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log();
  console.log(`📊 Market ID: ${marketId}`);
  console.log(`❓ Question: "${config.question}"`);

  const deadlineDate = new Date(deadline * 1000);

  console.log(`⏰ Created at: ${new Date(currentBlock.timestamp * 1000).toLocaleString()}`);
  console.log(`⌛ Deadline: ${deadlineDate.toLocaleString()}`);
  console.log(`⏱️  Time remaining: ${config.durationMinutes} minute(s)`);
  console.log();

  console.log("=".repeat(60));
  console.log("📌 NEXT STEPS:");
  console.log("=".repeat(60));
  console.log();
  console.log(`1. Users can make predictions via the frontend`);
  console.log();
  console.log(`2. After ${config.durationMinutes} minute(s), resolve the market (outcome: YES/NO)`);
  console.log();
  console.log(`3. Users can then view their results`);
  console.log();

  console.log("=".repeat(60));
  console.log("⚡ QUICK REFERENCE:");
  console.log("=".repeat(60));
  console.log(`Market ID: ${marketId}`);
  console.log(`Contract: ${config.contractAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deadline: ${deadlineDate.toLocaleTimeString()}`);
  console.log("=".repeat(60));
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error();
    console.error("❌ ERROR:", error.message);
    console.error();
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
