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

export class PerfFunctionAsmParam {
  totalCount: number = 0;
  functionName: string = '';
  vaddrList: Array<unknown> = [];
}

export class FormattedAsmInstruction {
    selfcount: number = 0;
    percent: number = 0;
    addr: number = 0;
    instruction: string = '';
    sourceLine: string = '';
}

export class OriginAsmInstruction {
  addr: string = '';
  instruction: string = '';
  sourceLine: string = '';
}

export class PerfFunctionAsmShowUpData {
  addr: number = 0;
  instruction: string = '';
  selfCount: number = 0;
  percent: number = 0;
}

