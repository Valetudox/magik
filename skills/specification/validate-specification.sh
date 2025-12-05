#!/usr/bin/env bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/specification-schema.json"
EARS_SCHEMA_FILE="$SCRIPT_DIR/ears-schema.json"

# Check if filename argument is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No filename provided${NC}"
    echo "Usage: $0 <specification-file.json>"
    exit 1
fi

SPEC_FILE="$1"

# Check if the specification file exists
if [ ! -f "$SPEC_FILE" ]; then
    echo -e "${RED}Error: File '$SPEC_FILE' does not exist${NC}"
    exit 1
fi

# Check if the schema files exist
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Error: Schema file not found at '$SCHEMA_FILE'${NC}"
    exit 1
fi

if [ ! -f "$EARS_SCHEMA_FILE" ]; then
    echo -e "${RED}Error: EARS schema file not found at '$EARS_SCHEMA_FILE'${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js to run this validation script."
    exit 1
fi

echo -e "${YELLOW}Validating specification file: $SPEC_FILE${NC}"
echo "Against schema: $SCHEMA_FILE"
echo "With reference: $EARS_SCHEMA_FILE"
echo ""

# Use Node.js to validate with proper schema references
# This approach works better than ajv-cli for schemas with $ref
set +e  # Temporarily disable exit on error to capture validation output
VALIDATION_OUTPUT=$(node -e "
const Ajv = require('ajv');
const fs = require('fs');

try {
  const ajv = new Ajv({strict: false, allErrors: true});
  const earsSchema = JSON.parse(fs.readFileSync('$EARS_SCHEMA_FILE', 'utf8'));
  const specSchema = JSON.parse(fs.readFileSync('$SCHEMA_FILE', 'utf8'));
  const specData = JSON.parse(fs.readFileSync('$SPEC_FILE', 'utf8'));

  ajv.addSchema(earsSchema, 'ears-schema.json');
  const validate = ajv.compile(specSchema);
  const valid = validate(specData);

  if (valid) {
    console.log('VALID');
    process.exit(0);
  } else {
    console.log('INVALID');
    console.log(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  }
} catch (error) {
  console.log('ERROR');
  console.log(error.message);
  process.exit(2);
}
" 2>&1)

VALIDATION_STATUS=$?
set -e  # Re-enable exit on error

# Check the result
if [ $VALIDATION_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Validation successful!${NC}"
    echo -e "${GREEN}The specification file is valid according to the EARS schema.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Validation failed!${NC}"
    echo -e "${RED}The specification file does not conform to the EARS schema.${NC}"
    echo ""
    echo "Validation errors:"
    echo "$VALIDATION_OUTPUT" | tail -n +2
    exit 1
fi
