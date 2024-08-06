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
#include "render_service_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t FrameSlice::AppendFrame(uint64_t ts, uint32_t ipid, uint32_t itid, uint32_t vsyncId, uint64_t callStackSliceId)
{
    timeStamps_.emplace_back(ts);
    ipids_.emplace_back(ipid);
    internalTids_.emplace_back(itid);
    vsyncIds_.emplace_back(vsyncId);
    callStackIds_.emplace_back(callStackSliceId);
    endTss_.emplace_back(INVALID_UINT64);
    dsts_.emplace_back(INVALID_UINT64);
    ids_.emplace_back(id_++);
    durs_.emplace_back(INVALID_UINT64);
    types_.emplace_back(0);
    flags_.emplace_back(INVALID_UINT8);
    srcs_.emplace_back("");
    depths_.emplace_back(0);
    frameNos_.emplace_back(0);
    return Size() - 1;
}
size_t FrameSlice::AppendFrame(const FrameSliceRow &frameSliceRow)
{
    auto row = AppendFrame(frameSliceRow.ts, frameSliceRow.ipid, frameSliceRow.itid, frameSliceRow.vsyncId,
                           frameSliceRow.callStackSliceId);
    SetEndTime(row, frameSliceRow.end);
    SetType(row, frameSliceRow.type);
    depths_.emplace_back(0);
    frameNos_.emplace_back(0);
    durs_[row] = frameSliceRow.end - frameSliceRow.ts;
    return row;
}

void FrameSlice::UpdateDepth()
{
    DoubleMap<uint32_t, uint8_t, std::shared_ptr<std::vector<uint64_t>>> ipidAndTypesToVEndTime(nullptr);
    for (auto row = 0; row < Size(); row++) {
        if (flags_[row] == flagValue_) {
            continue;
        }
        auto endTime = timeStamps_[row] + durs_[row];
        auto vEndTimes = ipidAndTypesToVEndTime.Find(ipids_[row], types_[row]);
        auto depth = 0;
        if (!vEndTimes) {
            vEndTimes = std::make_shared<std::vector<uint64_t>>();
            vEndTimes->push_back(endTime);
            ipidAndTypesToVEndTime.Insert(ipids_[row], types_[row], vEndTimes);
            depths_[row] = depth;
            continue;
        }
        for (; depth < vEndTimes->size(); depth++) {
            if (timeStamps_[row] > vEndTimes->at(depth)) {
                depths_[row] = depth;
                vEndTimes->at(depth) = endTime;
                break;
            }
        }
        if (depth == vEndTimes->size()) {
            depths_[row] = depth;
            vEndTimes->push_back(endTime);
        }
    }
}

void FrameSlice::SetEndTime(uint64_t row, uint64_t end)
{
    endTss_[row] = end;
}
void FrameSlice::SetType(uint64_t row, uint8_t type)
{
    types_[row] = type;
}
void FrameSlice::SetDst(uint64_t row, uint64_t dst)
{
    dsts_[row] = diskTableSize_ + dst;
}

void FrameSlice::SetSrcs(uint64_t row, const std::vector<uint64_t> &fromSlices)
{
    std::string s = "";
    for (auto &&i : fromSlices) {
        s += std::to_string(diskTableSize_ + i) + ",";
    }
    s.pop_back();
    srcs_[row] = s;
}
void FrameSlice::SetFlags(uint64_t row, const uint32_t flags)
{
    flags_[row] = flags;
}
const std::deque<uint32_t> FrameSlice::Ipids() const
{
    return ipids_;
}
const std::deque<uint32_t> FrameSlice::VsyncIds() const
{
    return vsyncIds_;
}
const std::deque<uint64_t> FrameSlice::CallStackIds() const
{
    return callStackIds_;
}
const std::deque<uint64_t> FrameSlice::EndTss() const
{
    return endTss_;
}
const std::deque<uint64_t> FrameSlice::Dsts() const
{
    return dsts_;
}
const std::deque<uint64_t> FrameSlice::Durs() const
{
    return durs_;
}
const std::deque<uint8_t> FrameSlice::Types() const
{
    return types_;
}
const std::deque<uint8_t> FrameSlice::Flags() const
{
    return flags_;
}

const std::deque<uint8_t> FrameSlice::Depths() const
{
    return depths_;
}
const std::deque<uint32_t> FrameSlice::FrameNos() const
{
    return frameNos_;
}
const std::deque<std::string> &FrameSlice::Srcs() const
{
    return srcs_;
}
void FrameSlice::UpdateCallStackSliceId(uint64_t row, uint64_t callStackSliceId)
{
    callStackIds_[row] = callStackSliceId;
}
void FrameSlice::SetEndTimeAndFlag(uint64_t row, uint64_t ts, uint64_t expectDur, uint64_t expectEnd)
{
    Unused(expectDur);
    durs_[row] = ts - timeStamps_[row];
    if (flags_[row] != abnormalStartEndTimeState_) {
        flags_[row] = expectEnd >= ts ? 0 : 1;
    }
}
void FrameSlice::Erase(uint64_t row)
{
    flags_[row] = invalidRow_;
}

size_t GPUSlice::AppendNew(uint32_t frameRow, uint64_t dur)
{
    ids_.emplace_back(id_++);
    frameRows_.emplace_back(frameRow);
    durs_.emplace_back(dur);
    return Size() - 1;
}
const std::deque<uint32_t> &GPUSlice::FrameRows() const
{
    return frameRows_;
}
const std::deque<uint64_t> &GPUSlice::Durs() const
{
    return durs_;
}
size_t DmaFence::AppendNew(const DmaFenceRow &dmaFenceRow)
{
    timeStamps_.emplace_back(dmaFenceRow.timeStamp);
    durs_.emplace_back(dmaFenceRow.duration);
    cats_.emplace_back(dmaFenceRow.eventName);
    drivers_.emplace_back(dmaFenceRow.driver);
    timelines_.emplace_back(dmaFenceRow.timeline);
    contexts_.emplace_back(dmaFenceRow.context);
    seqnos_.emplace_back(dmaFenceRow.seqno);
    return Size() - 1;
}

const std::deque<uint64_t> &DmaFence::DursData() const
{
    return durs_;
}

const std::deque<DataIndex> &DmaFence::CatsData() const
{
    return cats_;
}

const std::deque<DataIndex> &DmaFence::DriversData() const
{
    return drivers_;
}

const std::deque<DataIndex> &DmaFence::TimelinesData() const
{
    return timelines_;
}

const std::deque<uint32_t> &DmaFence::ContextsData() const
{
    return contexts_;
}

const std::deque<uint32_t> &DmaFence::SeqnosData() const
{
    return seqnos_;
}

size_t FrameMaps::AppendNew(FrameSlice *frameSlice, uint64_t src, uint64_t dst)
{
    timeStamps_.emplace_back(0);
    ids_.emplace_back(id_++);
    srcs_.emplace_back(frameSlice->diskTableSize_ + src);
    dsts_.emplace_back(frameSlice->diskTableSize_ + dst);
    if (frameSlice->Types().at(dst) == FrameSlice::EXPECT_SLICE) {
        uint64_t expRsStartTime = frameSlice->TimeStampData().at(dst);
        uint64_t expUiEndTime = frameSlice->TimeStampData().at(src) + frameSlice->Durs().at(src);
        if (std::abs(static_cast<long long>(expRsStartTime - expUiEndTime)) >= ONE_MILLION_NANOSECONDS) {
            auto acturalRow = dst - 1;
            frameSlice->SetFlags(acturalRow, FrameSlice::GetAbnormalStartEndTimeState());
        }
    }

    return Size() - 1;
}
const std::deque<uint64_t> &FrameMaps::SrcIndexs() const
{
    return srcs_;
}
const std::deque<uint64_t> &FrameMaps::DstIndexs() const
{
    return dsts_;
}

} // namespace TraceStdtype
} // namespace SysTuning
