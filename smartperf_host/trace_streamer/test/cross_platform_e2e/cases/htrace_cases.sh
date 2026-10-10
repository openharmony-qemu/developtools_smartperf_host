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

HTRACE_LARGE_FILE_THRESHOLD_MB=100

run_htrace_cases() {
    local ref_platform="$1"
    local target_platform="$2"
    local compare_mode="$3"
    local resource_dir
    resource_dir=$(get_resource_dir)
    log_section "Htrace (Protobuf) Format Cross-Platform Tests"

    local htrace_files=(
        "callstack_compression.htrace"
        "ebpf_bio.htrace"
        "Mmap.htrace"
        "pbreader_ffrt.htrace"
        "zlib.htrace"
        "hiprofiler_data_ability.htrace"
        "offline_symbolization_statistical_data.htrace"
    )
    for hfile in "${htrace_files[@]}"; do
        local file_path="$resource_dir/$hfile"
        local case_name="htrace_${hfile%.htrace}"
        if [[ -f "$file_path" ]]; then
            run_cross_platform_comparison \
                "$file_path" \
                "$case_name" \
                "$ref_platform" \
                "$target_platform" \
                "$compare_mode"
        else
            record_result "$case_name" "skip" "input not found: $file_path"
        fi
    done

    run_htrace_large_file "$resource_dir" "$ref_platform" \
        "$target_platform" "$compare_mode"
}

run_htrace_large_file() {
    local resource_dir="$1"
    local ref_platform="$2"
    local target_platform="$3"
    local compare_mode="$4"
    local large_file="$resource_dir/pbreader.htrace"
    if [[ -f "$large_file" ]]; then
        local file_size
        file_size=$(du -m "$large_file" | cut -f1)
        if [[ "$file_size" -gt "$HTRACE_LARGE_FILE_THRESHOLD_MB" ]]; then
            log_warn "pbreader.htrace is ${file_size}MB, running may take long"
        fi
        run_cross_platform_comparison \
            "$large_file" \
            "htrace_pbreader_large" \
            "$ref_platform" \
            "$target_platform" \
            "$compare_mode"
    else
        record_result "htrace_pbreader_large" "skip" "large htrace not found"
    fi
}

run_htrace_single_platform() {
    local platform="$1"
    local resource_dir
    resource_dir=$(get_resource_dir)
    log_section "Htrace Single-Platform Tests ($platform)"

    local htrace_files=(
        "callstack_compression.htrace"
        "ebpf_bio.htrace"
        "Mmap.htrace"
        "pbreader_ffrt.htrace"
        "zlib.htrace"
        "hiprofiler_data_ability.htrace"
        "offline_symbolization_statistical_data.htrace"
    )
    for hfile in "${htrace_files[@]}"; do
        local file_path="$resource_dir/$hfile"
        local case_name="htrace_${hfile%.htrace}_$platform"
        if [[ -f "$file_path" ]]; then
            run_single_platform "$platform" "$file_path" "$case_name" "0"
        else
            record_result "$case_name" "skip" "input not found: $file_path"
        fi
    done

    local large_file="$resource_dir/pbreader.htrace"
    if [[ -f "$large_file" ]]; then
        run_single_platform "$platform" "$large_file" "htrace_pbreader_large_$platform" "0"
    else
        record_result "htrace_pbreader_large_$platform" "skip" "large htrace not found"
    fi
}
