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
#include "animation_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
TableRowId Animation::AppendAnimation(InternalTime inputTime, InternalTime startPoint, DataIndex nameIndex)
{
    inputTimes_.emplace_back(inputTime);
    startPoints_.emplace_back(startPoint);
    endPoins_.emplace_back(INVALID_TIME);
    frameInfos_.emplace_back(INVALID_UINT64);
    names_.emplace_back(nameIndex);
    ids_.emplace_back(Size());
    return ids_.size() - 1;
}
void Animation::UpdateStartPoint(TableRowId index, InternalTime startPoint)
{
    if (index <= Size()) {
        startPoints_[index] = startPoint;
    }
}
void Animation::UpdateEndPoint(TableRowId index, InternalTime endPoint)
{
    if (index <= Size()) {
        endPoins_[index] = endPoint;
    }
}
void Animation::UpdateFrameInfo(TableRowId index, InternalTime frameInfo)
{
    if (index <= Size()) {
        frameInfos_[index] = frameInfo;
    }
}
size_t Animation::Size() const
{
    return ids_.size();
}
const std::deque<InternalTime> &Animation::InputTimes() const
{
    return inputTimes_;
}
const std::deque<InternalTime> &Animation::StartPoints() const
{
    return startPoints_;
}
const std::deque<InternalTime> &Animation::EndPoints() const
{
    return endPoins_;
}
const std::deque<DataIndex> &Animation::FrameInfos() const
{
    return frameInfos_;
}
const std::deque<DataIndex> &Animation::Names() const
{
    return names_;
}
const std::deque<uint64_t> &Animation::IdsData() const
{
    return ids_;
}
void Animation::Clear()
{
    inputTimes_.clear();
    startPoints_.clear();
    endPoins_.clear();
    frameInfos_.clear();
    ids_.clear();
}

uint32_t DeviceInfo::PhysicalWidth() const
{
    return physicalWidth_;
}
uint32_t DeviceInfo::PhysicalHeight() const
{
    return physicalHeight_;
}
uint32_t DeviceInfo::PhysicalFrameRate() const
{
    return physicalFrameRate_;
}
void DeviceInfo::UpdateWidthAndHeight(const std::smatch &matcheLine)
{
    if (matcheLine.size() > DEVICEINFO_MATCH_LAST) {
        uint8_t matcheIndex = 0;
        physicalWidth_ = base::StrToInt<uint32_t>(matcheLine[++matcheIndex].str()).value();
        physicalHeight_ = base::StrToInt<uint32_t>(matcheLine[++matcheIndex].str()).value();
    }
}
void DeviceInfo::UpdateFrameRate(uint32_t frameRate)
{
    physicalFrameRate_ = frameRate;
}
void DeviceInfo::Clear()
{
    physicalWidth_ = INVALID_UINT32;
    physicalHeight_ = INVALID_UINT32;
    physicalFrameRate_ = INVALID_UINT32;
}

TableRowId DynamicFrame::AppendDynamicFrame(DataIndex nameId, const std::smatch &matcheLine, DataIndex alpha)

{
    if (matcheLine.size() < DYNAMICFRAME_MATCH_LAST) {
        return INVALID_INT32;
    }
    uint8_t matcheIndex = 1;
    names_.emplace_back(nameId);
    ids_.emplace_back(Size());
    xs_.emplace_back(base::StrToInt<uint32_t>(matcheLine[++matcheIndex].str()).value());
    ys_.emplace_back(base::StrToInt<uint32_t>(matcheLine[++matcheIndex].str()).value());
    widths_.emplace_back(base::StrToInt<uint32_t>(matcheLine[++matcheIndex].str()).value());
    heights_.emplace_back(base::StrToInt<uint32_t>(matcheLine[++matcheIndex].str()).value());
    alphas_.emplace_back(alpha);
    endTimes_.emplace_back(INVALID_TIME);
    return ids_.size() - 1;
}
void DynamicFrame::UpdateNameIndex(TableRowId index, DataIndex nameId)
{
    if (index <= Size()) {
        names_[index] = nameId;
    }
}
void DynamicFrame::UpdateEndTime(TableRowId index, InternalTime endTime)
{
    if (index <= Size()) {
        endTimes_[index] = endTime;
    }
}
size_t DynamicFrame::Size() const
{
    return ids_.size();
}
const std::deque<uint64_t> &DynamicFrame::IdsData() const
{
    return ids_;
}
const std::deque<uint32_t> &DynamicFrame::Xs() const
{
    return xs_;
}
const std::deque<uint32_t> &DynamicFrame::Ys() const
{
    return ys_;
}
const std::deque<uint32_t> &DynamicFrame::Widths() const
{
    return widths_;
}
const std::deque<uint32_t> &DynamicFrame::Heights() const
{
    return heights_;
}
const std::deque<DataIndex> &DynamicFrame::Alphas() const
{
    return alphas_;
}
const std::deque<DataIndex> &DynamicFrame::Names() const
{
    return names_;
}
const std::deque<InternalTime> &DynamicFrame::EndTimes() const
{
    return endTimes_;
}
void DynamicFrame::Clear()
{
    xs_.clear();
    ys_.clear();
    widths_.clear();
    heights_.clear();
    alphas_.clear();
    names_.clear();
    endTimes_.clear();
    ids_.clear();
}
} // namespace TraceStdtype
} // namespace SysTuning
