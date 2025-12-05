"""
End-to-end tests for the Specification API using Schemathesis.

This test suite performs property-based testing against the OpenAPI schema,
validating that all endpoints conform to their schema definitions.
"""

import schemathesis
from hypothesis import settings

# Configure Hypothesis settings for CI environment
settings.register_profile("ci", max_examples=50, deadline=5000)
settings.load_profile("ci")

# Load the OpenAPI schema
schema = schemathesis.openapi.from_path("/schema/openapi.yaml")


@schema.parametrize()
def test_api_schema_validation(case, base_url):
    """
    Property-based test that validates all API endpoints against the OpenAPI schema.
    Schemathesis will generate test cases for all possible inputs.
    """
    response = case.call(base_url=base_url)
    try:
        # Validate response schema
        case.validate_response(response, checks=(
            schemathesis.checks.response_schema_conformance,
        ))
    except Exception as e:
        # Write detailed error to file for debugging
        with open("/tmp/validation_errors.log", "a") as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"VALIDATION ERROR\n")
            f.write(f"Endpoint: {case.method} {case.path}\n")
            f.write(f"Status: {response.status_code}\n")
            f.write(f"Response: {response.text}\n")
            f.write(f"Error: {str(e)}\n")
            f.write(f"{'='*60}\n")
        raise
