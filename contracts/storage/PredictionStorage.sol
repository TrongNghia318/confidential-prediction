// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "../struct/CommonStruct.sol";
import "../struct/PredictionStruct.sol";

contract PredictionStorage {
    uint256 public cacheTimeout = 600; // 10 minutes cache timeout for decrypted values
    uint16 public marketCount;

    mapping(uint16 => PredictionStruct.Market) public markets;

    // User encrypted predictions: marketId => user => encrypted bool (true = YES, false = NO)
    mapping(uint16 => mapping(address => ebool)) public encryptedPredictions;

    // Track if user has made a prediction
    mapping(uint16 => mapping(address => bool)) public hasPrediction;

    // Market participants
    mapping(uint16 => address[]) public predictors;

    // Decrypted predictions cache
    mapping(uint16 => mapping(address => CommonStruct.BoolResultWithExp))
        public decryptedPredictions;

    // Decryption status tracking
    mapping(uint16 => mapping(address => CommonStruct.DecryptStatus))
        public decryptPredictionStatus;
}
