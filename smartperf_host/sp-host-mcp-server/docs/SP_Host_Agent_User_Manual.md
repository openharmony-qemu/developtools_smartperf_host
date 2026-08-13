# SP Host Agent 用户操作手册

> 版本：1.1.0 | 更新日期：2026-08-12

---

## 目录

1. [环境准备](#1-环境准备)
2. [安装与配置](#2-安装与配置)
3. [快速开始](#3-快速开始)
4. [核心操作指南](#4-核心操作指南)
5. [高级用法](#5-高级用法)
6. [部署场景](#6-部署场景)
7. [常见问题与排障](#7-常见问题与排障)
8. [参考信息](#8-参考信息)

---

## 1. 环境准备

### 1.1 能力边界

> **SP Host Agent 是 Trace 分析工具，不是 Trace 抓取工具。** 它负责解析已抓取的 trace 文件并进行性能诊断，不包含 trace 采集能力。如需抓取 trace，请使用 hdc 命令或 DevEco Studio 的 Profiler 功能。

### 1.2 前置条件

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ≥ 16.15.1 | MCP Server 运行环境 |
| npm | ≥ 8.13.2 | 包管理 |
| opencode | 最新版 | AI 代理客户端 |
| SP Host 浏览器 | 最新版 | Trace 可视化界面 |
| 扩展服务 | 最新版 | 通信桥接 |
| trace_streamer | C++17 编译 | Trace 解析引擎 |
| Go | ≥ 1.13.8 | SP Host HTTPS 服务（可选） |

### 1.3 组件关系

```
┌──────────────────┐
│   opencode (AI)   │ ← 用户在这里输入自然语言
└────────┬─────────┘
         │ MCP (stdio)
┌────────▼─────────┐
│   MCP Server      │ ← 34 个分析工具
└────────┬─────────┘
         │ WebSocket :19099
┌────────▼─────────┐
│   扩展服务         │ ← 通信桥接
└────────┬─────────┘
         │ WebSocket
┌────────▼─────────┐
│   SP Host 浏览器   │ ← Trace 可视化 + WASM 解析
└──────────────────┘
```

### 1.4 启动顺序

组件之间有依赖关系，**必须按以下顺序启动**：

1. **扩展服务** — `node app.js`（监听 19099 端口）
2. **浏览器** — 访问 `https://localhost:9000`，加载 Trace 文件（浏览器会自动连接扩展服务）
3. **opencode** — MCP Server 启动时不自动连接扩展服务，在首次调用需要扩展服务的工具时按需连接

> 如果顺序反了（先启动浏览器再启动扩展服务），浏览器不会自动重连，需要手动刷新浏览器页面。

---

## 2. 安装与配置

### 2.1 编译 MCP Server

```bash
cd sp-host-mcp-server
npm install
npm run build
```

编译产物：`dist/index.js`

### 2.2 编译 trace_streamer

```bash
cd trace_streamer
# Windows
./build.sh
# 产物：out/windows/trace_streamer.exe
```

### 2.3 配置 opencode

在项目根目录 `smartperf_host/opencode.json` 中添加 MCP Server 配置：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "smartperf-host": {
      "type": "local",
      "command": ["node", "D:/SPAgent/developtools_smartperf_host/smartperf_host/sp-host-mcp-server/dist/index.js"],
      "enabled": true,
      "timeout": 120000,
      "environment": {
        "TRACE_STREAMER_PATH": "D:/SPAgent/developtools_smartperf_host/smartperf_host/trace_streamer/out/windows/trace_streamer.exe",
        "SP_AGENT_EXT_HOST": "127.0.0.1",
        "SP_AGENT_EXT_PORT": "19099"
      }
    }
  }
}
```

**配置说明**：

| 字段 | 说明 |
|------|------|
| command | MCP Server 入口文件路径（必须指向编译后的 `dist/index.js`） |
| timeout | 单次工具调用超时（毫秒），建议 120000（sp-get-current-trace 需要较长超时） |
| TRACE_STREAMER_PATH | trace_streamer 可执行文件绝对路径（**必填**） |
| SP_AGENT_EXT_HOST | 扩展服务地址，默认 `127.0.0.1` |
| SP_AGENT_EXT_PORT | 扩展服务端口，默认 `19099` |

### 2.4 启动扩展服务

```bash
# 进入扩展服务目录
cd hi-smart-perf-host-extend
# 启动扩展服务
node app.js
```

扩展服务启动后监听 WebSocket `ws://127.0.0.1:19099`。

### 2.5 启动 SP Host 浏览器

```bash
cd ide
npm run build:dev   # 开发模式
# 或
npm run build:prod  # 生产模式（需 Go）
```

浏览器访问 `https://localhost:9000`，加载 Trace 文件后，浏览器会自动连接扩展服务。

**确认连接状态**：
- 打开浏览器 DevTools（F12）→ Console，查看是否有 WebSocket 连接日志
- 扩展服务终端会显示连接信息

---

## 3. 快速开始

### 3.1 场景一：浏览器已打开 Trace（推荐）

这是最常用的场景，零重复解析，速度最快。

**步骤**：

1. 在浏览器中打开 SP Host，加载 Trace 文件
2. 启动 opencode
3. 输入自然语言指令：

```
帮我分析这个 trace 的卡顿问题
```

AI 会自动执行以下操作：
- `sp-get-current-trace` — 获取浏览器当前 Trace 的 DB
- `sp-triage-jank` — 卡顿分诊
- `sp-analyze-jank-detail` — 深度分析
- `sp-focus-range` — 浏览器跳转到异常时段
- 输出诊断报告

### 3.2 场景二：本地 Trace 文件

无需浏览器，直接分析本地文件。

**步骤**：

1. 启动 opencode
2. 输入：

```
分析 D:/traces/demo.htrace 的内存使用情况
```

AI 会自动执行：
- `sp-set-trace-file` — 调用 trace_streamer 导出 DB
- `sp-triage-memory` — 内存分诊
- `sp-analyze-memory-detail` — 内存详情
- 输出诊断报告

> 注意：此场景下 UI 工具不可用（无浏览器连接），但所有 SQL/分诊工具正常工作。

---

## 4. 核心操作指南

### 4.1 加载 Trace 数据

有两种方式获取 Trace 数据，选择其一即可：

#### 方式 A：从浏览器获取（推荐）

```
请获取浏览器当前打开的 trace 数据
```

**触发工具**：`sp-get-current-trace`

**耗时**：5~30 秒（取决于 DB 大小）

**前提**：浏览器已加载 Trace + 扩展服务已连接

#### 方式 B：从本地文件加载

```
请加载 D:/traces/demo.htrace
```

**触发工具**：`sp-set-trace-file`

**耗时**：30 秒~5 分钟（trace_streamer 重新解析）

**前提**：`TRACE_STREAMER_PATH` 配置正确

### 4.2 分诊分析

分诊是性能分析的第一步，快速定位问题维度。

#### 全维度分诊

```
请对当前 trace 进行全面分诊
```

**触发工具**：`sp-execute-workflow`（full-triage 工作流）

8 个维度并行分诊：Jank / Memory / CPU / GPU / IO / Network / Power / Hang

#### 单维度分诊

| 指令示例 | 触发工具 |
|----------|----------|
| "分析卡顿问题" | sp-triage-jank |
| "分析内存使用" | sp-triage-memory |
| "分析 CPU 负载" | sp-triage-cpu |
| "分析 GPU 内存" | sp-triage-gpu |
| "分析 IO 瓶颈" | sp-triage-io |
| "分析网络请求" | sp-triage-network |
| "分析功耗" | sp-triage-power |
| "分析应用卡死" | sp-triage-hang |

### 4.3 深度分析

分诊发现问题后，进行深度分析。

#### Jank 深度分析

```
这个进程（ipid=5）的卡顿帧详情是什么？
```

**触发工具**：`sp-analyze-jank-detail`

```
卡顿时段 [100000000, 150000000] 的 CPU 调度上下文是什么？
```

**触发工具**：`sp-jank-cpu-context`

#### 内存深度分析

```
分析 ipid=5 的内存趋势
```

**触发工具**：`sp-analyze-memory-detail`

```
分析 ipid=5 的 NativeHook 内存分配
```

**触发工具**：`sp-analyze-native-hook`

```
分析 ipid=5 的 NativeHook 统计模式，type=13
```

**触发工具**：`sp-analyze-native-hook`（isStatistic=true）

```
分析 ipid=5 的 JS 堆内存
```

**触发工具**：`sp-analyze-js-heap`

#### CPU 深度分析

```
分析调度延迟分布
```

**触发工具**：`sp-analyze-sched-latency`

```
分析线程 itid=10 的状态分布
```

**触发工具**：`sp-analyze-thread-state`

### 4.4 浏览器 UI 联动

将分析结果可视化呈现到浏览器。

| 操作 | 指令示例 | 触发工具 |
|------|----------|----------|
| 跳转时间线 | "跳转到 100ms~200ms 时间段" | sp-show-timeline |
| 选中进程 | "选中 ipid=5 的进程" | sp-select-process |
| 精确聚焦 | "聚焦到 [100000000, 150000000] 纳秒" | sp-focus-range |
| 展示查询结果 | "在浏览器中展示这个查询结果" | sp-show-query-result |

> 所有 UI 工具需要扩展服务 + 浏览器连接。如果未连接，会返回错误提示。

### 4.5 列出进程

在分析前，通常需要先了解 trace 中有哪些进程：

```
列出所有进程
```

**触发工具**：`sp-list-processes`

返回结果包含 ipid、pid、进程名称，用于后续工具的 ipid 参数。

### 4.6 自定义 SQL 查询

对于高级用户，可以直接编写 SQL 查询。

```
查询所有进程的名称和 ipid
```

**触发工具**：`sp-execute-query`

**SQL 示例**：

```sql
-- 查询所有进程
SELECT id, ipid, pid, name FROM process ORDER BY name;

-- 查询指定线程的状态分布
SELECT state, COUNT(*) AS cnt, SUM(dur) AS total_dur
FROM thread_state WHERE itid = 10 GROUP BY state ORDER BY total_dur DESC;

-- 查询表结构
-- 先用 sp-list-table-structure 查看表结构
```

**重要规则**：
- 使用 `ipid/itid`（非 `pid/tid`）进行关联
- 使用 `args_view`（非 `args` 表）
- 时间戳需减去 `trace_range.start_ts`
- `thread_state` 用 `state` 列（非 `end_state`）
- `measure` 表无 `id` 列，复合键 `(ts, filter_id)`

---

## 5. 高级用法

### 5.1 自定义技能

将常用的 SQL 查询注册为技能，一次注册、永久复用。

#### SQL 安全限制

Skill 的 SQL 模板必须满足以下条件：

| 限制 | 说明 |
|------|------|
| 必须以 SELECT/WITH 开头 | 不允许 DDL/DML |
| 禁止的关键词 | DROP、DELETE、UPDATE、INSERT、ALTER、CREATE、ATTACH、DETACH、PRAGMA |
| 不允许分号 | SQL 模板中不能包含 `;` |
| 名称必须 `sp-` 前缀 | 避免与内置工具混淆 |
| 不能与内置工具重名 | 以 `sp-triage-`、`sp-analyze-`、`sp-list-` 等开头的名称被保留 |

#### 注册技能

```
注册一个名为 sp-top-jank-procs 的技能，用于查找卡顿帧最多的进程
```

AI 会调用 `sp-register-skill`，参数：

```json
{
  "name": "sp-top-jank-procs",
  "description": "查找卡顿帧最多的进程",
  "schema": { "limit": { "type": "number", "default": 10 } },
  "sqlTemplate": "SELECT p.name, p.ipid, COUNT(*) AS jank_count FROM frame_slice fs JOIN process p ON fs.ipid = p.id WHERE fs.flag = 1 AND fs.type = 0 GROUP BY p.name, p.ipid ORDER BY jank_count DESC LIMIT :limit",
  "domain": "jank"
}
```

#### 执行技能

```
执行 sp-top-jank-procs 技能，limit=5
```

**触发工具**：`sp-execute-skill`

#### 管理技能

```
列出所有已注册技能
```

**触发工具**：`sp-list-skills`

```
删除 sp-top-jank-procs 技能
```

**触发工具**：`sp-delete-skill`

### 5.2 工作流

预置工作流自动编排多步骤分析。

#### 执行预置工作流

```
执行卡顿深度分析工作流
```

**触发工具**：`sp-execute-workflow`（name=jank-deep-dive）

工作流自动执行：
1. `sp-triage-jank` — 分诊
2. `sp-analyze-jank-detail` — 深度分析（参数从步骤 1 自动传递）
3. `sp-jank-cpu-context` — CPU 上下文（参数从步骤 1 自动传递）

#### 查看可用工作流

```
列出所有可用工作流
```

**触发工具**：`sp-list-workflows`

**预置工作流**：

| 工作流 | 描述 | 步骤数 |
|--------|------|--------|
| full-triage | 全维度并行分诊 | 8 步并行 |
| jank-deep-dive | 卡顿深度分析 | 3 步串行 |
| memory-leak-hunt | 内存泄漏追踪 | 3 步串行 |
| cpu-sched-analysis | CPU 调度分析 | 3 步串行 |

### 5.3 知识库

上传和检索领域知识，辅助 AI 诊断。

> **注意**：当前知识库搜索采用**关键词匹配**（按词频打分），不是语义检索。同义词、上下文关联等高级检索暂不支持。搜索时建议使用与文档中一致的术语。

#### 上传知识

```
上传一条知识：Jank 优化的最佳实践
```

AI 会调用 `sp-upload-knowledge`，参数：

```json
{
  "name": "jank-optimization-best-practices",
  "content": "## Jank 优化最佳实践\n\n1. 减少 UI 线程的 IO 操作\n2. 避免在 onFrameCallback 中进行耗时计算\n3. 使用异步布局减少主线程阻塞\n4. 检查 GPU 渲染管线瓶颈\n5. 优化 Binder 调用频率",
  "type": "best-practice"
}
```

#### 搜索知识

```
搜索 Jank 优化相关知识
```

**触发工具**：`sp-search-knowledge`

#### 删除知识

```
删除 jank-optimization-best-practices 知识
```

**触发工具**：`sp-delete-knowledge`

---

## 6. 部署场景

### 6.1 本地部署（默认）

所有组件在同一台机器上运行，这是最简单的模式：

```
用户浏览器 (https://localhost:9000)
    ↕ ws://localhost:19099
扩展服务 (localhost:19099)
    ↕ WebSocket
MCP Server (localhost)
    ↕ stdio
opencode (localhost)
```

### 6.2 服务器部署 + 域名访问

当前端通过域名访问（如 `https://sp.example.com`）时，**WASM 数据仍在浏览器本地**，Go 服务器只分发静态文件（HTML/JS/WASM），不参与数据流。

```
用户浏览器 (https://sp.example.com)
  ├── WASM 内存：trace 解析结果 + SQLite DB ← 数据在本地
  ├── Go 服务器 → 只提供静态资源，不参与数据流
  └── ws://localhost:19099 → 扩展服务（也在用户本机）
```

**关键问题**：HTTPS 页面不允许 `ws://` 连接（浏览器混合内容策略）。需要以下解决方案之一：

| 方案 | 做法 | 优缺点 |
|------|------|--------|
| **Go 代理**（推荐） | Go 服务器在 `wss://sp.example.com/agent` 反向代理到 localhost:19099 | 最干净，需改 Go 服务器代码 |
| **本地 TLS** | 扩展服务前加 nginx/caddy 做 TLS 终结 | 需要额外组件 |
| **浏览器扩展** | 安装浏览器扩展豁免 localhost 混合内容限制 | 仅限开发调试 |

**适用性总结**：

| 场景 | SQL 查询 | UI 工具 | sp-get-current-trace |
|------|---------|---------|---------------------|
| 本地部署 | ✅ | ✅ | ✅ |
| 服务器部署（解决 WSS 后） | ✅ | ✅ | ✅ |
| 服务器部署（未解决 WSS） | ✅ | ❌ | ❌ |

### 6.3 数据存储位置

| 数据 | 路径 | 说明 |
|------|------|------|
| 自定义 Skill | `~/.sp-agent/skills/*.json` | 持久化存储 |
| 知识库文档 | `~/.sp-agent/knowledge/*.md`、`*.txt` 或 `*.json` | 持久化存储 |
| 浏览器导出的 DB | `%TEMP%/sp-agent/trace-*.db` | 关闭 DB 时不删除 |
| trace_streamer 导出的 DB | `%TEMP%/sp-agent/trace-*.db` | 关闭 DB 时自动删除 |

### 6.4 降级策略

即使没有扩展服务和浏览器，核心分析能力仍然可用：

| 扩展服务状态 | 浏览器状态 | 可用工具 | 不可用工具 |
|-------------|-----------|---------|-----------|
| 运行 | 已连接 | 全部 34 个 | — |
| 运行 | 未连接 | SQL/分诊/技能/知识/工作流 | UI 工具、sp-get-current-trace |
| 未运行 | — | SQL/分诊/技能/知识/工作流（需 sp-set-trace-file） | UI 工具、sp-get-current-trace |

> **建议**：无浏览器时，使用 `sp-set-trace-file` 加载本地 trace 文件，所有分析工具正常工作。

---

## 7. 常见问题与排障

### 7.1 MCP Server 启动失败

| 症状 | 原因 | 解决方案 |
|------|------|----------|
| `Cannot find module` | 未编译 | 运行 `npm run build` |
| `better-sqlite3` 加载失败 | 原生模块编译问题 | 确保 Node.js 版本匹配，重新 `npm install` |
| 扩展服务连接失败 | 扩展服务未启动 | 先启动扩展服务（不影响 SQL/分诊工具） |

### 7.2 Trace 加载问题

| 症状 | 原因 | 解决方案 |
|------|------|----------|
| `sp-set-trace-file` 失败：`trace_streamer export failed` | trace_streamer 路径错误或文件不存在 | 检查 `TRACE_STREAMER_PATH` 环境变量 |
| `sp-set-trace-file` 超时 | Trace 文件过大 | 等待更长时间（大文件可能需要 5 分钟） |
| `sp-get-current-trace` 失败：`Extension service not available` | 扩展服务未启动 | 启动扩展服务并确保浏览器已连接 |
| `sp-get-current-trace` 超时 | DB 导出/传输耗时过长 | 使用 `sp-set-trace-file` 代替 |

### 7.3 SQL 查询问题

| 症状 | 原因 | 解决方案 |
|------|------|----------|
| `SQL error: no such column: pid` | 使用了 pid 而非 ipid | 使用 `ipid` 关联 process 表 |
| `SQL error: no such table: args` | 使用了 args 而非 args_view | 使用 `args_view` 表 |
| `SQL error: no such column: end_state` | thread_state 无 end_state | 使用 `thread_state.state`，`sched_slice` 才有 `end_state` |
| `Query returned 10000 rows, max 5000` | 结果行数超限 | 添加 WHERE 条件或使用聚合查询 |
| `SQL error: not allowed` | 执行了非 SELECT 语句 | 只允许 SELECT/WITH 查询 |

### 7.4 UI 工具问题

| 症状 | 原因 | 解决方案 |
|------|------|----------|
| `Extension service not available` | 扩展服务未启动 | 启动扩展服务 |
| `Browser response timeout` | 浏览器未响应 | 确认浏览器已打开并加载 Trace |
| UI 命令发送但浏览器无反应 | 浏览器连接断开 | 刷新浏览器页面，重新连接 |

### 7.5 技能/知识问题

| 症状 | 原因 | 解决方案 |
|------|------|----------|
| `Skill name must start with sp-` | 技能名称无 sp- 前缀 | 名称必须以 `sp-` 开头 |
| `Skill name conflicts with built-in tool` | 技能名称与内置工具冲突 | 更换名称 |
| `Invalid name: must match [a-zA-Z0-9_-]+` | 名称包含非法字符 | 仅使用字母、数字、下划线、连字符 |
| `SQL template not allowed` | SQL 包含非 SELECT 语句 | 模板必须是 SELECT only |

### 7.6 常见错误码

| 错误信息 | 含义 | 处理方式 |
|----------|------|----------|
| `code: 0, message: <path>` | 操作成功 | message 为 DB 文件路径 |
| `code: -1, message: <reason>` | 操作失败 | 查看 message 中的具体原因 |
| `Extension service not available` | 扩展服务未启动 | 启动扩展服务（`node app.js`） |
| `No browser session connected` | 浏览器未连接到扩展服务 | 刷新浏览器页面 |
| `Browser response timeout` | 浏览器未响应 | 确认浏览器已加载 Trace，刷新页面 |
| `DB export timeout` | DB 导出超时 | 使用 `sp-set-trace-file` 代替 |
| `trace_streamer export failed` | trace_streamer 导出失败 | 检查 `TRACE_STREAMER_PATH` 和文件格式 |
| `SQL error: no such column: pid` | 使用了 pid 而非 ipid | 使用 `ipid` 关联 process 表 |
| `SQL error: no such table: args` | 使用了 args 而非 args_view | 使用 `args_view` 表 |

---

## 8. 参考信息

### 8.1 典型场景完整对话示例

#### 场景：Jank 诊断

```
用户：帮我分析这个 trace 的卡顿问题

AI：好的，我来帮你分析。首先获取浏览器中的 Trace 数据...

[调用 sp-get-current-trace → 成功，DB 已加载]

正在执行卡顿分诊...

[调用 sp-triage-jank → 发现 3 个进程存在卡顿帧]

进程 "com.example.app" (ipid=5) 有 12 个超时丢帧 (flag=1)。

让我深入分析这个进程的卡顿帧...

[调用 sp-analyze-jank-detail(ipid=5) → 返回帧时间线]

发现 3 个严重卡顿帧，vsync=142/156/203，持续时间分别为 48ms/52ms/61ms。

分析卡顿时段的 CPU 调度上下文...

[调用 sp-jank-cpu-context(ipid=5, startTime=..., endTime=...) → 返回调度信息]

根因分析：
- 卡顿原因：调度延迟
- 主线程在 vsync=142 时被 GPU 进程抢占，等待 23ms 后才重新调度
- 建议优化 GPU 渲染管线，减少主线程抢占

[调用 sp-focus-range(startTime=..., endTime=...) → 浏览器跳转到异常时段]

已将浏览器跳转到卡顿时段，你可以在泳道视图中查看详细信息。
```

#### 场景：内存泄漏分析

```
用户：分析 ipid=5 的内存使用情况

AI：好的，执行内存分诊...

[调用 sp-triage-memory(ipid=5) → RSS 从 120MB 持续增长到 380MB]

内存趋势异常：RSS 从 120MB 持续增长到 380MB，增长 217%。

进一步分析内存详情...

[调用 sp-analyze-memory-detail(ipid=5) → 时间线数据]

分析 NativeHook 内存分配...

[调用 sp-analyze-native-hook(ipid=5) → 发现未配对的 alloc]

发现 47 个未配对的 Malloc 调用，总泄漏大小 23.5MB。

根因分析：
- 存在内存泄漏：47 个 Malloc 未配对 Free
- 主要泄漏调用栈：libace.z.so 中的 JsHeap::Allocate
- 建议检查 JS 对象生命周期管理
```

### 8.2 工具调用时序图

```
Phase 1: 分诊
┌──────────┐    ┌──────────┐    ┌──────────┐
│ triage-  │    │ triage-  │    │ triage-  │
│  jank    │    │ memory   │    │   cpu    │  ...
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     ▼               ▼               ▼
  分诊结果        分诊结果         分诊结果
  (ipid, flag)  (ipid, peak)   (itid, cpu%)

Phase 2: 深度分析（依赖 Phase 1 结果）
┌──────────┐    ┌──────────┐    ┌──────────┐
│ jank-    │    │ memory-  │    │ sched-   │
│ detail   │    │ detail   │    │ latency  │
│ (ipid)   │    │ (ipid)   │    │ (itid)   │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     ▼               ▼               ▼
  详细数据        详细数据         详细数据

Phase 3: UI 联动
┌──────────┐    ┌──────────┐
│ focus-   │    │ select-  │
│ range    │    │ process  │
└──────────┘    └──────────┘
```

### 8.3 常用 SQL 查询参考

```sql
-- 查询所有进程
SELECT id, ipid, pid, name FROM process ORDER BY name;

-- 查询指定进程的所有线程
SELECT id, itid, name, is_main_thread FROM thread WHERE ipid = :ipid;

-- 查询线程状态分布
SELECT state, COUNT(*) AS cnt, SUM(dur) AS total_dur
FROM thread_state WHERE itid = :itid GROUP BY state ORDER BY total_dur DESC;

-- 查询卡顿帧
SELECT p.name, fs.vsync, fs.dur, fs.flag
FROM frame_slice fs JOIN process p ON fs.ipid = p.id
WHERE fs.flag = 1 AND fs.type = 0
ORDER BY fs.dur DESC LIMIT 20;

-- 查询内存趋势
SELECT (m.ts - TR.start_ts) AS ts, mf.name, m.value
FROM measure m JOIN process_measure_filter mf ON m.filter_id = mf.id
CROSS JOIN trace_range TR
WHERE mf.ipid = :ipid AND mf.name = 'mem.rss'
ORDER BY ts ASC;

-- 查询 IO 统计
SELECT p.name, fio.is_write, fio.is_block, COUNT(*) AS cnt,
       SUM(fio.duration) AS total_dur, SUM(fio.request_bytes) AS total_bytes
FROM filesystem_io fio
JOIN thread t ON fio.itid = t.id JOIN process p ON t.ipid = p.id
CROSS JOIN trace_range TR
WHERE (fio.start_time - TR.start_ts) >= 0
GROUP BY p.name, fio.is_write, fio.is_block
ORDER BY total_dur DESC LIMIT 20;
```

### 8.4 环境变量速查

| 变量 | 默认值 | 必填 | 说明 |
|------|--------|------|------|
| TRACE_STREAMER_PATH | `trace_streamer` | 是 | trace_streamer 可执行文件路径 |
| SP_AGENT_EXT_HOST | `127.0.0.1` | 否 | 扩展服务地址 |
| SP_AGENT_EXT_PORT | `19099` | 否 | 扩展服务端口 |
| TRACE_FILE | （空） | 否 | 默认 Trace 文件路径 |

### 8.5 34 个工具速查表

| 类别 | 工具名 | 参数 | 说明 | 依赖 |
|------|--------|------|------|------|
| 基础 | sp-set-trace-file | traceFile | 加载本地 Trace 文件 | trace_streamer |
| 基础 | sp-get-current-trace | （无） | 获取浏览器当前 Trace | 扩展服务+浏览器 |
| 基础 | sp-execute-query | query | 执行 SQL 查询 | — |
| 基础 | sp-list-processes | （无） | 列出所有进程（ipid/pid/name） | — |
| 基础 | sp-list-tables | （无） | 列出所有表 | — |
| 基础 | sp-list-table-structure | table | 查看表结构 | — |
| Jank | sp-triage-jank | ipid? | 卡顿分诊 | — |
| Jank | sp-analyze-jank-detail | ipid, startTime?, endTime? | 卡顿详情 | — |
| Jank | sp-jank-cpu-context | ipid, startTime, endTime | CPU 上下文 | — |
| 内存 | sp-triage-memory | ipid? | 内存分诊 | — |
| 内存 | sp-analyze-memory-detail | ipid, metric? | 内存详情 | — |
| 内存 | sp-analyze-native-hook | ipid, eventType?, isStatistic? | NativeHook 分析 | — |
| 内存 | sp-analyze-js-heap | ipid | JS 堆分析 | — |
| CPU | sp-triage-cpu | cpuId? | CPU 分诊 | — |
| CPU | sp-analyze-sched-latency | itid? | 调度延迟 | — |
| CPU | sp-analyze-thread-state | itid | 线程状态 | — |
| 扩展 | sp-triage-gpu | ipid? | GPU 分诊 | — |
| 扩展 | sp-triage-io | ipid? | IO 分诊 | — |
| 扩展 | sp-triage-network | ipid? | 网络分诊 | — |
| 扩展 | sp-triage-power | metricName? | 功耗分诊 | — |
| 扩展 | sp-triage-hang | ipid? | 卡死分诊 | — |
| UI | sp-show-timeline | startTime?, endTime?, ipid? | 跳转时间线 | 扩展服务+浏览器 |
| UI | sp-select-process | ipid, processName? | 选中进程 | 扩展服务+浏览器 |
| UI | sp-focus-range | startTime, endTime | 精确聚焦 | 扩展服务+浏览器 |
| UI | sp-show-query-result | query, title? | 展示查询结果 | 扩展服务+浏览器 |
| 技能 | sp-register-skill | name, description, schema, sqlTemplate, domain? | 注册技能 | — |
| 技能 | sp-execute-skill | name, params? | 执行技能 | — |
| 技能 | sp-list-skills | （无） | 列出技能 | — |
| 技能 | sp-delete-skill | name | 删除技能 | — |
| 知识 | sp-upload-knowledge | name, content, type | 上传知识 | — |
| 知识 | sp-search-knowledge | query, topK? | 搜索知识 | — |
| 知识 | sp-delete-knowledge | name | 删除知识 | — |
| 工作流 | sp-list-workflows | （无） | 列出工作流 | — |
| 工作流 | sp-execute-workflow | name, args? | 执行工作流 | — |
