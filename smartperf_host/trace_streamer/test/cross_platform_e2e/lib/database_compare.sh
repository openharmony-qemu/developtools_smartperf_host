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

SQLITE3_BIN="${SQLITE3_BIN:-sqlite3}"
DB_COMPARE_FLOAT_TOLERANCE="${DB_COMPARE_FLOAT_TOLERANCE:-6}"

db_get_tables() {
    local db_file="$1"
    if [[ ! -f "$db_file" ]]; then
        echo ""
        return 1
    fi
    "$SQLITE3_BIN" "$db_file" ".tables" 2>/dev/null | tr -s ' ' '\n' | grep -v '^$' | sort
}

db_get_schema() {
    local db_file="$1"
    if [[ ! -f "$db_file" ]]; then
        echo ""
        return 1
    fi
    "$SQLITE3_BIN" "$db_file" ".schema" 2>/dev/null
}

db_count_rows() {
    local db_file="$1"
    local table="$2"
    if [[ ! -f "$db_file" ]]; then
        echo "-1"
        return 1
    fi
    "$SQLITE3_BIN" "$db_file" "SELECT COUNT(*) FROM $table;" 2>/dev/null
}

db_dump() {
    local db_file="$1"
    if [[ ! -f "$db_file" ]]; then
        echo ""
        return 1
    fi
    "$SQLITE3_BIN" "$db_file" ".dump" 2>/dev/null
}

db_dump_sorted() {
    local db_file="$1"
    if [[ ! -f "$db_file" ]]; then
        echo ""
        return 1
    fi
    db_dump "$db_file" | sort
}

db_dump_table() {
    local db_file="$1"
    local table="$2"
    if [[ ! -f "$db_file" ]]; then
        echo ""
        return 1
    fi
    "$SQLITE3_BIN" "$db_file" "SELECT * FROM $table ORDER BY 1;" 2>/dev/null
}

db_normalize_dump() {
    local dump_file="$1"
    local tolerance="$DB_COMPARE_FLOAT_TOLERANCE"
    sed -E \
        -e 's/[0-9]+\.[0-9]{'"$tolerance"',}/FLOAT/g' \
        -e 's/[0-9]+\.[0-9]+e[+-][0-9]+/FLOAT_EXP/g' \
        -e "s/output_name','[^']*/output_name','OUTPUT_PATH/g" \
        -e "s/source_name','[^']*/source_name','SOURCE_PATH/g" \
        -e "s/log_file_path','[^']*/log_file_path','LOG_PATH/g" \
        -e "s/runtime','[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9:]+/runtime','TIMESTAMP/g" \
        -e 's|/[^ ]*/test/resource/|RESOURCE_DIR/|g' \
        "$dump_file" 2>/dev/null | sort
}

db_compare_schema() {
    local db1="$1"
    local db2="$2"
    local case_name="${3:-schema_compare}"
    local schema1 schema2
    schema1=$(db_get_schema "$db1")
    schema2=$(db_get_schema "$db2")
    if [[ -z "$schema1" && -z "$schema2" ]]; then
        record_result "$case_name" "fail" "both schemas empty"
        return 1
    fi
    if [[ -z "$schema1" || -z "$schema2" ]]; then
        record_result "$case_name" "fail" "one schema empty (db1=${#schema1}, db2=${#schema2})"
        return 1
    fi
    if [[ "$schema1" == "$schema2" ]]; then
        record_result "$case_name" "pass" "schema identical"
        return 0
    else
        local diff_file="$E2E_TMP_DIR/${case_name}_schema_diff.txt"
        diff <(echo "$schema1") <(echo "$schema2") > "$diff_file" 2>&1
        record_result "$case_name" "fail" "schema diff: $diff_file"
        return 1
    fi
}

db_compare_table_list() {
    local db1="$1"
    local db2="$2"
    local case_name="${3:-table_list_compare}"
    local tables1 tables2
    tables1=$(db_get_tables "$db1")
    tables2=$(db_get_tables "$db2")
    if [[ "$tables1" == "$tables2" ]]; then
        local count
        count=$(echo "$tables1" | wc -l)
        record_result "$case_name" "pass" "table list identical ($count tables)"
        return 0
    else
        local diff_file="$E2E_TMP_DIR/${case_name}_table_diff.txt"
        {
            echo "=== Tables in db1 only ==="
            comm -23 <(echo "$tables1") <(echo "$tables2")
            echo "=== Tables in db2 only ==="
            comm -13 <(echo "$tables1") <(echo "$tables2")
        } > "$diff_file" 2>&1
        record_result "$case_name" "fail" "table list diff: $diff_file"
        return 1
    fi
}

db_compare_row_counts() {
    local db1="$1"
    local db2="$2"
    local case_name="${3:-row_count_compare}"
    local tables
    tables=$(db_get_tables "$db1")
    local all_pass=1
    local failed_tables=""
    for table in $tables; do
        local count1 count2
        count1=$(db_count_rows "$db1" "$table")
        count2=$(db_count_rows "$db2" "$table")
        if [[ "$count1" != "$count2" ]]; then
            all_pass=0
            failed_tables="$failed_tables $table($count1 vs $count2)"
        fi
    done
    if [[ "$all_pass" -eq 1 ]]; then
        record_result "$case_name" "pass" "all row counts match"
        return 0
    else
        record_result "$case_name" "fail" "mismatch:$failed_tables"
        return 1
    fi
}

db_compare_data_exact() {
    local db1="$1"
    local db2="$2"
    local case_name="${3:-data_exact_compare}"
    local dump1_file="$E2E_TMP_DIR/${case_name}_dump1.txt"
    local dump2_file="$E2E_TMP_DIR/${case_name}_dump2.txt"
    db_dump_sorted "$db1" > "$dump1_file" 2>/dev/null
    db_dump_sorted "$db2" > "$dump2_file" 2>/dev/null
    if diff "$dump1_file" "$dump2_file" > /dev/null 2>&1; then
        local line_count
        line_count=$(wc -l < "$dump1_file")
        record_result "$case_name" "pass" "data identical ($line_count lines)"
        return 0
    else
        local diff_file="$E2E_TMP_DIR/${case_name}_data_diff.txt"
        diff "$dump1_file" "$dump2_file" > "$diff_file" 2>&1
        local diff_lines
        diff_lines=$(wc -l < "$diff_file")
        record_result "$case_name" "fail" "data diff ($diff_lines lines): $diff_file"
        return 1
    fi
}

db_compare_data_normalized() {
    local db1="$1"
    local db2="$2"
    local case_name="${3:-data_normalized_compare}"
    local dump1_file="$E2E_TMP_DIR/${case_name}_dump1_raw.txt"
    local dump2_file="$E2E_TMP_DIR/${case_name}_dump2_raw.txt"
    local norm1_file="$E2E_TMP_DIR/${case_name}_dump1_norm.txt"
    local norm2_file="$E2E_TMP_DIR/${case_name}_dump2_norm.txt"
    db_dump "$db1" > "$dump1_file" 2>/dev/null
    db_dump "$db2" > "$dump2_file" 2>/dev/null
    db_normalize_dump "$dump1_file" > "$norm1_file" 2>/dev/null
    db_normalize_dump "$dump2_file" > "$norm2_file" 2>/dev/null
    if diff "$norm1_file" "$norm2_file" > /dev/null 2>&1; then
        record_result "$case_name" "pass" "normalized data identical"
        return 0
    else
        local diff_file="$E2E_TMP_DIR/${case_name}_norm_diff.txt"
        diff "$norm1_file" "$norm2_file" > "$diff_file" 2>&1
        local diff_lines
        diff_lines=$(wc -l < "$diff_file")
        record_result "$case_name" "fail" "normalized diff ($diff_lines lines): $diff_file"
        return 1
    fi
}

db_compare_all() {
    local db1="$1"
    local db2="$2"
    local case_prefix="$3"
    local mode="${4:-exact}"
    local overall_fail=0
    if ! db_compare_table_list "$db1" "$db2" "${case_prefix}_table_list"; then
        overall_fail=1
    fi
    if ! db_compare_schema "$db1" "$db2" "${case_prefix}_schema"; then
        overall_fail=1
    fi
    if ! db_compare_row_counts "$db1" "$db2" "${case_prefix}_row_counts"; then
        overall_fail=1
    fi
    if [[ "$mode" == "exact" ]]; then
        if ! db_compare_data_exact "$db1" "$db2" "${case_prefix}_data"; then
            overall_fail=1
        fi
    elif [[ "$mode" == "normalized" ]]; then
        if ! db_compare_data_normalized "$db1" "$db2" "${case_prefix}_data_norm"; then
            overall_fail=1
        fi
    elif [[ "$mode" == "both" ]]; then
        if ! db_compare_data_exact "$db1" "$db2" "${case_prefix}_data_exact"; then
            log_warn "exact comparison failed, trying normalized"
            if ! db_compare_data_normalized "$db1" "$db2" "${case_prefix}_data_norm"; then
                overall_fail=1
            fi
        fi
    fi
    return $overall_fail
}

db_get_table_summary() {
    local db_file="$1"
    local tables
    tables=$(db_get_tables "$db_file")
    echo "Database: $db_file"
    echo "Tables:"
    for table in $tables; do
        local count
        count=$(db_count_rows "$db_file" "$table")
        printf "  %-40s %s rows\n" "$table" "$count"
    done
}

db_export_to_csv() {
    local db_file="$1"
    local output_dir="$2"
    local tables
    tables=$(db_get_tables "$db_file")
    mkdir -p "$output_dir"
    for table in $tables; do
        local csv_file="$output_dir/${table}.csv"
        "$SQLITE3_BIN" -header -csv "$db_file" "SELECT * FROM $table;" > "$csv_file" 2>/dev/null
    done
    echo "Exported $(echo "$tables" | wc -l) tables to $output_dir"
}
