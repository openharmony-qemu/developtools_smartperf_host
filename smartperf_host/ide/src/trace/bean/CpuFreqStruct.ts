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

import { ColorUtils } from '../component/trace/base/ColorUtils';
import { BaseStruct } from './BaseStruct';

export class CpuFreqStruct extends BaseStruct {
  static maxFreq: number = 0;
  static maxFreqName: string = '0 GHz';
  static hoverCpuFreqStruct: CpuFreqStruct | undefined;
  static selectCpuFreqStruct: CpuFreqStruct | undefined;
  cpu: number | undefined;
  value: number | undefined;
  startNS: number | undefined;
  dur: number | undefined; // Self-supplementing, the database is not returned

  static draw(freqCtx: unknown, freqData: CpuFreqStruct): void {
    if (freqData.frame) {
      let freqWidth = freqData.frame.width || 0;
      let freqIndex = freqData.cpu || 0;
      freqIndex += 2;
      // @ts-ignore
      freqCtx.fillStyle = ColorUtils.colorForTid(freqIndex);
      // @ts-ignore
      freqCtx.strokeStyle = ColorUtils.colorForTid(freqIndex);
      if (freqData.startNS === CpuFreqStruct.hoverCpuFreqStruct?.startNS) {
        // @ts-ignore
        freqCtx.lineWidth = 1;
        // @ts-ignore
        freqCtx.globalAlpha = 0.6;
        let drawHeight: number = Math.floor(
          ((freqData.value || 0) * (freqData.frame.height || 0) * 1.0) / CpuFreqStruct.maxFreq
        );
        // @ts-ignore
        freqCtx.fillRect(
          freqData.frame.x,
          freqData.frame.y + freqData.frame.height - drawHeight,
          freqWidth,
          drawHeight
        );
        // @ts-ignore
        freqCtx.beginPath();
        // @ts-ignore
        freqCtx.arc(freqData.frame.x, freqData.frame.y + freqData.frame.height - drawHeight, 3, 0, 2 * Math.PI, true);
        // @ts-ignore
        freqCtx.fill();
        // @ts-ignore
        freqCtx.globalAlpha = 1.0;
        // @ts-ignore
        freqCtx.stroke();
        // @ts-ignore
        freqCtx.beginPath();
        // @ts-ignore
        freqCtx.moveTo(freqData.frame.x + 3, freqData.frame.y + freqData.frame.height - drawHeight);
        // @ts-ignore
        freqCtx.lineWidth = 3;
        // @ts-ignore
        freqCtx.lineTo(freqData.frame.x + freqWidth, freqData.frame.y + freqData.frame.height - drawHeight);
        // @ts-ignore
        freqCtx.stroke();
      } else {
        // @ts-ignore
        freqCtx.globalAlpha = 0.6;
        // @ts-ignore
        freqCtx.lineWidth = 1;
        let drawHeight: number = Math.floor(
          ((freqData.value || 0) * (freqData.frame.height || 0)) / CpuFreqStruct.maxFreq
        );
        // @ts-ignore
        freqCtx.fillRect(
          freqData.frame.x,
          freqData.frame.y + freqData.frame.height - drawHeight,
          freqWidth,
          drawHeight
        );
      }
    }
    // @ts-ignore
    freqCtx.globalAlpha = 1.0;
    // @ts-ignore
    freqCtx.lineWidth = 1;
  }
}
