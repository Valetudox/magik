import schemathesis
from hypothesis import settings

# Configure Hypothesis
settings.register_profile("ci", max_examples=50, deadline=5000)
settings.load_profile("ci")

# Load schema with explicit validation - allow server errors as they're documented in the schema
schema = schemathesis.openapi.from_path(
    "/schema/openapi.yaml",
    validate_schema=True
)

@schema.parametrize()
def test_api_schema_validation(case, base_url):
    """
    Property-based test that validates all API endpoints against the OpenAPI schema.
    Schemathesis will generate test cases for all possible inputs.
    """
    response = case.call(base_url=base_url)
    try:
        # Validate response schema only - don't fail on 5xx status codes
        # since they are documented in the OpenAPI spec
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
