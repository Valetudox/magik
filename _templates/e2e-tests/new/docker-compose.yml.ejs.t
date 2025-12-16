---
to: tests/e2e/backend-<%= domain %>-e2e/docker-compose.yml
---
services:
  <%= serviceName %>:
    build:
      context: ../../..
      dockerfile: apps/<%= serviceName %>/Dockerfile
    container_name: <%= serviceName %>-test
    ports:
      - '<%= 10000 + parseInt(port) %>:<%= port %>'
    environment:
      - PORT=<%= port %>
    networks:
      - test-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:<%= port %>/health']
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

  schemathesis:
    image: python:3.12-slim
    container_name: <%= serviceName %>-schemathesis
    depends_on:
      <%= serviceName %>:
        condition: service_healthy
    volumes:
      - ../../../<%= openapiPath %>:/schema/openapi.yaml:ro
      - ./schemathesis-tests:/tests:ro
    working_dir: /tests
    command: >
      sh -c "pip install -q -r requirements.txt &&
             pytest test_<%= domain %>_api.py --base-url=http://<%= serviceName %>:<%= port %> -v --tb=line -rA --hypothesis-show-statistics"
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
