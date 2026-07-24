#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "🛑 Stopping all services..."

# Kill processes by PID files
for PID_FILE in /tmp/backend.pid /tmp/frontend.pid /tmp/website.pid; do
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill $PID 2>/dev/null; then
            echo -e "${GREEN}✓ Stopped process $PID ($PID_FILE)${NC}"
        fi
        rm "$PID_FILE"
    fi
done

# Kill any remaining processes on our ports
for PORT in 8000 3000 3001; do
    if lsof -ti :$PORT >/dev/null 2>&1; then
        lsof -ti :$PORT | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ Freed port $PORT${NC}"
    fi
done

echo -e "${GREEN}✅ All services stopped${NC}"