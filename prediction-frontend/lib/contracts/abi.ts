export const PREDICTION_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "marketCount",
    "outputs": [{"internalType": "uint16", "name": "", "type": "uint16"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "question", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"}
    ],
    "name": "createMarket",
    "outputs": [{"internalType": "uint16", "name": "", "type": "uint16"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"},
      {"internalType": "externalEbool", "name": "encryptedPrediction", "type": "bytes"},
      {"internalType": "bytes", "name": "inputProof", "type": "bytes"}
    ],
    "name": "predict",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"},
      {"internalType": "enum PredictionStruct.Outcome", "name": "outcome", "type": "uint8"}
    ],
    "name": "resolveMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"}
    ],
    "name": "cancelMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"}
    ],
    "name": "requestMyPredictionDecryption",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"}
    ],
    "name": "getMyPrediction",
    "outputs": [
      {"internalType": "bool", "name": "prediction", "type": "bool"},
      {"internalType": "bool", "name": "wasCorrect", "type": "bool"},
      {"internalType": "bool", "name": "isResolved", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"}
    ],
    "name": "getMarket",
    "outputs": [
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "string", "name": "question", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "enum PredictionStruct.Outcome", "name": "outcome", "type": "uint8"},
      {"internalType": "bool", "name": "resolved", "type": "bool"},
      {"internalType": "uint256", "name": "totalPredictors", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "checkHasPrediction",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"}
    ],
    "name": "getMarketPredictors",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint16", "name": "marketId", "type": "uint16"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getEncryptedPrediction",
    "outputs": [{"internalType": "ebool", "name": "", "type": "bytes"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint16", "name": "marketId", "type": "uint16"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "question", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "MarketCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint16", "name": "marketId", "type": "uint16"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "PredictionMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint16", "name": "marketId", "type": "uint16"},
      {"indexed": false, "internalType": "enum PredictionStruct.Outcome", "name": "outcome", "type": "uint8"}
    ],
    "name": "MarketResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint16", "name": "marketId", "type": "uint16"}
    ],
    "name": "MarketCancelled",
    "type": "event"
  }
] as const;
