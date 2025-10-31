// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVaultEvents {
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event FundsLocked(address indexed user, uint16 indexed marketId, bool isYesBet);
    event FundsUnlocked(address indexed user, uint16 indexed marketId);
    event WinningsDistributed(
        address indexed user,
        uint16 indexed marketId,
        uint256 amount
    );
    event WithdrawalDecryptionRequested(address indexed user, uint256 requestId);
}
