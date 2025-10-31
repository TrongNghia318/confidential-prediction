// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPredictionErrors {
    error OnlyCreator();
    error InvalidDeadline();
    error EmptyQuestion();
    error MarketNotExist();
    error MarketEnded();
    error MarketStillActive();
    error AlreadyResolved();
    error AlreadyCancelled();
    error MarketNotResolved();
    error AlreadyPredicted();
    error PredictionNotDecrypted();
    error DecryptAlreadyInProgress();
    error DataProcessing();
    error CacheExpired();
    error NoPredictionFound();
    error InvalidOutcome();
    error TotalsNotDecrypted();
}
