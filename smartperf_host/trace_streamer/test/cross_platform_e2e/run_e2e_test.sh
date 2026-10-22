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
#
# Cross-Platform E2E Test Framework for trace_streamer
# Verifies that trace_streamer produces identical SQLite output
# across different platforms (linux x86, ohospc ARM64, windows, macx)
#
# Usage:
#   ./run_e2e_test.sh                           # Default: linux vs ohospc, all cases
#   ./run_e2e_test.sh --ref linux --target ohospc
#   ./run_e2e_test.sh --cases bytrace           # Only bytrace cases
#   ./run_e2e_test.sh --cases bytrace,htrace    # Multiple case types
#   ./run_e2e_test.sh --mode normalized         # Normalized comparison
#   ./run_e2e_test.sh --single linux            # Single platform mode
#   ./run_e2e_test.sh --status                  # Show platform status only
#   ./run_e2e_test.sh --remote 192.168.1.100    # Remote ARM64 via SSH
#   ./run_e2e_test.sh --qemu                    # Use QEMU for ARM64
#   ./run_e2e_test.sh --verbose                 # Verbose output
#   ./run_e2e_test.sh --timeout 600             # Set per-test timeout

set -o pipefail

E2E_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_ROOT_DIR="$(cd "$E2E_SCRIPT_DIR/../.." && pwd)"
export E2E_ROOT_DIR E2E_SCRIPT_DIR

E2E_REF_PLATFORM="linux"
E2E_TARGET_PLATFORM="ohospc"
E2E_COMPARE_MODE="both"
E2E_CASES="all"
E2E_SINGLE_PLATFORM=""
E2E_STATUS_ONLY=0
E2E_VERBOSE=0
E2E_CLEANUP=1
E2E_FORCE_LOCAL=0
E2E_FORCE_QEMU=0
ARGS_PER_OPTION=2
ARGS_PER_FLAG=1

usage() {
    cat << 'USAGE_EOF'
Cross-Platform E2E Test Framework for trace_streamer

Usage: run_e2e_test.sh [OPTIONS]

Options:
  --ref <platform>        Reference platform (default: linux)
  --target <platform>     Target platform to compare (default: ohospc)
  --cases <list>          Comma-separated case types to run (default: all)
                          Types: bytrace, htrace, rawtrace, error
  --mode <mode>           Comparison mode (default: both)
                          Modes: exact, normalized, both
  --single <platform>     Run single-platform tests only (no cross comparison)
  --status                Show platform status and exit
  --remote <host>         Remote host for ARM64 execution via SSH
  --remote-user <user>    SSH user (default: root)
  --remote-port <port>    SSH port (default: 22)
  --remote-key <path>     SSH private key file
  --qemu                  Use QEMU for ARM64 execution on x86
  --qemu-bin <path>       QEMU binary path (default: qemu-aarch64)
  --timeout <seconds>     Per-test timeout (default: 300)
  --no-cleanup             Do not clean up temp files
  --force-local            Force all platforms to run locally (for testing)
  --verbose                Verbose output
  --help, -h              Show this help

Examples:
  # Full cross-platform test (linux vs ohospc)
  ./run_e2e_test.sh --ref linux --target ohospc

  # Only bytrace and htrace cases, normalized comparison
  ./run_e2e_test.sh --cases bytrace,htrace --mode normalized

  # Single platform test (linux only)
  ./run_e2e_test.sh --single linux

  # ARM64 via QEMU
  ./run_e2e_test.sh --target ohospc --qemu

  # ARM64 via remote SSH
  ./run_e2e_test.sh --target ohospc --remote 192.168.1.100 --remote-user root

  # Show platform build status
  ./run_e2e_test.sh --status

USAGE_EOF
}

parse_runner_arg() {
    local opt="$1"
    local val="$2"
    case "$opt" in
        --remote)
            PLATFORM_RUNNER_REMOTE_HOST="$val"
            echo "$ARGS_PER_OPTION"
            ;;
        --remote-user)
            PLATFORM_RUNNER_SSH_USER="$val"
            echo "$ARGS_PER_OPTION"
            ;;
        --remote-port)
            PLATFORM_RUNNER_SSH_PORT="$val"
            echo "$ARGS_PER_OPTION"
            ;;
        --remote-key)
            PLATFORM_RUNNER_SSH_KEY="$val"
            echo "$ARGS_PER_OPTION"
            ;;
        --qemu)
            E2E_FORCE_QEMU=1
            echo "$ARGS_PER_FLAG"
            ;;
        --qemu-bin)
            PLATFORM_RUNNER_QEMU_BIN="$val"
            echo "$ARGS_PER_OPTION"
            ;;
        --timeout)
            PLATFORM_RUNNER_TIMEOUT="$val"
            echo "$ARGS_PER_OPTION"
            ;;
        *)
            echo 0
            return 1
            ;;
    esac
}

parse_two_arg_option() {
    local opt="$1"
    local val="$2"
    case "$opt" in
        --ref)      E2E_REF_PLATFORM="$val" ;;
        --target)   E2E_TARGET_PLATFORM="$val" ;;
        --cases)    E2E_CASES="$val" ;;
        --mode)     E2E_COMPARE_MODE="$val" ;;
        --single)   E2E_SINGLE_PLATFORM="$val" ;;
        *)          return 1 ;;
    esac
    return 0
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --ref|--target|--cases|--mode|--single)
                if [[ -z "$2" ]]; then
                    log_error "option $1 requires a value"
                    exit 1
                fi
                parse_two_arg_option "$1" "$2"
                shift $ARGS_PER_OPTION
                ;;
            --status)
                E2E_STATUS_ONLY=1
                shift
                ;;
            --remote|--remote-user|--remote-port|--remote-key|--qemu-bin|--timeout)
                if [[ -z "$2" ]]; then
                    log_error "option $1 requires a value"
                    exit 1
                fi
                shift "$(parse_runner_arg "$1" "$2")"
                ;;
            --qemu)
                shift "$(parse_runner_arg "$1" "$2")"
                ;;
            --no-cleanup)
                E2E_CLEANUP=0
                shift
                ;;
            --force-local)
                E2E_FORCE_LOCAL=1
                shift
                ;;
            --verbose)
                E2E_VERBOSE=1
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            *)
                log_error "unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

validate_single_platform() {
    local valid_platforms="linux ohospc windows macx wasm"
    if ! echo "$valid_platforms" | grep -qw "$E2E_SINGLE_PLATFORM"; then
        log_error "invalid single platform: $E2E_SINGLE_PLATFORM"
        exit 1
    fi
}

validate_cross_platforms() {
    local valid_platforms="linux ohospc windows macx wasm"
    if ! echo "$valid_platforms" | grep -qw "$E2E_REF_PLATFORM"; then
        log_error "invalid reference platform: $E2E_REF_PLATFORM"
        exit 1
    fi
    if ! echo "$valid_platforms" | grep -qw "$E2E_TARGET_PLATFORM"; then
        log_error "invalid target platform: $E2E_TARGET_PLATFORM"
        exit 1
    fi
    if [[ "$E2E_REF_PLATFORM" == "$E2E_TARGET_PLATFORM" ]]; then
        log_error "reference and target platforms must be different"
        exit 1
    fi
}

validate_platforms() {
    if [[ -n "$E2E_SINGLE_PLATFORM" ]]; then
        validate_single_platform
    else
        validate_cross_platforms
    fi
}

validate_modes() {
    local valid_modes="exact normalized both"
    if ! echo "$valid_modes" | grep -qw "$E2E_COMPARE_MODE"; then
        log_error "invalid comparison mode: $E2E_COMPARE_MODE"
        exit 1
    fi
}

validate_cases() {
    local valid_cases="bytrace htrace rawtrace error all"
    IFS=',' read -ra case_list <<< "$E2E_CASES"
    for c in "${case_list[@]}"; do
        if ! echo "$valid_cases" | grep -qw "$c"; then
            log_error "invalid case type: $c"
            exit 1
        fi
    done
    if ! check_command "$SQLITE3_BIN"; then
        log_error "sqlite3 not found. Install sqlite3 or set SQLITE3_BIN env var."
        exit 1
    fi
}

validate_args() {
    validate_platforms
    validate_modes
    validate_cases
}

run_case_dispatch() {
    local single_fn="$1"
    local cross_fn="$2"
    if [[ -n "$E2E_SINGLE_PLATFORM" ]]; then
        "$single_fn" "$E2E_SINGLE_PLATFORM"
    else
        "$cross_fn" "$E2E_REF_PLATFORM" "$E2E_TARGET_PLATFORM" "$E2E_COMPARE_MODE"
    fi
}

run_case_set() {
    local case_type="$1"
    case "$case_type" in
        bytrace)
            run_case_dispatch run_bytrace_single_platform run_bytrace_cases
            ;;
        htrace)
            run_case_dispatch run_htrace_single_platform run_htrace_cases
            ;;
        rawtrace)
            run_case_dispatch run_rawtrace_single_platform run_rawtrace_cases
            ;;
        error)
            run_case_dispatch run_error_cases_single_platform run_error_cases
            ;;
        *)
            log_warn "unknown case type: $case_type"
            ;;
    esac
}

print_test_config() {
    echo "  Reference Platform: $E2E_REF_PLATFORM"
    if [[ -n "$E2E_SINGLE_PLATFORM" ]]; then
        echo "  Mode: Single Platform ($E2E_SINGLE_PLATFORM)"
    else
        echo "  Target Platform:    $E2E_TARGET_PLATFORM"
        echo "  Compare Mode:       $E2E_COMPARE_MODE"
    fi
    echo "  Cases:              $E2E_CASES"
    echo "  Timeout:            ${PLATFORM_RUNNER_TIMEOUT}s"
    echo "  Temp Dir:           $E2E_TMP_DIR"
    if [[ "$E2E_FORCE_LOCAL" -eq 1 ]]; then
        echo "  Force Local:        yes"
    fi
    if [[ -n "$PLATFORM_RUNNER_REMOTE_HOST" ]]; then
        echo "  Remote Host:        $PLATFORM_RUNNER_REMOTE_HOST"
    fi
}

check_cross_platform_platforms() {
    local root="$1"
    local missing=0
    if ! platform_is_available "$root" "$E2E_REF_PLATFORM"; then
        log_error "reference platform '$E2E_REF_PLATFORM' binary not found"
        log_info "Build it first: ./build.sh $E2E_REF_PLATFORM"
        missing=1
    fi
    if ! platform_is_available "$root" "$E2E_TARGET_PLATFORM"; then
        log_warn "target platform '$E2E_TARGET_PLATFORM' binary not found"
        log_info "Build it first: ./build.sh $E2E_TARGET_PLATFORM"
        missing=1
    fi
    if [[ "$missing" -eq 1 ]]; then
        log_error "required platform binaries missing, cannot run cross-platform tests"
        log_info "Hint: use --single linux for single-platform tests"
        exit 1
    fi
}

check_required_platforms() {
    local root="$1"
    if [[ -n "$E2E_SINGLE_PLATFORM" ]]; then
        if ! platform_is_available "$root" "$E2E_SINGLE_PLATFORM"; then
            log_error "platform '$E2E_SINGLE_PLATFORM' binary not found"
            log_info "Build it first: ./build.sh $E2E_SINGLE_PLATFORM"
            exit 1
        fi
    else
        check_cross_platform_platforms "$root"
    fi
}

verify_single_platform_arch() {
    local root="$1"
    local ref_arch
    ref_arch=$(platform_get_arch "$E2E_SINGLE_PLATFORM")
    if [[ -n "$ref_arch" ]]; then
        local binary
        binary=$(platform_get_binary "$root" "$E2E_SINGLE_PLATFORM")
        assert_binary_arch "$binary" "$ref_arch" "arch_${E2E_SINGLE_PLATFORM}"
    fi
}

verify_cross_platform_archs() {
    local root="$1"
    local ref_arch target_arch
    ref_arch=$(platform_get_arch "$E2E_REF_PLATFORM")
    target_arch=$(platform_get_arch "$E2E_TARGET_PLATFORM")
    if [[ -n "$ref_arch" ]]; then
        local ref_binary
        ref_binary=$(platform_get_binary "$root" "$E2E_REF_PLATFORM")
        assert_binary_arch "$ref_binary" "$ref_arch" "arch_${E2E_REF_PLATFORM}"
    fi
    if [[ -n "$target_arch" ]]; then
        local target_binary
        target_binary=$(platform_get_binary "$root" "$E2E_TARGET_PLATFORM")
        assert_binary_arch "$target_binary" "$target_arch" "arch_${E2E_TARGET_PLATFORM}"
    fi
}

verify_platform_archs() {
    local root="$1"
    if [[ -n "$E2E_SINGLE_PLATFORM" ]]; then
        verify_single_platform_arch "$root"
    else
        verify_cross_platform_archs "$root"
    fi
}

run_test_cases() {
    if [[ "$E2E_CASES" == "all" ]]; then
        run_case_set "bytrace"
        run_case_set "htrace"
        run_case_set "rawtrace"
        run_case_set "error"
    else
        IFS=',' read -ra case_list <<< "$E2E_CASES"
        for c in "${case_list[@]}"; do
            run_case_set "$c"
        done
    fi
}

main() {
    source_libs
    init_colors
    parse_args "$@"
    validate_args
    init_test_env

    log_section "Cross-Platform E2E Test Framework"
    print_test_config
    platform_print_status

    if [[ "$E2E_STATUS_ONLY" -eq 1 ]]; then
        exit 0
    fi

    local root
    root=$(get_trace_streamer_root)
    check_required_platforms "$root"
    verify_platform_archs "$root"
    run_test_cases

    print_summary
    save_output_report

    if [[ "$E2E_CLEANUP" -eq 1 ]]; then
        cleanup_test_env
    fi

    if [[ "$E2E_TEST_FAIL_COUNT" -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

source_dir_files() {
    local dir="$1"
    local file
    for file in "$dir"/*.sh; do
        if [[ -f "$file" ]]; then
            source "$file"
        fi
    done
}

source_libs() {
    source_dir_files "$E2E_SCRIPT_DIR/lib"
    source_dir_files "$E2E_SCRIPT_DIR/cases"
}

main "$@"
