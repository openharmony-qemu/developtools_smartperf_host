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
import { BaseElement, element } from '../../../../base-ui/BaseElement';
import { TraceRowObject } from './TraceRowObject';
import { TraceRow } from './TraceRow';
import { log } from '../../../../log/Log';

@element('trace-row-recycler-view')
export class TraceRowRecyclerView extends BaseElement {
  private recycler: boolean = true;
  private gasketEL: HTMLDivElement | null | undefined;
  private vessel: HTMLDivElement | null | undefined;
  private visibleRowsCount: number = 0;
  private visibleObjects: TraceRowObject<any>[] = [];
  private totalHeight: number = 0;

  private _dataSource: Array<TraceRowObject<any>> = [];
  private _renderType: string = 'div';

  get dataSource(): Array<TraceRowObject<any>> {
    return this._dataSource;
  }

  set dataSource(value: Array<TraceRowObject<any>>) {
    log('dataSource TraceRowObject size :' + value.length);
    this._dataSource = value;
    this.measureHeight();
    this.initUI();
    let els = [...this.shadowRoot!.querySelectorAll<TraceRow<any>>('.recycler-cell')];
    for (let i = 0; i < els.length; i++) {
      this.refreshRow(els[i], this.visibleObjects[i]);
    }
  }

  get renderType(): string {
    return this._renderType;
  }

  set renderType(value: string) {
    this._renderType = value;
  }

  refreshRow(el: TraceRow<any>, obj: TraceRowObject<any>) {
    if (!obj) {
      return;
    }
    el.obj = obj;
    el.folder = obj.folder;
    el.style.top = `${obj.top}px`;
    el.name = obj.name || '';
    if (obj.children) {
      el.setAttribute('children', ``);
    } else {
      el.removeAttribute('children');
    }
    el.style.visibility = 'visible';
    el.rowId = obj.rowId;
    el.rowType = obj.rowType;
    el.rowParentId = obj.rowParentId;
    el.expansion = obj.expansion;
    el.rowHidden = obj.rowHidden;
    el.setAttribute('height', `${obj.rowHeight}`);
    requestAnimationFrame(() => {});
  }

  initElements(): void {
    this.vessel = this.shadowRoot?.querySelector<HTMLDivElement>('.vessel');
    this.gasketEL = this.shadowRoot?.querySelector<HTMLDivElement>('.gasket');
    let els: Array<TraceRow<any>> | undefined | null;
    this.vessel!.onscroll = (ev) => {
      let top = this.vessel!.scrollTop;
      let skip = 0;
      for (let index = 0; index < this.visibleObjects.length; index++) {
        if (this.visibleObjects[index].top >= top) {
          skip = this.visibleObjects[index].rowIndex - 1;
          break;
        }
      }
      if (skip < 0) skip = 0;
      if (!els) els = [...this.shadowRoot!.querySelectorAll<TraceRow<any>>('.recycler-cell')];
      for (let i = 0; i < els.length; i++) {
        let obj = this.visibleObjects[i + skip];
        this.refreshRow(els[i], obj);
      }
    };
  }

  measureHeight() {
    this.visibleObjects = this.dataSource.filter((it) => !it.rowHidden);
    this.totalHeight = this.visibleObjects.map((it) => it.rowHeight).reduce((a, b) => a + b);
    let totalHeight = 0;
    for (let i = 0; i < this.visibleObjects.length; i++) {
      this.visibleObjects[i].top = totalHeight;
      this.visibleObjects[i].rowIndex = i;
      totalHeight += this.visibleObjects[i].rowHeight;
      this.visibleObjects[i].preObject = i == 0 ? null : this.visibleObjects[i - 1];
      this.visibleObjects[i].nextObject = i == this.visibleObjects.length - 1 ? null : this.visibleObjects[i + 1];
    }
    this.gasketEL && (this.gasketEL.style.height = `${this.totalHeight}px`);
  }

  initUI() {
    this.visibleRowsCount = Math.ceil(this.clientHeight / 40);
    if (this.visibleRowsCount >= this.visibleObjects.length) {
      this.visibleRowsCount = this.visibleObjects.length;
    }
    if (!this.recycler) this.visibleRowsCount = this.dataSource.length;
    for (let i = 0; i <= this.visibleRowsCount; i++) {
      let el = new TraceRow<any>({
        canvasNumber: 1,
        alpha: true,
        contextId: '2d',
        isOffScreen: true,
      });
      el.className = 'recycler-cell';
      this.vessel?.appendChild(el);
      el.addEventListener('expansion-change', (ev: any) => {
        el.obj!.expansion = ev.detail.expansion;
        for (let j = 0; j < this.dataSource.length; j++) {
          if (this.dataSource[j].rowParentId == ev.detail.rowId) {
            this.dataSource[j].rowHidden = !ev.detail.expansion;
          }
        }
        this.measureHeight();
        let els = [...this.shadowRoot!.querySelectorAll<TraceRow<any>>('.recycler-cell')];
        let top = this.vessel!.scrollTop;
        let skip = 0;
        for (let i = 0; i < this.visibleObjects.length; i++) {
          if (this.visibleObjects[i].top >= top) {
            skip = this.visibleObjects[i].rowIndex - 1;
            break;
          }
        }
        if (skip < 0) skip = 0;
        for (let i = 0; i < els.length; i++) {
          let obj = this.visibleObjects[i + skip];
          this.refreshRow(els[i], obj);
        }
      });
    }
  }

  initHtml(): string {
    return `
        <style>
        :host{
            width:100%;
            height:100%;
            display: block;
            position:relative;
        }
        .vessel{
            width:100%;
            height:100%;
            overflow: auto;
            position: absolute;
            display: block;
        }
        .gasket{
            width:100%;
            height:auto;
            top: 0;
            left: 0;
            right:0;
            bottom:0;
            visibility: hidden;
        }
        .recycler-cell{
            position: absolute;
            width:100%;
            visibility: hidden;
            top: 0;
            left: 0;
        }
        </style>
        <div class="vessel">
            <div class="gasket"></div>
        </div>

        `;
  }
}
