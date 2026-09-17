#!/bin/bash
# HarmonyOS PC stop script for extend service
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# Stop the extend service process
pkill -f "windows-service.js" 2>/dev/null
