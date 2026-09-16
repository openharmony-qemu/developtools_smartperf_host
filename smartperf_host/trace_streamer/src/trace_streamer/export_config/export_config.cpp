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

#include "export_config.h"

#include <fstream>
#include <iostream>
#include <map>
#include <vector>
#include "json.hpp"

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
    {"ftrace", {"sched_slice", "thread_state", "callstack", "irq", "filesystem_io",
                "measure", "syscall", "dma_fence", "instant", "raw", "timerfd_wakeup"}},
    {"network", {"network", "network_time_information", "network_information"}},
    {"ebpf", {"ebpf"}},
    {"native_memory", {"native_hook", "native_hook_frame", "native_hook_statistic"}},
    {"arkts", {"js_config", "js_heap_files", "js_heap_edges", "js_heap_info",
               "js_heap_location", "js_heap_nodes", "js_heap_sample", "js_heap_string",
               "js_heap_trace_function_info", "js_heap_trace_node", "js_cpu_profiler_node",
               "js_cpu_profiler_sample"}},
    {"hiperf", {"perf"}},
    {"memory", {"smaps", "memory_ashmem", "memory_dma", "memory_process_gpu",
                "memory_window_gpu", "memory_cpu", "memory_profile", "memory_rs_image"}},
    {"hisys_event", {"hisys_event_measure", "hisys_all_event"}},
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
    {"dma_fence_enable", {"dma_fence"}},
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
    {"hisysevent-plugin", {"hisys_event_measure", "hisys_all_event"}},
    {"hilog-plugin", {"log"}},
    {"xpower-plugin", {"xpower_measure", "xpower_app_statistic", "xpower_app_detail_cpu",
                        "xpower_app_detail_gpu", "xpower_app_detail_wifi",
                        "xpower_app_detail_display", "xpower_component_top"}},
    {"stream-plugin", {"stream"}},
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
} // namespace

bool ExportConfig::LoadConfig(const std::string &configPath)
{
    std::ifstream ifs(configPath);
    if (!ifs.is_open()) {
        lastError_ = "Cannot open config file: " + configPath;
        std::cerr << lastError_ << std::endl;
        return false;
    }

    nlohmann::json j;
    try {
        ifs >> j;
    } catch (const std::exception &e) {
        lastError_ = std::string("JSON parse error: ") + e.what();
        std::cerr << lastError_ << std::endl;
        return false;
    }

    if (j.contains("categories")) {
        for (const auto &cat : j["categories"]) {
            categories_.insert(cat.get<std::string>());
        }
    }
    if (j.contains("tables")) {
        for (const auto &tbl : j["tables"]) {
            exportTables_.insert(tbl.get<std::string>());
        }
    }

    if (categories_.empty() && exportTables_.empty()) {
        lastError_ = "Both categories and tables are empty in config";
        std::cerr << lastError_ << std::endl;
        return false;
    }

    if (!ValidateCategories()) {
        return false;
    }

    ComputeExportFilter();
    ComputeAllowedPluginNames();
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
        bool need = false;
        if (GLOBAL_BASE_TABLES.count(baseTable)) {
            need = true;
        } else if (ALWAYS_BASE_TABLES.count(baseTable)) {
            need = true;
        } else {
            auto depIt = BASE_TABLE_DEPS.find(baseTable);
            if (depIt != BASE_TABLE_DEPS.end()) {
                for (const auto &dep : depIt->second) {
                    if (cats.count(dep)) {
                        need = true;
                        break;
                    }
                }
            }
        }
        if (need) {
            exportFilter_.insert(baseTable);
        }
    }

    if (!cats.empty()) {
        auto depIt = BASE_TABLE_DEPS.find("thread");
        if (depIt != BASE_TABLE_DEPS.end() && depIt->second.count("callstack")) {
            exportFilter_.insert("thread");
        }
    }
}

void ExportConfig::ComputeExportFilter()
{
    if (!categories_.empty()) {
        AddBaseTables(categories_);
    }

    for (const auto &cat : categories_) {
        auto it = CATEGORY_TABLES.find(cat);
        if (it != CATEGORY_TABLES.end()) {
            for (const auto &tbl : it->second) {
                exportFilter_.insert(tbl);
            }
        }
    }

    for (const auto &tbl : exportTables_) {
        exportFilter_.insert(tbl);
        if (tbl == "callstack") {
            exportFilter_.insert("args");
            exportFilter_.insert("data_dict");
            exportFilter_.insert("thread");
        }
    }

    if (!categories_.empty() || !exportTables_.empty()) {
        exportFilter_.insert("stat");
        exportFilter_.insert("datasource_clockid");
    }

    if (exportTables_.count("callstack") || categories_.count("ftrace")) {
        exportFilter_.insert("args");
        exportFilter_.insert("data_dict");
        exportFilter_.insert("thread");
    }
}

void ExportConfig::ComputeAllowedPluginNames()
{
    if (exportFilter_.empty()) {
        return;
    }

    for (const auto &[pluginName, pluginTables] : PLUGIN_TO_TABLES) {
        for (const auto &tbl : pluginTables) {
            if (exportFilter_.count(tbl)) {
                auto varIt = PLUGIN_NAME_VARIANTS.find(pluginName);
                if (varIt != PLUGIN_NAME_VARIANTS.end()) {
                    for (const auto &variant : varIt->second) {
                        allowedPluginNames_.insert(variant);
                    }
                } else {
                    allowedPluginNames_.insert(pluginName);
                }
                break;
            }
        }
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

    for (const auto &tbl : it->second) {
        if (exportFilter_.count(tbl)) {
            return true;
        }
    }
    return false;
}

} // namespace TraceStreamer
} // namespace SysTuning
