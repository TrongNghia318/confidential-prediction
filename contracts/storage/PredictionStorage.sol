// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "../struct/CommonStruct.sol";
import "../struct/PredictionStruct.sol";

contract PredictionStorage {
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

    // Total predictions decryption (after resolution)
    mapping(uint16 => CommonStruct.Uint64ResultWithExp) public decryptedTotalYes;
    mapping(uint16 => CommonStruct.Uint64ResultWithExp) public decryptedTotalNo;
    mapping(uint16 => CommonStruct.DecryptStatus) public decryptTotalYesStatus;
    mapping(uint16 => CommonStruct.DecryptStatus) public decryptTotalNoStatus;

    // Decryption request tracking
    mapping(uint256 => PredictionStruct.DecryptPredictionRequest) public decryptPredictionRequest;
    mapping(uint256 => PredictionStruct.DecryptTotalRequest) public decryptTotalRequest;
}
