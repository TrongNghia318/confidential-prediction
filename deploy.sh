#!/bin/bash

# Get network from argument (default: localhost)
NETWORK=${1:-localhost}

echo "🚀 Deploying to $NETWORK..."

# Deploy contracts
npx hardhat deploy --network $NETWORK

echo "✅ Deployment complete!"

# Save deployment addresses
if [ -d "deployments/$NETWORK" ]; then
  echo ""
  echo "📋 Deployment Summary:"
  echo "====================="

  if [ -f "deployments/$NETWORK/ConfidentialPrediction.json" ]; then
    PREDICTION_ADDRESS=$(cat deployments/$NETWORK/ConfidentialPrediction.json | grep '"address"' | head -1 | awk -F'"' '{print $4}')
    echo "ConfidentialPrediction: $PREDICTION_ADDRESS"
  fi

  echo ""
  echo "💡 Update your frontend .env.local with these addresses"
fi
