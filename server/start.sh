#!/bin/bash

# Build TypeScript
echo "Building TypeScript..."
npx tsc

# Run the server
echo "Starting server..."
node dist/index.js