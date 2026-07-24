#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Function to setup Node.js LTS
setup_node_lts() {
    print_message "📦 Setting up Node.js LTS..." "$BLUE"

    # Check if NVM is available
    if ! command -v nvm &> /dev/null; then
        print_message "❌ NVM is not installed! Please install NVM first." "$RED"
        exit 1
    fi

    # Check for .nvmrc file
    if [ -f ".nvmrc" ]; then
        print_message "📄 Found .nvmrc file, using specified version..." "$YELLOW"
        nvm use || nvm install
    elif [ -f "frontend/.nvmrc" ]; then
        print_message "📄 Found frontend/.nvmrc file..." "$YELLOW"
        cd frontend
        nvm use || nvm install
        cd ..
    else
        print_message "🔄 Switching to LTS version..." "$YELLOW"

        # Check if LTS is installed
        if nvm ls --lts | grep -q "N/A"; then
            print_message "📥 Installing Node.js LTS..." "$YELLOW"
            nvm install --lts
            nvm alias default 'lts/*'
        fi

        # Use LTS version
        nvm use --lts
    fi

    # Verify Node.js version
    CURRENT_NODE=$(node --version)
    print_message "✅ Node.js version: $CURRENT_NODE" "$GREEN"
}


# Project paths
BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000

# PID files
BACKEND_PID_FILE="/tmp/backend.pid"
FRONTEND_PID_FILE="/tmp/frontend.pid"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Function to kill process on port
kill_port() {
    if check_port $1; then
        print_message "⚠ Port $1 is in use. Attempting to free it..." "$YELLOW"
        lsof -ti :$1 | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Function to cleanup on exit
cleanup() {
    print_message "\n🛑 Shutting down services..." "$YELLOW"

    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        kill $BACKEND_PID 2>/dev/null
        rm "$BACKEND_PID_FILE"
        print_message "✓ Backend stopped" "$GREEN"
    fi

    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        kill $FRONTEND_PID 2>/dev/null
        rm "$FRONTEND_PID_FILE"
        print_message "✓ Frontend stopped" "$GREEN"
    fi

    print_message "👋 Goodbye!" "$BLUE"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Print banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║     🚀 Starting Dev Environment        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
print_message "📋 Checking prerequisites..." "$YELLOW"

if ! command_exists php; then
    print_message "❌ PHP is not installed!" "$RED"
    exit 1
fi

if ! command_exists composer; then
    print_message "❌ Composer is not installed!" "$RED"
    exit 1
fi

if ! command_exists node; then
    print_message "❌ Node.js is not installed!" "$RED"
    exit 1
fi

if ! command_exists npm; then
    print_message "❌ NPM is not installed!" "$RED"
    exit 1
fi

print_message "✓ All prerequisites satisfied" "$GREEN"

# Free up ports
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Start Backend
print_message "\n🔧 Starting Backend (Laravel)..." "$BLUE"

cd "$BACKEND_DIR" || { print_message "❌ Backend directory not found!" "$RED"; exit 1; }

# Install dependencies if needed
if [ ! -d "vendor" ]; then
    print_message "📦 Installing backend dependencies..." "$YELLOW"
    composer install
fi

# Copy .env if not exists
if [ ! -f ".env" ]; then
    print_message "📝 Creating .env from .env.example..." "$YELLOW"
    cp .env.example .env
    php artisan key:generate
fi

# Start Laravel development server in background
print_message "🚀 Starting Laravel server on port $BACKEND_PORT..." "$GREEN"
php artisan serve --port=$BACKEND_PORT --host=127.0.0.1 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"

# Wait for backend to start
print_message "⏳ Waiting for backend to start..." "$YELLOW"
sleep 3

# Check if backend started successfully
if ! check_port $BACKEND_PORT; then
    print_message "❌ Backend failed to start. Check /tmp/backend.log" "$RED"
    cat /tmp/backend.log
    cleanup
fi

print_message "✓ Backend running on http://127.0.0.1:$BACKEND_PORT" "$GREEN"

# Start Frontend
print_message "\n🎨 Starting Frontend (React)..." "$BLUE"

cd "../$FRONTEND_DIR" || { print_message "❌ Frontend directory not found!" "$RED"; exit 1; }

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_message "📦 Installing frontend dependencies..." "$YELLOW"
    npm install
fi

# Start Vite dev server
print_message "🚀 Starting Vite dev server on port $FRONTEND_PORT..." "$GREEN"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"

# Wait for frontend to start
print_message "⏳ Waiting for frontend to start..." "$YELLOW"
sleep 5

# Check if frontend started
if ! check_port $FRONTEND_PORT; then
    print_message "❌ Frontend failed to start. Check /tmp/frontend.log" "$RED"
    cat /tmp/frontend.log
    cleanup
fi

print_message "✓ Frontend running on http://127.0.0.1:$FRONTEND_PORT" "$GREEN"

# Test CORS
print_message "\n🔍 Testing CORS configuration..." "$BLUE"
print_message "Testing API endpoint..." "$YELLOW"

# Create a test CORS response
CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: http://127.0.0.1:$FRONTEND_PORT" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "http://127.0.0.1:$BACKEND_PORT/api/test-cors" \
    2>/dev/null)

# Make a real API request
API_RESPONSE=$(curl -s \
    -H "Origin: http://127.0.0.1:$FRONTEND_PORT" \
    "http://127.0.0.1:$BACKEND_PORT/api/test-cors" \
    2>/dev/null)

print_message "CORS Test Response: $CORS_RESPONSE" "$BLUE"
print_message "API Response: $API_RESPONSE" "$GREEN"

# Print summary
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║           ✅ All services are running!             ║"
echo "╠════════════════════════════════════════════════════╣"
echo "║  Backend:  http://127.0.0.1:$BACKEND_PORT                 ║"
echo "║  Frontend: http://127.0.0.1:$FRONTEND_PORT                ║"
echo "║                                                    ║"
echo "║  Test CORS: curl http://127.0.0.1:$BACKEND_PORT/api/test-cors   ║"
echo "║                                                    ║"
echo "║  Press Ctrl+C to stop all services                ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Tail logs option
print_message "📋 Tailing logs (Ctrl+C to stop)..." "$YELLOW"
tail -f /tmp/backend.log /tmp/frontend.log &
TAIL_PID=$!

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID $TAIL_PID