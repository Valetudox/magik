import pytest

def pytest_addoption(parser):
    parser.addoption(
        "--base-url",
        action="store",
        default="http://backend-audio:3002",
        help="Base URL for the backend service"
    )

@pytest.fixture(scope="session")
def base_url(request):
    return request.config.getoption("--base-url")
