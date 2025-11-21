const hre = require("hardhat");

async function main() {
  const contractAddress = "0x7f52a620456688B45735AB40337Bf1F4511F1f6b";
  const userAddress = "0x1b66CEA12f45794e8454F3a1A30dDBF03f377519";
  const marketId = 0;

  const contract = await hre.ethers.getContractAt("ConfidentialPrediction", contractAddress);

  console.log("🔍 Checking market and user status...\n");

  const market = await contract.getMarket(marketId);
  console.log("Market", marketId, ":");
  console.log("  Question:", market[1]);
  console.log("  Deadline:", new Date(Number(market[3]) * 1000).toISOString());
  console.log("  Resolved:", market[5]);
  console.log("  Cancelled:", market[4] === 3n);

  const hasPredicted = await contract.checkHasPrediction(marketId, userAddress);
  console.log("\nUser", userAddress);
  console.log("  Has predicted:", hasPredicted);

  const now = Math.floor(Date.now() / 1000);
  const deadline = Number(market[3]);
  console.log("\nTime check:");
  console.log("  Current time:", new Date(now * 1000).toISOString());
  console.log("  Market ended:", now > deadline);
}

main().catch(console.error);
