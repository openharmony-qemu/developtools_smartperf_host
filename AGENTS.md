# SmartPerf Host 指引

## 1. Code map

本 AGENTS.md 适用于仓库根目录。当前无子目录 AGENTS.md，全部规则在本文件。`smartperf_device/` 是设备端组件，与 PC 端开发无关，不在本指引范围。

本仓库实现 OpenHarmony 性能功耗调优平台，核心职责是解析 trace 文件并在浏览器中可视化渲染。最重要的架构边界是前端三层 Worker 不可交叉、后端 Filter→Cache→虚表只读数据流。

Key areas:
- `smartperf_host/ide/src/trace/database/`：前端数据库层（三层 Worker 架构核心：DB/UI/Logic），高频修改
- `smartperf_host/ide/src/trace/database/data-trafic/`：前端通信层（Sender+Receiver 双端通信），新增泳道必改
- `smartperf_host/ide/src/trace/component/`：前端泳道渲染层，高频修改
- `smartperf_host/ide/src/base-ui/`：前端组件基类（BaseElement），所有前端组件继承
- `smartperf_host/ide/src/hdc/`：前端设备通信层（WebUSB hdc 协议），浏览器直连鸿蒙设备
- `smartperf_host/ide/src/trace_adapter/`：前端预处理层（纯 Node.js，LongTrace WebSocket）
- `smartperf_host/trace_streamer/src/filter/`：后端过滤器层（20+ Filter 过滤器），解析逻辑核心，高频修改
- `smartperf_host/trace_streamer/src/trace_data/`：后端数据缓存层（TraceDataCache 全局唯一数据中心）
- `smartperf_host/trace_streamer/src/table/`：后端虚表层（SQLite 虚表，只读，查询入口）
- `smartperf_host/trace_streamer/src/rpc/wasm_func.h`：后端接口层（WASM 导出接口）
- `smartperf_host/trace_streamer/src/proto_reader/`：后端解析器层（自研 protobuf 解析器）

Where to look:
- 前端泳道渲染变更 -> 前端泳道渲染层 + 前端通信层
- 前端数据库查询变更 -> 前端数据库层 `SqlLite.ts`
- 后端过滤器解析变更 -> 后端过滤器层 + 后端数据缓存层
- 后端虚表查询变更 -> 后端虚表层
- WASM 接口变更 -> 后端接口层
- 设备通信变更 -> 前端设备通信层

## 2. Knowledge routing

Before planning or editing, classify the task and read the matching documents.

### Task-based routing
- Trace 文件类型识别/编译环境 -> `trace_streamer/doc/compile_trace_streamer.md`
- 过滤器注册/filter_id -> `trace_streamer/README.md` "过滤器"；`src/filter/FilterFilter.cpp`
- 数据库表结构/stat 表 -> `trace_streamer/doc/des_tables.md`；`doc/des_stat.md`
- Binder 事务匹配 -> `trace_streamer/doc/des_binder.md`
- 帧渲染/卡顿判定 -> `trace_streamer/doc/frames.md`
- 应用启动阶段 -> `trace_streamer/doc/app_startup.md`
- 时间戳/时钟源 -> `trace_streamer/doc/des_timestamp.md`
- WASM 接口/浏览器模式 -> `trace_streamer/README.md` "内置浏览器模式"
- proto 生成 -> `trace_streamer/src/protos/README_zh.md`
- NativeHook 配置 -> `trace_streamer/doc/des_native_hook_config.md`
- 符号表导入 -> `trace_streamer/doc/symbol_file_import.md`
- ArkTS 内存 -> `trace_streamer/doc/arkTs.md`
- 前端 Worker 架构 -> 前端数据库层 `SqlLite.ts` + `Procedure.ts` + `TraceWorker.ts`

### Path-based routing
- 后端过滤器层 `src/filter/` -> `trace_streamer/README.md` "过滤器"
- 后端虚表层 `src/table/` -> `trace_streamer/doc/des_tables.md`
- 后端数据缓存层 `src/trace_data/` -> `trace_streamer/README.md` "数据缓存"
- 后端解析器层 `src/proto_reader/` -> `trace_streamer/src/protos/README_zh.md`
- 前端通信层 `data-trafic/` -> 前端数据库层 `SqlLite.ts`
- 前端设备通信层 `hdc/` -> `HdcDeviceManager.ts`

### Vocabulary-based routing

| Term | Risk hint | Read |
|------|-----------|------|
| ipid/itid | 内部唯一标识，非系统 pid/tid，内核会复用 pid/tid | `trace_streamer/README.md` "进程和线程标识符"；`src/base/ts_common.h` |
| filter_id | 过滤器标识，注册顺序影响解析 | `trace_streamer/README.md` "过滤器" |
| bytrace | 文本格式 trace，与 htrace 解析路径不同 | `trace_streamer/doc/compile_trace_streamer.md` |
| htrace | proto 二进制 trace，OHOSPROF 魔数 | `trace_streamer/doc/compile_trace_streamer.md` |
| rawtrace | 内核 raw trace，魔数 57161 | `trace_streamer/doc/compile_trace_streamer.md` |
| NativeHook | C/C++ 内存分配跟踪，类型配置影响解析分支 | `trace_streamer/doc/des_native_hook_config.md` |
| HiPerf | CPU+调用栈采样，独立解析路径 | `trace_streamer/doc/des_support_event.md` |
| SchedSlice | CPU 调度切片，与 CpuFilter 强关联 | `trace_streamer/doc/des_tables.md` |
| Binder | 事务匹配需三阶段关联 | `trace_streamer/doc/des_binder.md` |
| jank | 帧卡顿判定(1=无效,2=异常)，与 FrameFilter 强关联 | `trace_streamer/doc/frames.md` |
| TraficEnum | 4 种传输模式，Sender/Receiver 必须匹配 | 前端数据库层 `SqlLite.ts` |
| reqBuffer | WASM 4MB 共享缓冲区，不能反复 malloc/free | `trace_streamer/src/rpc/wasm_func.h` |
| pbreader | 自研 proto 解析器，不依赖 protobuf 官方库 | `trace_streamer/src/protos/README_zh.md` |

In the plan, state: task category, documents read, constraints found, whether a skill/workflow should be used.

## 3. Constraints and boundaries

### Architecture/domain invariants
- ipid/itid 是核心关联键，不能用系统 pid/tid。
- TraceDataCache 全局唯一，不能另建数据存储路径。
- 虚表只读（Update() 返回 SQLITE_READONLY），写入只能 Filter→Cache。
- 前端三层 Worker 职责不可交叉：DB(WASM 查询) | UI(canvas 绘制) | Logic(聚合计算)。
- 时间戳有内外之分：ftrace/hilog/nativehook 用 data 内部时间，其余用外层 tv_sec+tv_nsec。

### Do not
- 不要在前端使用 LitElement，必须用 BaseElement + @element + Shadow DOM + initHtml()。
- 不要在前端预处理层中混用浏览器端 import，它是纯 Node.js（require 语法）。
- 不要手改 SphBaseData.js，它是构建时自动生成的（gitignore）。
- 不要手改 generated proto 文件，修改 .proto 源文件后重新生成。
- 不要在 Receiver 或 Worker 中引用 DOM API。
- 不要让 logic-worker 直接调用 WASM，需中继回主线程 exec-buf。
- 不要绕过 format-code.sh 提交 C++ 代码。
- 不要在 WASM reqBuffer 上反复 malloc/free。
- 不要共享双线程池 threadPool/threadPool2。
- 不要随意修改后端接口层导出接口签名或前端泳道公开接口语义，影响前后端兼容性。
- 不要破坏前端通信层 Sender/Receiver 协议格式，新增字段必须向后兼容。

### Ask before
- 新增第三方依赖（C++ 或 npm）。
- 新增 WASM 导出接口（仅 Linux 编译，Windows 无法验证）。
- 修改 ipid/itid 关联逻辑（影响全局数据一致性）。
- 修改 TraceDataCache 核心数据结构（影响所有 Filter 和虚表）。
- 修改前端三层 Worker 通信协议（影响所有 Procedure）。
- 执行 hdc 真实设备操作（影响连接设备）。
- 修改 hdc 通信协议或设备连接逻辑（影响安全边界）。

## 4. Verification

### 前端 IDE（smartperf_host/ide/）
前置：Node≥16.15.1, npm≥8.13.2, sql.js v1.6.2 放 third-party/, WASM 产物放 bin/
```bash
npm install                  # 安装依赖
npm run lint                 # 代码风格检查
npm test                     # 单元测试（默认带 -u 更新 snapshot）
npm run build:dev            # 开发模式编译
npm run build:prod           # 生产模式编译（含 Go 服务器，需 Go≥1.13.8）
npm run serve                # 开发服务器
```

### 后端 Trace Streamer（smartperf_host/trace_streamer/）
前置：C++17(Linux clang16/Mac clang14/Win gcc12.1), WASM 需 emsdk3.1.12(仅 Linux)
```bash
./build.sh                   # 编译原生版（产出 out/{平台}/trace_streamer）
./build.sh wasm              # 编译 WASM 版（仅 Linux！）
./test.sh                    # 编译+运行单元测试
./format-code.sh             # C++ 代码格式化（提交前必须运行）
./build.sh protoc            # 生成 proto 解析代码
```

### Task-specific checks
- 前端泳道渲染层变更 -> lint + test + 检查 Worker 通信是否匹配
- 后端过滤器层变更 -> build + test + format-code + 检查虚表查询是否兼容
- 后端接口层(WASM)变更 -> 需 Linux 环境编译验证，Windows 开发说明限制
- 后端虚表层变更 -> 检查 Update() 返回 SQLITE_READONLY，验证查询结果正确
- NativeHook 类型变更 -> 参考 `des_native_hook_config.md`，验证解析和统计

### Done definition
A task is done only when:
- 行为已实现。
- 相关 build/test/lint/format 检查已运行，或说明了无法运行的原因。
- 最终回复包含：变更文件列表、验证命令及结果、剩余风险。
- 不包含无关的格式化、重构或顺手改动。

提交使用 `git commit -sm`。