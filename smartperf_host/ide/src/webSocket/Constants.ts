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
export class Constants {
    static NODE_PORT = 19099;
    static INTERVAL_TIME = 30000;
    static LOGIN_PARAM = { type: 0, cmd: 1 };
    static LOGIN_CMD = 2;// cmd 2 有效 3无效
    static SESSION_EXCEED = 3; // session满了
    static GET_CMD = 1;
    static UPDATE_CMD = 3;
    static GET_VERSION_CMD = 1;
    static UPDATE_SUCCESS_CMD = 2; // 升级成功
    static UPDATE_FAIL_CMD = 4; // 升级失败
    static DISASSEMBLY_SAVE_CMD = 1;
    static DISASSEMBLY_SAVE_BACK_CMD = 2;
    static DISASSEMBLY_QUERY_CMD = 3;
    static DISASSEMBLY_QUERY_BACK_CMD = 4;
    static DISASSEMBLY_QUERY_ELF_CMD = 5;
}

export class TypeConstants {
    static LOGIN_TYPE = 0;
    static HEARTBEAT_TYPE = 1;
    static UPDATE_TYPE = 2;
    static DIAGNOSIS_TYPE = 8;
    static SENDDB_CMD = 1;
    static DIAGNOSIS_CMD = 3;
    static DISASSEMBLY_TYPE = 12;
    static ARKTS_TYPE = 9;
    static PROCESS_TYPE = 3;
    static USB_TYPE = 10;
    static USB_SN_CMD = 1;
    static USB_GET_PROCESS = 2;
    static USB_GET_CPU_COUNT = 3;
    static USB_GET_EVENT = 4;
    static USB_GET_APP = 5;
    static USB_GET_VERSION = 6;
    static USB_GET_HISYSTEM = 7;
}