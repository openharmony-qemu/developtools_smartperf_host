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
import { Rect, drawString } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { ColorUtils } from '../../base/ColorUtils';
import { SampleStruct } from '../../../../database/ui-worker/ProcedureWorkerBpftrace';
import { SpApplication } from '../../../../SpApplication';

const SAMPLE_STRUCT_HEIGHT = 30;
const Y_PADDING = 4;

@element('tab-sample-instruction-selection')
export class TabPaneSampleInstructionSelection extends BaseElement {
  private instructionEle: HTMLCanvasElement | undefined | null;
  private ctx: CanvasRenderingContext2D | undefined | null;
  private textEle: HTMLSpanElement | undefined | null;
  private instructionArray: Array<unknown> = [];
  private instructionData: Array<unknown> = [];
  private isUpdateCanvas = false;
  private canvasX = -1; // 鼠标当前所在画布x坐标
  private canvasY = -1; // 鼠标当前所在画布y坐标
  private startX = 0; // 画布相对于整个界面的x坐标
  private startY = 0; // 画布相对于整个界面的y坐标
  private hintContent = ''; //悬浮框内容
  private floatHint: HTMLDivElement | undefined | null; //悬浮框
  private canvasScrollTop = 0; // tab页上下滚动位置
  private hoverSampleStruct: unknown | undefined;
  private isChecked: boolean = false;
  private maxDepth = 0;

  initHtml(): string {
    return `
      <style>
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
          max-width: 400px;
        }
        .text {
          max-width: 350px;
          word-break: break-all;
        }
        .title {
          font-size: 14px;
          padding: 0 5px;
        }
        :host {
          display: flex;
          flex-direction: column;
          padding: 10px;
        }
        .root {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .tip {
          height: 30px;
          line-height: 30px;
          text-align: center;
          font-size: 14px;
        }
      </style>
      <div class="root">
        <canvas id="instruct-select-canvas"></canvas>
        <div id="select_float_hint" class="frame-tip"></div>
        <div class="tip">
          <span class="headline">指令数数据流</span>
        </div>
      </div>
    `;
  }

  initElements(): void {
    this.instructionEle = this.shadowRoot?.querySelector('#instruct-select-canvas');
    this.textEle = this.shadowRoot?.querySelector('.headline');
    this.ctx = this.instructionEle?.getContext('2d');
    this.floatHint = this.shadowRoot?.querySelector('#select_float_hint');
  }

  set data(SampleParam: SelectionParam) {
    this.hoverSampleStruct = undefined;
    this.instructionData = SampleParam.sampleData;
    this.getAvgInstructionData(this.instructionData);
    queueMicrotask(() => {
      this.updateCanvas(this.clientWidth);
      this.drawInstructionData(this.isChecked);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.parentElement!.onscroll = () => {
      this.canvasScrollTop = this.parentElement!.scrollTop;
      this.hideTip();
    };
    this.instructionEle!.onmousemove = (e): void => {
      if (!this.isUpdateCanvas) {
        this.updateCanvasCoord();
      }
      this.canvasX = e.clientX - this.startX;
      this.canvasY = e.clientY - this.startY + this.canvasScrollTop;
      this.onMouseMove();
    };
    this.instructionEle!.onmouseleave = () => {
      this.hideTip();
    };
    document.addEventListener('sample-popver-change', (e: unknown) => {
      // @ts-ignore
      const select = Number(e.detail.select);
      this.hoverSampleStruct = undefined;
      this.isChecked = Boolean(select);
      this.drawInstructionData(this.isChecked);
    });
    this.listenerResize();
  }

  /**
   * 初始化窗口大小
   * @param newWidth
   */
  updateCanvas(newWidth?: number): void {
    if (this.instructionEle instanceof HTMLCanvasElement) {
      this.instructionEle.style.width = `${100}%`;
      this.instructionEle.style.height = `${(this.maxDepth + 1) * SAMPLE_STRUCT_HEIGHT}px`;
      if (this.instructionEle.clientWidth === 0 && newWidth) {
        this.instructionEle.width = newWidth;
      } else {
        this.instructionEle.width = this.instructionEle.clientWidth;
      }
      this.instructionEle.height = (this.maxDepth + 1) * SAMPLE_STRUCT_HEIGHT;
    }
  }

  /**
   * 鼠标移动
   */
  onMouseMove(): void {
    const lastNode = this.hoverSampleStruct;
    //查找鼠标所在的node
    const searchResult = this.searchDataByCoord(this.instructionArray!, this.canvasX, this.canvasY);
    if (searchResult) {
      this.hoverSampleStruct = searchResult;
      //鼠标悬浮的node未改变则不需重新渲染文字
      if (searchResult !== lastNode) {
        this.updateTipContent();
        this.ctx!.clearRect(0, 0, this.instructionEle!.width, this.instructionEle!.height);
        this.ctx!.beginPath();
        for (const key in this.instructionArray) {
          // @ts-ignore
          for (let i = 0; i < this.instructionArray[key].length; i++) {
            // @ts-ignore
            const cur = this.instructionArray[key][i];
            this.draw(this.ctx!, cur);
          }
        }
        this.ctx!.closePath();
      }
      this.showTip();
    } else {
      this.hideTip();
      this.hoverSampleStruct = undefined;
    }
  }

  /**
   *  隐藏悬浮框
   */
  hideTip(): void {
    if (this.floatHint) {
      this.floatHint.style.display = 'none';
    }
  }

  /**
   * 显示悬浮框
   */
  showTip(): void {
    this.floatHint!.innerHTML = this.hintContent;
    this.floatHint!.style.display = 'block';
    let x = this.canvasX;
    let y = this.canvasY - this.canvasScrollTop;
    //右边的函数悬浮框显示在左侧
    if (this.canvasX + this.floatHint!.clientWidth > this.instructionEle!.clientWidth || 0) {
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
   * @returns
   */
  updateTipContent(): void {
    const hoverNode = this.hoverSampleStruct;
    if (!hoverNode) {
      return;
    }
    // @ts-ignore
    this.hintContent = `<span class="text">${hoverNode.detail}(${hoverNode.name})</span></br>
      <span class="text">${
      // @ts-ignore
      this.isChecked ? hoverNode.hoverCycles : hoverNode.hoverInstructions}
      </span>
    `;
  }

  /**
   * 设置绘制所需的坐标及宽高
   * @param sampleNode
   * @param instructions
   * @param x
   */
  setSampleFrame(sampleNode: SampleStruct, instructions: number, x: number): void {
    if (!sampleNode.frame) {
      sampleNode.frame! = new Rect(0, 0, 0, 0);
    }
    sampleNode.frame!.x = x;
    sampleNode.frame!.y = sampleNode.depth! * SAMPLE_STRUCT_HEIGHT;
    sampleNode.frame!.width = instructions;
    sampleNode.frame!.height = SAMPLE_STRUCT_HEIGHT;
  }

  /**
   * 判断鼠标当前在那个函数上
   * @param frame
   * @param x
   * @param y
   * @returns
   */
  isContains(frame: unknown, x: number, y: number): boolean {
    // @ts-ignore
    return x >= frame.x && x <= frame.x + frame.width && frame.y <= y && y <= frame.y + frame.height;
  }

  /**
   * 绘制
   * @param isCycles
   */
  drawInstructionData(isCycles: boolean): void {
    this.isChecked ? (this.textEle!.innerText = 'cycles数据流') : (this.textEle!.innerText = 'instructions数据流');
    const clientWidth = this.instructionEle!.width;
    //将数据转换为层级结构
    const instructionArray = this.instructionData
      // @ts-ignore
      .filter((item: unknown) => (isCycles ? item.cycles : item.instructions))
      .reduce((pre: unknown, cur: unknown) => {
        // @ts-ignore
        (pre[`${cur.depth}`] = pre[`${cur.depth}`] || []).push(cur);
        return pre;
      }, {});
    // @ts-ignore
    for (const key in instructionArray) {
      // @ts-ignore
      for (let i = 0; i < instructionArray[key].length; i++) {
        // @ts-ignore
        const cur = instructionArray[key][i];
        //第一级节点直接将宽度设置为容器宽度
        if (key === '0') {
          this.setSampleFrame(cur, clientWidth, 0);
        } else {
          //获取上一层级节点数据
          // @ts-ignore
          const preList = instructionArray[Number(key) - 1];
          //获取当前节点的父节点
          const parentNode = preList.find((node: SampleStruct) => node.name === cur.parentName);
          //计算当前节点下指令数之和 用于计算每个节点所占的宽度比
          const total = isCycles
            // @ts-ignore
            ? instructionArray[key]
              // @ts-ignore
              .filter((i: unknown) => i.parentName === parentNode.name)
              .reduce((pre: number, cur: SampleStruct) => pre + cur.cycles!, 0)
            // @ts-ignore
            : instructionArray[key]
              // @ts-ignore
              .filter((i: unknown) => i.parentName === parentNode.name)
              .reduce((pre: number, cur: SampleStruct) => pre + cur.instructions!, 0);
          const curWidth = isCycles ? cur.cycles : cur.instructions;
          const width = Math.floor(parentNode.frame.width * (curWidth / total));
          if (i === 0) {
            this.setSampleFrame(cur, width, parentNode.frame.x);
          } else {
            // @ts-ignore
            const preNode = instructionArray[key][i - 1];
            preNode.parentName === parentNode.name
              ? this.setSampleFrame(cur, width, preNode.frame.x + preNode.frame.width)
              : this.setSampleFrame(cur, width, parentNode.frame.x);
          }
        }
      }
    }
    // @ts-ignore
    this.instructionArray = instructionArray;

    this.ctx!.clearRect(0, 0, this.instructionEle!.width, this.instructionEle!.height);
    this.ctx!.beginPath();
    // @ts-ignore
    for (const key in instructionArray) {
      // @ts-ignore
      for (let i = 0; i < instructionArray[key].length; i++) {
        // @ts-ignore
        const cur = instructionArray[key][i];
        this.draw(this.ctx!, cur);
      }
    }
    this.ctx!.closePath();
  }

  /**
   * 更新canvas坐标
   */
  updateCanvasCoord(): void {
    if (this.instructionEle instanceof HTMLCanvasElement) {
      this.isUpdateCanvas = this.instructionEle.clientWidth !== 0;
      if (this.instructionEle.getBoundingClientRect()) {
        const box = this.instructionEle.getBoundingClientRect();
        const D = document.documentElement;
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
  searchDataByCoord(nodes: unknown, canvasX: number, canvasY: number): void | null {
    // @ts-ignore
    for (const key in nodes) {
      // @ts-ignore
      for (let i = 0; i < nodes[key].length; i++) {
        // @ts-ignore
        const cur = nodes[key][i];
        if (this.isContains(cur.frame, canvasX, canvasY)) {
          return cur;
        }
      }
    }
    return null;
  }

  /**
   * 绘制方法
   * @param ctx
   * @param data
   */
  draw(ctx: CanvasRenderingContext2D, data: SampleStruct) {
    let spApplication = <SpApplication>document.getElementsByTagName('sp-application')[0];
    if (data.frame) {
      ctx.globalAlpha = 1;
      ctx.fillStyle =
        ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', data.depth!, ColorUtils.FUNC_COLOR.length)];
      const textColor =
        ColorUtils.FUNC_COLOR[ColorUtils.hashFunc(data.name || '', data.depth!, ColorUtils.FUNC_COLOR.length)];
      ctx.lineWidth = 0.4;
      // @ts-ignore
      if (this.hoverSampleStruct && data.name == this.hoverSampleStruct.name) {
        if (spApplication.dark) {
          ctx.strokeStyle = '#fff';
        } else {
          ctx.strokeStyle = '#000';
        }
      } else {
        if (spApplication.dark) {
          ctx.strokeStyle = '#000';
        } else {
          ctx.strokeStyle = '#fff';
        }
      }
      ctx.strokeRect(data.frame.x, data.frame.y, data.frame.width, SAMPLE_STRUCT_HEIGHT - Y_PADDING);
      ctx.fillRect(data.frame.x, data.frame.y, data.frame.width, SAMPLE_STRUCT_HEIGHT - Y_PADDING);
      ctx.fillStyle = ColorUtils.funcTextColor(textColor);
      drawString(ctx, `${data.detail}(${data.name})`, 5, data.frame, data);
    }
  }

  /**
   * 统计框选指令数的平均值
   * @param instructionData
   * @returns
   */
  getAvgInstructionData(instructionData: Array<unknown>): unknown {
    // @ts-ignore
    const length = instructionData[0].property.length;
    // @ts-ignore
    const knowData = instructionData.filter((instruction) => instruction.name.indexOf('unknown') < 0);
    knowData.forEach((instruction) => {
      // @ts-ignore
      if (instruction.property.length > 0) {
        // @ts-ignore
        const totalInstruction = instruction.property.reduce(
          (pre: number, cur: SampleStruct) => pre + Math.ceil(cur.instructions!),
          0
        );
        // @ts-ignore
        const totalCycles = instruction.property.reduce(
          (pre: number, cur: SampleStruct) => pre + Math.ceil(cur.cycles!),
          0
        );
        // @ts-ignore
        instruction.instructions = Math.ceil(totalInstruction / length) || 1;
        // @ts-ignore
        instruction.cycles = Math.ceil(totalCycles / length) || 1;
        // @ts-ignore
        instruction.hoverInstructions = Math.ceil(totalInstruction / length);
        // @ts-ignore
        instruction.hoverCycles = Math.ceil(totalCycles / length);
        // @ts-ignore
        this.maxDepth = Math.max(this.maxDepth, instruction.depth);
      }
    });
    // @ts-ignore
    const unknownData = instructionData.filter((instruction) => instruction.name.indexOf('unknown') > -1);
    let instructionSum = 0;
    let cyclesSum = 0;
    let hoverInstructionsSum = 0;
    let hoverCyclesSum = 0;
    unknownData.forEach((unknown) => {
      instructionSum = 0;
      cyclesSum = 0;
      hoverInstructionsSum = 0;
      hoverCyclesSum = 0;
      // @ts-ignore
      for (const key in unknown.children) {
        // @ts-ignore
        const child = instructionData.find((instruction) => instruction.name === key);
        // @ts-ignore
        instructionSum += child.instructions ?? 0;
        // @ts-ignore
        cyclesSum += child.cycles ?? 0;
        // @ts-ignore
        hoverInstructionsSum += child.hoverInstructions ?? 0;
        // @ts-ignore
        hoverCyclesSum += child.hoverCycles ?? 0;
      }
      // @ts-ignore
      unknown.instructions = instructionSum;
      // @ts-ignore
      unknown.cycles = cyclesSum;
      // @ts-ignore
      unknown.hoverInstructions = hoverInstructionsSum;
      // @ts-ignore
      unknown.hoverCycles = hoverCyclesSum;
    });
    return instructionData;
  }

  /**
   * 监听页面size变化
   */
  listenerResize(): void {
    new ResizeObserver(() => {
      if (this.instructionEle!.getBoundingClientRect()) {
        const box = this.instructionEle!.getBoundingClientRect();
        const element = document.documentElement;
        this.startX = box.left + Math.max(element.scrollLeft, document.body.scrollLeft) - element.clientLeft;
        this.startY =
          box.top + Math.max(element.scrollTop, document.body.scrollTop) - element.clientTop + this.canvasScrollTop;
      }
    }).observe(this.parentElement!);
  }
}
