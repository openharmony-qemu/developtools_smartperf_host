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

export function randomRgbColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function isPointIsCircle(x1: number, y1: number, x2: number, y2: number, radius: number): boolean {
  return Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2)) < radius;
}

export const pieChartColors = [
  '#5b8ff9',
  '#5ad8a6',
  '#5d7092',
  '#f6bd16',
  '#e8684a',
  '#6DC8EC',
  '#9270CA',
  '#FF9D4D',
  '#269A99',
  '#FF99C3',
  '#0039AC',
  '#229D00',
  '#AEAEAE',
  '#FFEE00',
  '#FF3000',
  '#CBE1FF',
  '#6000FF',
  '#A24900',
  '#70FFFE',
  '#FF00C4',
];
