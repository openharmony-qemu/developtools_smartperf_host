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
#include "sqllite_prepar_cache_data.h"
#include "sph_data.pb.h"

namespace SysTuning {
namespace TraceStreamer {
enum class SphQueryType : uint32_t {
    CPU_DATA = 0,
    CPU_STATE_DATA = 1,
    CPU_FREQ_DATA = 2,
    CPU_FREQ_LIMIT_DATA = 3,
    CLOCK_DATA = 4,
    IRQ_DATA = 5,
    PROCESS_DATA = 6,
    PROCESS_MEM_DATA = 7,
    PROCESS_STARTUP_DATA = 8,
    PROCESS_SO_INIT_DATA = 9,
    HI_SYS_EVENT_DATA = 10,
    LOG_DATA = 11,
    VIRTUAL_MEM_DATA = 12,
    ENERGY_SYSTEM_DATA = 13,
    ENERGY_STATE_DATA = 14,
    ENERGY_ANOMAL_DATA = 15,
    FRAME_EXPECTED_DATA = 16,
    FRAME_ACTUAL_DATA = 17,
    FRAME_ANIMATION_DATA = 18,
    FRAME_DYNAMIC_DATA = 19,
    FRAME_SPACING_DATA = 20,
    PROCESS_EXPECTED_DATA = 26,
    PROCESS_ACTUAL_DATA = 27,
    PROCESS_DELIVER_INPUT_EVENT_DATA = 28,
    THREAD_DATA = 30,
    FUNC_DATA = 31,
    ENERGY_POWER_DATA = 47,
    FILE_SYSTEM_DATA = 48,
    DISK_IO_DATA = 49,
    FILE_SYS_VM = 50,
    VM_TRACKER_SMAPS_DATA = 81,
    VM_TRACKER_DMA_DATA = 82,
    VM_TRACKER_GPU_MEMORY_DATA = 83,
    VM_TRACKER_GPU_DATA = 84,
    VM_TRACKER_GPU_RESOURCE_DATA = 85,
    VM_TRACKER_GPU_TATAL_DATA = 86,
    VM_TRACKER_GPU_WINDOW_DATA = 87,
    VM_TRACKER_GPU_SHM_DATA = 88,
    VM_TRACKER_GPU_PURGEABLE_DATA = 89,
    ABILITY_MEMORY_USED_DATA = 90,
    CPU_ABILITY_USER_DATA = 91,
    CPU_ABILITY_SYSTEM_DATA = 92,
    CPU_ABILITY_MONITOR_DATA = 93,
    ABILITY_BYTES_READ_DATA = 94,
    ABILITY_BYTES_WRITTEN_DATA = 95,
    ABILITY_READ_OPS_DATA = 96,
    ABILITY_WRITTEN_OPS_DATA = 97,
    ABILITY_BYTES_IN_TRACE_DATA = 98,
    ABILITY_BUTES_OUT_TRACE_DATA = 99,
    ABILITY_PACKET_IN_TRACE_DATA = 100,
    ABILITY_PACKETS_OUT_TRACE_DATA = 101,
    ABILITY_PURGEABLE_DAT = 151,
    ABILITY_GPU_MEMMORY_DATA = 152,
    ABILITY_DMA_DATA = 153,
    HEAP_TIME_LINE_DATA = 160,
    HEAP_SNAPSHOT_DATA = 161,
    CPU_PROFILER_DATA = 162,
    HIPERF_CPU_DATA = 200,
    HIPERF_PROCESS_DATA = 201,
    HIPERF_THREAD_DATA = 202,
    HIPERF_CALL_CHART = 203,
    HIPERF_CALL_STACK = 204,
    NATIVE_MEMORY_CHART_CACHE_NORMAL = 206,
    NATIVE_MEMORY_CHART_CACHE_STATISTIC = 207,
};

static inline int32_t Sqlite3ColumnInt(sqlite3_stmt *stmt, uint8_t curCol)
{
    if (sqlite3_column_type(stmt, curCol) == SQLITE_NULL) {
        return -1;
    }
    return sqlite3_column_int(stmt, curCol);
}

static inline int64_t Sqlite3ColumnInt64(sqlite3_stmt *stmt, uint8_t curCol)
{
    if (sqlite3_column_type(stmt, curCol) == SQLITE_NULL) {
        return -1;
    }
    return sqlite3_column_int64(stmt, curCol);
}

static inline std::string Sqlite3ColumnText(sqlite3_stmt *stmt, uint8_t curCol)
{
    const char *textPtr = reinterpret_cast<const char *>(sqlite3_column_text(stmt, curCol));
    if (textPtr != nullptr) {
        return std::string(textPtr);
    }
    return "";
}

SqllitePreparCacheData::SqllitePreparCacheData()
{
    FillSphQueryFuncMapPartOne();
    FillSphQueryFuncMapPartTow();
    FillSphQueryFuncMapPartThree();
    FillSphQueryFuncMapPartFour();
    FillSphQueryFuncMapPartFive();
}

void SqllitePreparCacheData::FillSphQueryFuncMapPartOne()
{
    sphQueryFuncMap_ = {
        {static_cast<uint32_t>(SphQueryType::CPU_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendCpuDataProto, this, std::placeholders::_1, std::placeholders::_2,
                   std::placeholders::_3)},
        {static_cast<uint32_t>(SphQueryType::CPU_STATE_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendCpuStateDataProto, this, std::placeholders::_1,
                   std::placeholders::_2, std::placeholders::_3)},
        {static_cast<uint32_t>(SphQueryType::CPU_FREQ_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendCpuFreqDataProto, this, std::placeholders::_1,
                   std::placeholders::_2, std::placeholders::_3)},
        {static_cast<uint32_t>(SphQueryType::CPU_FREQ_LIMIT_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendCpuFreqLimitDataProto, this, std::placeholders::_1,
                   std::placeholders::_2, std::placeholders::_3)},
        {static_cast<uint32_t>(SphQueryType::CLOCK_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendClockDataDataProto, this, std::placeholders::_1,
                   std::placeholders::_2, std::placeholders::_3)},
        {static_cast<uint32_t>(SphQueryType::IRQ_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendIrqDataProto, this, std::placeholders::_1, std::placeholders::_2,
                   std::placeholders::_3)},
        {static_cast<uint32_t>(SphQueryType::PROCESS_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendProcessDataProto, this, std::placeholders::_1,
                   std::placeholders::_2, std::placeholders::_3)},
        {static_cast<uint32_t>(SphQueryType::PROCESS_MEM_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendProcessMemDataProto, this, std::placeholders::_1,
                   std::placeholders::_2, std::placeholders::_3)},
        {static_cast<uint32_t>(SphQueryType::PROCESS_STARTUP_DATA),
         std::bind(&SqllitePreparCacheData::FillAndSendProcessStartupDataProto, this, std::placeholders::_1,
                   std::placeholders::_2, std::placeholders::_3)},
    };
}

void SqllitePreparCacheData::FillSphQueryFuncMapPartTow()
{
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::PROCESS_SO_INIT_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendProcessSoInitDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HI_SYS_EVENT_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendHiSysEventDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::LOG_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendLogDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VIRTUAL_MEM_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendVirtualMemDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ENERGY_SYSTEM_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendEnergyDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ENERGY_STATE_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendEnergyDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ENERGY_ANOMAL_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendEnergyDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::FRAME_EXPECTED_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendFrameDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::FRAME_ACTUAL_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendFrameDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::FRAME_ANIMATION_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendFrameAnimationDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::FRAME_DYNAMIC_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendFrameDynamicDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::FRAME_SPACING_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendFrameSpacingDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::PROCESS_EXPECTED_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendProcessJanksFramesDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::PROCESS_ACTUAL_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendProcessJanksActualDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::PROCESS_DELIVER_INPUT_EVENT_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendProcessInputEventDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
}

void SqllitePreparCacheData::FillSphQueryFuncMapPartThree()
{
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::THREAD_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendProcessThreadDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::FUNC_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendProcessFuncDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ENERGY_POWER_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendEnergyDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::FILE_SYSTEM_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendEbpfDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::DISK_IO_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendEbpfDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::FILE_SYS_VM),
                             std::bind(&SqllitePreparCacheData::FillAndSendEbpfDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_SMAPS_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_DMA_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_GPU_MEMORY_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_GPU_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_GPU_RESOURCE_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_GPU_TATAL_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_GPU_WINDOW_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_GPU_SHM_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::VM_TRACKER_GPU_PURGEABLE_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
}

void SqllitePreparCacheData::FillSphQueryFuncMapPartFour()
{
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_MEMORY_USED_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::CPU_ABILITY_USER_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendCpuAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::CPU_ABILITY_SYSTEM_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendCpuAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::CPU_ABILITY_MONITOR_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendCpuAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_BYTES_READ_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_BYTES_WRITTEN_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_READ_OPS_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_WRITTEN_OPS_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_BYTES_IN_TRACE_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_BUTES_OUT_TRACE_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_PACKET_IN_TRACE_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_PACKETS_OUT_TRACE_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendAbilityDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_PURGEABLE_DAT),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_GPU_MEMMORY_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
}

void SqllitePreparCacheData::FillSphQueryFuncMapPartFive()
{
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::ABILITY_DMA_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendTrackerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HEAP_TIME_LINE_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendHeapFilesDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HEAP_SNAPSHOT_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendHeapFilesDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::CPU_PROFILER_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendCpuProfilerDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HIPERF_CPU_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendHiperfDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HIPERF_PROCESS_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendHiperfDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HIPERF_THREAD_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendHiperfDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HIPERF_THREAD_DATA),
                             std::bind(&SqllitePreparCacheData::FillAndSendHiperfDataProto, this, std::placeholders::_1,
                                       std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HIPERF_CALL_CHART),
                             std::bind(&SqllitePreparCacheData::FillAndSendHiperfCallChartDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::HIPERF_CALL_STACK),
                             std::bind(&SqllitePreparCacheData::FillAndSendHiperfCallStackDataProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::NATIVE_MEMORY_CHART_CACHE_NORMAL),
                             std::bind(&SqllitePreparCacheData::FillAndSendNativeMemoryNormalProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    sphQueryFuncMap_.emplace(static_cast<uint32_t>(SphQueryType::NATIVE_MEMORY_CHART_CACHE_STATISTIC),
                             std::bind(&SqllitePreparCacheData::FillAndSendNativeMemoryStatisticProto, this,
                                       std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
}

template <typename T>
static bool SendDBProto(uint32_t type,
                        const int32_t isFinish,
                        T &sphData,
                        SqllitePreparCacheData::TLVResultCallBack tLVResultCallBack)
{
    std::string bufferData;
    sphData.SerializeToString(&bufferData);
    tLVResultCallBack(bufferData.data(), bufferData.size(), type, isFinish);
    sphData.Clear();
    return true;
}

void SqllitePreparCacheData::FillAndSendCpuDataProto(sqlite3_stmt *stmt,
                                                     uint32_t type,
                                                     TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphCpuData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto cpuData = batchSphCpuData.add_values()->mutable_cpu_data();
        uint8_t curCol = 0;
        cpuData->set_process_id(Sqlite3ColumnInt(stmt, curCol++));
        cpuData->set_cpu(Sqlite3ColumnInt(stmt, curCol++));
        cpuData->set_tid(Sqlite3ColumnInt(stmt, curCol++));
        cpuData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        cpuData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        cpuData->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
    }

    SendDBProto(type, SEND_FINISH, batchSphCpuData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendCpuFreqDataProto(sqlite3_stmt *stmt,
                                                         uint32_t type,
                                                         TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphCpuFreqData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto cpuFreqFata = batchSphCpuFreqData.add_values()->mutable_cpu_freq_data();
        uint8_t curCol = 0;
        cpuFreqFata->set_cpu(Sqlite3ColumnInt(stmt, curCol++));
        cpuFreqFata->set_value(Sqlite3ColumnInt(stmt, curCol++));
        cpuFreqFata->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        cpuFreqFata->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphCpuFreqData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessDataProto(sqlite3_stmt *stmt,
                                                         uint32_t type,
                                                         TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphProcessData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processData = batchSphProcessData.add_values()->mutable_process_data();
        uint8_t curCol = 0;
        processData->set_cpu(Sqlite3ColumnInt(stmt, curCol++));
        processData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        processData->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphProcessData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendCpuFreqLimitDataProto(sqlite3_stmt *stmt,
                                                              uint32_t type,
                                                              TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphCpuFreqLimitData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto cpuFreqLimitData = batchSphCpuFreqLimitData.add_values()->mutable_cpu_freq_limit_data();
        uint8_t curCol = 0;
        cpuFreqLimitData->set_max(Sqlite3ColumnInt(stmt, curCol++));
        cpuFreqLimitData->set_min(Sqlite3ColumnInt(stmt, curCol++));
        cpuFreqLimitData->set_value(Sqlite3ColumnInt(stmt, curCol++));
        cpuFreqLimitData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        cpuFreqLimitData->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphCpuFreqLimitData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendCpuStateDataProto(sqlite3_stmt *stmt,
                                                          uint32_t type,
                                                          TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphCpuStateData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto cpuStateData = batchSphCpuStateData.add_values()->mutable_cpu_state_data();
        uint8_t curCol = 0;
        cpuStateData->set_value(Sqlite3ColumnInt(stmt, curCol++));
        cpuStateData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        cpuStateData->set_start_ts(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphCpuStateData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessMemDataProto(sqlite3_stmt *stmt,
                                                            uint32_t type,
                                                            TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphProcessMemData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processMemData = batchSphProcessMemData.add_values()->mutable_process_mem_data();
        uint8_t curCol = 0;
        processMemData->set_track_id(Sqlite3ColumnInt(stmt, curCol++));
        processMemData->set_value(Sqlite3ColumnInt64(stmt, curCol++));
        processMemData->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
        processMemData->set_ts(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphProcessMemData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessSoInitDataProto(sqlite3_stmt *stmt,
                                                               uint32_t type,
                                                               TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphProcessSoInitData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processSoInitData = batchSphProcessSoInitData.add_values()->mutable_process_soinit_data();
        uint8_t curCol = 0;
        processSoInitData->set_depth(Sqlite3ColumnInt(stmt, curCol++));
        processSoInitData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
        processSoInitData->set_tid(Sqlite3ColumnInt(stmt, curCol++));
        processSoInitData->set_itid(Sqlite3ColumnInt(stmt, curCol++));
        processSoInitData->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
        processSoInitData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        processSoInitData->set_id(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphProcessSoInitData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessStartupDataProto(sqlite3_stmt *stmt,
                                                                uint32_t type,
                                                                TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphProcessStartupData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processStartupDataData = batchSphProcessStartupData.add_values()->mutable_process_startup_data();
        uint8_t curCol = 0;
        processStartupDataData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
        processStartupDataData->set_tid(Sqlite3ColumnInt(stmt, curCol++));
        processStartupDataData->set_itid(Sqlite3ColumnInt(stmt, curCol++));
        processStartupDataData->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
        processStartupDataData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        processStartupDataData->set_start_name(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphProcessStartupData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendClockDataDataProto(sqlite3_stmt *stmt,
                                                           uint32_t type,
                                                           TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphClockDataData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto clockDataData = batchSphClockDataData.add_values()->mutable_clock_data();
        uint8_t curCol = 0;
        clockDataData->set_filter_id(Sqlite3ColumnInt(stmt, curCol++));
        clockDataData->set_value(Sqlite3ColumnInt(stmt, curCol++));
        clockDataData->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphClockDataData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendIrqDataProto(sqlite3_stmt *stmt,
                                                     uint32_t type,
                                                     TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchSphIrqData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto IrqData = batchSphIrqData.add_values()->mutable_irq_data();
        uint8_t curCol = 0;
        IrqData->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
        IrqData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        IrqData->set_depth(Sqlite3ColumnInt(stmt, curCol++));
        IrqData->set_arg_set_id(Sqlite3ColumnInt(stmt, curCol++));
        IrqData->set_id(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchSphIrqData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendHiSysEventDataProto(sqlite3_stmt *stmt,
                                                            uint32_t type,
                                                            TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchHiSysEventData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto HiSysEventData = batchHiSysEventData.add_values()->mutable_hi_sys_event_data();
        uint8_t curCol = 0;
        HiSysEventData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        HiSysEventData->set_ts(Sqlite3ColumnInt64(stmt, curCol++));
        HiSysEventData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
        HiSysEventData->set_tid(Sqlite3ColumnInt(stmt, curCol++));
        HiSysEventData->set_uid(Sqlite3ColumnInt(stmt, curCol++));
        HiSysEventData->set_seq(Sqlite3ColumnText(stmt, curCol++));
        HiSysEventData->set_depth(Sqlite3ColumnInt(stmt, curCol++));
        HiSysEventData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchHiSysEventData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendLogDataProto(sqlite3_stmt *stmt,
                                                     uint32_t type,
                                                     TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchLogData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto logData = batchLogData.add_values()->mutable_log_data();
        uint8_t curCol = 0;
        logData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        logData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
        logData->set_tid(Sqlite3ColumnInt(stmt, curCol++));
        logData->set_start_ts(Sqlite3ColumnInt64(stmt, curCol++));
        logData->set_depth(Sqlite3ColumnInt(stmt, curCol++));
        logData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchLogData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendVirtualMemDataProto(sqlite3_stmt *stmt,
                                                            uint32_t type,
                                                            TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchVirtualMemData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto virtualMemData = batchVirtualMemData.add_values()->mutable_virtual_mem_data();
        uint8_t curCol = 0;
        virtualMemData->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
        virtualMemData->set_filter_id(Sqlite3ColumnInt(stmt, curCol++));
        virtualMemData->set_value(Sqlite3ColumnInt64(stmt, curCol++));
        virtualMemData->set_duration(Sqlite3ColumnInt(stmt, curCol++));
        virtualMemData->set_max_value(Sqlite3ColumnInt64(stmt, curCol++));
        virtualMemData->set_delta(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchVirtualMemData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendFrameDataProto(sqlite3_stmt *stmt,
                                                       uint32_t type,
                                                       TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchFrameData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto frameData = batchFrameData.add_values()->mutable_frame_data();
        uint8_t curCol = 0;
        frameData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        frameData->set_frame_type(Sqlite3ColumnText(stmt, curCol++));
        frameData->set_ipid(Sqlite3ColumnInt(stmt, curCol++));
        frameData->set_name(Sqlite3ColumnInt(stmt, curCol++));
        frameData->set_app_dur(Sqlite3ColumnInt64(stmt, curCol++));
        frameData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        frameData->set_ts(Sqlite3ColumnInt64(stmt, curCol++));
        frameData->set_type(Sqlite3ColumnText(stmt, curCol++));
        frameData->set_jank_tag(Sqlite3ColumnInt(stmt, curCol++));
        frameData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
        frameData->set_cmdline(Sqlite3ColumnText(stmt, curCol++));
        frameData->set_rs_ts(Sqlite3ColumnInt64(stmt, curCol++));
        frameData->set_rs_vsync(Sqlite3ColumnInt(stmt, curCol++));
        frameData->set_rs_dur(Sqlite3ColumnInt64(stmt, curCol++));
        frameData->set_rs_ipid(Sqlite3ColumnInt(stmt, curCol++));
        frameData->set_rs_pid(Sqlite3ColumnInt(stmt, curCol++));
        frameData->set_rs_name(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchFrameData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendFrameAnimationDataProto(sqlite3_stmt *stmt,
                                                                uint32_t type,
                                                                TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchFrameAnimationData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto frameAnimationData = batchFrameAnimationData.add_values()->mutable_frame_animation_data();
        uint8_t curCol = 0;
        frameAnimationData->set_animation_id(Sqlite3ColumnInt(stmt, curCol++));
        frameAnimationData->set_status(Sqlite3ColumnInt(stmt, curCol++));
        frameAnimationData->set_start_ts(Sqlite3ColumnInt64(stmt, curCol++));
        frameAnimationData->set_end_ts(Sqlite3ColumnInt64(stmt, curCol++));
        frameAnimationData->set_name(Sqlite3ColumnText(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchFrameAnimationData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendFrameDynamicDataProto(sqlite3_stmt *stmt,
                                                              uint32_t type,
                                                              TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchFrameDynamicData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto frameDynamicData = batchFrameDynamicData.add_values()->mutable_frame_dynamic_data();
        uint8_t curCol = 0;
        frameDynamicData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        frameDynamicData->set_x(Sqlite3ColumnText(stmt, curCol++));
        frameDynamicData->set_y(Sqlite3ColumnText(stmt, curCol++));
        frameDynamicData->set_width(Sqlite3ColumnText(stmt, curCol++));
        frameDynamicData->set_height(Sqlite3ColumnText(stmt, curCol++));
        frameDynamicData->set_alpha(Sqlite3ColumnText(stmt, curCol++));
        frameDynamicData->set_ts(Sqlite3ColumnInt64(stmt, curCol++));
        frameDynamicData->set_app_name(Sqlite3ColumnText(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchFrameDynamicData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendFrameSpacingDataProto(sqlite3_stmt *stmt,
                                                              uint32_t type,
                                                              TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchFrameSpacingData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto frameSpacingData = batchFrameSpacingData.add_values()->mutable_frame_spacing_data();
        uint8_t curCol = 0;
        frameSpacingData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        frameSpacingData->set_x(Sqlite3ColumnText(stmt, curCol++));
        frameSpacingData->set_y(Sqlite3ColumnText(stmt, curCol++));
        frameSpacingData->set_current_frame_width(Sqlite3ColumnText(stmt, curCol++));
        frameSpacingData->set_current_frame_height(Sqlite3ColumnText(stmt, curCol++));
        frameSpacingData->set_current_ts(Sqlite3ColumnInt64(stmt, curCol++));
        frameSpacingData->set_name_id(Sqlite3ColumnText(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchFrameSpacingData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendTrackerDataProto(sqlite3_stmt *stmt,
                                                         uint32_t type,
                                                         TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchTrackerData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto trackerData = batchTrackerData.add_values()->mutable_tracker_data();
        uint8_t curCol = 0;
        trackerData->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
        trackerData->set_value(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchTrackerData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendAbilityDataProto(sqlite3_stmt *stmt,
                                                         uint32_t type,
                                                         TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchAbilityData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto abilityData = batchAbilityData.add_values()->mutable_ability_data();
        uint8_t curCol = 0;
        abilityData->set_value(Sqlite3ColumnInt64(stmt, curCol++));
        abilityData->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
        abilityData->set_dur(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchAbilityData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendEnergyDataProto(sqlite3_stmt *stmt,
                                                        uint32_t type,
                                                        TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchEnergyData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto energyData = batchEnergyData.add_values()->mutable_energy_data();
        uint8_t curCol = 0;
        energyData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        energyData->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
        energyData->set_event_name(Sqlite3ColumnText(stmt, curCol++));
        energyData->set_app_key(Sqlite3ColumnText(stmt, curCol++));
        energyData->set_event_value(Sqlite3ColumnText(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchEnergyData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendEbpfDataProto(sqlite3_stmt *stmt,
                                                      uint32_t type,
                                                      TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchEbpfData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto ebpfData = batchEbpfData.add_values()->mutable_ebpf_data();
        uint8_t curCol = 0;
        ebpfData->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
        ebpfData->set_end_ns(Sqlite3ColumnInt64(stmt, curCol++));
        ebpfData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        ebpfData->set_size(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchEbpfData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessThreadDataProto(sqlite3_stmt *stmt,
                                                               uint32_t type,
                                                               TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchProcessThreadData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processThreadData = batchProcessThreadData.add_values()->mutable_process_thread_data();
        uint8_t curCol = 0;
        processThreadData->set_cpu(Sqlite3ColumnInt(stmt, curCol++));
        processThreadData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        processThreadData->set_id(Sqlite3ColumnInt64(stmt, curCol++));
        processThreadData->set_tid(Sqlite3ColumnInt64(stmt, curCol++));
        processThreadData->set_state(Sqlite3ColumnText(stmt, curCol++));
        processThreadData->set_pid(Sqlite3ColumnInt64(stmt, curCol++));
        processThreadData->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
        processThreadData->set_arg_set_id(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchProcessThreadData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessFuncDataProto(sqlite3_stmt *stmt,
                                                             uint32_t type,
                                                             TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchProcessFuncData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processFuncData = batchProcessFuncData.add_values()->mutable_process_func_data();
        uint8_t curCol = 0;
        processFuncData->set_start_ts(Sqlite3ColumnInt64(stmt, curCol++));
        processFuncData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        processFuncData->set_argsetid(Sqlite3ColumnInt64(stmt, curCol++));
        processFuncData->set_depth(Sqlite3ColumnInt(stmt, curCol++));
        processFuncData->set_id(Sqlite3ColumnInt64(stmt, curCol++));
        processFuncData->set_itid(Sqlite3ColumnInt(stmt, curCol++));
        processFuncData->set_ipid(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchProcessFuncData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendHiperfDataProto(sqlite3_stmt *stmt,
                                                        uint32_t type,
                                                        TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchHiperfData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto hiperfData = batchHiperfData.add_values()->mutable_hiperf_data();
        uint8_t curCol = 0;
        hiperfData->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfData->set_event_count(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfData->set_sample_count(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfData->set_event_type_id(Sqlite3ColumnInt(stmt, curCol++));
        hiperfData->set_callchain_id(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchHiperfData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendHiperfCallChartDataProto(sqlite3_stmt *stmt,
                                                                 uint32_t type,
                                                                 TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchHiperfCallChartData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto hiperfCallChartData = batchHiperfCallChartData.add_values()->mutable_hiperf_call_chart_data();
        uint8_t curCol = 0;
        hiperfCallChartData->set_callchain_id(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallChartData->set_start_ts(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallChartData->set_event_count(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallChartData->set_thread_id(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallChartData->set_cpu_id(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallChartData->set_event_type_id(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchHiperfCallChartData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendHiperfCallStackDataProto(sqlite3_stmt *stmt,
                                                                 uint32_t type,
                                                                 TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchHiperfCallStackData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto hiperfCallStackData = batchHiperfCallStackData.add_values()->mutable_hiperf_call_stack_data();
        uint8_t curCol = 0;
        hiperfCallStackData->set_callchain_id(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallStackData->set_file_id(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallStackData->set_depth(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallStackData->set_symbol_id(Sqlite3ColumnInt64(stmt, curCol++));
        hiperfCallStackData->set_name(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchHiperfCallStackData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessJanksFramesDataProto(sqlite3_stmt *stmt,
                                                                    uint32_t type,
                                                                    TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchProcessJanksFramesData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processJanksFramesData = batchProcessJanksFramesData.add_values()->mutable_process_janks_frames_data();
        uint8_t curCol = 0;
        processJanksFramesData->set_ts(Sqlite3ColumnInt64(stmt, curCol++));
        processJanksFramesData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        processJanksFramesData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
        processJanksFramesData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        processJanksFramesData->set_name(Sqlite3ColumnInt(stmt, curCol++));
        processJanksFramesData->set_type(Sqlite3ColumnInt(stmt, curCol++));
        processJanksFramesData->set_depth(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchProcessJanksFramesData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessJanksActualDataProto(sqlite3_stmt *stmt,
                                                                    uint32_t type,
                                                                    TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchProcessJanksActualData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processJanksActualData = batchProcessJanksActualData.add_values()->mutable_process_janks_actual_data();
        uint8_t curCol = 0;
        processJanksActualData->set_ts(Sqlite3ColumnInt64(stmt, curCol++));
        processJanksActualData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        processJanksActualData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
        processJanksActualData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        processJanksActualData->set_name(Sqlite3ColumnInt(stmt, curCol++));
        processJanksActualData->set_type(Sqlite3ColumnInt(stmt, curCol++));
        processJanksActualData->set_jank_tag(Sqlite3ColumnInt(stmt, curCol++));
        processJanksActualData->set_dst_slice(Sqlite3ColumnInt(stmt, curCol++));
        processJanksActualData->set_depth(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchProcessJanksActualData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendProcessInputEventDataProto(sqlite3_stmt *stmt,
                                                                   uint32_t type,
                                                                   TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchProcessInputEventData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto processInputEventData = batchProcessInputEventData.add_values()->mutable_process_input_event_data();
        uint8_t curCol = 0;
        processInputEventData->set_start_ts(Sqlite3ColumnInt64(stmt, curCol++));
        processInputEventData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        processInputEventData->set_argsetid(Sqlite3ColumnInt64(stmt, curCol++));
        processInputEventData->set_tid(Sqlite3ColumnInt(stmt, curCol++));
        processInputEventData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
        processInputEventData->set_is_main_thread(Sqlite3ColumnInt(stmt, curCol++));
        processInputEventData->set_track_id(Sqlite3ColumnInt(stmt, curCol++));
        processInputEventData->set_parent_id(Sqlite3ColumnInt(stmt, curCol++));
        processInputEventData->set_id(Sqlite3ColumnInt(stmt, curCol++));
        processInputEventData->set_cookie(Sqlite3ColumnInt(stmt, curCol++));
        processInputEventData->set_depth(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchProcessInputEventData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendHeapFilesDataProto(sqlite3_stmt *stmt,
                                                           uint32_t type,
                                                           TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchHeapFilesData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto heapFilesData = batchHeapFilesData.add_values()->mutable_heap_files_data();
        uint8_t curCol = 0;
        heapFilesData->set_id(Sqlite3ColumnInt64(stmt, curCol++));
        heapFilesData->set_name(Sqlite3ColumnText(stmt, curCol++));
        heapFilesData->set_start_ts(Sqlite3ColumnInt64(stmt, curCol++));
        heapFilesData->set_end_ts(Sqlite3ColumnInt64(stmt, curCol++));
        heapFilesData->set_size(Sqlite3ColumnInt64(stmt, curCol++));
        heapFilesData->set_pid(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchHeapFilesData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendCpuProfilerDataProto(sqlite3_stmt *stmt,
                                                             uint32_t type,
                                                             TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchCpuProfilerData;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto cpuProfilerData = batchCpuProfilerData.add_values()->mutable_cpu_profiler_data();
        uint8_t curCol = 0;
        cpuProfilerData->set_id(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_function_id(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_end_time(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_dur(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_name_id(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_url_id(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_line(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_column(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_hit_count(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_children_string(Sqlite3ColumnInt64(stmt, curCol++));
        cpuProfilerData->set_parent_id(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchCpuProfilerData, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendNativeMemoryNormalProto(sqlite3_stmt *stmt,
                                                                uint32_t type,
                                                                TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchNativeMemoryNormal;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto nativeMemoryNormal = batchNativeMemoryNormal.add_values()->mutable_native_memory_normal();
        uint8_t curCol = 0;
        nativeMemoryNormal->set_start_time(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryNormal->set_heap_size(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryNormal->set_event_type(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryNormal->set_ipid(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchNativeMemoryNormal, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendNativeMemoryStatisticProto(sqlite3_stmt *stmt,
                                                                   uint32_t type,
                                                                   TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchNativeMemoryStatistic;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto nativeMemoryStatistic = batchNativeMemoryStatistic.add_values()->mutable_native_memory_statistic();
        uint8_t curCol = 0;
        nativeMemoryStatistic->set_callchain_id(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryStatistic->set_start_ts(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryStatistic->set_apply_count(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryStatistic->set_apply_size(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryStatistic->set_release_count(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryStatistic->set_release_size(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryStatistic->set_ipid(Sqlite3ColumnInt64(stmt, curCol++));
        nativeMemoryStatistic->set_type(Sqlite3ColumnInt64(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchNativeMemoryStatistic, tLVResultCallBack);
}

void SqllitePreparCacheData::FillAndSendCpuAbilityDataProto(sqlite3_stmt *stmt,
                                                            uint32_t type,
                                                            TLVResultCallBack tLVResultCallBack)
{
    BatchSphData batchCpuAbility;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        auto cpuAbility = batchCpuAbility.add_values()->mutable_cpu_ability_data();
        uint8_t curCol = 0;
        cpuAbility->set_value(Sqlite3ColumnText(stmt, curCol++));
        cpuAbility->set_start_ns(Sqlite3ColumnInt64(stmt, curCol++));
        cpuAbility->set_dur(Sqlite3ColumnInt(stmt, curCol++));
    }
    SendDBProto(type, SEND_FINISH, batchCpuAbility, tLVResultCallBack);
}
} // namespace TraceStreamer
} // namespace SysTuning
