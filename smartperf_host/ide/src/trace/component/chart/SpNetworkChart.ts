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
import { NetworkRequestStruct, NetworkTimeInformation } from '../../bean/NetworkStruct';
import { queryNetworkInformation, queryNetworkTimeInformation, queryNetworkTimeInformationForCount, queryProcessInfo } from '../../database/sql/Network.sql';
import { folderSupplier, folderThreadHandler } from './SpChartManager';
import { BaseStruct } from '../../bean/BaseStruct';
import { GlobalNetworkSummaryChart } from './GlobalNetworkSummaryChart';
import { ProcessNetworkDetailChart } from './ProcessNetworkDetailChart';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { NetworkCountRender, NetworkCountStruct as NetworkCountStructType } from '../../database/ui-worker/ProcedureWorkerNetworkCount';
import { NetworkSummaryRender, NetworkSummaryStruct as NetworkSummaryStructType } from '../../database/ui-worker/ProcedureWorkerNetworkSummary';
import { NetworkDetailRender, NetworkDetailStruct as NetworkDetailStructType } from '../../database/ui-worker/ProcedureWorkerNetworkDetail';

interface NetworkConcurrentCountData {
  time: number;
  dur: number;
  count: number;
}

type NetworkCountStruct = NetworkConcurrentCountData & NetworkCountStructType;
type NetworkSummaryStruct = NetworkRequestStruct & NetworkSummaryStructType;
type NetworkDetailStruct = NetworkRequestStruct & NetworkDetailStructType;

const NETWORK_SUMMARY_FOLD_THRESHOLD = 75;
const NETWORK_SUMMARY_FOLD_HEIGHT = 28;
const NETWORK_DETAIL_FOLD_THRESHOLD = 60;
const NETWORK_DETAIL_FOLD_HEIGHT = 58;

export class SpNetworkChart {
  static networkCountRow: TraceRow<NetworkCountStruct> | undefined;
  static globalSummaryRow: TraceRow<NetworkSummaryStruct> | undefined;
  static networkDetailRows: Array<TraceRow<NetworkDetailStruct>> = [];
  private trace: SpSystemTrace;
  private summaryChart: GlobalNetworkSummaryChart;
  private detailChart: ProcessNetworkDetailChart;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
    this.summaryChart = new GlobalNetworkSummaryChart(trace);
    this.detailChart = new ProcessNetworkDetailChart(trace);
  }

  chartThreadHandler(row: TraceRow<NetworkCountStruct>): void {
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders['network-count'] as NetworkCountRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'NETWORK-COUNT',
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }

  async init(): Promise<void> {
    const hasNetworkData = await this.hasNetworkData();
    if (hasNetworkData) {
      await this.initNetworkCountFolder();
      await this.initNetworkSummaryFolder();
    }
  }

  private async hasNetworkData(): Promise<boolean> {
    const startNS = TraceRow.range!.startNS || 0;
    const endNS = TraceRow.range!.endNS || 0;

    try {
      const timeInfoData = await queryNetworkTimeInformation(startNS, endNS);
      const networkInfoData = await queryNetworkInformation(startNS, endNS);
      return timeInfoData.length > 0 || networkInfoData.length > 0;
    } catch (error) {
      return false;
    }
  }

  private async initNetworkCountFolder(): Promise<void> {
    const folderRow = this.createFolderRow('Network Count');
    folderRow.rowId = 'NetworkCount';
    folderRow.rowType = TraceRow.ROW_TYPE_NETWORK_COUNT_FOLDER;
    this.trace.rowsEL?.appendChild(folderRow);

    await this.addNetworkCountRow(folderRow);
  }

  private async initNetworkSummaryFolder(): Promise<void> {
    const folderRow = this.createFolderRow('Network Traffic');
    folderRow.rowId = 'NetworkSummary';
    folderRow.rowType = TraceRow.ROW_TYPE_NETWORK_SUMMARY_FOLDER;
    this.trace.rowsEL?.appendChild(folderRow);

    await this.addNetworkSummaryRow(folderRow);

    const processNetworkDetailFolderRow = this.createFolderRow('Network Process Detail', folderRow.rowId);
    processNetworkDetailFolderRow.rowId = 'ProcessNetworkDetail';
    processNetworkDetailFolderRow.rowType = TraceRow.ROW_TYPE_NETWORK_DETAIL_FOLDER;
    folderRow.addChildTraceRow(processNetworkDetailFolderRow);

    await this.addProcessNetworkDetailRow(processNetworkDetailFolderRow);
  }

  private createFolderRow(name: string, parentId: string = ''): TraceRow<BaseStruct> {
    let folder = TraceRow.skeleton<BaseStruct>();
    folder.rowParentId = parentId;
    folder.folder = true;
    folder.style.height = '40px';
    folder.name = name;
    folder.setAttribute('children', '');
    folder.setAttribute('check-type', '0');
    folder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    folder.selectChangeHandler = this.trace.selectChangeHandler;
    folder.supplier = folderSupplier();
    folder.onThreadHandler = folderThreadHandler(folder, this.trace);
    return folder;
  }

  private async addNetworkCountRow(folderRow: TraceRow<BaseStruct>): Promise<void> {
    SpNetworkChart.networkCountRow = TraceRow.skeleton<NetworkCountStruct>();
    SpNetworkChart.networkCountRow.rowId = '0';
    SpNetworkChart.networkCountRow.rowType = TraceRow.ROW_TYPE_NETWORK_COUNT;
    SpNetworkChart.networkCountRow.rowParentId = folderRow.rowId;
    SpNetworkChart.networkCountRow.style.height = '40px';
    SpNetworkChart.networkCountRow.name = 'Network Count';
    SpNetworkChart.networkCountRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    SpNetworkChart.networkCountRow.selectChangeHandler = this.trace.selectChangeHandler;

    const startNS = TraceRow.range!.startNS || 0;
    const endNS = TraceRow.range!.endNS || 0;

    const timeInfoData = await queryNetworkTimeInformationForCount(startNS, endNS);

    const countData = this.calculateConcurrentCounts(timeInfoData);

    let maxCount = 0;
    countData.forEach(item => {
      if (item.count > maxCount) {
        maxCount = item.count;
      }
    });

    SpNetworkChart.networkCountRow.focusHandler = (ev): void => {
      this.trace?.displayTip(
        SpNetworkChart.networkCountRow!,
        NetworkCountStructType.hoverNetworkCountStruct,
        `<span style='font-weight: bold;'>${NetworkCountStructType.hoverNetworkCountStruct ? NetworkCountStructType.hoverNetworkCountStruct.count : 0}</span>`
      );
    };

    SpNetworkChart.networkCountRow.findHoverStruct = (): void => {
      NetworkCountStructType.hoverNetworkCountStruct = SpNetworkChart.networkCountRow!.getHoverStruct();
    };

    SpNetworkChart.networkCountRow.supplier = (): Promise<Array<NetworkCountStruct>> => {
      const data: NetworkCountStruct[] = countData.map(item => ({
        ...item,
        ts: item.time,
        frame: undefined,
        isHover: false
      } as NetworkCountStruct));
      NetworkCountStructType.maxCount = maxCount;
      return Promise.resolve(data);
    };

    //@ts-ignore
    SpNetworkChart.networkCountRow.supplierFrame = async (): Promise<Array<NetworkCountStruct>> => {
      return SpNetworkChart.networkCountRow!.supplier ? SpNetworkChart.networkCountRow!.supplier() : Promise.resolve([]);
    };

    this.chartThreadHandler(SpNetworkChart.networkCountRow);
    folderRow.addChildTraceRow(SpNetworkChart.networkCountRow);
  }

  private calculateConcurrentCounts(timeInfoData: NetworkTimeInformation[]): NetworkConcurrentCountData[] {
    const sourceData = timeInfoData.map(item => ({
      id: item.id,
      startTime: item.beginTime,
      endTime: item.endTime
    })).sort((a, b) => a.startTime - b.startTime);

    const activeRequests: { id: number; startTime: number; endTime: number }[] = [];
    const result: NetworkConcurrentCountData[] = [];
    let globalTs = 0;
    let index = 0;

    while (index < sourceData.length || activeRequests.length > 0) {
      if (activeRequests.length === 0) {
        globalTs = sourceData[index].startTime;
        activeRequests.push(sourceData[index]);
        index++;
        continue;
      }

      const minEndTime = Math.min(...activeRequests.map(item => item.endTime));
      const minIndex = activeRequests.findIndex(item => item.endTime === minEndTime);

      if (globalTs === minEndTime) {
        if (minIndex !== -1) {
          if (activeRequests[minIndex].endTime > activeRequests[minIndex].startTime) {
            activeRequests.splice(minIndex, 1);
          } else {
            result.push({
              time: globalTs,
              dur: 0,
              count: activeRequests.length
            });
            activeRequests.splice(minIndex, 1);
          }
          continue;
        }
      }

      if (index < sourceData.length) {
        if (sourceData[index].startTime < minEndTime) {
          if (globalTs === sourceData[index].startTime) {
            activeRequests.push(sourceData[index]);
            index++;
            continue;
          } else {
            result.push({
              time: globalTs,
              dur: sourceData[index].startTime - globalTs,
              count: activeRequests.length
            });
            activeRequests.push(sourceData[index]);
            globalTs = sourceData[index].startTime;
            index++;
          }
        } else {
          result.push({
            time: globalTs,
            dur: minEndTime - globalTs,
            count: activeRequests.length
          });
          globalTs = minEndTime;
          if (minIndex !== -1) {
            activeRequests.splice(minIndex, 1);
          }
        }
      } else {
        result.push({
          time: globalTs,
          dur: minEndTime - globalTs,
          count: activeRequests.length
        });
        globalTs = minEndTime;
        if (minIndex !== -1) {
          activeRequests.splice(minIndex, 1);
        }
      }
    }

    return result;
  }

  chartThreadHandlerNetworkSummary(row: TraceRow<NetworkSummaryStruct>): void {
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders['network-summary'] as NetworkSummaryRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'NETWORK-SUMMARY'
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }

  displayNetworkSummaryDetail(networkSummary: NetworkSummaryStructType): void {
    if (networkSummary.id) {
      const networkRequestStruct: NetworkRequestStruct = {
        frame: undefined,
        isHover: false,
        id: networkSummary.id,
        ipid: networkSummary.ipid!,
        itid: networkSummary.itid!,
        requestId: networkSummary.requestId || '',
        protocol: networkSummary.protocol || '',
        domain: networkSummary.domain || '',
        requestUri: networkSummary.requestUri || '',
        requestMethod: networkSummary.requestMethod || '',
        requestHeader: networkSummary.requestHeader || '',
        responseStatusCode: networkSummary.responseStatusCode || 0,
        responseHeader: networkSummary.responseHeader || '',
        responseEffectiveUrl: networkSummary.responseEffectiveUrl || '',
        ipAddress: networkSummary.ipAddress || '',
        version: networkSummary.version || '',
        reasonPhrase: networkSummary.reasonPhrase || '',
        startTime: networkSummary.startTime || 0,
        endTime: networkSummary.endTime || 0,
        duration: networkSummary.duration || 0,
        fromProcessNetworkDetail: false
      };
      this.trace.traceSheetEL!.displayNetworkSummaryData(networkRequestStruct);
    }
  }

  private async addNetworkSummaryRow(folderRow: TraceRow<BaseStruct>): Promise<void> {
    const networkSummaryRow = TraceRow.skeleton<NetworkSummaryStruct>();
    networkSummaryRow.rowId = '0';
    networkSummaryRow.rowType = TraceRow.ROW_TYPE_NETWORK_SUMMARY;
    networkSummaryRow.rowParentId = folderRow.rowId;
    networkSummaryRow.style.height = '40px';
    networkSummaryRow.name = 'Global Summary';
    networkSummaryRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    networkSummaryRow.selectChangeHandler = this.trace.selectChangeHandler;

    const summaryData = await this.summaryChart.initAndGetLayers();
    if (!summaryData) {
      return;
    }

    const LAYER_HEIGHT = 20;
    const LAYER_SPACING = 4;
    const TOP_PADDING = 4;
    const BOTTOM_PADDING = 4;

    const layerCount = summaryData.length;
    const rowHeight = TOP_PADDING + BOTTOM_PADDING + layerCount * LAYER_HEIGHT + (layerCount - 1) * LAYER_SPACING;
    networkSummaryRow.style.height = `${Math.max(40, rowHeight)}px`;
    networkSummaryRow.funcMaxHeight = rowHeight;

    if (rowHeight > NETWORK_SUMMARY_FOLD_THRESHOLD) {
      networkSummaryRow.enableCollapseChart(NETWORK_SUMMARY_FOLD_HEIGHT, this.trace);
      networkSummaryRow.funcExpand = false;
      networkSummaryRow.style.height = `${NETWORK_SUMMARY_FOLD_HEIGHT}px`;
    }

    networkSummaryRow.supplier = (): Promise<NetworkSummaryStruct[]> => {
      const data: NetworkSummaryStruct[] = summaryData.flatMap((layer, layerIndex) =>
        layer.map((item: NetworkRequestStruct) => ({
          ...item,
          dur: (item.endTime || 0) - (item.startTime || 0),
          layer: layerIndex,
          layerHeight: LAYER_HEIGHT,
          translateY: (layerCount === 1 ? 10 : TOP_PADDING) + layerIndex * (LAYER_HEIGHT + LAYER_SPACING)
        }))
      );
      return Promise.resolve(data);
    };

    networkSummaryRow.supplierFrame = async (): Promise<NetworkSummaryStruct[]> => {
      return networkSummaryRow.supplier ? networkSummaryRow.supplier() : Promise.resolve([]);
    };

    networkSummaryRow.findHoverStruct = (): void => {
      NetworkSummaryStructType.hoverNetworkSummaryStruct = SpNetworkChart.globalSummaryRow!.getHoverStruct();
    };

    this.chartThreadHandlerNetworkSummary(networkSummaryRow);

    SpNetworkChart.globalSummaryRow = networkSummaryRow;
    folderRow.addChildTraceRow(networkSummaryRow);
   }

  private async addProcessNetworkDetailRow(folderRow: TraceRow<BaseStruct>): Promise<void> {
    const startNS = TraceRow.range!.startNS || 0;
    const endNS = TraceRow.range!.endNS || 0;

    const result = await this.detailChart.initAndGetTimeInformation(-1);
    if (!result) {
      return;
    }

    const { detailData, timeInformation } = result;

    const ipidMap = new Map<number, NetworkRequestStruct[]>();
    const rowTimeInfoMap = new Map<number, NetworkTimeInformation>();
    detailData.forEach(item => {
      const timeInfo = timeInformation.get(item.id!);
      if (timeInfo) {
        if (!ipidMap.has(timeInfo.ipid)) {
          ipidMap.set(timeInfo.ipid, []);
        }
        ipidMap.get(timeInfo.ipid)!.push(item);
        rowTimeInfoMap.set(item.id!, timeInfo);
      }
    });

    const sortedIpids = Array.from(ipidMap.keys()).sort((a, b) => a - b);

    for (let i = 0; i < sortedIpids.length; i++) {
      const ipid = sortedIpids[i];
      const ipidData = ipidMap.get(ipid)!;

      ipidData.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

      const layers = this.assignLayersForProcess(ipidData);

      const processInfo = await queryProcessInfo(ipid);

      const SINGLE_LAYER_HEIGHT = 50;
      const LAYER_SPACING = 4;
      const TOP_PADDING = 4;
      const BOTTOM_PADDING = 4;

      const layerCount = layers.length;
      const rowHeight = TOP_PADDING + BOTTOM_PADDING + layerCount * SINGLE_LAYER_HEIGHT + (layerCount - 1) * LAYER_SPACING;

      const processNetworkDetailRow = TraceRow.skeleton<NetworkDetailStruct>();
      processNetworkDetailRow.rowId = `ipid-${ipid}`;
      processNetworkDetailRow.rowType = TraceRow.ROW_TYPE_NETWORK_DETAIL;
      processNetworkDetailRow.rowParentId = folderRow.rowId;
      processNetworkDetailRow.style.height = `${Math.max(55, rowHeight)}px`;
      processNetworkDetailRow.funcMaxHeight = rowHeight;
      processNetworkDetailRow.name = `Process Detail[${processInfo?.pid}]`;
      processNetworkDetailRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      processNetworkDetailRow.selectChangeHandler = this.trace.selectChangeHandler;

      if (rowHeight > NETWORK_DETAIL_FOLD_THRESHOLD) {
        processNetworkDetailRow.enableCollapseChart(NETWORK_DETAIL_FOLD_HEIGHT, this.trace);
        processNetworkDetailRow.funcExpand = false;
        processNetworkDetailRow.style.height = `${NETWORK_DETAIL_FOLD_HEIGHT}px`;
      }

      const rowTimeInfo = new Map<number, NetworkTimeInformation>();
      ipidData.forEach(item => {
        const timeInfo = rowTimeInfoMap.get(item.id!);
        if (timeInfo) {
          rowTimeInfo.set(item.id!, timeInfo);
        }
      });

        processNetworkDetailRow.supplier = (): Promise<NetworkDetailStruct[]> => {
          const data: NetworkDetailStruct[] = layers.flatMap((layer, layerIndex) =>
            layer.map((item: NetworkRequestStruct) => {
              const timeInfo = rowTimeInfo.get(item.id!);
              const detailItem = {
                id: item.id!,
                ipid: timeInfo?.ipid,
                itid: timeInfo?.itid,
                requestMethod: item.requestMethod,
                url: item.domain + item.requestUri,
                statusCode: item.responseStatusCode,
                startTime: item.startTime,
                endTime: item.endTime,
                blockedTime: 0,
                waitingTime: 0,
                responseTime: 0,
                dnsTime: 0,
                tcpTime: 0,
                tlsTime: 0,
                dur: (item.endTime || 0) - (item.startTime || 0),
                timeInformation: timeInfo,
                domain: item.domain,
                requestUri: item.requestUri,
                protocol: item.protocol,
                requestId: item.requestId,
                requestHeader: item.requestHeader,
                responseStatusCode: item.responseStatusCode,
                responseHeader: item.responseHeader,
                responseEffectiveUrl: item.responseEffectiveUrl,
                ipAddress: item.ipAddress,
                version: item.version,
                reasonPhrase: item.reasonPhrase,
                duration: item.duration,
                layer: layerIndex,
                layerHeight: SINGLE_LAYER_HEIGHT,
                translateY: (layerCount === 1 ? 2 : (TOP_PADDING - 2)) + layerIndex * (SINGLE_LAYER_HEIGHT + LAYER_SPACING),
                frame: undefined,
                isHover: false
              } as NetworkDetailStruct;
              return detailItem;
          })
        );
        return Promise.resolve(data);
      };

      processNetworkDetailRow.supplierFrame = async (): Promise<NetworkDetailStruct[]> => {
        return processNetworkDetailRow.supplier ? processNetworkDetailRow.supplier() : Promise.resolve([]);
      };

      this.chartThreadHandlerNetworkDetail(processNetworkDetailRow);

      SpNetworkChart.networkDetailRows.push(processNetworkDetailRow);
      folderRow.addChildTraceRow(processNetworkDetailRow);
    }
  }

  private assignLayersForProcess(data: Array<NetworkRequestStruct>): Array<Array<NetworkRequestStruct>> {
    const layers: Array<Array<NetworkRequestStruct>> = [];

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

  chartThreadHandlerNetworkDetail(row: TraceRow<NetworkDetailStruct>): void {
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders['network-detail'] as NetworkDetailRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'NETWORK-DETAIL'
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }
}
