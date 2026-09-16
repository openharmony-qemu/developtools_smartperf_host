/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2023. All rights reserved.
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

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <fstream>
#include <string>

#define private public
#include "trace_streamer/export_config/export_config.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace {
constexpr const char *TEST_CONFIG_DIR = "/tmp/export_config_test/";
constexpr const char *NETWORK_CONFIG = R"({"categories": ["network"]})";
constexpr const char *CALLSTACK_CONFIG = R"({"tables": ["callstack"]})";
constexpr const char *FTRACE_CONFIG = R"({"categories": ["ftrace"]})";
constexpr const char *INVALID_CATEGORY_CONFIG = R"({"categories": ["invalid_category"]})";
constexpr const char *EMPTY_CONFIG = R"({})";
constexpr const char *BOTH_EMPTY_CONFIG = R"({"categories": [], "tables": []})";

void WriteTestFile(const std::string &path, const std::string &content)
{
    std::ofstream ofs(path);
    ofs << content;
    ofs.close();
}
} // namespace

class ExportConfigTest : public ::testing::Test {
public:
    void SetUp()
    {
        std::string cmd = "mkdir -p " + std::string(TEST_CONFIG_DIR);
        (void)system(cmd.c_str());
    }

    void TearDown()
    {
        std::string cmd = "rm -rf " + std::string(TEST_CONFIG_DIR);
        (void)system(cmd.c_str());
    }
};

/**
 * @tc.name: ExportConfigTest001
 * @tc.desc: Test base table dependency completion with categories=["network"]
 *           exportFilter should contain process+thread+stat+datasource_clockid,
 *           but NOT args/data_dict
 */
HWTEST_F(ExportConfigTest, ExportConfigTest001, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "network.json";
    WriteTestFile(configPath, NETWORK_CONFIG);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    const auto &filter = config.GetExportFilter();
    EXPECT_NE(filter.find("process"), filter.end());
    EXPECT_NE(filter.find("thread"), filter.end());
    EXPECT_NE(filter.find("stat"), filter.end());
    EXPECT_NE(filter.find("datasource_clockid"), filter.end());

    EXPECT_EQ(filter.find("args"), filter.end());
    EXPECT_EQ(filter.find("data_dict"), filter.end());
}

/**
 * @tc.name: ExportConfigTest002
 * @tc.desc: Test base table dependency completion with tables=["callstack"]
 *           exportFilter should contain callstack+args+data_dict+stat+thread+datasource_clockid (6 tables)
 */
HWTEST_F(ExportConfigTest, ExportConfigTest002, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "callstack.json";
    WriteTestFile(configPath, CALLSTACK_CONFIG);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    const auto &filter = config.GetExportFilter();
    EXPECT_NE(filter.find("callstack"), filter.end());
    EXPECT_NE(filter.find("args"), filter.end());
    EXPECT_NE(filter.find("data_dict"), filter.end());
    EXPECT_NE(filter.find("stat"), filter.end());
    EXPECT_NE(filter.find("thread"), filter.end());
    EXPECT_NE(filter.find("datasource_clockid"), filter.end());
}

/**
 * @tc.name: ExportConfigTest003
 * @tc.desc: Test invalid category name returns false
 */
HWTEST_F(ExportConfigTest, ExportConfigTest003, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "invalid.json";
    WriteTestFile(configPath, INVALID_CATEGORY_CONFIG);

    ExportConfig config;
    EXPECT_FALSE(config.LoadConfig(configPath));
}

/**
 * @tc.name: ExportConfigTest004
 * @tc.desc: Test valid config parsing with categories=["ftrace"]
 */
HWTEST_F(ExportConfigTest, ExportConfigTest004, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "ftrace.json";
    WriteTestFile(configPath, FTRACE_CONFIG);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    const auto &filter = config.GetExportFilter();
    EXPECT_NE(filter.find("sched_slice"), filter.end());
    EXPECT_NE(filter.find("thread_state"), filter.end());
    EXPECT_NE(filter.find("callstack"), filter.end());
    EXPECT_NE(filter.find("irq"), filter.end());
    EXPECT_NE(filter.find("filesystem_io"), filter.end());
    EXPECT_NE(filter.find("measure"), filter.end());
    EXPECT_NE(filter.find("syscall"), filter.end());
    EXPECT_NE(filter.find("dma_fence"), filter.end());
    EXPECT_NE(filter.find("instant"), filter.end());
    EXPECT_NE(filter.find("raw"), filter.end());
    EXPECT_NE(filter.find("timerfd_wakeup"), filter.end());

    EXPECT_NE(filter.find("process"), filter.end());
    EXPECT_NE(filter.find("thread"), filter.end());
    EXPECT_NE(filter.find("args"), filter.end());
    EXPECT_NE(filter.find("stat"), filter.end());
    EXPECT_NE(filter.find("data_dict"), filter.end());
    EXPECT_NE(filter.find("symbols"), filter.end());
    EXPECT_NE(filter.find("datasource_clockid"), filter.end());
}

/**
 * @tc.name: ExportConfigTest005
 * @tc.desc: Test empty config (both categories and tables empty) returns false
 */
HWTEST_F(ExportConfigTest, ExportConfigTest005, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "empty.json";
    WriteTestFile(configPath, EMPTY_CONFIG);

    ExportConfig config;
    EXPECT_FALSE(config.LoadConfig(configPath));
}

/**
 * @tc.name: ExportConfigTest006
 * @tc.desc: Test both empty arrays config returns false
 */
HWTEST_F(ExportConfigTest, ExportConfigTest006, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "both_empty.json";
    WriteTestFile(configPath, BOTH_EMPTY_CONFIG);

    ExportConfig config;
    EXPECT_FALSE(config.LoadConfig(configPath));
}

/**
 * @tc.name: ExportConfigTest007
 * @tc.desc: Test non-existent config file returns false
 */
HWTEST_F(ExportConfigTest, ExportConfigTest007, TestSize.Level1)
{
    ExportConfig config;
    EXPECT_FALSE(config.LoadConfig("/tmp/export_config_test/nonexistent.json"));
}

/**
 * @tc.name: ExportConfigTest008
 * @tc.desc: Test IsEventNeeded with tables=["callstack"] - events that map to callstack should be needed
 *           tracing_mark_write→callstack, binder_transaction→callstack, print→callstack
 */
HWTEST_F(ExportConfigTest, ExportConfigTest008, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "callstack_ev.json";
    WriteTestFile(configPath, CALLSTACK_CONFIG);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    EXPECT_TRUE(config.IsEventNeeded("tracing_mark_write"));
    EXPECT_TRUE(config.IsEventNeeded("binder_transaction"));
    EXPECT_TRUE(config.IsEventNeeded("print"));
}

/**
 * @tc.name: ExportConfigTest009
 * @tc.desc: Test IsEventNeeded with tables=["callstack"] - events NOT mapping to callstack should NOT be needed
 *           sched_switch→sched_slice,thread_state; irq_handler_entry→irq; cpu_frequency→measure
 */
HWTEST_F(ExportConfigTest, ExportConfigTest009, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "callstack_not_needed.json";
    WriteTestFile(configPath, CALLSTACK_CONFIG);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    EXPECT_FALSE(config.IsEventNeeded("sched_switch"));
    EXPECT_FALSE(config.IsEventNeeded("irq_handler_entry"));
    EXPECT_FALSE(config.IsEventNeeded("cpu_frequency"));
}

/**
 * @tc.name: ExportConfigTest010
 * @tc.desc: Test IsEventNeeded returns true for all events when no config is loaded (empty filter)
 */
HWTEST_F(ExportConfigTest, ExportConfigTest010, TestSize.Level1)
{
    ExportConfig config;
    EXPECT_TRUE(config.IsEventNeeded("sched_switch"));
    EXPECT_TRUE(config.IsEventNeeded("tracing_mark_write"));
    EXPECT_TRUE(config.IsEventNeeded("any_unknown_event"));
}

/**
 * @tc.name: ExportConfigTest011
 * @tc.desc: Test IsEventNeeded returns true for events not in EVENT_TO_TABLES map
 *           Unknown events should be needed (conservative approach)
 */
HWTEST_F(ExportConfigTest, ExportConfigTest011, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "callstack_unknown.json";
    WriteTestFile(configPath, CALLSTACK_CONFIG);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    EXPECT_TRUE(config.IsEventNeeded("some_unknown_event"));
    EXPECT_TRUE(config.IsEventNeeded("random_event_not_in_map"));
}

/**
 * @tc.name: ExportConfigTest012
 * @tc.desc: Test GetAllowedPluginNames with categories=["ftrace"]
 *           ftrace-plugin should be in allowed plugin names
 */
HWTEST_F(ExportConfigTest, ExportConfigTest012, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "ftrace_plugins.json";
    WriteTestFile(configPath, FTRACE_CONFIG);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    const auto &plugins = config.GetAllowedPluginNames();
    EXPECT_NE(plugins.find("ftrace-plugin"), plugins.end());
    EXPECT_NE(plugins.find("/data/local/tmp/libftrace_plugin.z.so"), plugins.end());
}

/**
 * @tc.name: ExportConfigTest013
 * @tc.desc: Test GetAllowedPluginNames with tables=["callstack"]
 *           ftrace-plugin and ffrt-profiler should be allowed (both produce callstack)
 */
HWTEST_F(ExportConfigTest, ExportConfigTest013, TestSize.Level1)
{
    std::string configPath = std::string(TEST_CONFIG_DIR) + "callstack_plugins.json";
    WriteTestFile(configPath, CALLSTACK_CONFIG);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    const auto &plugins = config.GetAllowedPluginNames();
    EXPECT_NE(plugins.find("ftrace-plugin"), plugins.end());
    EXPECT_NE(plugins.find("ffrt-profiler"), plugins.end());
}

/**
 * @tc.name: ExportConfigTest014
 * @tc.desc: Test combined categories+tables config
 */
HWTEST_F(ExportConfigTest, ExportConfigTest014, TestSize.Level1)
{
    std::string combinedConfig = R"({"categories": ["network"], "tables": ["callstack"]})";
    std::string configPath = std::string(TEST_CONFIG_DIR) + "combined.json";
    WriteTestFile(configPath, combinedConfig);

    ExportConfig config;
    ASSERT_TRUE(config.LoadConfig(configPath));

    const auto &filter = config.GetExportFilter();
    EXPECT_NE(filter.find("network"), filter.end());
    EXPECT_NE(filter.find("network_time_information"), filter.end());
    EXPECT_NE(filter.find("callstack"), filter.end());
    EXPECT_NE(filter.find("args"), filter.end());
    EXPECT_NE(filter.find("data_dict"), filter.end());
    EXPECT_NE(filter.find("stat"), filter.end());
}
