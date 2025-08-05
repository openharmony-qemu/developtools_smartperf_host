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
import { type JsCpuProfilerChartFrame } from '../bean/JsStruct';
import { type SnapshotStruct } from '../database/ui-worker/ProcedureWorkerSnapshot';
import { type RangeSelectStruct, TraceRow } from './trace/base/TraceRow';
import { KeyPathStruct } from '../bean/KeyPathStruct';
import { warn } from '../../log/Log';

export function setSelectState(
  data: JsCpuProfilerChartFrame,
  frameSelectDataIdArr: Array<number>,
  parent?: JsCpuProfilerChartFrame
): void {
  if (TraceRow.rangeSelectObject?.startNS && TraceRow.rangeSelectObject?.endNS) {
    let startTime = 0;
    let endTime = 0;
    if (data.startTime < TraceRow.rangeSelectObject?.startNS) {
      startTime = TraceRow.rangeSelectObject?.startNS;
    } else {
      startTime = data.startTime;
    }
    if (data.endTime > TraceRow.rangeSelectObject.endNS) {
      endTime = TraceRow.rangeSelectObject?.endNS;
    } else {
      endTime = data.endTime;
    }
    data.totalTime = endTime - startTime;
    data.selfTime = data.totalTime;
    if (parent) {
      parent.selfTime -= data.totalTime;
    }
  }

  data.isSelect = true;
  if (data.children.length > 0) {
    for (let child of data.children) {
      if (child === null) {
        continue;
      }
      if (frameSelectDataIdArr.includes(child.id)) {
        setSelectState(child, frameSelectDataIdArr, data);
      }
    }
  }
}

export function intersectData(row: TraceRow<any>): any[] {
  let isIntersect = (snapshotStruct: SnapshotStruct, rangeSelectStruct: RangeSelectStruct): boolean =>
    Math.max(snapshotStruct.startNs! + snapshotStruct.dur!, rangeSelectStruct!.endNS || 0) -
      Math.min(snapshotStruct.startNs!, rangeSelectStruct!.startNS || 0) <
    snapshotStruct.dur! + (rangeSelectStruct!.endNS || 0) - (rangeSelectStruct!.startNS || 0);
  let intersectData = row.dataListCache.filter((struct: SnapshotStruct) => {
    return isIntersect(struct, TraceRow.rangeSelectObject!);
  });
  return intersectData;
}
export function isExistPidInArray(arr: Array<{ pid: number; ipid: number }>, pid: number): boolean {
  return arr.some((item) => item.pid === pid);
}

/**
 * 校验导入的json, 导出数据结构, 不匹配的不导入
 * @param content json 内容
 * @returns Array<KeyPathStruct>
 */
export function parseKeyPathJson(content: string): Array<KeyPathStruct> {
  const threads = JSON.parse(content);
  const parseResult = [];
  for (let threadKey in threads) {
    const tsArray = threads[threadKey];
    threadKey = threadKey.trim();
    const regex = /\[(\d+)\]/;
    const matches = threadKey.match(regex);
    const tid = matches ? parseInt(matches[1]) : -1;
    const spaceIndex = threadKey.indexOf(' ');
    const threadName = spaceIndex !== -1 ? threadKey.substring(0, spaceIndex) : '';
    if (tid && threadName && tsArray.length > 0) {
      const keyPath = new KeyPathStruct(tid, threadName, tsArray);
      parseResult.push(keyPath);
    } else {
      warn('parse key path fail ', threadKey);
    }
  }
  return parseResult;
}

export function debounce(func: any, delay: number) {
  let timer: any = null;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func();
    }, delay);
  };
}
