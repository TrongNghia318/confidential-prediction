// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../core/EncryptedHelper.sol";
import "../../struct/CommonStruct.sol";
import "../../struct/PredictionStruct.sol";
import "../../storage/PredictionStorage.sol";

/**
 * @title DecryptionCallbacks
 * @notice Simplified callback handler for decryption requests
 * @dev Uses client-side decryption approach
 */
abstract contract DecryptionCallbacks is PredictionStorage {
    uint256 constant CACHE_EXPIRATION = 10 minutes;

    /**
     * @notice Callback for decrypting user prediction
     * @dev Called after decryption is complete
     */
    function callbackDecryptMyPrediction(
        uint256 requestId,
        bytes memory cleartext
    ) public {
        PredictionStruct.DecryptPredictionRequest
            memory request = decryptPredictionRequest[requestId];

        bool prediction = EncryptedHelper.decodeBool(cleartext);

        decryptedPredictions[request.marketId][
            request.userAddress
        ] = CommonStruct.BoolResultWithExp({
            data: prediction,
            exp: block.timestamp + CACHE_EXPIRATION
        });

        decryptPredictionStatus[request.marketId][
            request.userAddress
        ] = CommonStruct.DecryptStatus.DECRYPTED;

        delete decryptPredictionRequest[requestId];
    }

    /**
     * @notice Callback for decrypting total predictions count
     * @dev Called after decryption is complete
     */
    function callbackDecryptTotalPredictions(
        uint256 requestId,
        bytes memory cleartext
    ) public {
        PredictionStruct.DecryptTotalRequest
            memory request = decryptTotalRequest[requestId];

        uint64 totalCount = EncryptedHelper.decodeUint64(cleartext);

        if (request.isYesTotal) {
            decryptedTotalYes[request.marketId] = CommonStruct
                .Uint64ResultWithExp({
                    data: totalCount,
                    exp: block.timestamp + CACHE_EXPIRATION
                });

            decryptTotalYesStatus[request.marketId] = CommonStruct
                .DecryptStatus
                .DECRYPTED;
        } else {
            decryptedTotalNo[request.marketId] = CommonStruct
                .Uint64ResultWithExp({
                    data: totalCount,
                    exp: block.timestamp + CACHE_EXPIRATION
                });

            decryptTotalNoStatus[request.marketId] = CommonStruct
                .DecryptStatus
                .DECRYPTED;
        }

        delete decryptTotalRequest[requestId];
    }
}
