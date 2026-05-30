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
import { NetworkRequestStruct } from '../../bean/NetworkStruct';
import { queryNetworkSummaryData } from '../../database/sql/Network.sql';

export class GlobalNetworkSummaryChart {
  private trace: SpSystemTrace;
  private networkSummaryData: Array<NetworkRequestStruct> = [];
  private layers: Array<Array<NetworkRequestStruct>> = [];

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async initAndGetLayers(): Promise<Array<Array<NetworkRequestStruct>> | undefined> {
    const startNS = TraceRow.range!.startNS || 0;
    const endNS = TraceRow.range!.endNS || 0;
    this.networkSummaryData = await queryNetworkSummaryData(
      startNS,
      endNS
    );

    this.layers = this.assignLayers(this.networkSummaryData);
    return this.layers;
  }

  private assignLayers(data: Array<NetworkRequestStruct>): Array<Array<NetworkRequestStruct>> {
    const layers: Array<Array<NetworkRequestStruct>> = [];
    data.sort((a, b) => a.startTime - b.startTime);

    for (const item of data) {
      let placed = false;
      for (let i = 0; i < layers.length; i++) {
        const lastItem = layers[i][layers[i].length - 1];
        if (lastItem.endTime <= item.startTime) {
          layers[i].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        layers.push([item]);
      }
    }

    return layers;
  }
}
