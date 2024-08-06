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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { debounce } from '../../../Utils';

const paddingLeft = 100;
const paddingBottom = 15;
const xStart = 50; // x轴起始位置
const barWidth = 2; // 柱子宽度
const millisecond = 1_000_000;

@element('tab-sample-instructions-totaltime-selection')
export class TabPaneSampleInstructionTotalTime extends BaseElement {
  private instructionChartEle: HTMLCanvasElement | undefined | null;
  private ctx: CanvasRenderingContext2D | undefined | null;
  private cacheData: Array<unknown> = [];
  private canvasX = -1; // 鼠标当前所在画布x坐标
  private canvasY = -1; // 鼠标当前所在画布y坐标
  private startX = 0; // 画布相对于整个界面的x坐标
  private startY = 0; // 画布相对于整个界面的y坐标
  private hoverBar: unknown;
  private onReadableData: Array<unknown> = [];
  private hintContent = ''; //悬浮框内容
  private floatHint: HTMLDivElement | undefined | null; //悬浮框
  private canvasScrollTop = 0; // tab页上下滚动位置
  private isUpdateCanvas = false;
  private xCount = 0; //x轴刻度个数
  private xMaxValue = 0; //x轴上数据最大值
  private xSpacing = 50; //x轴间距
  private xAvg = 0; //根据xMaxValue进行划分 用于x轴上刻度显示
  private yAvg = 0; //根据yMaxValue进行划分 用于y轴上刻度显示

  initHtml(): string {
    return `
      <style>
        :host {
          display: flex;
        }
        .frame-tip {
          position: absolute;
          left: 0;
          background-color: white;
          border: 1px solid #F9F9F9;
          width: auto;
          font-size: 14px;
          color: #50809e;
          padding: 2px 10px;
          box-sizing: border-box;
          display: none;
          max-width: 200px;
        }
        .title {
          font-size: 14px;
          padding: 0 5px;
        }
        .bold {
          font-weight: bold;
        }
      </style>
      <canvas id="instruct-chart-canvas" height="280"></canvas>
      <div id="float_hint" class="frame-tip"></div>
    `;
  }

  initElements(): void {
    this.instructionChartEle = this.shadowRoot?.querySelector('#instruct-chart-canvas');
    this.ctx = this.instructionChartEle?.getContext('2d');
    this.floatHint = this.shadowRoot?.querySelector('#float_hint');
  }

  set data(SampleParam: SelectionParam) {
    // @ts-ignore
    this.onReadableData = SampleParam.sampleData[0].property;
    this.calInstructionRangeCount();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.parentElement!.onscroll = () => {
      this.canvasScrollTop = this.parentElement!.scrollTop;
      this.hideTip();
    };
    this.instructionChartEle!.onmousemove = (e): void => {
      if (!this.isUpdateCanvas) {
        this.updateCanvasCoord();
      }
      this.canvasX = e.clientX - this.startX;
      this.canvasY = e.clientY - this.startY + this.canvasScrollTop;
      this.onMouseMove();
    };
    this.instructionChartEle!.onmouseleave = () => {
      this.hideTip();
    };
    this.listenerResize();
  }

  /**
   * 更新canvas坐标
   */
  updateCanvasCoord(): void {
    if (this.instructionChartEle instanceof HTMLCanvasElement) {
      this.isUpdateCanvas = this.instructionChartEle.clientWidth !== 0;
      if (this.instructionChartEle.getBoundingClientRect()) {
        const box = this.instructionChartEle.getBoundingClientRect();
        const D = this.parentElement!;
        this.startX = box.left + Math.max(D.scrollLeft, document.body.scrollLeft) - D.clientLeft;
        this.startY = box.top + Math.max(D.scrollTop, document.body.scrollTop) - D.clientTop + this.canvasScrollTop;
      }
    }
  }

  /**
   * 获取鼠标悬停的函数
   * @param nodes
   * @param canvasX
   * @param canvasY
   * @returns
   */
  searchDataByCoord(nodes: unknown, canvasX: number, canvasY: number):unknown {
    // @ts-ignore
    for (let i = 0; i < nodes.length; i++) {
      // @ts-ignore
      const element = nodes[i];
      if (this.isContains(element, canvasX, canvasY)) {
        return element;
      }
    }
    return null;
  }

  /**
   * 鼠标移动
   */
  onMouseMove(): void {
    const lastNode = this.hoverBar;
    //查找鼠标所在的node
    const searchResult = this.searchDataByCoord(this.cacheData, this.canvasX, this.canvasY);
    if (searchResult) {
      this.hoverBar = searchResult;
      //鼠标悬浮的node未改变则不需重新渲染文字
      if (searchResult !== lastNode) {
        this.updateTipContent();
      }
      this.showTip();
    } else {
      this.hideTip();
      this.hoverBar = undefined;
    }
  }

  /**
   *  隐藏悬浮框
   */
  hideTip(): void {
    if (this.floatHint) {
      this.floatHint.style.display = 'none';
      this.instructionChartEle!.style.cursor = 'default';
    }
  }

  /**
   * 显示悬浮框
   */
  showTip(): void {
    this.floatHint!.innerHTML = this.hintContent;
    this.floatHint!.style.display = 'block';
    this.instructionChartEle!.style.cursor = 'pointer';
    let x = this.canvasX;
    let y = this.canvasY - this.canvasScrollTop;
    //右边的函数悬浮框显示在左侧
    if (this.canvasX + this.floatHint!.clientWidth > (this.instructionChartEle!.clientWidth || 0)) {
      x -= this.floatHint!.clientWidth - 1;
    } else {
      x += 30;
    }
    //最下边的函数悬浮框显示在上方
    y -= this.floatHint!.clientHeight - 1;
    this.floatHint!.style.transform = `translate(${x}px, ${y}px)`;
  }

  /**
   * 更新悬浮框内容
   */
  updateTipContent(): void {
    const hoverNode = this.hoverBar;
    if (!hoverNode) {
      return;
    }
    const detail = hoverNode!;
    // @ts-ignore
    this.hintContent = ` <span class="blod">${detail.instruct}</span></br><span>${parseFloat(
      // @ts-ignore
      detail.heightPer
    )}</span> `;
  }

  /**
   * 判断鼠标当前在那个函数上
   * @param frame
   * @param x
   * @param y
   * @returns
   */
  isContains(point: unknown, x: number, y: number): boolean {
    // @ts-ignore
    return x >= point.x && x <= point.x + 2 && point.y <= y && y <= point.y + point.height;
  }

  /**
   * 统计onReadable数据各指令数个数
   */
  calInstructionRangeCount() {
    if (this.onReadableData.length === 0) return;
    this.cacheData.length = 0;
    const count = this.onReadableData.length;
    const onReadableData = this.onReadableData;
    const instructionArray = onReadableData.reduce((pre: unknown, current: unknown) => {
      // @ts-ignore
      const dur = parseFloat(((current.end - current.begin) / millisecond).toFixed(1));
      // @ts-ignore
      (pre[dur] = pre[dur] || []).push(current);
      return pre;
    }, {});
    this.ctx!.clearRect(0, 0, this.instructionChartEle!.width, this.instructionChartEle!.height);
    this.instructionChartEle!.width = this.clientWidth;

    this.xMaxValue =
      // @ts-ignore
      Object.keys(instructionArray)
        .map((i) => Number(i))
        .reduce((pre, cur) => Math.max(pre, cur), 0) + 5; // @ts-ignore
    const yMaxValue = Object.values(instructionArray).reduce(
      // @ts-ignore
      (pre: number, cur: unknown) => Math.max(pre, Number((cur.length / count).toFixed(2))),
      0
    );
    this.yAvg = Number(((yMaxValue / 5) * 1.5).toFixed(2));
    const height = this.instructionChartEle!.height;
    const width = this.instructionChartEle!.width;
    this.drawLineLabelMarkers(width, height);
    this.drawBar(instructionArray, height, count);
  }

  /**
   * 绘制柱状图
   * @param instructionData
   * @param height
   * @param count
   */
  drawBar(instructionData: unknown, height: number, count: number): void {
    const yTotal = Number((this.yAvg * 5).toFixed(2));
    const interval = Math.floor((height - paddingBottom) / 6); // @ts-ignore
    for (const x in instructionData) {
      const xNum = Number(x);
      const xPosition = xStart + (xNum / (this.xCount * this.xAvg)) * (this.xCount * this.xSpacing) - barWidth / 2; // @ts-ignore
      const yNum = Number((instructionData[x].length / count).toFixed(3));
      const percent = Number((yNum / yTotal).toFixed(2));
      const barHeight = (height - paddingBottom - interval) * percent;
      this.drawRect(xPosition, height - paddingBottom - barHeight, barWidth, barHeight); // @ts-ignore
      const existX = this.cacheData.find((i) => i.instruct === x);
      if (!existX) {
        this.cacheData.push({
          instruct: x,
          x: xPosition,
          y: height - paddingBottom - barHeight,
          height: barHeight,
          heightPer: parseFloat((yNum * 100).toFixed(2)),
        });
      } else {
        // @ts-ignore
        existX.x = xPosition;
      }
    }
  }

  /**
   * 绘制x y轴
   * @param width
   * @param height
   */
  drawLineLabelMarkers(width: number, height: number) {
    this.ctx!.font = '12px Arial';
    this.ctx!.lineWidth = 1;
    this.ctx!.fillStyle = '#333';
    this.ctx!.strokeStyle = '#ccc';

    this.ctx!.fillText('时长 / ms', width - paddingLeft, height - paddingBottom);

    //绘制x轴
    this.drawLine(xStart, height - paddingBottom, width - paddingLeft, height - paddingBottom);
    //绘制y轴
    this.drawLine(xStart, 5, xStart, height - paddingBottom);
    //绘制标记
    this.drawMarkers(width, height);
  }

  /**
   * 绘制横线
   * @param x
   * @param y
   * @param X
   * @param Y
   */
  drawLine(x: number, y: number, X: number, Y: number) {
    this.ctx!.beginPath;
    this.ctx!.moveTo(x, y);
    this.ctx!.lineTo(X, Y);
    this.ctx!.stroke();
    this.ctx!.closePath();
  }

  /**
   * 绘制x y轴刻度
   * @param width
   * @param height
   */
  drawMarkers(width: number, height: number) {
    this.xCount = 0;
    //绘制x轴锯齿
    let serrateX = 50;
    let yHeight = height - paddingBottom;
    const clientWidth = width - paddingLeft - 50;
    if (clientWidth > this.xMaxValue) {
      this.xSpacing = Math.floor(clientWidth / 20);
      this.xAvg = Math.ceil(this.xMaxValue / 20);
    } else {
      this.xSpacing = Math.floor(clientWidth / 10);
      this.xAvg = Math.ceil(this.xMaxValue / 10);
    }
    while (serrateX <= clientWidth) {
      this.xCount++;
      serrateX += this.xSpacing;
      this.drawLine(serrateX, yHeight, serrateX, yHeight + 5);
    }
    //绘制x轴刻度
    this.ctx!.textAlign = 'center';
    for (let i = 0; i <= this.xCount; i++) {
      const x = xStart + i * this.xSpacing;
      this.ctx!.fillText(`${i * this.xAvg}`, x, height);
    }
    //绘制y轴刻度
    this.ctx!.textAlign = 'center';
    const yPadding = Math.floor((height - paddingBottom) / 6);
    for (let i = 0; i < 6; i++) {
      const y = height - paddingBottom - i * yPadding;
      if (i === 0) {
        this.ctx!.fillText(`${i}%`, 30, y);
      } else {
        this.drawLine(xStart, y, width - paddingLeft, y);
        this.ctx!.fillText(`${parseFloat((i * this.yAvg).toFixed(2)) * 100}%`, 30, y);
      }
    }
  }

  /**
   * 监听页面size变化
   */
  listenerResize(): void {
    new ResizeObserver(
      debounce(() => {
        if (this.instructionChartEle!.getBoundingClientRect()) {
          const box = this.instructionChartEle!.getBoundingClientRect();
          const element = this.parentElement!;
          this.startX = box.left + Math.max(element.scrollLeft, document.body.scrollLeft) - element.clientLeft;
          this.startY =
            box.top + Math.max(element.scrollTop, document.body.scrollTop) - element.clientTop + this.canvasScrollTop;
          this.calInstructionRangeCount();
        }
      }, 100)
    ).observe(this.parentElement!);
  }
  /**
   * 绘制方块
   * @param x
   * @param y
   * @param X
   * @param Y
   */
  drawRect(x: number, y: number, X: number, Y: number) {
    this.ctx!.beginPath();
    this.ctx!.rect(x, y, X, Y);
    this.ctx!.fill();
    this.ctx!.closePath();
  }
}
