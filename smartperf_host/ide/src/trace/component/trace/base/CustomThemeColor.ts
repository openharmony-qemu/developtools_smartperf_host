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

import { BaseElement, element } from '../../../../base-ui/BaseElement';
import { ColorUtils } from './ColorUtils';
import { LitRadioBox } from '../../../../base-ui/radiobox/LitRadioBox';
import { SpApplication } from '../../../SpApplication';
import { SpSystemTrace } from '../../SpSystemTrace';
import { CustomThemeColorHtml } from './CustomThemeColor.html';

@element('custom-theme-color')
export class CustomThemeColor extends BaseElement {
  private application: SpApplication | undefined | null;
  private radios: NodeListOf<LitRadioBox> | undefined | null;
  private colorsArray: Array<string> = [];
  private colorsEl: HTMLDivElement | undefined | null;
  private theme: Theme = Theme.LIGHT;
  private systemTrace: SpSystemTrace | undefined | null;

  static get observedAttributes(): string[] {
    return ['mode'];
  }

  init(): void {
    window.localStorage.getItem('Theme') === 'light' ? (this.theme = Theme.LIGHT) : (this.theme = Theme.DARK);
    if (window.localStorage.getItem('Theme') === 'light' || !window.localStorage.getItem('Theme')) {
      this.theme = Theme.LIGHT;
    } else {
      this.theme = Theme.DARK;
    }
    this.application!.changeTheme(this.theme);
    this.setRadioChecked(this.theme);
  }

  /**
   * 更新色板
   * @param colorsEl 色板的父元素
   */
  createColorsEl(colorsEl: HTMLDivElement): void {
    for (let i = 0; i < this.colorsArray!.length; i++) {
      let div = document.createElement('div');
      div.className = 'color-wrap';
      let input = document.createElement('input');
      input.type = 'color';
      input.className = 'color';
      input.value = this.colorsArray![i];
      div.appendChild(input);
      colorsEl?.appendChild(div);
      input.addEventListener('change', (evt: unknown): void => {
        //@ts-ignore
        input.value = evt?.target.value; //@ts-ignore
        this.colorsArray![i] = evt?.target.value;
      });
    }
  }

  /**
   * 根据传入的主题改变color setting页面的单选框状态，更新颜色数组
   * @param theme 主题模式
   */
  setRadioChecked(theme: Theme): void {
    for (let i = 0; i < this.radios!.length; i++) {
      if (this.radios![i].innerHTML === theme) {
        this.radios![i].setAttribute('checked', '');
        if (theme === Theme.LIGHT) {
          this.colorsArray =
            window.localStorage.getItem('LightThemeColors') === null
              ? [...ColorUtils.FUNC_COLOR_A]
              : JSON.parse(window.localStorage.getItem('LightThemeColors')!);
        } else {
          this.colorsArray =
            window.localStorage.getItem('DarkThemeColors') === null
              ? [...ColorUtils.FUNC_COLOR_B]
              : JSON.parse(window.localStorage.getItem('DarkThemeColors')!);
        }
      } else {
        this.radios![i].removeAttribute('checked');
      }
    }
    this.colorsEl!.innerHTML = '';
    this.createColorsEl(this.colorsEl!);
  }

  initElements(): void {
    this.colorsEl = this.shadowRoot?.querySelector('.colors') as HTMLDivElement;
    this.application = document.querySelector('body > sp-application') as SpApplication;
    this.systemTrace = this.application.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    let close = this.shadowRoot?.querySelector('.page-close');
    this.radioClick();
    close!.addEventListener('click', (): void => {
      if (this.application!.hasAttribute('custom-color')) {
        this.application!.removeAttribute('custom-color');
        this.setAttribute('hidden', '');
      }
      this.cancelOperate();
    });
    let resetBtn = this.shadowRoot?.querySelector<HTMLButtonElement>('#reset');
    let previewBtn = this.shadowRoot?.querySelector<HTMLButtonElement>('#preview');
    let confirmBtn = this.shadowRoot?.querySelector<HTMLButtonElement>('#confirm');

    resetBtn?.addEventListener('click', (): void => {
      if (this.theme === Theme.LIGHT) {
        window.localStorage.setItem('LightThemeColors', JSON.stringify(ColorUtils.FUNC_COLOR_A));
      } else {
        window.localStorage.setItem('DarkThemeColors', JSON.stringify(ColorUtils.FUNC_COLOR_B));
      }
      this.application!.changeTheme(this.theme);
    });

    previewBtn?.addEventListener('click', (): void => {
      this.application!.changeTheme(this.theme, [...this.colorsArray]);
    });

    confirmBtn?.addEventListener('click', (): void => {
      this.confirmOPerate();
    });
    // 鼠标移入该页面，cpu泳道图恢复鼠标移出状态（鼠标移入cpu泳道图有数据的矩形上，和该矩形的tid或者pid不同的矩形会变灰，移出矩形，所有矩形恢复颜色）
    this.addEventListener('mousemove', (): void => {
      this.systemTrace!.tipEL!.style.display = 'none';
      this.systemTrace!.hoverStructNull();
      this.systemTrace!.refreshCanvas(true);
    });
  }

  private radioClick(): void {
    this.radios = this.shadowRoot?.querySelectorAll('.litRadio');
    if (this.radios) {
      for (let i = 0; i < this.radios.length; i++) {
        this.radios![i].shadowRoot!.querySelector<HTMLSpanElement>('.selected')!.classList.add('blue');
        this.radios[i].addEventListener('click', (): void => {
          // 点击颜色模式的单选框，色板切换
          if (this.radios![i].innerHTML === Theme.LIGHT) {
            if (this.radios![i].getAttribute('checked') === null) {
              this.colorsArray =
                window.localStorage.getItem('LightThemeColors') === null
                  ? [...ColorUtils.FUNC_COLOR_A]
                  : JSON.parse(window.localStorage.getItem('LightThemeColors')!);
              this.theme = Theme.LIGHT;
            } else {
              return;
            }
          } else if (this.radios![i].innerHTML === Theme.DARK) {
            if (this.radios![i].getAttribute('checked') === null) {
              this.colorsArray =
                window.localStorage.getItem('DarkThemeColors') === null
                  ? [...ColorUtils.FUNC_COLOR_B]
                  : JSON.parse(window.localStorage.getItem('DarkThemeColors')!);
              this.theme = Theme.DARK;
            } else {
              return;
            }
          }
          this.colorsEl!.innerHTML = '';
          this.createColorsEl(this.colorsEl!);
          this.confirmOPerate();
        });
      }
    }
  }

  confirmOPerate(): void {
    window.localStorage.setItem('Theme', this.theme);
    if (this.theme === Theme.LIGHT) {
      window.localStorage.setItem('LightThemeColors', JSON.stringify([...this.colorsArray]));
    } else {
      window.localStorage.setItem('DarkThemeColors', JSON.stringify([...this.colorsArray]));
    }
    this.application!.changeTheme(this.theme);
    this.setRadioChecked(this.theme);
  }

  cancelOperate(): void {
    if (window.localStorage.getItem('Theme') === 'light' || !window.localStorage.getItem('Theme')) {
      this.theme = Theme.LIGHT;
      this.colorsArray =
        window.localStorage.getItem('LightThemeColors') === null
          ? [...ColorUtils.FUNC_COLOR_A]
          : JSON.parse(window.localStorage.getItem('LightThemeColors')!);
    } else if (window.localStorage.getItem('Theme') === 'dark') {
      this.theme = Theme.DARK;
      this.colorsArray =
        window.localStorage.getItem('DarkThemeColors') === null
          ? [...ColorUtils.FUNC_COLOR_B]
          : JSON.parse(window.localStorage.getItem('DarkThemeColors')!);
    }
    this.application!.changeTheme(this.theme);
    // 恢复颜色模式单选框checked状态
    this.setRadioChecked(this.theme);
  }

  connectedCallback(): void {}

  initHtml(): string {
    return CustomThemeColorHtml;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'mode' && newValue === '') {
      this.init();
    }
  }
}
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}
