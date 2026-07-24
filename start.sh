#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project paths
BACKEND_DIR="./backend"
ADMIN_DIR="./frontend-admin"
WEBSITE_DIR="./frontend-website"

# Ports
BACKEND_PORT=8000
ADMIN_PORT=3000
WEBSITE_PORT=3001

# PID files
BACKEND_PID_FILE="/tmp/backend.pid"
ADMIN_PID_FILE="/tmp/admin.pid"
WEBSITE_PID_FILE="/tmp/website.pid"

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

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
    elif [ -f "$ADMIN_DIR/.nvmrc" ]; then
        print_message "📄 Found frontend/.nvmrc file..." "$YELLOW"
        cd "$ADMIN_DIR"
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

# Function to cleanup on exit
cleanup() {
    print_message "\n🛑 Shutting down all services..." "$YELLOW"
    
    # Stop Backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        kill $BACKEND_PID 2>/dev/null
        rm "$BACKEND_PID_FILE"
        print_message "✓ Backend stopped" "$GREEN"
    fi
    
    # Stop Frontend (Admin)
    if [ -f "$ADMIN_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$ADMIN_PID_FILE")
        kill $FRONTEND_PID 2>/dev/null
        rm "$ADMIN_PID_FILE"
        print_message "✓ Frontend (Admin) stopped" "$GREEN"
    fi
    
    # Stop Website
    if [ -f "$WEBSITE_PID_FILE" ]; then
        WEBSITE_PID=$(cat "$WEBSITE_PID_FILE")
        kill $WEBSITE_PID 2>/dev/null
        rm "$WEBSITE_PID_FILE"
        print_message "✓ Website stopped" "$GREEN"
    fi
    
    print_message "👋 Goodbye!" "$BLUE"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Print banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════╗"
echo "║        🚀 Starting Full Stack Dev Environment      ║"
echo "╚════════════════════════════════════════════════════╝"
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

print_message "✓ All prerequisites satisfied" "$GREEN"

# Setup Node.js LTS
setup_node_lts

# Free up ports
print_message "\n🔧 Checking ports..." "$BLUE"
kill_port $BACKEND_PORT
kill_port $ADMIN_PORT
kill_port $WEBSITE_PORT

# Start Backend
print_message "\n🔧 Starting Backend (Laravel)..." "$CYAN"

if [ ! -d "$BACKEND_DIR" ]; then
    print_message "❌ Backend directory not found!" "$RED"
    exit 1
fi

cd "$BACKEND_DIR" || exit 1

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

# Start Laravel development server
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

# Start Frontend (Admin Panel)
print_message "\n🎨 Starting Frontend Admin Panel (React + MUI)..." "$PURPLE"

cd "../$ADMIN_DIR" || { 
    print_message "❌ Frontend directory not found!" "$RED"
    cleanup
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_message "📦 Installing frontend dependencies..." "$YELLOW"
    npm install
fi

# Start Vite dev server with specific port
print_message "🚀 Starting Admin Panel on port $ADMIN_PORT..." "$GREEN"
PORT=$ADMIN_PORT npm run dev > /tmp/frontend.log 2>&1 &
# Или если используется Vite, можно так:
# npx vite --port $ADMIN_PORT > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$ADMIN_PID_FILE"

# Wait for frontend to start
print_message "⏳ Waiting for Admin Panel to start..." "$YELLOW"
sleep 5

# Check if frontend started
if ! check_port $ADMIN_PORT; then
    print_message "❌ Admin Panel failed to start. Check /tmp/frontend.log" "$RED"
    cat /tmp/frontend.log
    cleanup
fi

print_message "✓ Admin Panel running on http://127.0.0.1:$ADMIN_PORT" "$GREEN"

# Start Website (Front-website)
print_message "\n🌐 Starting Website (React)..." "$PURPLE"

cd "../$WEBSITE_DIR" || { 
    print_message "❌ Website directory not found!" "$RED"
    cleanup
}

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    print_message "📦 Installing website dependencies..." "$YELLOW"
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    print_message "📝 Creating .env.local for website..." "$YELLOW"
    cat > .env.local << EOF
VITE_BACKEND=true
VITE_API_URL=http://127.0.0.1:${BACKEND_PORT}/api
VITE_APP_NAME=Website
VITE_APP_PORT=${WEBSITE_PORT}
EOF
fi

# Start Vite dev server for website
print_message "🚀 Starting Website on port $WEBSITE_PORT..." "$GREEN"
PORT=$WEBSITE_PORT npm run dev > /tmp/website.log 2>&1 &
# Или: npx vite --port $WEBSITE_PORT > /tmp/website.log 2>&1 &
WEBSITE_PID=$!
echo $WEBSITE_PID > "$WEBSITE_PID_FILE"

# Wait for website to start
print_message "⏳ Waiting for Website to start..." "$YELLOW"
sleep 5

# Check if website started
if ! check_port $WEBSITE_PORT; then
    print_message "❌ Website failed to start. Check /tmp/website.log" "$RED"
    cat /tmp/website.log
    cleanup
fi

print_message "✓ Website running on http://127.0.0.1:$WEBSITE_PORT" "$GREEN"

# Test endpoints
print_message "\n🔍 Testing endpoints..." "$BLUE"

# Test Backend API
print_message "Testing Backend API..." "$YELLOW"
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/test-cors" 2>/dev/null)
if [ "$API_TEST" = "200" ]; then
    print_message "✓ Backend API: OK" "$GREEN"
else
    print_message "⚠ Backend API: $API_TEST (check /tmp/backend.log)" "$YELLOW"
fi

# Test Frontend Admin
print_message "Testing Admin Panel..." "$YELLOW"
ADMIN_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$ADMIN_PORT" 2>/dev/null)
if [ "$ADMIN_TEST" = "200" ]; then
    print_message "✓ Admin Panel: OK" "$GREEN"
else
    print_message "⚠ Admin Panel: $ADMIN_TEST" "$YELLOW"
fi

# Test Website
print_message "Testing Website..." "$YELLOW"
WEBSITE_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$WEBSITE_PORT" 2>/dev/null)
if [ "$WEBSITE_TEST" = "200" ]; then
    print_message "✓ Website: OK" "$GREEN"
else
    print_message "⚠ Website: $WEBSITE_TEST" "$YELLOW"
fi

# Print summary
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ All services are running!                ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  🔧 Backend API:    http://127.0.0.1:${BACKEND_PORT}                 ║"
echo "║  🎨 Admin Panel:    http://127.0.0.1:${ADMIN_PORT}                ║"
echo "║  🌐 Website:        http://127.0.0.1:${WEBSITE_PORT}                ║"
echo "║                                                          ║"
echo "║  📋 Logs:                                                ║"
echo "║     Backend:  tail -f /tmp/backend.log                  ║"
echo "║     Admin:    tail -f /tmp/frontend.log                 ║"
echo "║     Website:  tail -f /tmp/website.log                  ║"
echo "║                                                          ║"
echo "║  🛑 Press Ctrl+C to stop all services                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Offer to show logs
print_message "📋 Press 'l' to view logs, or any other key to continue..." "$YELLOW"
read -t 5 -n 1 SHOW_LOGS || true

if [ "$SHOW_LOGS" = "l" ] || [ "$SHOW_LOGS" = "L" ]; then
    print_message "\n📋 Showing combined logs (Ctrl+C to exit)..." "$BLUE"
    tail -f /tmp/backend.log /tmp/frontend.log /tmp/website.log &
    TAIL_PID=$!
    
    # Wait for background processes
    wait $BACKEND_PID $FRONTEND_PID $WEBSITE_PID $TAIL_PID
else
    print_message "\n✅ All services started successfully! Running in background..." "$GREEN"
    print_message "To stop all services, run: kill \$(cat /tmp/*.pid)" "$YELLOW"
    
    # Wait for background processes
    wait $BACKEND_PID $FRONTEND_PID $WEBSITE_PID
fi