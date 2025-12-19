import pytest

def pytest_addoption(parser):
    parser.addoption(
        "--base-url",
        action="store",
        default="http://localhost:3000",
        help="Base URL for the API under test"
    )

@pytest.fixture
def base_url(request):
    return request.config.getoption("--base-url")
