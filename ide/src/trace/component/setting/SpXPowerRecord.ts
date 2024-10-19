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
import LitSwitch from '../../../base-ui/switch/lit-switch';
import '../../../base-ui/select/LitAllocationSelect';

import '../../../base-ui/switch/lit-switch';
import { SpXPowerRecordHtml } from './SpXPowerRecord.html';
import { LitSearch } from '../trace/search/Search';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';
import { SpApplication } from '../../SpApplication';

@element('sp-xpower')
export class SpXPowerRecord extends BaseElement {
    private xpowerSwitch: LitSwitch | undefined | null;
    private configType: HTMLDivElement | undefined | null;
    private typeSelect: LitSelectV | undefined | null;
    private sp: SpApplication | undefined;
    private inputEvent: HTMLInputElement | undefined;

    get recordXPower(): boolean {
        return this.xpowerSwitch!.checked;
    }

    initElements(): void {
        this.initRecordXpowerConfig();
        this.sp = document.querySelector('sp-application') as SpApplication;
        this.typeSelect = this.shadowRoot?.querySelector<LitSelectV>("lit-select-v[title='MessageType']");
        this.inputEvent = this.typeSelect!.shadowRoot?.querySelector('input') as HTMLInputElement;
        this.xpowerSwitch = this.shadowRoot?.querySelector('.xpower-switch') as LitSwitch;
        let xpowerConfigList = this.shadowRoot?.querySelectorAll<HTMLDivElement>('.xpower-config-top');
        this.xpowerSwitch.addEventListener('change', () => {
            let configVisibility = 'none';
            if (this.xpowerSwitch?.checked) {
                configVisibility = 'block';
            }
            if (xpowerConfigList) {
                xpowerConfigList!.forEach((configEl) => {
                    configEl.style.display = configVisibility;
                });
            }
        });

    }

    private initRecordXpowerConfig(): void {
        this.configType = this.shadowRoot?.querySelector('.xpower-config-top');
        xpowerConfigList.forEach((config) => {
            switch (config.type) {
                case 'select-multiple':
                    this.configTypeBySelectMultiple(config, this.configType!);
                    break;
                default:
                    break;
            }
        });
    }

    private configTypeBySelectMultiple(config: unknown, recordXpowerDiv: HTMLDivElement): void {
        let html = '';
        //@ts-ignore
        let placeholder = config.selectArray[0];
        //@ts-ignore
        if (config.title === 'MessageType') {
            placeholder = 'NONE';
        }
        html += `<lit-select-v default-value="" rounded="" class="record-type-select config" 
    mode="multiple" canInsert="" title="${
            //@ts-ignore
            config.title
            }" rounded placement = "bottom" placeholder="${placeholder}">`;
        //@ts-ignore
        config.selectArray.forEach((value: string) => {
            html += `<lit-select-option value="${value}">${value}</lit-select-option>`;
        });
        html += '</lit-select-v>';
        recordXpowerDiv.innerHTML = recordXpowerDiv.innerHTML + html;
    }

    getXpowerConfig(): string | undefined {
        let recordXpowerConfigVal = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
        let xpowerConfig: string = '';
        recordXpowerConfigVal!.forEach((value) => {
            xpowerConfig = this.getXpowerConfigData(value, xpowerConfig);
        });
        return xpowerConfig;
    }

    private getXpowerConfigData(value: HTMLElement, xpowerConfig: string): string {
        switch (value.title) {
            case 'MessageType':
                xpowerConfig = this.xpowerConfigByTypeList(xpowerConfig, value as LitSelectV);
                break;
        }
        return xpowerConfig;
    }

    private xpowerConfigByTypeList(xpowerConfig: string, selectValue: LitSelectV): string {
        xpowerConfig = selectValue.value;
        return xpowerConfig;
    }

    typeSelectMousedownHandler = (): void => {
        this.typeSelect!.dataSource([], '');
    };

    typeSelectClickHandler = (): void => {
        this.typeSelect?.dataSource(['REAL_BATTERY', 'THERMAL_REPORT'], '');
    };

    connectedCallback(): void {
        this.inputEvent?.addEventListener('mousedown', this.typeSelectMousedownHandler);
        this.inputEvent?.addEventListener('click', this.typeSelectClickHandler);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.inputEvent?.removeEventListener('mousedown', this.typeSelectMousedownHandler);
        this.inputEvent?.removeEventListener('click', this.typeSelectClickHandler);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        super.attributeChangedCallback(name, oldValue, newValue);
    }

    initHtml(): string {
        return SpXPowerRecordHtml;
    }
}

const xpowerConfigList = [
    {
        title: 'MessageType',
        des: 'Select MessageType',
        hidden: true,
        type: 'select-multiple',
        selectArray: [''],
    }
];
