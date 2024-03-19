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

#include "log.h"
bool g_cleanMode = false;
enum LogLevel g_curLogLevel = LOG_OFF;

bool SetLogLevel(const std::string& level)
{
    if (level == "D" || level == "DEBUG") {
        g_curLogLevel = LOG_DEBUG;
    } else if (level == "I" || level == "INFO") {
        g_curLogLevel = LOG_INFO;
    } else if (level == "W" || level == "WARN") {
        g_curLogLevel = LOG_WARN;
    } else if (level == "E" || level == "ERROR") {
        g_curLogLevel = LOG_ERROR;
    } else if (level == "F" || level == "FATAL") {
        g_curLogLevel = LOG_FATAL;
    } else if (level == "O" || level == "OFF") {
        g_curLogLevel = LOG_OFF;
    } else {
        return false;
    }
    return true;
}
