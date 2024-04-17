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

export class Rect {
  x: number = 0;
  y: number = 0;
  height: number = 0;
  width: number = 0;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.height = height;
    this.width = width;
  }

  static contains(rectObj: Rect, x: number, y: number): boolean {
    return rectObj.x <= x && x <= rectObj.x + rectObj.width && rectObj.y <= y && y <= rectObj.y + rectObj.height;
  }

  static containsWithPadding(
    rectObj: Rect,
    x: number,
    y: number,
    paddingLeftRight: number,
    paddingTopBottom: number
  ): boolean {
    return (
      rectObj.x + paddingLeftRight <= x &&
      x <= rectObj.x + rectObj.width - paddingLeftRight &&
      rectObj.y + paddingTopBottom <= y &&
      y <= rectObj.y + rectObj.height - paddingTopBottom
    );
  }

  static containsWithMargin(rectObj: Rect, x: number, y: number, t: number, r: number, b: number, l: number): boolean {
    return (
      rectObj.x - l <= x &&
      x <= rectObj.x + rectObj.width + r &&
      rectObj.y - t <= y &&
      y <= rectObj.y + rectObj.height + b
    );
  }

  static intersect(rectA: Rect | DOMRect, rectB: Rect | DOMRect): boolean {
    let maxX = Math.max(rectA.x + rectA.width, rectB.x + rectB.width);
    let maxY = Math.max(rectA.y + rectA.height, rectB.y + rectB.height);
    let minX = Math.min(rectA.x, rectB.x);
    let minY = Math.min(rectA.y, rectB.y);
    return maxX - minX < rectB.width + rectA.width && maxY - minY <= rectA.height + rectB.height;
  }

  static getIntersect(rectA: DOMRect | Rect, rectB: DOMRect | Rect): Rect {
    let maxX = Math.max(rectA.x, rectB.x);
    let maxY = Math.max(rectA.y, rectB.y);
    let width = Math.abs(Math.min(rectA.x + rectA.width, rectB.x + rectB.width) - Math.max(rectA.x, rectB.x));
    let height = Math.abs(Math.min(rectA.y + rectA.height, rectB.y + rectB.height) - Math.max(rectA.y, rectB.y));
    return new Rect(maxX, maxY, width, height);
  }

  contains(x: number, y: number): boolean {
    return this.x <= x && x <= this.x + this.width && this.y <= y && y <= this.y + this.height;
  }

  containsWithPadding(x: number, y: number, paddingLeftOrRight: number, paddingTopOrBottom: number): boolean {
    // ------------------------修改rangeruler部分鼠标形态根据高度调整-------------------------
    if (sessionStorage.getItem('expand') === 'true') {
      //展开
      this.height = 75;
    } else if (sessionStorage.getItem('expand') === 'false') {
      //折叠
      this.height = 75 - Number(sessionStorage.getItem('foldHeight'));
    }
    return (
      this.x + paddingLeftOrRight <= x &&
      x <= this.x + this.width - paddingLeftOrRight &&
      this.y + paddingTopOrBottom <= y &&
      y <= this.y + this.height - paddingTopOrBottom
    );
  }

  containsWithMargin(x: number, y: number, t: number, r: number, b: number, l: number): boolean {
    return this.x - l <= x && x <= this.x + this.width + r && this.y - t <= y && y <= this.y + this.height + b;
  }

  /**
   * 判断是否相交
   * @param rectObj
   */
  intersect(rectObj: Rect): boolean {
    let maxX = this.x + this.width >= rectObj.x + rectObj.width ? this.x + this.width : rectObj.x + rectObj.width;
    let maxY = this.y + this.height >= rectObj.y + rectObj.height ? this.y + this.height : rectObj.y + rectObj.height;
    let minX = this.x <= rectObj.x ? this.x : rectObj.x;
    let minY = this.y <= rectObj.y ? this.y : rectObj.y;
    return maxX - minX <= rectObj.width + this.width && maxY - minY <= this.height + rectObj.height;
  }
}

export class Point {
  x: number = 0;
  y: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
