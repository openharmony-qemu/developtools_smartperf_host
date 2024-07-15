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

#ifndef BASE_STDTYPE_H
#define BASE_STDTYPE_H

#include <deque>
#include "ts_common.h"

namespace SysTuning {
namespace TraceStdtype {
constexpr uint32_t ONE_MILLION_NANOSECONDS = 1000000;
constexpr uint32_t BILLION_NANOSECONDS = 1000000000;
constexpr uint8_t DYNAMICFRAME_MATCH_LAST = 6;
class CacheBase {
public:
    size_t Size() const;
    const std::deque<uint64_t> &IdsData() const;
    const std::deque<uint64_t> &TimeStampData() const;
    const std::deque<InternalTid> &InternalTidsData() const;
    virtual void Clear()
    {
        internalTids_.clear();
        timeStamps_.clear();
        ids_.clear();
        id_ = 0;
    }

public:
    std::deque<InternalTid> internalTids_ = {};
    std::deque<uint64_t> timeStamps_ = {};
    std::deque<uint64_t> ids_ = {};
    uint64_t id_ = 0;
};

class CpuCacheBase {
public:
    const std::deque<uint64_t> &DursData() const;
    const std::deque<uint32_t> &CpusData() const;
    virtual void Clear()
    {
        durs_.clear();
        cpus_.clear();
    }
    void SetDur(uint64_t index, uint64_t dur);

public:
    std::deque<uint64_t> durs_;
    std::deque<uint32_t> cpus_;
};

class BatchCacheBase {
public:
    virtual void UpdateReadySize(size_t size)
    {
        readySize_ = size;
    }
    virtual void ClearExportedData() = 0;
    template <typename T, typename... changedata>
    void EraseElements(T &deq, changedata &...args)
    {
        deq.erase(deq.begin(), deq.begin() + readySize_);
        EraseElements(args...);
        diskTableSize_ += readySize_;
        readySize_ = 0;
    }
    template <typename T1>
    void EraseElements(T1 &deq)
    {
        deq.erase(deq.begin(), deq.begin() + readySize_);
    }

public:
    size_t readySize_ = 0;
    size_t diskTableSize_ = 0;
};
} // namespace TraceStdtype
} // namespace SysTuning

#endif // BASE_STDTYPE_H
