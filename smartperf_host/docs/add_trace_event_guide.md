# 新增 Trace 事件解析入库指南

数据流向：Parser → Filter → TraceDataCache → 虚表，虚表只读，Cache 全局唯一。

---

## 步骤 1：添加事件类型枚举和名称映射（前置）

在 `SupportedTraceEventType` 枚举中新增值，在 config 的对应 Init 函数中注册 `eventNameMap_`（枚举值→事件名字符串）。Parser 注册时会引用此映射。

**文件**: `cfg/trace_streamer_config.h/.cpp`

---

## 步骤 2：在 Parser 中注册事件（按格式不同分别处理）

### bytrace 路径

在 `bytrace_event_parser.cpp` 的对应 Init 函数（如 `SchedEventInitialization()`）中，通过 `config_.eventNameMap_.at(TRACE_EVENT_XXX)` 将事件名绑定到解析成员函数。

### htrace 路径

在 `pbreader_parser.cpp` 中注册插件名索引（`InitHookPluginNameIndex()` 等函数），并在 `ParseDataByPluginName()` 分发函数中添加对应 Parse 调用。

### rawtrace 路径

需修改 **两个文件**：

1. **`ftrace_event_processor.h/.cpp`**：新增二进制字段提取方法（从 ring buffer 字节流按 EventFormat 提取各字段写入 protobuf message），在对应 Init 函数中注册到 `eventNameToFunctions_`。还需在 proto 文件中新增对应的 `xxx_format` message 和 FtraceEvent 的 oneof 字段。

2. **`cpu_detail_parser.h/.cpp`**：新增事件处理方法（从 protobuf 取值调用 Filter 写入 Cache），在构造函数或对应 Init 函数中注册到 `eventToFunctionMap_`。

rawtrace 的分发链：`二进制 eventId → eventFormatDict_ → eventName → eventNameToFunctions_（字段提取）→ eventToFunctionMap_（调Filter）`。

---

## 步骤 3：实现 Filter 解析逻辑

在 `filter/<模块>/` 下新增或扩展 Filter。Filter 负责：接收原始事件数据 → 时间戳转换到 BOOTTIME 纳秒（htrace/ebpf 需要 `ToPrimaryTraceTime`，bytrace/rawtrace 文本格式已自带正确时间戳） → 获取 ipid/itid（不能用系统 pid/tid） → 调用 Cache 的 Append 方法写入数据 → 调用 `UpdateTraceTime()` 更新时间范围 → 调用 `statFilter_->IncreaseStat()` 记录统计。

注意：
- 一个事件可能写入多个 Cache（如 sched_switch 同时写入 SchedSlice 和 ThreadStateData）
- 持续时间类事件需要先 Append（dur=INVALID），再由后续事件 Update 回填 dur
- NativeHook 类型必须先按 ts 排序再解析

**目录**: `filter/<模块>/xxx_filter.h/.cpp`

---

## 步骤 4：定义 Cache 数据结构

在 `trace_data/trace_stdtype/<模块>/` 下新增行结构（字段与虚表列一一对应）和存储类（Append 方法逐字段追加到内部 deque）。在 `TraceDataCacheBase` 中添加成员变量，在 `TraceDataCacheWriter` 中添加可变 getter，在 `TraceDataCacheReader` 中添加只读 getter。

**目录**: `trace_data/trace_stdtype/<模块>/xxx_stdtype.h/.cpp`、`trace_data/trace_data_cache_base.h`、`trace_data/trace_data_cache_writer.h/.cpp`、`trace_data/trace_data_cache_reader.h/.cpp`

---

## 步骤 5：定义虚表

在 `table/<模块>/` 下新增头文件和 cpp 文件。构造函数中声明列名/类型/主键，`Cursor::Column()` 从 Cache 的 deque 按行号读取对应列值，`GetSize()` 返回 Cache 数据行数。列定义顺序必须与 Index 枚举编号一致。

**目录**: `table/<模块>/include/xxx_table.h`、`table/<模块>/xxx_table.cpp`

---

## 步骤 6：注册虚表

在 `trace_data/trace_data_cache.cpp` 的 `InitDB()` 中调用 `TableDeclare<XxxTable>(*db_, this, "表名")` 注册虚表到 SQLite，并追加表名到 `AppendNewTable()`。

**文件**: `trace_data/trace_data_cache.cpp`

---

## 涉及文件汇总

| 步骤 | 文件 |
|------|------|
| 1 | `cfg/trace_streamer_config.h/.cpp` |
| 2-bytrace | `parser/ptreader_parser/bytrace_parser/bytrace_event_parser.cpp` |
| 2-htrace | `parser/pbreader_parser/pbreader_parser.cpp` |
| 2-rawtrace | `parser/rawtrace_parser/ftrace_event_processor.h/.cpp`、`parser/rawtrace_parser/cpu_detail_parser.h/.cpp`、proto 文件 |
| 3 | `filter/<模块>/xxx_filter.h/.cpp` |
| 4 | `trace_data/trace_stdtype/<模块>/xxx_stdtype.h/.cpp`、`trace_data/trace_data_cache_base.h`、`trace_data/trace_data_cache_writer.h/.cpp`、`trace_data/trace_data_cache_reader.h/.cpp` |
| 5 | `table/<模块>/include/xxx_table.h`、`table/<模块>/xxx_table.cpp` |
| 6 | `trace_data/trace_data_cache.cpp` |