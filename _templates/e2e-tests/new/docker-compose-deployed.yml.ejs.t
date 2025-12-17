---
to: tests/e2e/backend-<%= domain %>-e2e/docker-compose.deployed.yml
---
services:
  schemathesis:
    image: python:3.12-slim
    container_name: <%= serviceName %>-schemathesis-deployed
    volumes:
      - ../../../<%= openapiPath %>:/schema/openapi.yaml:ro
      - ./schemathesis-tests:/tests:ro
    working_dir: /tests
    command: >
      sh -c "pip install -q -r requirements.txt &&
             pytest test_<%= domain %>_api.py --base-url=http://host.docker.internal:<%= port %> -v --tb=line -rA --hypothesis-show-statistics"
    network_mode: host
