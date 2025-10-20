import { MARKETPLACE_CONTRACT_ABI } from "@/const/abi";
import React, { useCallback } from "react";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";

export const usePurchase = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(
    async (amount: number) => {
      if (!address || !walletClient) {
        toast.error("Not Connected", {
          description: "Please, connect wallet",
        });
        return;
      }

      const contractAddress =
        process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;

      if (!contractAddress) {
        toast.error("Contract address not set");
        return;
      }

      if (!publicClient) {
        toast.error("Public client not available");
        return;
      }

      try {

        // Stake tokens
        const purchaseHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: MARKETPLACE_CONTRACT_ABI,
          functionName: "purchase",
          args: [amount],
        });

        console.log("Stake txHash: ", purchaseHash);

        // Wait for stake transaction
        const purchaseReceipt = await publicClient.waitForTransactionReceipt({
          hash: purchaseHash,
        });

        if (purchaseReceipt.status === "success") {
          toast.success("Staking successful", {
            description: "You have successfully staked your tokens",
          });
        } else {
          toast.error("Staking failed", {
            description: "Staking transaction failed",
          });
        }
      } catch (error) {
        console.error("Staking error:", error);
        toast.error("Transaction failed", {
          description: "Something went wrong during staking",
        });
      }
    },
    [address, walletClient, publicClient, writeContractAsync]
  );
};