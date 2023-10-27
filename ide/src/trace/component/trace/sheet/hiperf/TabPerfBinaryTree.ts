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

import { BaseElement, element } from '../../../../../base-ui/BaseElement.js';
import { SelectionParam } from '../../../../bean/BoxSelection.js';
import { procedurePool } from '../../../../database/Procedure.js';

@element('tabpane-perf-svg')
export class TabpanePerfBinaryTree extends BaseElement {
  private svgElement: SVGSVGElement | undefined;
  private binaryTreeDate: any;
  private nodeWidth: number = 100;
  private nodeHeight: number = 50;
  private nodeGap: number | undefined;
  private pathOffset: number = 30;
  private arrowSize: number = 6;
  private searchValue: string = '';
  private currentSelection: SelectionParam | undefined;

  set data(perfProfilerSelection: SelectionParam | any) {
    if (perfProfilerSelection === this.currentSelection) {
      return;
    }
    this.searchValue = '';
    this.currentSelection = perfProfilerSelection;
    this.nodeGap = 100;
    this.getDataByWorker(
      [
        {
          funcName: 'setSearchValue',
          funcArgs: [''],
        },
        {
          funcName: 'getCurrentDataFromDb',
          funcArgs: [perfProfilerSelection],
        },
      ],
      (results: any[]) => {
        // console.log(results,'111');
        this.binaryTreeDate = results;
        this.draw();
      }
    );
  }

  initElements(): void {
    this.svgElement = this.shadowRoot?.querySelector('#binaryTreeSvg') as SVGSVGElement;

  }

  getDataByWorker(args: any[], handler: Function) {
    procedurePool.submitWithName('logic0', 'perf-action', args, undefined, (results: any) => {
      handler(results);

    });
  }

  private draw(): void {
    if (!this.binaryTreeDate) return;
    //清空SVG
    while (this.svgElement?.firstChild) {
      this.svgElement.firstChild.remove();
    }

    //计算树的高度和每层节点数量
    const treeWidth = this.getTreeWidth(this.binaryTreeDate);
    const treeHeight = this.getTreeHeight(this.binaryTreeDate);

    //计算根节点的位置
    const rootX = (this.svgElement!.clientWidth - this.nodeWidth) / 2;
    // console.log(this.svgElement!.clientWidth,'svg可视宽度');

    const rootY = this.nodeGap!;

    //绘制根节点
    const rootNode = this.createNode(rootX, rootY, this.binaryTreeDate);
    this.svgElement!.appendChild(rootNode);

    //绘制子节点和连线
    this.drawChildren(this.binaryTreeDate, rootX, rootY, treeWidth, treeHeight, 0, 0);
  }

  private drawChildren(
    nodeData: any,
    parentX: number,
    parentY: number,
    treeWidth: number,
    treeHeight: number,
    level: number,
    index: number
  ): void {
    if (nodeData.length === 0) return;

    //计算子节点的位置
    const startX = parentX - (treeWidth / 2) + (this.nodeWidth + this.nodeGap!) * index;
    const startY = parentY + this.nodeHeight + this.nodeGap!;

    //循环遍历子节点
    for (let i = 0; i < nodeData.length; i++) {
      //计算子节点的x坐标
      const childX = startX + (this.nodeWidth + this.nodeGap!) * i;
      const childNode = this.createNode(childX, startY, nodeData[i]);
      this.svgElement!.appendChild(childNode);

      //绘制连线
      const pathStartX = parentX + this.nodeWidth / 2;
      const pathStartY = parentY + this.nodeHeight;
      const pathEndX = childX + this.nodeWidth / 2;
      const pathEndY = startY;
      const pathControlX = (pathStartX + pathEndX) / 2;
      const pathControlY = pathStartY + this.pathOffset;
      const path = this.createPath(pathStartX, pathStartY, pathControlX, pathControlY, pathEndX, pathEndY);
      this.svgElement!.appendChild(path);

      //绘制箭头
      const arrow = this.createArrow(pathEndX, pathEndY);
      this.svgElement!.appendChild(arrow);

      // 递归绘制子节点的子节点
      this.drawChildren(nodeData[i].children, childX, startY, treeWidth, treeHeight, level + 1, i);
    }
  }

  private createNode(x: number, y: number, data: any): SVGElement {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x.toString());
    rect.setAttribute("y", y.toString());
    rect.setAttribute("width", this.nodeWidth.toString());
    rect.setAttribute("height", this.nodeHeight.toString());
    rect.setAttribute("fill", "#f5c78e");
    rect.setAttribute("stroke", "#000000");
    group.appendChild(rect);

    const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    foreignObject.setAttribute("x", (x + 5).toString());
    foreignObject.setAttribute("y", (y + 5).toString());
    foreignObject.setAttribute("width", (this.nodeWidth - 10).toString());
    foreignObject.setAttribute("height", (this.nodeHeight - 10).toString());

    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.whiteSpace = "nowrap";
    div.style.textOverflow = "ellipsis";
    div.style.overflow = "hidden";
    div.textContent = `${data.symbol}`;
    foreignObject.appendChild(div);

    group.appendChild(foreignObject);

    return group;
  }


  private createPath(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): SVGElement {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2 - this.arrowSize}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#000000");

    return path;
  }

  private createArrow(x: number, y: number): SVGElement {
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrow.setAttribute(
      "d",
      `M ${x - this.arrowSize / 2},${y - this.arrowSize} L ${x + this.arrowSize / 2},${y - this.arrowSize} L ${x},${y + this.arrowSize / 2} Z`
    );
    arrow.setAttribute("fill", "#000000");

    return arrow;
  }


  private getTreeWidth(nodeData: any): number {
    if (nodeData.length === 0) return this.nodeWidth;

    const childrenCount = nodeData.length;
    return childrenCount * (this.nodeWidth + this.nodeGap!) - this.nodeGap!;
  }

  private getTreeHeight(nodeData: any): number {
    if (nodeData.length === 0) return this.nodeHeight;

    let maxHeight = 0;
    const childrenCount = nodeData.length;

    for (let i = 0; i < childrenCount; i++) {
      //递归计算所有子节点高度
      const childHeight = this.getTreeHeight(nodeData[i]);
      if (childHeight > maxHeight) {
        maxHeight = childHeight;

      }
    }

    return this.nodeHeight + this.nodeGap! + maxHeight;
  }

  initHtml(): string {
    return `<style>
:host{
    display: flex;
    flex-direction: column;
    padding: 10px 10px;
    height:100%;
}
#binaryTreeSvg{
  min-width:100%;
  height:100%;
}
</style>
<div style="height:100%">
    <svg id='binaryTreeSvg' viewBox="0 0 2000 1000">
    </svg>
</div>`;
  }
}
