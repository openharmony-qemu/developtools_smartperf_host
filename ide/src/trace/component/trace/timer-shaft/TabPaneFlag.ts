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
import { LitTable } from '../../../../base-ui/table/lit-table';
import { MarkStruct } from '../../../bean/MarkStruct';
import { SpSystemTrace } from '../../SpSystemTrace';
import { getTimeString } from '../sheet/TabPaneCurrentSelection';
import { Flag } from './Flag';

@element('tabpane-flag')
export class TabPaneFlag extends BaseElement {
  private flag: Flag | null = null;
  private flagList: Array<Flag> = [];
  private systemTrace: SpSystemTrace | undefined | null;
  private tableDataSource: Array<MarkStruct | any> = [];
  private panelTable: LitTable | undefined | null;

  initElements(): void {
    this.systemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.panelTable = this.shadowRoot!.querySelector<LitTable>('.notes-editor-panel');
    this.panelTable!.addEventListener('row-click', (evt: any) => {
      if (evt.detail.data.startTime === undefined) {
        return;
      }
      this.flagList = this.systemTrace?.timerShaftEL!.sportRuler?.flagList || [];
      // 点击表格某一行后，背景变色
      // @ts-ignore
      let data = evt.detail.data;
      this.systemTrace!.flagList = this.flagList || [];
      //   页面上对应的flag变为实心有旗杆
      this.flagList.forEach((flag, index) => {
        if (data.startTime === flag.time) {
          flag.selected = true;
          this.setTableSelection(index + 1);
        } else {
          flag.selected = false;
        }
        this.systemTrace?.timerShaftEL!.sportRuler!.drawTriangle(flag.time, flag.type);
      });
    });
    // 当鼠标移出panel时重新加载备注信息
    this.systemTrace?.shadowRoot?.querySelector('trace-sheet')?.addEventListener(
      'mouseout',
      (event: any) => {
        if (this.flagList.length === 0) {
          return;
        }
        let tr = this.panelTable!.shadowRoot!.querySelectorAll('.tr') as NodeListOf<HTMLDivElement>;
        //   第一个tr是移除全部，所以跳过，从第二个tr开始，和this.slicestimeList数组的第一个对应……，所以i从1开始，在this.slicestimeList数组中取值时用i-1
        for (let i = 1; i < tr.length; i++) {
          tr[i].querySelector<HTMLInputElement>('#text-input')!.value = this.flagList[i - 1].text;
        }
        event.stopPropagation();
      },
      { capture: true }
    );
  }

  public setCurrentFlag(flag: Flag): void {
    this.flagList = this.systemTrace?.timerShaftEL!.sportRuler?.flagList || [];
    this.flag = flag;
    // 判断当前传入的旗子是否已经存在
    let findFlag = this.flagList.find((it) => it.time === flag.time);
    // 如果this.flagList为空，或者没有在同一位置绘制过，就将当前的flag放进数组
    if (!findFlag || this.flagList.length === 0) {
      this.flagList!.push(this.flag);
    }
    this.setTableData();
  }

  /**
   * 根据this.flagList设置表格数据
   */
  private setTableData(): void {
    this.flagList = this.systemTrace?.timerShaftEL!.sportRuler?.flagList || [];
    this.tableDataSource = [];
    // 按照时间进行排序，保证泳道图上的旗子和表格的顺序一致
    this.flagList.sort(function (a, b) {
      return a.time - b.time;
    });

    for (let flag of this.flagList) {
      let btn = document.createElement('button');
      btn.className = 'remove';
      let color = document.createElement('input');
      color.type = 'color';
      let text = document.createElement('input');
      text.type = 'text';
      color!.value = flag.color;
      text!.value = flag.text;
      let flagData = new MarkStruct(btn, color, text, getTimeString(flag.time), flag.time);
      flag.selected === true ? (flagData.isSelected = true) : (flagData.isSelected = false);
      this.systemTrace?.timerShaftEL!.sportRuler!.drawTriangle(flag.time, flag.type);
      this.tableDataSource.push(flagData);
    }
    // 表格第一行只添加一个RemoveAll按钮
    let removeAll = document.createElement('button');
    removeAll.className = 'removeAll';
    removeAll.innerHTML = 'RemoveAll';
    let flagData = new MarkStruct(removeAll);
    this.tableDataSource.unshift(flagData);

    // 当前点击了哪个旗子，就将对应的表格中的那行的背景变色
    this.tableDataSource.forEach((data, index) => {
      if (data.time === this.flag?.time) {
        this.setTableSelection(index);
      }
    });
    this.panelTable!.recycleDataSource = this.tableDataSource;
    this.eventHandler();
    this.systemTrace!.flagList = this.flagList || [];
  }

  /**
   * 修改旗子颜色事件和移除旗子的事件处理
   */
  private eventHandler(): void {
    let tr = this.panelTable!.shadowRoot!.querySelectorAll('.tr') as NodeListOf<HTMLDivElement>;
    tr[0].querySelector<HTMLInputElement>('#text-input')!.disabled = true;
    tr[0].querySelector('.removeAll')!.addEventListener('click', () => {
      this.systemTrace!.flagList = [];
      let flagList = [...this.flagList];
      for (let i = 0; i < flagList.length; i++) {
        flagList[i].hidden = true;
        document.dispatchEvent(new CustomEvent('flag-change', { detail: flagList[i] }));
      }
      this.flagList = [];
      return;
    });

    // 更新备注信息
    this.panelTable!.addEventListener('click', (event: any) => {
      if (this.flagList.length === 0) {
        return;
      }
      for (let i = 1; i < tr.length; i++) {
        let inputValue = tr[i].querySelector<HTMLInputElement>('#text-input')!.value;
        if (this.tableDataSource[i].startTime === this.flagList[i - 1].time) {
          this.flagList[i - 1].text = inputValue;
          document.dispatchEvent(new CustomEvent('flag-change', { detail: this.flagList[i - 1] }));
          //   旗子颜色改变时，重绘泳道图
          this.systemTrace?.refreshCanvas(true);
        }
      }
      event.stopPropagation();
    });

    //   第一个tr是移除全部，所以跳过，从第二个tr开始，和this.flagList数组的第一个对应……，所以i从1开始，在this.flagList数组中取值时用i-1
    for (let i = 1; i < tr.length; i++) {
      tr[i].querySelector<HTMLInputElement>('#color-input')!.value = this.flagList[i - 1].color;
      //  点击色块修改颜色
      tr[i].querySelector<HTMLInputElement>('#color-input')?.addEventListener('change', (event: any) => {
        if (this.tableDataSource[i].startTime === this.flagList[i - 1].time) {
          this.flagList[i - 1].color = event?.target.value;
          document.dispatchEvent(new CustomEvent('flag-change', { detail: this.flagList[i - 1] }));
          //   旗子颜色改变时，重绘泳道图
          this.systemTrace?.refreshCanvas(true);
        }
        event.stopPropagation();
      });
      // 修改备注
      tr[i].querySelector<HTMLInputElement>('#text-input')!.value = this.flagList[i - 1].text;
      tr[i].querySelector<HTMLInputElement>('#text-input')?.addEventListener('keyup', (event: any) => {
        if (this.tableDataSource[i].startTime === this.flagList[i - 1].time && event.keyCode === '13') {
          this.flagList[i - 1].text = event?.target.value;
          document.dispatchEvent(new CustomEvent('flag-change', { detail: this.flagList[i - 1] }));
          //   旗子颜色改变时，重绘泳道图
          this.systemTrace?.refreshCanvas(true);
        }
        event.stopPropagation();
      });

      tr[i].querySelector<HTMLInputElement>('#text-input')?.addEventListener('blur', (event: any) => {
        (window as any).flagInputFocus = false;
        window.publish(window.SmartEvent.UI.KeyboardEnable, {
          enable: true,
        });
        if (this.tableDataSource[i].startTime === this.flagList[i - 1].time) {
          this.flagList[i - 1].text = event?.target.value;
          document.dispatchEvent(new CustomEvent('flag-change', { detail: this.flagList[i - 1] }));
          //   旗子颜色改变时，重绘泳道图
          this.systemTrace?.refreshCanvas(true);
        }
        event.stopPropagation();
      });

      tr[i].querySelector<HTMLInputElement>('#text-input')?.addEventListener('focus', (event: any) => {
        (window as any).flagInputFocus = true;
        window.publish(window.SmartEvent.UI.KeyboardEnable, {
          enable: false,
        });
        let tr = this.panelTable!.shadowRoot!.querySelectorAll('.tr') as NodeListOf<HTMLDivElement>;
        //   第一个tr是移除全部，所以跳过，从第二个tr开始，和this.flagList数组的第一个对应……，所以i从1开始，在this.flagList数组中取值时用i-1
        for (let i = 1; i < tr.length; i++) {
          tr[i].querySelector<HTMLInputElement>('#text-input')!.value = this.flagList[i - 1].text;
        }
      });
      // 点击remove按钮移除
      tr[i]!.querySelector('.remove')?.addEventListener('click', (event: any) => {
        if (this.tableDataSource[i].startTime === this.flagList[i - 1].time) {
          this.flagList[i - 1].hidden = true;
          this.systemTrace!.flagList = this.flagList || [];
          document.dispatchEvent(new CustomEvent('flag-change', { detail: this.flagList[i - 1] }));
          //   移除时更新表格内容
          this.setTableData();
        }
        event.stopPropagation();
      });
    }
  }

  /**
   * 修改表格指定行数的背景颜色
   * @param line 要改变的表格行数
   */
  public setTableSelection(line: any): void {
    this.tableDataSource[line].isSelected = true;
    this.panelTable?.clearAllSelection(this.tableDataSource[line]);
    this.panelTable?.setCurrentSelection(this.tableDataSource[line]);
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <lit-table class="notes-editor-panel" style="height: auto">
            <lit-table-column width="20%" data-index="startTimeStr" key="startTimeStr" align="flex-start" title="TimeStamp">
            </lit-table-column>
            <lit-table-column width="10%" data-index="color" key="color" align="flex-start" title="Color">
                <template>
                    <div style='width:50px; height: 21px; position: relative;overflow: hidden;'>
                        <input type="color" id="color-input" style='
                            background: var(--dark-background5,#FFFFFF);
                            padding: 0px;
                            border: none;
                            width: 60px;
                            height: 31px;
                            position: absolute;
                            top: -5px;
                            left: -5px;'/>
                    </div>
                </template>
            </lit-table-column>
            <lit-table-column width="40%" data-index="text" key="text" align="flex-start" title="Remarks">
              <template>
                  <input type="text" id="text-input"  style="width: 100%; border: none" /> 
              </template>
            </lit-table-column>
            <lit-table-column width="10%" data-index="operate" key="operate" align="flex-start" title="Operate">
                <template>
                    <button class="remove" style='
                        background: var(--dark-border1,#262f3c);
                        color: white;
                        border-radius: 10px;
                        font-size: 10px;
                        height: 21px;
                        line-height: 21px;
                        min-width: 7em;
                        border: none;
                        cursor: pointer;
                        outline: inherit;
                    '>Remove</button>
                </template>
            </lit-table-column>
        </lit-table>
        `;
  }
}
