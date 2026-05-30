# TraceStreamer 虚表 Schema 定义

所有虚表只读（`Update()` → `SQLITE_READONLY`），数据来源 `TraceDataCache`。

---

| 表名 | 模块 | 主键 | 列定义 |
|------|------|------|--------|
| app_name | hi_sysevent | id | id(INTEGER), app_name(INTEGER), app_key(INTEGER) |
| app_startup | ftrace | id | id(INTEGER), call_id(INTEGER), ipid(INTEGER), tid(INTEGER), start_time(INTEGER), end_time(INTEGER), start_name(INTEGER), packed_name(TEXT) |
| animation | ftrace | id | id(INTEGER), input_time(INTEGER), start_point(INTEGER), end_point(INTEGER), frame_info(TEXT), name(TEXT) |
| args | base | id | id(INTEGER), key(INTEGER), datatype(INTEGER), value(INTEGER), argset(INTEGER) |
| bio_latency_sample | ebpf | id | id(INTEGER), callchain_id(INTEGER), type(INTEGER), ipid(INTEGER), itid(INTEGER), start_ts(INTEGER), end_ts(INTEGER), latency_dur(INTEGER), tier(INTEGER), size(INTEGER), block_number(TEXT), path_id(TEXT), dur_per_4k(INTEGER) |
| callstack | ftrace | callid, ts, depth | id(INTEGER), ts(INTEGER), dur(INTEGER), callid(INTEGER), cat(TEXT), name(TEXT), depth(INTEGER), cookie(INTEGER), colorIndex(INTEGER), parent_id(INTEGER), argsetid(INTEGER), chainId(TEXT), spanId(TEXT), parentSpanId(TEXT), flag(TEXT), trace_level(TEXT), trace_tag(TEXT), custom_category(TEXT), custom_args(TEXT), child_callid(INTEGER) |
| clk_event_filter | ftrace | id | id(INTEGER), type(TEXT), name(TEXT), cpu(INTEGER) |
| clock_event_filter | ftrace | id | id(INTEGER), type(TEXT), name(TEXT), cpu(INTEGER) |
| clock_snapshot | ftrace | ts, id | id(INTEGER), clock_id(INTEGER), ts(INTEGER), clock_name(TEXT) |
| cpu_measure_filter | ftrace | id | id(INTEGER), name(TEXT), cpu(INTEGER) |
| cpu_usage | monitor | ts | ts(INTEGER), dur(INTEGER), total_load(REAL), user_load(REAL), system_load(REAL), process_num(INTEGER) |
| data_dict | base | id | id(INTEGER), data(TEXT) |
| data_type | base | id | id(INTEGER), typeId(INTEGER), desc(TEXT) |
| datasource_clockid | base | id | id(INTEGER), data_source_name(TEXT), clock_id(INTEGER) |
| device_info | base | physical_width | physical_width(INTEGER), physical_height(INTEGER), physical_frame_rate(INTEGER) |
| device_state | hi_sysevent | id | id(INTEGER), brightness(INTEGER), bt_state(INTEGER), location(INTEGER), wifi(INTEGER), stream_default(INTEGER), voice_call(INTEGER), music(INTEGER), stream_ring(INTEGER), media(INTEGER), voice_assistant(INTEGER), system(INTEGER), alarm(INTEGER), notification(INTEGER), bt_sco(INTEGER), enforced_audible(INTEGER), stream_dtmf(INTEGER), stream_tts(INTEGER), accessibility(INTEGER), recording(INTEGER), stream_all(INTEGER) |
| diskio | monitor | ts | ts(INTEGER), dur(INTEGER), rd(INTEGER), wr(INTEGER), rd_speed(REAL), wr_speed(REAL), rd_count(INTEGER), wr_count(INTEGER), rd_count_speed(REAL), wr_count_speed(REAL) |
| dma_fence | ftrace | id | id(INTEGER), ts(INTEGER), dur(INTEGER), cat(TEXT), driver(TEXT), timeline(TEXT), context(INTEGER), seqno(INTEGER) |
| dynamic_frame | ftrace | id | id(INTEGER), x(INTEGER), y(INTEGER), width(INTEGER), height(INTEGER), alpha(TEXT), name(TEXT), end_time(INTEGER) |
| ebpf_callstack | ebpf | id | id(INTEGER), callchain_id(INTEGER), depth(INTEGER), ip(TEXT), symbols_id(INTEGER), file_path_id(INTEGER) |
| file_system_sample | ebpf | id | id(INTEGER), callchain_id(INTEGER), type(INTEGER), ipid(INTEGER), itid(INTEGER), start_ts(INTEGER), end_ts(INTEGER), dur(INTEGER), return_value(TEXT), error_code(TEXT), fd(INTEGER), file_id(INTEGER), size(INTEGER), first_argument(TEXT), second_argument(TEXT), third_argument(TEXT), fourth_argument(TEXT) |
| filesystem_io | ftrace | id | id(INTEGER), itid(INTEGER), ipid(INTEGER), start_time(INTEGER), end_time(INTEGER), duration(INTEGER), is_block(INTEGER), is_write(INTEGER), main_dev(INTEGER), sub_dev(INTEGER), ino(INTEGER), enter_size(INTEGER), enter_offset(INTEGER), exit_offset(INTEGER), request_bytes(INTEGER), actual_bytes(INTEGER), file_id(INTEGER), sector(INTEGER), nr_sector(INTEGER), rwbs_id(INTEGER), cmd_id(INTEGER) |
| frame_maps | ftrace | id | id(INTEGER), src_row(INTEGER), dst_row(INTEGER) |
| frame_slice | ftrace | id | id(INTEGER), ts(INTEGER), vsync(INTEGER), ipid(INTEGER), itid(INTEGER), callstack_id(INTEGER), dur(INTEGER), src(TEXT), dst(INTEGER), type(INTEGER), type_desc(TEXT), flag(INTEGER), depth(INTEGER), frame_no(INTEGER) |
| gpu_slice | ftrace | id | id(INTEGER), frame_row(INTEGER), dur(INTEGER) |
| hidump | monitor | ts | id(INTEGER), ts(INTEGER), fps(INTEGER) |
| hisys_all_event | hi_sysevent | id | id(INTEGER), domain_id(INTEGER), event_name_id(INTEGER), ts(INTEGER), type(INTEGER), time_zone(TEXT), pid(INTEGER), tid(INTEGER), uid(INTEGER), level(TEXT), tag(TEXT), event_id(TEXT), seq(INTEGER), info(TEXT), contents(TEXT) |
| hisys_event_measure | hi_sysevent | id | id(INTEGER), serial(INTEGER), ts(INTEGER), name_id(INTEGER), key_id(INTEGER), type(INTEGER), int_value(REAL), string_value(TEXT) |
| instant | ftrace | ts, ref | ts(INTEGER), name(TEXT), ref(INTEGER), wakeup_from(INTEGER), ref_type(TEXT), value(REAL) |
| irq | ftrace | callid, ts, depth | id(INTEGER), ts(INTEGER), dur(INTEGER), callid(INTEGER), cat(TEXT), name(TEXT), depth(INTEGER), cookie(INTEGER), parent_id(INTEGER), argsetid(INTEGER), flag(TEXT) |
| js_config | js_memory | pid | pid(INTEGER), type(INTEGER), interval(INTEGER), capture_numeric_value(INTEGER), trace_allocation(INTEGER), enable_cpu_profiler(INTEGER), cpu_profiler_interval(INTEGER) |
| js_cpu_profiler_node | js_memory | function_id | function_id(INTEGER), function_index(INTEGER), script_id(TEXT), url_index(INTEGER), line_number(INTEGER), column_number(INTEGER), hit_count(INTEGER), children(INTEGER), parent_id(INTEGER) |
| js_cpu_profiler_sample | js_memory | id | id(INTEGER), function_id(INTEGER), start_time(INTEGER), end_time(INTEGER), dur(INTEGER) |
| js_heap_edges | js_memory | file_id | file_id(INTEGER), edge_index(INTEGER), type(INTEGER), name_or_index(INTEGER), to_node(INTEGER), from_node_id(INTEGER), to_node_id(INTEGER) |
| js_heap_files | js_memory | id | id(INTEGER), file_name(TEXT), start_time(INTEGER), end_time(INTEGER), self_size(INTEGER) |
| js_heap_info | js_memory | file_id | file_id(INTEGER), key(TEXT), type(INTEGER), int_value(INTEGER), str_value(TEXT) |
| js_heap_location | js_memory | file_id | file_id(INTEGER), object_index(INTEGER), script_id(INTEGER), line(INTEGER), column(INTEGER) |
| js_heap_nodes | js_memory | file_id | file_id(INTEGER), node_index(INTEGER), type(INTEGER), name(INTEGER), id(INTEGER), self_size(INTEGER), edge_count(INTEGER), trace_node_id(INTEGER), detachedness(INTEGER) |
| js_heap_sample | js_memory | file_id | file_id(INTEGER), timestamp_us(INTEGER), last_assigned_id(INTEGER) |
| js_heap_string | js_memory | file_id | file_id(INTEGER), file_index(INTEGER), string(TEXT) |
| js_heap_trace_function_info | js_memory | file_id | file_id(INTEGER), function_index(INTEGER), function_id(INTEGER), name(INTEGER), script_name(INTEGER), script_id(INTEGER), line(INTEGER), column(INTEGER) |
| js_heap_trace_node | js_memory | file_id | file_id(INTEGER), id(INTEGER), function_info_index(INTEGER), count(INTEGER), size(INTEGER), parent_id(INTEGER) |
| live_process | monitor | ts | ts(INTEGER), dur(INTEGER), cpu_time(INTEGER), process_id(INTEGER), process_name(TEXT), parent_process_id(INTEGER), uid(INTEGER), user_name(TEXT), cpu_usage(REAL), pss_info(INTEGER), thread_num(INTEGER), disk_writes(INTEGER), disk_reads(INTEGER) |
| log | monitor | ts | seq(INTEGER), ts(INTEGER), pid(INTEGER), tid(INTEGER), level(TEXT), tag(TEXT), context(TEXT), origints(INTEGER) |
| measure | ftrace | ts, filter_id | type(TEXT), ts(INTEGER), dur(INTEGER), value(INTEGER), filter_id(INTEGER) |
| measure_filter | ftrace | id | id(INTEGER), type(TEXT), name(TEXT), source_arg_set_id(INTEGER) |
| memory_ashmem | monitor | id | id(INTEGER), ts(INTEGER), ipid(INTEGER), adj(INTEGER), fd(INTEGER), ashmem_name_id(INTEGER), size(INTEGER), pss(INTEGER), ashmem_id(INTEGER), time(INTEGER), ref_count(INTEGER), purged(INTEGER), flag(INTEGER) |
| memory_cpu | monitor | id | id(INTEGER), ts(INTEGER), total_size(INTEGER) |
| memory_dma | monitor | id | id(INTEGER), ts(INTEGER), ipid(INTEGER), fd(INTEGER), size(INTEGER), ino(INTEGER), exp_pid(INTEGER), exp_task_comm_id(INTEGER), buf_name_id(INTEGER), exp_name_id(INTEGER), flag(INTEGER) |
| memory_process_gpu | monitor | id | id(INTEGER), ts(INTEGER), gpu_name_id(INTEGER), all_gpu_size(INTEGER), addr(TEXT), ipid(INTEGER), itid(INTEGER), used_gpu_size(INTEGER) |
| memory_profile | monitor | id | id(INTEGER), ts(INTEGER), channel_id(INTEGER), total_size(INTEGER) |
| memory_rs_image | monitor | id | id(INTEGER), ipid(INTEGER), ts(INTEGER), mem_size(INTEGER), type_id(INTEGER), surface_name_id(INTEGER) |
| memory_window_gpu | monitor | id | id(INTEGER), ts(INTEGER), window_name_id(INTEGER), window_id(INTEGER), module_name_id(INTEGER), category_name_id(INTEGER), size(INTEGER), count(INTEGER), purgeable_size(INTEGER), ipid(INTEGER) |
| meta | base | name | name(TEXT), value(TEXT) |
| native_hook | native_hook | id | id(INTEGER), callchain_id(INTEGER), ipid(INTEGER), itid(INTEGER), event_type(TEXT), sub_type_id(INTEGER), start_ts(INTEGER), end_ts(INTEGER), dur(INTEGER), addr(INTEGER), heap_size(INTEGER), all_heap_size(INTEGER), current_size_dur(INTEGER), last_lib_id(INTEGER), last_symbol_id(INTEGER) |
| native_hook_frame | native_hook | id | id(INTEGER), callchain_id(INTEGER), depth(INTEGER), ip(INTEGER), symbol_id(INTEGER), file_id(INTEGER), offset(INTEGER), symbol_offset(INTEGER), vaddr(TEXT) |
| native_hook_statistic | native_hook | id | id(INTEGER), callchain_id(INTEGER), ipid(INTEGER), ts(INTEGER), type(INTEGER), sub_type_id(INTEGER), apply_count(INTEGER), release_count(INTEGER), apply_size(INTEGER), release_size(INTEGER), last_lib_id(INTEGER), last_symbol_id(INTEGER) |
| network | monitor | ts | ts(INTEGER), dur(INTEGER), tx(INTEGER), rx(INTEGER), tx_speed(REAL), rx_speed(REAL), packet_in(INTEGER), packet_in_sec(REAL), packet_out(INTEGER), packet_out_sec(REAL), net_type(TEXT) |
| network_information | network_profiler | id | id(INTEGER), request_id(TEXT), protocol(TEXT), domain(TEXT), request_uri(TEXT), request_method(TEXT), request_header(TEXT), response_status_code(INTEGER), response_header(TEXT), response_effective_url(TEXT), ip_address(TEXT), version(TEXT), reason_phrase(TEXT) |
| network_time_information | network_profiler | id | id(INTEGER), itid(INTEGER), ipid(INTEGER), begin_time(INTEGER), dns_end_time(INTEGER), tcp_end_time(INTEGER), tls_end_time(INTEGER), first_send_time(INTEGER), first_recv_time(INTEGER), end_time(INTEGER), cache_hit(INTEGER) |
| paged_memory_sample | monitor | id | id(INTEGER), callchain_id(INTEGER), type(INTEGER), ipid(INTEGER), start_ts(INTEGER), end_ts(INTEGER), dur(INTEGER), size(INTEGER), addr(TEXT), itid(INTEGER) |
| perf_callchain | hiperf | id | id(INTEGER), callchain_id(INTEGER), depth(INTEGER), ip(INTEGER), vaddr_in_file(INTEGER), offset_to_vaddr(INTEGER), file_id(INTEGER), symbol_id(INTEGER), name(INTEGER), source_file_id(INTEGER), line_number(INTEGER) |
| perf_files | hiperf | id | id(INTEGER), file_id(INTEGER), serial_id(INTEGER), symbol(TEXT), path(TEXT) |
| perf_napi_async | hiperf | id | id(INTEGER), ts(INTEGER), traceid(TEXT), cpu_id(INTEGER), thread_id(INTEGER), process_id(INTEGER), caller_callchainid(INTEGER), callee_callchainid(INTEGER), perf_sample_id(INTEGER), event_count(INTEGER), event_type_id(INTEGER) |
| perf_report | hiperf | id | id(INTEGER), report_type(TEXT), report_value(TEXT) |
| perf_sample | hiperf | id | id(INTEGER), callchain_id(INTEGER), timeStamp(INTEGER), thread_id(INTEGER), event_count(INTEGER), event_type_id(INTEGER), timestamp_trace(INTEGER), cpu_id(INTEGER), thread_state(TEXT) |
| perf_thread | hiperf | id | id(INTEGER), thread_id(INTEGER), process_id(INTEGER), thread_name(TEXT) |
| process | ftrace | id | id(INTEGER), ipid(INTEGER), pid(INTEGER), name(TEXT), start_ts(INTEGER), switch_count(INTEGER), thread_count(INTEGER), slice_count(INTEGER), mem_count(INTEGER) |
| process_measure | ftrace | ts, filter_id | *(同 measure) |
| process_measure_filter | ftrace | id | id(INTEGER), name(TEXT), ipid(INTEGER) |
| raw | ftrace | id | id(INTEGER), ts(INTEGER), name(TEXT), cpu(INTEGER), itid(INTEGER) |
| sched_slice | ftrace | id | id(INTEGER), ts(INTEGER), dur(INTEGER), ts_end(INTEGER), cpu(INTEGER), itid(INTEGER), ipid(INTEGER), end_state(TEXT), priority(INTEGER), arg_setid(INTEGER), prev_itid(INTEGER)*, prev_state(TEXT)* |
| smaps | monitor | id | id(INTEGER), timeStamp(INTEGER), start_addr(TEXT), end_addr(TEXT), dirty(INTEGER), swapper(INTEGER), resident_size(INTEGER), pss(INTEGER), virtaul_size(INTEGER), reside(REAL), protection_id(INTEGER), path_id(INTEGER), shared_clean(INTEGER), shared_dirty(INTEGER), private_clean(INTEGER), private_dirty(INTEGER), swap(INTEGER), swap_pss(INTEGER), type(INTEGER) |
| span_join | base | ts, partition | ts(INTEGER), dur(INTEGER), partition(INTEGER), *(动态列) |
| stat | base | event_name, stat_type | event_name(TEXT), stat_type(TEXT), count(INTEGER), serverity(TEXT), source(TEXT) |
| static_initalize | ftrace | id | id(INTEGER), ipid(INTEGER), tid(INTEGER), call_id(INTEGER), start_time(INTEGER), end_time(INTEGER), so_name(TEXT), depth(INTEGER) |
| sys_event_filter | ftrace | id | id(INTEGER), type(TEXT), name(TEXT) |
| sys_mem_measure | ftrace | ts, filter_id | *(同 measure) |
| syscall | ftrace | ts | syscall_number(INTEGER), ts(INTEGER), dur(INTEGER), itid(INTEGER), args(TEXT), ret(INTEGER) |
| symbols | base | id | id(INTEGER), funcname(TEXT), addr(INTEGER) |
| task_pool | ftrace | id | id(INTEGER), allocation_task_row(INTEGER), execute_task_row(INTEGER), return_task_row(INTEGER), allocation_itid(INTEGER), execute_itid(INTEGER), return_itid(INTEGER), task_id(INTEGER), priority(INTEGER), execute_state(INTEGER), return_state(INTEGER), timeout_row(INTEGER) |
| thread | ftrace | id | id(INTEGER), itid(INTEGER), tid(INTEGER), name(TEXT), start_ts(INTEGER), end_ts(INTEGER), ipid(INTEGER), is_main_thread(INTEGER), switch_count(INTEGER) |
| thread_state | ftrace | id | id(INTEGER), ts(INTEGER), dur(INTEGER), cpu(INTEGER), itid(INTEGER), tid(INTEGER), pid(INTEGER), state(TEXT), arg_setid(INTEGER) |
| timerfd_wakeup | ftrace | ts | id(INTEGER), ts(INTEGER), pid(INTEGER), tid(INTEGER), thread_name(INTEGER), interval(INTEGER), curr_mono(TEXT), expire_mono(INTEGER) |
| trace_config | base | id | id(INTEGER), trace_source(TEXT), key(TEXT), value(TEXT) |
| trace_range | base | start_ts | start_ts(INTEGER), end_ts(INTEGER) |
| xpower_app_detail_cpu | xpower | id | id(INTEGER), thread_name_id(INTEGER), start_time(INTEGER), thread_time(INTEGER), thread_loads(INTEGER), thread_energy(INTEGER) |
| xpower_app_detail_display | xpower | id | id(INTEGER), start_time(INTEGER), count_1hz(INTEGER), count_5hz(INTEGER), count_10hz(INTEGER), count_15hz(INTEGER), count_24hz(INTEGER), count_30hz(INTEGER), count_45hz(INTEGER), count_60hz(INTEGER), count_90hz(INTEGER), count_120hz(INTEGER), count_180hz(INTEGER) |
| xpower_app_detail_gpu | xpower | id | id(INTEGER), frequency(INTEGER), start_time(INTEGER), idle_time(INTEGER), run_time(INTEGER) |
| xpower_app_detail_wifi | xpower | id | id(INTEGER), start_time(INTEGER), tx_packets(INTEGER), rx_packets(INTEGER), tx_bytes(INTEGER), rx_bytes(INTEGER) |
| xpower_app_statistic | xpower | id | id(INTEGER), component_type_id(INTEGER), start_time(INTEGER), duration(INTEGER), energy(INTEGER) |
| xpower_component_top | xpower | id | id(INTEGER), component_type_id(INTEGER), start_time(INTEGER), appname(INTEGER), background_duration(INTEGER), background_energy(INTEGER), foreground_duration(INTEGER), foreground_energy(INTEGER), screen_off_duration(INTEGER), screen_off_energy(INTEGER), screen_on_duration(INTEGER), screen_on_energy(INTEGER), camera_id(INTEGER), uid(INTEGER), load(INTEGER), app_usage_duration(INTEGER), app_usage_energy(INTEGER) |
| xpower_measure | ftrace | ts, filter_id | *(同 measure) |

---

共 **91 类 / 94 SQL 表**。`measure`/`sys_mem_measure`/`process_measure`/`xpower_measure` 同结构（MeasureTable 注册 4 次）。`sched_slice` 的 `prev_itid`/`prev_state` 为扩展字段（`g_extendField=true` 时启用）。`span_join` 列为运行时动态生成。