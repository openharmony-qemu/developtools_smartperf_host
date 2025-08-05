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

#ifndef CALLSTACK_STDTYPE_H
#define CALLSTACK_STDTYPE_H
#include <cstdint>
#include <deque>
#include <optional>
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
struct CallStackInternalRow {
    uint64_t startT = INVALID_UINT64;
    uint64_t durationNs = INVALID_UINT64;
    InternalTid internalTid = INVALID_UINT32;
    DataIndex cat = INVALID_UINT64;
    DataIndex name = INVALID_UINT64;
    uint8_t depth = INVALID_UINT8;
    uint32_t childCallid = INVALID_UINT32;
};
class CallStack : public CacheBase, public CpuCacheBase, public BatchCacheBase {
public:
    size_t AppendInternalAsyncSlice(const CallStackInternalRow &callStackInternalRow,
                                    int64_t cookid,
                                    const std::optional<uint64_t> &parentId);
    size_t AppendInternalSlice(const CallStackInternalRow &callStackInternalRow,
                               const std::optional<uint64_t> &parentId);
    void SetDistributeInfo(size_t index,
                           const std::string &chainId,
                           const std::string &spanId,
                           const std::string &parentSpanId,
                           const std::string &flag);
    void AppendDistributeInfo();
    void AppendTraceMetadata();
    void SetDuration(size_t index, uint64_t timeStamp);
    void SetTraceMetadata(size_t index,
                          const std::string &traceLevel,
                          const DataIndex &tag,
                          const DataIndex &customArg,
                          const DataIndex &customCategory = INVALID_UINT64);
    void SetDurationWithFlag(size_t index, uint64_t timeStamp);
    void SetFlag(size_t index, uint8_t flag);
    void SetDurationEx(size_t index, uint32_t dur);
    void SetIrqDurAndArg(size_t index, uint64_t timeStamp, uint32_t argSetId);
    void SetTimeStamp(size_t index, uint64_t timeStamp);
    void SetDepth(size_t index, uint8_t depth);
    void SetArgSetId(size_t index, uint32_t argSetId);
    void SetColorIndex(size_t index, uint32_t colorIndex);
    void Clear() override
    {
        CacheBase::Clear();
        CpuCacheBase::Clear();
        cats_.clear();
        cookies_.clear();
        callIds_.clear();
        colorIndexs_.clear();
        names_.clear();
        depths_.clear();
        chainIds_.clear();
        spanIds_.clear();
        parentSpanIds_.clear();
        flags_.clear();
        argSet_.clear();
        traceLevels_.clear();
        traceTags_.clear();
        customCategorys_.clear();
        customArgs_.clear();
        childCallid_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(timeStamps_, ids_, durs_, cats_, cookies_, colorIndexs_, callIds_, names_, depths_, chainIds_,
                      spanIds_, parentSpanIds_, flags_, argSet_, traceLevels_, traceTags_, customCategorys_,
                      customArgs_, childCallid_);
    }
    const std::deque<std::optional<uint64_t>> &ParentIdData() const;
    const std::deque<DataIndex> &CatsData() const;
    const std::deque<DataIndex> &NamesData() const;
    const std::deque<uint8_t> &Depths() const;
    const std::deque<int64_t> &Cookies() const;
    const std::deque<uint32_t> &CallIds() const;
    const std::deque<uint32_t> &ColorIndexs() const;
    const std::deque<std::string> &ChainIds() const;
    const std::deque<std::string> &SpanIds() const;
    const std::deque<std::string> &ParentSpanIds() const;
    const std::deque<std::string> &Flags() const;
    const std::deque<uint32_t> &ArgSetIdsData() const;
    const std::deque<std::string> &TraceLevelsData() const;
    const std::deque<DataIndex> &TraceTagsData() const;
    const std::deque<DataIndex> &CustomCategorysData() const;
    const std::deque<DataIndex> &CustomArgsData() const;
    const std::deque<std::optional<uint64_t>> &ChildCallidData() const;

private:
    void AppendCommonInfo(uint64_t startT, uint64_t durationNs, InternalTid internalTid);
    void AppendCallStack(DataIndex cat,
                         DataIndex name,
                         uint8_t depth,
                         std::optional<uint64_t> childCallid,
                         std::optional<uint64_t> parentId);

private:
    std::deque<std::optional<uint64_t>> parentIds_;
    std::deque<DataIndex> cats_ = {};
    std::deque<int64_t> cookies_ = {};
    std::deque<uint32_t> callIds_ = {};
    std::deque<DataIndex> names_ = {};
    std::deque<uint8_t> depths_ = {};
    std::deque<uint32_t> colorIndexs_ = {};
    std::deque<std::string> chainIds_ = {};
    std::deque<std::string> spanIds_ = {};
    std::deque<std::string> parentSpanIds_ = {};
    std::deque<std::string> flags_ = {};
    std::deque<uint32_t> argSet_ = {};
    std::deque<std::string> traceLevels_ = {};
    std::deque<DataIndex> traceTags_ = {};
    std::deque<DataIndex> customCategorys_ = {};
    std::deque<DataIndex> customArgs_ = {};
    std::deque<std::optional<uint64_t>> childCallid_;
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // CALLSTACK_STDTYPE_H
