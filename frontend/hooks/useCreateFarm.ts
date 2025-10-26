import { AGRIYIELD_CONTRACT_ABI } from "@/const/abi";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { parseUnits } from "viem";

interface CreateFarmParams {
  name: string;
  description: string;
  fundingGoal: string; // in USDT (e.g., "25000")
  sharePrice: string; // in USDT (e.g., "250")
  maxSupply: string; // number of shares (e.g., "100")
  metaCID: string; // IPFS CID for metadata
  deadline: number; // Unix timestamp
  minROI: number; // percentage (e.g., 10)
  maxROI: number; // percentage (e.g., 25)
}

export const useCreateFarm = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(
    async (farmData: CreateFarmParams) => {
      if (!address || !walletClient) {
        toast.error("Not Connected", {
          description: "Please connect your wallet",
        });
        return null;
      }

      const contractAddress =
        process.env.NEXT_PUBLIC_AGRIYIELD_CONTRACT_ADDRESS;

      if (!contractAddress) {
        toast.error("Contract address not set");
        return null;
      }

      if (!publicClient) {
        toast.error("Public client not available");
        return null;
      }

      // Validate inputs
      if (!farmData.name || !farmData.description) {
        toast.error("Invalid input", {
          description: "Name and description are required",
        });
        return null;
      }

      if (farmData.minROI >= farmData.maxROI || farmData.maxROI > 100) {
        toast.error("Invalid ROI range", {
          description: "minROI must be < maxROI, and maxROI must be <= 100",
        });
        return null;
      }

      if (farmData.deadline <= Math.floor(Date.now() / 1000)) {
        toast.error("Invalid deadline", {
          description: "Deadline must be in the future",
        });
        return null;
      }

      let createFarmHash;

      try {
        toast.loading("Creating farm campaign...", { id: "createFarm" });

        // Convert to wei/smallest unit
        // Check your MockUSDT decimals - adjust if needed
        const fundingGoalWei = parseUnits(farmData.fundingGoal, 18); // Change to 6 if USDT has 6 decimals
        const sharePriceWei = parseUnits(farmData.sharePrice, 18);
        const maxSupplyBigInt = BigInt(farmData.maxSupply);

        // Validate: fundingGoal = sharePrice * maxSupply
        const expectedFunding = sharePriceWei * maxSupplyBigInt;
        if (fundingGoalWei !== expectedFunding) {
          toast.error("Inconsistent parameters", {
            description: "Funding goal must equal share price × max supply",
            id: "createFarm",
          });
          return null;
        }

        console.log("Creating farm with params:", {
          name: farmData.name,
          fundingGoal: fundingGoalWei.toString(),
          sharePrice: sharePriceWei.toString(),
          maxSupply: maxSupplyBigInt.toString(),
          deadline: farmData.deadline,
          minROI: farmData.minROI,
          maxROI: farmData.maxROI,
        });

        // Create farm transaction
        createFarmHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: AGRIYIELD_CONTRACT_ABI,
          functionName: "createFarm",
          args: [
            farmData.name,
            farmData.description,
            fundingGoalWei,
            sharePriceWei,
            maxSupplyBigInt,
            farmData.metaCID,
            BigInt(farmData.deadline),
            BigInt(farmData.minROI),
            BigInt(farmData.maxROI),
          ],
        });

        console.log("✅ Transaction submitted:", createFarmHash);

        toast.loading("Waiting for confirmation...", { id: "createFarm" });

        // Wait for transaction confirmation
        const createFarmReceipt = await publicClient.waitForTransactionReceipt({
          hash: createFarmHash,
        });

        console.log("✅ Transaction confirmed:", createFarmReceipt);

        if (createFarmReceipt.status === "success") {
          toast.success("Farm created successfully! 🌾", {
            description: "Your farm campaign is now live",
            id: "createFarm",
          });

          return {
            receipt: createFarmReceipt,
            hash: createFarmHash,
          };
        } else {
          toast.error("Farm creation failed", {
            description: "Transaction failed on-chain",
            id: "createFarm",
          });
          return null;
        }
      } catch (error: any) {
        console.error("❌ Create farm error:", error);
        console.error("Error details:", {
          message: error.message,
          shortMessage: error.shortMessage,
          cause: error.cause,
        });

        // Handle specific errors from contract
        if (
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied")
        ) {
          toast.error("Transaction rejected", {
            description: "You cancelled the transaction",
            id: "createFarm",
          });
        } else if (error.message?.includes("invalid args")) {
          toast.error("Invalid arguments", {
            description: "Check funding goal, share price, and max supply",
            id: "createFarm",
          });
        } else if (error.message?.includes("inconsistent params")) {
          toast.error("Inconsistent parameters", {
            description: "Funding goal must equal sharePrice × maxSupply",
            id: "createFarm",
          });
        } else if (error.message?.includes("invalid deadline")) {
          toast.error("Invalid deadline", {
            description: "Deadline must be in the future",
            id: "createFarm",
          });
        } else if (error.message?.includes("invalid ROI range")) {
          toast.error("Invalid ROI range", {
            description: "minROI must be < maxROI, maxROI <= 100",
            id: "createFarm",
          });
        } else if (error.message?.includes("insufficient funds")) {
          toast.error("Insufficient funds", {
            description: "You don't have enough funds for gas",
            id: "createFarm",
          });
        } else if (error.shortMessage) {
          toast.error("Transaction failed", {
            description: error.shortMessage,
            id: "createFarm",
          });
        } else {
          toast.error("Transaction failed", {
            description: "Something went wrong. Check console for details.",
            id: "createFarm",
          });
        }

        return null;
      }
    },
    [address, walletClient, publicClient, writeContractAsync]
  );
};
