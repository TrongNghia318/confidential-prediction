"use client";

import { useState, useCallback, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { BrowserProvider } from "ethers";
import { Contract } from "ethers";
import { PREDICTION_ABI } from "../lib/contracts/abi";
import { CONTRACT_ADDRESS } from "../lib/contracts/config";

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

  const getReadOnlyContract = useCallback(async () => {
    if (!wallets[0]) {
      throw new Error("No wallet available");
    }

    const wallet = wallets[0];
    const provider = await wallet.getEthereumProvider();
    const ethersProvider = new BrowserProvider(provider);

    return new Contract(CONTRACT_ADDRESS, PREDICTION_ABI, ethersProvider);
  }, [wallets]);

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

        console.log("Submitting prediction for market:", marketId);

        const tx = await contract.predict(marketId, encryptedData, proof);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        return { success: true, txHash: tx.hash };
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
        const contract = await getReadOnlyContract();
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
      const contract = await getReadOnlyContract();
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
        const contract = await getReadOnlyContract();
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
        const contract = await getReadOnlyContract();
        const result = await contract.getMyPrediction(marketId);

        return {
          prediction: result[0], // bool: true = YES, false = NO
          wasCorrect: result[1], // bool
          isResolved: result[2], // bool
        };
      } catch (err: any) {
        console.error("Get my prediction error:", err);
        throw new Error(err?.reason || err?.message || "Failed to get prediction");
      }
    },
    [getReadOnlyContract]
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
  };
};
