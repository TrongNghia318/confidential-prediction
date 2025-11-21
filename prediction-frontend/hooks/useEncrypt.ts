import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useFhevm } from "../contexts/FhevmContext";
import { CONTRACT_ADDRESS } from "../lib/contracts/config";

interface EncryptedData {
  encryptedData: Uint8Array;
  proof: Uint8Array;
}

export const useEncrypt = () => {
  const { instance, isInitialized } = useFhevm();
  const { user } = usePrivy();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encryptBool = useCallback(
    async (value: boolean): Promise<EncryptedData> => {
      if (!isInitialized || !instance) {
        throw new Error("FHEVM not initialized");
      }

      const userAddress = user?.wallet?.address;
      if (!userAddress) {
        throw new Error("Wallet not connected");
      }

      setIsEncrypting(true);
      setError(null);

      try {
        console.log("🔐 Creating encrypted input with:");
        console.log("  - Contract:", CONTRACT_ADDRESS);
        console.log("  - User:", userAddress);
        console.log("  - FHEVM config:", instance.config);

        const input = instance.createEncryptedInput(
          CONTRACT_ADDRESS,
          userAddress
        );

        input.addBool(value);

        const encryptedInput = await input.encrypt();

        console.log("🔍 Encryption result structure:", {
          handles: encryptedInput.handles,
          inputProof: encryptedInput.inputProof,
          allKeys: Object.keys(encryptedInput)
        });

        if (!encryptedInput.handles?.[0] || !encryptedInput.inputProof) {
          console.error("❌ Invalid encryption result:", encryptedInput);
          throw new Error("Invalid encryption result");
        }

        console.log("✅ Encryption successful");
        console.log("  - Encrypted data:", encryptedInput.handles[0]);
        console.log("  - Proof:", encryptedInput.inputProof);

        return {
          encryptedData: encryptedInput.handles[0],
          proof: encryptedInput.inputProof,
        };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Encryption failed";
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsEncrypting(false);
      }
    },
    [instance, isInitialized, user]
  );

  return { encryptBool, isEncrypting, error };
};
