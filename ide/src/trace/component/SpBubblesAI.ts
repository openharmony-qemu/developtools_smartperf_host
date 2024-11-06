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

import { BaseElement, element } from '../../base-ui/BaseElement';
import { SpBubblesAIHtml } from './SpBubblesAI.html';
import { FlagsConfig, Params } from './SpFlags';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';

@element('sp-bubble-ai')
export class SpBubblesAI extends BaseElement {
  static isAIHover: boolean = false;
  initElements(): void {
    const xiaoLubanEl: HTMLElement | undefined | null = this.shadowRoot?.querySelector('#xiao-luban-help');
    xiaoLubanEl?.addEventListener('click', () => {
      this.xiaoLubanEvent();
      let requestBody = {
        action: 'AItrace',
        event: 'AItrace'
      };
      SpStatisticsHttpUtil.addOrdinaryVisitAction(requestBody);
      SpStatisticsHttpUtil.generalRecord('AI_statistic', 'smart_luban', []);
    });
    let isShowXiaoLuban: boolean = FlagsConfig.getFlagsConfigEnableStatus('AI');
    if (isShowXiaoLuban) {
      xiaoLubanEl?.setAttribute('enabled', '');
    } else {
      xiaoLubanEl?.removeAttribute('enabled');
    }
    // 鼠标进入元素
    xiaoLubanEl?.addEventListener('mouseenter', function () {
      SpBubblesAI.isAIHover = true;
    });

    // 鼠标离开元素
    xiaoLubanEl?.addEventListener('mouseleave', function () {
      SpBubblesAI.isAIHover = false;
    });
  }

  initHtml(): string {
    return SpBubblesAIHtml;
  }

  private xiaoLubanEvent(): void {
    const flagConfig: Params | undefined = FlagsConfig.getFlagsConfig('AI');
    const userId: string | undefined = flagConfig!.userId?.toString();
    const data = {
      'sender': `${userId}`,
      'msgBody': 'rag SmartPerf_ad85b972',
      'msgType': 'text',
      'timestamp': new Date().getTime().toString(),
      'botUser': 'p_xiaoluban',
    };
    fetch(`https://${window.location.host}/xiaoluban/resource`, {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      if (res.status === 200) {
        window.open('im:p_xiaoluban', '_self');
      }
    });
  }
}


