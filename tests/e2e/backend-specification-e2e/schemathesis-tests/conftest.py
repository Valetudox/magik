import pytest


def pytest_addoption(parser):
    """Add custom command line options."""
    parser.addoption(
        "--base-url",
        action="store",
        default="http://localhost:4002",
        help="Base URL for the API under test"
    )


@pytest.fixture(scope="session")
def base_url(request):
    """Provide the base URL for tests."""
    return request.config.getoption("--base-url")
