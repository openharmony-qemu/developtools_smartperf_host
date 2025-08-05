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
#include "frame_filter.h"
#include <cstdint>
#include <memory>
#include <cinttypes>
#include "process_filter.h"

namespace SysTuning {
namespace TraceStreamer {
FrameFilter::FrameFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter) : FilterBase(dataCache, filter)
{
}
FrameFilter::~FrameFilter() = default;

void FrameFilter::BeginVsyncEvent(const BytraceLine &line,
                                  uint64_t expectStart,
                                  uint64_t expectEnd,
                                  uint32_t vsyncId,
                                  uint32_t callStackSliceId)
{
    auto frame = std::make_shared<FrameSlice>();
    frame->nowId_ = expectStart;
    if (traceType_ == TRACE_FILETYPE_H_TRACE) {
        if (expectStart != INVALID_UINT64) {
            expectStart = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_MONOTONIC, expectStart);
        }
        if (expectEnd != INVALID_UINT64) {
            expectEnd = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_MONOTONIC, expectEnd);
        }
    }
    frame->startTs_ = line.ts;
    frame->callStackSliceId_ = callStackSliceId;
    frame->expectedStartTs_ = expectStart;
    frame->expectedEndTs_ = expectEnd;
    frame->expectedDur_ = expectEnd - expectStart;
    frame->vsyncId_ = vsyncId;
    auto itid = streamFilters_->processFilter_->GetInternalTid(line.pid);
    auto ipid = streamFilters_->processFilter_->GetInternalPid(line.tgid);
    frame->frameSliceRow_ =
        traceDataCache_->GetFrameSliceData()->AppendFrame(line.ts, ipid, itid, vsyncId, callStackSliceId);
    FrameSliceRow frameSliceRow = {
        expectStart, ipid, itid, vsyncId, callStackSliceId, expectEnd, (uint8_t)TraceStdtype::FrameSlice::EXPECT_SLICE};
    frame->frameExpectedSliceRow_ = traceDataCache_->GetFrameSliceData()->AppendFrame(frameSliceRow);
    if (vsyncRenderSlice_.count(itid)) {
        vsyncRenderSlice_[itid].push_back(frame);
    } else {
        std::vector<std::shared_ptr<FrameSlice>> frameVec;
        frameVec.push_back(frame);
        vsyncRenderSlice_[itid] = frameVec;
    }
}
void FrameFilter::BeginParallelTraceEvent(const BytraceLine &line, uint32_t callStackSliceId)
{
    auto frame = std::make_shared<FrameSlice>();
    frame->startTs_ = line.ts;
    frame->callStackSliceId_ = callStackSliceId;
    auto itid = streamFilters_->processFilter_->GetInternalTid(line.pid);
    auto ipid = streamFilters_->processFilter_->GetInternalPid(line.tgid);
    auto process = traceDataCache_->GetProcessData(ipid);
    auto mainThreadId = process->pid_;
    if (mainThreadId == line.pid) {
        TS_LOGI("Only deal with the events which are not on main thread.");
        return;
    }
    frame->frameSliceRow_ =
        traceDataCache_->GetFrameSliceData()->AppendFrame(line.ts, ipid, itid, INVALID_UINT32, callStackSliceId);

    if (vsyncRenderSlice_.count(itid)) {
        vsyncRenderSlice_[itid].push_back(frame);
    } else {
        std::vector<std::shared_ptr<FrameSlice>> frameVec;
        frameVec.push_back(frame);
        vsyncRenderSlice_[itid] = frameVec;
    }
}

bool FrameFilter::UpdateVsyncId(const BytraceLine &line, uint32_t vsyncId, uint64_t timeId)
{
    // only app no main thread needs to update
    auto itid = streamFilters_->processFilter_->GetInternalTid(line.pid);
    auto it = vsyncRenderSlice_.find(itid);
    if (it == vsyncRenderSlice_.end() || it->second.size() == 0) {
        return false;
    }
    // only process not main thread.
    auto ipid = traceDataCache_->GetThreadData(itid)->internalPid_;
    auto process = traceDataCache_->GetProcessData(ipid);
    auto mainThreadId = process->pid_;
    if (mainThreadId == line.pid) {
        return false;
    }
    auto lastFrame = it->second.back();
    lastFrame->vsyncId_ = vsyncId;
    lastFrame->nowId_ = timeId;
    traceDataCache_->GetFrameSliceData()->SetVsync(lastFrame->frameSliceRow_, vsyncId);
    auto mainItid = streamFilters_->processFilter_->GetInternalTid(mainThreadId);
    lastFrame->expectedEndTs_ = traceDataCache_->GetFrameSliceData()->GetExpectEndByItidAndVsyncId(mainItid, vsyncId);
    return true;
}

bool FrameFilter::MarkRSOnDoCompositionEvent(uint32_t itid)
{
    auto frame = vsyncRenderSlice_.find(itid);
    if (frame == vsyncRenderSlice_.end()) {
        TS_LOGD("BeginOnDoCompositionEvent find for itid:%u failed", itid);
        return false;
    }
    if (!frame->second.size()) {
        TS_LOGD("BeginOnDoCompositionEvent find for itid:%u failed", itid);
        return false;
    }
    auto lastFrameSlice = frame->second.back();
    lastFrameSlice->isRsMainThread_ = true;
    return true;
}
// for app
bool FrameFilter::BeginRSTransactionData(uint32_t currentThreadId,
                                         uint32_t frameNum,
                                         uint32_t mainThreadId,
                                         uint64_t timeId)
{
    auto frame = vsyncRenderSlice_.find(currentThreadId);
    if (frame == vsyncRenderSlice_.end()) {
        TS_LOGD("BeginRSTransactionData find for itid:%u failed", currentThreadId);
        return false;
    }
    if (!frame->second.size()) {
        TS_LOGD("BeginRSTransactionData find for itid:%u failed", currentThreadId);
        return false;
    }
    std::shared_ptr<FrameSlice> frameSlice = nullptr;
    if (timeId != INVALID_UINT64) {
        for (auto it = frame->second.begin(); it != frame->second.end();) {
            if (it->get()->nowId_ == timeId) {
                frameSlice = *it;
                frameSlice->frameNum_ = frameNum;
                if (frameSlice->isEnd_) {
                    it = frame->second.erase(it);
                }
                break;
            } else {
                ++it;
            }
        }
    } else {
        frameSlice = frame->second.back();
        if (frameSlice->isEnd_) {
            return false;
        }
        frameSlice->frameNum_ = frameNum;
    }
    if (frameSlice == nullptr) {
        TS_LOGW("No matching frame found,frameNum is:%u", frameNum);
        return false;
    }
    if (!dstRenderSlice_.count(mainThreadId)) {
        std::unordered_map<uint32_t /* frameNum */, std::shared_ptr<FrameSlice>> frameMap;
        dstRenderSlice_.emplace(std::make_pair(mainThreadId, std::move(frameMap)));
    }
    dstRenderSlice_[mainThreadId][frameNum] = frameSlice;
    return true;
}
// for RS
bool FrameFilter::BeginProcessCommandUni(uint32_t itid, const std::vector<FrameMap> &frames, uint32_t sliceIndex)
{
    auto frame = vsyncRenderSlice_.find(itid);
    TS_CHECK_TRUE_RET(frame != vsyncRenderSlice_.end(), false);
    TS_CHECK_TRUE_RET(!frame->second.empty(), false);
    auto lastFrameSlice = frame->second.back();
    TS_CHECK_TRUE_RET(!lastFrameSlice->vsyncEnd_, false);
    std::vector<uint64_t> fromSlices = {};
    std::vector<uint64_t> fromExpectedSlices = {};
    for (auto &it : frames) {
        auto sourceFrameMap = dstRenderSlice_.find(it.sourceItid);
        if (sourceFrameMap == dstRenderSlice_.end()) {
            continue;
        }
        auto srcFrame = sourceFrameMap->second.find(it.frameNum);
        if (srcFrame == sourceFrameMap->second.end()) {
            continue;
        }
        fromSlices.push_back(srcFrame->second->frameSliceRow_);
        fromExpectedSlices.push_back(srcFrame->second->frameExpectedSliceRow_);
        srcFrame->second->dstFrameSliceId_ = lastFrameSlice->frameSliceRow_;
        srcFrame->second->dstExpectedFrameSliceId_ = lastFrameSlice->frameExpectedSliceRow_;
        TraceStdtype::FrameSlice *frameSlice = traceDataCache_->GetFrameSliceData();
        (void)traceDataCache_->GetFrameMapsData()->AppendNew(frameSlice, srcFrame->second->frameSliceRow_,
                                                             srcFrame->second->dstFrameSliceId_);
        if (srcFrame->second->frameExpectedSliceRow_ != INVALID_UINT64) {
            (void)traceDataCache_->GetFrameMapsData()->AppendNew(frameSlice, srcFrame->second->frameExpectedSliceRow_,
                                                                 srcFrame->second->dstExpectedFrameSliceId_);
        }

        frameSlice->SetDst(srcFrame->second->frameSliceRow_, srcFrame->second->dstFrameSliceId_);
        if (srcFrame->second->frameExpectedSliceRow_ != INVALID_UINT64) {
            frameSlice->SetDst(srcFrame->second->frameExpectedSliceRow_, srcFrame->second->dstExpectedFrameSliceId_);
        }
        if (srcFrame->second->endTs_ != INVALID_UINT64) {
            // erase Source
            sourceFrameMap->second.erase(it.frameNum);
        }
    }
    TS_CHECK_TRUE_RET(!fromSlices.empty(), false);
    lastFrameSlice->sourceSlice_ = fromSlices;
    lastFrameSlice->sourceExpectedSlice_ = fromExpectedSlices;
    traceDataCache_->GetFrameSliceData()->SetSrcs(lastFrameSlice->frameSliceRow_, fromSlices);
    traceDataCache_->GetFrameSliceData()->SetSrcs(lastFrameSlice->frameExpectedSliceRow_, fromExpectedSlices);
    return true;
}
bool FrameFilter::EndVsyncEvent(uint64_t ts, uint32_t itid)
{
    auto frame = vsyncRenderSlice_.find(itid);
    if (frame == vsyncRenderSlice_.end()) {
        TS_LOGW("EndVsyncEvent find for itid:%u ts:%" PRIu64 " failed", itid, ts);
        return false;
    }
    if (!frame->second.size()) {
        TS_LOGW("EndVsyncEvent find for itid:%u ts:%" PRIu64 " failed", itid, ts);
        return false;
    }
    auto lastFrameSlice = frame->second.back();
    lastFrameSlice->vsyncEnd_ = true;
    if (lastFrameSlice->isRsMainThread_) {
        if (lastFrameSlice->gpuEnd_) {
            traceDataCache_->GetFrameSliceData()->SetEndTimeAndFlag(lastFrameSlice->frameSliceRow_, ts,
                                                                    lastFrameSlice->expectedEndTs_);
            lastFrameSlice->endTs_ = ts;
            // for Render serivce
            frame->second.pop_back();
        }
    } else { // for app
        if (lastFrameSlice->isEnd_) {
            return false;
        }
        traceDataCache_->GetFrameSliceData()->SetEndTimeAndFlag(lastFrameSlice->frameSliceRow_, ts,
                                                                lastFrameSlice->expectedEndTs_);
        if (lastFrameSlice->frameNum_ != INVALID_UINT32) {
            frame->second.pop_back();
        }
        lastFrameSlice->isEnd_ = true;
        lastFrameSlice->endTs_ = ts;
    }
    return true;
}
// only for renderservice
bool FrameFilter::StartFrameQueue(uint64_t ts, uint32_t itid)
{
    auto frame = vsyncRenderSlice_.find(itid);
    if (frame == vsyncRenderSlice_.end()) {
        TS_LOGD("StartFrameQueue find for itid:%u failed", itid);
        return false;
    }
    if (!frame->second.size()) {
        TS_LOGD("StartFrameQueue find for itid:%u failed", itid);
        return false;
    }
    auto firstFrameSlice = frame->second.front();
    firstFrameSlice->gpuEnd_ = false;
    firstFrameSlice->frameQueueStartTs_ = ts;
    return true;
}
bool FrameFilter::EndFrameQueue(uint64_t ts, uint32_t itid)
{
    auto frame = vsyncRenderSlice_.find(itid);
    if (frame == vsyncRenderSlice_.end()) {
        TS_LOGW("EndFrameQueue find for itid:%u ts:%" PRIu64 " failed", itid, ts);
        return false;
    }
    if (!frame->second.size()) {
        TS_LOGW("EndFrameQueue find for itid:%u ts:%" PRIu64 "  failed", itid, ts);
        return false;
    }
    auto firstFrameSlicePos = frame->second.begin();
    TraceStdtype::FrameSlice *frameSlice = traceDataCache_->GetFrameSliceData();
    (void)traceDataCache_->GetGPUSliceData()->AppendNew(frameSlice->diskTableSize_ +
                                                            (*firstFrameSlicePos)->frameSliceRow_,
                                                        ts - firstFrameSlicePos->get()->frameQueueStartTs_);
    firstFrameSlicePos->get()->gpuEnd_ = true;
    if (firstFrameSlicePos->get()->vsyncEnd_) {
        firstFrameSlicePos->get()->endTs_ = ts;
        traceDataCache_->GetFrameSliceData()->SetEndTimeAndFlag(firstFrameSlicePos->get()->frameSliceRow_, ts,
                                                                firstFrameSlicePos->get()->expectedEndTs_);
        // if vsync ended
        frame->second.erase(firstFrameSlicePos);
    }
    return true;
}
void FrameFilter::SetMinFrameSliceRow(uint64_t &minFrameSliceRowToBeUpdated)
{
    for (const auto &[_, frameSlices] : vsyncRenderSlice_) {
        for (size_t idx = 0; idx < frameSlices.size(); idx++) {
            if (minFrameSliceRowToBeUpdated > frameSlices[idx]->frameSliceRow_) {
                minFrameSliceRowToBeUpdated = frameSlices[idx]->frameSliceRow_;
            }
            if (minFrameSliceRowToBeUpdated > frameSlices[idx]->frameExpectedSliceRow_) {
                minFrameSliceRowToBeUpdated = frameSlices[idx]->frameExpectedSliceRow_;
            }
        }
    }
    for (const auto &pair : dstRenderSlice_) {
        for (const auto &[_, frameSlice] : pair.second) {
            if (minFrameSliceRowToBeUpdated > frameSlice->frameSliceRow_) {
                minFrameSliceRowToBeUpdated = frameSlice->frameSliceRow_;
            }
            if (minFrameSliceRowToBeUpdated > frameSlice->frameExpectedSliceRow_) {
                minFrameSliceRowToBeUpdated = frameSlice->frameExpectedSliceRow_;
            }
        }
    }
}
bool FrameFilter::UpdateFrameSliceReadySize()
{
    traceDataCache_->GetFrameSliceData()->UpdateDepth();
    auto frameSlice = traceDataCache_->GetFrameSliceData();
    frameSlice->UpdateReadySize(frameSlice->Size());
    uint64_t minFrameSliceRowToBeUpdated = INVALID_UINT64;
    SetMinFrameSliceRow(minFrameSliceRowToBeUpdated);
    // the ready size isn't all
    TS_CHECK_TRUE_RET(minFrameSliceRowToBeUpdated != INVALID_UINT64, true);
    frameSlice->UpdateReadySize(minFrameSliceRowToBeUpdated);
    TS_LOGI("minFrameSliceRowToBeUpdated=%" PRIu64 ", size=%zu, ready.size=%zu\n", minFrameSliceRowToBeUpdated,
            frameSlice->Size(), frameSlice->readySize_);
    for (auto &[_, frameSlices] : vsyncRenderSlice_) {
        for (size_t idx = 0; idx < frameSlices.size(); idx++) {
            frameSlices[idx]->frameSliceRow_ -= minFrameSliceRowToBeUpdated;
            frameSlices[idx]->frameExpectedSliceRow_ -= minFrameSliceRowToBeUpdated;
        }
    }
    for (const auto &pair : dstRenderSlice_) {
        for (const auto &[_, frameSlice] : pair.second) {
            frameSlice->frameSliceRow_ -= minFrameSliceRowToBeUpdated;
            frameSlice->frameExpectedSliceRow_ -= minFrameSliceRowToBeUpdated;
        }
    }
    return true;
}

void FrameFilter::SetTraceType(TraceFileType traceType)
{
    traceType_ = traceType;
}

void FrameFilter::Clear()
{
    for (auto &pair : vsyncRenderSlice_) {
        for (auto &frameSlice : pair.second) {
            if (frameSlice->isRsMainThread_) {
                break;
            }
            traceDataCache_->GetFrameSliceData()->Erase(frameSlice->frameSliceRow_);
            if (frameSlice->frameExpectedSliceRow_ != INVALID_UINT64) {
                traceDataCache_->GetFrameSliceData()->Erase(frameSlice->frameExpectedSliceRow_);
            }
        }
    }
    traceDataCache_->GetFrameSliceData()->UpdateDepth();
    vsyncRenderSlice_.clear();
    dstRenderSlice_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
