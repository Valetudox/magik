"""
Socket.IO integration tests for backend-socket service.

Tests verify that HTTP POST requests to /api/broadcast trigger Socket.IO emissions
to connected clients. Uses Schemathesis for property-based testing with data
generated from the OpenAPI schema.
"""

import random
import schemathesis
import socketio
from threading import Event
from hypothesis import settings, Phase

# Load OpenAPI schema
# Schema is mounted at /schema/openapi.yaml in the container
# The base URL will be configured via pytest --base-url CLI argument

# Configure Hypothesis to generate more examples
# max_examples=50 means each @schema.parametrize() test will run 50 times with different data
settings.register_profile("ci", max_examples=50, deadline=5000)
settings.load_profile("ci")

# Load schema - Schemathesis automatically includes examples from OpenAPI spec
schema = schemathesis.openapi.from_path("/schema/openapi.yaml")


@schema.parametrize()
def test_api_schema_validation(case, base_url):
    """
    Standard Schemathesis property-based tests for HTTP schema validation.
    Tests all endpoints with both valid and invalid data.
    """
    response = case.call(base_url=base_url)
    case.validate_response(response)


# Use the newer include() API instead of deprecated endpoint/method parameters
@schema.include(path_regex="/api/broadcast$", method="POST").parametrize()
def test_broadcast_with_socket_verification(case, base_url):
    """
    Test that broadcast requests work correctly with Socket.IO integration.

    Uses Schemathesis to generate request data and verifies:
    1. HTTP response status is correct (200 for valid, 400 for invalid)
    2. For valid requests: Socket.IO clients (1-3 randomly) receive message on correct channel
    3. For invalid requests: Socket.IO clients do NOT receive any message
    4. Payload matches when provided
    5. All connected clients receive exactly one message each
    """
    # Skip if not a dict (some edge cases generate non-dict bodies)
    if not isinstance(case.body, dict):
        return

    # Extract channel and payload from Schemathesis-generated test case
    channel = case.body.get("channel", "test-channel")
    expected_payload = case.body.get("payload")

    # Randomly choose number of clients (1-3) to test multi-client scenarios
    num_clients = random.randint(1, 3)

    clients = []
    received_counts = [0] * num_clients
    received_data = [[] for _ in range(num_clients)]
    events = [Event() for _ in range(num_clients)]

    try:
        # Connect multiple Socket.IO clients
        for i in range(num_clients):
            sio = socketio.Client()

            # Create closure to capture client index and data
            def make_handler(idx):
                def handler(data):
                    received_counts[idx] += 1
                    received_data[idx].append(data)
                    events[idx].set()
                return handler

            sio.on(channel, make_handler(i))
            sio.connect(base_url)
            clients.append(sio)

        # Send HTTP POST request
        response = case.call(base_url=base_url)

        # Check response status and Socket.IO behavior
        if response.status_code == 200:
            # Valid request - should emit to Socket.IO
            case.validate_response(response)

            # Wait for all clients to receive the message
            for i, event in enumerate(events):
                received = event.wait(timeout=2.0)
                assert received, f"Client {i} (of {num_clients}) did not receive message on channel '{channel}' within 2 seconds for valid request"

            # Verify each client received exactly one message
            assert all(count == 1 for count in received_counts), \
                f"Expected all {num_clients} clients to receive 1 message, got counts: {received_counts}"

            # Verify payload matches if one was provided
            if expected_payload is not None:
                # Check that all clients received the expected payload
                for i in range(num_clients):
                    assert len(received_data[i]) > 0, f"Client {i} did not receive any data"

                    received = received_data[i][0]

                    # Helper function to compare values with numeric tolerance
                    def values_match(expected, actual):
                        if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
                            # Numeric comparison with tolerance for float/int precision
                            return abs(float(expected) - float(actual)) < 0.01
                        elif isinstance(expected, list) and isinstance(actual, list):
                            # List comparison - recursively compare elements
                            if len(expected) != len(actual):
                                return False
                            return all(values_match(e, a) for e, a in zip(expected, actual))
                        elif isinstance(expected, dict) and isinstance(actual, dict):
                            # Dict comparison - recursively compare values
                            if set(expected.keys()) != set(actual.keys()):
                                return False
                            return all(values_match(expected[k], actual[k]) for k in expected.keys())
                        else:
                            # Exact comparison for other types
                            return expected == actual

                    assert values_match(expected_payload, received), \
                        f"Client {i} payload mismatch: expected {expected_payload}, got {received}"

        elif response.status_code == 400:
            # Invalid request - should NOT emit to Socket.IO
            case.validate_response(response)

            # Wait briefly to ensure no message is received by any client
            for i, event in enumerate(events):
                received = event.wait(timeout=0.5)
                assert not received, f"Client {i} received a Socket.IO message but should not have for invalid request"

            assert all(count == 0 for count in received_counts), \
                f"Expected no events for invalid request, but received counts: {received_counts}"

        else:
            # Unexpected status code
            case.validate_response(response)

    finally:
        # Disconnect all clients
        for sio in clients:
            if sio.connected:
                sio.disconnect()
