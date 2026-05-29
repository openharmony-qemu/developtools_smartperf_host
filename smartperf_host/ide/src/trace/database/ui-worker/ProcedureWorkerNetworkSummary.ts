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

import { BaseStruct, isFrameContainPoint, ns2x, Render, Rect, drawLoadingFrame, drawString } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';
import { NetworkRequestStruct } from '../../bean/NetworkStruct';

export class NetworkSummaryRender extends Render {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<NetworkSummaryStruct>
  ): void {
    let networkSummaryList = row.dataList;
    let networkSummaryFilter = row.dataListCache;
    this.summary(
      networkSummaryList,
      networkSummaryFilter,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      row.frame,
      req.useCache || (TraceRow.range?.refresh ?? false)
    );
    drawLoadingFrame(req.context, networkSummaryFilter, row);
    req.context.beginPath();
    let networkSummaryFind = false;
    for (let re of networkSummaryFilter) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        NetworkSummaryStruct.hoverNetworkSummaryStruct = re;
        NetworkSummaryStruct.selectNetworkSummaryStruct = re;
        networkSummaryFind = true;
      }
      NetworkSummaryStruct.draw(req.context, re);
    }
    if (!networkSummaryFind && row.isHover) {
      NetworkSummaryStruct.hoverNetworkSummaryStruct = undefined;
      NetworkSummaryStruct.selectNetworkSummaryStruct = undefined;
    }
    req.context.closePath();
  }

  summary(
    networkSummaryList: Array<unknown>,
    networkSummaryFilters: Array<unknown>,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    use: boolean
  ): void {
    if (use && networkSummaryFilters.length > 0) {
      for (let index = 0; index < networkSummaryFilters.length; index++) {
        let item = networkSummaryFilters[index] as NetworkSummaryStruct;
        //@ts-ignore
        if ((item.startTime || 0) + (item.dur || 0) > startNS && (item.startTime || 0) < endNS) {
          NetworkSummaryStruct.setFrame(
            networkSummaryFilters[index],
            startNS,
            endNS,
            totalNS,
            frame,
            item.translateY || 0,
            item.layerHeight || 20
          );
        } else {
          //@ts-ignore
          networkSummaryFilters[index].frame = null;
        }
      }
      return;
    }
    networkSummaryFilters.length = 0;
    setNetworkSummaryFilter(networkSummaryList, networkSummaryFilters, startNS, endNS, totalNS, frame);
  }
}

function setNetworkSummaryFilter(
  list: Array<unknown>,
  networkSummaryFilters: Array<unknown>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  if (list) {
    for (let index = 0; index < list.length; index++) {
      let item = list[index] as NetworkSummaryStruct;
      //@ts-ignore
      item.dur = (item.endTime || 0) - (item.startTime || 0);
      //@ts-ignore
      if ((item.startTime || 0) + (item.dur || 0) > startNS && (item.startTime || 0) < endNS) {
        NetworkSummaryStruct.setFrame(
          list[index],
          startNS,
          endNS,
          totalNS,
          frame,
          item.translateY || 0,
          item.layerHeight || 20
        );
        networkSummaryFilters.push(item);
      }
    }
  }
}

export class NetworkSummaryStruct extends BaseStruct {
  static selectNetworkSummaryStruct: NetworkSummaryStruct | undefined;
  static hoverNetworkSummaryStruct: NetworkSummaryStruct | undefined;
  static colorCache: Map<number, string> = new Map();

  id: number | undefined;
  ipid: number | undefined;
  itid: number | undefined;
  requestId: string | undefined;
  protocol: string | undefined;
  domain: string | undefined;
  requestUri: string | undefined;
  requestMethod: string | undefined;
  requestHeader: string | undefined;
  responseStatusCode: number | undefined;
  responseHeader: string | undefined;
  responseEffectiveUrl: string | undefined;
  ipAddress: string | undefined;
  version: string | undefined;
  reasonPhrase: string | undefined;
  startTime: number | undefined;
  endTime: number | undefined;
  duration: number | undefined;
  dur: number | undefined;
  layer: number | undefined;
  layerHeight: number | undefined;
  translateY: number | undefined;

  static draw(context: CanvasRenderingContext2D, data: NetworkSummaryStruct): void {
    if (data.frame && data.layer !== undefined && data.layerHeight !== undefined) {
      let width = data.frame.width || 0;
      let y = data.frame.y || 0;
      let height = data.frame.height || 20;
      let textPadding = 2;
      let textFillWidth = width - textPadding * 2;

      context.fillStyle = NetworkSummaryStruct.getColorByRequestId(data.id || 0);
      context.fillRect(data.frame.x || 0, y, width, height);

      if (width > 8) {
        context.fillStyle = '#FFFFFF';
        context.font = '10px Arial';
        context.textBaseline = 'middle';
        let text = '';
        if (data.requestUri) {
          text = `${data.requestMethod || ''} ${data.requestUri} ->${data.responseStatusCode || ''}`;
        } else {
          text = `${data.requestMethod || ''} ${data.domain || ''}`;
        }
        let textWidth = context.measureText(text).width;

        if (textWidth < textFillWidth) {
          let x1 = Math.floor(width / 2 - textWidth / 2 + (data.frame.x || 0) + textPadding);
          context.fillText(text, x1, y + height / 2, textFillWidth);
        } else {
          if (textFillWidth > 3) {
            let charWidth = Math.round(textWidth / text.length);
            if (textFillWidth >= charWidth) {
              let charNum = textFillWidth / charWidth;
              let x1 = (data.frame.x || 0) + textPadding;
              if (charNum < 2) {
                context.fillText(text.substring(0, 1), x1, y + height / 2, textFillWidth);
              } else {
                context.fillText(`${text.substring(0, charNum - 1)}...`, x1, y + height / 2, textFillWidth);
              }
            }
          }
        }
      }
    }
    context.globalAlpha = 1.0;
    context.lineWidth = 1;
  }

  static getColorByStatusCode(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) {
      return '#4CAF50';
    } else if (statusCode >= 300 && statusCode < 400) {
      return '#2196F3';
    } else if (statusCode >= 400 && statusCode < 500) {
      return '#FFC107';
    } else {
      return '#F44336';
    }
  }

  static getColorByRequestId(id: number): string {
    if (NetworkSummaryStruct.colorCache.has(id)) {
      return NetworkSummaryStruct.colorCache.get(id)!;
    }

    const colorIndex = ColorUtils.hash(`${id}`, ColorUtils.FUNC_COLOR.length);
    const color = ColorUtils.FUNC_COLOR[colorIndex];

    NetworkSummaryStruct.colorCache.set(id, color);
    return color;
  }

  static getColorByLayer(layer: number): string {
    const layerColors = [
      '#4CAF50',
      '#2196F3',
      '#FF9800',
      '#9C27B0',
      '#E91E63',
      '#00BCD4',
      '#795548',
      '#607D8B',
      '#3F51B5',
      '#009688'
    ];
    return layerColors[layer % layerColors.length];
  }

  static setFrame(
    summaryNode: unknown,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    translateY: number = 0,
    layerHeight: number = 20
  ): void {
    let summaryStartPointX: number;
    let summaryEndPointX: number;
    //@ts-ignore
    if ((summaryNode.startTime || 0) < startNS) {
      summaryStartPointX = 0;
    } else {
      //@ts-ignore
      summaryStartPointX = ns2x(summaryNode.startTime || 0, startNS, endNS, totalNS, frame);
    }
    //@ts-ignore
    if ((summaryNode.startTime || 0) + (summaryNode.dur || 0) > endNS) {
      summaryEndPointX = frame.width;
    } else {
      //@ts-ignore
      summaryEndPointX = ns2x((summaryNode.startTime || 0) + (summaryNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let frameWidth: number =
      summaryEndPointX - summaryStartPointX <= 1 ? 1 : summaryEndPointX - summaryStartPointX;
    //@ts-ignore
    if (!summaryNode.frame) {
      //@ts-ignore
      summaryNode.frame = {};
    }
    //@ts-ignore
    summaryNode.frame.x = Math.floor(summaryStartPointX);
    //@ts-ignore
    summaryNode.frame.y = Math.floor(frame.y + translateY);
    //@ts-ignore
    summaryNode.frame.width = Math.ceil(frameWidth);
    //@ts-ignore
    summaryNode.frame.height = Math.floor(layerHeight);
  }
}

export function NetworkSummaryStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  row?: TraceRow<NetworkSummaryStruct>,
  entry?: NetworkSummaryStruct
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_NETWORK_SUMMARY && entry) {
      const networkRequestStruct: NetworkRequestStruct = {
        frame: undefined,
        isHover: false,
        id: entry.id!,
        ipid: entry.ipid!,
        itid: entry.itid!,
        requestId: entry.requestId || '',
        protocol: entry.protocol || '',
        domain: entry.domain || '',
        requestUri: entry.requestUri || '',
        requestMethod: entry.requestMethod || '',
        requestHeader: entry.requestHeader || '',
        responseStatusCode: entry.responseStatusCode || 0,
        responseHeader: entry.responseHeader || '',
        responseEffectiveUrl: entry.responseEffectiveUrl || '',
        ipAddress: entry.ipAddress || '',
        version: entry.version || '',
        reasonPhrase: entry.reasonPhrase || '',
        startTime: entry.startTime || 0,
        endTime: entry.endTime || 0,
        duration: entry.duration || 0,
        fromProcessNetworkDetail: false
      };

      sp.traceSheetEL?.displayNetworkSummaryData(networkRequestStruct).then(() => {
        sp.timerShaftEL?.modifyFlagList(undefined);
        reject(new Error());
      }).catch(() => {
        reject(new Error());
      });
    } else {
      resolve();
    }
  });
}
