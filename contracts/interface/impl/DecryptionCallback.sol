// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../core/EncryptedHelper.sol";
import "../../struct/CommonStruct.sol";
import "../../struct/PredictionStruct.sol";
import "../../storage/PredictionStorage.sol";

/**
 * @title DecryptionCallbacks
 * @notice DEPRECATED in v0.9 - These callback functions are NO LONGER FUNCTIONAL
 * @dev The v0.9 migration uses submitMyPredictionDecryption() instead.
 * These functions are kept to satisfy the interface but will revert if called
 * since FHE.requestDecryption() no longer exists in v0.9.
 *
 * v0.9 Self-Relaying Pattern:
 * 1. Call requestMyPredictionDecryption() to mark value as publicly decryptable
 * 2. Use frontend SDK's publicDecrypt() to get cleartext + proof
 * 3. Call submitMyPredictionDecryption() with the cleartext and proof
 */
abstract contract DecryptionCallbacks is PredictionStorage {
    uint256 constant CACHE_EXPIRATION = 10 minutes;

    /**
     * @notice DEPRECATED - Non-functional in v0.9
     * @dev Use submitMyPredictionDecryption() instead
     */
    function callbackDecryptMyPrediction(
        uint256 requestId,
        bytes memory cleartext
    ) public {
        revert("DEPRECATED: Use submitMyPredictionDecryption");
        // FHE.checkSignatures signature changed in v0.9 - old requestId pattern no longer supported
    }

    /**
     * @notice DEPRECATED - Non-functional in v0.9
     * @dev This callback pattern is no longer supported in v0.9
     */
    function callbackDecryptTotalPredictions(
        uint256 requestId,
        bytes memory cleartext
    ) public {
        revert("DEPRECATED: Use v0.9 self-relaying pattern");
        // The old Oracle-based callback pattern is discontinued in v0.9
    }
}
