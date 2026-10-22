#!/bin/sh
# Copyright (C) 2026 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# SmartPerf Host 鸿蒙 PC 启动脚本
# 自动签名 main_ohos_arm64 后启动服务
# 用法: ./start-ohos.sh [main_ohos_arm64 的参数, 如 -p 9000 -o 0]

DIR="$(cd "$(dirname "$0")" && pwd)"
BIN="$DIR/main_ohos_arm64"
MARKER="$DIR/.signed"
LOCAL_TOOL="$DIR/binary-sign-tool"

if [ ! -f "$BIN" ]; then
  echo "[start-ohos] ERROR: $BIN not found"
  exit 1
fi

# marker 存在且比二进制新 → 已签名,跳过
if [ -f "$MARKER" ] && [ "$MARKER" -nt "$BIN" ]; then
  echo "[start-ohos] already signed, skip signing"
else
  # 优先用 dist/ 中的本地工具(已预签名),回退到 PATH 中的系统工具
  if [ -f "$LOCAL_TOOL" ]; then
    chmod +x "$LOCAL_TOOL" 2>/dev/null
    SIGN_TOOL="$LOCAL_TOOL"
    echo "[start-ohos] using local binary-sign-tool"
  elif command -v binary-sign-tool >/dev/null 2>&1; then
    SIGN_TOOL="binary-sign-tool"
    echo "[start-ohos] using system binary-sign-tool"
  else
    echo "[start-ohos] ERROR: binary-sign-tool not found"
    echo "[start-ohos] please install DevBox from app store, or run build:prod to download"
    exit 1
  fi

  echo "[start-ohos] signing main_ohos_arm64 ..."
  "$SIGN_TOOL" sign -inFile "$BIN" -outFile "$BIN" -selfSign "1"
  if [ $? -eq 0 ]; then
    touch "$MARKER"
    echo "[start-ohos] signed successfully"
  else
    echo "[start-ohos] signing failed, try to start anyway"
  fi
fi

exec "$BIN" "$@"
