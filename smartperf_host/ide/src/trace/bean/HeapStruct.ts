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

import { BaseStruct } from './BaseStruct';

export class HeapStruct extends BaseStruct {
  static hoverHeapStruct: HeapStruct | undefined;
  startTime: number | undefined;
  endTime: number | undefined;
  dur: number | undefined;
  eventType: string | undefined;
  heapsize: number | undefined;
  density: number | undefined;
  maxHeapSize: number = 0;
  minHeapSize: number = 0;

  static draw(heapCtx: CanvasRenderingContext2D, heapData: HeapStruct): void {
    if (heapData.frame) {
      let width = heapData.frame.width || 0;
      heapCtx.fillStyle = '#2db3aa';
      heapCtx.strokeStyle = '#2db3aa';
      if (heapData.startTime === HeapStruct.hoverHeapStruct?.startTime) {
        heapCtx.lineWidth = 1;
        heapCtx.globalAlpha = 0.6;
        let drawHeight: number = Math.ceil(
          ((heapData.heapsize || 0) * (heapData.frame.height || 0)) / heapData.maxHeapSize
        );
        heapCtx.fillRect(heapData.frame.x, heapData.frame.y + heapData.frame.height - drawHeight, width, drawHeight);
        heapCtx.beginPath();
        heapCtx.arc(heapData.frame.x, heapData.frame.y + heapData.frame.height - drawHeight, 3, 0, 2 * Math.PI, true);
        heapCtx.fill();
        heapCtx.globalAlpha = 1.0;
        heapCtx.stroke();
        heapCtx.beginPath();
        heapCtx.moveTo(heapData.frame.x + 3, heapData.frame.y + heapData.frame.height - drawHeight);
        heapCtx.lineWidth = 3;
        heapCtx.lineTo(heapData.frame.x + width, heapData.frame.y + heapData.frame.height - drawHeight);
        heapCtx.stroke();
      } else {
        heapCtx.globalAlpha = 0.6;
        heapCtx.lineWidth = 1;
        let drawHeight: number = Math.ceil(
          ((heapData.heapsize || 0) * (heapData.frame.height || 0)) / heapData.maxHeapSize
        );
        heapCtx.fillRect(heapData.frame.x, heapData.frame.y + heapData.frame.height - drawHeight, width, drawHeight);
      }
    }
    heapCtx.globalAlpha = 1.0;
    heapCtx.lineWidth = 1;
  }
}
