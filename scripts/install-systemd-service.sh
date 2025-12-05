#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVICE_FILE="$PROJECT_ROOT/magik.service"
SYSTEMD_DIR="$HOME/.config/systemd/user"

echo "Installing Magik systemd service..."

# Create user systemd directory if it doesn't exist
mkdir -p "$SYSTEMD_DIR"

# Copy service file
cp "$SERVICE_FILE" "$SYSTEMD_DIR/magik.service"

# Reload systemd daemon
systemctl --user daemon-reload

# Enable service to start on boot
systemctl --user enable magik.service

# Enable lingering (allows user services to run without login)
loginctl enable-linger "$USER"

echo "✓ Service installed successfully!"
echo ""
echo "Commands:"
echo "  Start:   systemctl --user start magik"
echo "  Stop:    systemctl --user stop magik"
echo "  Status:  systemctl --user status magik"
echo "  Logs:    journalctl --user -u magik -f"
echo "  Reload:  systemctl --user reload magik  # For updates"
echo ""
echo "The service will auto-start on system boot."
