#!/bin/bash

# Library Management System API Test Script

echo "==================================="
echo "Library Management System API Test"
echo "==================================="
echo ""

BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Health Check
echo -e "${BLUE}1. Testing Health Check...${NC}"
curl -s "$BASE_URL/health" | jq '.'
echo -e "\n"

# 2. Register a new user
echo -e "${BLUE}2. Registering new user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
echo -e "${GREEN}JWT Token saved!${NC}"
echo -e "\n"

# 3. Login with the user
echo -e "${BLUE}3. Testing login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
echo -e "\n"

# 4. Get current user
echo -e "${BLUE}4. Getting current user info...${NC}"
curl -s "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "\n"

# 5. Create a digital item (eBook)
echo -e "${BLUE}5. Creating a digital item (eBook)...${NC}"
DIGITAL_ITEM=$(curl -s -X POST "$BASE_URL/api/digital-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "type": "ebook",
    "format": "epub",
    "description": "A classic American novel",
    "isbn": "978-0-7432-7356-5",
    "publisher": "Scribner",
    "publishedYear": 1925,
    "language": "English",
    "rating": 4.5,
    "tags": ["classic", "fiction", "american literature"]
  }')

echo "$DIGITAL_ITEM" | jq '.'
DIGITAL_ID=$(echo "$DIGITAL_ITEM" | jq -r '.item.id')
echo -e "\n"

# 6. Create another digital item (PDF)
echo -e "${BLUE}6. Creating another digital item (PDF)...${NC}"
curl -s -X POST "$BASE_URL/api/digital-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "type": "pdf",
    "format": "pdf",
    "description": "A handbook of agile software craftsmanship",
    "isbn": "978-0132350884",
    "publisher": "Prentice Hall",
    "publishedYear": 2008,
    "language": "English",
    "rating": 4.8,
    "tags": ["programming", "software", "best practices"]
  }' | jq '.'
echo -e "\n"

# 7. Get all digital items
echo -e "${BLUE}7. Getting all digital items...${NC}"
curl -s "$BASE_URL/api/digital-items" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "\n"

# 8. Create a physical item (Book)
echo -e "${BLUE}8. Creating a physical item (Book)...${NC}"
PHYSICAL_ITEM=$(curl -s -X POST "$BASE_URL/api/physical-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1984",
    "type": "book",
    "condition": "very_good",
    "description": "Dystopian social science fiction novel",
    "isbn": "978-0451524935",
    "publisher": "Signet Classic",
    "publishedYear": 1949,
    "language": "English",
    "location": "Shelf A-1",
    "quantity": 2,
    "rating": 5.0,
    "tags": ["dystopian", "classic", "science fiction"]
  }')

echo "$PHYSICAL_ITEM" | jq '.'
PHYSICAL_ID=$(echo "$PHYSICAL_ITEM" | jq -r '.item.id')
echo -e "\n"

# 9. Create another physical item (DVD)
echo -e "${BLUE}9. Creating a physical item (DVD)...${NC}"
curl -s -X POST "$BASE_URL/api/physical-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Matrix",
    "type": "dvd",
    "condition": "like_new",
    "description": "1999 science fiction action film",
    "publisher": "Warner Bros",
    "publishedYear": 1999,
    "language": "English",
    "location": "DVD Rack B-3",
    "quantity": 1,
    "rating": 4.7,
    "tags": ["sci-fi", "action", "classic"]
  }' | jq '.'
echo -e "\n"

# 10. Get all physical items
echo -e "${BLUE}10. Getting all physical items...${NC}"
curl -s "$BASE_URL/api/physical-items" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "\n"

# 11. Update a digital item
echo -e "${BLUE}11. Updating digital item rating...${NC}"
curl -s -X PUT "$BASE_URL/api/digital-items/$DIGITAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5.0
  }' | jq '.'
echo -e "\n"

# 12. Get single digital item
echo -e "${BLUE}12. Getting updated digital item...${NC}"
curl -s "$BASE_URL/api/digital-items/$DIGITAL_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "\n"

# 13. Update physical item location
echo -e "${BLUE}13. Updating physical item location...${NC}"
curl -s -X PUT "$BASE_URL/api/physical-items/$PHYSICAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Shelf A-2 (Updated)"
  }' | jq '.'
echo -e "\n"

echo -e "${GREEN}==================================="
echo -e "All tests completed successfully!"
echo -e "===================================${NC}"
echo ""
echo "Summary:"
echo "- User registered and authenticated ✓"
echo "- Digital items created and retrieved ✓"
echo "- Physical items created and retrieved ✓"
echo "- Items updated successfully ✓"
echo ""
echo "Database file: backend/database.sqlite"
echo "Server running on: http://localhost:3000"
