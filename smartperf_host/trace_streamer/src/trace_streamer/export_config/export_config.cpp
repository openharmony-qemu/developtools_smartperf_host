/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2023. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <fstream>
#include <iostream>
#include <map>
#include <queue>
#include <unordered_set>
#include <vector>

#include "json.hpp"

#include "export_config.h"

namespace SysTuning {
namespace TraceStreamer {

namespace {
const std::set<std::string> SUPPORTED_CATEGORIES = {
    "ftrace", "network", "ebpf", "native_memory", "arkts",
    "hiperf", "memory", "hisys_event", "xpower"
};

const std::set<std::string> BASE_TABLES = {
    "process", "thread", "args", "stat", "data_dict",
    "symbols", "meta", "trace_range", "data_type",
    "span_join", "trace_config", "datasource_clockid", "clock_snapshot"
};

const std::map<std::string, std::set<std::string>> CATEGORY_TABLES = {
    {"ftrace", {"raw", "instant", "sched_slice", "thread_state", "callstack", "irq",
                "hidump", "syscall", "log", "sys_event_filter", "diskio", "cpu_usage",
                "live_process", "dma_fence", "timerfd_wakeup", "filesystem_io",
                "frame_slice", "frame_maps", "gpu_slice", "task_pool", "app_startup",
                "static_initalize", "animation", "dynamic_frame", "device_info",
                "measure", "cpu_measure_filter", "clock_event_filter", "clk_event_filter",
                "process_measure", "process_measure_filter", "measure_filter"}},
    {"network", {"network", "network_time_information", "network_information"}},
    {"ebpf", {"ebpf_callstack", "bio_latency_sample", "file_system_sample", "paged_memory_sample"}},
    {"native_memory", {"native_hook", "native_hook_frame", "native_hook_statistic"}},
    {"arkts", {"js_config", "js_heap_files", "js_heap_edges", "js_heap_info",
               "js_heap_location", "js_heap_nodes", "js_heap_sample", "js_heap_string",
               "js_heap_trace_function_info", "js_heap_trace_node", "js_cpu_profiler_node",
               "js_cpu_profiler_sample"}},
    {"hiperf", {"perf_report", "perf_sample", "perf_callchain", "perf_thread", "perf_files", "perf_napi_async"}},
    {"memory", {"smaps", "memory_ashmem", "memory_dma", "memory_process_gpu",
                "memory_window_gpu", "memory_cpu", "memory_profile", "memory_rs_image",
                "sys_mem_measure", "process_measure", "process_measure_filter", "measure_filter"}},
    {"hisys_event", {"app_name", "hisys_event_measure", "device_state", "hisys_all_event"}},
    {"xpower", {"xpower_measure", "xpower_app_statistic", "xpower_app_detail_cpu",
                "xpower_app_detail_gpu", "xpower_app_detail_wifi", "xpower_app_detail_display",
                "xpower_component_top"}},
};

const std::map<std::string, std::set<std::string>> BASE_TABLE_DEPS = {
    {"process", {"ftrace", "ebpf", "native_memory", "memory", "network"}},
    {"thread", {"ftrace", "ebpf", "native_memory", "memory", "network"}},
    {"args", {"ftrace"}},
    {"data_dict", {"ftrace", "ebpf", "native_memory", "hiperf", "hisys_event"}},
    {"symbols", {"ftrace"}},
    {"trace_config", {"xpower", "hisys_event", "memory"}},
};

const std::set<std::string> GLOBAL_BASE_TABLES = {"stat", "datasource_clockid"};
const std::set<std::string> ALWAYS_BASE_TABLES = {
    "meta", "trace_range", "data_type", "span_join", "clock_snapshot"
};

const std::map<std::string, std::set<std::string>> EVENT_TO_TABLES = {
    {"sched_switch", {"sched_slice", "thread_state"}},
    {"sched_waking", {"instant", "raw"}},
    {"sched_wakeup", {"instant", "raw"}},
    {"sched_wakeup_lite", {"instant", "raw"}},
    {"sched_wakeup_new", {"instant", "raw"}},
    {"sched_switch_lite", {"sched_slice", "thread_state"}},
    {"tracing_mark_write", {"callstack"}},
    {"print", {"callstack"}},
    {"irq_handler_entry", {"irq"}},
    {"irq_handler_exit", {"irq"}},
    {"ipi_entry", {"irq"}},
    {"ipi_exit", {"irq"}},
    {"softirq_raise", {"irq"}},
    {"softirq_entry", {"irq"}},
    {"softirq_exit", {"irq"}},
    {"binder_transaction", {"callstack"}},
    {"binder_transaction_received", {"callstack"}},
    {"binder_transaction_alloc_buf", {"callstack"}},
    {"binder_transaction_lock", {"callstack"}},
    {"binder_transaction_locked", {"callstack"}},
    {"binder_transaction_unlock", {"callstack"}},
    {"block_rq_issue", {"filesystem_io"}},
    {"block_rq_complete", {"filesystem_io"}},
    {"cpu_frequency", {"measure"}},
    {"cpu_idle", {"measure", "raw"}},
    {"cpu_frequency_limits", {"measure"}},
    {"sys_enter", {"syscall"}},
    {"sys_exit", {"syscall"}},
    {"workqueue_execute_start", {"callstack"}},
    {"workqueue_execute_end", {"callstack"}},
    {"dma_fence_init", {"dma_fence"}},
    {"dma_fence_destroy", {"dma_fence"}},
    {"dma_fence_enable_signal", {"dma_fence"}},
    {"dma_fence_signaled", {"dma_fence"}},
    {"timerfd_wakeup", {"timerfd_wakeup"}},
    {"clock_set_rate", {"measure"}},
    {"clock_enable", {"measure"}},
    {"clock_disable", {"measure"}},
    {"clk_set_rate", {"measure"}},
    {"clk_enable", {"measure"}},
    {"clk_disable", {"measure"}},
    {"regulator_set_voltage", {"measure"}},
    {"regulator_set_voltage_complete", {"measure"}},
    {"regulator_disable", {"measure"}},
    {"regulator_disable_complete", {"measure"}},
    {"task_rename", {"thread"}},
    {"sched_blocked_reason", {"thread_state"}},
    {"suspend_resume", {"stat"}},
    {"task_newtask", {"stat"}},
    {"sched_process_exit", {"thread"}},
    {"sched_process_free", {"thread"}},
    {"hmfs_read_enter", {"filesystem_io"}},
    {"hmfs_read_exit", {"filesystem_io"}},
    {"hmfs_write_enter", {"filesystem_io"}},
    {"hmfs_write_exit", {"filesystem_io"}},
};

const std::map<std::string, std::set<std::string>> PLUGIN_TO_TABLES = {
    {"ftrace-plugin", {"sched_slice", "thread_state", "callstack", "irq", "filesystem_io",
                       "measure", "syscall", "dma_fence", "instant", "raw"}},
    {"cpu-plugin", {"cpu_usage"}},
    {"diskio-plugin", {"diskio"}},
    {"process-plugin", {"live_process"}},
    {"ffrt-profiler", {"callstack", "thread_state"}},
    {"hidump-plugin", {"hidump"}},
    {"network-plugin", {"network"}},
    {"network-profiler", {"network_time_information", "network_information"}},
    {"memory-plugin", {"smaps", "memory_ashmem", "memory_dma", "memory_process_gpu",
                       "memory_window_gpu", "memory_cpu", "memory_profile", "memory_rs_image"}},
    {"nativehook", {"native_hook", "native_hook_frame", "native_hook_statistic"}},
    {"arkts-plugin", {"js_config", "js_heap_files", "js_heap_edges", "js_heap_info",
                      "js_heap_location", "js_heap_nodes", "js_heap_sample", "js_heap_string",
                      "js_heap_trace_function_info", "js_heap_trace_node", "js_cpu_profiler_node",
                      "js_cpu_profiler_sample"}},
    {"hisysevent-plugin", {"hisys_event_measure", "hisys_all_event", "app_name", "device_state"}},
    {"hilog-plugin", {"log"}},
    {"xpower-plugin", {"xpower_measure", "xpower_app_statistic", "xpower_app_detail_cpu",
                       "xpower_app_detail_gpu", "xpower_app_detail_wifi",
                       "xpower_app_detail_display", "xpower_component_top"}},
    {"stream-plugin", {"stream"}},
};

const std::map<std::string, std::set<std::string>> TABLE_DEPS = {
    {"process", {"data_dict"}},
    {"thread", {"data_dict"}},
    {"args", {"data_dict"}},
    {"symbols", {"data_dict"}},
    {"raw", {"thread"}},
    {"instant", {"thread", "data_dict"}},
    {"sched_slice", {"process", "thread", "args"}},
    {"thread_state", {"thread", "args", "stat"}},
    {"callstack", {"thread", "args", "data_dict"}},
    {"irq", {"thread", "args", "data_dict"}},
    {"syscall", {"thread", "data_dict"}},
    {"log", {"data_dict"}},
    {"dma_fence", {"data_dict"}},
    {"timerfd_wakeup", {"data_dict"}},
    {"filesystem_io", {"thread", "process"}},
    {"network_time_information", {"thread", "process"}},
    {"ebpf_callstack", {"symbols", "data_dict"}},
    {"bio_latency_sample", {"process", "thread", "data_dict"}},
    {"file_system_sample", {"process", "thread", "data_dict"}},
    {"paged_memory_sample", {"process", "thread", "data_dict"}},
    {"native_hook", {"process", "thread", "symbols", "data_dict"}},
    {"native_hook_frame", {"symbols"}},
    {"native_hook_statistic", {"process", "symbols", "data_dict"}},
    {"measure", {"measure_filter", "data_dict"}},
    {"cpu_measure_filter", {"data_dict"}},
    {"measure_filter", {"args"}},
    {"process_measure", {"process", "thread", "process_measure_filter", "data_dict"}},
    {"process_measure_filter", {"process", "data_dict"}},
    {"clock_event_filter", {"data_dict"}},
    {"clk_event_filter", {"data_dict"}},
    {"xpower_measure", {"measure_filter", "data_dict"}},
    {"perf_report", {"data_dict"}},
    {"perf_sample", {"data_dict"}},
    {"perf_callchain", {"symbols"}},
    {"perf_thread", {"data_dict"}},
    {"perf_files", {"data_dict"}},
    {"perf_napi_async", {"thread", "data_dict"}},
    {"app_startup", {"thread", "process", "data_dict"}},
    {"static_initalize", {"thread", "process", "data_dict"}},
    {"animation", {"data_dict"}},
    {"dynamic_frame", {"data_dict"}},
    {"task_pool", {"thread"}},
    {"device_info", {"data_dict"}},
    {"frame_slice", {"process", "thread"}},
    {"smaps", {"process"}},
    {"memory_ashmem", {"process"}},
    {"memory_dma", {"process"}},
    {"memory_process_gpu", {"process", "thread"}},
    {"memory_window_gpu", {"process"}},
    {"memory_rs_image", {"process"}},
    {"hisys_event_measure", {"data_dict"}},
    {"app_name", {"data_dict"}},
    {"device_state", {"data_dict"}},
    {"hisys_all_event", {"data_dict"}},
    {"xpower_app_statistic", {"data_dict"}},
    {"xpower_app_detail_display", {"data_dict"}},
    {"xpower_app_detail_cpu", {"data_dict"}},
    {"xpower_app_detail_gpu", {"data_dict"}},
    {"xpower_app_detail_wifi", {"data_dict"}},
    {"xpower_component_top", {"data_dict"}},
    {"hidump", {"data_dict"}},
    {"diskio", {"data_dict"}},
    {"cpu_usage", {"data_dict"}},
    {"network", {"data_dict"}},
    {"sys_event_filter", {"data_dict"}},
};

const std::map<std::string, std::set<std::string>> PLUGIN_NAME_VARIANTS = {
    {"ftrace-plugin", {"ftrace-plugin", "/data/local/tmp/libftrace_plugin.z.so"}},
    {"memory-plugin", {"memory-plugin", "memory-plugin_config"}},
    {"hidump-plugin", {"hidump-plugin", "/data/local/tmp/libhidumpplugin.z.so"}},
    {"hilog-plugin", {"hilog-plugin", "/data/local/tmp/libhilogplugin.z.so"}},
    {"hisysevent-plugin", {"hisysevent-plugin", "hisysevent-plugin_config"}},
    {"nativehook", {"nativehook", "hookdaemon", "nativehook_config"}},
    {"arkts-plugin", {"arkts-plugin", "arkts-plugin_config"}},
    {"ffrt-profiler", {"ffrt-profiler", "ffrt-profiler_config"}},
    {"network-profiler", {"network-profiler", "network-profiler_config"}},
};

bool ParseJsonFile(const std::string &configPath, nlohmann::json &j, std::string &err)
{
    std::ifstream ifs(configPath);
    if (!ifs.is_open()) {
        err = "Cannot open config file: " + configPath;
        return false;
    }
    ifs >> j;
    if (ifs.fail()) {
        err = "JSON parse error";
        return false;
    }
    return true;
}

void ParseCategories(const nlohmann::json &j, std::set<std::string> &out)
{
    if (!j.contains("categories")) {
        return;
    }
    for (const auto &cat : j["categories"]) {
        out.insert(cat.get<std::string>());
    }
}

void ParseTables(const nlohmann::json &j, std::set<std::string> &out)
{
    if (!j.contains("tables")) {
        return;
    }
    for (const auto &tbl : j["tables"]) {
        out.insert(tbl.get<std::string>());
    }
}

bool ValidateNotEmpty(const std::set<std::string> &categories,
                      const std::set<std::string> &exportTables,
                      std::string &err)
{
    if (!categories.empty()) {
        return true;
    }
    if (!exportTables.empty()) {
        return true;
    }
    err = "Both categories and tables are empty in config";
    return false;
}

bool HasAnyCategory(const std::set<std::string> &deps, const std::set<std::string> &cats)
{
    for (const auto &dep : deps) {
        if (cats.count(dep)) {
            return true;
        }
    }
    return false;
}

bool IsBaseTableNeeded(const std::string &baseTable, const std::set<std::string> &cats)
{
    if (GLOBAL_BASE_TABLES.count(baseTable) || ALWAYS_BASE_TABLES.count(baseTable)) {
        return true;
    }
    auto depIt = BASE_TABLE_DEPS.find(baseTable);
    if (depIt == BASE_TABLE_DEPS.end()) {
        return false;
    }
    return HasAnyCategory(depIt->second, cats);
}

void EnqueueUnresolvedDeps(const std::string &tbl, std::set<std::string> &resolved,
                           std::queue<std::string> &pending)
{
    auto it = TABLE_DEPS.find(tbl);
    if (it == TABLE_DEPS.end()) {
        return;
    }
    for (const auto &dep : it->second) {
        if (!resolved.count(dep)) {
            pending.push(dep);
        }
    }
}
} // namespace

bool ExportConfig::LoadConfig(const std::string &configPath)
{
    nlohmann::json j;
    if (!ParseJsonFile(configPath, j, lastError_)) {
        std::cerr << lastError_ << std::endl;
        return false;
    }
    ParseCategories(j, categories_);
    ParseTables(j, exportTables_);
    if (categories_.empty() && exportTables_.empty()) {
        hasConfig_ = false;
        return true;
    }
    if (!ValidateCategories()) {
        return false;
    }
    ComputeExportFilter();
    ComputeAllowedPluginNames();
    hasConfig_ = true;
    return true;
}

bool ExportConfig::ValidateCategories()
{
    for (const auto &cat : categories_) {
        if (SUPPORTED_CATEGORIES.find(cat) == SUPPORTED_CATEGORIES.end()) {
            lastError_ = "Invalid category: " + cat;
            std::cerr << lastError_ << std::endl;
            return false;
        }
    }
    return true;
}

void ExportConfig::AddBaseTables(const std::set<std::string> &cats)
{
    for (const auto &baseTable : BASE_TABLES) {
        if (IsBaseTableNeeded(baseTable, cats)) {
            exportFilter_.insert(baseTable);
        }
    }
}

void ExportConfig::ResolveTableDeps(const std::string &table, std::set<std::string> &resolved)
{
    std::queue<std::string> pending;
    pending.push(table);
    while (!pending.empty()) {
        std::string tbl = pending.front();
        pending.pop();
        if (!resolved.insert(tbl).second) {
            continue;
        }
        EnqueueUnresolvedDeps(tbl, resolved, pending);
    }
}

void ExportConfig::ComputeExportFilter()
{
    AddTablesFromCategories();
    AddTablesFromExplicitTables();
}

void ExportConfig::AddTablesFromCategories()
{
    if (categories_.empty()) {
        return;
    }
    AddBaseTables(categories_);
    for (const auto &cat : categories_) {
        ResolveCategoryTables(cat);
    }
}

void ExportConfig::ResolveCategoryTables(const std::string &cat)
{
    auto it = CATEGORY_TABLES.find(cat);
    if (it == CATEGORY_TABLES.end()) {
        return;
    }
    for (const auto &tbl : it->second) {
        ResolveTableDeps(tbl, exportFilter_);
    }
}

void ExportConfig::AddTablesFromExplicitTables()
{
    if (exportTables_.empty()) {
        return;
    }
    AddBaseTables({});
    for (const auto &tbl : exportTables_) {
        ResolveTableDeps(tbl, exportFilter_);
    }
}

void ExportConfig::ComputeAllowedPluginNames()
{
    if (exportFilter_.empty()) {
        return;
    }
    for (const auto &[pluginName, pluginTables] : PLUGIN_TO_TABLES) {
        AddPluginIfNeeded(pluginName, pluginTables);
    }
}

void ExportConfig::AddPluginIfNeeded(const std::string &pluginName, const std::set<std::string> &pluginTables)
{
    for (const auto &tbl : pluginTables) {
        if (exportFilter_.count(tbl)) {
            AddPluginVariants(pluginName);
            return;
        }
    }
}

void ExportConfig::AddPluginVariants(const std::string &pluginName)
{
    auto varIt = PLUGIN_NAME_VARIANTS.find(pluginName);
    if (varIt != PLUGIN_NAME_VARIANTS.end()) {
        for (const auto &variant : varIt->second) {
            allowedPluginNames_.insert(variant);
        }
    } else {
        allowedPluginNames_.insert(pluginName);
    }
}

const std::set<std::string> &ExportConfig::GetExportFilter() const
{
    return exportFilter_;
}

const std::set<std::string> &ExportConfig::GetAllowedPluginNames() const
{
    return allowedPluginNames_;
}

bool ExportConfig::IsEventNeeded(const std::string &eventName) const
{
    if (exportFilter_.empty()) {
        return true;
    }
    auto it = EVENT_TO_TABLES.find(eventName);
    if (it == EVENT_TO_TABLES.end()) {
        return true;
    }
    return IsAnyTableNeeded(it->second);
}

bool ExportConfig::IsHiperfNeeded() const
{
    if (exportFilter_.empty()) {
        return true;
    }
    static const std::set<std::string> perfTables = {
        "perf_sample", "perf_callchain", "perf_report",
        "perf_thread", "perf_files", "perf_napi_async"
    };
    for (const auto &tbl : perfTables) {
        if (exportFilter_.count(tbl)) {
            return true;
        }
    }
    return false;
}

bool ExportConfig::IsAnyTableNeeded(const std::set<std::string> &tables) const
{
    if (exportFilter_.empty()) {
        return true;
    }
    for (const auto &tbl : tables) {
        if (exportFilter_.count(tbl)) {
            return true;
        }
    }
    return false;
}

bool ExportConfig::HasConfig() const
{
    return hasConfig_;
}

} // namespace TraceStreamer
} // namespace SysTuning
