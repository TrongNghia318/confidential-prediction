// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "./interface/IDecryptionCallbacks.sol";
import "./interface/IPredictionEvents.sol";
import "./interface/IPredictionErrors.sol";
import "./storage/PredictionStorage.sol";
import "./interface/impl/DecryptionCallback.sol";

/**
 * @title ConfidentialPrediction
 * @notice A privacy-preserving prediction market using fully homomorphic encryption (FHEVM)
 * @dev This contract enables confidential prediction tracking where users can make predictions
 * on binary outcomes (Yes/No) while keeping their predictions completely private on-chain.
 * No betting or money involved - just tracking predictions confidentially.
 *
 * Key Features:
 * - Encrypted prediction storage using FHE
 * - Binary outcomes (Yes/No questions)
 * - Private predictions until user chooses to decrypt
 * - Creator can resolve markets after deadline
 * - Users can see if they predicted correctly after resolution
 */
contract ConfidentialPrediction is
    ZamaEthereumConfig,
    IPredictionEvents,
    IPredictionErrors,
    PredictionStorage,
    DecryptionCallbacks
{
    using FHE for ebool;
    using FHE for euint64;

    modifier onlyCreator(uint16 marketId) {
        if (msg.sender != markets[marketId].creator) {
            revert OnlyCreator();
        }
        _;
    }

    constructor() {}

    /**
     * @notice Creates a new prediction market
     * @param question The question to predict on (e.g., "Will it rain tomorrow?")
     * @param description Additional details about the market
     * @param duration The market duration in seconds
     * @return The newly created market ID
     */
    function createMarket(
        string calldata question,
        string calldata description,
        uint256 duration
    ) external returns (uint16) {
        if (duration == 0) {
            revert InvalidDeadline();
        }
        if (bytes(question).length == 0) {
            revert EmptyQuestion();
        }

        uint16 marketId = marketCount++;

        markets[marketId] = PredictionStruct.Market({
            creator: msg.sender,
            question: question,
            description: description,
            deadline: block.timestamp + duration,
            outcome: PredictionStruct.Outcome.PENDING,
            resolved: false
        });

        emit MarketCreated(
            marketId,
            msg.sender,
            question,
            block.timestamp + duration
        );

        return marketId;
    }

    /**
     * @notice Submit an encrypted prediction for a market
     * @param marketId The ID of the market
     * @param encryptedPrediction The encrypted prediction (true = YES, false = NO)
     * @param inputProof Zero-knowledge proof validating the encrypted input
     */
    function predict(
        uint16 marketId,
        externalEbool encryptedPrediction,
        bytes calldata inputProof
    ) external {
        if (marketId >= marketCount) {
            revert MarketNotExist();
        }

        PredictionStruct.Market storage market = markets[marketId];

        if (block.timestamp > market.deadline) {
            revert MarketEnded();
        }

        if (market.resolved) {
            revert AlreadyResolved();
        }

        if (market.outcome == PredictionStruct.Outcome.CANCELLED) {
            revert AlreadyCancelled();
        }

        if (hasPrediction[marketId][msg.sender]) {
            revert AlreadyPredicted();
        }

        ebool prediction = FHE.fromExternal(encryptedPrediction, inputProof);

        encryptedPredictions[marketId][msg.sender] = prediction;
        hasPrediction[marketId][msg.sender] = true;
        predictors[marketId].push(msg.sender);

        // Grant permissions
        FHE.allowThis(prediction);
        FHE.allow(prediction, msg.sender);

        emit PredictionMade(marketId, msg.sender);
    }

    /**
     * @notice Resolves a market with the actual outcome
     * @param marketId The ID of the market to resolve
     * @param outcome The actual outcome (YES or NO)
     */
    function resolveMarket(
        uint16 marketId,
        PredictionStruct.Outcome outcome
    ) external onlyCreator(marketId) {
        if (marketId >= marketCount) {
            revert MarketNotExist();
        }

        PredictionStruct.Market storage market = markets[marketId];

        if (block.timestamp < market.deadline) {
            revert MarketStillActive();
        }

        if (market.resolved) {
            revert AlreadyResolved();
        }

        if (market.outcome == PredictionStruct.Outcome.CANCELLED) {
            revert AlreadyCancelled();
        }

        if (outcome != PredictionStruct.Outcome.YES && outcome != PredictionStruct.Outcome.NO) {
            revert InvalidOutcome();
        }

        market.outcome = outcome;
        market.resolved = true;

        emit MarketResolved(marketId, outcome);
    }

    /**
     * @notice Cancels a market before it's resolved
     * @param marketId The ID of the market to cancel
     */
    function cancelMarket(uint16 marketId) external onlyCreator(marketId) {
        if (marketId >= marketCount) {
            revert MarketNotExist();
        }

        PredictionStruct.Market storage market = markets[marketId];

        if (market.resolved) {
            revert AlreadyResolved();
        }

        if (market.outcome == PredictionStruct.Outcome.CANCELLED) {
            revert AlreadyCancelled();
        }

        market.outcome = PredictionStruct.Outcome.CANCELLED;

        emit MarketCancelled(marketId);
    }

    /**
     * @notice Marks the caller's prediction as publicly decryptable (v0.9 self-relaying)
     * @dev After calling this, use the frontend relayer SDK's publicDecrypt() to get cleartext + proof,
     * then call submitMyPredictionDecryption() with the results to cache the decrypted value.
     * @param marketId The ID of the market
     */
    function requestMyPredictionDecryption(uint16 marketId) public {
        if (!hasPrediction[marketId][msg.sender]) {
            revert NoPredictionFound();
        }

        if (
            decryptPredictionStatus[marketId][msg.sender] ==
            CommonStruct.DecryptStatus.PROCESSING
        ) {
            revert DecryptAlreadyInProgress();
        }

        ebool userPrediction = encryptedPredictions[marketId][msg.sender];

        // Mark as publicly decryptable (v0.9 pattern)
        FHE.makePubliclyDecryptable(userPrediction);

        decryptPredictionStatus[marketId][msg.sender] = CommonStruct
            .DecryptStatus
            .PROCESSING;
    }

    /**
     * @notice Submits and verifies the decrypted prediction (v0.9 self-relaying)
     * @dev Called by the user after obtaining cleartext + proof via publicDecrypt() from the relayer SDK.
     * Verifies the proof and caches the decrypted value.
     * @param marketId The ID of the market
     * @param cleartextPrediction The decrypted prediction value (true = YES, false = NO)
     * @param proof The cryptographic proof from the relayer SDK
     */
    function submitMyPredictionDecryption(
        uint16 marketId,
        bool cleartextPrediction,
        bytes calldata proof
    ) public {
        ebool userPrediction = encryptedPredictions[marketId][msg.sender];
        if (!FHE.isInitialized(userPrediction)) {
            revert NoPredictionFound();
        }

        if (
            decryptPredictionStatus[marketId][msg.sender] !=
            CommonStruct.DecryptStatus.PROCESSING
        ) {
            revert DecryptAlreadyInProgress();
        }

        // Verify the decryption proof
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(userPrediction);
        bytes memory cleartexts = abi.encode(cleartextPrediction);
        FHE.checkSignatures(handles, cleartexts, proof);

        // Cache the decrypted value
        decryptedPredictions[marketId][msg.sender] = CommonStruct
            .BoolResultWithExp({
                data: cleartextPrediction,
                exp: block.timestamp + cacheTimeout
            });

        decryptPredictionStatus[marketId][msg.sender] = CommonStruct
            .DecryptStatus
            .DECRYPTED;
    }

    /**
     * @notice Gets the user's decrypted prediction and checks if they were correct
     * @param marketId The ID of the market
     * @return prediction The user's prediction (true = YES, false = NO)
     * @return wasCorrect Whether the prediction was correct
     * @return isResolved Whether the market has been resolved
     */
    function getMyPrediction(
        uint16 marketId
    ) external view returns (bool prediction, bool wasCorrect, bool isResolved) {
        CommonStruct.BoolResultWithExp
            memory decryptedWithExp = decryptedPredictions[marketId][msg.sender];

        prediction = decryptedWithExp.data;
        uint256 expTime = decryptedWithExp.exp;

        if (expTime == 0) {
            if (
                decryptPredictionStatus[marketId][msg.sender] ==
                CommonStruct.DecryptStatus.PROCESSING
            ) {
                revert DataProcessing();
            }
            revert PredictionNotDecrypted();
        }

        if (expTime < block.timestamp) {
            revert CacheExpired();
        }

        PredictionStruct.Market memory market = markets[marketId];
        isResolved = market.resolved;

        if (isResolved) {
            bool actualOutcome = (market.outcome == PredictionStruct.Outcome.YES);
            wasCorrect = (prediction == actualOutcome);
        }

        return (prediction, wasCorrect, isResolved);
    }

    /**
     * @notice Gets the decryption status of user's prediction
     * @param marketId The market ID
     * @param user The user address
     * @return status The decryption status
     * @return prediction The decrypted prediction (only valid if status is DECRYPTED)
     * @return cacheExpiry The cache expiry timestamp
     */
    function getPredictionStatus(
        uint16 marketId,
        address user
    )
        external
        view
        returns (
            CommonStruct.DecryptStatus status,
            bool prediction,
            uint256 cacheExpiry
        )
    {
        status = decryptPredictionStatus[marketId][user];
        CommonStruct.BoolResultWithExp
            memory decryptedWithExp = decryptedPredictions[marketId][user];

        prediction = decryptedWithExp.data;
        cacheExpiry = decryptedWithExp.exp;

        return (status, prediction, cacheExpiry);
    }

    /**
     * @notice Retrieves public market information
     * @param marketId The ID of the market
     */
    function getMarket(
        uint16 marketId
    )
        external
        view
        returns (
            address creator,
            string memory question,
            string memory description,
            uint256 deadline,
            PredictionStruct.Outcome outcome,
            bool resolved,
            uint256 totalPredictors
        )
    {
        if (marketId >= marketCount) {
            revert MarketNotExist();
        }

        PredictionStruct.Market memory market = markets[marketId];

        return (
            market.creator,
            market.question,
            market.description,
            market.deadline,
            market.outcome,
            market.resolved,
            predictors[marketId].length
        );
    }

    /**
     * @notice Check if user has made a prediction
     * @param marketId The market ID
     * @param user The user address
     * @return hasMadePrediction True if user has predicted
     */
    function checkHasPrediction(
        uint16 marketId,
        address user
    ) external view returns (bool) {
        return hasPrediction[marketId][user];
    }

    /**
     * @notice Gets the list of all predictors for a market
     * @param marketId The ID of the market
     * @return Array of predictor addresses
     */
    function getMarketPredictors(
        uint16 marketId
    ) external view returns (address[] memory) {
        return predictors[marketId];
    }

    /**
     * @notice Gets the encrypted prediction for a user (for client-side decryption)
     * @param marketId The ID of the market
     * @param user The address of the predictor
     * @return The encrypted prediction
     */
    function getEncryptedPrediction(
        uint16 marketId,
        address user
    ) external view returns (ebool) {
        return encryptedPredictions[marketId][user];
    }

    /**
     * @notice Gets the encrypted prediction handle as bytes32 (v0.9 self-relaying)
     * @dev Use this handle with the relayer SDK's publicDecrypt() method
     * @param marketId The ID of the market
     * @param user The address of the predictor
     * @return The encrypted prediction handle
     */
    function getEncryptedPredictionHandle(
        uint16 marketId,
        address user
    ) external view returns (bytes32) {
        ebool prediction = encryptedPredictions[marketId][user];
        if (!FHE.isInitialized(prediction)) {
            revert NoPredictionFound();
        }
        return FHE.toBytes32(prediction);
    }
}
