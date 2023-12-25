/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef SQLLITE_PREPAR_CACHE_DATA_H
#define SQLLITE_PREPAR_CACHE_DATA_H

#include <functional>
#include <map>
#include "sqlite3.h"

namespace SysTuning {
namespace TraceStreamer {
const int32_t SEND_CONTINUE = 0;
const int32_t SEND_FINISH = 1;
class SqllitePreparCacheData {

public:
    using ResultCallBack = std::function<void(const std::string& /* json or proto result */, int32_t)>;
    using SphQueryCallBack = std::function<void(sqlite3_stmt*, uint32_t, ResultCallBack)>;

public:
    SqllitePreparCacheData();
    SqllitePreparCacheData(const SqllitePreparCacheData&) = delete;
    SqllitePreparCacheData& operator=(const SqllitePreparCacheData&) = delete;
    std::map<uint32_t /*type*/, SphQueryCallBack> sphQueryFuncMap_;

private:
    void FillAndSendCpuDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendCpuFreqDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendCpuFreqLimitDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendCpuStateDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessMemDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessSoInitDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessStartupDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendClockDataDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendIrqDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendHiSysEventDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendLogDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendVirtualMemDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendFrameDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendFrameAnimationDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendFrameDynamicDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendTrackerDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendAbilityDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendFrameSpacingDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendEnergyDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendEbpfDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessThreadDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessFuncDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendHiperfDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendHiperfCallChartDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendHiperfCallStackDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessJanksFramesDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessJanksActualDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendProcessInputEventDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendHeapFilesDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendCpuProfilerDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendNativeMemoryNormalProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendNativeMemoryStatisticProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
    void FillAndSendCpuAbilityDataProto(sqlite3_stmt* stmt, uint32_t type, ResultCallBack resultCallBack);
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif
