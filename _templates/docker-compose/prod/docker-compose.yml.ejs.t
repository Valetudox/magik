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
<%_ Object.keys(uis).forEach(uiKey => { _%>
<%_ const uiName = uiKey.replace('UI_', 'ui-').toLowerCase(); _%>
      <%= uiName %>:
        condition: service_healthy
<%_ }); _%>
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
<%_ Object.entries(uis).forEach(([uiKey, uiConfig]) => { _%>
<%_ const uiName = uiKey.replace('UI_', 'ui-').toLowerCase(); _%>
<%_ const domain = uiKey.replace('UI_', '').toLowerCase(); _%>
  # UI <%= domain.charAt(0).toUpperCase() + domain.slice(1) %> Frontend
  <%= uiName %>:
    image: ${DOCKER_REGISTRY:-localhost:5000}/magik-<%= uiName %>:latest
    build:
      context: .
      dockerfile: apps/<%= uiName %>/Dockerfile
    container_name: magik-<%= uiName %>
    networks:
      - magik-network
    depends_on:
<%_ uiConfig.dependsOn.forEach(dep => { _%>
      <%= dep %>:
        condition: service_healthy
<%_ }); _%>
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

<%_ }); _%>

networks:
  magik-network:
    driver: bridge
