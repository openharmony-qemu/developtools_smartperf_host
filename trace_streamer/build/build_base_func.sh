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
. build/build_base_var.sh
function help() {
    echo "Usage: $1 [linux/wasm/windows/macx] [debug] [-e <plugin1...>] [-d <plugin1...>]"
    echo "      -e <plugin1,plugin2,plugin3...>, enable the default plugins."
    echo "      -d <plugin1,plugin2,plugin3...>, enable the extend plugins."
    echo "      -l Show the all plugin list."
    echo "      -h Show the help info."
    exit
}
function list_all_plugins() {
    echo "the default support plugin list:"
    for var in "${enable_plugin_array[@]}"; do
        echo "  ${var#enable_}"
    done
    echo "the extend support plugin list:"
    for var in "${enable_extend_plugin_array[@]}"; do
        echo "  ${var#enable_}"
    done
    echo "the default support macro switch list:"
    for var in "${enable_macro_switch_array[@]}"; do
        echo "  ${var#enable_}"
    done
    exit
}
function set_enable_all_plugins_str() {
    for var in "${enable_plugin_array[@]}"; do
        enable_all_plugins_str="$enable_all_plugins_str$var=${!var} "
    done
    for var in "${enable_extend_plugin_array[@]}"; do
        enable_all_plugins_str="$enable_all_plugins_str$var=${!var} "
    done
    for var in "${enable_macro_switch_array[@]}"; do
        enable_all_plugins_str="$enable_all_plugins_str$var=${!var} "
    done
}
function set_enable_plugin_array() {
    for enable_plugin in "${enable_plugin_array[@]}"; do
        eval "$enable_plugin=$1"
    done
}
function set_enable_extend_plugin_array() {
    for enable_extend_plugin in "${enable_extend_plugin_array[@]}"; do
        eval "$enable_extend_plugin=$1"
    done
}
function set_enable_macro_switch_array() {
    for enable_macro in "${enable_macro_switch_array[@]}"; do
        eval "$enable_macro=$1"
    done
}
function choose_os_type() {
    case "$OSTYPE" in
        solaris*) echo "SOLARIS" ;;
        darwin*)  gn_path="macx" target_os="macx" ;;
        linux*)   gn_path="linux" target_os="linux"  ;;
        bsd*)     echo "is bsd os" ;;
        msys*)    gn_path="windows" target_os="windows" gn="gn.exe" ninja="ninja.exe"  ;;
        *)        echo "unknown: $OSTYPE" ;;
    esac
}