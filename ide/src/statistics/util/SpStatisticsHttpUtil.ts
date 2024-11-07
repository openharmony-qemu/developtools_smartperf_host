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

import { warn } from '../../log/Log';
import { BurialPointRequestBody, GeneralRecordRequest, pluginUsage } from './SpStatisticsHttpBean';

export class SpStatisticsHttpUtil {
  static requestServerInfo: string = '';
  static serverTime: number = 0;
  static timeDiff: number = 0;
  static retryCount: number = 0;
  static retryMaxCount: number = 5;
  static pauseRetry: boolean = false;
  static retryRestTimeOut: boolean = false;
  static recordPlugin: Array<string> = [];

  static initStatisticsServerConfig(): void {
    if (SpStatisticsHttpUtil.requestServerInfo === '') {
      SpStatisticsHttpUtil.requestServerInfo = SpStatisticsHttpUtil.getRequestServerInfo();
    }
    if (SpStatisticsHttpUtil.serverTime === 0) {
      SpStatisticsHttpUtil.getServerTime();
    }
  }

  static getRequestServerInfo(): string {
    try {
      let req = new XMLHttpRequest();
      req.onreadystatechange = (): void => {
        if (req.readyState === 4 && req.status === 200) {
          let requestInfo = req.getResponseHeader('request_info');
          if (requestInfo && requestInfo.length > 0) {
            SpStatisticsHttpUtil.requestServerInfo = requestInfo;
          }
        }
      };
      req.open(
        'GET',
        `${window.location.protocol}//${window.location.host.split(':')[0]}:${window.location.port
        }/application/serverInfo`,
        true
      );
      req.send(null);
    } catch {
      warn('Connect Server Failed');
    }
    return '';
  }

  static getServerTime(): void {
    if (SpStatisticsHttpUtil.requestServerInfo === '') {
      SpStatisticsHttpUtil.requestServerInfo = SpStatisticsHttpUtil.getRequestServerInfo();
    }
    if (SpStatisticsHttpUtil.pauseRetry) {
      return;
    }
    fetch(`https://${SpStatisticsHttpUtil.requestServerInfo}/serverTime`)
      .then((resp) => {
        resp.text().then((it) => {
          if (it && it.length > 0) {
            SpStatisticsHttpUtil.serverTime = Number(it);
            SpStatisticsHttpUtil.timeDiff = SpStatisticsHttpUtil.serverTime - Date.now();
          }
        });
      })
      .catch((e) => {
        this.handleRequestException();
      });
  }

  private static handleRequestException(): void {
    if (SpStatisticsHttpUtil.retryCount >= SpStatisticsHttpUtil.retryMaxCount) {
      SpStatisticsHttpUtil.pauseRetry = true;
      if (SpStatisticsHttpUtil.retryRestTimeOut) {
        return;
      }
      SpStatisticsHttpUtil.retryRestTimeOut = true;
      setTimeout(() => {
        SpStatisticsHttpUtil.retryCount = 0;
        SpStatisticsHttpUtil.pauseRetry = false;
        SpStatisticsHttpUtil.retryRestTimeOut = false;
      }, 600000);
    }
    ++SpStatisticsHttpUtil.retryCount;
  }

  static addUserVisitAction(requestUrl: string): void {
    // @ts-ignore
    if (window.useWb) {
      return;
    }
    if (SpStatisticsHttpUtil.requestServerInfo === '') {
      SpStatisticsHttpUtil.requestServerInfo = SpStatisticsHttpUtil.getRequestServerInfo();
    }
    if (SpStatisticsHttpUtil.pauseRetry) {
      return;
    }
    let visitId = 0;
    fetch(`https://${SpStatisticsHttpUtil.requestServerInfo}/${requestUrl}`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((resp) => {
        resp.text().then((it) => {
          let res = JSON.parse(it);
          if (res && res.data) {
            visitId = res.data.accessId;
          }
        });
      })
      .catch((err) => { });
    setTimeout(() => {
      fetch(`https://${SpStatisticsHttpUtil.requestServerInfo}/${requestUrl}`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          effectiveAccess: true,
          visitId: visitId,
        }),
      })
        .catch((err) => { })
        .then((resp) => { });
    }, 1800000);
  }

  static addOrdinaryVisitAction(requestBody: BurialPointRequestBody): void {
    // @ts-ignore
    if (window.useWb) {
      return;
    }
    if (SpStatisticsHttpUtil.requestServerInfo === '') {
      SpStatisticsHttpUtil.requestServerInfo = SpStatisticsHttpUtil.getRequestServerInfo();
    }
    if (SpStatisticsHttpUtil.pauseRetry) {
      return;
    }
    requestBody.ts = SpStatisticsHttpUtil.getCorrectRequestTime();
    if (SpStatisticsHttpUtil.serverTime === 0) {
      return;
    }
    fetch(`https://${SpStatisticsHttpUtil.requestServerInfo}/record`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
      .catch((err) => {
      })
      .then((resp) => { });
  }

  // ai问答
  static generalRecord(category: string, secondCat: string, thirdCat: Array<string | number>): void {
    let requestBody: GeneralRecordRequest = {
      ts: SpStatisticsHttpUtil.getCorrectRequestTime(),
      category,
      secondCat,
      thirdCat
    };
    fetch(`https://${SpStatisticsHttpUtil.requestServerInfo}/generalRecord`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }).then(
      res => { }
    ).catch(err => {

    })
  }

  static recordPluginUsage() {
    fetch(`https://${SpStatisticsHttpUtil.requestServerInfo}/recordPluginUsage`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventData: {
          plugin: SpStatisticsHttpUtil.recordPlugin
        }
      })
    }).then(res => {
    }).catch(err => {
    });
    SpStatisticsHttpUtil.recordPlugin = [];
  }

  static getNotice(): Promise<Response> {
    return fetch(`https://${window.location.host}${window.location.pathname}messagePublish`);
  }

  static getCorrectRequestTime(): number {
    if (SpStatisticsHttpUtil.serverTime === 0) {
      SpStatisticsHttpUtil.getServerTime();
    }
    return Date.now() + SpStatisticsHttpUtil.timeDiff;
  }

  // ai对话接口--获取token
  static async getAItoken(): Promise<aiResponse> {
    let controller = new AbortController();
    let response: aiResponse = {
      status: 0,
      data: ''
    };
    setTimeout(() => {
      controller.abort();
    }, 60000);
    let res = await window.fetch(`https://${window.location.host}/takeToken`, {
      method: 'post',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async res => {
      response.status = res.status;
      if (res.status === 200) {
        let resp = await res.text();
        let resj = await JSON.parse(resp);
        response.data = resj.token;
      }
    }).catch(err => {
      response.status = 700;
    })
    return response;
  }

  // ai对话接口--问答
  // @ts-ignore
  static async askAi(requestBody): aiResponse {
    let controller = new AbortController();
    let response: aiResponse = {
      status: 0,
      data: ''
    };
    setTimeout(() => {
      controller.abort();
    }, 60000);
    await window.fetch(`https://${window.location.host}/ask`, {
      method: 'post',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }).then(async res => {
      response.status = res.status;
      if (res.status === 200) {
        let resp = await res.text();
        let resj = await JSON.parse(resp);
        response.data = resj.reason && resj.reason === 'ok' ? resj.chatbot_reply : '服务器异常，请稍后再试';
      }
      else {
        response.data = '服务器请求失败';
      }
    }).catch((err) => {
      if (err.toString().indexOf('AbortError') > -1) {
        response.data = '请求超时，已中断！';
        response.status = 504;
      } else {
        response.data = '请求错误';
      }
    })
    return response;
  }
}

class aiResponse {
  status: number = 0;
  data: string = ''
}
