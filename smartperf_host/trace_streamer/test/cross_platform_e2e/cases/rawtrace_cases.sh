#!/bin/bash
# Copyright (c) Huawei Technologies Co., Ltd. 2024. All rights reserved.
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

run_rawtrace_cases() {
    local ref_platform="$1"
    local target_platform="$2"
    local compare_mode="$3"
    local resource_dir
    resource_dir=$(get_resource_dir)
    log_section "Rawtrace Format Cross-Platform Tests"

    local rawtrace_bin="$resource_dir/rawtrace.bin"
    if [[ -f "$rawtrace_bin" ]]; then
        run_cross_platform_comparison \
            "$rawtrace_bin" \
            "rawtrace_bin" \
            "$ref_platform" \
            "$target_platform" \
            "$compare_mode"
    else
        record_result "rawtrace_bin" "skip" "input not found: $rawtrace_bin"
    fi

    local rawtrace_data="$resource_dir/rawtrace.data"
    if [[ -f "$rawtrace_data" ]]; then
        run_cross_platform_comparison \
            "$rawtrace_data" \
            "rawtrace_data" \
            "$ref_platform" \
            "$target_platform" \
            "$compare_mode"
    else
        record_result "rawtrace_data" "skip" "input not found: $rawtrace_data"
    fi

    local htrace_bin="$resource_dir/htrace.bin"
    if [[ -f "$htrace_bin" ]]; then
        run_cross_platform_comparison \
            "$htrace_bin" \
            "rawtrace_htrace_bin" \
            "$ref_platform" \
            "$target_platform" \
            "$compare_mode"
    else
        record_result "rawtrace_htrace_bin" "skip" "input not found: $htrace_bin"
    fi

    local perf_data="$resource_dir/perfCompressed.data"
    if [[ -f "$perf_data" ]]; then
        run_cross_platform_comparison \
            "$perf_data" \
            "rawtrace_perf_compressed" \
            "$ref_platform" \
            "$target_platform" \
            "$compare_mode"
    else
        record_result "rawtrace_perf_compressed" "skip" "input not found: $perf_data"
    fi
}

run_rawtrace_single_platform() {
    local platform="$1"
    local resource_dir
    resource_dir=$(get_resource_dir)
    log_section "Rawtrace Single-Platform Tests ($platform)"

    local rawtrace_bin="$resource_dir/rawtrace.bin"
    if [[ -f "$rawtrace_bin" ]]; then
        run_single_platform "$platform" "$rawtrace_bin" "rawtrace_bin_$platform" "0"
    else
        record_result "rawtrace_bin_$platform" "skip" "input not found"
    fi

    local rawtrace_data="$resource_dir/rawtrace.data"
    if [[ -f "$rawtrace_data" ]]; then
        run_single_platform "$platform" "$rawtrace_data" "rawtrace_data_$platform" "0"
    else
        record_result "rawtrace_data_$platform" "skip" "input not found"
    fi
}
