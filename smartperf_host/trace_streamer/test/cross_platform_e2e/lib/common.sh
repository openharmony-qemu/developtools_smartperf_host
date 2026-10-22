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

TITLE_PADDING=4
E2E_TEST_PASS_COUNT=0
E2E_TEST_FAIL_COUNT=0
E2E_TEST_SKIP_COUNT=0
E2E_TEST_TOTAL_COUNT=0
E2E_TEST_RESULTS=()
E2E_TMP_DIR=""
E2E_OUTPUT_DIR=""
E2E_VERBOSE=0

init_colors() {
    if [[ -t 1 ]]; then
        COLOR_RED='\033[0;31m'
        COLOR_GREEN='\033[0;32m'
        COLOR_YELLOW='\033[1;33m'
        COLOR_BLUE='\033[0;34m'
        COLOR_CYAN='\033[0;36m'
        COLOR_GRAY='\033[0;90m'
        COLOR_RESET='\033[0m'
    else
        COLOR_RED=''
        COLOR_GREEN=''
        COLOR_YELLOW=''
        COLOR_BLUE=''
        COLOR_CYAN=''
        COLOR_GRAY=''
        COLOR_RESET=''
    fi
}

log_info() {
    echo -e "${COLOR_CYAN}[INFO]${COLOR_RESET} $*"
}

log_warn() {
    echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $*" >&2
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $*" >&2
}

log_debug() {
    if [[ "$E2E_VERBOSE" -eq 1 ]]; then
        echo -e "${COLOR_GRAY}[DEBUG]${COLOR_RESET} $*"
    fi
}

log_pass() {
    echo -e "${COLOR_GREEN}[PASS]${COLOR_RESET} $*"
}

log_fail() {
    echo -e "${COLOR_RED}[FAIL]${COLOR_RESET} $*"
}

log_skip() {
    echo -e "${COLOR_YELLOW}[SKIP]${COLOR_RESET} $*"
}

log_section() {
    local title="$1"
    local len=${#title}
    local line=""
    for ((i=0; i<len+TITLE_PADDING; i++)); do line+="="; done
    echo ""
    echo -e "${COLOR_BLUE}$line${COLOR_RESET}"
    echo -e "${COLOR_BLUE}  $title  ${COLOR_RESET}"
    echo -e "${COLOR_BLUE}$line${COLOR_RESET}"
}

get_script_dir() {
    local source="${BASH_SOURCE[0]}"
    local dir=""
    while [[ -h "$source" ]]; do
        dir="$(cd -P "$(dirname "$source")" && pwd)"
        source="$(readlink "$source")"
        [[ "$source" != /* ]] && source="$dir/$source"
    done
    dir="$(cd -P "$(dirname "$source")" && pwd)"
    echo "$dir"
}

get_trace_streamer_root() {
    if [[ -n "$E2E_ROOT_DIR" ]]; then
        echo "$E2E_ROOT_DIR"
        return
    fi
    local script_dir
    script_dir=$(get_script_dir)
    local root
    root="$(cd "$script_dir/../.." && pwd)"
    echo "$root"
}

get_resource_dir() {
    local root
    root=$(get_trace_streamer_root)
    echo "$root/test/resource"
}

init_test_env() {
    local root
    root=$(get_trace_streamer_root)
    E2E_TMP_DIR="$root/test/cross_platform_e2e/tmp"
    E2E_OUTPUT_DIR="$root/test/cross_platform_e2e/output"
    if [[ -n "$E2E_TMP_DIR" ]]; then
        rm -rf "$E2E_TMP_DIR"
    fi
    mkdir -p "$E2E_TMP_DIR"
    mkdir -p "$E2E_OUTPUT_DIR"
}

cleanup_test_env() {
    if [[ -n "$E2E_TMP_DIR" && -d "$E2E_TMP_DIR" ]]; then
        rm -rf "$E2E_TMP_DIR"
    fi
}

record_result() {
    local case_name="$1"
    local status="$2"
    local detail="$3"
    E2E_TEST_TOTAL_COUNT=$((E2E_TEST_TOTAL_COUNT + 1))
    case "$status" in
        pass)
            E2E_TEST_PASS_COUNT=$((E2E_TEST_PASS_COUNT + 1))
            log_pass "[$case_name] $detail"
            ;;
        fail)
            E2E_TEST_FAIL_COUNT=$((E2E_TEST_FAIL_COUNT + 1))
            log_fail "[$case_name] $detail"
            ;;
        skip)
            E2E_TEST_SKIP_COUNT=$((E2E_TEST_SKIP_COUNT + 1))
            log_skip "[$case_name] $detail"
            ;;
    esac
    E2E_TEST_RESULTS+=("$status|$case_name|$detail")
}

assert_file_exists() {
    local file="$1"
    local case_name="$2"
    if [[ ! -f "$file" ]]; then
        record_result "$case_name" "fail" "file not found: $file"
        return 1
    fi
    return 0
}

assert_exit_code() {
    local actual="$1"
    local expected="$2"
    local case_name="$3"
    local detail="$4"
    if [[ "$actual" -eq "$expected" ]]; then
        record_result "$case_name" "pass" "exit_code=$actual $detail"
        return 0
    else
        record_result "$case_name" "fail" "expected exit=$expected, got=$actual $detail"
        return 1
    fi
}

assert_not_exit_code() {
    local actual="$1"
    local not_expected="$2"
    local case_name="$3"
    local detail="$4"
    if [[ "$actual" -ne "$not_expected" ]]; then
        record_result "$case_name" "pass" "exit_code=$actual (not $not_expected) $detail"
        return 0
    else
        record_result "$case_name" "fail" "expected exit != $not_expected, got=$actual $detail"
        return 1
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local case_name="$3"
    local detail="$4"
    if echo "$haystack" | grep -q "$needle"; then
        record_result "$case_name" "pass" "found '$needle' $detail"
        return 0
    else
        record_result "$case_name" "fail" "'$needle' not found in output $detail"
        return 1
    fi
}

assert_binary_arch() {
    local binary="$1"
    local expected_arch="$2"
    local case_name="$3"
    if [[ ! -f "$binary" ]]; then
        record_result "$case_name" "fail" "binary not found: $binary"
        return 1
    fi
    local file_info
    file_info=$(file "$binary")
    if echo "$file_info" | grep -q "$expected_arch"; then
        record_result "$case_name" "pass" "arch '$expected_arch' verified: $binary"
        return 0
    else
        record_result "$case_name" "fail" "expected '$expected_arch', got: $file_info"
        return 1
    fi
}

print_detailed_results() {
    echo ""
    echo "  Detailed Results:"
    printf "  %-8s %-40s %s\n" "Status" "Case" "Detail"
    printf "  %-8s %-40s %s\n" "------" "----" "------"
    for result in "${E2E_TEST_RESULTS[@]}"; do
        local status name detail
        IFS='|' read -r status name detail <<< "$result"
        local color=""
        case "$status" in
            pass) color="$COLOR_GREEN" ;;
            fail) color="$COLOR_RED" ;;
            skip) color="$COLOR_YELLOW" ;;
        esac
        printf "  ${color}%-8s${COLOR_RESET} %-40s %s\n" "$status" "$name" "$detail"
    done
}

_print_summary_status() {
    local fail="$1"
    local skip="$2"
    if [[ $fail -eq 0 && $skip -eq 0 ]]; then
        echo -e "\n  ${COLOR_GREEN}All tests passed!${COLOR_RESET}"
    elif [[ $fail -eq 0 ]]; then
        echo -e "\n  ${COLOR_YELLOW}All executed tests passed ($skip skipped)${COLOR_RESET}"
    else
        echo -e "\n  ${COLOR_RED}$fail test(s) failed${COLOR_RESET}"
    fi
}

print_summary() {
    local total=$E2E_TEST_TOTAL_COUNT
    local pass=$E2E_TEST_PASS_COUNT
    local fail=$E2E_TEST_FAIL_COUNT
    local skip=$E2E_TEST_SKIP_COUNT
    log_section "Test Summary"
    echo "  Total:  $total"
    echo -e "  ${COLOR_GREEN}Pass:   $pass${COLOR_RESET}"
    echo -e "  ${COLOR_RED}Fail:   $fail${COLOR_RESET}"
    echo -e "  ${COLOR_YELLOW}Skip:   $skip${COLOR_RESET}"
    _print_summary_status "$fail" "$skip"
    if [[ ${#E2E_TEST_RESULTS[@]} -gt 0 ]]; then
        print_detailed_results
    fi
}

check_command() {
    local cmd="$1"
    if command -v "$cmd" &>/dev/null; then
        return 0
    else
        return 1
    fi
}

require_command() {
    local cmd="$1"
    local case_name="$2"
    if ! check_command "$cmd"; then
        log_error "required command not found: $cmd"
        record_result "$case_name" "skip" "missing dependency: $cmd"
        return 1
    fi
    return 0
}

get_timestamp() {
    date +"%Y%m%d_%H%M%S"
}

save_output_report() {
    local report_file="$E2E_OUTPUT_DIR/e2e_report_$(get_timestamp).txt"
    {
        echo "Cross-Platform E2E Test Report"
        echo "Generated: $(date)"
        echo "================================"
        echo ""
        echo "Total: $E2E_TEST_TOTAL_COUNT"
        echo "Pass:  $E2E_TEST_PASS_COUNT"
        echo "Fail:  $E2E_TEST_FAIL_COUNT"
        echo "Skip:  $E2E_TEST_SKIP_COUNT"
        echo ""
        echo "Detailed Results:"
        for result in "${E2E_TEST_RESULTS[@]}"; do
            local status name detail
            IFS='|' read -r status name detail <<< "$result"
            printf "%-8s %-40s %s\n" "$status" "$name" "$detail"
        done
    } > "$report_file"
    log_info "Report saved to: $report_file"
}
