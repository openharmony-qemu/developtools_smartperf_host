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

export function element(tag: string): (el: any) => void {
  return (el: any): void => {
    if (!customElements.get(tag)) {
      customElements.define(tag, el);
    }
  };
}

export abstract class BaseElement extends HTMLElement {
  args: any;

  public constructor(args: any | undefined | null = null) {
    super();
    this.args = args;
    this.attachShadow({ mode: 'open' }).innerHTML = this.initHtml();
    this.initElements();
  }

  abstract initElements(): void;

  abstract initHtml(): string;

  public connectedCallback(): void {}

  public disconnectedCallback(): void {}

  public adoptedCallback(): void {}

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {}
}
