---
to: tests/e2e/backend-<%= domain %>-e2e/schemathesis-tests/conftest.py
---
import pytest

def pytest_addoption(parser):
    parser.addoption(
        "--base-url",
        action="store",
        default="http://localhost:<%= port %>",
        help="Base URL for the API under test"
    )

@pytest.fixture
def base_url(request):
    return request.config.getoption("--base-url")
