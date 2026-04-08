/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
class TypeConfig {
    static LOGIN_TYPE = 0;//先判断type  0（会话） 和 其他(业务)
    static HEARTBEAT_TYPE = 1;//心跳机制类型
    static UPDATE_TYPE = 2;// 版本更新
    static MAX_BUILTIN_TYPE = 7;//内置type为0-7
    static AI_TYPE = 8;//AI助手的type
    static USB_TYPE = 10; //usb
    static RECORD_ARKTS_TYPE = 9; //record功能的type
    static DISASSEMBLY_TYPE = 12; //disassembly功能的type
}

module.exports = {
    TypeConfig
}