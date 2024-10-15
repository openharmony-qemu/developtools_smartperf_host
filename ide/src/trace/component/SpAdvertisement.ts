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
import { SpAdvertisementHtml } from "./SpAdvertisement.html";
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';

@element('sp-advertisement')
export class SpAdvertisement extends BaseElement {
    private advertisementEL: HTMLElement | undefined | null;
    private closeEL: HTMLElement | undefined | null;
    private noticeEl: HTMLElement | undefined | null;
    private message: string = '';

    initElements(): void {
        // 整个广告
        this.advertisementEL = document.querySelector("body > sp-application")?.shadowRoot?.
            querySelector("#sp-advertisement")?.shadowRoot?.querySelector("#sp-advertisement");
        // 关闭按钮
        this.closeEL = document.querySelector("body > sp-application")?.shadowRoot?.
            querySelector("#sp-advertisement")?.shadowRoot?.querySelector("#close");
        // 公告内容
        this.noticeEl = document.querySelector("body > sp-application")?.shadowRoot?.
            querySelector("#sp-advertisement")?.shadowRoot?.querySelector("#notice");
        this.getMessage();
        setInterval(() => {
            this.getMessage();
        }, 10000);
        this.closeEL?.addEventListener('click', () => {
            this.advertisementEL!.style!.display = 'none';
        })
    }

    private getMessage() {
        SpStatisticsHttpUtil.getNotice().then(res => {
            res.text().then((it) => {
                let resp = JSON.parse(it);
                if (resp && resp.data && resp.data.data && resp.data.data !== this.message && resp.data.data !== '') {
                    this.message = resp.data.data;
                    if (this.message.startsWith('图片:')) {
                        this.noticeEl!.style.display = "flex";
                        this.noticeEl!.style.justifyContent = "center";
                        this.noticeEl!.innerHTML = `<img src ="${this.message.substring(3, this.message.length)}" style="height:150px" 
                    alt = "图片加载失败"></img>`
                    } else if (this.message.startsWith('链接:')) {
                        this.noticeEl!.style.height = "auto";
                        this.noticeEl!.style.color = "#000";
                        this.noticeEl!.innerHTML = `链接：<a href = "${this.message.substring(3, this.message.length)}" target = "black">
                    ${this.message.substring(3, this.message.length)}</a>`
                    } else {
                        this.noticeEl!.style.color = "red";
                        this.noticeEl!.innerHTML = this.message;
                    }
                    this.advertisementEL!.style!.display = 'block';
                }
            });
        })
    }

    initHtml(): string {
        return SpAdvertisementHtml;
    }
}