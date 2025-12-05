"""
Pytest configuration for configurable base URL.
"""
import pytest


def pytest_addoption(parser):
    """Add custom command line option for base URL."""
    parser.addoption(
        "--base-url",
        action="store",
        default="http://backend-socket:3001",
        help="Base URL for the backend service (default: http://backend-socket:3001 for local Docker testing)",
    )


@pytest.fixture(scope="session")
def base_url(request):
    """Fixture to provide base URL to tests."""
    return request.config.getoption("--base-url")
