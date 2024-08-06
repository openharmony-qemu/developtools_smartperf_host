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

#ifndef ANIMATION_FILTER_H
#define ANIMATION_FILTER_H

#include <unordered_map>
#include <unordered_set>

#include "clock_filter_ex.h"
#include "common_types.h"
#include "filter_base.h"
#include "string_help.h"
#include "string_to_numerical.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::base;
class AnimationFilter : private FilterBase {
public:
    AnimationFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    ~AnimationFilter() override;
    bool UpdateDeviceInfoEvent(const TracePoint &point, const BytraceLine &line);
    bool BeginDynamicFrameEvent(const TracePoint &point, size_t callStackRow);
    bool EndDynamicFrameEvent(uint64_t ts, size_t callStackRow);
    bool StartAnimationEvent(const BytraceLine &line, const TracePoint &point, size_t callStackRow);
    bool FinishAnimationEvent(const BytraceLine &line, size_t callStackRow);
    void UpdateDynamicFrameInfo();
    void UpdateFrameInfo();
    void Clear();

private:
    bool UpdateDeviceFps(const BytraceLine &line);
    bool UpdateDeviceScreenSize(const TracePoint &point);
    bool UpdateDynamicEndTime(const uint64_t curFrameRow, uint64_t curStackRow);
    const std::regex framePixPattern_ =
        std::regex(R"(\[(.*?)\]\s*\(\s*-?(\d+),\s*-?(\d+),\s*(\d+),\s*(\d+)\)\s*Alpha:\s+-*(\d+\.\d+))");
    // for calculate the frame rate
    const std::string frameRateCmd_ = "H:GenerateVsyncCount";
    // if the realFrameRate present, no calculation is required
    const std::string realFrameRateCmd_ = "H:RSJankStats::RecordAnimationDynamicFrameRate"; // 动效过程帧率
    const std::string frameCountCmd_ = "H:Repaint";
    const std::string frameBeginCmd_ = "H:RSUniRender::Process:[WindowScene_";
    const std::string newFrameBeginCmd_ = "H:RSSurfaceRenderNodeDrawable::OnDraw:[WindowScene_"; // 动效帧数据
    const std::string frameBeginPrefix_ = "H:RSUniRender::Process:[";
    const std::string screenSizeCmd_ = "H:RSUniRender::Process:[SCBDesktop";
    const std::string newScreenSizeCmd_ = "H:RSSurfaceRenderNodeDrawable::OnDraw:[SCBDesktop"; // 设备分辨率
    const std::string frameEndTimeCmd_ = "H:RSMainThread::DoComposition";
    const std::string paralleCmd_ = "H:PostAndWait, parallel type"; // 并行化标志
    const std::string renderFrameCmd_ = "H:RenderFrame";            // 并行化后动效帧结束时间相关trace点
    std::unordered_set<DataIndex> onAnimationStartEvents_ = {};
    // for update dynamicFrameInfo at the end, first is callStackRow, second is dynamicFramRow
    std::deque<uint64_t> callstackWithDynamicFrameRows_ = {};
    // for update animationInfo, first is callStackRow, second is animationRow
    std::unordered_map<uint64_t, uint64_t> animationCallIds_ = {};
    // for count number of frames
    std::unordered_set<uint64_t> frameCountRows_ = {};
    std::deque<uint64_t> frameCountEndTimes_ = {};
    // for realFrameRate, first is realFrameRateFlag, second is animationRow
    std::unordered_map<DataIndex, uint64_t> realFrameRateFlagsDict_ = {};
    uint64_t generateFirstTime_ = INVALID_UINT64;
    uint8_t generateVsyncCnt_ = 0;
    std::deque<uint64_t> parallelRows_ = {};
    bool isNewAnimation_ = false;
    DynamicFrame *dynamicFrame_ = nullptr;
    CallStack *callStackSlice_ = nullptr;
    const uint8_t inputTimeIndex_ = 3;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // ANIMATION_FILTER_H
