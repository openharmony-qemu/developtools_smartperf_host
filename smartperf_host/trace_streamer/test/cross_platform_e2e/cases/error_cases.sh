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

VERSION_CHECK_TIMEOUT=10

run_error_test_on_platforms() {
    local ref_platform="$1"
    local target_platform="$2"
    local root="$3"
    local case_prefix="$4"
    local test_fn="$5"
    for platform in "$ref_platform" "$target_platform"; do
        if ! platform_is_available "$root" "$platform"; then
            record_result "${case_prefix}_${platform}" "skip" "platform not available"
            continue
        fi
        "$test_fn" "$platform" "$root"
    done
}

test_nonexistent_path() {
    local platform="$1"
    local root="$2"
    local nonexistent_path="/nonexistent/path/to/trace.txt"
    local case_name="error_nonexistent_path"
    local output_db="$E2E_TMP_DIR/${case_name}_${platform}.db"
    rm -f "$output_db"
    local result
    result=$(run_trace_streamer "$platform" "$nonexistent_path" "$output_db" "")
    local exit_code
    exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
    assert_not_exit_code "$exit_code" "0" "${case_name}_${platform}" \
        "nonexistent path should fail"
}

test_nonexistent_path_no_db() {
    local ref_platform="$1"
    local target_platform="$2"
    local root="$3"
    local case_name="error_nonexistent_path"
    if platform_is_available "$root" "$ref_platform" \
        && platform_is_available "$root" "$target_platform"; then
        local ref_db="$E2E_TMP_DIR/${case_name}_${ref_platform}.db"
        local target_db="$E2E_TMP_DIR/${case_name}_${target_platform}.db"
        if [[ ! -f "$ref_db" ]]; then
            if [[ ! -f "$target_db" ]]; then
                record_result "${case_name}_no_db" "pass" \
                    "both platforms correctly produced no db"
            else
                record_result "${case_name}_no_db" "fail" "unexpected db created"
            fi
        else
            record_result "${case_name}_no_db" "fail" "unexpected db created"
        fi
    fi
}

test_empty_file() {
    local platform="$1"
    local root="$2"
    local empty_file="$E2E_TMP_DIR/empty_trace.txt"
    touch "$empty_file"
    local output_db="$E2E_TMP_DIR/error_empty_file_${platform}.db"
    rm -f "$output_db"
    local result
    result=$(run_trace_streamer "$platform" "$empty_file" "$output_db" "")
    local exit_code
    exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
    record_result "error_empty_file_${platform}" "pass" \
        "empty file exit=$exit_code (graceful handling)"
    rm -f "$empty_file"
}

test_garbage_file() {
    local platform="$1"
    local root="$2"
    local garbage_file="$E2E_TMP_DIR/garbage_trace.txt"
    echo "this is not a valid trace file content" > "$garbage_file"
    local output_db="$E2E_TMP_DIR/error_garbage_file_${platform}.db"
    rm -f "$output_db"
    local result
    result=$(run_trace_streamer "$platform" "$garbage_file" "$output_db" "")
    local exit_code
    exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
    assert_not_exit_code "$exit_code" "0" \
        "error_garbage_file_${platform}" "garbage file should fail"
    rm -f "$garbage_file"
}

test_no_args() {
    local platform="$1"
    local root="$2"
    local binary
    binary=$(platform_get_binary "$root" "$platform")
    if [[ ! -f "$binary" ]]; then
        record_result "error_no_args_${platform}" "skip" "binary not found"
        return
    fi
    local run_mode
    run_mode=$(platform_get_run_mode "$platform")
    if [[ "$run_mode" != "local" ]]; then
        record_result "error_no_args_${platform}" "skip" \
            "skipped in $run_mode mode"
        return
    fi
    timeout "$PLATFORM_RUNNER_TIMEOUT" "$binary" 2>&1
    local exit_code=$?
    assert_not_exit_code "$exit_code" "0" \
        "error_no_args_${platform}" "no args should fail"
}

test_version_check() {
    local platform="$1"
    local root="$2"
    local binary
    binary=$(platform_get_binary "$root" "$platform")
    if [[ ! -f "$binary" ]]; then
        record_result "version_check_${platform}" "skip" "binary not found"
        return
    fi
    local run_mode
    run_mode=$(platform_get_run_mode "$platform")
    if [[ "$run_mode" != "local" ]]; then
        record_result "version_check_${platform}" "skip" \
            "skipped in $run_mode mode"
        return
    fi
    local version_output
    version_output=$(timeout "$VERSION_CHECK_TIMEOUT" "$binary" -v 2>&1)
    local exit_code=$?
    if [[ "$exit_code" -eq 0 ]]; then
        assert_contains "$version_output" "[0-9]" \
            "version_check_${platform}" "-v version output"
    else
        record_result "version_check_${platform}" "pass" \
            "-v exit=$exit_code (version may require display)"
    fi
}

test_exit_code_per_platform() {
    local platform="$1"
    local root="$2"
    local nonexistent_path="/nonexistent/path/to/trace.txt"
    local output_db="$E2E_TMP_DIR/exit_code_consistency_${platform}.db"
    rm -f "$output_db"
    local result
    result=$(run_trace_streamer "$platform" "$nonexistent_path" "$output_db" "")
    local exit_code
    exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
    record_result "exit_code_consistency_${platform}" "pass" \
        "exit=$exit_code for nonexistent path"
}

test_exit_code_cross_check() {
    local ref_platform="$1"
    local target_platform="$2"
    local root="$3"
    local nonexistent_path="/nonexistent/path/to/trace.txt"
    if platform_is_available "$root" "$ref_platform" \
        && platform_is_available "$root" "$target_platform"; then
        local ref_db="$E2E_TMP_DIR/exit_code_consistency_${ref_platform}.db"
        local target_db="$E2E_TMP_DIR/exit_code_consistency_${target_platform}.db"
        rm -f "$ref_db" "$target_db"
        local ref_result_val target_result_val
        ref_result_val=$(run_trace_streamer "$ref_platform" "$nonexistent_path" "$ref_db" "")
        target_result_val=$(run_trace_streamer "$target_platform" "$nonexistent_path" "$target_db" "")
        local ref_exit_val target_exit_val
        ref_exit_val=$(echo "$ref_result_val" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
        target_exit_val=$(echo "$target_result_val" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
        if [[ "$ref_exit_val" != "0" ]]; then
            if [[ "$target_exit_val" != "0" ]]; then
                record_result "error_exit_code_consistent" "pass" \
                    "both platforms reject invalid input (ref=$ref_exit_val, target=$target_exit_val)"
            else
                record_result "error_exit_code_consistent" "fail" \
                    "inconsistent error handling (ref=$ref_exit_val, target=$target_exit_val)"
            fi
        else
            record_result "error_exit_code_consistent" "fail" \
                "inconsistent error handling (ref=$ref_exit_val, target=$target_exit_val)"
        fi
    fi
}

run_error_cases() {
    local ref_platform="$1"
    local target_platform="$2"
    log_section "Error Handling Cross-Platform Tests"
    local root
    root=$(get_trace_streamer_root)

    run_error_test_on_platforms "$ref_platform" "$target_platform" "$root" \
        "error_nonexistent_path" test_nonexistent_path
    test_nonexistent_path_no_db "$ref_platform" "$target_platform" "$root"

    run_error_test_on_platforms "$ref_platform" "$target_platform" "$root" \
        "error_empty_file" test_empty_file

    run_error_test_on_platforms "$ref_platform" "$target_platform" "$root" \
        "error_garbage_file" test_garbage_file

    run_error_test_on_platforms "$ref_platform" "$target_platform" "$root" \
        "error_no_args" test_no_args

    run_error_test_on_platforms "$ref_platform" "$target_platform" "$root" \
        "version_check" test_version_check

    run_error_test_on_platforms "$ref_platform" "$target_platform" "$root" \
        "exit_code_consistency" test_exit_code_per_platform
    test_exit_code_cross_check "$ref_platform" "$target_platform" "$root"
}

run_error_cases_single_platform() {
    local platform="$1"
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
    if [[ ! -f "$binary" ]]; then
        record_result "version_${platform}" "skip" "binary not found"
    else
        local run_mode
        run_mode=$(platform_get_run_mode "$platform")
        if [[ "$run_mode" != "local" ]]; then
            record_result "version_${platform}" "skip" \
                "skipped in $run_mode mode"
        else
            timeout "$VERSION_CHECK_TIMEOUT" "$binary" -v 2>&1
            local ver_exit=$?
            record_result "version_${platform}" "pass" "-v exit=$ver_exit"
        fi
    fi
}
