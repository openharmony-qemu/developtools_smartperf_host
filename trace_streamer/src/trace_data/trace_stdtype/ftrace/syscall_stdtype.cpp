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
#include "syscall_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t SysCall::AppendSysCallData(int64_t sysCallNum, DataIndex type, uint32_t ipid, uint64_t timeStamp, int64_t ret)
{
    sysCallNums_.emplace_back(sysCallNum);
    types_.emplace_back(type);
    ipids_.emplace_back(ipid);
    timeStamps_.emplace_back(timeStamp);
    rets_.emplace_back(ret);
    return Size() - 1;
}
} // namespace TraceStdtype
} // namespace SysTuning
