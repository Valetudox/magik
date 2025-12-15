#!/usr/bin/env bash

set -e

# Create temporary directory
TMP_DIR=$(mktemp -d)
echo "Creating temporary directory: $TMP_DIR"

# Create docs subdirectory
mkdir -p "$TMP_DIR/docs"

# Copy and convert OpenAPI YAML files to JSON
echo "Converting OpenAPI files to JSON..."
python3 -c "import json, yaml; json.dump(yaml.safe_load(open('specs/domains/audio/openapi.yaml')), open('$TMP_DIR/docs/backend-audio.json', 'w'), indent=2)"
python3 -c "import json, yaml; json.dump(yaml.safe_load(open('specs/domains/socket/openapi.yaml')), open('$TMP_DIR/docs/backend-socket.json', 'w'), indent=2)"
python3 -c "import json, yaml; json.dump(yaml.safe_load(open('specs/domains/decision/openapi.yaml')), open('$TMP_DIR/docs/backend-decision.json', 'w'), indent=2)"

# Create index.html with tabs for multiple APIs
echo "Creating index.html..."
cat > "$TMP_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Magik API Documentation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    .nav {
      position: sticky;
      top: 0;
      background: #1a202c;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    .nav h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      margin-right: auto;
    }
    .nav button {
      background: transparent;
      border: 2px solid rgba(255,255,255,0.2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .nav button:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.4);
    }
    .nav button.active {
      background: #4F46E5;
      border-color: #4F46E5;
    }
    #redoc {
      height: calc(100vh - 60px);
    }
  </style>
</head>
<body>
  <div class="nav">
    <h1>Magik API Documentation</h1>
    <button onclick="loadAPI('audio')" id="btn-audio">Backend Audio</button>
    <button onclick="loadAPI('socket')" id="btn-socket">Backend Socket</button>
    <button onclick="loadAPI('decision')" id="btn-decision" class="active">Backend Decision</button>
  </div>
  <div id="redoc"></div>

  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    const apis = {
      audio: '/docs/backend-audio.json',
      socket: '/docs/backend-socket.json',
      decision: '/docs/backend-decision.json'
    };

    let currentAPI = 'decision';

    function loadAPI(apiName) {
      if (currentAPI === apiName) return;

      currentAPI = apiName;

      // Update button states
      document.querySelectorAll('.nav button').forEach(btn => {
        btn.classList.remove('active');
      });
      document.getElementById('btn-' + apiName).classList.add('active');

      // Load the API
      Redoc.init(apis[apiName], {
        scrollYOffset: 60,
        hideDownloadButton: false,
        theme: {
          colors: {
            primary: {
              main: '#4F46E5'
            }
          }
        }
      }, document.getElementById('redoc'));
    }

    // Load default API
    loadAPI('decision');
  </script>
</body>
</html>
EOF

echo "Starting server on http://localhost:3333"
echo "Press Ctrl+C to stop the server and clean up"

# Cleanup function
cleanup() {
  echo ""
  echo "Cleaning up temporary directory: $TMP_DIR"
  rm -rf "$TMP_DIR"
  exit 0
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start server with bunx serve
cd "$TMP_DIR"
bunx serve . -p 3333 --cors
