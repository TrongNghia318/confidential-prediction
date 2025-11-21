// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

library PredictionStruct {
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
    }
}
