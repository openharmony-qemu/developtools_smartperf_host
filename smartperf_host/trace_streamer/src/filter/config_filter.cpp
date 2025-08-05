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

#include "config_filter.h"
namespace SysTuning {
namespace TraceStreamer {
bool CheckIfStartWithKeywords(const std::string &eventName, const std::vector<std::string> &keywords)
{
    for (auto &keyword : keywords) {
        if (StartWith(eventName, keyword)) {
            return true;
        }
    }
    return false;
}
bool CheckIfEndWithKeywords(const std::string &eventName, const std::vector<std::string> &keywords)
{
    for (auto &keyword : keywords) {
        if (EndWith(eventName, keyword)) {
            return true;
        }
    }
    return false;
}
ConfigFilter::ConfigFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter)
    : FilterBase(dataCache, filter)
{
}

ConfigFilter::~ConfigFilter() {}
bool ConfigFilter::SetConfig(const std::string &configFile)
{
    json configResult = json::parse(configFile, nullptr, false);
    if (configResult.is_discarded()) {
        TS_LOGE("Failed to parse config file.");
        return false;
    }
    InitConfig(configResult);
    return true;
}
void ConfigFilter::InitConfig(const json &config)
{
    if (config.contains("Animation") && !config["Animation"].empty()) {
        animationConfig_ = AnimationConfig(config["Animation"]);
    } else {
        animationConfig_ = AnimationConfig();
    }
    if (config.contains("AppStartup") && !config["AppStartup"].empty()) {
        appStartupConfig_ = AppStartupConfig(config["AppStartup"]);
    } else {
        appStartupConfig_ = AppStartupConfig();
    }
    if (config.contains("config") && !config["config"].empty()) {
        switchConfig_ = SwitchConfig(config["config"]);
    } else {
        switchConfig_ = SwitchConfig();
    }
    streamFilters_->animationFilter_->InitAnimationStartEvents();
}
const AnimationConfig &ConfigFilter::GetAnimationConfig() const
{
    return animationConfig_;
}

const AppStartupConfig &ConfigFilter::GetAppStartupConfig() const
{
    return appStartupConfig_;
}
const SwitchConfig &ConfigFilter::GetSwitchConfig() const
{
    return switchConfig_;
}

bool AnimationConfig::CheckIfAnimationEvents(const std::string &eventName) const
{
    return CheckIfEndWithKeywords(eventName, animationProcEvents_);
}

bool AnimationConfig::CheckIfFrameRateCmd(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, frameRateCmd_);
}
bool AnimationConfig::CheckIfRealFrameRateCmd(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, realFrameRateCmd_);
}
bool AnimationConfig::CheckIfFrameCountCmd(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, frameCountCmd_);
}
bool AnimationConfig::CheckIfFrameBeginCmd(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, frameBeginCmd_);
}
bool AnimationConfig::CheckIfScreenSizeCmd(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, screenSizeCmd_);
}
bool AnimationConfig::CheckIfFrameEndTimeCmd(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, frameEndTimeCmd_);
}
bool AnimationConfig::CheckIfParallelCmd(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, parallelCmd_);
}
bool AppStartupConfig::CheckIfPhase1(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, phase1_.start);
}
bool AppStartupConfig::CheckIfPhase2(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, phase2_.start);
}
bool AppStartupConfig::CheckIfPhase3(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, phase3_.start);
}
bool AppStartupConfig::CheckIfPhase4(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, phase4_.start);
}
bool AppStartupConfig::CheckIfPhase5(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, phase5_.start);
}
bool AppStartupConfig::CheckIfPhase6(const std::string &eventName) const
{
    return CheckIfStartWithKeywords(eventName, phase6_.start);
}

std::vector<std::string> AnimationConfig::GetOnAnimationStartEvents() const
{
    return onAnimationStartEvents_;
}
SwitchConfig::SwitchConfig(const json &config)
{
    appConfigEnabled_ = config.value("AppStartup", 0) == 1;
    animationConfigEnabled_ = config.value("AnimationAnalysis", 0) == 1;
    taskPoolConfigEnabled_ = config.value("TaskPool", 0) == 1;
    binderRunnableConfigEnabled_ = config.value("BinderRunnable", 0) == 1;
    HMKernelTraceEnabled_ = config.value("HMKernel", 0) == 1;
    rawTraceCutStartTsEnabled_ = config.value("RawTraceCutStartTs", 0) == 1;
    ffrtConvertEnabled_ = config.value("FfrtConvert", 0) == 1;
    std::string syscalls = config.value("System Calls", "");
    UpdateSyscallsTsSet(syscalls);
    TS_LOGI(
        "appConfigEnabled_=%d, animationConfigEnabled_=%d, taskPoolConfigEnabled_=%d, binderRunnableConfigEnabled_=%d, "
        "HMKernelTraceEnabled_=%d, rawTraceCutStartTsEnabled_=%d, ffrtConvertEnabled_=%d, syscalls=%s",
        appConfigEnabled_, animationConfigEnabled_, taskPoolConfigEnabled_, binderRunnableConfigEnabled_,
        HMKernelTraceEnabled_, rawTraceCutStartTsEnabled_, ffrtConvertEnabled_, syscalls.c_str());
}
bool SwitchConfig::AppConfigEnabled() const
{
    return appConfigEnabled_;
}
bool SwitchConfig::AnimationConfigEnabled() const
{
    return animationConfigEnabled_;
}
bool SwitchConfig::TaskPoolConfigEnabled() const
{
    return taskPoolConfigEnabled_;
}
bool SwitchConfig::BinderRunnableConfigEnabled() const
{
    return binderRunnableConfigEnabled_;
}
bool SwitchConfig::HMKernelTraceEnabled() const
{
    return HMKernelTraceEnabled_;
}
bool SwitchConfig::RawTraceCutStartTsEnabled() const
{
    return rawTraceCutStartTsEnabled_;
}
bool SwitchConfig::FfrtConfigEnabled() const
{
    return ffrtConvertEnabled_;
}
const std::set<uint32_t> &SwitchConfig::SyscallsTsSet() const
{
    return syscallNrSet_;
}
void SwitchConfig::UpdateSyscallsTsSet(const std::string &syscalls)
{
    std::stringstream ss(syscalls);
    std::string token;

    syscallNrSet_.clear();
    while (std::getline(ss, token, ';')) {
        syscallNrSet_.insert(std::stoi(token));
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
