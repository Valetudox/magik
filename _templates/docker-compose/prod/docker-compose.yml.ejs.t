services:
  # Nginx Gateway
  gateway:
    image: ${DOCKER_REGISTRY:-localhost:5000}/magik-gateway:latest
    build:
      context: .
      dockerfile: apps/gateway/Dockerfile
    container_name: magik-gateway
    ports:
      - '80:80'
    networks:
      - magik-network
    depends_on:
<%_ Object.keys(services).forEach(serviceKey => { _%>
<%_ const serviceName = serviceKey.replace('BACKEND_', 'backend-').toLowerCase(); _%>
      <%= serviceName %>:
        condition: service_healthy
<%_ }); _%>
      ui-decision:
        condition: service_healthy
      ui-audio:
        condition: service_healthy
      ui-specification:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://127.0.0.1/health']
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

<%_ Object.entries(services).forEach(([serviceKey, serviceConfig]) => { _%>
<%_ const serviceName = serviceKey.replace('BACKEND_', 'backend-').toLowerCase(); _%>
<%_ const domain = serviceKey.replace('BACKEND_', '').toLowerCase(); _%>
  # Backend <%= domain.charAt(0).toUpperCase() + domain.slice(1) %> API
  <%= serviceName %>:
    image: ${DOCKER_REGISTRY:-localhost:5000}/magik-<%= serviceName %>:latest
    build:
      context: .
      dockerfile: apps/<%= serviceName %>/Dockerfile
    container_name: magik-<%= serviceName %>
    environment:
      - PORT=<%= serviceConfig.prod %>
<%_ if (serviceName === 'backend-decision') { _%>
      - SOCKET_SERVER_URL=http://backend-socket:3001
      - DECISIONS_DIR=/data/decisions
      - NODE_ENV=production
      - CLAUDE_CODE_OAUTH_TOKEN=${CLAUDE_CODE_OAUTH_TOKEN}
<%_ } else if (serviceName === 'backend-audio') { _%>
      - RECORDINGS_DIR=/data/recordings
      - NODE_ENV=production
<%_ } else if (serviceName === 'backend-specification') { _%>
      - SPECIFICATIONS_DIR=/data/specifications
      - NODE_ENV=production
<%_ } else if (serviceName === 'backend-tabledocument') { _%>
      - TABLE_DOCUMENTS_DIR=/data/table-documents
      - NODE_ENV=production
<%_ } else { _%>
      - NODE_ENV=production
<%_ } _%>
<%_ if (serviceName === 'backend-decision') { _%>
    volumes:
      - ${DECISIONS_DIR:-/home/magic/Documents/decisions}:/data/decisions
      - ${HOME}/.config/claude-code:/root/.config/claude-code
<%_ } else if (serviceName === 'backend-audio') { _%>
    volumes:
      - ${RECORDINGS_DIR:-/home/magic/Documents/recordings}:/data/recordings
<%_ } else if (serviceName === 'backend-specification') { _%>
    volumes:
      - ${SPECIFICATIONS_DIR:-/home/magic/repositories/magik/specs}:/data/specifications:ro
<%_ } else if (serviceName === 'backend-tabledocument') { _%>
    volumes:
      - ${TABLE_DOCUMENTS_DIR:-/home/magic/Documents/table-documents}:/data/table-documents
<%_ } _%>
    networks:
      - magik-network
<%_ if (serviceName === 'backend-decision') { _%>
    depends_on:
      backend-socket:
        condition: service_healthy
<%_ } _%>
    restart: unless-stopped
    healthcheck:
<%_ if (serviceName === 'backend-socket') { _%>
      test: ['CMD', 'curl', '-f', 'http://localhost:<%= serviceConfig.prod %>/health']
<%_ } else { _%>
      test: ['CMD', 'curl', '-f', 'http://localhost:<%= serviceConfig.prod %><%= serviceConfig.apiRoute %>']
<%_ } _%>
      interval: 10s
      timeout: 3s
      retries: 5
<%_ if (serviceName === 'backend-decision' || serviceName === 'backend-specification') { _%>
      start_period: 20s
<%_ } else { _%>
      start_period: 15s
<%_ } _%>
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

<%_ }); _%>
  # UI Decision Frontend
  ui-decision:
    image: ${DOCKER_REGISTRY:-localhost:5000}/magik-ui-decision:latest
    build:
      context: .
      dockerfile: apps/ui-decision/Dockerfile
    container_name: magik-ui-decision
    networks:
      - magik-network
    depends_on:
      backend-decision:
        condition: service_healthy
      backend-socket:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://127.0.0.1/']
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  # UI Audio Frontend
  ui-audio:
    image: ${DOCKER_REGISTRY:-localhost:5000}/magik-ui-audio:latest
    build:
      context: .
      dockerfile: apps/ui-audio/Dockerfile
    container_name: magik-ui-audio
    networks:
      - magik-network
    depends_on:
      backend-audio:
        condition: service_healthy
      backend-socket:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://127.0.0.1/']
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  # UI Specification Frontend
  ui-specification:
    image: ${DOCKER_REGISTRY:-localhost:5000}/magik-ui-specification:latest
    build:
      context: .
      dockerfile: apps/ui-specification/Dockerfile
    container_name: magik-ui-specification
    networks:
      - magik-network
    depends_on:
      backend-specification:
        condition: service_healthy
      backend-socket:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://127.0.0.1/']
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

networks:
  magik-network:
    driver: bridge
