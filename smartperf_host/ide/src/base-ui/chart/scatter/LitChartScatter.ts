/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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

import { resizeCanvas } from '../helper';
import { BaseElement, element } from '../../BaseElement';
import { LitChartScatterConfig } from './LitChartScatterConfig';

@element('lit-chart-scatter')
export class LitChartScatter extends BaseElement {
  private scatterTipEL: HTMLDivElement | null | undefined;
  private labelsEL: HTMLDivElement | null | undefined;
  canvas: HTMLCanvasElement | undefined | null;
  canvas2: HTMLCanvasElement | undefined | null;
  ctx: CanvasRenderingContext2D | undefined | null;
  originX: number = 0;
  finalX: number = 0;
  originY: number = 0;
  finalY: number = 0;
  options: LitChartScatterConfig | undefined;

  set config(LitChartScatterConfig: LitChartScatterConfig) {
    this.options = LitChartScatterConfig;
    this.init();
  }
  init(): void {
    if (this.options) {
      // 清楚上一次绘制的数据
      this.ctx?.clearRect(0, 0, this.clientWidth, this.clientHeight);
      this.drawBackground();
      this.drawScatterChart(this.options);
      //使用off-screen-canvas保存绘制的像素点
      this.setOffScreen();
      this.labelsEL!.innerText = this.options.title;
    }
  }
  // 使用离屏技术保存绘制的像素点
  setOffScreen(): void {
    this.canvas2 = document.createElement('canvas');
    this.canvas2.height = this.clientHeight;
    this.canvas2.width = this.clientWidth;
    let context2: CanvasRenderingContext2D | null = this.canvas2.getContext('2d');
    if (this.canvas?.width !== 0 && this.canvas?.height !== 0) {
      context2!.drawImage(this.canvas!, 0, 0);
    }
  }
  /*绘制渐变色背景*/
  drawBackground(): void {
    let w: number = this.clientWidth;
    let h: number = this.clientHeight;
    let color: CanvasGradient = this.ctx?.createRadialGradient(w / 2, h / 2, 0.2 * w, w / 2, h / 2, 0.5 * w)!;
    color?.addColorStop(0, '#eaeaea');
    color?.addColorStop(1, '#ccc');
    if (this.options) {
      this.options!.globalGradient = color;
    }
    this.ctx?.save();
    this.ctx!.fillStyle = color;
    this.ctx?.fillRect(0, 0, w, h);
    this.ctx?.restore();
  }
  /**
   * 绘制散点图
   */
  drawScatterChart(options: LitChartScatterConfig): void {
    this.drawAxis(options); //绘制坐标轴
    this.drawYLabels(options); //绘制y轴坐标
    this.drawXLabels(options); //绘制x轴坐标
    let drawload: boolean = false;
    if (options) {
      drawload = options.drawload;
    }
    if (drawload) {
      let load: Array<number> = [];
      if (options) {
        load = options.load;
        this.drawBalanceLine(load); //绘制均衡线
        this.drawLoadLine(load); //绘制最大负载线
      }
    }
    this.drawData(options); //绘制散点图
  }
  /**
   * 绘制坐标轴
   */
  drawAxis(options: LitChartScatterConfig): void {
    let text: Array<string> = new Array();
    if (options) {
      text = options.axisLabel;
    }
    this.ctx!.font = '10px KATTI';
    this.ctx!.fillStyle = '#000000';
    this.ctx!.strokeStyle = '#000000';
    // 画x轴
    this.ctx?.beginPath();
    this.ctx?.moveTo(this.originX, this.originY);
    this.ctx?.lineTo(this.finalX, this.originY);
    this.ctx?.fillText(text[0], this.finalX, this.originY);
    this.ctx?.stroke();
    // 画Y轴
    this.ctx?.beginPath();
    this.ctx?.moveTo(this.originX, this.originY);
    this.ctx?.lineTo(this.originX, this.finalY);
    this.ctx?.fillText(text[1], this.originX - 20, this.finalY - 10);
    this.ctx?.stroke();
  }
  /**
   * 绘制y轴坐标
   */
  drawYLabels(options: LitChartScatterConfig): void {
    const AXAIS_DELTA: number = 5;
    const QUYU: number = 100;
    // 添加原点刻度
    this.ctx!.font = '12px KATTI';
    this.ctx!.fillStyle = '#000000';
    this.ctx!.strokeStyle = '#000000';
    this.ctx?.fillText('0', this.originX - AXAIS_DELTA, this.originY + AXAIS_DELTA * 2);
    let yAxis: Array<number> = [];
    if (options) {
      yAxis = options.yAxisLabel;
    }
    // 画Y轴坐标尺
    for (let i = 0; i < yAxis.length; i++) {
      let length1: number =
        (this.originY - this.finalY - ((this.originY - this.finalY) % QUYU)) * (yAxis[i] / yAxis[yAxis.length - 1]);
      let length2: number = this.originY - length1;
      let text: string = yAxis[i].toString();
      let x: number = this.originX - this.ctx?.measureText(text).width! - AXAIS_DELTA;
      this.ctx?.beginPath();
      this.ctx?.moveTo(this.originX, length2);
      this.ctx?.lineTo(this.originX + AXAIS_DELTA, length2);
      this.ctx?.fillText(text, x, length2 + AXAIS_DELTA);
      this.ctx?.stroke();
    }
  }
  /**
   * 绘制x轴坐标
   */
  drawXLabels(options: LitChartScatterConfig): void {
    // 画X轴坐标尺
    this.ctx!.fillStyle = '#000000';
    this.ctx!.strokeStyle = '#000000';
    const QUYU: number = 100;
    const DELTA: number = 5;
    let xAxis: Array<number> = [];
    if (options) {
      xAxis = options.xAxisLabel;
    }
    for (let i = 0; i < xAxis.length; i++) {
      let length3: number =
        (this.finalX - this.originX - ((this.finalX - this.originX) % QUYU)) * (xAxis[i] / xAxis[xAxis.length - 1]);
      let length4: number = this.originX + length3;
      this.ctx?.beginPath();
      this.ctx?.moveTo(length4, this.originY);
      this.ctx?.lineTo(length4, this.originY - DELTA);
      this.ctx?.fillText(xAxis[i].toString(), length4 - DELTA * 3, this.originY + DELTA * 2);
      this.ctx?.stroke();
    }
  }

  /**
   * 绘制数据
   */
  drawData(options: LitChartScatterConfig): void {
    let data: Array<Array<Array<number>>> = [];
    let yAxis: Array<number> = [];
    let xAxis: Array<number> = [];
    let colorPool: Array<string> = new Array();
    let colorPoolText: Array<string> = new Array();
    let rectY: number = this.clientHeight * 0.05;
    const QUYU: number = 100;
    const WIDTH_DELTA: number = 70;
    if (options) {
      data = options.data;
      yAxis = options.yAxisLabel;
      xAxis = options.xAxisLabel;
      colorPool = options.colorPool();
      colorPoolText = options.colorPoolText();
      options.paintingData = [];
    }
    let xLength: number = this.finalX - this.originX - ((this.finalX - this.originX) % QUYU);
    let yLength: number = this.originY - this.finalY - ((this.originY - this.finalY) % QUYU);
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        // 打点x坐标
        let x: number = this.originX + (data[i][j][0] / xAxis[xAxis.length - 1]) * xLength;
        // 打点y坐标
        let y: number = this.originY - (data[i][j][1] / yAxis[yAxis.length - 1]) * yLength;
        let r: number = 6;
        if (i > 0) {
          options.paintingData[data[i][j][2] - 1] = {
            x,
            y,
            r,
            c: data[i][j],
            color: colorPool[i],
          };
        } else {
          options.paintingData.push({
            x,
            y,
            r,
            c: data[i][j],
            color: colorPool[i],
          });
        }
        this.drawCycle(x, y, r, 0.8, colorPool[i]);
      }
      if (data[i].length) {
        rectY = rectY + 20;
        this.ctx?.fillText(colorPoolText[i] + ': ', this.clientWidth - WIDTH_DELTA, rectY + 4);
        this.drawCycle(this.clientWidth - QUYU / 5, rectY, 7.5, 0.8, colorPool[i]);
      }
    }
  }
  /**
   * 画圆点
   */
  drawCycle(x: number, y: number, r: number, transparency: number, color: string): void {
    this.ctx!.fillStyle = color;
    this.ctx?.beginPath();
    this.ctx!.globalAlpha = transparency;
    this.ctx?.arc(x, y, r, 0, Math.PI * 2, true);
    this.ctx?.closePath();
    this.ctx?.fill();
  }

  /**
   * 绘制最大负载线
   */
  drawLoadLine(data: Array<number>): void {
    let maxXAxis: number = 1;
    const QUYU: number = 100;
    const FOR_VALUE = 60;
    if (this.options) {
      maxXAxis = this.options.xAxisLabel[this.options.xAxisLabel.length - 1];
    }
    // data[1]用来标注n Hz负载线
    let addr1: number =
      this.originX + (this.finalX - this.originX - ((this.finalX - this.originX) % QUYU)) * (data[0] / maxXAxis);
    let addr2: number = (this.originY - this.finalY - ((this.originY - this.finalY) % QUYU)) / FOR_VALUE;
    let y: number = this.originY;
    this.ctx!.strokeStyle = '#ff0000';
    for (let i = 0; i < FOR_VALUE; i++) {
      this.ctx?.beginPath();
      this.ctx?.moveTo(addr1, y);
      y -= addr2;
      this.ctx?.lineTo(addr1, y);
      if (i % 2 !== 0) {
        this.ctx?.stroke();
      }
    }
    this.ctx!.font = '10px KATTI';
    this.ctx!.fillStyle = '#ff0000';
    this.ctx?.fillText(
      data[1] + 'Hz最大负载线',
      addr1 - FOR_VALUE / 3,
      this.originY - addr2 * FOR_VALUE - FOR_VALUE / 4
    );
    this.ctx!.fillStyle = '#000000';
    this.ctx?.fillText('过供给区', addr1 / 2, y + FOR_VALUE / 2);
    this.ctx?.fillText('欠供给区', addr1 / 2, this.originY - this.finalY);
    this.ctx?.fillText('超负载区', addr1 + FOR_VALUE / 3, (this.finalY + this.originY) / 2);
  }

  /**
   * 绘制均衡线
   */
  drawBalanceLine(data: Array<number>): void {
    let maxXAxis: number = 1;
    const QUYU: number = 100;
    const FOR_VALUE = 60;
    if (this.options) {
      maxXAxis = this.options.xAxisLabel[this.options.xAxisLabel.length - 1];
    }
    // data[1]用来标注n Hz均衡线
    let addr1: number =
      ((this.finalX - this.originX - ((this.finalX - this.originX) % QUYU)) * (data[0] / maxXAxis)) / FOR_VALUE;
    let addr2: number = (this.originY - this.finalY - ((this.originY - this.finalY) % QUYU)) / FOR_VALUE;
    let x: number = this.originX;
    let y: number = this.originY;
    this.ctx!.strokeStyle = '#00ff00';
    for (let i = 0; i < FOR_VALUE; i++) {
      this.ctx?.beginPath();
      this.ctx?.moveTo(x, y);
      x += addr1;
      y -= addr2;
      this.ctx?.lineTo(x, y);
      if (i % 2 === 0) {
        this.ctx?.stroke();
      }
    }
    this.ctx?.save();
    this.ctx?.translate(addr1 * 25 + this.originX, addr2 * 40 + this.finalY);
    this.ctx!.font = '10px KATTI';
    this.ctx!.fillStyle = '#ff0f00';
    this.ctx?.rotate(-Math.atan(addr2 / addr1));
    this.ctx?.fillText(data[1] + 'Hz均衡线', 0, 0);
    this.ctx?.restore();
  }

  /*检测是否hover在散点之上*/
  checkHover(options: LitChartScatterConfig | undefined, pos: Object): Object | boolean {
    let data: Array<Object> = [];
    if (options) {
      data = options.paintingData;
    }
    let found: boolean | Object = false;
    for (let i = 0; i < data.length; i++) {
      found = false;
      // @ts-ignore
      if (
        Math.sqrt(
          // @ts-ignore
          Math.pow(pos.x - data[i].x, 2) + Math.pow(pos.y - data[i].y, 2)
          // @ts-ignore
        ) < data[i].r
      ) {
        found = data[i];
        break;
      }
    }
    return found;
  }

  /*绘制hover状态*/
  paintHover(): void {
    let obj: Object | null = this.options!.hoverData;
    // @ts-ignore
    let x: number = obj?.x;
    // @ts-ignore
    let y: number = obj?.y;
    // @ts-ignore
    let r: number = obj?.r;
    // @ts-ignore
    let c: string = obj?.color;
    let step: number = 0.5;
    this.ctx!.globalAlpha = 1;
    this.ctx!.fillStyle = c;
    for (let i = 0; i < 10; i++) {
      this.ctx?.beginPath();
      this.ctx?.arc(x, y, r + i * step, 0, 2 * Math.PI, false);
      this.ctx?.fill();
      this.ctx?.closePath();
    }
  }
  //利用离屏canvas恢复hover前的状态
  resetHoverWithOffScreen(): void {
    let obj: Object | null = null;
    const STEP_VALUE: number = 12;
    const OUT_CYCLE: number = 2;
    if (this.options) {
      obj = this.options.hoverData;
    }
    if (!obj) {
      return;
    }
    // @ts-ignore
    let { x, y, r, c, color } = obj;
    let step = 0.5;
    this.ctx!.globalAlpha = 1;
    for (let i = 10; i > 0; i--) {
      this.ctx?.save();
      //绘制外圆范围
      this.ctx?.drawImage(
        this.canvas2!,
        x - r - STEP_VALUE * step,
        y - r - STEP_VALUE * step,
        OUT_CYCLE * (r + STEP_VALUE * step),
        OUT_CYCLE * (r + STEP_VALUE * step),
        x - r - STEP_VALUE * step,
        y - r - STEP_VALUE * step,
        OUT_CYCLE * (r + STEP_VALUE * step),
        OUT_CYCLE * (r + STEP_VALUE * step)
      );
      //绘制内圆
      this.ctx?.beginPath();
      this.ctx?.arc(x, y, r + i * step, 0, OUT_CYCLE * Math.PI, false);
      this.ctx?.closePath();
      this.ctx!.fillStyle = color;
      this.ctx!.globalAlpha = 0.8;
      //填充内圆
      this.ctx?.fill();
      this.ctx?.restore();
    }
    this.options!.hoverData = null;
  }
  /**
   * 显示提示框
   */
  showTip(data: any): void {
    const minWidth: number = 160;
    const miniHeight: number = 70;
    const canvasWidth: number = Number(this.canvas?.style.width.replace('px', ''));
    const canvasHeight: number = Number(this.canvas?.style.height.replace('px', ''));
    this.scatterTipEL!.style.display = 'flex';
    if (canvasWidth - data.x < minWidth && canvasHeight - data.y >= miniHeight) {
      this.scatterTipEL!.style.top = `${data.y}px`;
      this.scatterTipEL!.style.left = `${data.x - minWidth}px`;
    } else if (canvasHeight - data.y < miniHeight && canvasWidth - data.x > minWidth) {
      this.scatterTipEL!.style.top = `${data.y - miniHeight}px`;
      this.scatterTipEL!.style.left = `${data.x}px`;
    } else if (canvasWidth - data.x < minWidth && canvasHeight - data.y < miniHeight) {
      this.scatterTipEL!.style.top = `${data.y - miniHeight}px`;
      this.scatterTipEL!.style.left = `${data.x - minWidth}px`;
    } else {
      this.scatterTipEL!.style.top = `${data.y}px`;
      this.scatterTipEL!.style.left = `${data.x}px`;
    }
    this.scatterTipEL!.innerHTML = this.options!.tip(data);
    // @ts-ignore
    this.options!.hoverEvent('CPU-FREQ', true, data.c[2] - 1);
  }
  /**
   * 隐藏提示框
   */
  hideTip(): void {
    this.scatterTipEL!.style.display = 'none';
    if (this.options) {
      // @ts-ignore
      this.options!.hoverEvent('CPU-FREQ', false);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.canvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#canvas');
    this.scatterTipEL = this.shadowRoot!.querySelector<HTMLDivElement>('#tip');
    this.ctx = this.canvas!.getContext('2d', { alpha: true });
    this.labelsEL = this.shadowRoot!.querySelector<HTMLDivElement>('#shape');
    resizeCanvas(this.canvas!);
    this.originX = this.clientWidth * 0.1;
    this.originY = this.clientHeight * 0.9;
    this.finalX = this.clientWidth;
    this.finalY = this.clientHeight * 0.1;
    /*hover效果*/
    this.canvas!.onmousemove = (event) => {
      let pos: Object = {
        x: event.offsetX,
        y: event.offsetY,
      };
      let hoverPoint: Object | boolean = this.checkHover(this.options, pos);
      /**
       * 如果当前有聚焦点
       */
      if (hoverPoint) {
        this.showTip(hoverPoint);
        let samePoint: boolean = this.options!.hoverData === hoverPoint ? true : false;
        if (!samePoint) {
          this.resetHoverWithOffScreen();
          this.options!.hoverData = hoverPoint;
        }
        this.paintHover();
      } else {
        //使用离屏canvas恢复
        this.resetHoverWithOffScreen();
        this.hideTip();
      }
    };
  }

  initElements(): void {
    new ResizeObserver((entries, observer) => {
      entries.forEach((it) => {
        resizeCanvas(this.canvas!);
        this.originX = this.clientWidth * 0.1;
        this.originY = this.clientHeight * 0.95;
        this.finalX = this.clientWidth * 0.9;
        this.finalY = this.clientHeight * 0.1;
        this.labelsEL!.innerText = '';
        this.init();
      });
    }).observe(this);
  }

  initHtml(): string {
    return (
      `
            <style>   
            :host {
                display: flex;
                flex-direction: column;
                overflow: hidden;
                width: 100%;
                height: 100%;
            }
            .shape.active {
                display: block;
                position: absolute;
                left: 35%;    
                z-index: 99;
            }
            #tip{
                background-color: #f5f5f4;
                border: 1px solid #fff;
                border-radius: 5px;
                color: #333322;
                font-size: 8pt;
                position: absolute;
                display: none;
                top: 0;
                left: 0;
                z-index: 99;
                pointer-events: none;
                user-select: none;
                padding: 5px 10px;
                box-shadow: 0 0 10px #22ffffff;
            }
            #root{
                position:relative;
            }
            .bg_nodata{
                background-repeat:no-repeat;
                background-position:center;
                background-image: url("img/pie_chart_no_data.png");
            }
            .bg_hasdata{
                background-repeat:no-repeat;
                background-position:center;
            }
            ` + this.dismantlingHtml()
    );
  }

  /**
   * 拆解initHtml大函数块
   * @returns html
   */
  dismantlingHtml(): string {
    return `
      #labels{
        display: grid;
        grid-template-columns: auto auto auto auto auto;
        width: 100%;
        height: 25%;
        box-sizing: border-box;
        position: absolute;
        bottom: 0px;
        left: 0;
        padding-left: 10px;
        padding-right: 10px;
        pointer-events: none;
      }
      .name{
        flex: 1;
        font-size: 9pt;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--dark-color1,#252525);
        pointer-events: painted;
      }
      .label{
        display: flex;
        align-items: center;
        max-lines: 1;
        white-space: nowrap;
        overflow: hidden;
        padding-right: 5px;
      }
      .tag{
        display: flex;
        align-items: center;
        justify-content: center;
        width: 10px;
        height: 10px;
        border-radius: 5px;
        margin-right: 5px;
      }
      </style>
      <div id="root">
          <div id="shape" class="shape active"></div>
          <canvas id="canvas" style="top: 0;left: 0;z-index: 21;position: absolute"></canvas>
          <div id="tip"></div>
          <div id="labels"></div>
      </div>`;
  }
}
