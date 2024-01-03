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

import { SampleType } from '../database/logic-worker/ProcedureLogicWorkerJsCpuProfiler';
const ROW_TYPE = 'cpu-profiler';
export class JsCpuProfilerUIStruct {
  nameId: number;
  depth: number;
  selfTime: number;
  totalTime: number;
  urlId: number;
  line: number;
  column: number;
  scriptName: string;
  id: number;
  parentId: number;

  constructor(
    id: number,
    nameId: number,
    depth: number,
    selfTime: number,
    totalTime: number,
    urlId: number,
    line: number,
    column: number
  ) {
    this.id = id;
    this.parentId = -1;
    this.nameId = nameId;
    this.depth = depth;
    this.selfTime = selfTime;
    this.totalTime = totalTime;
    this.urlId = urlId;
    this.line = line;
    this.column = column;
    this.scriptName = '';
  }
}

export class JsCpuProfilerChartFrame extends JsCpuProfilerUIStruct {
  nameId: number;
  urlId: number;
  startTime: number;
  endTime: number;
  children: Array<JsCpuProfilerChartFrame>;
  childrenIds: Array<any>;
  samplesIds: Array<number>;
  isSelect: boolean = false;
  parent?: JsCpuProfilerChartFrame;

  constructor(
    id: number,
    nameId: number,
    startTime: number,
    endTime: number,
    totalTime: number,
    depth: number,
    urlId: number,
    line: number,
    column: number
  ) {
    super(id, nameId, depth, 0, totalTime, urlId, line, column);
    this.id = id;
    this.startTime = startTime;
    this.endTime = endTime;
    this.nameId = nameId;
    this.urlId = urlId;
    this.children = new Array<JsCpuProfilerChartFrame>();
    this.samplesIds = new Array<number>();
    this.childrenIds = new Array<number>();
  }
}

export class JsCpuProfilerTabStruct extends JsCpuProfilerUIStruct {
  rowName = ROW_TYPE;
  parent?: JsCpuProfilerTabStruct | null | undefined;
  children: Array<JsCpuProfilerTabStruct>;
  chartFrameChildren?: Array<JsCpuProfilerChartFrame>;
  isSelected: boolean = false; //select data line
  totalTimePercent: string = '';
  selfTimePercent: string = '';
  symbolName: string = ''; // function name + scriptName
  selfTimeStr: string = ''; //selfTime unit conversion
  totalTimeStr: string = ''; //totalTime unit conversion
  isSearch: boolean = false; //filter data bold
  status: boolean = false;
  name: string = '';

  constructor(
    nameId: number,
    selfTime: number,
    totalTime: number,
    depth: number,
    urlId: number,
    line: number,
    column: number,
    scriptName: string,
    id: number
  ) {
    super(id, nameId, depth, selfTime, totalTime, urlId, line, column);
    this.chartFrameChildren = new Array<JsCpuProfilerChartFrame>();
    this.children = new Array<JsCpuProfilerTabStruct>();
    this.scriptName = scriptName;
  }
}

export class JsCpuProfilerStatisticsStruct {
  type: SampleType | string;
  time: number = 0;
  timeStr: string = '';
  percentage: string = '';
  constructor(type: SampleType | string, time: number, timeStr: string, percentage: string) {
    this.type = type;
    this.time = time;
    this.timeStr = timeStr;
    this.percentage = percentage;
  }
}
