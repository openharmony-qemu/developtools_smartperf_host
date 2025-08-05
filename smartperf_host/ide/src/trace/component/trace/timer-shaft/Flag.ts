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

export class Flag {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  time: number = 0;
  color: string = '';
  selected: boolean = false;
  text: string = '';
  hidden: boolean = false;
  type: string = '';

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    time: number,
    color: string = '#999999',
    text: string = '',
    selected = false,
    type: string = ''
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.time = time;
    this.color = color;
    this.selected = selected;
    this.type = type;
    this.text = text;
  }
}
