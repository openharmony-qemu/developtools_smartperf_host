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
@element('sp-third-party')
export class SpThirdParty extends BaseElement {
  private uploadJsonBtn: HTMLElement | undefined | null;
  private inputJsonEl: HTMLInputElement | undefined | null;
  private uploadCsvBtn: HTMLElement | undefined | null;
  private inputCsvEl: HTMLInputElement | undefined | null;

  initElements(): void {
    let parentElement = this.parentNode as HTMLElement;
    parentElement.style.overflow = 'hidden';
    this.uploadJsonBtn = this.shadowRoot?.querySelector('.upload-json-btn')?.shadowRoot?.querySelector('#custom-button');
    this.inputJsonEl = this.shadowRoot?.querySelector('#file');
    this.addUploadEvent(this.uploadJsonBtn!, this.inputJsonEl!);

    this.uploadCsvBtn = this.shadowRoot?.querySelector('.upload-csv-btn')?.shadowRoot?.querySelector('#custom-button');
    this.inputCsvEl = this.shadowRoot?.querySelector('#csv-file');
    this.addUploadEvent(this.uploadCsvBtn!, this.inputCsvEl!);
  }

  initHtml(): string {
    return `
        ${this.initHtmlStyle()}
        <div class="sp-third-party-container">
         <div class="body">
          <div>
            <input id="file" class="file" accept="application/json" type="file" style="display:none;pointer-events:none;"/>
            <lit-button class="upload-json-btn" height="32px" width="180px" color="#0A59F7" font_size="14px" border="1px solid #0A59F7"
              padding="0 0 0 12px" justify_content="left" icon="folder" margin_icon="0 10px 0 8px">
             Open bpftrace file
            </lit-button>
          </div>
          <div>
            <input id="csv-file" class="csv-file" accept=".csv" type="file" style="display:none;pointer-events:none;"/>
            <lit-button class="upload-csv-btn" height="32px" width="180px" color="#0A59F7" font_size="14px" border="1px solid #0A59F7"
            padding="0 0 0 12px" justify_content="left" icon="folder" margin_icon="0 10px 0 8px">
              Open gpu counter file
            </lit-button>
          </div>
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
        .upload-json-btn, .upload-csv-btn {
          margin-top: 2%;
          margin-left: 3%;
        }
        </style>
    `;
  }

  addUploadEvent(uploadBtn: HTMLElement, uploadEl: HTMLInputElement): void {
    uploadBtn?.addEventListener('click', () => {
      uploadEl?.click();
    });
    uploadEl!.addEventListener('change', () => {
      let files = uploadEl!.files;
      if (files && files.length > 0) {
        let main = this.parentNode!.parentNode!.querySelector('lit-main-menu') as LitMainMenu;
        let children = main.menus!;
        let child = children[0].children as Array<MenuItem>;
        let fileHandler = child[0].fileHandler!;
        fileHandler({
          detail: files[0]
        });
      }
      if (uploadEl) {
        uploadEl.value = '';
      }
    });
  }
}


