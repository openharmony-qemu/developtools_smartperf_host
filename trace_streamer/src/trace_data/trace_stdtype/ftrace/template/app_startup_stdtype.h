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

#ifndef APP_STARTUP_STDTYPE_H
#define APP_STARTUP_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class AppStartup : public CacheBase {
public:
    size_t AppendNewData(uint32_t ipid,
                         uint32_t tid,
                         uint32_t callId,
                         uint64_t startTime,
                         uint64_t endTime,
                         uint32_t startName,
                         DataIndex packedName);
    const std::deque<uint32_t>& Pids() const;
    const std::deque<uint32_t>& Tids() const;
    const std::deque<uint32_t>& CallIds() const;
    const std::deque<uint64_t>& StartTimes() const;
    const std::deque<uint64_t>& EndTimes() const;
    const std::deque<uint32_t>& StartNames() const;
    const std::deque<DataIndex>& PackedNames() const;

    void Clear() override
    {
        CacheBase::Clear();
        ipids_.clear();
        tids_.clear();
        callIds_.clear();
        startTimes_.clear();
        endTimes_.clear();
        startNames_.clear();
        packedNames_.clear();
    }

private:
    std::deque<uint32_t> ipids_ = {};
    std::deque<uint32_t> tids_ = {};
    std::deque<uint32_t> callIds_ = {};
    std::deque<uint64_t> startTimes_ = {};
    std::deque<uint64_t> endTimes_ = {};
    std::deque<uint32_t> startNames_ = {};
    std::deque<DataIndex> packedNames_ = {};
};

class SoStaticInitalization : public CacheBase {
public:
    size_t AppendNewData(uint32_t ipid,
                         uint32_t tid,
                         uint32_t callId,
                         uint64_t startTime,
                         uint64_t endTime,
                         DataIndex soName,
                         uint32_t depth);
    const std::deque<uint32_t>& Pids() const;
    const std::deque<uint32_t>& Tids() const;
    const std::deque<uint32_t>& CallIds() const;
    const std::deque<uint64_t>& StartTimes() const;
    const std::deque<uint64_t>& EndTimes() const;
    const std::deque<DataIndex>& SoNames() const;
    const std::deque<uint32_t> Depths() const;

    void Clear() override
    {
        CacheBase::Clear();
        ipids_.clear();
        tids_.clear();
        callIds_.clear();
        startTimes_.clear();
        endTimes_.clear();
        soNames_.clear();
        depths_.clear();
    }

private:
    std::deque<uint32_t> ipids_ = {};
    std::deque<uint32_t> tids_ = {};
    std::deque<uint32_t> callIds_ = {};
    std::deque<uint64_t> startTimes_ = {};
    std::deque<uint64_t> endTimes_ = {};
    std::deque<DataIndex> soNames_ = {};
    std::deque<uint32_t> depths_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // APP_STARTUP_STDTYPE_H
