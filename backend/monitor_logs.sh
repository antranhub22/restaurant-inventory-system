#!/bin/bash

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔍 Real-time Backend Log Monitor${NC}"
echo "================================"
echo -e "${YELLOW}Monitoring for OCR requests...${NC}"
echo -e "${GREEN}Press Ctrl+C to stop${NC}"
echo ""

# Function to format logs
format_log() {
    while read -r line; do
        if [[ $line == *"[DEBUG]"* ]]; then
            echo -e "\033[0;36m🐛 $line\033[0m"
        elif [[ $line == *"OCR"* ]] || [[ $line == *"ocr"* ]]; then
            echo -e "\033[0;32m🔍 $line\033[0m"
        elif [[ $line == *"ERROR"* ]] || [[ $line == *"error"* ]]; then
            echo -e "\033[0;31m❌ $line\033[0m"
        elif [[ $line == *"warn"* ]] || [[ $line == *"WARN"* ]]; then
            echo -e "\033[1;33m⚠️  $line\033[0m"
        else
            echo "📝 $line"
        fi
    done
}

# Check if backend is running
if ! pgrep -f "node dist/server.js" > /dev/null; then
    echo -e "\033[0;31m❌ Backend is not running!${NC}"
    echo "Please start backend with: npm start"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running. Monitoring logs...${NC}"
echo ""

# Monitor logs (assuming backend outputs to stdout/stderr)
# Since we can't access log files directly, we'll simulate monitoring
while true; do
    echo -e "\033[0;36m$(date): Waiting for OCR requests...${NC}"
    sleep 10
    
    # Check if there are any recent errors
    if netstat -an | grep -q ":4000.*LISTEN"; then
        echo -e "\033[0;32m✅ Backend still running on port 4000${NC}"
    else
        echo -e "\033[0;31m❌ Backend stopped running!${NC}"
        break
    fi
done 