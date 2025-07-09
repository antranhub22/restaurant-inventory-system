#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing OCR Endpoints${NC}"
echo "================================"

# Test 1: Health check
echo -e "\n${YELLOW}1. Testing backend health...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:4000/api/health)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    exit 1
fi

# Test 2: Get auth token (simulate login) with different credentials
echo -e "\n${YELLOW}2. Getting auth token...${NC}"

# Try multiple credential combinations
declare -a CREDENTIALS=(
    '{"username": "owner", "password": "1234"}'
    '{"email": "owner@restaurant.com", "password": "1234"}'
    '{"username": "manager", "password": "password123"}'
    '{"email": "manager@restaurant.com", "password": "password123"}'
    '{"username": "admin", "password": "admin123"}'
    '{"email": "admin@restaurant.com", "password": "admin123"}'
    '{"email": "admin@example.com", "password": "admin123"}'
    '{"email": "owner@restaurant.com", "password": "password123"}'
    '{"username": "owner", "password": "password123"}'
)

TOKEN=""
for cred in "${CREDENTIALS[@]}"; do
    echo -e "${YELLOW}Trying: $cred${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
      -H "Content-Type: application/json" \
      -d "$cred")
    
    if [[ $? -eq 0 ]]; then
        TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        if [[ -n "$TOKEN" ]]; then
            echo -e "${GREEN}✅ Got auth token with credentials: $cred${NC}"
            echo "Token: ${TOKEN:0:20}..."
            break
        else
            echo -e "${YELLOW}Response: $LOGIN_RESPONSE${NC}"
        fi
    fi
done

if [[ -z "$TOKEN" ]]; then
    echo -e "${RED}❌ Could not get auth token with any credentials${NC}"
    exit 1
fi

# Test 3: Test OCR Forms endpoint
echo -e "\n${YELLOW}3. Testing OCR Forms endpoint...${NC}"
if [[ -f "test.png" ]]; then
    OCR_RESPONSE=$(curl -s -X POST http://localhost:4000/api/ocr-forms/process \
      -H "Authorization: Bearer $TOKEN" \
      -F "formType=IMPORT" \
      -F "image=@test.png")
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ OCR endpoint responded${NC}"
        echo "Response: ${OCR_RESPONSE:0:200}..."
    else
        echo -e "${RED}❌ OCR endpoint failed${NC}"
    fi
else
    echo -e "${RED}❌ test.png file not found${NC}"
    echo "Creating a simple test image..."
    # Create a simple test file
    echo "This is a test file" > test.txt
    echo -e "${YELLOW}Created test.txt instead${NC}"
fi

# Test 4: Test PaddleOCR server
echo -e "\n${YELLOW}4. Testing PaddleOCR server...${NC}"
PADDLE_RESPONSE=$(curl -s http://localhost:5001/health)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ PaddleOCR server is running${NC}"
    echo "Response: $PADDLE_RESPONSE"
else
    echo -e "${RED}❌ PaddleOCR server is not running${NC}"
fi

echo -e "\n${BLUE}🏁 Test completed!${NC}" 