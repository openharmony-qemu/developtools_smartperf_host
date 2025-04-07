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

@element('sp-advertisement')
export class SpAdvertisement extends BaseElement {
    private advertisementEL: HTMLElement | undefined | null;
    private closeEL: HTMLElement | undefined | null;
    private noticeEl: HTMLElement | undefined | null;
    private message: string = '';

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
    };

    private getMessage(): void {
        SpStatisticsHttpUtil.getNotice().then(res => {
            if (res.status === 200) {
                res.text().then((it) => {
                    let resp = JSON.parse(it);
                    let publish = localStorage.getItem('message');
                    if (resp && resp.data && resp.data.data && resp.data.data !== '') {
                        this.message = resp.data.data;
                        localStorage.setItem('message', this.message);
                        let parts = this.message.split(';');
                        let registrationLinkInfo = (parts[2].match(/版本特性链接:([^\s]+)/) || [])[1] || '';
                        let registrationLink = `<a href="${registrationLinkInfo}" target="_blank">版本特性链接</a>`;
                        let finalString = `${parts[0]}<br>${parts[1]}<br>${registrationLink}`;
                        this.noticeEl!.innerHTML = `<p>${finalString}</p>`;
                        if (publish) {
                            if (resp.data.data !== publish) {
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
                });
            } else {
                this.advertisementEL!.style!.display = 'none';
            }
        }).catch(err => {
            this.advertisementEL!.style!.display = 'none';
        });
    }


    initHtml(): string {
        return SpAdvertisementHtml;
    }
}