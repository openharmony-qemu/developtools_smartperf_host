/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
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

export enum HdcCommand {
  // core commands types
  CMD_KERNEL_HELP = 0,
  CMD_KERNEL_HANDSHAKE = 1,
  CMD_KERNEL_CHANNEL_CLOSE = 2,
  CMD_KERNEL_SERVER_KILL = 3,
  CMD_KERNEL_TARGET_DISCOVER = 4,
  CMD_KERNEL_TARGET_LIST = 5,
  CMD_KERNEL_TARGET_ANY = 6,
  CMD_KERNEL_TARGET_CONNECT = 7,
  CMD_KERNEL_TARGET_DISCONNECT = 8,
  CMD_KERNEL_ECHO = 9,
  CMD_KERNEL_ECHO_RAW = 10,
  CMD_KERNEL_ENABLE_KEEPALIVE = 11,
  CMD_KERNEL_WAKEUP_SLAVETASK = 12,
  // One-pass simple commands
  CMD_UNITY_COMMAND_HEAD = 1000, // not use
  CMD_UNITY_EXECUTE = 1001,
  CMD_UNITY_REMOUNT = 1002,
  CMD_UNITY_REBOOT = 1003,
  CMD_UNITY_RUNMODE = 1004,
  CMD_UNITY_HILOG = 1005,
  CMD_UNITY_TERMINATE = 1006,
  CMD_UNITY_ROOTRUN = 1007,
  CMD_JDWP_LIST = 1008,
  CMD_JDWP_TRACK = 1009,
  CMD_UNITY_COMMAND_TAIL = 1010, // not use
  // It will be separated from unity in the near future
  CMD_UNITY_BUGREPORT_INIT = 1011,
  CMD_UNITY_BUGREPORT_DATA = 1012,
  // Shell commands types
  CMD_SHELL_INIT = 2000,
  CMD_SHELL_DATA = 2001,
  // File commands
  CMD_FILE_INIT = 3000,
  CMD_FILE_CHECK = 3001,
  CMD_FILE_BEGIN = 3002,
  CMD_FILE_DATA = 3003,
  CMD_FILE_FINISH = 3004,
  // App commands
  CMD_APP_SIDELOAD = 3005,
  CMD_APP_INIT = 3500,
  CMD_APP_CHECK = 3501,
  CMD_APP_BEGIN = 3502,
  CMD_APP_DATA = 3503,
  CMD_APP_FINISH = 3504,
  CMD_APP_UNINSTALL = 3505,
}
