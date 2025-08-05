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

#ifndef CONFIG_FILTER_H
#define CONFIG_FILTER_H
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <log.h>
#include <json.hpp>
#include "string_help.h"
#include "filter_base.h"
#include "trace_data_cache.h"
#include "trace_streamer_config.h"
#include "trace_streamer_filters.h"
#include "animation_filter.h"
namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::base;
using json = nlohmann::json;
bool CheckIfStartWithKeywords(const std::string &eventName, const std::vector<std::string> &keywords);
bool CheckIfEndWithKeywords(const std::string &eventName, const std::vector<std::string> &keywords);
class AnimationConfig {
public:
    AnimationConfig() = default;
    AnimationConfig(const json &config)
    {
        animationProcEvents_ = config.value("animationProcEvents_", std::vector<std::string>{});
        onAnimationStartEvents_ = config.value("onAnimationStartEvents_", std::vector<std::string>{});
        frameRateCmd_ = config.value("frameRateCmd_", std::vector<std::string>{});
        realFrameRateCmd_ = config.value("realFrameRateCmd_", std::vector<std::string>{});
        frameCountCmd_ = config.value("frameCountCmd_", std::vector<std::string>{});
        frameBeginCmd_ = config.value("frameBeginCmd_", std::vector<std::string>{});
        screenSizeCmd_ = config.value("screenSizeCmd_", std::vector<std::string>{});
        frameEndTimeCmd_ = config.value("frameEndTimeCmd_", std::vector<std::string>{});
        parallelCmd_ = config.value("parallelCmd_", std::vector<std::string>{});
    }
    ~AnimationConfig() = default;
    std::vector<std::string> GetOnAnimationStartEvents() const;
    bool CheckIfAnimationEvents(const std::string &eventName) const;
    bool CheckIfFrameRateCmd(const std::string &eventName) const;
    bool CheckIfRealFrameRateCmd(const std::string &eventName) const;
    bool CheckIfFrameCountCmd(const std::string &eventName) const;
    bool CheckIfFrameBeginCmd(const std::string &eventName) const;
    bool CheckIfScreenSizeCmd(const std::string &eventName) const;
    bool CheckIfFrameEndTimeCmd(const std::string &eventName) const;
    bool CheckIfParallelCmd(const std::string &eventName) const;

private:
    std::vector<std::string> animationProcEvents_;
    std::vector<std::string> onAnimationStartEvents_;
    std::vector<std::string> frameRateCmd_;
    std::vector<std::string> realFrameRateCmd_;
    std::vector<std::string> frameCountCmd_;
    std::vector<std::string> frameBeginCmd_;
    std::vector<std::string> screenSizeCmd_;
    std::vector<std::string> frameEndTimeCmd_;
    std::vector<std::string> parallelCmd_;
};
struct StartUpPhase {
    std::string pName;
    std::vector<std::string> start;
    std::vector<std::string> end;
};
class AppStartupConfig {
public:
    AppStartupConfig() = default;
    AppStartupConfig(const json &config)
    {
        phase1_ = GetPhaseValue(config, "phase1");
        phase2_ = GetPhaseValue(config, "phase2");
        phase3_ = GetPhaseValue(config, "phase3");
        phase4_ = GetPhaseValue(config, "phase4");
        phase5_ = GetPhaseValue(config, "phase5");
        phase6_ = GetPhaseValue(config, "phase6");
    }
    ~AppStartupConfig() = default;
    bool CheckIfPhase1(const std::string &eventName) const;
    bool CheckIfPhase2(const std::string &eventName) const;
    bool CheckIfPhase3(const std::string &eventName) const;
    bool CheckIfPhase4(const std::string &eventName) const;
    bool CheckIfPhase5(const std::string &eventName) const;
    bool CheckIfPhase6(const std::string &eventName) const;

private:
    StartUpPhase GetPhaseValue(const json &phaseConfig, const std::string &phaseName)
    {
        auto phaseContent = phaseConfig.value(phaseName, json::object());
        return {phaseContent.value("pName", ""), phaseContent.value("start", std::vector<std::string>{}),
                phaseContent.value("end", std::vector<std::string>{})};
    }
    StartUpPhase phase1_;
    StartUpPhase phase2_;
    StartUpPhase phase3_;
    StartUpPhase phase4_;
    StartUpPhase phase5_;
    StartUpPhase phase6_;
};

class SwitchConfig {
public:
    SwitchConfig() = default;
    SwitchConfig(const json &config);
    ~SwitchConfig() = default;
    bool AppConfigEnabled() const;
    bool AnimationConfigEnabled() const;
    bool TaskPoolConfigEnabled() const;
    bool BinderRunnableConfigEnabled() const;
    bool HMKernelTraceEnabled() const;
    bool RawTraceCutStartTsEnabled() const;
    bool FfrtConfigEnabled() const;
    const std::set<uint32_t> &SyscallsTsSet() const;

private:
    void UpdateSyscallsTsSet(const std::string &syscalls);

private:
    bool appConfigEnabled_ = false;
    bool animationConfigEnabled_ = false;
    bool taskPoolConfigEnabled_ = false;
    bool binderRunnableConfigEnabled_ = false;
    bool HMKernelTraceEnabled_ = false;
    bool rawTraceCutStartTsEnabled_ = false;
    bool ffrtConvertEnabled_ = false;
    std::set<uint32_t> syscallNrSet_;
};
class ConfigFilter : private FilterBase {
public:
    ConfigFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    ConfigFilter(const ConfigFilter &) = delete;
    ConfigFilter &operator=(const ConfigFilter &) = delete;
    ~ConfigFilter() override;
    bool SetConfig(const std::string &configFile);
    const AnimationConfig &GetAnimationConfig() const;
    const AppStartupConfig &GetAppStartupConfig() const;
    const SwitchConfig &GetSwitchConfig() const;

private:
    AnimationConfig animationConfig_;
    AppStartupConfig appStartupConfig_;
    SwitchConfig switchConfig_;
    void InitConfig(const json &config);
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // CONFIG_FILTER_H
