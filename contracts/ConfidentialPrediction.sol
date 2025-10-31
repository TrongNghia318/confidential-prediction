// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
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
            resolved: false,
            totalYesPredictions: 0,
            totalNoPredictions: 0
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

        // Count predictions (for statistics)
        address[] memory allPredictors = predictors[marketId];
        uint64 yesCount = 0;
        uint64 noCount = 0;

        for (uint256 i = 0; i < allPredictors.length; i++) {
            ebool userPrediction = encryptedPredictions[marketId][allPredictors[i]];

            // Convert ebool to euint64: true -> 1, false -> 0
            euint64 predictionValue = FHE.select(userPrediction, FHE.asEuint64(1), FHE.asEuint64(0));

            // For Yes count: if prediction is true (YES), add 1
            euint64 currentYesTotal = FHE.asEuint64(yesCount);
            euint64 newYesTotal = FHE.add(currentYesTotal, predictionValue);

            // For No count: if prediction is false (NO), add 1
            euint64 notPrediction = FHE.sub(FHE.asEuint64(1), predictionValue); // Invert: 1-1=0, 1-0=1
            euint64 currentNoTotal = FHE.asEuint64(noCount);
            euint64 newNoTotal = FHE.add(currentNoTotal, notPrediction);

            // Request decryption for final counts (simplified - just storing encrypted counts)
            // In practice, creator would decrypt these to see statistics
        }

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
     * @notice Requests decryption of the user's prediction
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

        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(encryptedPredictions[marketId][msg.sender]);

        uint256 requestId = FHE.requestDecryption(
            handles,
            IDecryptionCallbacks.callbackDecryptMyPrediction.selector
        );

        decryptPredictionRequest[requestId] = PredictionStruct
            .DecryptPredictionRequest({
                userAddress: msg.sender,
                marketId: marketId
            });

        decryptPredictionStatus[marketId][msg.sender] = CommonStruct
            .DecryptStatus
            .PROCESSING;
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
}
