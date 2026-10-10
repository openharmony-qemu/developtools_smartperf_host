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

readonly PLATFORM_RUNNER_DEFAULT_TIMEOUT=300
readonly PLATFORM_RUNNER_SSH_CONNECT_TIMEOUT=10
readonly PLATFORM_RUNNER_NS_PER_MS=1000000

PLATFORM_RUNNER_REMOTE_HOST=""
PLATFORM_RUNNER_QEMU_BIN="${PLATFORM_RUNNER_QEMU_BIN:-qemu-aarch64}"
PLATFORM_RUNNER_QEMU_SYSROOT="${PLATFORM_RUNNER_QEMU_SYSROOT:-tools/ohos-sdk/linux/native/sysroot}"
PLATFORM_RUNNER_SSH_USER="root"
PLATFORM_RUNNER_SSH_PORT="22"
PLATFORM_RUNNER_SSH_KEY=""
PLATFORM_RUNNER_REMOTE_BASE_DIR="/data/cross_platform_test"
PLATFORM_RUNNER_TIMEOUT="${PLATFORM_RUNNER_TIMEOUT:-$PLATFORM_RUNNER_DEFAULT_TIMEOUT}"

platform_get_binary() {
    local root="$1"
    local platform="$2"
    case "$platform" in
        linux)
            echo "$root/out/linux/trace_streamer"
            ;;
        ohospc)
            echo "$root/out/ohospc/trace_streamer"
            ;;
        windows)
            echo "$root/out/windows/trace_streamer.exe"
            ;;
        macx)
            echo "$root/out/macx/trace_streamer"
            ;;
        wasm)
            echo "$root/out/wasm/trace_streamer_builtin.wasm"
            ;;
        *)
            echo ""
            return 1
            ;;
    esac
}

platform_get_arch() {
    local platform="$1"
    case "$platform" in
        linux)   echo "x86-64" ;;
        ohospc)  echo "aarch64" ;;
        windows) echo "x86-64" ;;
        macx)    echo "x86-64" ;;
        wasm)    echo "" ;;
        *)       echo "" ;;
    esac
}

platform_is_available() {
    local root="$1"
    local platform="$2"
    local binary
    binary=$(platform_get_binary "$root" "$platform")
    if [[ -f "$binary" ]]; then
        return 0
    fi
    return 1
}

platform_list_available() {
    local root="$1"
    local platforms=("linux" "ohospc" "windows" "macx" "wasm")
    local available=()
    for p in "${platforms[@]}"; do
        if platform_is_available "$root" "$p"; then
            available+=("$p")
        fi
    done
    echo "${available[@]}"
}

_check_linux_local() {
    local host_arch
    host_arch=$(uname -m)
    if [[ "$host_arch" == "x86_64" ]]; then
        return 0
    fi
    return 1
}

_check_macx_local() {
    if [[ "$(uname -s)" == "Darwin" ]]; then
        return 0
    fi
    return 1
}

_check_linux_macx_local() {
    local platform="$1"
    if [[ "$platform" == "linux" ]]; then
        _check_linux_local
        return $?
    fi
    if [[ "$platform" == "macx" ]]; then
        _check_macx_local
        return $?
    fi
    return 1
}

_check_ohospc_local() {
    local host_arch
    host_arch=$(uname -m)
    if [[ "$host_arch" == "aarch64" ]]; then
        return 0
    fi
    if check_command "$PLATFORM_RUNNER_QEMU_BIN"; then
        return 0
    fi
    return 1
}

platform_can_run_locally() {
    local platform="$1"
    case "$platform" in
        linux|macx)
            _check_linux_macx_local "$platform"
            return $?
            ;;
        ohospc)
            _check_ohospc_local
            return $?
            ;;
    esac
    return 1
}

platform_get_binary_arch_actual() {
    local binary="$1"
    if [[ ! -f "$binary" ]]; then
        echo ""
        return 1
    fi
    local file_info
    file_info=$(file "$binary" 2>/dev/null)
    case "$file_info" in
        *x86-64*|*x86_64*)
            echo "x86-64"
            ;;
        *aarch64*|*ARM64*)
            echo "aarch64"
            ;;
        *i386*|*80386*)
            echo "i386"
            ;;
        *)
            echo ""
            ;;
    esac
}

platform_get_ohospc_run_mode() {
    local host_arch="$1"
    if [[ "$E2E_FORCE_QEMU" -eq 1 ]] && check_command "$PLATFORM_RUNNER_QEMU_BIN"; then
        echo "qemu"
        return
    fi
    if [[ "$host_arch" == "aarch64" ]]; then
        echo "local"
        return
    fi
    if check_command "$PLATFORM_RUNNER_QEMU_BIN"; then
        echo "qemu"
        return
    fi
    if [[ -n "$PLATFORM_RUNNER_REMOTE_HOST" ]]; then
        echo "remote"
        return
    fi
    platform_get_ohospc_fallback_mode "$host_arch"
}

platform_get_ohospc_fallback_mode() {
    local host_arch="$1"
    local root
    root=$(get_trace_streamer_root)
    local binary
    binary=$(platform_get_binary "$root" "ohospc")
    local bin_arch
    bin_arch=$(platform_get_binary_arch_actual "$binary")
    if [[ "$bin_arch" == "x86-64" && "$host_arch" == "x86_64" ]]; then
        echo "local"
    else
        echo "none"
    fi
}

platform_get_windows_run_mode() {
    if [[ "$(uname -s)" == "MINGW"* || "$(uname -s)" == "CYGWIN"* ]]; then
        echo "local"
    elif [[ -n "$PLATFORM_RUNNER_REMOTE_HOST" ]]; then
        echo "remote"
    else
        echo "none"
    fi
}

platform_get_macx_run_mode() {
    if [[ "$(uname -s)" == "Darwin" ]]; then
        echo "local"
    elif [[ -n "$PLATFORM_RUNNER_REMOTE_HOST" ]]; then
        echo "remote"
    else
        echo "none"
    fi
}

platform_get_run_mode() {
    local platform="$1"
    if [[ "$E2E_FORCE_LOCAL" -eq 1 ]]; then
        echo "local"
        return
    fi
    local host_arch
    host_arch=$(uname -m)
    case "$platform" in
        linux)
            if [[ "$host_arch" == "x86_64" ]]; then
                echo "local"
            else
                echo "remote"
            fi
            ;;
        ohospc)
            platform_get_ohospc_run_mode "$host_arch"
            ;;
        windows)
            platform_get_windows_run_mode
            ;;
        macx)
            platform_get_macx_run_mode
            ;;
        *)
            echo "none"
            ;;
    esac
}

run_trace_streamer_local() {
    local binary="$1"
    local input_file="$2"
    local output_db="$3"
    local extra_args="$4"
    if [[ ! -f "$binary" ]]; then
        echo "EXIT_CODE:-2 DURATION:0ms BINARY_NOT_FOUND"
        return 1
    fi
    if [[ ! -f "$input_file" ]]; then
        echo "EXIT_CODE:-3 DURATION:0ms INPUT_NOT_FOUND"
        return 1
    fi
    local start_time end_time duration
    start_time=$(date +%s%N)
    timeout "$PLATFORM_RUNNER_TIMEOUT" "$binary" "$input_file" -e "$output_db" $extra_args 2>&1
    local exit_code=$?
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / PLATFORM_RUNNER_NS_PER_MS ))
    echo "EXIT_CODE:$exit_code DURATION:${duration}ms"
    return 0
}

_validate_run_params() {
    local binary="$1"
    local input_file="$2"
    if [[ ! -f "$binary" ]]; then
        echo "EXIT_CODE:-2 DURATION:0ms BINARY_NOT_FOUND"
        return 1
    fi
    if [[ ! -f "$input_file" ]]; then
        echo "EXIT_CODE:-3 DURATION:0ms INPUT_NOT_FOUND"
        return 1
    fi
    return 0
}

run_trace_streamer_qemu() {
    local binary="$1"
    local input_file="$2"
    local output_db="$3"
    local extra_args="$4"
    local root
    root=$(get_trace_streamer_root)
    local sysroot="$root/$PLATFORM_RUNNER_QEMU_SYSROOT"
    if [[ ! -d "$sysroot" ]]; then
        sysroot=""
    fi
    if ! _validate_run_params "$binary" "$input_file"; then
        return 1
    fi
    local -a qemu_cmd=("$PLATFORM_RUNNER_QEMU_BIN")
    if [[ -n "$sysroot" ]]; then
        qemu_cmd+=(-L "$sysroot")
    fi
    local start_time end_time duration
    start_time=$(date +%s%N)
    timeout "$PLATFORM_RUNNER_TIMEOUT" "${qemu_cmd[@]}" "$binary" "$input_file" -e "$output_db" $extra_args 2>&1
    local exit_code=$?
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / PLATFORM_RUNNER_NS_PER_MS ))
    echo "EXIT_CODE:$exit_code DURATION:${duration}ms"
    return 0
}

run_trace_streamer_remote() {
    local binary="$1"
    local input_file="$2"
    local output_db="$3"
    local extra_args="$4"
    local host="$PLATFORM_RUNNER_REMOTE_HOST"
    if [[ -z "$host" ]]; then
        echo "NO_REMOTE_HOST"
        return 1
    fi
    local -a ssh_opts=(-o "ConnectTimeout=$PLATFORM_RUNNER_SSH_CONNECT_TIMEOUT" -o StrictHostKeyChecking=no)
    if [[ -n "$PLATFORM_RUNNER_SSH_KEY" ]]; then
        ssh_opts+=(-i "$PLATFORM_RUNNER_SSH_KEY")
    fi
    local remote_binary="$PLATFORM_RUNNER_REMOTE_BASE_DIR/trace_streamer"
    local remote_input="$PLATFORM_RUNNER_REMOTE_BASE_DIR/$(basename "$input_file")"
    local remote_output="$PLATFORM_RUNNER_REMOTE_BASE_DIR/$(basename "$output_db")"
    local remote_user_host="$PLATFORM_RUNNER_SSH_USER@$host"
    local -a ssh_port=(-p "$PLATFORM_RUNNER_SSH_PORT")
    local -a scp_port=(-P "$PLATFORM_RUNNER_SSH_PORT")
    ssh "${ssh_opts[@]}" "${ssh_port[@]}" "$remote_user_host" \
        "mkdir -p $PLATFORM_RUNNER_REMOTE_BASE_DIR" 2>/dev/null
    scp "${ssh_opts[@]}" "${scp_port[@]}" "$binary" \
        "$remote_user_host:$remote_binary" 2>/dev/null
    scp "${ssh_opts[@]}" "${scp_port[@]}" "$input_file" \
        "$remote_user_host:$remote_input" 2>/dev/null
    local escaped_extra_args=""
    if [[ -n "$extra_args" ]]; then
        escaped_extra_args=$(printf '%q' "$extra_args")
    fi
    local remote_cmd="cd $PLATFORM_RUNNER_REMOTE_BASE_DIR"
    remote_cmd="$remote_cmd && timeout $PLATFORM_RUNNER_TIMEOUT"
    remote_cmd="$remote_cmd ./trace_streamer $(basename "$input_file")"
    remote_cmd="$remote_cmd -e $(basename "$output_db") $escaped_extra_args 2>&1"
    remote_cmd="$remote_cmd; echo EXIT_CODE:\$?"
    local remote_result
    remote_result=$(ssh "${ssh_opts[@]}" "${ssh_port[@]}" "$remote_user_host" "$remote_cmd")
    scp "${ssh_opts[@]}" "${scp_port[@]}" "$remote_user_host:$remote_output" \
        "$output_db" 2>/dev/null
    ssh "${ssh_opts[@]}" "${ssh_port[@]}" "$remote_user_host" \
        "rm -f $remote_binary $remote_input $remote_output" 2>/dev/null
    local exit_code
    exit_code=$(echo "$remote_result" | grep "EXIT_CODE:" | sed 's/EXIT_CODE://')
    echo "EXIT_CODE:$exit_code DURATION:remote"
    return 0
}

run_trace_streamer() {
    local platform="$1"
    local input_file="$2"
    local output_db="$3"
    local extra_args="$4"
    local root
    root=$(get_trace_streamer_root)
    local binary
    binary=$(platform_get_binary "$root" "$platform")
    local run_mode
    run_mode=$(platform_get_run_mode "$platform")
    log_debug "platform=$platform, binary=$binary, mode=$run_mode, input=$input_file, output=$output_db"
    case "$run_mode" in
        local)
            run_trace_streamer_local "$binary" "$input_file" "$output_db" "$extra_args"
            ;;
        qemu)
            run_trace_streamer_qemu "$binary" "$input_file" "$output_db" "$extra_args"
            ;;
        remote)
            run_trace_streamer_remote "$binary" "$input_file" "$output_db" "$extra_args"
            ;;
        none)
            echo "EXIT_CODE:-1 DURATION:0ms NO_RUN_MODE"
            return 1
            ;;
        *)
            echo "EXIT_CODE:-1 DURATION:0ms UNKNOWN_MODE"
            return 1
            ;;
    esac
}

check_comparison_prerequisites() {
    local input_file="$1"
    local case_name="$2"
    local ref_platform="$3"
    local target_platform="$4"
    local root="$5"
    if [[ ! -f "$input_file" ]]; then
        record_result "${case_name}_input_check" "fail" \
            "input not found: $input_file"
        return 1
    fi
    if ! platform_is_available "$root" "$ref_platform"; then
        record_result "${case_name}_ref_binary" "skip" \
            "reference platform '$ref_platform' not available"
        return 1
    fi
    if ! platform_is_available "$root" "$target_platform"; then
        record_result "${case_name}_target_binary" "skip" \
            "target platform '$target_platform' not available"
        return 1
    fi
    return 0
}

run_and_verify_platform() {
    local platform="$1"
    local input_file="$2"
    local output_db="$3"
    local case_name="$4"
    log_info "Running $platform analysis: $input_file"
    local result
    result=$(run_trace_streamer "$platform" "$input_file" "$output_db" "")
    local exit_code
    exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
    if [[ "$exit_code" != "0" ]]; then
        record_result "${case_name}_${platform}_run" "fail" \
            "exit=$exit_code output: $result"
        return 1
    fi
    record_result "${case_name}_${platform}_run" "pass" "exit=0 $result"
    if [[ ! -f "$output_db" ]]; then
        record_result "${case_name}_${platform}_db" "fail" \
            "output db not created: $output_db"
        return 1
    fi
    record_result "${case_name}_${platform}_db" "pass" \
        "db created: $(du -h "$output_db" | cut -f1)"
    return 0
}

_record_comparison_result() {
    local case_name="$1"
    local compare_result="$2"
    if [[ $compare_result -eq 0 ]]; then
        record_result "${case_name}_summary" "pass" \
            "cross-platform output consistent"
    else
        record_result "${case_name}_summary" "fail" \
            "cross-platform output differs"
    fi
}

run_cross_platform_comparison() {
    local input_file="$1"
    local case_name="$2"
    local ref_platform="${3:-linux}"
    local target_platform="${4:-ohospc}"
    local compare_mode="${5:-both}"
    local root
    root=$(get_trace_streamer_root)
    if ! check_comparison_prerequisites "$input_file" "$case_name" \
        "$ref_platform" "$target_platform" "$root"; then
        return 1
    fi
    local ref_db="$E2E_TMP_DIR/${case_name}_${ref_platform}.db"
    local target_db="$E2E_TMP_DIR/${case_name}_${target_platform}.db"
    rm -f "$ref_db" "$target_db"
    if ! run_and_verify_platform "$ref_platform" "$input_file" "$ref_db" "$case_name"; then
        return 1
    fi
    if ! run_and_verify_platform "$target_platform" "$input_file" "$target_db" "$case_name"; then
        return 1
    fi
    log_info "Comparing databases: $ref_platform vs $target_platform"
    db_compare_all "$ref_db" "$target_db" "${case_name}_compare" "$compare_mode"
    local compare_result=$?
    _record_comparison_result "$case_name" "$compare_result"
    db_get_table_summary "$ref_db" > "$E2E_TMP_DIR/${case_name}_${ref_platform}_summary.txt" 2>/dev/null
    db_get_table_summary "$target_db" > "$E2E_TMP_DIR/${case_name}_${target_platform}_summary.txt" 2>/dev/null
    return $compare_result
}

_assert_single_platform_result() {
    local exit_code="$1"
    local expected_exit="$2"
    local case_name="$3"
    local detail="$4"
    if [[ "$expected_exit" == "0" ]]; then
        assert_exit_code "$exit_code" "0" "$case_name" "$detail"
    else
        assert_not_exit_code "$exit_code" "0" "$case_name" "$detail"
    fi
}

run_single_platform() {
    local platform="$1"
    local input_file="$2"
    local case_name="$3"
    local expected_exit="$4"
    local root
    root=$(get_trace_streamer_root)
    if ! platform_is_available "$root" "$platform"; then
        record_result "${case_name}" "skip" "platform '$platform' not available"
        return 1
    fi
    local output_db="$E2E_TMP_DIR/${case_name}_${platform}.db"
    rm -f "$output_db"
    log_info "Running $platform: $input_file"
    local result
    result=$(run_trace_streamer "$platform" "$input_file" "$output_db" "")
    local exit_code
    exit_code=$(echo "$result" | grep "EXIT_CODE:" | sed 's/.*EXIT_CODE://; s/ .*//')
    _assert_single_platform_result "$exit_code" "$expected_exit" "${case_name}" "$platform $result"
    if [[ "$exit_code" == "0" && -f "$output_db" ]]; then
        local db_size
        db_size=$(du -h "$output_db" | cut -f1)
        log_debug "Output DB: $output_db ($db_size)"
    fi
}

platform_print_status() {
    local root
    root=$(get_trace_streamer_root)
    log_section "Platform Status"
    local platforms=("linux" "ohospc" "windows" "macx" "wasm")
    for p in "${platforms[@]}"; do
        local binary
        binary=$(platform_get_binary "$root" "$p")
        local arch
        arch=$(platform_get_arch "$p")
        local status="NOT BUILT"
        local file_info="-"
        if [[ -f "$binary" ]]; then
            status="BUILT"
            file_info=$(file "$binary" | cut -d: -f2- | sed 's/^ *//')
        fi
        local mode
        mode=$(platform_get_run_mode "$p")
        printf "  %-10s %-10s %-8s %s\n" "$p" "$status" "$mode" "$file_info"
    done
}
