#!/bin/bash

# ==============================================================================
# LIQIFIN — Startup & Orchestration Automation Script
# ==============================================================================

# Exit immediately if a command exits with a non-zero status.
# (But we will check failures manually for graceful error messages)

# Print stylized banner
echo "======================================================================"
echo "      __   _  _____  _   _  _  ____    _____  _  _   _   __   _   ___   "
echo "     / /  | |/  _  \| | | || |/  _ \  |  ___|/ /|  \ | | /  | | | / __|  "
echo "    / /   | || | | || | | || || | \ \ | |__  / / |   \| ||   | | || |__   "
echo "   / /    | || | | || | | || || | | | |  __|/ /  | |\   || |   | ||  __|  "
echo "  / /___  | || |_| || |_| || || |_/ / | |  / /   | | \  || |\  | || |___  "
echo "  \_____/ |_|\___\_\\_____/|_|\____/  |_| /_/    |_|  \_||_| \_|_|\____/  "
echo "======================================================================"
echo "             Enterprise Personal Finance Operating System"
echo "======================================================================"

# 1. Detect Operating System (Linux/macOS)
OS_TYPE="$(uname -s)"
echo "[-] Detecting Host Operating System... Found: ${OS_TYPE}"

if [[ "$OS_TYPE" != "Darwin" && "$OS_TYPE" != "Linux" ]]; then
  echo "[WARNING] LIQIFIN orchestration is optimized for macOS & Linux."
  echo "Proceeding with caution on OS type: ${OS_TYPE}"
fi

# 2. Verify Node.js is installed
if ! command -v node &> /dev/null; then
  echo "[ERROR] Node.js is not installed. Please download Node.js (v18+) to run LIQIFIN."
  exit 1
else
  NODE_VER=$(node -v)
  echo "[*] Node.js is installed: ${NODE_VER}"
fi

# 3. Verify npm is installed
if ! command -v npm &> /dev/null; then
  echo "[ERROR] npm package manager is not installed."
  exit 1
else
  NPM_VER=$(npm -v)
  echo "[*] npm is installed: v${NPM_VER}"
fi

# 4. Check for .env configurations & Create from example templates if missing
echo "[-] Verifying environment variable structures..."
ROOT_DIR=$(pwd)

# Backend .env check
if [ ! -f "backend/.env" ]; then
  echo "[WARNING] backend/.env file not found. Initializing from backend/.env.example..."
  if [ -f "backend/.env.example" ]; then
    cp backend/.env.example backend/.env
    echo "[*] Created backend/.env successfully."
  else
    echo "[ERROR] backend/.env.example template is missing! Cannot proceed."
    exit 1
  fi
else
  echo "[*] Found backend/.env configuration."
fi

# Frontend .env check
if [ ! -f "frontend/.env" ]; then
  echo "[WARNING] frontend/.env file not found. Initializing from frontend/.env.example..."
  if [ -f "frontend/.env.example" ]; then
    cp frontend/.env.example frontend/.env
    echo "[*] Created frontend/.env successfully."
  else
    echo "[ERROR] frontend/.env.example template is missing! Cannot proceed."
    exit 1
  fi
else
  echo "[*] Found frontend/.env configuration."
fi

# 5. Automatically install backend dependencies if missing
echo "[-] Validating backend node dependencies..."
if [ ! -d "backend/node_modules" ]; then
  echo "[WARNING] backend/node_modules not found. Auto-installing dependencies..."
  cd "$ROOT_DIR/backend" || exit 1
  npm install --legacy-peer-deps
  if [ $? -ne 0 ]; then
    echo "[ERROR] Backend packages installation failed."
    exit 1
  fi
else
  echo "[*] Backend packages verified."
fi

# 6. Automatically install frontend dependencies if missing
echo "[-] Validating frontend node dependencies..."
if [ ! -d "frontend/node_modules" ]; then
  echo "[WARNING] frontend/node_modules not found. Auto-installing dependencies..."
  cd "$ROOT_DIR/frontend" || exit 1
  npm install --legacy-peer-deps
  if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend packages installation failed."
    exit 1
  fi
else
  echo "[*] Frontend packages verified."
fi

# 7. Create required static asset folders if missing
echo "[-] Creating necessary runtime directory bindings..."
mkdir -p "$ROOT_DIR/backend/public/uploads"
echo "[*] Configured storage directories."

# 8. Seed database if requested
read -p "Would you like to seed the MongoDB database with a high-fidelity Demo Ledger? (y/N): " SEED_CHOICE
if [[ "$SEED_CHOICE" =~ ^[Yy]$ ]]; then
  echo "[-] Seeding demo users, budgets, and historic credit transactions..."
  cd "$ROOT_DIR/backend" || exit 1
  # Run compiler for TypeScript seeder
  npm run seed
  if [ $? -eq 0 ]; then
    echo "[*] Seeding completed."
  else
    echo "[WARNING] Seeding failed. Ensure a local MongoDB instance is running at: 127.0.0.1:27017"
    echo "You can skip seeding and continue."
  fi
fi

# 9. Start services concurrently
echo "======================================================================"
echo "  Launching LIQIFIN Server Core & Client Dashboard"
echo "  Press Ctrl+C to terminate services gracefully."
echo "======================================================================"

cd "$ROOT_DIR" || exit 1

# Launch backend in background
cd backend && npm run dev &
BACKEND_PID=$!
echo "[+] LIQIFIN API Server spinning up... PID: $BACKEND_PID"

# Launch frontend in background
cd "$ROOT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!
echo "[+] LIQIFIN Web Dashboard spinning up... PID: $FRONTEND_PID"

# Function to capture SIGINT (Ctrl+C) and terminate child processes
cleanup() {
  echo ""
  echo "======================================================================"
  echo "  Stopping all LIQIFIN services gracefully..."
  echo "======================================================================"
  
  if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Stopping API Server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
  fi
  
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "Stopping Web Dashboard (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
  fi
  
  echo "[*] Shutdown complete. Have a profitable day."
  exit 0
}

# Bind cleanup function to INT signal (Ctrl+C)
trap cleanup INT

# Block parent process and wait for children
wait
