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

#ifndef ARKTS_STDTYPE_H
#define ARKTS_STDTYPE_H
#include "base_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
class JsHeapFiles : public CacheBase {
public:
    size_t
        AppendNewData(uint32_t id, std::string filePath, uint64_t startTime, uint64_t endTime, uint64_t selfSizeCount);
    const std::deque<uint32_t>& IDs() const;
    const std::deque<std::string>& FilePaths() const;
    const std::deque<uint64_t>& StartTimes() const;
    const std::deque<uint64_t>& EndTimes() const;
    const std::deque<uint64_t>& SelfSizeCount() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        filePaths_.clear();
        startTimes_.clear();
        endTimes_.clear();
        selfSizeCount_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<std::string> filePaths_ = {};
    std::deque<uint64_t> startTimes_ = {};
    std::deque<uint64_t> endTimes_ = {};
    std::deque<uint64_t> selfSizeCount_ = {};
};

class JsHeapEdges : public CacheBase {
public:
    size_t AppendNewData(uint32_t fileId,
                         uint32_t edgeIndex,
                         uint32_t type,
                         uint32_t nameOrIndex,
                         uint32_t toNode,
                         uint32_t fromNodeId,
                         uint32_t toNodeId);
    const std::deque<uint32_t>& FileIds() const;
    const std::deque<uint32_t>& EdgeIndexs() const;
    const std::deque<uint32_t>& Types() const;
    const std::deque<uint32_t>& NameOrIndexs() const;
    const std::deque<uint32_t>& ToNodes() const;
    const std::deque<uint32_t>& FromNodeIds() const;
    const std::deque<uint32_t>& ToNodeIds() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        edgeIndexs_.clear();
        types_.clear();
        nameOrIndexs_.clear();
        toNodes_.clear();
        fromNodeIds_.clear();
        toNodeIds_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<uint32_t> edgeIndexs_ = {};
    std::deque<uint32_t> types_ = {};
    std::deque<uint32_t> nameOrIndexs_ = {};
    std::deque<uint32_t> toNodes_ = {};
    std::deque<uint32_t> fromNodeIds_ = {};
    std::deque<uint32_t> toNodeIds_ = {};
};

class JsHeapInfo : public CacheBase {
public:
    size_t AppendNewData(uint32_t fileId, std::string key, uint32_t type, int32_t intValue, std::string strValue);
    const std::deque<uint32_t>& FileIds() const;
    const std::deque<std::string>& Keys() const;
    const std::deque<uint32_t>& Types() const;
    const std::deque<int32_t>& IntValues() const;
    const std::deque<std::string>& StrValues() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        keys_.clear();
        types_.clear();
        intValues_.clear();
        strValues_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<std::string> keys_ = {};
    std::deque<uint32_t> types_ = {};
    std::deque<int32_t> intValues_ = {};
    std::deque<std::string> strValues_ = {};
};

class JsHeapLocation : public CacheBase {
public:
    size_t AppendNewData(uint32_t fileId, uint32_t objectIndex, uint32_t scriptId, uint32_t line, uint32_t column);
    const std::deque<uint32_t>& FileIds() const;
    const std::deque<uint32_t>& ObjectIndexs() const;
    const std::deque<uint32_t>& ScriptIds() const;
    const std::deque<uint32_t>& Lines() const;
    const std::deque<uint32_t>& Columns() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        objectIndexs_.clear();
        scriptIds_.clear();
        lines_.clear();
        columns_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<uint32_t> objectIndexs_ = {};
    std::deque<uint32_t> scriptIds_ = {};
    std::deque<uint32_t> lines_ = {};
    std::deque<uint32_t> columns_ = {};
};

class JsHeapNodes : public CacheBase {
public:
    size_t AppendNewData(uint32_t fileId,
                         uint32_t nodeIndex,
                         uint32_t type,
                         uint32_t name,
                         uint32_t id,
                         uint32_t selfSize,
                         uint32_t edgeCount,
                         uint32_t traceNodeId,
                         uint32_t detachedNess);
    const std::deque<uint32_t>& FileIds() const;
    const std::deque<uint32_t>& NodeIndexs() const;
    const std::deque<uint32_t>& Types() const;
    const std::deque<uint32_t>& Names() const;
    const std::deque<uint32_t>& NodeIds() const;
    const std::deque<uint32_t>& SelfSizes() const;
    const std::deque<uint32_t>& EdgeCounts() const;
    const std::deque<uint32_t>& TraceNodeIds() const;
    const std::deque<uint32_t>& DetachedNess() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        nodeIndexs_.clear();
        types_.clear();
        names_.clear();
        nodeIds_.clear();
        selfSizes_.clear();
        edgeCounts_.clear();
        traceNodeIds_.clear();
        detachedNess_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<uint32_t> nodeIndexs_ = {};
    std::deque<uint32_t> types_ = {};
    std::deque<uint32_t> names_ = {};
    std::deque<uint32_t> nodeIds_ = {};
    std::deque<uint32_t> selfSizes_ = {};
    std::deque<uint32_t> edgeCounts_ = {};
    std::deque<uint32_t> traceNodeIds_ = {};
    std::deque<uint32_t> detachedNess_ = {};
};

class JsHeapSample : public CacheBase {
public:
    size_t AppendNewData(uint32_t fileId, uint64_t timeStampUs, uint32_t lastAssignedId);
    const std::deque<uint32_t>& FileIds() const;
    const std::deque<uint64_t>& TimeStampUs() const;
    const std::deque<uint32_t>& LastAssignedIds() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        timeStampUs_.clear();
        lastAssignedIds_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<uint64_t> timeStampUs_ = {};
    std::deque<uint32_t> lastAssignedIds_ = {};
};

class JsHeapString : public CacheBase {
public:
    size_t AppendNewData(uint32_t fileId, uint32_t fileIndex, std::string string);
    const std::deque<uint32_t>& FileIds() const;
    const std::deque<uint64_t>& FileIndexs() const;
    const std::deque<std::string>& Strings() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        fileIndexs_.clear();
        strings_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<uint64_t> fileIndexs_ = {};
    std::deque<std::string> strings_ = {};
};

class JsHeapTraceFuncInfo : public CacheBase {
public:
    size_t AppendNewData(uint32_t fileId,
                         uint32_t functionIndex,
                         uint32_t functionId,
                         uint32_t name,
                         uint32_t scriptName,
                         uint32_t scriptId,
                         uint32_t line,
                         uint32_t column);
    const std::deque<uint32_t>& FileIds() const;
    const std::deque<uint32_t>& FunctionIndexs() const;
    const std::deque<uint32_t>& FunctionIds() const;
    const std::deque<uint32_t>& Names() const;
    const std::deque<uint32_t>& ScriptNames() const;
    const std::deque<uint32_t>& ScriptIds() const;
    const std::deque<uint32_t>& Lines() const;
    const std::deque<uint32_t>& Columns() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        functionIndexs_.clear();
        functionIds_.clear();
        names_.clear();
        scriptNames_.clear();
        scriptIds_.clear();
        lines_.clear();
        columns_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<uint32_t> functionIndexs_ = {};
    std::deque<uint32_t> functionIds_ = {};
    std::deque<uint32_t> names_ = {};
    std::deque<uint32_t> scriptNames_ = {};
    std::deque<uint32_t> scriptIds_ = {};
    std::deque<uint32_t> lines_ = {};
    std::deque<uint32_t> columns_ = {};
};

class JsHeapTraceNode : public CacheBase {
public:
    size_t AppendNewData(uint32_t fileId,
                         uint32_t traceNodeId,
                         uint32_t functionInfoIndex,
                         uint32_t count,
                         uint32_t size,
                         int32_t parentId);
    const std::deque<uint32_t>& FileIds() const;
    const std::deque<uint32_t>& TraceNodeIDs() const;
    const std::deque<uint32_t>& FunctionInfoIndexs() const;
    const std::deque<uint32_t>& Counts() const;
    const std::deque<uint32_t>& NodeSizes() const;
    const std::deque<int32_t>& ParentIds() const;
    void Clear() override
    {
        CacheBase::Clear();
        fileIds_.clear();
        traceNodeIds_.clear();
        functionInfoIndexs_.clear();
        counts_.clear();
        sizes_.clear();
        parentIds_.clear();
    }

private:
    std::deque<uint32_t> fileIds_ = {};
    std::deque<uint32_t> traceNodeIds_ = {};
    std::deque<uint32_t> functionInfoIndexs_ = {};
    std::deque<uint32_t> counts_ = {};
    std::deque<uint32_t> sizes_ = {};
    std::deque<int32_t> parentIds_ = {};
};

class JsConfig : public CacheBase {
public:
    size_t AppendNewData(uint32_t pid,
                         uint64_t type,
                         uint32_t interval,
                         uint32_t captureNumericValue,
                         uint32_t trackAllocation,
                         uint32_t cpuProfiler,
                         uint32_t cpuProfilerInterval);
    const std::deque<uint32_t>& Pids() const;
    const std::deque<uint64_t>& Types() const;
    const std::deque<uint32_t>& Intervals() const;
    const std::deque<uint32_t>& CaptureNumericValue() const;
    const std::deque<uint32_t>& TrackAllocations() const;
    const std::deque<uint32_t>& CpuProfiler() const;
    const std::deque<uint32_t>& CpuProfilerInterval() const;
    void Clear() override
    {
        CacheBase::Clear();
        pids_.clear();
        types_.clear();
        intervals_.clear();
        captureNumericValues_.clear();
        trackAllocations_.clear();
        cpuProfilers_.clear();
        cpuProfilerIntervals_.clear();
    }

private:
    std::deque<uint32_t> pids_ = {};
    std::deque<uint64_t> types_ = {};
    std::deque<uint32_t> intervals_ = {};
    std::deque<uint32_t> captureNumericValues_ = {};
    std::deque<uint32_t> trackAllocations_ = {};
    std::deque<uint32_t> cpuProfilers_ = {};
    std::deque<uint32_t> cpuProfilerIntervals_ = {};
};

class JsCpuProfilerNode : public CacheBase {
public:
    size_t AppendNewData(uint32_t functionId,
                         uint32_t functionName,
                         std::string scriptId,
                         uint32_t url,
                         uint32_t lineNumber,
                         uint32_t columnNumber,
                         uint32_t hitCount,
                         std::string children,
                         uint32_t parent);
    const std::deque<uint32_t>& FunctionIds() const;
    const std::deque<uint32_t>& FunctionNames() const;
    const std::deque<std::string>& ScriptIds() const;
    const std::deque<uint32_t>& Urls() const;
    const std::deque<uint32_t>& LineNumbers() const;
    const std::deque<int32_t>& ColumnNumbers() const;
    const std::deque<int32_t>& HitCounts() const;
    const std::deque<std::string>& Children() const;
    const std::deque<uint32_t>& Parents() const;
    void Clear() override
    {
        CacheBase::Clear();
        functionIds_.clear();
        functionNames_.clear();
        scriptIds_.clear();
        urls_.clear();
        lineNumbers_.clear();
        columnNumbers_.clear();
        hitCounts_.clear();
        children_.clear();
        parents_.clear();
    }

private:
    std::deque<uint32_t> functionIds_ = {};
    std::deque<uint32_t> functionNames_ = {};
    std::deque<std::string> scriptIds_ = {};
    std::deque<uint32_t> urls_ = {};
    std::deque<uint32_t> lineNumbers_ = {};
    std::deque<int32_t> columnNumbers_ = {};
    std::deque<int32_t> hitCounts_ = {};
    std::deque<std::string> children_ = {};
    std::deque<uint32_t> parents_ = {};
};

class JsCpuProfilerSample : public CacheBase {
public:
    size_t AppendNewData(uint32_t functionId, uint64_t startTime, uint64_t endTime, uint64_t dur);
    const std::deque<uint32_t>& FunctionIds() const;
    const std::deque<uint64_t>& StartTimes() const;
    const std::deque<uint64_t>& EndTimes() const;
    const std::deque<uint64_t>& Durs() const;
    void Clear() override
    {
        CacheBase::Clear();
        functionIds_.clear();
        startTimes_.clear();
        endTimes_.clear();
        durs_.clear();
    }

private:
    std::deque<uint32_t> functionIds_ = {};
    std::deque<uint64_t> startTimes_ = {};
    std::deque<uint64_t> endTimes_ = {};
    std::deque<uint64_t> durs_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning
#endif // ARKTS_STDTYPE_H
