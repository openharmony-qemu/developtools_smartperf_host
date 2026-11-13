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
 * WITHOUT WARRANTIES OR CONDITIONS OF unknown KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BaseElement, element } from '../../base-ui/BaseElement';
import { SpAdvertisementHtml } from './SpAdvertisement.html';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { InterfaceConfigManager } from '../../utils/interfaceConfiguration';

@element('sp-advertisement')
export class SpAdvertisement extends BaseElement {
    private advertisementEL: HTMLElement | undefined | null;
    private closeEL: HTMLElement | undefined | null;
    private noticeEl: HTMLElement | undefined | null;
    private publishUrl: string = '';

    initElements(): void {
        // 整个广告
        this.advertisementEL = document.querySelector('body > sp-application')?.shadowRoot?.
            querySelector('#sp-advertisement')?.shadowRoot?.querySelector('#sp-advertisement');
        // 关闭按钮
        this.closeEL = document.querySelector('body > sp-application')?.shadowRoot?.
            querySelector('#sp-advertisement')?.shadowRoot?.querySelector('#close');
        // 公告内容
        this.noticeEl = document.querySelector('body > sp-application')?.shadowRoot?.
            querySelector('#sp-advertisement')?.shadowRoot?.querySelector('.text');
        this.closeEL?.addEventListener('click', () => {
            this.advertisementEL!.style!.display = 'none';
            localStorage.setItem('isdisplay', 'false');
        });
        this.getMessage();
        setInterval(() => {
            this.getMessage();
        }, 300000);
    };

    private async getMessage(): Promise<void> {
        try {
            await SpStatisticsHttpUtil.getServerInfo();
            let publish = localStorage.getItem('publishUrl');
            const advertisingConfig = InterfaceConfigManager.getConfig()?.advertisingConfig;
            if (advertisingConfig) {
                if (advertisingConfig.switch && advertisingConfig!.url !== '') {
                    this.publishUrl = advertisingConfig!.url;
                    localStorage.setItem('publishUrl', this.publishUrl);
                    this.noticeEl!.innerHTML = `<iframe src=${this.publishUrl} width="100%" height="100%" frameborder="0"></iframe>`;
                    if (publish) {
                        if (this.publishUrl !== publish) {
                            localStorage.setItem('isdisplay', 'true');
                        }
                    } else {
                        localStorage.setItem('isdisplay', 'true');
                    }
                } else {
                    localStorage.setItem('isdisplay', 'false');
                }
                let isdisplay = localStorage.getItem('isdisplay');
                this.advertisementEL!.style!.display = isdisplay === 'true' ? 'block' : 'none';
            } else {
                this.advertisementEL!.style!.display = 'none';
            }
        } catch (e) {
            console.error(e);
        }
    }


    initHtml(): string {
        return SpAdvertisementHtml;
    }
}