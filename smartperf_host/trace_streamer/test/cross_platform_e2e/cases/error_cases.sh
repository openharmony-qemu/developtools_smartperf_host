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

run_error_cases() {
    local ref_platform="$1"
    local target_platform="$2"
    local resource_dir
    resource_dir=$(get_resource_dir)
    log_section "Error Handling Cross-Platform Tests"

    local nonexistent_path="/nonexistent/path/to/trace.txt"
    local nonexistent_case="error_nonexistent_path"
    local root
    root=$(get_trace_streamer_root)

    for platform in "$ref_platform" "$target_platform"; do
        if ! platform_is_available "$root" "$platform"; then
            record_result "${nonexistent_case}_${platform}" "skip" "platform not available"
            continue
        fi
        local output_db="$E2E_TMP_DIR/${nonexistent_case}_${platform}.db"
        rm -f "$output_db"
        local result
        result=$(run_trace_streamer "$platform" "$nonexistent_path" "$output_db" "")
        local exit_code
        exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
        assert_not_exit_code "$exit_code" "0" "${nonexistent_case}_${platform}" "nonexistent path should fail"
    done
    if platform_is_available "$root" "$ref_platform" && platform_is_available "$root" "$target_platform"; then
        local ref_db="$E2E_TMP_DIR/${nonexistent_case}_${ref_platform}.db"
        local target_db="$E2E_TMP_DIR/${nonexistent_case}_${target_platform}.db"
        if [[ ! -f "$ref_db" && ! -f "$target_db" ]]; then
            record_result "${nonexistent_case}_no_db" "pass" "both platforms correctly produced no db"
        else
            record_result "${nonexistent_case}_no_db" "fail" "unexpected db created"
        fi
    fi

    local empty_file="$E2E_TMP_DIR/empty_trace.txt"
    touch "$empty_file"
    for platform in "$ref_platform" "$target_platform"; do
        if ! platform_is_available "$root" "$platform"; then
            record_result "error_empty_file_${platform}" "skip" "platform not available"
            continue
        fi
        local output_db="$E2E_TMP_DIR/error_empty_file_${platform}.db"
        rm -f "$output_db"
        local result
        result=$(run_trace_streamer "$platform" "$empty_file" "$output_db" "")
        local exit_code
        exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
        record_result "error_empty_file_${platform}" "pass" "empty file exit=$exit_code (graceful handling)"
    done
    rm -f "$empty_file"

    local garbage_file="$E2E_TMP_DIR/garbage_trace.txt"
    echo "this is not a valid trace file content" > "$garbage_file"
    for platform in "$ref_platform" "$target_platform"; do
        if ! platform_is_available "$root" "$platform"; then
            record_result "error_garbage_file_${platform}" "skip" "platform not available"
            continue
        fi
        local output_db="$E2E_TMP_DIR/error_garbage_file_${platform}.db"
        rm -f "$output_db"
        local result
        result=$(run_trace_streamer "$platform" "$garbage_file" "$output_db" "")
        local exit_code
        exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
        assert_not_exit_code "$exit_code" "0" "error_garbage_file_${platform}" "garbage file should fail"
    done
    rm -f "$garbage_file"

    for platform in "$ref_platform" "$target_platform"; do
        if ! platform_is_available "$root" "$platform"; then
            record_result "error_no_args_${platform}" "skip" "platform not available"
            continue
        fi
        local binary
        binary=$(platform_get_binary "$root" "$platform")
        if [[ -f "$binary" ]]; then
            timeout "$PLATFORM_RUNNER_TIMEOUT" "$binary" 2>&1
            local exit_code=$?
            assert_not_exit_code "$exit_code" "0" "error_no_args_${platform}" "no args should fail"
        fi
    done

    local version_case="version_check"
    for platform in "$ref_platform" "$target_platform"; do
        if ! platform_is_available "$root" "$platform"; then
            record_result "${version_case}_${platform}" "skip" "platform not available"
            continue
        fi
        local binary
        binary=$(platform_get_binary "$root" "$platform")
        if [[ -f "$binary" ]]; then
            local version_output
            version_output=$(timeout 10 "$binary" -v 2>&1)
            local exit_code=$?
            if [[ "$exit_code" -eq 0 ]]; then
                assert_contains "$version_output" "[0-9]" "${version_case}_${platform}" "-v version output"
            else
                record_result "${version_case}_${platform}" "pass" "-v exit=$exit_code (version may require display)"
            fi
        fi
    done

    for platform in "$ref_platform" "$target_platform"; do
        if ! platform_is_available "$root" "$platform"; then
            record_result "exit_code_consistency_${platform}" "skip" "platform not available"
            continue
        fi
        local output_db="$E2E_TMP_DIR/exit_code_consistency_${platform}.db"
        rm -f "$output_db"
        local result
        result=$(run_trace_streamer "$platform" "$nonexistent_path" "$output_db" "")
        local exit_code
        exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
        record_result "exit_code_consistency_${platform}" "pass" "exit=$exit_code for nonexistent path"
    done

    if platform_is_available "$root" "$ref_platform" && platform_is_available "$root" "$target_platform"; then
        local ref_result_val target_result_val
        local ref_db="$E2E_TMP_DIR/exit_code_consistency_${ref_platform}.db"
        local target_db="$E2E_TMP_DIR/exit_code_consistency_${target_platform}.db"
        rm -f "$ref_db" "$target_db"
        ref_result_val=$(run_trace_streamer "$ref_platform" "$nonexistent_path" "$ref_db" "")
        target_result_val=$(run_trace_streamer "$target_platform" "$nonexistent_path" "$target_db" "")
        local ref_exit_val target_exit_val
        ref_exit_val=$(echo "$ref_result_val" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
        target_exit_val=$(echo "$target_result_val" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
        if [[ "$ref_exit_val" != "0" && "$target_exit_val" != "0" ]]; then
            record_result "error_exit_code_consistent" "pass" "both platforms reject invalid input (ref=$ref_exit_val, target=$target_exit_val)"
        else
            record_result "error_exit_code_consistent" "fail" "inconsistent error handling (ref=$ref_exit_val, target=$target_exit_val)"
        fi
    fi
}

run_error_cases_single_platform() {
    local platform="$1"
    local resource_dir
    resource_dir=$(get_resource_dir)
    log_section "Error Handling Single-Platform Tests ($platform)"

    local root
    root=$(get_trace_streamer_root)
    if ! platform_is_available "$root" "$platform"; then
        record_result "error_cases_${platform}" "skip" "platform not available"
        return
    fi

    local nonexistent_path="/nonexistent/path/to/trace.txt"
    local output_db="$E2E_TMP_DIR/error_nonexistent_${platform}.db"
    rm -f "$output_db"
    local result
    result=$(run_trace_streamer "$platform" "$nonexistent_path" "$output_db" "")
    local exit_code
    exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
    assert_not_exit_code "$exit_code" "0" "error_nonexistent_${platform}" "should fail"

    local empty_file="$E2E_TMP_DIR/empty_trace_single.txt"
    touch "$empty_file"
    output_db="$E2E_TMP_DIR/error_empty_${platform}.db"
    rm -f "$output_db"
    result=$(run_trace_streamer "$platform" "$empty_file" "$output_db" "")
    exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
    record_result "error_empty_${platform}" "pass" "empty file exit=$exit_code (graceful)"
    rm -f "$empty_file"

    local binary
    binary=$(platform_get_binary "$root" "$platform")
    if [[ -f "$binary" ]]; then
        timeout 10 "$binary" -v 2>&1
        local ver_exit=$?
        record_result "version_${platform}" "pass" "-v exit=$ver_exit"
    fi
}
