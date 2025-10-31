// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVaultErrors {
    error OnlyPredictionContract();
    error OnlyOwner();
    error PredictionContractAlreadySet();
    error InvalidDepositAmount();
    error DepositAmountTooLarge();
    error InvalidWithdrawalAmount();
    error InsufficientVaultBalance();
    error InsufficientAvailableBalance();
    error NoBalance();
    error UserHasNoBalance();
    error NoLockedAmount();
    error DecryptAlreadyInProgress();
    error MustDecryptFirst();
    error DecryptionProcessing();
    error DecryptionCacheExpired();
    error WithdrawalFailed();
}
