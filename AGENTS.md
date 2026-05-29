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

## 知识路由

| 遇到什么问题 | 先读 |
|--------------|------|
| 数据库表结构/stat | `trace_streamer/doc/des_tables.md` |
| Binder 事务匹配 | `trace_streamer/doc/des_binder.md` |
| 帧渲染/卡顿判定 | `trace_streamer/doc/frames.md` |
| 时间戳/时钟源转化逻辑 | `trace_streamer/doc/des_timestamp.md` |
| NativeHook 内存配置与匹配规则 | `trace_streamer/doc/des_native_hook_config.md` |
| 应用启动8阶段识别 | `trace_streamer/doc/app_startup.md` |
| 支持的trace事件 | `trace_streamer/doc/des_support_event.md` |

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

## 构建与验证

### 前端 IDE（`smartperf_host/ide/`）

前置：Node≥16.15.1, npm≥8.13.2, Go≥1.13.8; sql.js v1.6.2 手动下载到 `third-party/`; WASM 产物放 `bin/`

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

## 完成标准

1. 编译无错误无新的告警
2. 测试用例全部通过
3. 提交使用 `git commit -sm`
4. 最终回复包含：变更文件列表、验证命令及结果、剩余风险
5. 不包含无关的格式化、重构或顺手改动


 