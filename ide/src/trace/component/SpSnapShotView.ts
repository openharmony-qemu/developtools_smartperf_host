/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the 'License');
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
import { SpSystemTrace } from './SpSystemTrace';
import { SpSnapShotViewHtml } from './SpSnapShotView.html';
import { SnapShotStruct } from '../database/ui-worker/ProcedureWorkerSnaps';

@element('sp-snapshot-view')
export class SpSnapShotView extends BaseElement {
    private chatBox: HTMLElement | undefined | null;
    private snapShotView: HTMLElement | undefined | null;

    initElements(): void {
        this.chatBox = document.querySelector("body > sp-application")?.shadowRoot?.querySelector("#sp-snapshot-view")?.shadowRoot?.querySelector(".chatBox");
        this.snapShotView = document.querySelector("body > sp-application")?.shadowRoot?.querySelector("#sp-snapshot-view");
        let sp = document.querySelector("body > sp-application")?.shadowRoot?.querySelector("#sp-system-trace") as SpSystemTrace;
        let closeBtn = document.querySelector("body > sp-application")?.shadowRoot?.querySelector("#sp-snapshot-view")?.shadowRoot?.querySelector("div > lit-icon")?.shadowRoot?.querySelector('#icon');
        closeBtn?.addEventListener('click', () => {
            this.snapShotView!.style.visibility = 'hidden';
            this.snapShotView!.style.display = 'none';
            SnapShotStruct.hoverSnapShotStruct = undefined;
            SnapShotStruct.selectSnapShotStruct = undefined;
            SnapShotStruct.isClear = true;
            setTimeout(() => {
                SnapShotStruct.isClear = false;
            }, 0);
            sp.refreshCanvas(true);
        })
    }

    init(data: SnapShotStruct): void {
        this.drawImage(data.img);
    }

    drawImage(base64Image: string): void {
        const imageContainer = this.chatBox!.querySelector('.image-container') as HTMLElement;
        imageContainer.innerHTML = '';
        const proportion = 350 * 2720 / 1260;
        const img = document.createElement('img');
        img.src = base64Image;
        img.style.width = '350px';
        img.style.maxHeight = `${proportion}px`;

        imageContainer.appendChild(img);
    }

    initHtml(): string {
        return SpSnapShotViewHtml;
    }
}