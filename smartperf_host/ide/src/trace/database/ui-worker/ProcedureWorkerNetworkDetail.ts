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

import { BaseStruct, isFrameContainPoint, ns2x, Render, Rect, drawLoadingFrame } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { NetworkTimeInformation, NetworkRequestStruct } from '../../bean/NetworkStruct';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class NetworkDetailRender extends Render {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<NetworkDetailStruct>
  ): void {
    let networkDetailList = row.dataList;
    let networkDetailFilter = row.dataListCache;
    this.detail(
      networkDetailList,
      networkDetailFilter,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      row.frame,
      req.useCache || (TraceRow.range?.refresh ?? false)
    );
    drawLoadingFrame(req.context, networkDetailFilter, row);
    req.context.beginPath();
    let networkDetailFind = false;
    for (let re of networkDetailFilter) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        NetworkDetailStruct.hoverNetworkDetailStruct = re;
        NetworkDetailStruct.selectNetworkDetailStruct = re;
        networkDetailFind = true;
        const y = re.frame.y || 0;
        const height = re.frame.height || 50;
        const layerGap = 2;
        const layerHeight = (height - 2 * layerGap) / 3;

        const layer1Y = y + layerGap;
        const layer2Y = layer1Y + layerHeight + layerGap;
        const layer3Y = layer2Y + layerHeight + layerGap;

        const mouseY = row.hoverY;

        if (mouseY >= layer1Y && mouseY < layer1Y + layerHeight) {
          NetworkDetailStruct.clickedLayer = 'http';
        } else if (mouseY >= layer2Y && mouseY < layer2Y + layerHeight) {
          if (re.timeInformation) {
            const timeInfo = re.timeInformation;
            const networkRequestDuration = timeInfo.endTime - timeInfo.beginTime;
            const totalNS = (TraceRow.range?.endNS || 0) - (TraceRow.range?.startNS || 0);
            const width = re.frame.width || 0;
            const mouseX = row.hoverX - (re.frame.x || 0);

            const blockedWidth = (timeInfo.tlsEndTime - timeInfo.beginTime) / networkRequestDuration * width;
            const waitingX = (timeInfo.firstSendTime - timeInfo.beginTime) / networkRequestDuration * width;
            const waitingWidth = (timeInfo.firstRecvTime - timeInfo.firstSendTime) / networkRequestDuration * width;
            const receiveX = (timeInfo.firstRecvTime - timeInfo.beginTime) / networkRequestDuration * width;

            if (mouseX < blockedWidth) {
              NetworkDetailStruct.clickedLayer = 'blocked';
            } else if (mouseX >= waitingX && mouseX < waitingX + waitingWidth) {
              NetworkDetailStruct.clickedLayer = 'waiting';
            } else {
              NetworkDetailStruct.clickedLayer = 'receive';
            }
          } else {
            NetworkDetailStruct.clickedLayer = 'http';
          }
        } else if (mouseY >= layer3Y && mouseY < layer3Y + layerHeight) {
          if (re.timeInformation) {
            const timeInfo = re.timeInformation;
            const networkRequestDuration = timeInfo.endTime - timeInfo.beginTime;
            const totalNS = (TraceRow.range?.endNS || 0) - (TraceRow.range?.startNS || 0);
            const width = re.frame.width || 0;
            const mouseX = row.hoverX - (re.frame.x || 0);

            const dnsWidth = (timeInfo.dnsEndTime - timeInfo.beginTime) / networkRequestDuration * width;
            const tcpX = (timeInfo.dnsEndTime - timeInfo.beginTime) / networkRequestDuration * width;
            const tcpWidth = (timeInfo.tcpEndTime - timeInfo.dnsEndTime) / networkRequestDuration * width;
            const tlsX = (timeInfo.tcpEndTime - timeInfo.beginTime) / networkRequestDuration * width;

            if (mouseX < dnsWidth) {
              NetworkDetailStruct.clickedLayer = 'dns';
            } else if (mouseX >= tcpX && mouseX < tcpX + tcpWidth) {
              NetworkDetailStruct.clickedLayer = 'tcp';
            } else {
              NetworkDetailStruct.clickedLayer = 'tls';
            }
          } else {
            NetworkDetailStruct.clickedLayer = 'http';
          }
        } else {
          NetworkDetailStruct.clickedLayer = 'http';
        }
      }
      NetworkDetailStruct.draw(req.context, re);
    }
    if (!networkDetailFind && row.isHover) {
      NetworkDetailStruct.hoverNetworkDetailStruct = undefined;
      NetworkDetailStruct.selectNetworkDetailStruct = undefined;
      NetworkDetailStruct.clickedLayer = undefined;
    }
    req.context.closePath();
  }

  detail(
    networkDetailList: Array<unknown>,
    networkDetailFilters: Array<unknown>,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    use: boolean
  ): void {
    if (use && networkDetailFilters.length > 0) {
      for (let index = 0; index < networkDetailFilters.length; index++) {
        let item = networkDetailFilters[index] as NetworkDetailStruct;
        //@ts-ignore
        if ((item.startTime || 0) + (item.dur || 0) > startNS && (item.startTime || 0) < endNS) {
          NetworkDetailStruct.setFrame(
            networkDetailFilters[index],
            startNS,
            endNS,
            totalNS,
            frame,
            item.translateY || 0,
            item.layerHeight || 50
          );
        } else {
          //@ts-ignore
          networkDetailFilters[index].frame = null;
        }
      }
      return;
    }
    networkDetailFilters.length = 0;
    setNetworkDetailFilter(networkDetailList, networkDetailFilters, startNS, endNS, totalNS, frame);
  }
}

function setNetworkDetailFilter(
  list: Array<unknown>,
  networkDetailFilters: Array<unknown>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  if (list) {
    for (let index = 0; index < list.length; index++) {
      let item = list[index] as NetworkDetailStruct;
      //@ts-ignore
      item.dur = (item.endTime || 0) - (item.startTime || 0);
      //@ts-ignore
      if ((item.startTime || 0) + (item.dur || 0) > startNS && (item.startTime || 0) < endNS) {
        NetworkDetailStruct.setFrame(
          list[index],
          startNS,
          endNS,
          totalNS,
          frame,
          item.translateY || 0,
          item.layerHeight || 50
        );
        networkDetailFilters.push(item);
      }
    }
  }
}

export class NetworkDetailStruct extends BaseStruct {
  static hoverNetworkDetailStruct: NetworkDetailStruct | undefined;
  static selectNetworkDetailStruct: NetworkDetailStruct | undefined;
  static clickedLayer: string | undefined;

  id: number | undefined;
  ipid: number | undefined;
  itid: number | undefined;
  requestMethod: string | undefined;
  url: string | undefined;
  statusCode: number | undefined;
  startTime: number | undefined;
  endTime: number | undefined;
  blockedTime: number | undefined;
  waitingTime: number | undefined;
  responseTime: number | undefined;
  dnsTime: number | undefined;
  tcpTime: number | undefined;
  tlsTime: number | undefined;
  dur: number | undefined;
  timeInformation: NetworkTimeInformation | undefined;
  domain: string | undefined;
  requestUri: string | undefined;
  protocol: string | undefined;
  requestId: string | undefined;
  requestHeader: string | undefined;
  responseStatusCode: number | undefined;
  responseHeader: string | undefined;
  responseEffectiveUrl: string | undefined;
  ipAddress: string | undefined;
  version: string | undefined;
  reasonPhrase: string | undefined;
  duration: number | undefined;
  layer: number | undefined;
  layerHeight: number | undefined;
  translateY: number | undefined;

  static draw(context: CanvasRenderingContext2D, data: NetworkDetailStruct): void {
    if (data.frame && data.timeInformation) {
      let x = data.frame.x || 0;
      let y = data.frame.y || 0;
      let width = data.frame.width || 0;

      const itemGap = 6;
      const layerGap = 2;

      const layerHeight = ((data.frame.height || 50) - 2 * layerGap) / 3;

      const layer1Y = y + layerGap;
      const layer2Y = layer1Y + layerHeight + layerGap;
      const layer3Y = layer2Y + layerHeight + layerGap;

      let timeInfo = data.timeInformation;

      const networkRequestDuration = timeInfo ? timeInfo.endTime - timeInfo.beginTime : 0;
      const totalNS = (TraceRow.range?.endNS || 0) - (TraceRow.range?.startNS || 0);

      if (networkRequestDuration <= 0 || width <= 0) {
        return;
      }

      context.fillStyle = '#E3F2FD';
      context.fillRect(x, layer1Y, width, layerHeight);

      if (width > 8) {
        context.fillStyle = '#000000';
        context.font = '10px Arial';
        context.textBaseline = 'middle';
        let requestText = `${data.requestMethod || ''} ${data.url || ''}`;
        let textPadding = 2;
        let textFillWidth = width - textPadding * 2;
        let textWidth = context.measureText(requestText).width;

        if (textWidth < textFillWidth) {
          let x1 = Math.floor(x + 2);
          context.fillText(requestText, x1, layer1Y + layerHeight / 2, textFillWidth);
        } else {
          if (textFillWidth > 3) {
            let charWidth = Math.round(textWidth / requestText.length);
            if (textFillWidth >= charWidth) {
              let charNum = textFillWidth / charWidth;
              let x1 = x + textPadding;
              if (charNum < 2) {
                context.fillText(requestText.substring(0, 1), x1, layer1Y + layerHeight / 2, textFillWidth);
              } else {
                context.fillText(`${requestText.substring(0, charNum - 1)}...`, x1, layer1Y + layerHeight / 2, textFillWidth);
              }
            }
          }
        }
      }

      const blockedWidth = timeInfo ? ((timeInfo.tlsEndTime - timeInfo.beginTime) / networkRequestDuration) * width : 0;
      context.fillStyle = '#FFF9C4';
      context.fillRect(x, layer2Y, blockedWidth, layerHeight);
      if (blockedWidth > 8) {
        context.fillStyle = '#000000';
        context.font = '10px Arial';
        context.textBaseline = 'middle';
        let blockedText = 'Blocked';
        let textPadding = 2;
        let textFillWidth = blockedWidth - textPadding * 2;
        let textWidth = context.measureText(blockedText).width;

        if (textWidth < textFillWidth) {
          context.fillText(blockedText, x + textPadding, layer2Y + layerHeight / 2, textFillWidth);
        } else if (textFillWidth > 3) {
          let charWidth = Math.round(textWidth / blockedText.length);
          if (textFillWidth >= charWidth) {
            let charNum = Math.floor(textFillWidth / charWidth);
            if (charNum >= 2) {
              context.fillText(`${blockedText.substring(0, charNum - 1)}...`, x + textPadding, layer2Y + layerHeight / 2, textFillWidth);
            }
          }
        }
      }

      const waitingX = timeInfo ? x + ((timeInfo.firstSendTime - timeInfo.beginTime) / networkRequestDuration) * width : 0;
      const waitingWidth = timeInfo ? ((timeInfo.firstRecvTime - timeInfo.firstSendTime) / networkRequestDuration) * width : 0;
      context.fillStyle = '#C8E6C9';
      context.fillRect(waitingX, layer2Y, waitingWidth, layerHeight);
      if (waitingWidth > 8) {
        context.fillStyle = '#000000';
        context.font = '10px Arial';
        context.textBaseline = 'middle';
        let waitingText = 'waiting for response';
        let textPadding = 2;
        let textFillWidth = waitingWidth - textPadding * 2;
        let textWidth = context.measureText(waitingText).width;

        if (textWidth < textFillWidth) {
          context.fillText(waitingText, waitingX + textPadding, layer2Y + layerHeight / 2, textFillWidth);
        } else if (textFillWidth > 3) {
          let charWidth = Math.round(textWidth / waitingText.length);
          if (textFillWidth >= charWidth) {
            let charNum = Math.floor(textFillWidth / charWidth);
            if (charNum >= 2) {
              context.fillText(`${waitingText.substring(0, charNum - 1)}...`, waitingX + textPadding, layer2Y + layerHeight / 2, textFillWidth);
            }
          }
        }
      }

      const receiveX = timeInfo ? x + ((timeInfo.firstRecvTime - timeInfo.beginTime) / networkRequestDuration) * width : 0;
      const receiveWidth = timeInfo ? ((timeInfo.endTime - timeInfo.firstRecvTime) / networkRequestDuration) * width : 0;
      context.fillStyle = '#BBDEFB';
      context.fillRect(receiveX, layer2Y, receiveWidth, layerHeight);
      if (receiveWidth > 8) {
        context.fillStyle = '#000000';
        context.font = '10px Arial';
        context.textBaseline = 'middle';
        let receiveText = 'receive response';
        let textPadding = 2;
        let textFillWidth = receiveWidth - textPadding * 2;
        let textWidth = context.measureText(receiveText).width;

        if (textWidth < textFillWidth) {
          context.fillText(receiveText, receiveX + textPadding, layer2Y + layerHeight / 2, textFillWidth);
        } else if (textFillWidth > 3) {
          let charWidth = Math.round(textWidth / receiveText.length);
          if (textFillWidth >= charWidth) {
            let charNum = Math.floor(textFillWidth / charWidth);
            if (charNum >= 2) {
              context.fillText(`${receiveText.substring(0, charNum - 1)}...`, receiveX + textPadding, layer2Y + layerHeight / 2, textFillWidth);
            }
          }
        }
      }

      const dnsWidth = timeInfo ? ((timeInfo.dnsEndTime - timeInfo.beginTime) / networkRequestDuration) * width : 0;
      context.fillStyle = '#FFCCBC';
      context.fillRect(x, layer3Y, dnsWidth, layerHeight);
      if (dnsWidth > 8) {
        context.fillStyle = '#000000';
        context.font = '10px Arial';
        context.textBaseline = 'middle';
        let dnsText = 'DNS';
        let textPadding = 2;
        let textFillWidth = dnsWidth - textPadding * 2;
        let textWidth = context.measureText(dnsText).width;

        if (textWidth < textFillWidth) {
          context.fillText(dnsText, x + textPadding, layer3Y + layerHeight / 2, textFillWidth);
        } else if (textFillWidth > 3) {
          let charWidth = Math.round(textWidth / dnsText.length);
          if (textFillWidth >= charWidth) {
            let charNum = Math.floor(textFillWidth / charWidth);
            if (charNum >= 2) {
              context.fillText(`${dnsText.substring(0, charNum - 1)}...`, x + textPadding, layer3Y + layerHeight / 2, textFillWidth);
            }
          }
        }
      }

      const tcpX = timeInfo ? x + ((timeInfo.dnsEndTime - timeInfo.beginTime) / networkRequestDuration) * width : 0;
      const tcpWidth = timeInfo ? ((timeInfo.tcpEndTime - timeInfo.dnsEndTime) / networkRequestDuration) * width : 0;
      context.fillStyle = '#FFE0B2';
      context.fillRect(tcpX, layer3Y, tcpWidth, layerHeight);
      if (tcpWidth > 8) {
        context.fillStyle = '#000000';
        context.font = '10px Arial';
        context.textBaseline = 'middle';
        let tcpText = 'TCP';
        let textPadding = 2;
        let textFillWidth = tcpWidth - textPadding * 2;
        let textWidth = context.measureText(tcpText).width;

        if (textWidth < textFillWidth) {
          context.fillText(tcpText, tcpX + textPadding, layer3Y + layerHeight / 2, textFillWidth);
        } else if (textFillWidth > 3) {
          let charWidth = Math.round(textWidth / tcpText.length);
          if (textFillWidth >= charWidth) {
            let charNum = Math.floor(textFillWidth / charWidth);
            if (charNum >= 2) {
              context.fillText(`${tcpText.substring(0, charNum - 1)}...`, tcpX + textPadding, layer3Y + layerHeight / 2, textFillWidth);
            }
          }
        }
      }

      const tlsX = timeInfo ? x + ((timeInfo.tcpEndTime - timeInfo.beginTime) / networkRequestDuration) * width : 0;
      const tlsWidth = timeInfo ? ((timeInfo.tlsEndTime - timeInfo.tcpEndTime) / networkRequestDuration) * width : 0;
      context.fillStyle = '#E1BEE7';
      context.fillRect(tlsX, layer3Y, tlsWidth, layerHeight);
      if (tlsWidth > 8) {
        context.fillStyle = '#000000';
        context.font = '10px Arial';
        context.textBaseline = 'middle';
        let tlsText = 'TLS';
        let textPadding = 2;
        let textFillWidth = tlsWidth - textPadding * 2;
        let textWidth = context.measureText(tlsText).width;

        if (textWidth < textFillWidth) {
          context.fillText(tlsText, tlsX + textPadding, layer3Y + layerHeight / 2, textFillWidth);
        } else if (textFillWidth > 3) {
          let charWidth = Math.round(textWidth / tlsText.length);
          if (textFillWidth >= charWidth) {
            let charNum = Math.floor(textFillWidth / charWidth);
            if (charNum >= 2) {
              context.fillText(`${tlsText.substring(0, charNum - 1)}...`, tlsX + textPadding, layer3Y + layerHeight / 2, textFillWidth);
            }
          }
        }
      }
    }
    context.globalAlpha = 1.0;
    context.lineWidth = 1;
  }

  static setFrame(
    detailNode: unknown,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    translateY: number = 0,
    layerHeight: number = 50
  ): void {
    let detailStartPointX: number;
    let detailEndPointX: number;
    //@ts-ignore
    if ((detailNode.startTime || 0) < startNS) {
      detailStartPointX = 0;
    } else {
      //@ts-ignore
      detailStartPointX = ns2x(detailNode.startTime || 0, startNS, endNS, totalNS, frame);
    }
    //@ts-ignore
    if ((detailNode.startTime || 0) + (detailNode.dur || 0) > endNS) {
      detailEndPointX = frame.width;
    } else {
      //@ts-ignore
      detailEndPointX = ns2x((detailNode.startTime || 0) + (detailNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let frameWidth: number =
      detailEndPointX - detailStartPointX <= 1 ? 1 : detailEndPointX - detailStartPointX;
    //@ts-ignore
    if (!detailNode.frame) {
    //@ts-ignore
    detailNode.frame = {};
    }
    //@ts-ignore
    detailNode.frame.x = Math.floor(detailStartPointX);
    //@ts-ignore
    detailNode.frame.y = Math.floor(frame.y + translateY);
    //@ts-ignore
    detailNode.frame.width = Math.ceil(frameWidth);
    //@ts-ignore
    detailNode.frame.height = Math.floor(layerHeight);
  }
}

export function NetworkDetailStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  row?: TraceRow<NetworkDetailStruct>,
  entry?: NetworkDetailStruct
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_NETWORK_DETAIL && entry && entry.ipid && entry.itid) {
      let duration = entry.duration || 0;
      const clickedLayer = NetworkDetailStruct.clickedLayer || 'http';

      import('../sql/Network.sql').then(({ queryNetworkTimeInformationById }) => {
        return queryNetworkTimeInformationById(entry.ipid!, entry.itid!);
      }).then((timeInfo) => {
        if (timeInfo) {
          switch (clickedLayer) {
            case 'blocked':
              duration = timeInfo.blocked || 0;
              break;
            case 'waiting':
              duration = timeInfo.waiting || 0;
              break;
            case 'receive':
              duration = timeInfo.receive || 0;
              break;
            case 'dns':
              duration = timeInfo.dns || 0;
              break;
            case 'tcp':
              duration = timeInfo.tcp || 0;
              break;
            case 'tls':
              duration = timeInfo.tls || 0;
              break;
            default:
              duration = entry.duration || 0;
          }
        }

        const networkRequestStruct = {
          frame: undefined,
          isHover: false,
          id: entry.id,
          ipid: entry.ipid || 0,
          itid: entry.itid || 0,
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
          duration: duration,
          fromProcessNetworkDetail: true,
          clickedLayer: clickedLayer,
          timeInfo: timeInfo
        } as NetworkRequestStruct;

        sp.traceSheetEL?.displayNetworkSummaryData(networkRequestStruct).then(() => {
          sp.timerShaftEL?.modifyFlagList(undefined);
          reject(new Error());
        }).catch(() => {
          reject(new Error());
        });
      }).catch(() => {
        reject(new Error());
      });
    } else {
      resolve();
    }
  });
}
