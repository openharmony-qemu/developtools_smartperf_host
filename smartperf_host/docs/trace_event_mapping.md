# TraceStreamer 支持解析的 Trace 事件

## Trace 格式说明

| 格式 | 类型 | 支持的事件范围 |
|------|------|----------------|
| bytrace | 文本格式 | 仅 ftrace 内核事件 |
| htrace | protobuf 格式（OHOSPROF 魔数） | ftrace + 所有插件数据（native_hook/内存/监控/JS/perf/ebpf/xpower/网络剖析等） |
| rawtrace | 二进制格式 | ftrace + sys_enter/exit + timerfd_wakeup + hmfs_io + block_rq |
| hiperf | 独立 perf 采样数据 | perf_*（可独立解析或嵌入 htrace） |
| ebpf | 独立 eBPF 采样数据 | ebpf_callstack + file_system_sample + paged_memory_sample + bio_latency_sample（可独立解析或嵌入 htrace） |

---

## 1. ftrace 内核事件（bytrace / htrace / rawtrace）

### 调度与进程事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| sched_switch | sched_slice, thread_state | 核心调度事件 |
| sched_wakeup | instant | 唤醒事件 |
| sched_waking | instant | 唤醒前事件 |
| sched_wakeup_new | instant | 新线程唤醒（仅 htrace） |
| sched_blocked_reason | callstack(args) | 阻塞原因 |
| sched_process_exit | thread | 进程退出 |
| task_rename | thread | 线程重命名 |
| task_newtask | thread | 新线程创建 |

### Binder 事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| binder_transaction | callstack | Binder 事务开始 |
| binder_transaction_received | callstack | Binder 事务接收 |
| binder_transaction_alloc_buf | callstack | Binder 分配缓冲区 |
| binder_transaction_lock | callstack | Binder 锁 |
| binder_transaction_locked | callstack | Binder 已锁 |
| binder_transaction_unlock | callstack | Binder 解锁 |

### 打点事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| tracing_mark_write | callstack | 用户打点（ATrace） |
| print | callstack | 内核打印打点 |

### CPU 与时钟度量事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| cpu_idle | measure | CPU 空闲 |
| cpu_frequency | measure | CPU 频率 |
| cpu_frequency_limits | measure | CPU 频率限制 |
| suspend_resume | measure | 挂起/恢复 |
| clock_set_rate / clock_enable / clock_disable | measure | 时钟速率/启停 |
| clk_set_rate / clk_enable / clk_disable | measure | clk 速率/启停 |
| trace_event_clock_sync | clock_snapshot | 时钟同步 |
| oom_score_adj_update | process_measure | OOM 评分更新（仅 htrace） |

### 中断事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| irq_handler_entry / irq_handler_exit | irq | 硬中断 |
| softirq_raise / softirq_entry / softirq_exit | irq | 软中断 |
| ipi_entry / ipi_exit | irq | IPI 中断 |

### 系统调用事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| sys_enter / sys_exit | syscall | 系统调用进出 |

### 工作队列事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| workqueue_execute_start / workqueue_execute_end | callstack | 工作队列执行 |

### DMA Fence 事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| dma_fence_init / destroy / enable / signaled | dma_fence | DMA fence 生命周期 |
| dma_fence (通用) | dma_fence | DMA fence 事件 |

### IO 与文件系统事件

| 事件 | 存储表 | 备注 |
|------|--------|------|
| block_rq_complete / block_rq_issue | filesystem_io | 块设备请求 |
| timerfd_wakeup | timerfd_wakeup | 定时器唤醒 |
| hmfs_read_enter/exit / hmfs_write_enter/exit | filesystem_io | HMFS IO（仅 bytrace/rawtrace） |

### 仅记录不解析的 ftrace 事件

以下事件仅写入 `raw` 表，不做业务解析：

| 事件 |
|------|
| regulator_set_voltage / regulator_set_voltage_complete |
| regulator_disable / regulator_disable_complete |
| signal_generate / signal_deliver |
| block_bio_backmerge / block_bio_bounce / block_bio_complete / block_bio_frontmerge |
| block_bio_queue / block_bio_remap / block_dirty_buffer / block_getrq / block_plug |
| block_rq_insert / block_rq_remap |

---

## 2. htrace 插件数据（仅 htrace 格式）

### 日志与 FPS

| 事件 | 存储表 |
|------|--------|
| hilog | log |
| hidump_fps | hidump |

### 进程内存度量

| 事件 | 存储表 | 子事件 |
|------|--------|--------|
| memory (进程内存) | process_measure | mem.vm.size, mem.rss, mem.rss.anon, mem.rss.file, mem.rss.schem, mem.swap, mem.locked, mem.hwm, mem.oom_score_adj |

### 系统内存度量

| 事件 | 存储表 | 子事件 |
|------|--------|--------|
| sys_memory | sys_mem_measure | sys.mem.total, sys.mem.free, sys.mem.available, sys.mem.buffers, sys.mem.cached, sys.mem.swap.cached, sys.mem.active, sys.mem.inactive, sys.mem.active.anon, sys.mem.inactive.anon, sys.mem.active_file, sys.mem.inactive_file, sys.mem.unevictable, sys.mem.mlocked, sys.mem.swap.total, sys.mem.swap.free, sys.mem.dirty, sys.mem.writeback, sys.mem.anon.pages, sys.mem.mapped, sys.mem.shmem, sys.mem.slab, sys.mem.slab.reclaimable, sys.mem.slab.unreclaimable, sys.mem.kernel.stack, sys.mem.page.tables, sys.mem.commit.limit, sys.mem.committed.as, sys.mem.vmalloc.total, sys.mem.vmalloc.used, sys.mem.vmalloc.chunk, sys.mem.cma.total, sys.mem.cma.free |
### Monitor 监控数据

| 事件 | 存储表 |
|------|--------|
| trace_diskio | diskio |
| trace_process | live_process |
| trace_cpu_usage | cpu_usage |
| trace_network | network |

### Native Hook 内存详细模式

数据存储到 `native_hook` + `native_hook_frame` 表，按 TraceType 区分内存类型：

| TraceType | 编号 | 含义 |
|-----------|------|------|
| FD | 0 | 文件描述符 |
| THREAD | 1 | 线程 |
| GPU_VK | 2 | GPU Vulkan |
| GPU_GLES | 3 | GPU OpenGL ES |
| GPU_CL | 4 | GPU OpenCL |
| OTHER | 5 | 其他 |
| ARKTS_HEAP | 6 | ArkTS 堆 |
| JS_HEAP | 7 | JS 堆 |
| KMP_HEAP | 8 | KMP 堆 |
| RN_HERMES_HEAP | 9 | React Native Hermes 堆 |
| ASHMEM | 10 | Ashmem 共享内存 |
| DMA | 11 | DMA 内存 |
| SO | 12 | SO 动态库 |
| ARK_GLOBAL_HANDLE | 13 | Ark 全局 Handle |
| ARK_LOCAL_HANDLE | 14 | Ark 局部 Handle |
| VMA_ARKWEB | 15 | ArkWeb VMA |
| DART_HEAP | 16 | Dart 堆 |
| ARKTS_STATIC_HEAP | 17 | ArkTS 静态堆 |

> 每次申请/释放独立记录到 native_hook 表，调用栈记录到 native_hook_frame 表。

### Native Hook 内存统计模式

数据存储到 `native_hook_statistic` 表，按 MemoryType 区分（编号与 TraceType 不同！）：

| MemoryType | 编号 | 含义 |
|------------|------|------|
| MALLOC | 0 | malloc 统计 |
| MMAP | 1 | mmap 统计 |
| FILE_PAGE_MSG | 2 | 文件页统计 |
| MEMORY_USING_MSG | 3 | 内存占用统计 |
| FD | 4 | FD 统计 |
| THREAD | 5 | 线程统计 |
| GPU_VK | 6 | GPU Vulkan 统计 |
| GPU_GLES | 7 | GPU OpenGL ES 统计 |
| GPU_CL | 8 | GPU OpenCL 统计 |
| SO | 9 | SO 统计 |
| ARKTS_HEAP | 10 | ArkTS 堆统计 |
| JS_HEAP | 11 | JS 堆统计 |
| KMP_HEAP | 12 | KMP 堆统计 |
| RN_HERMES_HEAP | 13 | React Native Hermes 堆统计 |
| ASHMEM | 14 | Ashmem 统计 |
| DMA | 15 | DMA 统计 |
| OTHER | 16 | 其他统计 |
| ARK_GLOBAL_HANDLE | 17 | Ark 全局 Handle 统计 |
| ARK_LOCAL_HANDLE | 18 | Ark 局部 Handle 统计 |
| VMA_ARKWEB | 19 | ArkWeb VMA 统计 |
| DART_HEAP | 20 | Dart 堆统计 |
| ARKTS_STATIC_HEAP | 21 | ArkTS 静态堆统计 |

> 按采样间隔上报，按栈维度聚合申请/释放次数和大小。

### 内存扩展表

| 事件 | 存储表 |
|------|--------|
| trace_smaps | smaps |
| trace_ash_mem | memory_ashmem |
| trace_dma_mem | memory_dma |
| trace_gpu_process_mem | memory_process_gpu |
| trace_gpu_window_mem | memory_window_gpu |
| trace_window_manager_service | memory_rs_image |

### 帧渲染事件

| 事件 | 存储表 |
|------|--------|
| trace_vsync | frame_slice |
| trace_on_do_composition | frame_slice |
| trace_frame_queue | frame_slice |

> frame_maps 表记录 app→RS 帧映射，gpu_slice 记录 RS 帧对应 GPU 渲染时长。

### HiSysEvent 事件

| 事件 | 存储表 |
|------|--------|
| trace_hisys_event | hisys_event_measure, hisys_all_event, app_name |

### XPower 功耗事件

| 事件 | 存储表 |
|------|--------|
| xpower | xpower_component_top, xpower_app_statistic, xpower_app_detail_cpu, xpower_app_detail_gpu, xpower_app_detail_display, xpower_app_detail_wifi, xpower_measure |

### JS 内存 / CPU Profiler

| 事件 | 存储表 |
|------|--------|
| trace_js_memory | js_config, js_heap_files, js_heap_nodes, js_heap_edges, js_heap_string, js_heap_location, js_heap_info, js_heap_sample, js_heap_trace_node, js_heap_trace_function_info |

> js_cpu_profiler_node / js_cpu_profiler_sample 表存储 CPU Profiler 数据。

### FFRT 事件

| 事件 | 存储表 |
|------|--------|
| ffrt | callstack |

### 网络剖析

| 事件 | 存储表 |
|------|--------|
| network_profiler | network_information, network_time_information |

---

## 3. eBPF 数据（独立 ebpf 格式 或嵌入 htrace）

| 事件 | 存储表 |
|------|--------|
| trace_ebpf | ebpf_callstack |
| trace_ebpf_file_system | file_system_sample |
| trace_ebpf_paged_memory | paged_memory_sample |
| trace_ebpf_bio_latency | bio_latency_sample |

---

## 4. Hiperf 数据（独立 hiperf 格式 或嵌入 htrace）

| 事件 | 存储表 |
|------|--------|
| trace_perf | perf_thread, perf_sample, perf_report, perf_files, perf_callchain, perf_napi_async |

---

## 5. 业务模板事件（bytrace / htrace 打标触发）

| 事件/模板 | 存储表 | 触发方式 |
|-----------|--------|----------|
| 应用启动 | app_startup | tracing_mark_write 打标 |
| SO 初始化 | static_initalize | tracing_mark_write 打标 |
| 任务池 | task_pool | tracing_mark_write 打标 |
| 动效帧 | dynamic_frame | tracing_mark_write 打标 |
| 动效 | animation | tracing_mark_write 打标 |

---

## 关键注意事项

1. **TraceType vs MemoryType 编号不一致**：同一类型如 ARKTS_HEAP 在 TraceType=6（详细模式），MemoryType=10（统计模式），编号完全不同
2. **bytrace 仅支持 ftrace**：文本格式不支持任何插件数据
3. **部分 ftrace 事件只记录不解析**：regulator/signal/block_bio* 等仅写入 raw 表
4. **详细模式 vs 统计模式**：Native Hook 详细模式每次申请/释放独立记录（→ native_hook 表），统计模式按栈维度聚合（→ native_hook_statistic 表）
5. **htrace dataType_=1** 为嵌入 hiperf 的 htrace 文件