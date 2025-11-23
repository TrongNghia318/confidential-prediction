"use client";

import { useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { BrowserProvider, JsonRpcProvider } from "ethers";
import { Contract } from "ethers";
import { PREDICTION_ABI } from "../lib/contracts/abi";
import { CONTRACT_ADDRESS, RPC_URL } from "../lib/contracts/config";
import { useDecrypt } from "./useDecrypt";
import { toHex } from "viem";

export interface Market {
  id: number;
  creator: string;
  question: string;
  description: string;
  deadline: number;
  outcome: number; // 0=PENDING, 1=YES, 2=NO, 3=CANCELLED
  resolved: boolean;
  totalPredictors: number;
}

export const usePredictions = () => {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { publicDecrypt } = useDecrypt();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async () => {
    if (!authenticated || !wallets[0]) {
      throw new Error("Wallet not connected");
    }

    const wallet = wallets[0];
    const provider = await wallet.getEthereumProvider();
    const ethersProvider = new BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    return new Contract(CONTRACT_ADDRESS, PREDICTION_ABI, signer);
  }, [authenticated, wallets]);

  const getReadOnlyContract = useCallback(() => {
    // Use public RPC for read-only operations (no wallet needed)
    const provider = new JsonRpcProvider(RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");
    return new Contract(CONTRACT_ADDRESS, PREDICTION_ABI, provider);
  }, []);

  const createMarket = useCallback(
    async (question: string, description: string, durationInDays: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = await getContract();
        const durationInSeconds = durationInDays * 24 * 60 * 60;

        console.log("Creating market:", { question, description, durationInDays });

        const tx = await contract.createMarket(question, description, durationInSeconds);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        // Extract market ID from events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === "MarketCreated";
          } catch {
            return false;
          }
        });

        let marketId = null;
        if (event) {
          const parsed = contract.interface.parseLog(event);
          marketId = parsed?.args?.marketId;
        }

        return { success: true, marketId: marketId?.toString(), txHash: tx.hash };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Create market error:", err);
        const errorMsg = err?.reason || err?.message || "Failed to create market";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const submitPrediction = useCallback(
    async (marketId: number, encryptedData: Uint8Array, proof: Uint8Array) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = await getContract();

        // Convert Uint8Array to hex format for the contract
        const encryptedDataHex = toHex(encryptedData);
        const proofHex = toHex(proof);

        console.log("Submitting prediction for market:", marketId);
        console.log("  - Encrypted data (hex):", encryptedDataHex);
        console.log("  - Proof (hex):", proofHex);

        const tx = await contract.predict(marketId, encryptedDataHex, proofHex);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        return { success: true, txHash: tx.hash };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Submit prediction error:", err);
        const errorMsg = err?.reason || err?.message || "Failed to submit prediction";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const resolveMarket = useCallback(
    async (marketId: number, outcome: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = await getContract();

        console.log("Resolving market:", marketId, "with outcome:", outcome);

        const tx = await contract.resolveMarket(marketId, outcome);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        return { success: true, txHash: tx.hash };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Resolve market error:", err);
        const errorMsg = err?.reason || err?.message || "Failed to resolve market";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const cancelMarket = useCallback(
    async (marketId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = await getContract();

        console.log("Cancelling market:", marketId);

        const tx = await contract.cancelMarket(marketId);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        return { success: true, txHash: tx.hash };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Cancel market error:", err);
        const errorMsg = err?.reason || err?.message || "Failed to cancel market";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const requestDecryption = useCallback(
    async (marketId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = await getContract();

        console.log("Requesting decryption for market:", marketId);

        const tx = await contract.requestMyPredictionDecryption(marketId);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        return { success: true, txHash: tx.hash };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Request decryption error:", err);
        const errorMsg = err?.reason || err?.message || "Failed to request decryption";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const getMarket = useCallback(
    async (marketId: number): Promise<Market | null> => {
      try {
        const contract = getReadOnlyContract();
        const result = await contract.getMarket(marketId);

        return {
          id: marketId,
          creator: result[0],
          question: result[1],
          description: result[2],
          deadline: Number(result[3]),
          outcome: Number(result[4]),
          resolved: result[5],
          totalPredictors: Number(result[6]),
        };
      } catch (err) {
        console.error("Get market error:", err);
        return null;
      }
    },
    [getReadOnlyContract]
  );

  const getMarketCount = useCallback(async (): Promise<number> => {
    try {
      const contract = getReadOnlyContract();
      const count = await contract.marketCount();
      return Number(count);
    } catch (err) {
      console.error("Get market count error:", err);
      return 0;
    }
  }, [getReadOnlyContract]);

  const getAllMarkets = useCallback(async (): Promise<Market[]> => {
    try {
      const count = await getMarketCount();
      const markets: Market[] = [];

      for (let i = 0; i < count; i++) {
        const market = await getMarket(i);
        if (market) {
          markets.push(market);
        }
      }

      return markets;
    } catch (err) {
      console.error("Get all markets error:", err);
      return [];
    }
  }, [getMarketCount, getMarket]);

  const checkHasPrediction = useCallback(
    async (marketId: number, userAddress: string): Promise<boolean> => {
      try {
        const contract = getReadOnlyContract();
        return await contract.checkHasPrediction(marketId, userAddress);
      } catch (err) {
        console.error("Check has prediction error:", err);
        return false;
      }
    },
    [getReadOnlyContract]
  );

  const getMyPrediction = useCallback(
    async (marketId: number) => {
      try {
        // Must use getContract() (with signer) because getMyPrediction() uses msg.sender
        const contract = await getContract();
        const result = await contract.getMyPrediction(marketId);

        return {
          prediction: result[0], // bool: true = YES, false = NO
          wasCorrect: result[1], // bool
          isResolved: result[2], // bool
        };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Get my prediction error:", err);
        throw new Error(err?.reason || err?.message || "Failed to get prediction");
      }
    },
    [getContract]
  );

  /**
   * v0.9 Self-Relaying: Get encrypted prediction handle
   */
  const getEncryptedPredictionHandle = useCallback(
    async (marketId: number, userAddress: string): Promise<string> => {
      try {
        const contract = getReadOnlyContract();
        const handle = await contract.getEncryptedPredictionHandle(marketId, userAddress);
        return handle;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Get encrypted handle error:", err);
        throw new Error(err?.reason || err?.message || "Failed to get encrypted handle");
      }
    },
    [getReadOnlyContract]
  );

  /**
   * v0.9 Self-Relaying: Submit decryption proof
   */
  const submitMyPredictionDecryption = useCallback(
    async (marketId: number, cleartextPrediction: boolean, proof: Uint8Array) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = await getContract();

        console.log("📤 Submitting prediction decryption proof...");
        console.log("  - Market ID:", marketId);
        console.log("  - Cleartext:", cleartextPrediction);
        console.log("  - Proof length:", proof.length);

        const tx = await contract.submitMyPredictionDecryption(
          marketId,
          cleartextPrediction,
          toHex(proof)
        );
        console.log("Transaction sent:", tx.hash);

        await tx.wait();
        console.log("✅ Proof verified and cached on-chain!");

        return { success: true, txHash: tx.hash };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Submit proof error:", err);
        const errorMsg = err?.reason || err?.message || "Failed to submit proof";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  /**
   * v0.9 Self-Relaying: Complete decryption workflow
   * Performs all 4 steps:
   * 1. Mark as publicly decryptable (on-chain) - SKIPPED if already PROCESSING
   * 2. Get encrypted handle (on-chain read)
   * 3. Decrypt via SDK (off-chain)
   * 4. Submit proof to contract (on-chain verification)
   */
  const completeMyPredictionDecryption = useCallback(
    async (marketId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!user?.wallet?.address) {
          throw new Error("Wallet not connected");
        }

        // Check current decryption status first
        const contract = getReadOnlyContract();
        const [status, cachedPrediction] = await contract.getPredictionStatus(marketId, user.wallet.address);
        const decryptStatus = Number(status); // 0=IDLE, 1=PROCESSING, 2=DECRYPTED
        console.log("Current decryption status:", decryptStatus);

        // Step 1: Mark as publicly decryptable (skip if already PROCESSING/DECRYPTED)
        if (decryptStatus === 0) {
          // IDLE - need to call requestDecryption
          console.log("📝 Step 1: Marking prediction as publicly decryptable...");
          const requestResult = await requestDecryption(marketId);
          if (!requestResult.success) {
            throw new Error(requestResult.error || "Failed to request decryption");
          }
        } else if (decryptStatus === 1) {
          // PROCESSING - skip step 1, continue with steps 2-4
          console.log("⏭️  Step 1: Skipped (already marked as decryptable)");
        } else if (decryptStatus === 2) {
          // DECRYPTED - return cached value
          console.log("✅ Already decrypted, using cached value:", cachedPrediction ? "YES" : "NO");
          return { success: true, prediction: cachedPrediction };
        }

        // Step 2: Get encrypted handle
        console.log("🔍 Step 2: Getting encrypted prediction handle...");
        const handle = await getEncryptedPredictionHandle(marketId, user.wallet.address);
        console.log("  - Handle:", handle);

        // Step 3: Decrypt using relayer SDK
        console.log("🔓 Step 3: Decrypting prediction with relayer SDK...");
        const { cleartext, proof } = await publicDecrypt(handle);
        const predictionBool = cleartext !== BigInt(0);
        console.log("  - Decrypted prediction:", predictionBool ? "YES" : "NO");

        // Step 4: Submit proof to contract
        console.log("📤 Step 4: Submitting proof to contract...");
        const submitResult = await submitMyPredictionDecryption(marketId, predictionBool, proof);
        if (!submitResult.success) {
          throw new Error(submitResult.error || "Failed to submit proof");
        }

        console.log("✅ Complete decryption workflow successful!");
        return {
          success: true,
          prediction: predictionBool,
          txHash: submitResult.txHash,
        };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("❌ Complete decryption workflow failed:", err);
        const errorMsg = err?.message || "Decryption workflow failed";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [user, requestDecryption, getEncryptedPredictionHandle, publicDecrypt, submitMyPredictionDecryption, getReadOnlyContract]
  );

  return {
    isLoading,
    error,
    createMarket,
    submitPrediction,
    resolveMarket,
    cancelMarket,
    requestDecryption,
    getMarket,
    getMarketCount,
    getAllMarkets,
    checkHasPrediction,
    getMyPrediction,
    // v0.9 self-relaying methods
    getEncryptedPredictionHandle,
    submitMyPredictionDecryption,
    completeMyPredictionDecryption,
  };
};
