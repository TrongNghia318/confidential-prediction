// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SimplePrediction
 * @notice Simplified prediction market for testing without FHEVM
 * @dev This version uses hash-based privacy instead of FHE for easier testing
 */
contract SimplePrediction {
    enum Outcome {
        PENDING,
        YES,
        NO,
        CANCELLED
    }

    struct Market {
        address creator;
        string question;
        string description;
        uint256 deadline;
        Outcome outcome;
        bool resolved;
        uint256 totalPredictors;
    }

    uint16 public marketCount;
    mapping(uint16 => Market) public markets;

    // Hash of user predictions (keccak256 of user address + prediction + salt)
    mapping(uint16 => mapping(address => bytes32)) public predictionHashes;

    // Revealed predictions after resolution
    mapping(uint16 => mapping(address => bool)) public revealedPredictions;
    mapping(uint16 => mapping(address => bool)) public hasRevealed;
    mapping(uint16 => mapping(address => bool)) public hasPredicted;

    event MarketCreated(uint16 indexed marketId, address indexed creator, string question, uint256 deadline);
    event PredictionMade(uint16 indexed marketId, address indexed user);
    event MarketResolved(uint16 indexed marketId, Outcome outcome);
    event PredictionRevealed(uint16 indexed marketId, address indexed user, bool prediction);
    event MarketCancelled(uint16 indexed marketId);

    error OnlyCreator();
    error InvalidDeadline();
    error EmptyQuestion();
    error MarketNotExist();
    error MarketEnded();
    error MarketStillActive();
    error AlreadyResolved();
    error AlreadyCancelled();
    error AlreadyPredicted();
    error MarketNotResolved();
    error InvalidReveal();
    error NotPredicted();

    modifier onlyCreator(uint16 marketId) {
        if (msg.sender != markets[marketId].creator) revert OnlyCreator();
        _;
    }

    function createMarket(
        string calldata question,
        string calldata description,
        uint256 duration
    ) external returns (uint16) {
        if (duration == 0) revert InvalidDeadline();
        if (bytes(question).length == 0) revert EmptyQuestion();

        uint16 marketId = marketCount++;

        markets[marketId] = Market({
            creator: msg.sender,
            question: question,
            description: description,
            deadline: block.timestamp + duration,
            outcome: Outcome.PENDING,
            resolved: false,
            totalPredictors: 0
        });

        emit MarketCreated(marketId, msg.sender, question, block.timestamp + duration);
        return marketId;
    }

    function predict(uint16 marketId, bytes32 predictionHash) external {
        if (marketId >= marketCount) revert MarketNotExist();

        Market storage market = markets[marketId];
        if (block.timestamp > market.deadline) revert MarketEnded();
        if (market.resolved) revert AlreadyResolved();
        if (market.outcome == Outcome.CANCELLED) revert AlreadyCancelled();
        if (hasPredicted[marketId][msg.sender]) revert AlreadyPredicted();

        predictionHashes[marketId][msg.sender] = predictionHash;
        hasPredicted[marketId][msg.sender] = true;
        market.totalPredictors++;

        emit PredictionMade(marketId, msg.sender);
    }

    function revealPrediction(uint16 marketId, bool prediction, string calldata salt) external {
        if (marketId >= marketCount) revert MarketNotExist();
        if (!hasPredicted[marketId][msg.sender]) revert NotPredicted();

        bytes32 computedHash = keccak256(abi.encodePacked(msg.sender, prediction, salt));
        if (computedHash != predictionHashes[marketId][msg.sender]) revert InvalidReveal();

        revealedPredictions[marketId][msg.sender] = prediction;
        hasRevealed[marketId][msg.sender] = true;

        emit PredictionRevealed(marketId, msg.sender, prediction);
    }

    function resolveMarket(uint16 marketId, Outcome outcome) external onlyCreator(marketId) {
        if (marketId >= marketCount) revert MarketNotExist();

        Market storage market = markets[marketId];
        if (block.timestamp < market.deadline) revert MarketStillActive();
        if (market.resolved) revert AlreadyResolved();
        if (market.outcome == Outcome.CANCELLED) revert AlreadyCancelled();
        if (outcome != Outcome.YES && outcome != Outcome.NO) revert InvalidDeadline();

        market.outcome = outcome;
        market.resolved = true;

        emit MarketResolved(marketId, outcome);
    }

    function cancelMarket(uint16 marketId) external onlyCreator(marketId) {
        if (marketId >= marketCount) revert MarketNotExist();

        Market storage market = markets[marketId];
        if (market.resolved) revert AlreadyResolved();
        if (market.outcome == Outcome.CANCELLED) revert AlreadyCancelled();

        market.outcome = Outcome.CANCELLED;

        emit MarketCancelled(marketId);
    }

    function getMarket(uint16 marketId) external view returns (
        address creator,
        string memory question,
        string memory description,
        uint256 deadline,
        Outcome outcome,
        bool resolved,
        uint256 totalPredictors
    ) {
        if (marketId >= marketCount) revert MarketNotExist();
        Market memory market = markets[marketId];

        return (
            market.creator,
            market.question,
            market.description,
            market.deadline,
            market.outcome,
            market.resolved,
            market.totalPredictors
        );
    }

    function getMyPrediction(uint16 marketId) external view returns (
        bool prediction,
        bool wasCorrect,
        bool isResolved
    ) {
        if (!hasRevealed[marketId][msg.sender]) revert NotPredicted();

        Market memory market = markets[marketId];
        prediction = revealedPredictions[marketId][msg.sender];
        isResolved = market.resolved;

        if (isResolved) {
            bool actualOutcome = (market.outcome == Outcome.YES);
            wasCorrect = (prediction == actualOutcome);
        }

        return (prediction, wasCorrect, isResolved);
    }

    function checkHasPrediction(uint16 marketId, address user) external view returns (bool) {
        return hasPredicted[marketId][user];
    }

    function checkHasRevealed(uint16 marketId, address user) external view returns (bool) {
        return hasRevealed[marketId][user];
    }
}
