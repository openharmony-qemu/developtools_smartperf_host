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

import { Rect } from '../component/trace/timer-shaft/Rect';
import { BaseStruct } from './BaseStruct';

import { ns2x } from '../component/trace/TimerShaftElement';

export class FpsStruct extends BaseStruct {
  static maxFps: number = 0;
  static maxFpsName: string = '0 FPS';
  static hoverFpsStruct: FpsStruct | undefined;
  static selectFpsStruct: FpsStruct | undefined;
  fps: number | undefined;
  startNS: number | undefined = 0;
  dur: number | undefined; //自补充，数据库没有返回

  static draw(fpsCtx: CanvasRenderingContext2D, fpsData: FpsStruct): void {
    if (fpsData.frame) {
      let fpsBeanWidth = fpsData.frame.width || 0;
      fpsCtx.fillStyle = '#535da6';
      fpsCtx.strokeStyle = '#535da6';
      if (fpsData.startNS === FpsStruct.hoverFpsStruct?.startNS) {
        fpsCtx.lineWidth = 1;
        fpsCtx.globalAlpha = 0.6;
        let drawHeight: number = ((fpsData.fps || 0) * (fpsData.frame.height || 0) * 1.0) / FpsStruct.maxFps;
        fpsCtx.fillRect(fpsData.frame.x, fpsData.frame.y + fpsData.frame.height - drawHeight, fpsBeanWidth, drawHeight);
        fpsCtx.beginPath();
        fpsCtx.arc(fpsData.frame.x, fpsData.frame.y + fpsData.frame.height - drawHeight, 3, 0, 2 * Math.PI, true);
        fpsCtx.fill();
        fpsCtx.globalAlpha = 1.0;
        fpsCtx.stroke();
        fpsCtx.beginPath();
        fpsCtx.moveTo(fpsData.frame.x + 3, fpsData.frame.y + fpsData.frame.height - drawHeight);
        fpsCtx.lineWidth = 3;
        fpsCtx.lineTo(fpsData.frame.x + fpsBeanWidth, fpsData.frame.y + fpsData.frame.height - drawHeight);
        fpsCtx.stroke();
      } else {
        fpsCtx.globalAlpha = 0.6;
        fpsCtx.lineWidth = 1;
        let drawHeight: number = ((fpsData.fps || 0) * (fpsData.frame.height || 0) * 1.0) / FpsStruct.maxFps;
        fpsCtx.fillRect(fpsData.frame.x, fpsData.frame.y + fpsData.frame.height - drawHeight, fpsBeanWidth, drawHeight);
      }
    }
    fpsCtx.globalAlpha = 1.0;
    fpsCtx.lineWidth = 1;
  }

  static setFrame(
    fpsStruct: FpsStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let fpsBeanStructX1: number;
    let fpsBeanStructX2: number;
    if ((fpsStruct.startNS || 0) < startNS) {
      fpsBeanStructX1 = 0;
    } else {
      fpsBeanStructX1 = ns2x(fpsStruct.startNS || 0, startNS, endNS, totalNS, frame);
    }
    if ((fpsStruct.startNS || 0) + (fpsStruct.dur || 0) > endNS) {
      fpsBeanStructX2 = frame.width;
    } else {
      fpsBeanStructX2 = ns2x((fpsStruct.startNS || 0) + (fpsStruct.dur || 0), startNS, endNS, totalNS, frame);
    }
    let getV: number = fpsBeanStructX2 - fpsBeanStructX1 <= 1 ? 1 : fpsBeanStructX2 - fpsBeanStructX1;
    let rectangle: Rect = new Rect(
      Math.floor(fpsBeanStructX1),
      Math.ceil(frame.y + padding),
      Math.ceil(getV),
      Math.floor(frame.height - padding * 2)
    );
    fpsStruct.frame = rectangle;
  }
}
