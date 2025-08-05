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

#include "animation_filter.h"

namespace SysTuning {
namespace TraceStreamer {
constexpr uint8_t ANIMATION_INFO_NUM_MIN = 2;
constexpr uint8_t GENERATE_VSYNC_EVENT_MAX = 5;
constexpr uint8_t DYNAMIC_STACK_DEPTH_MIN = 2;
constexpr uint16_t FPS_60 = 60;
constexpr uint16_t FPS_70 = 70;
constexpr uint16_t FPS_90 = 90;
constexpr uint16_t FPS_100 = 100;
constexpr uint16_t FPS_120 = 120;

AnimationFilter::AnimationFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter)
    : FilterBase(dataCache, filter)
{
    dynamicFrame_ = traceDataCache_->GetDynamicFrame();
    callStackSlice_ = traceDataCache_->GetInternalSlicesData();
    if (dynamicFrame_ == nullptr || callStackSlice_ == nullptr) {
        TS_LOGE("dynamicFrame_ or callStackSlice_ is nullptr.");
    }
}
AnimationFilter::~AnimationFilter() {}
void AnimationFilter::InitAnimationStartEvents()
{
    auto res = streamFilters_->configFilter_->GetAnimationConfig().GetOnAnimationStartEvents();
    for (auto &eventName : res) {
        onAnimationStartEvents_.insert(traceDataCache_->GetDataIndex(eventName));
    }
}
bool AnimationFilter::UpdateDeviceFps(const BytraceLine &line)
{
    generateVsyncCnt_++;
    if (generateFirstTime_ == INVALID_UINT64) {
        generateFirstTime_ = line.ts;
    }
    if (generateVsyncCnt_ <= GENERATE_VSYNC_EVENT_MAX) {
        return true;
    }
    // calculate the average frame rate
    uint64_t generateTimePeriod = (line.ts - generateFirstTime_) / GENERATE_VSYNC_EVENT_MAX;
    uint32_t fps = BILLION_NANOSECONDS / generateTimePeriod;
    if (fps < FPS_70) {
        traceDataCache_->GetDeviceInfo()->UpdateFrameRate(FPS_60);
    } else if (fps < FPS_100) {
        traceDataCache_->GetDeviceInfo()->UpdateFrameRate(FPS_90);
    } else {
        traceDataCache_->GetDeviceInfo()->UpdateFrameRate(FPS_120);
    }
    TS_LOGI("physical frame rate is %u", fps);
    return true;
}
bool AnimationFilter::UpdateDeviceScreenSize(const TracePoint &point)
{
    // get width and height, eg:funcArgs=(0, 0, 1344, 2772) Alpha: 1.00
    std::smatch matcheLine;
    std::regex screenSizePattern(R"(\(\d+,\s*\d+,\s*(\d+),\s*(\d+)\))");
    if (!std::regex_search(point.funcArgs_, matcheLine, screenSizePattern)) {
        TS_LOGE("Not support this event: %s\n", point.name_.data());
        return false;
    }
    uint8_t index = 0;
    uint32_t width = base::StrToInt<uint32_t>(matcheLine[++index].str()).value();
    uint32_t height = base::StrToInt<uint32_t>(matcheLine[++index].str()).value();
    traceDataCache_->GetDeviceInfo()->UpdateWidthAndHeight(matcheLine);
    TS_LOGI("physical width is %u, height is %u", width, height);
    return true;
}
bool AnimationFilter::UpdateDeviceInfoEvent(const TracePoint &point, const BytraceLine &line)
{
    if (traceDataCache_->GetConstDeviceInfo().PhysicalFrameRate() == INVALID_UINT32 &&
        streamFilters_->configFilter_->GetAnimationConfig().CheckIfFrameRateCmd(point.name_)) {
        return UpdateDeviceFps(line);
    } else if (traceDataCache_->GetConstDeviceInfo().PhysicalWidth() == INVALID_UINT32 &&
               streamFilters_->configFilter_->GetAnimationConfig().CheckIfScreenSizeCmd(point.name_)) {
        return UpdateDeviceScreenSize(point);
    }
    return false;
}
bool AnimationFilter::BeginDynamicFrameEvent(const TracePoint &point, size_t callStackRow)
{
    if (streamFilters_->configFilter_->GetAnimationConfig().CheckIfParallelCmd(point.name_)) {
        isNewAnimation_ = true;
        return true;
    }
    if (streamFilters_->configFilter_->GetAnimationConfig().CheckIfFrameCountCmd(point.name_)) {
        frameCountRows_.insert(callStackRow);
        return true;
    } else if (streamFilters_->configFilter_->GetAnimationConfig().CheckIfRealFrameRateCmd(point.name_)) {
        // eg: `frame rate is 88.61: APP_LIST_FLING, com.taobao.taobao, pages/Index`
        auto infos = SplitStringToVec(point.funcArgs_, ": ");
        auto curRealFrameRateFlagInadex = traceDataCache_->GetDataIndex("H:" + infos.back());
        auto iter = realFrameRateFlagsDict_.find(curRealFrameRateFlagInadex);
        TS_CHECK_TRUE_RET(iter != realFrameRateFlagsDict_.end(), false);
        auto animationRow = iter->second;
        auto curRealFrameRate = SplitStringToVec(infos.front(), " ").back();
        auto curFrameNum = "0:";
        traceDataCache_->GetAnimation()->UpdateFrameInfo(animationRow,
                                                         traceDataCache_->GetDataIndex(curFrameNum + curRealFrameRate));
        return true;
    } else if (streamFilters_->configFilter_->GetAnimationConfig().CheckIfFrameBeginCmd(point.name_)) {
        // get the parent frame of data
        const std::optional<uint64_t> &parentId = callStackSlice_->ParentIdData()[callStackRow];
        uint8_t depth = callStackSlice_->Depths()[callStackRow];
        TS_CHECK_TRUE_RET(depth >= DYNAMIC_STACK_DEPTH_MIN && parentId.has_value(), false);
        callstackWithDynamicFrameRows_.emplace_back(callStackRow);
        return true;
    }
    return false;
}
bool AnimationFilter::EndDynamicFrameEvent(uint64_t ts, size_t callStackRow)
{
    auto iter = frameCountRows_.find(callStackRow);
    if (iter == frameCountRows_.end()) {
        return false;
    }
    frameCountEndTimes_.emplace_back(ts);
    frameCountRows_.erase(iter);
    return true;
}
bool AnimationFilter::StartAnimationEvent(const BytraceLine &line, const TracePoint &point, size_t callStackRow)
{
    auto infos = SplitStringToVec(point.name_, ", ");
    auto curAnimationIndex = traceDataCache_->GetDataIndex(infos.front());
    auto startEventIter = onAnimationStartEvents_.find(curAnimationIndex);
    TS_CHECK_TRUE_RET(startEventIter != onAnimationStartEvents_.end() && infos.size() >= ANIMATION_INFO_NUM_MIN, false);
    auto nameIndex = traceDataCache_->GetDataIndex(infos[0] + ", " + infos[1]);
    // pop for '.': '1693876195576.'
    auto &inputTimeStr = infos[inputTimeIndex_];
    if (inputTimeStr.back() == '.') {
        inputTimeStr.pop_back();
    }
    uint64_t inputTime = base::StrToInt<uint64_t>(inputTimeStr).value();
    inputTime =
        streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, inputTime * ONE_MILLION_NANOSECONDS);
    auto startPoint = line.ts;
    auto animationRow = traceDataCache_->GetAnimation()->AppendAnimation(inputTime, startPoint, nameIndex);
    animationCallIds_.emplace(callStackRow, animationRow);
    realFrameRateFlagsDict_[traceDataCache_->GetDataIndex(point.name_)] = animationRow;
    return true;
}
bool AnimationFilter::FinishAnimationEvent(const BytraceLine &line, size_t callStackRow)
{
    auto iter = animationCallIds_.find(callStackRow);
    if (iter == animationCallIds_.end()) {
        return false;
    }
    auto animationRow = iter->second;
    traceDataCache_->GetAnimation()->UpdateEndPoint(animationRow, line.ts);
    animationCallIds_.erase(iter);
    return true;
}
bool AnimationFilter::UpdateDynamicEndTime(const uint64_t curFrameRow, uint64_t curStackRow)
{
    // update dynamicFrame endTime, filter up from the curStackRow, until reach the top
    for (uint8_t stackCurDepth = callStackSlice_->Depths()[curStackRow]; stackCurDepth > 0; stackCurDepth--) {
        if (!callStackSlice_->ParentIdData()[curStackRow].has_value()) {
            return false;
        }
        curStackRow = callStackSlice_->ParentIdData()[curStackRow].value();
        // use frameEndTimeCmd_'s endTime as dynamicFrame endTime
        auto nameIndex = callStackSlice_->NamesData()[curStackRow];
        if ((!isNewAnimation_ && StartWith(traceDataCache_->GetDataFromDict(nameIndex), frameEndTimeCmd_)) ||
            streamFilters_->configFilter_->GetAnimationConfig().CheckIfFrameEndTimeCmd(
                traceDataCache_->GetDataFromDict(nameIndex))) {
            auto endTime = callStackSlice_->TimeStampData()[curStackRow] + callStackSlice_->DursData()[curStackRow];
            dynamicFrame_->UpdateEndTime(curFrameRow, endTime);
            return true;
        }
    }
    return false;
}
void AnimationFilter::UpdateFrameInfo()
{
    auto animation = traceDataCache_->GetAnimation();
    for (size_t row = 0; row < animation->Size(); row++) {
        if (animation->FrameInfos()[row] != INVALID_UINT64) {
            continue;
        }
        auto firstFrameTimeIter =
            std::lower_bound(frameCountEndTimes_.begin(), frameCountEndTimes_.end(), animation->StartPoints()[row]);
        uint64_t frameNum = 0;
        while (firstFrameTimeIter != frameCountEndTimes_.end() && *firstFrameTimeIter <= animation->EndPoints()[row]) {
            ++frameNum;
            ++firstFrameTimeIter;
        }
        auto curRealFrameRate = ":0";
        animation->UpdateFrameInfo(row, traceDataCache_->GetDataIndex(std::to_string(frameNum) + curRealFrameRate));
    }
    frameCountRows_.clear();
    frameCountEndTimes_.clear();
    realFrameRateFlagsDict_.clear();
}
void AnimationFilter::UpdateDynamicFrameInfo()
{
    std::smatch matcheLine;
    for (auto it = callstackWithDynamicFrameRows_.begin(); it != callstackWithDynamicFrameRows_.end(); ++it) {
        // update dynamicFrame pix, eg:H:RSUniRender::Process:[xxx] (0, 0, 1344, 2772) Alpha: 1.00
        auto nameDataIndex = callStackSlice_->NamesData()[*it];
        const std::string &curStackName = traceDataCache_->GetDataFromDict(nameDataIndex);
        if (!std::regex_search(curStackName, matcheLine, framePixPattern_)) {
            TS_LOGE("Not support this event: %s\n", curStackName.data());
            continue;
        }
        int32_t index = dynamicFrame_->AppendDynamicFrame(
            traceDataCache_->GetDataIndex(matcheLine[1].str()), matcheLine,
            traceDataCache_->GetDataIndex((matcheLine[DYNAMICFRAME_MATCH_LAST].str())));
        if (index == INVALID_INT32) {
            TS_LOGE("Failed to append dynamic frame: %s\n", curStackName.data());
            continue;
        }
        UpdateDynamicEndTime(index, *it);
    }
    TS_LOGI("UpdateDynamicFrame (%zu) endTime and pos finish", callstackWithDynamicFrameRows_.size());
    // this can only be cleared by the UpdateDynamicFrameInfo function
    callstackWithDynamicFrameRows_.clear();
}
void AnimationFilter::Clear()
{
    generateFirstTime_ = INVALID_UINT64;
    generateVsyncCnt_ = 0;
    animationCallIds_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
