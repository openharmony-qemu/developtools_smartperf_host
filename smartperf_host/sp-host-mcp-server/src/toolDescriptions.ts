/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const SpToolDescriptions = {
  spSetTraceFile: 'Set or change the trace file to analyze. The MCP Server will export the database automatically using trace_streamer. Use this tool when you want to analyze a different trace file without restarting.',
  spExecuteQuery: 'RECOMMENDED: call sp-triage-* tools first for structured analysis. Raw SQL is for advanced users only. Execute SQL against trace data. MUST use ipid/itid (not pid/tid) for joins. MUST use args_view (not args table). If unsure about schema, use sp-list-table-structure first. Results limited to 5000 rows.',
  spListProcesses: 'List all processes from trace (id, ipid, pid, name). Use ipid (not pid) for subsequent queries.',
  spListTables: 'List available tables and views in the trace database.',
  spListTableStructure: 'Show column structure of a table. Use this before writing queries to understand the schema.',

  spTriageJank: 'Phase 1 MUST call first. Jank/frame drop triage. Returns: frame count, jank count, flag distribution (0=normal, 1=timeout drop, 2=invalid row filtered, 3=abnormal frame), top janky processes.',
  spAnalyzeJankDetail: 'Do NOT call until Phase 1 triage results are available. Detailed jank analysis: frame timeline, per-frame duration, source/destination timing.',
  spJankCpuContext: 'Do NOT call until Phase 1 triage results are available. CPU scheduling context during jank periods: which threads were running, preemption, CPU affinity. IMPORTANT: thread_state uses `state` column (not `end_state`); thread_state has no `priority` column, use JOIN sched_slice for priority/end_state.',

  spTriageMemory: 'Phase 1 MUST call first. Memory usage triage. Returns: per-process memory metrics (rss, pss, vss), peak values, growth trend. IMPORTANT: measure table has no `id` column, composite key is (ts, filter_id).',
  spAnalyzeMemoryDetail: 'Do NOT call until Phase 1 triage results are available. Detailed memory timeline: process_measure values over time for specific process.',
  spAnalyzeNativeHook: 'Do NOT call until Phase 1 triage results are available. Native Hook analysis. For detail mode (native_hook table): eventType is TEXT string. For statistic mode (native_hook_statistic table): type is MemoryStatisticType INTEGER (0-21). Set isStatistic=true for statistic mode. IMPORTANT: When isStatistic=true, eventType must be an INTEGER (0-21), not a string.',
  spAnalyzeJsHeap: 'Do NOT call until Phase 1 triage results are available. JS heap statistics analysis.',

  spTriageCpu: 'Phase 1 MUST call first. CPU scheduling triage. Returns: per-CPU utilization, top CPU-consuming threads, scheduling statistics. IMPORTANT: thread_state uses `state` column (not `end_state`); thread_state has no `priority`, use JOIN sched_slice for priority/end_state.',
  spAnalyzeSchedLatency: 'Do NOT call until Phase 1 triage results are available. Scheduling latency distribution: ready-to-run to running delay per thread.',
  spAnalyzeThreadState: 'Do NOT call until Phase 1 triage results are available. Thread state distribution: Running/Sleeping/Blocked time percentages per thread. IMPORTANT: thread_state uses `state` column (TEXT, values like "Running"/"Sleeping"), NOT `end_state`; thread_state has no `priority` column.',

  spTriageGpu: 'Phase 1 MUST call first for GPU analysis. GPU memory usage triage. Returns: GPU memory allocation timeline, total GPU size, window GPU size by category.',
  spTriageIo: 'Phase 1 MUST call first for IO analysis. IO operation triage. Returns: per-process IO statistics (read/write, blocking/non-blocking), IO count, duration, size.',
  spTriageNetwork: 'Phase 1 MUST call first for network analysis. Network request triage. Returns: per-process request count, cache hit rate, average duration.',
  spTriagePower: 'Phase 1 MUST call first for power analysis. Power consumption triage. Returns: xpower metrics (sample count, peak, min, avg values) by metric name.',
  spTriageHang: 'Phase 1 MUST call first for hang analysis. Application hang triage. Returns: per-process hang count, total/avg/max hang duration. Hang events are callstack entries with name matching "H:Et:%" pattern.',

  spShowTimeline: 'Focus timeline on time range and/or select a process. Timestamps are nanosecond integers. Requires extension service + browser connection. Returns immediately; browser executes asynchronously.',
  spSelectProcess: 'Select/highlight a process in the swim lane view. Can use ipid or processName. Requires extension service + browser connection. Returns immediately.',
  spFocusRange: 'Zoom timeline to specific time range. Timestamps are nanosecond integers. Requires extension service + browser connection. Returns immediately.',
  spShowQueryResult: 'Show SQL query result in SP Host query panel. Requires extension service + browser connection. Returns immediately.',

  spGetCurrentTrace: 'Get trace data from the currently opened SP Host browser session. The browser exports its WASM trace_streamer DB through the extension service, and the MCP Server loads it directly — avoiding duplicate trace parsing. Requires extension service + browser with a trace file loaded. Use this when the user has already opened a trace in SP Host and wants AI analysis without re-parsing.',

  spRegisterSkill: 'Register a custom analysis skill. Skill name MUST start with "sp-" prefix and must NOT conflict with built-in tools. The sqlTemplate must be a SELECT-only query (no DROP/DELETE/UPDATE/INSERT/ALTER/CREATE).',
  spExecuteSkill: 'Execute a registered custom skill by name. The skill\'s SQL template will be executed with the provided parameters. Use sp-list-skills to see available skills.',
  spListSkills: 'List all registered custom skills. Returns skill names, descriptions, and domains.',
  spDeleteSkill: 'Delete a custom skill by name.',

  spSearchKnowledge: 'Search domain knowledge base for trace analysis guidance. Returns relevant document snippets.',
  spUploadKnowledge: 'Upload a document to the knowledge base (Markdown, text, or JSON). The document will be indexed for future searches.',
  spDeleteKnowledge: 'Delete a knowledge document by name.',

  spExecuteWorkflow: 'Execute a predefined workflow by name. Returns all step results. Available workflows: full-triage, jank-deep-dive, memory-leak-hunt, cpu-sched-analysis. Use sp-list-workflows to see details.',
  spListWorkflows: 'List available workflow templates with descriptions.',
};
