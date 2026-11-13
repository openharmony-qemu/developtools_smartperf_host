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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { NetworkTimeInformation, NetworkRequestStruct } from '../../bean/NetworkStruct';
import { queryNetworkDetailData, queryNetworkTimeInformation } from '../../database/sql/Network.sql';

export class ProcessNetworkDetailChart {
  private trace: SpSystemTrace;
  private networkDetailData: Array<NetworkRequestStruct> = [];
  private timeInformation: Map<number, NetworkTimeInformation> = new Map();

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(processId: number, traceRow: TraceRow<NetworkRequestStruct>): Promise<void> {
    const startNS = TraceRow.range!.startNS || 0;
    const endNS = TraceRow.range!.endNS || 0;
    this.networkDetailData = await queryNetworkDetailData(
      processId,
      startNS,
      endNS
    );

    const timeInfoArray = await queryNetworkTimeInformation(
      startNS,
      endNS
    );

    timeInfoArray.forEach(info => {
      this.timeInformation.set(info.id, info);
    });

    traceRow.supplierFrame = (): Promise<NetworkRequestStruct[]> => {
      return Promise.resolve(this.networkDetailData);
    };
  }

  async initAndGetTimeInformation(processId: number): Promise<{
    detailData: Array<NetworkRequestStruct>;
    timeInformation: Map<number, NetworkTimeInformation>;
  } | undefined> {
    const startNS = TraceRow.range!.startNS || 0;
    const endNS = TraceRow.range!.endNS || 0;
    this.networkDetailData = await queryNetworkDetailData(
      processId,
      startNS,
      endNS
    );

    const timeInfoArray = await queryNetworkTimeInformation(
      startNS,
      endNS
    );

    timeInfoArray.forEach(info => {
      this.timeInformation.set(info.id, info);
    });

    return {
      detailData: this.networkDetailData,
      timeInformation: this.timeInformation
    };
  }

  getTimeInformation(id: number): NetworkTimeInformation | undefined {
    return this.timeInformation.get(id);
  }
}
