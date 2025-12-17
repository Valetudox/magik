import schemathesis
from hypothesis import settings

# Configure Hypothesis
settings.register_profile("ci", max_examples=50, deadline=5000)
settings.load_profile("ci")

# Load schema
schema = schemathesis.openapi.from_path("/schema/openapi.yaml")

@schema.parametrize()
def test_api_schema_validation(case, base_url):
    """
    Property-based test that validates all API endpoints against the OpenAPI schema.
    Schemathesis will generate test cases for all possible inputs.
    """
    response = case.call(base_url=base_url)
    case.validate_response(response)
