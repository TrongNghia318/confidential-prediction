// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDecryptionCallbacks {
    function callbackDecryptMyPrediction(
        uint256 requestId,
        bytes memory cleartext
    ) external;

    function callbackDecryptTotalPredictions(
        uint256 requestId,
        bytes memory cleartext
    ) external;
}
