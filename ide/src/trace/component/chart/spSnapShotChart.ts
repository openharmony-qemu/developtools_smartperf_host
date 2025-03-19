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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { BaseStruct } from '../../bean/BaseStruct';
import { SnapShotRender, SnapShotStruct } from '../../database/ui-worker/ProcedureWorkerSnaps';
import { rowThreadHandler } from './SpChartManager';
import { SpRecordTrace } from '../SpRecordTrace';

export class SpSnapShotChart {
    private readonly trace: SpSystemTrace;
    constructor(trace: SpSystemTrace) {
        this.trace = trace;
    }

    async init(parentRow?: TraceRow<BaseStruct>, traceId?: string): Promise<void> {
        SpRecordTrace.isSnapShotCapture = false;
        let traceRow = await this.initData(traceId);
        if (parentRow) {
            parentRow.addChildTraceRow(traceRow);
        } else {
            this.trace.rowsEL?.appendChild(traceRow);
        }
    }

    async initData(traceId?: string): Promise<TraceRow<SnapShotStruct>> {
        let snapShotTraceRow: TraceRow<SnapShotStruct> = TraceRow.skeleton<SnapShotStruct>(traceId);
        snapShotTraceRow.rowId = 'snapShot';
        snapShotTraceRow.index = 0;
        snapShotTraceRow.rowType = TraceRow.ROW_TYPE_SNAPSHOT;
        snapShotTraceRow.rowParentId = '';
        snapShotTraceRow.style.height = '150px';
        snapShotTraceRow.name = 'snapShot';
        snapShotTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        snapShotTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
        snapShotTraceRow.supplierFrame = async (): Promise<SnapShotStruct[]> => {
            const baseDuration = SpRecordTrace.snapShotDuration * 1000000;
            const baseStartTime = 0;
            const imageList = SpRecordTrace.snapShotList as string[];
            interface CachedImageInfo {
                img: string;
                startTime: number;
                dur: number;
            }
            const cachedImages: CachedImageInfo[] = imageList.map((img, index) => {
                const startTime = baseStartTime + index * baseDuration;
                return {
                    img: img,
                    startTime: startTime,
                    dur: baseDuration
                };
            });
            return cachedImages as unknown as SnapShotStruct[];
        };
        snapShotTraceRow.onThreadHandler = rowThreadHandler<SnapShotRender>('snap-shot', 'snapShotContext', {
            type: 'snapShots',
            translateY: snapShotTraceRow.translateY,
        }, snapShotTraceRow, this.trace);
        return snapShotTraceRow;
    }
}