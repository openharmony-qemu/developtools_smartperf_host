# SmartPerf Host 指引

## 项目定位

本仓库实现 OpenHarmony 性能功耗调优平台，核心职责是解析 trace 文件并在浏览器中可视化渲染。最核心的架构边界：前端三层 Worker 不可交叉、后端 Filter→Cache→虚表只读数据流。`smartperf_device/` 是设备端采集组件，与 PC 端开发无关。

## 代码地图

```
浏览器 (SPA)
  ↓ WASM 共享内存 (reqBuffer 4MB)
trace_streamer (C++17 → WASM/原生可执行)
  ↓ Filter 流式解析 → TraceDataCache → 虚表 (只读)
SQLite 查询结果 ← JS 通过 WASM 接口获取
  ↓
ide/src/trace/ (前端泳道渲染)
  DB Worker (WASM 查询) | UI Worker (Canvas 绘制) | Logic Worker (聚合计算) ← 三层不可交叉
```

| 目录 | 职责与操作提示 |
|------|----------------|
| `ide/src/trace/database/` | 三层 Worker 架构核心 + SqlLite 查询入口 |
| `ide/src/trace/database/data-trafic/` | Sender+Receiver 双端通信，**新增泳道必改** |
| `ide/src/trace/component/` | 泳道渲染层（Canvas），新增泳道 UI |
| `ide/src/base-ui/` | 组件基类 BaseElement，**禁用 LitElement** |
| `ide/src/hdc/` | WebUSB hdc 协议，浏览器直连鸿蒙设备 |
| `ide/src/trace_adapter/` | 纯 Node.js 预处理，**不能用浏览器端 import** |
| `ide/server/` | Go 小服务：HTTPS 部署 + WASM 分发 |
| `trace_streamer/src/filter/` | 20+ Filter，流式解析核心，不同trace类型同一事件的处理逻辑|
| `trace_streamer/src/trace_data/` | TraceDataCache 全局唯一数据中心，数据都先存储到 TraceDataCache |
| `trace_streamer/src/table/` | 虚表层（只读），按事件类型分目录，新增trace事件存储必须在此定义表结构 |
| `trace_streamer/src/parser/` | 多路径解析：bytrace/htrace/rawtrace/ebpf/hiperf，trace事件解析逻辑核心模块 |
| `ide/test/` | 前端 Jest 单元测试（jsdom + jest-canvas-mock），测试文件与源码目录结构对应 |
| `trace_streamer/test/unittest/` | 后端 C++ 单元测试（gtest），按模块分目录：filter/table/base/接口等 |

### 常见任务速查

| 任务 | 入口路径 |
|------|----------|
| 新增前端泳道 | `ide/src/trace/component/` → `ide/src/trace/database/data-trafic/` → `ide/src/trace/database/sql/` |
| 新增内存泳道/堆快照泳道/Sheet 标签页 | 使用可用 agent skills（`add-custom-memory-lane`、`add-heap-snapshot-lane`、`add-memory-type-sheets`） |
| 新增 trace 事件解析 | `parser/` → `filter/` → `trace_data/` → `table/`，详见 `docs/add_trace_event_guide.md`（6 步全流程） |
| 修改 SQL 查询 | `ide/src/trace/database/sql/*.sql.ts` |
| 修改 Worker 逻辑 | `ide/src/trace/database/ui-worker/`（Canvas 绘制）、`logic-worker/`（聚合计算） |

## 知识路由

| 触发条件 | 先读 |
|----------|------|
| 查询/修改数据库表结构 | `docs/table_schema.md` |
| 确认支持的 trace 事件 | `docs/trace_event_mapping.md` |
| 新增 trace 事件解析逻辑 | `docs/add_trace_event_guide.md`（6 步全流程 + 涉及文件汇总） |
| 改 `ide/src/trace/database/data-trafic/` | 该目录 Sender/Receiver 源码，理解消息协议再加泳道 |
| 改 `ide/src/trace/database/sql/*.sql.ts` | `docs/table_schema.md` 确认列名/类型 |
| 改 `trace_streamer/src/table/` | `docs/table_schema.md` 确认列定义顺序与 Index 枚举一致 |
| 涉及内存类型枚举 | `docs/trace_event_mapping.md` + 下方 TraceType/MemoryType 词汇条目 |

### 领域词汇速查

| 术语 | 含义与风险 |
|------|-----------|
| ipid/itid | 内部进程/线程唯一标识，非系统 pid/tid（内核会复用），核心关联键 |
| bytrace / htrace / rawtrace | 三种 trace 格式，分别为文本格式，protobuffer格式，二进制格式，各自解析路径各不同 |
| OHOSPROF | Htrace 文件魔数（前8字节）按照该数字判断文件类型是不是htrace，dataType_=1 为嵌入 hiperf的htrace文件 |
| TraceType / MemoryType | **内存事件双枚举体系**：TraceType 用于 Trace 事件组(0..13)为详细模式，MemoryType 用于 RecordStatistics(0..17)统计模式，编号不同易混淆 |
| reqBuffer | WASM 4MB 共享缓冲区，不能反复 malloc/free |
| TraceDataCache | 全局唯一数据中心，所有 Filter 写入、所有虚表读取都在此 |
| 内存统计模式 |抓取内存时，按采样间隔进行上报，会按栈的维度进行聚合 |
| 内存详细模式 | 抓取内存时，每一次申请释放都会进行上报 |

### 编辑前声明

开始编码前，先在回复中声明：① 任务类别（前端泳道/后端解析/SQL 查询/修复）；② 已读的路由文档；③ 相关约束（硬性约束/反模式中哪些适用）。未声明不得直接修改代码。

## 专家经验与约束

### 硬性约束

- **ipid/itid 是核心关联键**：不能用系统 pid/tid,存储的都是内部的进程线程id，关联process/thread的主键
- **TraceDataCache 全局唯一**：不能另建数据存储路径
- **内存虚表只读**：`Update()` 返回 `SQLITE_READONLY`
- **三层 Worker 不可交叉**：DB(WASM) | UI(Canvas) | Logic(聚合)
- **NativeHook 解析前必须排序**：按 时间（`tv_sec*10^9+tv_nsec`） 排序后再做 alloc/free 匹配

### 反模式

- ❌ 使用 LitElement（必须 BaseElement + @element + Shadow DOM + initHtml()）
- ❌ Receiver/Worker 中引用 DOM API
- ❌ WASM reqBuffer 上反复 malloc/free
- ❌ Logic Worker 直接调用 WASM（需中继主线程 exec-buf）
- ❌ filter/ 绕过 TraceDataCache 直接写虚表（数据必须经 Filter→Cache 流入）
- ❌ table/ 执行 Update/Insert（虚表只读，数据来源是 TraceDataCache）

### 需评审变更（Ask before）

以下变更必须先与维护者确认，不得自行实施：

- 修改 WASM `reqBuffer` 大小或共享内存通信协议
- 变更 `TraceDataCache` 公共 getter 签名或新增数据存储路径
- 升级/替换 `ide/third-party/` 第三方依赖（sql.js 等，涉及 license 与版本兼容）
- 修改前端三层 Worker 划分边界或跨层通信机制
- 变更虚表表名/列顺序（影响前端 SQL 查询与历史 trace 兼容）

## 构建与验证

### 前端 IDE（`smartperf_host/ide/`）

前置：Node≥16.15.1, npm≥8.13.2, Go≥1.13.8; sql.js v1.6.2 手动下载到 `ide/third-party/`（目录不存在需创建）; WASM 产物放 `bin/`

```bash
npm install                  # 安装依赖
npm run lint                 # 代码风格检查
npm test                     # 单元测试
npm run build:dev            # 开发模式编译
npm run build:prod           # 生产模式编译（含 Go 服务器，需 Go≥1.13.8）
```

### 后端 Trace Streamer（`smartperf_host/trace_streamer/`）

前置：C++17（Linux clang16/Mac clang14/Win gcc12.1 MinGW）; WASM 需 emsdk 3.1.12 **仅 Linux**

```bash
./build.sh          # 原生版 → out/{平台}/trace_streamer
./build.sh wasm     # WASM 版（仅 Linux！）
./test.sh           # 编译+单元测试
```

⚠️ 部署访问必须 **https**，端口 9000。

### 任务专项验证

| 任务类型 | 最小验证 |
|----------|----------|
| 新增/修改泳道 | `npm run build:dev` 后浏览器加载 trace 确认泳道渲染 |
| 修改 SQL 查询 | `npm test` 对应测试文件通过 |
| 后端 Filter/Table | `./test.sh` 对应 gtest 模块通过 |
| WASM 接口变更 | Linux 环境 `./build.sh wasm` + 前端 `npm test` 全量通过 |

### 验证不可运行时的处理

若当前平台无法执行某验证命令（如 Windows 无法运行 `./build.sh wasm`），须在最终回复中明确列出：未运行的命令、原因、建议在何环境补验。

## 完成标准

1. 编译无错误无新的告警
2. 测试用例全部通过
3. 运行「任务专项验证」表中对应任务的最小验证
4. 提交使用 `git commit -sm`
5. 最终回复包含：变更文件列表、验证命令及结果、剩余风险
6. 不包含无关的格式化、重构或顺手改动


 