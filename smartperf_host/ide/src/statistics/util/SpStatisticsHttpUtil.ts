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
import {InterfaceConfigManager} from '../../utils/interfaceConfiguration';

export class SpStatisticsHttpUtil {
  static requestServerInfo: string = '';
  static serverTime: number = 0;
  static timeDiff: number = 0;
  static retryCount: number = 0;
  static retryMaxCount: number = 5;
  static retryRestTimeOut: boolean = false;
  static recordPlugin: Array<string> = [];
  static controllersMap: Map<number, AbortController> = new Map<number, AbortController>();
  static isInterrupt: boolean = false;

  static async getServerInfo(): Promise<void> {
    try {
      const resp = await fetch(`https://${window.location.host}${window.location.pathname}serverconfig`);
      if (!resp.ok) throw new Error(`Error fetching server config ${resp}`);
      const res = await resp.json();
      if (res) {
        InterfaceConfigManager.setConfig(res);
      }
    } catch (e) {}
  }

  static initStatisticsServerConfig(): void {
    if (SpStatisticsHttpUtil.requestServerInfo === '') {
      return;
    }
    if (SpStatisticsHttpUtil.serverTime === 0) {
      SpStatisticsHttpUtil.getServerTime();
    }
  }


  static getServerTime(): void {
    if (SpStatisticsHttpUtil.requestServerInfo === '') {
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
      .catch((e) => {});
  }


  static addUserVisitAction(requestUrl: string): void {
    // @ts-ignore
    if (window.useWb) {
      return;
    }
    if (SpStatisticsHttpUtil.requestServerInfo === '') {
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
  static generalRecord(category: string, secondCat: string, thirdCat: Array<string>): void {
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
    });
  }

  static recordPluginUsage(): void {
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

  static getCorrectRequestTime(): number {
    if (SpStatisticsHttpUtil.serverTime === 0) {
      SpStatisticsHttpUtil.getServerTime();
    }
    return Date.now() + SpStatisticsHttpUtil.timeDiff;
  }

  // ai对话接口--获取token
  static async getAItoken(params:string): Promise<AiResponse> {
    let controller = new AbortController();
    let response: AiResponse = {
      status: 0,
      data: ''
    };
    setTimeout(() => {
      controller.abort();
    }, 60000);
    let res = await window.fetch(`https://${window.location.host}/${params}`, {
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
    });
    return response;
  }

  // ai对话接口--问答
  // @ts-ignore
  static askAi(requestBody, params: string): Promise<AiResponse> {
    return new Promise((resolve, reject) => {
      let controller = new AbortController();
      let date = Date.now();
      if (!SpStatisticsHttpUtil.controllersMap.has(date)) {
        SpStatisticsHttpUtil.controllersMap.set(date, controller);
      }
      let response: AiResponse = {
        status: 0,
        data: '',
        time: date,
      };
      setTimeout(() => {
        controller.abort();
      }, 60000);
      window.fetch(`https://${window.location.host}/${params}`, {
        method: 'post',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer app-jGkqFUz9RP2wpNEZIjG5OJQ4'
        },
        body: JSON.stringify(requestBody)
      }).then(async res => {
        response.status = res.status;
        if (res.status === 200) {
          let resp = await res.text();
          let resj = await JSON.parse(resp);
          response.data = resj.event && resj.event === 'message' ? resj.answer : '服务器异常，请稍后再试';
        }
        else {
          response.data = '服务器请求失败';
        }
        resolve(response);
      }).catch((err) => {
        if (err.toString().indexOf('AbortError') > -1) {
          response.data = '请求超时，已中断！';
          response.status = 504;
        } else {
          response.data = '请求错误';
        }
        reject(response);
      });
    });
  }
}

export class AiResponse {
  status: number = 0;
  data: string = '';
  time?: number = 0;
}
