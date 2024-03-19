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
import { SpKeyboardHtml } from './SpKeyboard.html';

@element('sp-keyboard')
export class SpKeyboard extends BaseElement {
  initElements(): void {
    let parentElement = this.parentNode as HTMLElement;
    parentElement.style.overflow = 'hidden';
    let closeWindow = this.shadowRoot?.querySelector('.close-icon');
    let keyboardDiv = document
    .querySelector('body > sp-application')!
      .shadowRoot!.querySelector<SpKeyboard>('#sp-keyboard')!;
    let welcomeDiv = document
    .querySelector('body > sp-application')!
      .shadowRoot!.querySelector<SpKeyboard>('#sp-welcome')!;
    let shadow_box = this.shadowRoot?.querySelector('.shadow-box')!;
    closeWindow!.addEventListener('click', () => {
      keyboardDiv.style.visibility = 'hidden';
      welcomeDiv.style.visibility = 'visible';
    });
    shadow_box!.addEventListener('click', () => {
      keyboardDiv.style.visibility = 'hidden';
      welcomeDiv.style.visibility = 'visible';
    });
  }

  initHtml(): string {
    return SpKeyboardHtml;
  }
}
