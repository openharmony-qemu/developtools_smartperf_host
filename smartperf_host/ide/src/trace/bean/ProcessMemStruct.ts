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
import { ColorUtils } from '../component/trace/base/ColorUtils';

export class ProcessMemStruct extends BaseStruct {
  static hoverProcessMemStruct: ProcessMemStruct | undefined;
  processName: string | undefined;
  pid: number | undefined;
  upid: number | undefined;
  trackName: string | undefined;
  type: string | undefined;
  track_id: string | undefined;
  value: number | undefined;
  startTime: number | undefined;
  duration: number | undefined;
  maxValue: number | undefined;
  minValue: number | undefined;
  delta: number | undefined;

  static draw(pMemCtx: CanvasRenderingContext2D, pMemData: ProcessMemStruct): void {
    if (pMemData.frame) {
      let width = pMemData.frame.width || 0;
      if (pMemData.startTime === ProcessMemStruct.hoverProcessMemStruct?.startTime) {
        pMemCtx.lineWidth = 1;
        pMemCtx.globalAlpha = 0.6;
        let drawHeight: number = Math.floor(
          ((pMemData.value || 0) * (pMemData.frame.height || 0) * 1.0) / (pMemData.maxValue || 0)
        );
        pMemCtx.fillRect(pMemData.frame.x, pMemData.frame.y + pMemData.frame.height - drawHeight, width, drawHeight);
        pMemCtx.beginPath();
        pMemCtx.arc(pMemData.frame.x, pMemData.frame.y + pMemData.frame.height - drawHeight, 3, 0, 2 * Math.PI, true);
        pMemCtx.fill();
        pMemCtx.globalAlpha = 1.0;
        pMemCtx.stroke();
        pMemCtx.beginPath();
        pMemCtx.moveTo(pMemData.frame.x + 3, pMemData.frame.y + pMemData.frame.height - drawHeight);
        pMemCtx.lineWidth = 3;
        pMemCtx.lineTo(pMemData.frame.x + width, pMemData.frame.y + pMemData.frame.height - drawHeight);
        pMemCtx.stroke();
      } else {
        pMemCtx.fillStyle = ColorUtils.colorForTid(pMemData.maxValue || 0);
        pMemCtx.strokeStyle = ColorUtils.colorForTid(pMemData.maxValue || 0);
        pMemCtx.globalAlpha = 0.6;
        pMemCtx.lineWidth = 1;
        let drawHeight: number =
          ((pMemData.value || 0) * (pMemData.frame.height || 0) * 1.0) / (pMemData.maxValue || 1);
        pMemCtx.fillRect(pMemData.frame.x, pMemData.frame.y + pMemData.frame.height - drawHeight, width, drawHeight);
      }
    }
    pMemCtx.globalAlpha = 1.0;
    pMemCtx.lineWidth = 1;
  }
}
