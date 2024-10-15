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
    static INTERVAL_TIME = 30000;
    static LOGIN_PARAM = { type: 0, cmd: 1 };
    static LOGIN_CMD = 2;// cmd 2 有效 3无效
}

export class TypeConstants {
    static LOGIN_TYPE = 0;// 先判断type  0（登录） 和 其他(业务)
    static HEARTBEAT_TYPE = 1;
    static DIAGNOSIS_TYPE = 8;
    static SENDDB_CMD = 1;
    static DIAGNOSIS_CMD = 3;
}