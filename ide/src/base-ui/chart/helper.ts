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

export const resizeCanvas = (c: HTMLCanvasElement): void => {
  let el: Element = (c.getRootNode({ composed: false }) as ShadowRoot).host;
  let dpr = window.devicePixelRatio || 1;
  c.width = Math.ceil(el.clientWidth * dpr);
  c.height = Math.ceil(el.clientHeight * dpr);
  c.style.width = `${el.clientWidth}px`;
  c.style.height = `${el.clientHeight}px`;
  c.getContext('2d', { alpha: true })?.scale(dpr, dpr);
};
