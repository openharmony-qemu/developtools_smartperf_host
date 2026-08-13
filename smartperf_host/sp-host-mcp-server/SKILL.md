---
name: smartperf-host
description: SmartPerf Host Agent. Provides MCP tools for analyzing OpenHarmony trace data (jank, memory, CPU, GPU, IO, network, power, hang). Use sp-set-trace-file to load a trace, then call sp-triage-* tools for domain triage.
---

# SmartPerf Host Agent

## Route Guidance

| User mentions | Call this tool first |
|---|---|
| Jank / frame drop / 卡顿 / 丢帧 | `sp-triage-jank` |
| Memory / 内存 / 内存泄漏 / OOM | `sp-triage-memory` |
| CPU / scheduling / 调度 / CPU占用 | `sp-triage-cpu` |
| GPU / GPU内存 / 显存 | `sp-triage-gpu` |
| IO / disk / 文件读写 / 磁盘 | `sp-triage-io` |
| Network / 网络 / HTTP / 请求 | `sp-triage-network` |
| Power / 功耗 / 电量 / xpower | `sp-triage-power` |
| Hang / 卡死 / ANR / 冻结 | `sp-triage-hang` |
| Unknown / general issue | `sp-triage-jank` + `sp-triage-memory` + `sp-triage-cpu` |

## Phase-Gating Rules

1. **Phase 1 (MUST call first)**: `sp-triage-*` tools return overview metrics
2. **Phase 2 (requires Phase 1 results)**: `sp-analyze-*` and `sp-jank-cpu-context` tools return detailed analysis
3. **NEVER** call Phase 2 tools before Phase 1 triage returns valid results
4. After `sp-set-trace-file`, all Phase 1 state resets — must re-triage

## Critical Constraints

- **ipid/itid are core keys**: MUST use `ipid/itid` (internal process/thread IDs) for joins, NOT `pid/tid`
- **args_view not args**: MUST use `args_view` table instead of `args` table
- **Virtual tables are read-only**: No UPDATE/INSERT/DELETE on trace tables
- **thread_state**: Uses `state` column (TEXT), NOT `end_state`; no `priority` column
- **measure table**: No `id` column; composite key is `(ts, filter_id)`
- **Schema Discovery SOP**: `sp-list-tables` → `sp-list-table-structure` → `sp-execute-query`

## UI Tools

- Require extension service + browser connection
- Return immediately; browser executes asynchronously
- If extension service not connected, tools return error with guidance

## Tool Categories

| Category | Tools | Count |
|---|---|---|
| Trace Management | sp-set-trace-file, sp-execute-query, sp-list-processes, sp-list-tables, sp-list-table-structure | 5 |
| Jank Diagnosis | sp-triage-jank, sp-analyze-jank-detail, sp-jank-cpu-context | 3 |
| Memory Diagnosis | sp-triage-memory, sp-analyze-memory-detail, sp-analyze-native-hook, sp-analyze-js-heap | 4 |
| CPU Diagnosis | sp-triage-cpu, sp-analyze-sched-latency, sp-analyze-thread-state | 3 |
| Extended Triage | sp-triage-gpu, sp-triage-io, sp-triage-network, sp-triage-power, sp-triage-hang | 5 |
| UI Operations | sp-show-timeline, sp-select-process, sp-focus-range, sp-show-query-result | 4 |
| Skill Management | sp-register-skill, sp-list-skills, sp-delete-skill | 3 |
| Knowledge Base | sp-search-knowledge, sp-upload-knowledge | 2 |
| Workflow | sp-execute-workflow, sp-list-workflows | 2 |
| **Total** | | **31** |
