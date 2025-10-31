// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library EncryptedHelper {
    function decodeUint64(
        bytes memory cleartexts
    ) internal pure returns (uint64 value) {
        assembly {
            let dataPtr := add(cleartexts, 0x20)
            value := mload(dataPtr)
        }
        return (value);
    }

    function decodeBool(
        bytes memory cleartexts
    ) internal pure returns (bool value) {
        assembly {
            let dataPtr := add(cleartexts, 0x20)
            let rawValue := mload(dataPtr)
            value := gt(rawValue, 0)
        }
        return (value);
    }
}
