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

run_bytrace_cases() {
    local ref_platform="$1"
    local target_platform="$2"
    local compare_mode="$3"
    local resource_dir
    resource_dir=$(get_resource_dir)
    log_section "Bytrace Format Cross-Platform Tests"

    local bytrace_full="$resource_dir/ut_bytrace_input_full.txt"
    if [[ -f "$bytrace_full" ]]; then
        run_cross_platform_comparison \
            "$bytrace_full" \
            "bytrace_full" \
            "$ref_platform" \
            "$target_platform" \
            "$compare_mode"
    else
        record_result "bytrace_full" "skip" "input not found: $bytrace_full"
    fi

    local bytrace_thread="$resource_dir/ut_bytrace_input_thread.txt"
    if [[ -f "$bytrace_thread" ]]; then
        run_cross_platform_comparison \
            "$bytrace_thread" \
            "bytrace_thread" \
            "$ref_platform" \
            "$target_platform" \
            "$compare_mode"
    else
        record_result "bytrace_thread" "skip" "input not found: $bytrace_thread"
    fi

    local systrace_file="$resource_dir/trace_small_10.systrace"
    if [[ -f "$systrace_file" ]]; then
        run_cross_platform_comparison \
            "$systrace_file" \
            "bytrace_systrace" \
            "$ref_platform" \
            "$target_platform" \
            "$compare_mode"
    else
        record_result "bytrace_systrace" "skip" "input not found: $systrace_file"
    fi
}

run_bytrace_single_platform() {
    local platform="$1"
    local resource_dir
    resource_dir=$(get_resource_dir)
    log_section "Bytrace Single-Platform Tests ($platform)"

    local bytrace_full="$resource_dir/ut_bytrace_input_full.txt"
    if [[ -f "$bytrace_full" ]]; then
        run_single_platform "$platform" "$bytrace_full" "bytrace_full_$platform" "0"
    else
        record_result "bytrace_full_$platform" "skip" "input not found"
    fi

    local bytrace_thread="$resource_dir/ut_bytrace_input_thread.txt"
    if [[ -f "$bytrace_thread" ]]; then
        run_single_platform "$platform" "$bytrace_thread" "bytrace_thread_$platform" "0"
    else
        record_result "bytrace_thread_$platform" "skip" "input not found"
    fi

    local systrace_file="$resource_dir/trace_small_10.systrace"
    if [[ -f "$systrace_file" ]]; then
        run_single_platform "$platform" "$systrace_file" "bytrace_systrace_$platform" "0"
    else
        record_result "bytrace_systrace_$platform" "skip" "input not found"
    fi
}
