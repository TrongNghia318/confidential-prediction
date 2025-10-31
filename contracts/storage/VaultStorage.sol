// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "../struct/CommonStruct.sol";
import "../struct/VaultStruct.sol";

contract VaultStorage {
    address public predictionContract;

    // Encrypted balances
    mapping(address => euint64) public encryptedBalances;

    // Per-market locked amounts
    mapping(address => mapping(uint16 => euint64)) public lockedYesBets;
    mapping(address => mapping(uint16 => euint64)) public lockedNoBets;

    // Total locked per user
    mapping(address => euint64) public totalLocked;

    // Available balance decryption
    mapping(address => CommonStruct.Uint64ResultWithExp) public decryptedAvailableBalance;
    mapping(address => CommonStruct.DecryptStatus) public availableBalanceStatus;
    mapping(uint256 => VaultStruct.WithdrawalRequest) public withdrawalRequests;
}
