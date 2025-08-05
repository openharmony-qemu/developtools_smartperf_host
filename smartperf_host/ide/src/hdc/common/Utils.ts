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

import { FormatCommand } from '../hdcclient/FormatCommand';
import { warn } from '../../log/Log';

export class Utils {
  private static localId = 1;

  public static getSessionId(): number {
    return Math.round(Math.random() * 100000000);
  }

  public static getLocalId(): number {
    if (this.localId === 4294967295) {
      this.localId = 1;
    }
    return this.localId++;
  }

  public static formatCommand(cmd: string): FormatCommand {
    let command = cmd;
    if (cmd.startsWith('hdc_std')) {
      command = command.substring('hdc_std '.length);
    } else if (cmd.startsWith('hdc')) {
      command = command.substring('hdc '.length);
    }
    let formatCommand = FormatCommand.string2FormatCommand(command);
    // formatCommand Success
    if (formatCommand.cmdFlag <= -1) {
      warn(`command : ${command} is not Support`);
    }
    return formatCommand;
  }

  public static numToHexString(num: number): string {
    if (num === undefined || num === null || isNaN(num)) {
      return '0x0';
    }
    if (num < 0) {
      return `0x${(num >>> 0).toString(16)}`;
    } else {
      return `0x${num.toString(16)}`;
    }
  }
}
