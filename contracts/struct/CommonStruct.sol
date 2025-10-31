// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library CommonStruct {
    enum DecryptStatus {
        NONE,
        PROCESSING,
        DECRYPTED
    }

    struct BoolResultWithExp {
        bool data;
        uint256 exp;
    }

    struct Uint64ResultWithExp {
        uint64 data;
        uint256 exp;
    }
}
