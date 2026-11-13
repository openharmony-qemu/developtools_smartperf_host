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

import { HdcCommand } from './HdcCommand';
import { CMDSTR_FILE_RECV, CMDSTR_FILE_SEND, CMDSTR_SHELL } from '../common/ConstantType';
import { log } from '../../log/Log';

export class FormatCommand {
  cmdFlag: number; // uint16_t
  parameters: string; //string
  bJumpDo: boolean; // boolean

  constructor(cmdFlag: number, parameters: string, bJumpDo: boolean) {
    this.cmdFlag = cmdFlag;
    this.parameters = parameters;
    this.bJumpDo = bJumpDo;
  }

  static string2FormatCommand(cmd: string): FormatCommand {
    log('Command  : ' + cmd);
    let formatCommand = new FormatCommand(-1, '', false);
    if (cmd.startsWith(CMDSTR_SHELL + ' ')) {
      formatCommand.cmdFlag = HdcCommand.CMD_UNITY_EXECUTE;
      formatCommand.parameters = cmd.substring((CMDSTR_SHELL + ' ').length);
    } else if (cmd.startsWith(CMDSTR_SHELL)) {
      formatCommand.cmdFlag = HdcCommand.CMD_SHELL_INIT;
    } else if (cmd.startsWith(CMDSTR_FILE_RECV)) {
      formatCommand.cmdFlag = HdcCommand.CMD_FILE_INIT;
      formatCommand.parameters = cmd.substring((CMDSTR_FILE_RECV + ' ').length);
    } else if (cmd.startsWith(CMDSTR_FILE_SEND)) {
      formatCommand.cmdFlag = HdcCommand.CMD_FILE_INIT;
      formatCommand.parameters = cmd.substring((CMDSTR_FILE_SEND + ' ').length);
    } else {
      formatCommand.bJumpDo = true;
    }
    log('formatCommand  cmdFlag is : ' + formatCommand.cmdFlag);
    log('formatCommand  parameters is : ' + formatCommand.parameters);
    log('formatCommand  bJumpDo is : ' + formatCommand.bJumpDo);
    return formatCommand;
  }
}
