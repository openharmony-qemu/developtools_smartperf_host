#!/bin/bash
# Copyright (c) Huawei Technologies Co., Ltd. 2023. All rights reserved.
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
set -e
. build/build_base_func.sh
function prepare_windows() {
    if [ "$target_os" == "windows" ];then
        cp .gn_win .gn
    else
        cp .gn_unix .gn
    fi
    if [ "$1" == "windows" ] && [ "$2" == "release" ];then
        echo "gn only support linux and wasm build currently"
        if [ ! -d "out/windows" ];then
            mkdir out/windows
        fi
        touch out/windows/trace_streamer.exe
        exit
    fi
}
function prepare_proto() {
    TARGET_DIR=$1
    if [[ "$PARAMS" == *"debug"* ]]; then
        TARGET_DIR=$1"_debug"
    fi
    if [ ! -f "out/$TARGET_DIR/protoc" ];then
        ./build.sh protoc
        mkdir -p out/"$TARGET_DIR"
        cp out/$target_os/protoc out/"$TARGET_DIR"/protoc
    fi
    if [ ! -f "out/$TARGET_DIR/protoreader_plugin" ] && [ -f "out/$TARGET_DIR/protoc" ];then
        ./build.sh spb
        mkdir -p out/"$TARGET_DIR"
        cp out/$target_os/protoreader_plugin out/"$TARGET_DIR"/protoreader_plugin
    fi
}
function check_params() {
    if [[ "$1" == "" || "$1" == -* ]]; then
        echo "Option '$1' is not reasonable." >&2
        exit 1
    fi
}