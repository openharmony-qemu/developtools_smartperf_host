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
constexpr int32_t SEND_CONTINUE = 0;
constexpr int32_t SEND_FINISH = 1;
class SqllitePreparCacheData {
public:
    using TLVResultCallBack = std::function<void(const char* data, uint32_t len, uint32_t type, int32_t finish)>;
    using SphQueryCallBack = std::function<void(sqlite3_stmt*, uint32_t, TLVResultCallBack)>;

public:
    SqllitePreparCacheData();
    SqllitePreparCacheData(const SqllitePreparCacheData&) = delete;
    SqllitePreparCacheData& operator=(const SqllitePreparCacheData&) = delete;
    std::map<uint32_t /* type */, SphQueryCallBack> sphQueryFuncMap_;
    static const uint8_t TYPE_SIZE = sizeof(uint32_t);

private:
    void FillAndSendCpuDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendCpuFreqDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendCpuFreqLimitDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendCpuStateDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessMemDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessSoInitDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessStartupDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendClockDataDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendIrqDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendHiSysEventDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendLogDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendVirtualMemDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendFrameDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendFrameAnimationDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendFrameDynamicDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendTrackerDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendAbilityDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendFrameSpacingDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendEnergyDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendEbpfDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessThreadDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessFuncDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendHiperfDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendHiperfCallChartDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendHiperfCallStackDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessJanksFramesDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessJanksActualDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendProcessInputEventDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendHeapFilesDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendCpuProfilerDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendNativeMemoryNormalProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendNativeMemoryStatisticProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillAndSendCpuAbilityDataProto(sqlite3_stmt* stmt, uint32_t type, TLVResultCallBack TLVResultCallBack);
    void FillSphQueryFuncMapPartOne();
    void FillSphQueryFuncMapPartTow();
    void FillSphQueryFuncMapPartThree();
    void FillSphQueryFuncMapPartFour();
    void FillSphQueryFuncMapPartFive();
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif
