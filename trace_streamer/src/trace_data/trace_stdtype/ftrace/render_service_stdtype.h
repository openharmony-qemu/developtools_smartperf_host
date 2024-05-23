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

#ifndef RENDER_SERVICE_STDTYPE_H
#define RENDER_SERVICE_STDTYPE_H
#include <memory>
#include <vector>
#include "base_stdtype.h"
#include "double_map.h"

namespace SysTuning {
namespace TraceStdtype {
using namespace SysTuning::TraceStreamer;
struct FrameSliceRow {
    uint64_t ts = INVALID_UINT64;
    uint32_t ipid = INVALID_UINT32;
    uint32_t itid = INVALID_UINT32;
    uint32_t vsyncId = INVALID_UINT32;
    uint64_t callStackSliceId = INVALID_UINT64;
    uint64_t end = INVALID_UINT64;
    uint8_t type = INVALID_UINT8;
};
class FrameSlice : public CacheBase, public BatchCacheBase {
public:
    size_t AppendFrame(uint64_t ts, uint32_t ipid, uint32_t itid, uint32_t vsyncId, uint64_t callStackSliceId);
    size_t AppendFrame(const FrameSliceRow &frameSliceRow);
    void SetEndTime(uint64_t row, uint64_t end);
    void SetType(uint64_t row, uint8_t type);
    void SetDst(uint64_t row, uint64_t dst);
    void SetSrcs(uint64_t row, const std::vector<uint64_t> &fromSlices);
    void SetFlags(uint64_t row, const uint32_t flags);
    void UpdateDepth();
    const std::deque<uint32_t> Ipids() const;
    const std::deque<uint32_t> VsyncIds() const;
    const std::deque<uint64_t> CallStackIds() const;
    const std::deque<uint64_t> EndTss() const;
    const std::deque<uint64_t> Dsts() const;
    const std::deque<uint64_t> Durs() const;
    const std::deque<uint8_t> Types() const;
    const std::deque<uint8_t> Flags() const;
    const std::deque<uint8_t> Depths() const;
    const std::deque<uint32_t> FrameNos() const;
    const std::deque<std::string> &Srcs() const;
    void UpdateCallStackSliceId(uint64_t row, uint64_t callStackSliceId);
    void SetEndTimeAndFlag(uint64_t row, uint64_t ts, uint64_t expectDur, uint64_t expectEnd);
    void Erase(uint64_t row);
    static uint32_t GetAbnormalStartEndTimeState()
    {
        return abnormalStartEndTimeState_;
    }
    void ClearExportedData() override
    {
        EraseElements(internalTids_, timeStamps_, ids_, ipids_, dsts_, srcs_, vsyncIds_, callStackIds_, endTss_, durs_,
                      types_, flags_, depths_, frameNos_);
    }

public:
    typedef enum FrameSliceType { ACTURAL_SLICE, EXPECT_SLICE } FrameSliceType;

private:
    std::deque<uint32_t> ipids_ = {};
    std::deque<uint64_t> dsts_ = {};
    std::deque<std::string> srcs_ = {};
    std::deque<uint32_t> vsyncIds_ = {};
    std::deque<uint64_t> callStackIds_ = {};
    std::deque<uint64_t> endTss_ = {};
    std::deque<uint64_t> durs_ = {};
    std::deque<uint8_t> types_ = {};
    std::deque<uint8_t> flags_ = {};
    std::deque<uint8_t> depths_ = {};
    std::deque<uint32_t> frameNos_ = {};
    const uint32_t invalidRow_ = 2;
    static const uint32_t abnormalStartEndTimeState_ = 3;
    const uint8_t flagValue_ = 2;
};

class GPUSlice : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNew(uint32_t frameRow, uint64_t dur);
    const std::deque<uint32_t> &FrameRows() const;
    const std::deque<uint64_t> &Durs() const;
    void Clear() override
    {
        CacheBase::Clear();
        frameRows_.clear();
        durs_.clear();
    }
    void ClearExportedData() override
    {
        EraseElements(ids_, frameRows_, durs_);
    }

private:
    std::deque<uint32_t> frameRows_ = {};
    std::deque<uint64_t> durs_ = {};
};
struct DmaFenceRow {
    uint64_t timeStamp = INVALID_UINT64;
    uint64_t duration = INVALID_UINT64;
    DataIndex eventName = INVALID_DATAINDEX;
    DataIndex driver = INVALID_DATAINDEX;
    DataIndex timeline = INVALID_DATAINDEX;
    uint32_t context = INVALID_UINT32;
    uint32_t seqno = INVALID_UINT32;
};

class DmaFence : public CacheBase {
public:
    size_t AppendNew(const DmaFenceRow &dmaFenceRow);
    const std::deque<uint64_t> &DursData() const;
    const std::deque<DataIndex> &CatsData() const;
    const std::deque<DataIndex> &DriversData() const;
    const std::deque<DataIndex> &TimelinesData() const;
    const std::deque<uint32_t> &ContextsData() const;
    const std::deque<uint32_t> &SeqnosData() const;
    void Clear() override
    {
        CacheBase::Clear();
        durs_.clear();
        cats_.clear();
        drivers_.clear();
        timelines_.clear();
        contexts_.clear();
        seqnos_.clear();
    }

private:
    std::deque<uint64_t> durs_ = {};
    std::deque<DataIndex> cats_ = {};
    std::deque<DataIndex> drivers_ = {};
    std::deque<DataIndex> timelines_ = {};
    std::deque<uint32_t> contexts_ = {};
    std::deque<uint32_t> seqnos_ = {};
};

class FrameMaps : public CacheBase, public BatchCacheBase {
public:
    size_t AppendNew(FrameSlice *frameSlice, uint64_t src, uint64_t dst);
    const std::deque<uint64_t> &SrcIndexs() const;
    const std::deque<uint64_t> &DstIndexs() const;
    void ClearExportedData() override
    {
        EraseElements(timeStamps_, ids_, srcs_, dsts_);
    }

private:
    std::deque<uint64_t> srcs_ = {};
    std::deque<uint64_t> dsts_ = {};
};

} // namespace TraceStdtype
} // namespace SysTuning
#endif // RENDER_SERVICE_STDTYPE_H
