/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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

#define private public
#include "ftrace_event_processor.h"
#include "filesystem_io_test_utils.h"
#include "securec.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace SysTuning {
namespace TraceStreamer {
namespace {
class FieldBuilder {
public:
    template <class T>
    void AppendInt(T value, EventFieldType type, bool isSigned)
    {
        const size_t offset = buffer_.size();
        buffer_.resize(buffer_.size() + sizeof(T));
        if (memcpy_s(&buffer_[offset], buffer_.capacity() - offset, &value, sizeof(T)) != EOK) {
            buffer_.clear();
        }
        FieldFormat f{};
        f.offset = offset;
        f.size = sizeof(T);
        f.isSigned = isSigned;
        f.filedType = type;
        formats_.push_back(f);
    }

    void AppendString(const std::string &s)
    {
        const size_t offset = buffer_.size();
        buffer_.resize(buffer_.size() + s.size());
        if (!s.empty() && memcpy_s(&buffer_[offset], buffer_.capacity() - offset, s.data(), s.size()) != EOK) {
            buffer_.clear();
        }
        FieldFormat f{};
        f.offset = offset;
        f.size = s.size();
        f.isSigned = false;
        f.filedType = FIELD_TYPE_FIXEDCSTRING;
        formats_.push_back(f);
    }

    EventFormat ToFormat() const
    {
        EventFormat fmt;
        fmt.fields = formats_;
        return fmt;
    }

    std::vector<uint8_t> buffer_{};
    std::vector<FieldFormat> formats_{};
};
} // namespace

class FileSystemIoFtraceEventProcessorTest : public ::testing::Test {
public:
    void SetUp() override {}
    void TearDown() override {}
};

HWTEST_F(FileSystemIoFtraceEventProcessorTest, BlockRqIssue_MapsFieldsInOrder, TestSize.Level1)
{
    FtraceEvent ev;
    FieldBuilder b;
    const uint64_t dev = MakeDev(8, 1);
    b.AppendInt<uint64_t>(dev, FIELD_TYPE_UINT64, false);
    b.AppendInt<uint64_t>(16, FIELD_TYPE_UINT64, false);
    b.AppendInt<uint32_t>(8, FIELD_TYPE_UINT32, false);
    b.AppendInt<uint32_t>(4096, FIELD_TYPE_UINT32, false);
    b.AppendString("W");
    b.AppendString("kworker");
    b.AppendString("cmd");

    auto fmt = b.ToFormat();
    ASSERT_TRUE(FtraceEventProcessor::GetInstance().BlockRqIssue(ev, b.buffer_.data(), b.buffer_.size(), fmt));

    const auto &msg = ev.block_rq_issue_format();
    EXPECT_EQ(msg.dev(), dev);
    EXPECT_EQ(msg.sector(), 16u);
    EXPECT_EQ(msg.nr_sector(), 8u);
    EXPECT_EQ(msg.bytes(), 4096u);
    EXPECT_EQ(msg.rwbs(), "W");
    EXPECT_EQ(msg.comm(), "kworker");
    EXPECT_EQ(msg.cmd(), "cmd");
}

HWTEST_F(FileSystemIoFtraceEventProcessorTest, BlockRqComplete_MapsErrorTypeAndStrings, TestSize.Level1)
{
    FtraceEvent ev;
    FieldBuilder b;
    const uint64_t dev = MakeDev(8, 1);
    b.AppendInt<uint64_t>(dev, FIELD_TYPE_UINT64, false);
    b.AppendInt<uint64_t>(16, FIELD_TYPE_UINT64, false);
    b.AppendInt<uint32_t>(8, FIELD_TYPE_UINT32, false);
    b.AppendInt<int32_t>(-5, FIELD_TYPE_INT32, true);
    b.AppendString("R");
    b.AppendString("cmd2");

    auto fmt = b.ToFormat();
    ASSERT_TRUE(FtraceEventProcessor::GetInstance().BlockRqComplete(ev, b.buffer_.data(), b.buffer_.size(), fmt));

    const auto &msg = ev.block_rq_complete_format();
    EXPECT_EQ(msg.dev(), dev);
    EXPECT_EQ(msg.sector(), 16u);
    EXPECT_EQ(msg.nr_sector(), 8u);
    EXPECT_EQ(msg.error(), -5);
    EXPECT_EQ(msg.rwbs(), "R");
    EXPECT_EQ(msg.cmd(), "cmd2");
}

HWTEST_F(FileSystemIoFtraceEventProcessorTest, HmfsReadEnterExit_MapsInt64AndResType, TestSize.Level1)
{
    {
        FtraceEvent ev;
        FieldBuilder b;
        const uint64_t dev = MakeDev(8, 1);
        b.AppendInt<uint64_t>(dev, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(1, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(0, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(4, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(1024, FIELD_TYPE_UINT64, false);
        b.AppendString("hello.txt");

        auto fmt = b.ToFormat();
        ASSERT_TRUE(FtraceEventProcessor::GetInstance().HmfsReadEnter(ev, b.buffer_.data(), b.buffer_.size(), fmt));
        const auto &msg = ev.hmfs_read_enter_format();
        EXPECT_EQ(msg.dev(), dev);
        EXPECT_EQ(msg.ino(), 1u);
        EXPECT_EQ(msg.off(), 0u);
        EXPECT_EQ(msg.size(), 4u);
        EXPECT_EQ(msg.i_size(), 1024u);
        EXPECT_EQ(msg.name(), "hello.txt");
    }
    {
        FtraceEvent ev;
        FieldBuilder b;
        const uint64_t dev = MakeDev(8, 1);
        b.AppendInt<uint64_t>(dev, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(1, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(4, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(4, FIELD_TYPE_UINT64, false);
        b.AppendInt<int64_t>(-1, FIELD_TYPE_INT64, true);

        auto fmt = b.ToFormat();
        ASSERT_TRUE(FtraceEventProcessor::GetInstance().HmfsReadExit(ev, b.buffer_.data(), b.buffer_.size(), fmt));
        const auto &msg = ev.hmfs_read_exit_format();
        EXPECT_EQ(msg.dev(), dev);
        EXPECT_EQ(msg.ino(), 1u);
        EXPECT_EQ(msg.off(), 4u);
        EXPECT_EQ(msg.size(), 4u);
        EXPECT_EQ(msg.res(), -1);
    }
}

HWTEST_F(FileSystemIoFtraceEventProcessorTest, HmfsWriteEnterExit_MapsFields, TestSize.Level1)
{
    {
        FtraceEvent ev;
        FieldBuilder b;
        const uint64_t dev = MakeDev(8, 1);
        b.AppendInt<uint64_t>(dev, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(1, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(0, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(4, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(1024, FIELD_TYPE_UINT64, false);
        b.AppendString("hello.txt");

        auto fmt = b.ToFormat();
        ASSERT_TRUE(FtraceEventProcessor::GetInstance().HmfsWriteEnter(ev, b.buffer_.data(), b.buffer_.size(), fmt));
        const auto &msg = ev.hmfs_write_enter_format();
        EXPECT_EQ(msg.dev(), dev);
        EXPECT_EQ(msg.name(), "hello.txt");
    }
    {
        FtraceEvent ev;
        FieldBuilder b;
        const uint64_t dev = MakeDev(8, 1);
        b.AppendInt<uint64_t>(dev, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(1, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(4, FIELD_TYPE_UINT64, false);
        b.AppendInt<uint64_t>(4, FIELD_TYPE_UINT64, false);
        b.AppendInt<int64_t>(4, FIELD_TYPE_INT64, true);

        auto fmt = b.ToFormat();
        ASSERT_TRUE(FtraceEventProcessor::GetInstance().HmfsWriteExit(ev, b.buffer_.data(), b.buffer_.size(), fmt));
        const auto &msg = ev.hmfs_write_exit_format();
        EXPECT_EQ(msg.dev(), dev);
        EXPECT_EQ(msg.res(), 4);
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
