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
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';

//并行度逻辑处理
export function HanldParalLogic(
    func: (dumpObj: unknown, value?: unknown, param?: unknown) => unknown,
    value: unknown,
    param?: unknown): unknown {
        // @ts-ignore
    let arr = value.stateItem;
    let waitArr: unknown = [];
    let globalTs: number = 0;
    let index: number = 0;
    // @ts-ignore
    while (index < arr.length || waitArr.length > 0) {
        // @ts-ignore
        let minEndTs = Math.min(...waitArr.map((item: unknown) => item.endTs));
        // @ts-ignore
        let minIndex = waitArr.findIndex((item: unknown) => item.endTs === minEndTs);
        //当waitArr为空时
      // @ts-ignore
        if (waitArr.length === 0) {
            globalTs = arr[index].ts;
            // @ts-ignore
            waitArr.push(arr[index]);
            index++;
            continue;
        }
        //当全局Ts等于minEndTs时，只做删除处理
        if (globalTs === minEndTs) {
            // @ts-ignore
            if (minIndex !== -1) { waitArr.splice(minIndex, 1) };
            continue;
        }
        let list = JSON.parse(JSON.stringify(waitArr));
        let dumpObj = {
            ts: 0,
            endTs: 0,
            listSlice: [],
            len: 0
        };
        //判断原队列的数据是否被用完，即是否为空
        if (index < arr.length) {
            if (arr[index].ts < minEndTs) {
                if (globalTs === arr[index].ts) {
                    // @ts-ignore
                    waitArr.push(arr[index]);
                    index++;
                    continue;
                } else {
                    dumpObj = {
                        ts: globalTs,
                        endTs: arr[index].ts,
                        listSlice: list,
                        len: list.length
                    };
                    // @ts-ignore
                    waitArr.push(arr[index]);
                    globalTs = arr[index].ts;
                    index++;
                }
            } else if (arr[index].ts >= minEndTs) {
                dumpObj = {
                    ts: globalTs,
                    endTs: minEndTs,
                    listSlice: list,
                    len: list.length
                };
                globalTs = minEndTs;
                // @ts-ignore
                if (minIndex !== -1) { waitArr.splice(minIndex, 1) };
            }
        } else {
            dumpObj = {
                ts: globalTs,
                endTs: minEndTs,
                listSlice: list,
                len: list.length
            };
            globalTs = minEndTs;
            // @ts-ignore
            if (minIndex !== -1) { waitArr.splice(minIndex, 1) };
        }
        param = func(dumpObj, value, param);
    }
    return param;
}

//表头点击事件
export function MeterHeaderClick(tab: LitTable | null | undefined, data: Array<unknown>): void {
    let labels = tab?.shadowRoot
        ?.querySelector('.th > .td')!
        .querySelectorAll('label');
    if (labels) {
        for (let i = 0; i < labels.length; i++) {
            let label = labels[i].innerHTML;
            labels[i].addEventListener('click', (e) => {
                if (label.includes('Process') && i === 0) {
                    tab!.setStatus(data, false);
                    tab!.recycleDs =
                        tab!.meauseTreeRowElement(
                            data,
                            RedrawTreeForm.Retract
                        );
                } else if (label.includes('Core') && i === 1) {
                    tab!.setStatus(data, true);
                    tab!.recycleDs =
                        tab!.meauseTreeRowElement(
                            data,
                            RedrawTreeForm.Expand
                        );
                }
            });
        }
    }
}