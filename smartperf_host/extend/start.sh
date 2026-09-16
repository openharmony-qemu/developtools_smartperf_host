#!/bin/bash
# HarmonyOS PC startup script for extend service
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DAEMON_PATH="$SCRIPT_DIR/daemon"

if [ -d "$DAEMON_PATH" ]; then
    rm -rf "$DAEMON_PATH"
fi

cd "$SCRIPT_DIR"
node windows-service.js
