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

#include "proto_reader_help.h"
namespace SysTuning {
namespace ProtoReader {
const uint8_t *VarIntDecode(const uint8_t *start, const uint8_t *end, uint64_t *varIntValue)
{
    const uint8_t *cursor = start;
    uint64_t temp = 0;
    uint32_t shift = 0;
    do {
        uint8_t currentByte = *cursor++;
        temp |= static_cast<uint64_t>(currentByte & varIntValueMask) << shift;
        if (!(currentByte & byteHighestBitMark)) {
            *varIntValue = temp;
            return cursor;
        }
        shift += varIntValueBits;
    } while (cursor < end && shift < varIntValueDecodeMaxOffset);
    *varIntValue = 0;
    return start;
}
} // namespace ProtoReader
} // namespace SysTuning
