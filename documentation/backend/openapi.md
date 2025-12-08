# OpenAPI Specification

## Required Structure

```yaml
openapi: 3.0.0
info:
  title: Backend {Service} API
  version: 1.0.0
  description: API for {service description}

servers:
  - url: http://localhost:{port}

paths:
  /health:
    get:
      summary: Health check endpoint
      operationId: healthCheck
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: ok
                required:
                  - status

components:
  schemas:
    Error:
      type: object
      properties:
        error:
          type: string
      required:
        - error
```

## Requirements

- MUST use OpenAPI 3.0.0
- MUST include `/health` endpoint definition
- MUST define all endpoints with proper HTTP methods
- MUST include request/response schemas
- MUST define reusable schemas in `components/schemas`
- MUST include error schema
