import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH\n");

  // 1️⃣ Deploy MockUSDT
  console.log("Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("MockUSDT deployed to:", mockUSDTAddress);

  // 2️⃣ Deploy FarmShares
  console.log("Deploying FarmShares...");
  const FarmShares = await ethers.getContractFactory("FarmShares");
  const farmShares = await FarmShares.deploy();
  await farmShares.waitForDeployment();
  const farmSharesAddress = await farmShares.getAddress();
  console.log("FarmShares deployed to:", farmSharesAddress);

  // 3️⃣ Deploy AgriYield (requires FarmShares, MockUSDT, and admin)
  console.log("Deploying AgriYield...");
  const AgriYield = await ethers.getContractFactory("AgriYield");
  const agriYield = await AgriYield.deploy(farmSharesAddress, mockUSDTAddress, deployer.address);
  await agriYield.waitForDeployment();
  const agriYieldAddress = await agriYield.getAddress();
  console.log("AgriYield deployed to:", agriYieldAddress);

  // 🔗 Link FarmShares to AgriYield
  console.log("Linking FarmShares to AgriYield...");
  const linkTx = await farmShares.setAgriYield(agriYieldAddress);
  await linkTx.wait();
  console.log("FarmShares linked to AgriYield");

  // 4️⃣ Deploy Marketplace (requires MockUSDT, AgriYield, and admin)
  console.log("Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(mockUSDTAddress, agriYieldAddress, deployer.address, deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  console.log("Deployment Summary:");
  console.log("--------------------------------------------");
  console.log("MockUSDT:   ", mockUSDTAddress);
  console.log("FarmShares: ", farmSharesAddress);
  console.log("AgriYield:  ", agriYieldAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("--------------------------------------------");
}

// Execute the script
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
