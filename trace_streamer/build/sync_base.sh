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
echo $SCRIPT_PATH
function help() {
    echo "Usage: $1 [-p <target_path>]"
    echo "      -p <target_path>, set the sync target path."
    echo "      -h Show the help info."
    exit
}
function parser_param() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -p)
                TARGET_PATH="$2"
                shift 2;;
            -h)
                help $0
                shift;;
            *)
                shift;;
        esac
    done
}
function check_target_path() {
    if [ -z "$TARGET_PATH" ]; then
        echo "target path is empty!"
        help $0
        exit
    fi
}
function set_cur_proj_path() {
    PROJ_PATH=$(dirname "$(readlink -f "$0")")
}