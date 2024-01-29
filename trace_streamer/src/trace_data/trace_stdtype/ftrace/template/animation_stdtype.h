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

#ifndef ANIMATION_STDTYPE_H
#define ANIMATION_STDTYPE_H
#include <regex>
#include "base_stdtype.h"
#include "string_to_numerical.h"

namespace SysTuning {
namespace TraceStdtype {
constexpr uint8_t DEVICEINFO_MATCH_LAST = 2;
class Animation {
public:
    TableRowId AppendAnimation(InternalTime inputTime, InternalTime startPoint, DataIndex nameIndex);
    void UpdateStartPoint(TableRowId index, InternalTime startPoint);
    void UpdateEndPoint(TableRowId index, InternalTime endPoint);
    void UpdateFrameInfo(TableRowId index, InternalTime frameInfo);
    size_t Size() const;
    const std::deque<InternalTime>& InputTimes() const;
    const std::deque<InternalTime>& StartPoints() const;
    const std::deque<InternalTime>& EndPoints() const;
    const std::deque<DataIndex>& FrameInfos() const;
    const std::deque<DataIndex>& Names() const;
    const std::deque<uint64_t>& IdsData() const;
    void Clear();

private:
    std::deque<InternalTime> inputTimes_ = {};
    std::deque<InternalTime> startPoints_ = {};
    std::deque<InternalTime> endPoins_ = {};
    std::deque<DataIndex> frameInfos_ = {};
    std::deque<DataIndex> names_ = {};
    std::deque<uint64_t> ids_ = {};
};

class DeviceInfo {
public:
    uint32_t PhysicalWidth() const;
    uint32_t PhysicalHeight() const;
    uint32_t PhysicalFrameRate() const;
    void UpdateWidthAndHeight(const std::smatch& matcheLine);
    void UpdateFrameRate(uint32_t frameRate);
    void Clear();

private:
    uint32_t physicalWidth_ = INVALID_UINT32;
    uint32_t physicalHeight_ = INVALID_UINT32;
    uint32_t physicalFrameRate_ = INVALID_UINT32;
};

class DynamicFrame {
public:
    TableRowId AppendDynamicFrame(DataIndex nameId);
    void UpdateNameIndex(TableRowId index, DataIndex nameId);
    void UpdatePosition(TableRowId index, const std::smatch& matcheLine, DataIndex alpha);
    void UpdateEndTime(TableRowId index, InternalTime endTime);

    size_t Size() const;
    const std::deque<uint64_t>& IdsData() const;
    const std::deque<uint32_t>& Xs() const;
    const std::deque<uint32_t>& Ys() const;
    const std::deque<uint32_t>& Widths() const;
    const std::deque<uint32_t>& Heights() const;
    const std::deque<DataIndex>& Alphas() const;
    const std::deque<DataIndex>& Names() const;
    const std::deque<InternalTime>& EndTimes() const;
    void Clear();

private:
    std::deque<uint32_t> xs_ = {};
    std::deque<uint32_t> ys_ = {};
    std::deque<uint32_t> widths_ = {};
    std::deque<uint32_t> heights_ = {};
    std::deque<DataIndex> alphas_ = {};
    std::deque<DataIndex> names_ = {};
    std::deque<InternalTime> endTimes_ = {};
    std::deque<uint64_t> ids_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // ANIMATION_STDTYPE_H
