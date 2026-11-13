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
. build/build_base.sh

function check_plugin_true() {
    if [ "$1" == "false" ];then
        echo "Current plugins haven't '$2'!Please check!"
        exit
    fi
}

function enable_plugin() {
    check_params $1
    set_enable_plugin_array "false"
    IFS=',' read -ra plugins <<< "$1"
    local flag='false'
    for plugin in "${plugins[@]}"; do
        for enable_plugin in "${enable_plugin_array[@]}"; do
            if [[ "$enable_plugin" == *"$plugin"* ]]; then
                eval "$enable_plugin=\"true\""
                echo "$enable_plugin=${!enable_plugin}"
                flag="true"
            fi
        done
        check_plugin_true $flag $plugin
        flag="false"
    done
}

function enable_extend_plugin() {
    check_params "$1"
    set_enable_extend_plugin_array "false"
    read -ra plugins <<< "$1"
    local flag_extend='false'
    for plugin in "${plugins[@]}"; do
        for enable_extend_plugin in "${enable_extend_plugin_array[@]}"; do
            if [[ "$enable_extend_plugin" == *"$plugin"* ]]; then
                eval "$enable_extend_plugin=\"true\""
                echo "$enable_extend_plugin=${!enable_extend_plugin}"
                flag_extend="true"
            fi
        done
        check_plugin_true $flag_extend $plugin
        flag_extend="false"
    done
}

function enable_macro() {
    check_params $1
    set_enable_macro_switch_array "false"
    IFS=',' read -ra macro_switchs <<< "$1"
    local flag='false'
    for macro_switch in "${macro_switchs[@]}"; do
        for enable_macro_switch in "${enable_macro_switch_array[@]}"; do
            if [[ "$enable_macro_switch" == *"$macro_switch"* ]]; then
                eval "$enable_macro_switch=\"true\""
                echo "$enable_macro_switch=${!enable_macro_switch}"
                flag="true"
            fi
        done
        check_plugin_true $flag $macro_switch
        flag="false"
    done
}

