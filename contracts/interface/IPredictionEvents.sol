// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../struct/PredictionStruct.sol";

interface IPredictionEvents {
    event MarketCreated(
        uint16 indexed marketId,
        address indexed creator,
        string question,
        uint256 deadline
    );

    event PredictionMade(
        uint16 indexed marketId,
        address indexed user
    );

    event MarketResolved(
        uint16 indexed marketId,
        PredictionStruct.Outcome outcome
    );

    event MarketCancelled(uint16 indexed marketId);
}
