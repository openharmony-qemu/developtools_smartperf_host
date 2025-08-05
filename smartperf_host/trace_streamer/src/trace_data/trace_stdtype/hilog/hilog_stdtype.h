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

#ifndef HILOG_STDTYPE_H
#define HILOG_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
struct LogInfoRow {
    uint64_t seq = INVALID_UINT64;
    uint64_t timeStamp = INVALID_UINT64;
    uint32_t pid = INVALID_UINT32;
    uint32_t tid = INVALID_UINT32;
    DataIndex level = INVALID_UINT64;
    DataIndex tag = INVALID_UINT64;
    DataIndex context = INVALID_UINT64;
    uint64_t originTs = INVALID_UINT64;
};
class LogInfo : public CacheBase {
public:
    size_t AppendNewLogInfo(const LogInfoRow &logInfoRow);
    const std::deque<uint64_t> &HilogLineSeqs() const;
    const std::deque<uint32_t> &Pids() const;
    const std::deque<uint32_t> &Tids() const;
    const std::deque<DataIndex> &Levels() const;
    const std::deque<DataIndex> &Tags() const;
    const std::deque<DataIndex> &Contexts() const;
    const std::deque<uint64_t> &OriginTimeStamData() const;
    void Clear() override
    {
        CacheBase::Clear();
        hilogLineSeqs_.clear();
        pids_.clear();
        levels_.clear();
        tags_.clear();
        contexts_.clear();
        originTs_.clear();
    }

private:
    std::deque<uint64_t> hilogLineSeqs_ = {};
    std::deque<uint32_t> pids_ = {};
    std::deque<uint32_t> tids_ = {};
    std::deque<DataIndex> levels_ = {};
    std::deque<DataIndex> tags_ = {};
    std::deque<DataIndex> contexts_ = {};
    std::deque<uint64_t> originTs_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // HILOG_STDTYPE_H
