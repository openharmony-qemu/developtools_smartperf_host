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

import { BaseElement, element } from '../BaseElement';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';

@element('lit-like')
export class LitLike extends BaseElement {
    private likeEl: HTMLDivElement | undefined | null;
    private dislikeEl: HTMLDivElement | undefined | null;
    private isFeedBacked: boolean = false;
    private _type?: string;
    private _content?: string;


    static get observedAttributes(): string[] {
        return ['type', 'content'];
    };

    get type(): string {
        return this.getAttribute('type') || '';
    }

    set type(value: string) {
        this._type = value;
        this.setAttribute('type', value);
    }

    get content(): string {
        return this.getAttribute('content') || '';
    }

    set content(value: string) {
        this._type = value;
        this.setAttribute('content', value);
    }
    initElements(): void {
        this.likeEl = this.shadowRoot?.querySelector('.like');
        this.dislikeEl = this.shadowRoot?.querySelector('.dislike');

        this.likeEl?.addEventListener('click', (e) => {
            if (!this.isFeedBacked) {
                this.likeEl!.style.backgroundImage = 'url("img/like-active.png")';
                let secondCat = this.type === 'chat' ? 'user_feedback' : 'feedback_good';
                let thirdCat = this.type === 'chat' ? ['1'] : [this.content];
                SpStatisticsHttpUtil.generalRecord('AI_statistic', secondCat, thirdCat);
                this.isFeedBacked = true;
            } else {
                return;
            }
        });

        this.dislikeEl?.addEventListener('click', (e) => {
            if (!this.isFeedBacked) {
                this.dislikeEl!.style.backgroundImage = 'url("img/dislike-active.png")';
                let secondCat = this.type === 'chat' ? 'user_feedback' : 'feedback_bad';
                let thirdCat = this.type === 'chat' ? ['0'] : [this.content];
                SpStatisticsHttpUtil.generalRecord('AI_statistic', secondCat, thirdCat);
                this.isFeedBacked = true;
            } else {
                return;
            }
        });
    }


    initHtml(): string {
        return `
            <style>
                .likeAndDislike {
                    width:60px;
                    height:25px;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    position:absolute;
                    right:10px;
                }

                .like,.dislike {
                    width:25px;
                    height:25px;
                    background-size:25px;
                }

                .like {
                    background-image:url('img/like.png');
                }

                .dislike {
                    background-image:url('img/dislike.png');
                }

                .like:hover {
                    background-image:url('img/like-active.png');
                    background-size:25px;
                }

                .dislike:hover {
                    background-image:url('img/dislike-active.png');
                    background-size:25px;
                }
            </style>

            <div class = 'likeAndDislike'>
                <div class = 'like'>
                </div>
                <div class = 'dislike'>
                </div>
            </div>
            `;
    }


}
