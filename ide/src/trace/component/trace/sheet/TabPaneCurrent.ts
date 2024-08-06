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
import { SlicesTime, StType } from '../timer-shaft/SportRuler';
import { getTimeString } from './TabPaneCurrentSelection';
import { TabPaneCurrentHtml } from './TabPaneCurrent.html';

@element('tabpane-current')
export class TabPaneCurrent extends BaseElement {
  private slicesTimeList: Array<SlicesTime> = [];
  private slicesTime: SlicesTime | null = null;
  private systemTrace: SpSystemTrace | undefined | null;
  private tableDataSource: Array<MarkStruct | unknown> = [];
  private panelTable: LitTable | undefined | null;

  initElements(): void {
    this.systemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.shadowRoot?.querySelector('#text')?.addEventListener('keyup', (event: unknown) => {
      // @ts-ignore
      event.stopPropagation();
      // @ts-ignore
      if (event.keyCode === '13') {
        if (this.slicesTime) {
          window.publish(window.SmartEvent.UI.KeyboardEnable, {
            enable: true,
          });
          // @ts-ignore
          this.slicesTime.text = event?.target.value;
          document.dispatchEvent(
            new CustomEvent('slices-change', {
              detail: this.slicesTime,
            })
          );
        }
      }
    });
    this.shadowRoot?.querySelector('#text')?.addEventListener('blur', (event: unknown) => {
      // @ts-ignore
      (window as unknown).flagInputFocus = false;
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: true,
      });
    });
    this.shadowRoot?.querySelector('#text')?.addEventListener('focus', (event: unknown) => {
      // @ts-ignore
      (window as unknown).flagInputFocus = true;
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: false,
      });
    });
    this.panelTable = this.shadowRoot!.querySelector<LitTable>('.notes-editor-panel');
    this.rowClickListener();
    this.mouseOutListener();
  }

  private rowClickListener(): void {
    this.panelTable!.addEventListener('row-click', (evt: unknown) => {
      // @ts-ignore
      if (evt.detail.data.startTime === undefined) {
        return;
      }
      // 点击表格某一行后，背景变色
      // @ts-ignore
      let data = evt.detail.data;
      this.systemTrace!.slicesList = this.slicesTimeList || [];
      //   页面上对应的slice变为实心
      this.slicesTimeList.forEach((slicesTime, index) => {
        if (data.startTime === slicesTime.startTime && data.endTime === slicesTime.endTime) {
          slicesTime.selected = true;
          this.setTableSelection(index + 1);
        } else {
          slicesTime.selected = false;
        }
        this.systemTrace?.timerShaftEL!.sportRuler!.draw();
      });
    });
  }

  private mouseOutListener(): void {
    // 当鼠标移出panel时重新加载备注信息
    this.systemTrace?.shadowRoot?.querySelector('trace-sheet')?.addEventListener(
      'mouseout',
      (event: unknown) => {
        if (this.slicesTimeList.length === 0) {
          return;
        }
        let tr = this.panelTable!.shadowRoot!.querySelectorAll('.tr') as NodeListOf<HTMLDivElement>;
        //   第一个tr是移除全部，所以跳过，从第二个tr开始，和this.slicesTimeList数组的第一个对应……，所以i从1开始，在this.slicesTimeList数组中取值时用i-1
        for (let i = 1; i < tr.length; i++) {
          tr[i].querySelector<HTMLInputElement>('#text-input')!.value = this.slicesTimeList[i - 1].text;
        }
        // @ts-ignore
        event.stopPropagation();
      },
      { capture: true }
    );
  }

  public setCurrentSlicesTime(slicesTime: SlicesTime): void {
    this.slicesTimeList = this.systemTrace?.timerShaftEL!.sportRuler?.slicesTimeList || [];
    this.slicesTime = slicesTime;
    // 判断当前传入的卡尺是否已经存在
    let findSlicesTime = this.slicesTimeList.find(
      (it) => it.startTime === slicesTime.startTime && it.endTime === slicesTime.endTime
    );
    // m键生成的临时卡尺只能同时出现最后一个，所以将永久卡尺过滤出来，并加上最后一个临时卡尺
    if (this.slicesTime.type === StType.TEMP) {
      this.slicesTimeList = this.slicesTimeList.filter(
        (item: SlicesTime) =>
          item.type === StType.PERM ||
          (item.type === StType.TEMP &&
            item.startTime === this.slicesTime!.startTime &&
            item.endTime === this.slicesTime!.endTime)
      );
    }
    // 如果this.slicesTimeList为空，或者没有在同一位置绘制过，就将当前的框选的范围画上线
    if (!findSlicesTime || this.slicesTimeList.length === 0) {
      this.slicesTimeList!.push(this.slicesTime);
    }
    this.setTableData();
  }

  /**
   * 根据this.slicesTimeList设置表格数据
   */
  private setTableData(): void {
    this.tableDataSource = [];
    // 按照开始时间进行排序，保证泳道图上的卡尺（shift+m键）和表格的顺序一致
    this.slicesTimeList.sort(function (a, b) {
      return a.startTime - b.startTime;
    });
    for (let slice of this.slicesTimeList) {
      let btn = document.createElement('button');
      btn.className = 'remove';
      let color = document.createElement('input');
      color.type = 'color';
      let text = document.createElement('input');
      text.type = 'text';
      color!.value = slice.color;
      text.value = slice.text;
      let sliceData = new MarkStruct(
        btn,
        color.value,
        text.value,
        getTimeString(slice.startTime),
        slice.startTime,
        getTimeString(slice.endTime),
        slice.endTime
      );
      slice.selected === true ? (sliceData.isSelected = true) : (sliceData.isSelected = false);
      this.tableDataSource.push(sliceData);
    }
    // 表格第一行只添加一个RemoveAll按钮
    let removeAll = document.createElement('button');
    removeAll.className = 'removeAll';
    removeAll.innerHTML = 'RemoveAll';
    let sliceData = new MarkStruct(removeAll);
    this.tableDataSource.unshift(sliceData);

    // 当前点击了哪个卡尺，就将对应的表格中的那行的背景变色
    this.tableDataSource.forEach((data, index) => {
      // @ts-ignore
      if (data.startTime === this.slicesTime?.startTime && data.endTime === this.slicesTime?.endTime) {
        this.setTableSelection(index);
      }
    });
    this.panelTable!.recycleDataSource = this.tableDataSource;
    this.panelTable!.meauseAllRowHeight(this.tableDataSource);
    this.eventHandler();
    this.systemTrace!.slicesList = this.slicesTimeList || [];
  }

  /**
   * 修改卡尺颜色事件和移除卡尺的事件处理
   */
  private eventHandler(): void {
    let tr = this.panelTable!.shadowRoot!.querySelectorAll('.tr') as NodeListOf<HTMLDivElement>;
    this.trClickEvent(tr);

    //   第一个tr是移除全部，所以跳过，从第二个tr开始，和this.slicesTimeList数组的第一个对应……，所以i从1开始，在this.slicesTimeList数组中取值时用i-1
    for (let i = 1; i < tr.length; i++) {
      // 修改颜色
      tr[i].querySelector<HTMLInputElement>('#color-input')!.value = this.slicesTimeList[i - 1].color;
      //  点击色块修改颜色
      this.trChangeEvent(tr, i);

      // 修改备注
      tr[i].querySelector<HTMLInputElement>('#text-input')!.value = this.slicesTimeList[i - 1].text;
      // //  点击色块修改颜色
      tr[i].querySelector('#text-input')?.addEventListener('keyup', (event: unknown) => {
        if (
          // @ts-ignore
          this.tableDataSource[i].startTime === this.slicesTimeList[i - 1].startTime &&
          // @ts-ignore
          this.tableDataSource[i].endTime === this.slicesTimeList[i - 1].endTime &&
          // @ts-ignore
          event.code === 'Enter' || event.code === 'NumpadEnter'
        ) {
          this.systemTrace!.slicesList = this.slicesTimeList || [];
          // @ts-ignore
          this.slicesTimeList[i - 1].text = event?.target.value;
          window.publish(window.SmartEvent.UI.KeyboardEnable, {
            enable: true,
          });
          document.dispatchEvent(new CustomEvent('slices-change', { detail: this.slicesTimeList[i - 1] }));
          document.dispatchEvent(new CustomEvent('remarksFocus-change', { detail: 'remarks-focus' }));

          this.systemTrace?.refreshCanvas(true);
        }
        // @ts-ignore
        event.stopPropagation();
      });

      tr[i].querySelector('#text-input')?.addEventListener('blur', (event: unknown) => {
        // @ts-ignore
        (window as unknown).flagInputFocus = false;
        window.publish(window.SmartEvent.UI.KeyboardEnable, {
          enable: true,
        });
        if (
          // @ts-ignore
          this.tableDataSource[i].startTime === this.slicesTimeList[i - 1].startTime &&
          // @ts-ignore
          this.tableDataSource[i].endTime === this.slicesTimeList[i - 1].endTime
        ) {
          // @ts-ignore
          this.slicesTimeList[i - 1].text = event?.target.value;
          document.dispatchEvent(new CustomEvent('slices-change', { detail: this.slicesTimeList[i - 1] }));
          document.dispatchEvent(new CustomEvent('remarksFocus-change', { detail: '' }));
          this.setTableData();
          this.systemTrace?.refreshCanvas(true);
        }
        // @ts-ignore
        event.stopPropagation();
      });
      this.trFocusEvent(tr, i);
      this.removeButtonClickEvent(tr, i);
    }
  }

  private trChangeEvent(tr: NodeListOf<HTMLDivElement>, i: number): void {
    tr[i].querySelector<HTMLInputElement>('#color-input')?.addEventListener('change', (event: unknown) => {
      if (
        // @ts-ignore
        this.tableDataSource[i].startTime === this.slicesTimeList[i - 1].startTime &&
        // @ts-ignore
        this.tableDataSource[i].endTime === this.slicesTimeList[i - 1].endTime
      ) {
        this.systemTrace!.slicesList = this.slicesTimeList || [];
        // @ts-ignore
        this.slicesTimeList[i - 1].color = event?.target.value;
        document.dispatchEvent(new CustomEvent('slices-change', { detail: this.slicesTimeList[i - 1] }));
        //   卡尺颜色改变时，重绘泳道图
        this.systemTrace?.refreshCanvas(true);
      }
      // @ts-ignore
      event.stopPropagation();
    });
  }

  private trFocusEvent(tr: NodeListOf<HTMLDivElement>, i: number): void {
    tr[i].querySelector('#text-input')?.addEventListener('focus', (event: unknown) => {
      // @ts-ignore
      (window as unknown).flagInputFocus = true;
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: false,
      });
      let tr = this.panelTable!.shadowRoot!.querySelectorAll('.tr') as NodeListOf<HTMLDivElement>;
      //   第一个tr是移除全部，所以跳过，从第二个tr开始，和this.flagList数组的第一个对应……，所以i从1开始，在this.flagList数组中取值时用i-1
      for (let i = 1; i < tr.length; i++) {
        tr[i].querySelector<HTMLInputElement>('#text-input')!.value = this.slicesTimeList[i - 1].text;
      }
    });
  }

  private trClickEvent(tr: NodeListOf<HTMLDivElement>): void {
    tr[0].querySelector('.removeAll')!.addEventListener('click', (evt: unknown) => {
      this.systemTrace!.slicesList = [];
      let slicesTimeList = [...this.slicesTimeList];
      for (let i = 0; i < slicesTimeList.length; i++) {
        slicesTimeList[i].hidden = true;
        document.dispatchEvent(new CustomEvent('slices-change', { detail: slicesTimeList[i] }));
      }
      this.slicesTimeList = [];
      return;
    });
  }

  private removeButtonClickEvent(tr: NodeListOf<HTMLDivElement>, i: number): void {
    // 点击remove按钮移除
    tr[i]!.querySelector('.remove')?.addEventListener('click', (event: unknown) => {
      if (
        // @ts-ignore
        this.tableDataSource[i].startTime === this.slicesTimeList[i - 1].startTime &&
        // @ts-ignore
        this.tableDataSource[i].endTime === this.slicesTimeList[i - 1].endTime
      ) {
        let slicesTimeList = [...this.slicesTimeList];
        this.slicesTimeList[i - 1].hidden = true;
        slicesTimeList.splice(i - 1, 1);
        this.systemTrace!.slicesList = slicesTimeList || [];
        document.dispatchEvent(new CustomEvent('slices-change', { detail: this.slicesTimeList[i - 1] }));
        this.slicesTimeList = slicesTimeList;
        //   移除时更新表格内容
        this.setTableData();
      }
      // @ts-ignore
      event.stopPropagation();
    });
  }

  /**
   * 修改表格指定行数的背景颜色
   * @param line 要改变的表格行数
   */
  public setTableSelection(line: unknown): void {
    // @ts-ignore
    this.tableDataSource[line].isSelected = true;
    // @ts-ignore
    this.panelTable?.clearAllSelection(this.tableDataSource[line]);
    // @ts-ignore
    this.panelTable?.setCurrentSelection(this.tableDataSource[line]);
  }

  initHtml(): string {
    return TabPaneCurrentHtml;
  }
}
