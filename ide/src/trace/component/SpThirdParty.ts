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
import { LitMainMenu, MenuItem } from '../../base-ui/menu/LitMainMenu';
import { SpApplication } from '../SpApplication';
@element('sp-third-party')
export class SpThirdParty extends BaseElement {
  private bodyEl: HTMLElement | undefined | null;
  private uploadEl: HTMLElement | undefined | null;
  private inputEl: HTMLInputElement | undefined | null;
  private sp: SpApplication | undefined;

  initElements(): void {
    let parentElement = this.parentNode as HTMLElement;
    parentElement.style.overflow = 'hidden';
    this.bodyEl = this.shadowRoot?.querySelector('.body');
    this.uploadEl = this.shadowRoot?.querySelector('.upload-btn')?.shadowRoot?.querySelector('#custom-button');
    this.inputEl = this.shadowRoot?.querySelector('#file');
    this.uploadEl?.addEventListener('click', () => {
      this.inputEl?.click();
    });
    this.inputEl!.addEventListener('change', () => {
      let files = this.inputEl!.files;
      if (files && files.length > 0) {
        let main = this.parentNode!.parentNode!.querySelector('lit-main-menu') as LitMainMenu;
        let children = main.menus!;
        let child = children[0].children as Array<MenuItem>;
        let fileHandler = child[0].fileHandler!;
        fileHandler({
          detail: files[0],
        });
      }
      if (this.inputEl) this.inputEl.value = '';
    });
  }

  initHtml(): string {
    return `
        ${this.initHtmlStyle()}
        <div class="sp-third-party-container">
         <div class="body">
           <input id="file" class="file" accept="application/json" type="file" style="display:none;pointer-events:none;"/>
           <lit-button class="upload-btn" height="32px" width="180px" color="#0A59F7" font_size="14px" border="1px solid #0A59F7"
            padding="0 0 0 12px" justify_content="left" icon="folder" margin_icon="0 10px 0 8px">
              Open bpftrace file
            </lit-button>
         </div>
        </div>
        `;
  }

  private initHtmlStyle(): string {
    return `
      <style>
        .sp-third-party-container {
          background-color: var(--dark-background5,#F6F6F6);
          min-height: 100%;
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows:1fr;
        }
        :host{
          width: 100%;
          height: 100%;
          background-color: var(--dark-background5,#F6F6F6);
          display: block;
        }
        .body{
          width: 85%;
          margin: 2% 5% 2% 5%;
          background-color: var(--dark-background3,#FFFFFF);
          border-radius: 16px 16px 16px 16px;
          padding-left: 2%;
          padding-right: 4%;
        }
        .upload-btn {
          margin-top: 2%;
          margin-left: 3%;
        }
        </style>
    `;
  }
}
