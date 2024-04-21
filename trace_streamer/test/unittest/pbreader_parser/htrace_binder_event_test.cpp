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

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>

#include "binder_filter.h"
#include "htrace_cpu_detail_parser.h"
#include "trace_plugin_result.pb.h"
#include "trace_plugin_result.pbreader.h"
#include "trace_streamer_selector.h"
#include "ts_common.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;
namespace SysTuning {
namespace TraceStreamer {
class HtraceBinderEventTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

    std::string SetBinderTransactionFormat(uint32_t flags = 0x02, bool isReply = false)
    {
        const int64_t ts1 = 100;
        const int32_t destTgid1 = 2;
        const int32_t destTid1 = 3;
        BinderTransactionFormat *binderEvent = new BinderTransactionFormat();
        binderEvent->set_to_proc(destTgid1);
        binderEvent->set_target_node(1);
        binderEvent->set_to_thread(destTid1);
        binderEvent->set_debug_id(1);
        binderEvent->set_reply(static_cast<int32_t>(isReply));
        binderEvent->set_flags(flags);
        TracePluginResult tracePacket;
        FtraceCpuDetailMsg *ftraceCpuDetail = tracePacket.add_ftrace_cpu_detail();
        auto ftraceEvent = ftraceCpuDetail->add_event();
        ftraceEvent->set_timestamp(ts1);
        ftraceEvent->set_tgid(1);
        ftraceEvent->set_comm("app1");
        ftraceEvent->set_allocated_binder_transaction_format(binderEvent);

        std::string cpuDetailStrMsg = "";
        tracePacket.SerializeToString(&cpuDetailStrMsg);
        return cpuDetailStrMsg;
    }

    std::string SetBinderTransactionReceivedFormat(uint64_t transactionId = 1)
    {
        const int64_t ts1 = 200;
        BinderTransactionReceivedFormat *binderReceivedEvent = new BinderTransactionReceivedFormat();
        binderReceivedEvent->set_debug_id(transactionId);
        TracePluginResult tracePacket;
        FtraceCpuDetailMsg *ftraceCpuDetail = tracePacket.add_ftrace_cpu_detail();
        auto ftraceEvent = ftraceCpuDetail->add_event();
        ftraceEvent->set_timestamp(ts1);
        ftraceEvent->set_tgid(1);
        ftraceEvent->set_comm("app2");
        ftraceEvent->set_allocated_binder_transaction_received_format(binderReceivedEvent);

        std::string cpuDetailStrMsg = "";
        tracePacket.SerializeToString(&cpuDetailStrMsg);
        return cpuDetailStrMsg;
    }

    std::string SetBinderTransactionAllocBufFormat()
    {
        const int64_t ts1 = 150;
        const uint64_t dataSize = 100;
        const uint64_t offsetSize = 200;
        BinderTransactionAllocBufFormat *binderAllocEvent = new BinderTransactionAllocBufFormat();
        binderAllocEvent->set_data_size(dataSize);
        binderAllocEvent->set_offsets_size(offsetSize);
        TracePluginResult tracePacket;
        FtraceCpuDetailMsg *ftraceCpuDetail = tracePacket.add_ftrace_cpu_detail();
        auto ftraceEvent = ftraceCpuDetail->add_event();
        ftraceEvent->set_timestamp(ts1);
        ftraceEvent->set_tgid(1);
        ftraceEvent->set_comm("app1");
        ftraceEvent->set_allocated_binder_transaction_alloc_buf_format(binderAllocEvent);

        std::string cpuDetailStrMsg = "";
        tracePacket.SerializeToString(&cpuDetailStrMsg);
        return cpuDetailStrMsg;
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

/**
 * @tc.name: BinderSenderfilterNeedReply
 * @tc.desc: Binary formate binder event test, The binder event needs reply
 * @tc.type: FUNC
 */
HWTEST_F(HtraceBinderEventTest, BinderSenderfilterNeedReply, TestSize.Level1)
{
    TS_LOGI("test10-1");

    PbreaderDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetBinderTransactionFormat();
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[0] == 0);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstArgSetData().Size() == 7);
}

/**
 * @tc.name: BinderSenderfilterNeedReplyAndReceive
 * @tc.desc: Binary formate binder event test, The binder event needs reply and received reply
 * @tc.type: FUNC
 */
HWTEST_F(HtraceBinderEventTest, BinderSenderfilterNeedReplyAndReceive, TestSize.Level1)
{
    TS_LOGI("test10-2");

    PbreaderDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetBinderTransactionFormat();
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstArgSetData().Size() == 7);

    PbreaderDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetBinderTransactionReceivedFormat();
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t *>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 2);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[0] == 0);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[1] == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstArgSetData().Size() == 11);
}

/**
 * @tc.name: BinderSenderfilterNeedReplyAndReceiveWithAlloc
 * @tc.desc: Binary formate BinderTransactionAllocBuf event test, The binder event needs reply and received reply
 * @tc.type: FUNC
 */
HWTEST_F(HtraceBinderEventTest, BinderSenderfilterNeedReplyAndReceiveWithAlloc, TestSize.Level1)
{
    TS_LOGI("test10-3");

    PbreaderDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetBinderTransactionFormat();
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool haveSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstArgSetData().Size() == 7);

    PbreaderDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetBinderTransactionAllocBufFormat();
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t *>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstArgSetData().Size() == 9);

    PbreaderDataSegment dataSeg3;
    dataSeg3.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetBinderTransactionReceivedFormat();
    dataSeg3.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView3(reinterpret_cast<const uint8_t *>(dataSeg3.seg->data()),
                                               dataSeg3.seg->size());
    dataSeg3.protoData = cpuDetailBytesView3;
    ProtoReader::TracePluginResult_Reader tracePluginResult3(dataSeg3.protoData);
    eventParser.ParseDataItem(dataSeg3, tracePluginResult3, haveSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 2);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[0] == 0);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[1] == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstArgSetData().Size() == 13);
}

/**
 * @tc.name: BinderSenderfilterNeedReplyAndReceiveNotmatch
 * @tc.desc: Binary formate BinderTransaction event test, The binder event needs reply but received not match
 * @tc.type: FUNC
 */
HWTEST_F(HtraceBinderEventTest, BinderSenderfilterNeedReplyAndReceiveNotmatch, TestSize.Level1)
{
    TS_LOGI("test10-4");

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    PbreaderDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetBinderTransactionFormat();
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;
    bool isSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, isSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);

    PbreaderDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetBinderTransactionReceivedFormat(2);
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t *>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, isSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[0] == 0);
}

/**
 * @tc.name: BinderSenderfilterNoNeedReply
 * @tc.desc: Binary formate binder event test, The binder event needs no reply
 * @tc.type: FUNC
 */
HWTEST_F(HtraceBinderEventTest, BinderSenderfilterNoNeedReply, TestSize.Level1)
{
    TS_LOGI("test10-5");

    PbreaderDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetBinderTransactionFormat();
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool isSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, isSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);
}

/**
 * @tc.name: BinderSenderNoneedReplyAndReceivefilter
 * @tc.desc: Binary formate binder event test, other party received and no need reply。
 * @tc.type: FUNC
 */
HWTEST_F(HtraceBinderEventTest, BinderSenderNoneedReplyAndReceivefilter, TestSize.Level1)
{
    TS_LOGI("test10-6");

    PbreaderDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetBinderTransactionFormat();
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool isSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, isSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);

    PbreaderDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetBinderTransactionReceivedFormat();
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t *>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, isSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 2);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[0] == 0);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[1] == 1);
}

/**
 * @tc.name: BinderSenderNoneedReplyAndReceivefilterNotmatch
 * @tc.desc: Binary formate binder event test, other party received but not match
 * @tc.type: FUNC
 */
HWTEST_F(HtraceBinderEventTest, BinderSenderNoneedReplyAndReceivefilterNotmatch, TestSize.Level1)
{
    TS_LOGI("test10-7");

    PbreaderDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetBinderTransactionFormat();
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool isSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, isSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);

    PbreaderDataSegment dataSeg2;
    dataSeg2.clockId = TS_CLOCK_BOOTTIME;
    cpuDetailStrMsg = SetBinderTransactionReceivedFormat(2);
    dataSeg2.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView2(reinterpret_cast<const uint8_t *>(dataSeg2.seg->data()),
                                               dataSeg2.seg->size());
    dataSeg2.protoData = cpuDetailBytesView2;
    ProtoReader::TracePluginResult_Reader tracePluginResult2(dataSeg2.protoData);
    eventParser.ParseDataItem(dataSeg2, tracePluginResult2, isSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 1);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().ArgSetIdsData()[0] == 0);
}

/**
 * @tc.name: BinderSenderfilterWrongReply
 * @tc.desc: Binary formate binder event test, other party replyed wrong Info
 * @tc.type: FUNC
 */
HWTEST_F(HtraceBinderEventTest, BinderSenderfilterWrongReply, TestSize.Level1)
{
    TS_LOGI("test10-8");

    PbreaderDataSegment dataSeg;
    dataSeg.clockId = TS_CLOCK_BOOTTIME;
    std::string cpuDetailStrMsg = SetBinderTransactionFormat(0x01, true);
    dataSeg.seg = std::make_shared<std::string>(cpuDetailStrMsg);
    ProtoReader::BytesView cpuDetailBytesView(reinterpret_cast<const uint8_t *>(dataSeg.seg->data()),
                                              dataSeg.seg->size());
    dataSeg.protoData = cpuDetailBytesView;

    HtraceEventParser eventParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool isSplit = false;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    eventParser.ParseDataItem(dataSeg, tracePluginResult, isSplit);
    eventParser.FilterAllEvents();
    EXPECT_TRUE(stream_.traceDataCache_->GetConstInternalSlicesData().Size() == 0);
    EXPECT_TRUE(stream_.traceDataCache_->GetConstArgSetData().Size() == 0);
}
} // namespace TraceStreamer
} // namespace SysTuning
