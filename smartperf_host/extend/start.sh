#!/bin/bash
# HarmonyOS PC startup script for extend service
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

cd "$SCRIPT_DIR"
node windows-service.js
