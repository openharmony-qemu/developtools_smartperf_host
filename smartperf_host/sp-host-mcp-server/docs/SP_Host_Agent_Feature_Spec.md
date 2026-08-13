# SP Host Agent 功能详细说明文档

> 版本：1.0.0 | 更新日期：2026-08-06

## 1. 产品概述

SP Host Agent 是 OpenHarmony SmartPerf Host 性能功耗调优平台的 AI 智能诊断扩展。它通过 MCP（Model Context Protocol）协议将 34 个专业分析工具暴露给 AI 代理（如 opencode），使用户可以用自然语言完成 Trace 文件的性能诊断，实现从"30 分钟手动分析"到"30 秒自动诊断"的效率跃升。

### 1.1 核心能力

| 能力 | 说明 |
|------|------|
| **9 大维度分诊** | Jank / Memory / CPU / GPU / IO / Network / Power / Hang / Sched |
| **零重复解析** | 直接复用浏览器已加载的 WASM DB，避免 trace_streamer 重新解析 |
| **浏览器 UI 联动** | 分析结果自动同步到浏览器，跳转时间线、选中进程、展示查询结果 |
| **自定义技能系统** | 用户注册 SQL 技能，一次注册永久复用，团队共享 |
| **工作流引擎** | 多步骤自动诊断编排，支持并行执行和步骤间参数传递 |
| **知识库** | 领域经验沉淀与检索，辅助 AI 做出更精准的诊断 |

### 1.2 系统架构

```
┌─────────────────┐     MCP (stdio)     ┌──────────────────┐
│  LLM / opencode │ ◄──────────────────► │    MCP Server     │
│  (自然语言交互)   │                      │  (34 工具注册)     │
└─────────────────┘                       │  better-sqlite3   │
                                          └────────┬─────────┘
                                                   │ WebSocket :19099
                                          ┌────────▼─────────┐
                                          │    扩展服务        │
                                          │ (二进制协议转发)    │
                                          │ (DB 文件管理)      │
                                          └────────┬─────────┘
                                                   │ WebSocket
                                          ┌────────▼─────────┐
                                          │  SP Host 浏览器    │
                                          │  WASM trace_streamer│
                                          │  Canvas 泳道渲染   │
                                          │  DB 导出 / UI 控制  │
                                          └──────────────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │  trace_streamer   │
                                          │  C++17 原生可执行  │
                                          │  -e 导出 SQLite DB │
                                          └──────────────────┘
```

### 1.3 通信协议

**扩展服务二进制协议**：20 字节头部（大端序）+ 数据体

| 偏移 | 长度 | 字段 | 说明 |
|------|------|------|------|
| 0 | 1B | type | 消息类型（0=系统, 8=诊断, 20=Agent） |
| 1 | 2B | cmd | 命令编号（1=登录, 1=发DB, 5=导出DB, 等） |
| 3 | 1B | session_id | 会话 ID |
| 4 | 8B | session | 会话令牌 |
| 12 | 4B | data_length | 数据体长度 |
| 16 | 4B | reserved | 保留字段 |
| 20 | NB | data | 数据体（JSON 或二进制） |

---

## 2. 工具清单（34 个）

### 2.1 基础设施工具（5 个）

#### sp-set-trace-file

设置要分析的 Trace 文件路径。MCP Server 调用 trace_streamer 导出 SQLite DB，然后用 better-sqlite3 以只读模式打开。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| traceFile | string | 是 | Trace 文件绝对路径（支持 .htrace / .bytrace / .rawtrace） |

**执行流程**：
1. 关闭当前 DB 连接，清理临时文件
2. 调用 `trace_streamer <traceFile> -e <dbPath>` 导出 DB（30s~5min）
3. 用 better-sqlite3 以 readonly 模式打开导出的 DB
4. 返回成功消息

**注意事项**：
- 首次调用会触发 trace_streamer 导出，耗时较长
- 后续查询复用同一 DB，无需重复导出
- 临时 DB 文件在进程退出时自动清理

#### sp-get-current-trace

获取浏览器当前已打开的 Trace 数据。浏览器导出 WASM DB，经扩展服务写入磁盘，MCP Server 直接读取——零重复解析。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| （无参数） | | | |

**执行流程**：
1. MCP Server 通过扩展服务向浏览器发送 EXPORT_DB 命令
2. 浏览器 WASM 调用 `download-db` 导出 DB
3. ArrayBuffer 分片传输到扩展服务
4. 扩展服务写入 `%TEMP%/sp-agent/trace-{sid}-{ts}.db`
5. MCP Server 用 better-sqlite3 打开 DB（不删除，用户可能仍在使用）

**前置条件**：
- 扩展服务已启动并连接浏览器
- 浏览器中已加载 Trace 文件

**超时**：120 秒（DB 导出+传输可能耗时 5~30s）

#### sp-execute-query

对 Trace 数据执行 SQL 查询。仅允许 SELECT/WITH 语句。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | 是 | SQL 查询语句（SELECT/WITH only） |

**安全规则**：
- 禁止 DDL/DML/PRAGMA（DROP/DELETE/UPDATE/INSERT/ALTER/CREATE/PRAGMA）
- SQL 注释在检查前会被移除
- 禁止分号
- 查询结果最多 5000 行
- 必须使用 `ipid/itid`（非 `pid/tid`）进行关联
- 必须使用 `args_view`（非 `args` 表）

#### sp-list-tables

列出 Trace 数据库中所有可用的表和视图。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| （无参数） | | | |

#### sp-list-table-structure

显示指定表的列结构信息。在编写 SQL 查询前，建议先调用此工具了解表结构。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| table | string | 是 | 表名（如 `thread_state`、`frame_slice`） |

---

### 2.2 Jank 分析工具（3 个）

#### sp-triage-jank

**Phase 1 分诊工具**，必须首先调用。检测卡顿帧和丢帧情况。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 否 | 指定进程的内部 ID，不传则分析所有进程 |

**返回信息**：
- 各进程的帧数统计
- 按 flag 分类的帧分布（0=正常, 1=超时丢帧, 2=无效过滤, 3=异常帧）
- vsync 范围

**底层 SQL**（triage_jank.sql）：
```sql
SELECT p.name, p.ipid, fs.flag, COUNT(*) AS frame_count,
       MIN(fs.vsync) AS min_vsync, MAX(fs.vsync) AS max_vsync
FROM frame_slice fs JOIN process p ON fs.ipid = p.id
WHERE fs.type = 0 AND fs.flag <> 2
GROUP BY p.name, p.ipid, fs.flag ORDER BY frame_count DESC;
```

#### sp-analyze-jank-detail

**Phase 2 深度分析**，在 Phase 1 分诊结果基础上调用。分析指定进程的帧时间线。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 是 | 进程内部 ID（从分诊结果获取） |
| startTime | number | 否 | 起始时间（纳秒，相对 trace 起始） |
| endTime | number | 否 | 结束时间（纳秒，相对 trace 起始） |

**返回信息**：
- 每帧的 ts、dur、vsync、flag、type
- src_slice / dst_slice（源/目标时间片）

#### sp-jank-cpu-context

**Phase 2 深度分析**，分析卡顿时段的 CPU 调度上下文。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 是 | 进程内部 ID |
| startTime | number | 是 | 卡顿起始时间（纳秒） |
| endTime | number | 是 | 卡顿结束时间（纳秒） |

**返回信息**：
- 卡顿时段内各线程的 CPU 占用
- 线程状态（Running/Sleeping/...）
- 调度信息

**注意事项**：
- `thread_state` 表使用 `state` 列（非 `end_state`）
- `thread_state` 无 `priority` 列，需 JOIN `sched_slice` 获取 priority/end_state

---

### 2.3 内存分析工具（4 个）

#### sp-triage-memory

**Phase 1 分诊工具**。内存使用概览。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 否 | 指定进程 ID |

**返回信息**：
- 各进程的 RSS/PSS/VSS 峰值、最小值、最新值
- 内存增长趋势

**注意事项**：
- `measure` 表无 `id` 列，复合键为 `(ts, filter_id)`

#### sp-analyze-memory-detail

**Phase 2 深度分析**。指定进程的内存时间线。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 是 | 进程内部 ID |
| metric | string | 否 | 指标名（如 `mem.rss`、`mem.pss`） |

**返回信息**：
- 时间序列的内存指标值（mem.rss, mem.pss, mem.vss, mem.heap_size）

#### sp-analyze-native-hook

**Phase 2 深度分析**。NativeHook 内存分析，支持详细模式和统计模式。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 是 | 进程内部 ID |
| eventType | string \| number | 否 | 详细模式：TEXT 字符串；统计模式：MemoryStatisticType 整数 (0-21) |
| isStatistic | boolean | 否 | 默认 false。true=统计模式，false=详细模式 |

**两种模式**：

| 模式 | 查询表 | eventType 类型 | 说明 |
|------|--------|---------------|------|
| 详细模式（默认） | native_hook | TEXT 字符串 | 逐次 alloc/free 匹配，38 种 event_type |
| 统计模式 | native_hook_statistic | INTEGER 0-21 | 按栈维度聚合，MemoryStatisticType 枚举 |

**统计模式 eventType 枚举**（0-21）：

| 值 | 含义 | 值 | 含义 |
|----|------|----|------|
| 0 | MALLOC | 11 | MMAP_MAPPED |
| 1 | MUNMAP | 12 | MUNMAP_MAPPED |
| 2 | MMAP | 13 | MALLOC_STATISTIC |
| 3 | FREE | 14 | MMAP_STATISTIC |
| 4 | MMAP_FILE | 15 | MUNMAP_STATISTIC |
| 5 | MUNMAP_FILE | 16 | PR_SET_VMA |
| 6 | MALLOC_AND_MMAP | 17 | FREE_STATISTIC |
| 7 | FREE_AND_MUNMAP | 18 | JS_STATISTIC |
| 8 | MALLOC_AGING | 19 | JS_SNAPSHOT |
| 9 | MMAP_AGING | 20 | NEW_HEAP |
| 10 | MUNMAP_AGING | 21 | MY_HEAP |

#### sp-analyze-js-heap

**Phase 2 深度分析**。JS 堆内存统计。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 是 | 进程内部 ID |

**返回信息**：
- js_heap 相关指标的时间序列数据

---

### 2.4 CPU 分析工具（3 个）

#### sp-triage-cpu

**Phase 1 分诊工具**。CPU 调度概览。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cpuId | number | 否 | 指定 CPU 核心 ID |

**返回信息**：
- 各 CPU 核心的利用率
- Top CPU 消耗线程排名
- 调度统计

#### sp-analyze-sched-latency

**Phase 2 深度分析**。调度延迟分布。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itid | number | 否 | 指定线程 ID |

**返回信息**：
- 各线程的调度延迟（从就绪到运行的时间）
- CPU 核心分配
- end_state、priority（来自 sched_slice）

#### sp-analyze-thread-state

**Phase 2 深度分析**。线程状态分布。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itid | number | 是 | 线程内部 ID |

**返回信息**：
- 各状态（Running/Sleeping/Blocked 等）的次数和总时长
- 按总时长降序排列

**注意事项**：
- `thread_state.state` 为 TEXT 类型（如 "Running"、"Sleeping"）
- `thread_state` 无 `priority` 列

---

### 2.5 扩展分诊工具（5 个）

#### sp-triage-gpu

GPU 内存使用分诊。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 否 | 指定进程 ID |

**返回信息**：GPU 内存分配时间线、总 GPU 大小、各类别 GPU 窗口大小

#### sp-triage-io

IO 操作分诊。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 否 | 指定进程 ID |

**返回信息**：各进程的 IO 统计（读/写、阻塞/非阻塞）、IO 次数、持续时间、大小

**filesystem_io 表列**：`id, itid, ipid, start_time, end_time, duration, is_block, is_write, main_dev, sub_dev, ino, enter_size, enter_offset, exit_offset, request_bytes, actual_bytes, file_id, sector, nr_sector, rwbs_id, cmd_id`

#### sp-triage-network

网络请求分诊。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 否 | 指定进程 ID |

**返回信息**：各进程的请求数、缓存命中率、平均耗时

#### sp-triage-power

功耗分诊。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| metricName | string | 否 | 指标名过滤 |

**返回信息**：xpower 指标的采样数、峰值、最小值、平均值

#### sp-triage-hang

应用卡死分诊。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 否 | 指定进程 ID |

**返回信息**：各进程的卡死次数、总/平均/最大卡死时长

---

### 2.6 浏览器 UI 工具（5 个）

#### sp-show-timeline

聚焦浏览器时间线到指定时间范围和/或选中进程。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startTime | number | 否 | 起始时间（纳秒） |
| endTime | number | 否 | 结束时间（纳秒） |
| ipid | number | 否 | 选中进程 ID |

**前置条件**：扩展服务 + 浏览器连接

#### sp-select-process

在泳道视图中选中/高亮指定进程。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ipid | number | 是 | 进程内部 ID |
| processName | string | 否 | 进程名称（辅助定位） |

**前置条件**：扩展服务 + 浏览器连接

#### sp-focus-range

精确缩放时间线到指定时间范围。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startTime | number | 是 | 起始时间（纳秒） |
| endTime | number | 是 | 结束时间（纳秒） |

**前置条件**：扩展服务 + 浏览器连接

#### sp-show-query-result

在 SP Host 查询面板中展示 SQL 查询结果。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | 是 | SQL 查询语句 |
| title | string | 否 | 查询结果标题 |

**前置条件**：扩展服务 + 浏览器连接

#### sp-get-current-trace

（见 2.1 节，此处归入 UI 工具是因为它依赖浏览器连接）

---

### 2.7 技能系统工具（4 个）

#### sp-register-skill

注册自定义分析技能。技能名称必须以 `sp-` 开头，且不能与内置工具冲突。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 技能名称（sp- 前缀，[a-zA-Z0-9_-]+） |
| description | string | 是 | 技能描述 |
| schema | object | 是 | 参数 Schema（JSON Schema 格式） |
| sqlTemplate | string | 是 | SQL 模板（SELECT only，支持 `:param` 占位符） |
| domain | string | 否 | 所属领域（如 jank、memory、cpu） |

**SQL 模板参数化**：
- 使用 `:paramName` 作为占位符
- 参数替换时进行字边界匹配，防止部分替换
- 支持 IN 列表（`:ids` → `1, 2, 3`）
- 字符串参数自动 SQLite 转义（`'` → `''`，不使用反斜杠）

**安全校验**：
- SQL 必须以 SELECT 或 WITH 开头
- 禁止 DDL/DML/PRAGMA
- 禁止分号
- 注释在检查前移除

**示例**：
```json
{
  "name": "sp-top-jank-processes",
  "description": "查找卡顿帧最多的进程",
  "schema": { "limit": { "type": "number", "default": 10 } },
  "sqlTemplate": "SELECT p.name, COUNT(*) AS jank_count FROM frame_slice fs JOIN process p ON fs.ipid = p.id WHERE fs.flag = 1 GROUP BY p.name ORDER BY jank_count DESC LIMIT :limit",
  "domain": "jank"
}
```

#### sp-execute-skill

按名称执行已注册的技能。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 技能名称 |
| params | object | 否 | 参数键值对 |

#### sp-list-skills

列出所有已注册的自定义技能。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| （无参数） | | | |

**返回信息**：技能名称、描述、领域、参数 Schema

#### sp-delete-skill

删除指定技能。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 技能名称 |

---

### 2.8 知识库工具（3 个）

#### sp-upload-knowledge

上传领域知识文档到知识库。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 知识名称（[a-zA-Z0-9_-]+） |
| content | string | 是 | 知识内容（Markdown / 纯文本 / JSON） |
| type | string | 是 | 知识类型（如 best-practice、troubleshooting、optimization） |

**名称校验**：正则 `[a-zA-Z0-9_-]+`，防止路径遍历攻击

#### sp-search-knowledge

搜索知识库。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | 是 | 搜索关键词 |
| topK | number | 否 | 返回结果数量（默认 5） |

**搜索方式**：关键词匹配（标题 + 内容 + 标签）

#### sp-delete-knowledge

删除指定知识文档。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 知识名称 |

---

### 2.9 工作流工具（2 个）

#### sp-list-workflows

列出所有可用的工作流模板。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| （无参数） | | | |

**预置工作流**：

| 工作流名 | 描述 | 步骤 |
|----------|------|------|
| full-triage | 全维度分诊：8 个维度并行执行 | triage_jank / triage_memory / triage_cpu / triage_gpu / triage_io / triage_network / triage_power / triage_hang（全部并行） |
| jank-deep-dive | 卡顿深度分析：分诊→详情→CPU 上下文 | triage_jank → jank_detail(ipid) → jank_cpu_context(ipid, startTime, endTime) |
| memory-leak-hunt | 内存泄漏追踪：分诊→详情→NativeHook | triage_memory → memory_detail(ipid) → native_hook_detail(ipid) |
| cpu-sched-analysis | CPU 调度分析：分诊→调度延迟→线程状态 | triage_cpu → sched_latency → thread_state_summary(itid) |

#### sp-execute-workflow

执行指定工作流。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 工作流名称 |
| args | object | 否 | 工作流参数（传递给各步骤） |

**执行机制**：
- `parallel: true` 的步骤通过 `Promise.all` 并行执行
- 非并行步骤按顺序执行
- 步骤间参数传递：`${stepId.content.0.fieldName}` 语法引用前序步骤结果

---

## 3. 数据模型

### 3.1 核心表结构

| 表名 | 用途 | 关键列 |
|------|------|--------|
| process | 进程信息 | id, ipid, pid, name |
| thread | 线程信息 | id, itid, ipid, name, is_main_thread |
| trace_range | Trace 时间范围 | start_ts, end_ts |
| frame_slice | 帧数据 | id, ipid, ts, dur, vsync, flag, type, src, dst |
| thread_state | 线程状态 | itid, ts, dur, cpu, state（TEXT） |
| sched_slice | 调度信息 | itid, ts, dur, cpu, end_state, priority |
| measure | 测量值 | ts, filter_id, value（无 id 列！） |
| measure_filter | 测量过滤器 | id, name, type |
| process_measure_filter | 进程测量过滤器 | id, ipid, name |
| native_hook | NativeHook 详细 | id, ipid, itid, start_ts, dur, event_type, heap_size, addr |
| native_hook_statistic | NativeHook 统计 | id, ipid, ts, type, apply_count, release_count, apply_size, release_size |
| filesystem_io | 文件 IO | id, itid, ipid, start_time, end_time, duration, is_block, is_write, request_bytes, actual_bytes |
| network_time_information | 网络请求 | ipid, begin_time, end_time, cache_hit |
| callstack | 调用栈 | callid, ts, dur, name, depth |
| memory_profile | GPU 内存 | ts, total_size |
| args_view | 参数视图 | args_key, args_type（使用此表，非 args） |

### 3.2 关键概念

| 概念 | 说明 |
|------|------|
| ipid / itid | 内部进程/线程唯一标识，非系统 pid/tid。内核会复用 pid/tid，ipid/itid 是关联 process/thread 的主键 |
| trace_range | 所有时间戳需减去 `trace_range.start_ts` 才是相对时间 |
| flag | frame_slice.flag：0=正常, 1=超时丢帧, 2=无效过滤, 3=异常帧 |
| event_type | NativeHook 详细模式：38 种 TEXT 值；统计模式：MemoryStatisticType INTEGER 0-21 |
| args_view | 使用 args_view（非 args）进行参数查询 |

---

## 4. 安全机制

### 4.1 SQL 安全

| 规则 | 说明 |
|------|------|
| 只读查询 | 仅允许 SELECT/WITH，禁止 DDL/DML/PRAGMA |
| 注释移除 | 检查前移除 SQL 注释，防止绕过 |
| 禁止分号 | 防止多语句注入 |
| 行数限制 | 查询结果最多 5000 行 |
| 参数化 | `:param` 占位符 + 字边界替换 + SQLite 转义 |

### 4.2 数据安全

| 规则 | 说明 |
|------|------|
| DB 只读 | better-sqlite3 readonly 模式打开 |
| 虚表只读 | 虚表 Update() 返回 SQLITE_READONLY |
| 临时文件清理 | trace_streamer 导出的临时 DB 在进程退出时自动删除 |
| 浏览器 DB 保留 | 浏览器导出的 DB 不在 closeDb 时删除 |

### 4.3 通信安全

| 规则 | 说明 |
|------|------|
| 本地运行 | MCP Server 通过 stdio 通信，不暴露网络端口 |
| 本地 WebSocket | 扩展服务连接仅限 127.0.0.1 |
| 名称校验 | 技能/知识名称正则 `[a-zA-Z0-9_-]+`，防止路径遍历 |
| 登录认证 | 扩展服务需登录获取 session_id + token |

---

## 5. 性能特征

| 操作 | 延迟 | 说明 |
|------|------|------|
| sp-set-trace-file | 30s~5min | trace_streamer 解析+导出 DB |
| sp-get-current-trace | 5~30s | WASM DB 导出+传输（零重复解析） |
| SQL 查询 | <100ms | better-sqlite3 直接查询 |
| 分诊工具 | 200ms~2s | 含 SQL 执行+结果格式化 |
| UI 工具 | <1s | 命令发送+异步等待 |
| 工作流（并行） | 2~5s | 8 个维度并行分诊 |

---

## 6. 降级策略

| 条件 | 降级行为 |
|------|----------|
| 扩展服务未启动 | UI 工具返回错误提示，SQL/分诊工具正常工作 |
| 浏览器未连接 | sp-get-current-trace 失败，提示用 sp-set-trace-file |
| DB 导出超时（120s） | 返回超时错误，建议用 sp-set-trace-file |
| trace_streamer 不存在 | sp-set-trace-file 失败，提示检查 TRACE_STREAMER_PATH |
| 查询结果超 5000 行 | 返回错误，建议使用聚合查询 |

---

## 7. 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| TRACE_STREAMER_PATH | `trace_streamer` | trace_streamer 可执行文件路径 |
| SP_AGENT_EXT_HOST | `127.0.0.1` | 扩展服务 WebSocket 地址 |
| SP_AGENT_EXT_PORT | `19099` | 扩展服务 WebSocket 端口 |
| TRACE_FILE | （空） | 默认 Trace 文件路径（可选） |
