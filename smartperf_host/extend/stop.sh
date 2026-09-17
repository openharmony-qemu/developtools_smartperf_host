#!/bin/bash
# HarmonyOS PC stop script for extend service
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DAEMON_PATH="$SCRIPT_DIR/daemon"

# Stop the extend service process
pkill -f "windows-service.js" 2>/dev/null

# Clean up daemon directory
if [ -d "$DAEMON_PATH" ]; then
    rm -rf "$DAEMON_PATH"
fi
