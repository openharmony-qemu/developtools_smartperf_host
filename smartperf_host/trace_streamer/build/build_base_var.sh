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
ext=""
target_os="linux"
gn_path="linux"
is_debug="false"
is_clean="false"
target="trace_streamer"
target_operator=""
target_dir="linux"
gn="gn"
ninja="ninja"
use_local_emsdk="false"
PARAMS=""
enable_plugin_array=("enable_hiperf" "enable_ebpf" "enable_native_hook" "enable_hilog" "enable_hisysevent"
           "enable_arkts" "enable_bytrace" "enable_rawtrace" "enable_htrace" "enable_ffrt" "enable_memory"
           "enable_hidump" "enable_cpudata" "enable_network" "enable_diskio" "enable_process" "enable_xpower")
enable_extend_plugin_array=("enable_stream_extend")
enable_macro_switch_array=("enable_addr2line")
enable_all_plugins_str=""