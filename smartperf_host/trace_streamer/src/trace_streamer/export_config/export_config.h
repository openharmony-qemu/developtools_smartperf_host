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

#ifndef EXPORT_CONFIG_H
#define EXPORT_CONFIG_H

#include <set>
#include <string>

namespace SysTuning {
namespace TraceStreamer {
class ExportConfig {
public:
    ExportConfig() = default;
    ~ExportConfig() = default;

    bool LoadConfig(const std::string &configPath);

    const std::set<std::string> &GetExportFilter() const;
    const std::set<std::string> &GetAllowedPluginNames() const;
    bool IsEventNeeded(const std::string &eventName) const;

private:
    void ComputeExportFilter();
    void ComputeAllowedPluginNames();
    bool ValidateCategories();
    void AddBaseTables(const std::set<std::string> &categories);

    std::set<std::string> categories_;
    std::set<std::string> exportTables_;
    std::set<std::string> exportFilter_;
    std::set<std::string> allowedPluginNames_;
    std::string lastError_;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // EXPORT_CONFIG_H
