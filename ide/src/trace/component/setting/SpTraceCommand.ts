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

import { BaseElement, element } from '../../../base-ui/BaseElement';
import { info } from '../../../log/Log';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';
import { PluginConvertUtils } from './utils/PluginConvertUtils';
import { SpTraceCommandHtml } from './SpTraceCommand.html';

@element('trace-command')
export class SpTraceCommand extends BaseElement {
  private codeHl: HTMLTextAreaElement | undefined | null;
  private copyEl: HTMLElement | undefined | null;

  get hdcCommon(): string {
    return `${this.codeHl!.textContent}`;
  }

  set hdcCommon(value: string) {
    info('hdc Common is:', value);
    this.codeHl!.textContent = value;
  }

  //当 custom element首次被插入文档DOM时，被调用。
  public connectedCallback(): void {
    this.codeHl!.textContent = '';
    this.copyEl?.addEventListener('click', this.codeCopyEvent);
    this.codeHl?.addEventListener('selectionchange', this.textSelectEvent);
  }

  public disconnectedCallback(): void {
    this.copyEl?.removeEventListener('click', this.codeCopyEvent);
  }

  codeCopyEvent = (): void => {
    this.codeHl?.select();
    document.execCommand('copy');
    let allPlugin: Array<string> = [];
    PluginConvertUtils.pluginConfig.forEach((plugin) => {
      allPlugin.push(plugin.pluginName);
    });
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      action: 'config_page',
      event: 'offline_record',
      eventData: {
        plugin: allPlugin,
      },
    });
  };

  textSelectEvent = (): void => {
    this.copyEl!.style.backgroundColor = '#FFFFFF';
  };

  initElements(): void {
    this.codeHl = this.shadowRoot?.querySelector('#code-text') as HTMLTextAreaElement;
    this.copyEl = this.shadowRoot?.querySelector('#copy-image') as HTMLElement;
  }

  initHtml(): string {
    return SpTraceCommandHtml;
  }
}
