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

import { LitTable } from '../../../src/base-ui/table/lit-table';
import { LitTableColumn } from '../../../src/base-ui/table/lit-table-column';
import { TableRowObject } from '../../../src/base-ui/table/TableRowObject';
import { LitProgressBar } from '../../../src/base-ui/progress-bar/LitProgressBar';
import { LitIcon } from '../../../src/base-ui/icon/LitIcon';
describe('LitTable Test', () => {
  window.ResizeObserver =
    window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
      disconnect: jest.fn(),
      observe: jest.fn(),
      unobserve: jest.fn(),
    }));
  let litTable = new LitTable();
  litTable.selectable = true;
  litTable.selectable = false;
  litTable.scrollY = 'scrollY';

  litTable.dataSource = [];

  litTable.dataSource = [
    {
      id: 1,
      name: 'name',
    },
    {
      id: 2,
      name: 'nameValue',
    },
  ];
  const td = {
    style: {
      position: 'sticky',
      left: '0px',
      right: '0px',
      boxShadow: '3px 0px 5px #33333333',
    },
  };
  const placement = 'left';

  const element = {
    style: {
      display: 'none',
      transform: 'translateY',
    },
    childNodes: { forEach: true },
    onclick: 1,
  };
  const rowObject = {
    children: {
      length: 1,
    },
    data: [{ isSelected: undefined }],
    depth: 1,
    top: 1,
  };
  const firstElement =
    {
      style: {
        display: 'none',
        paddingLeft: '',
        transform: 'translateY',
      },
      innerHTML: '',
      title: '',
      firstChild: null,
      onclick: 1,
    } || undefined;

  litTable.columns = litTable.columns || jest.fn(() => true);

  litTable.tbodyElement = jest.fn(() => ({
    innerHTML: '',
  }));

  litTable.tableColumns = jest.fn(() => []);

  litTable.tableColumns.forEach = jest.fn(() => []);

  it('LitTableTest01', () => {
    expect(litTable.adoptedCallback()).toBeUndefined();
  });

  it('LitTableTest02', () => {
    litTable.ds = [
      {
        name: 'StartTime',
        value: '1s 489ms 371μs ',
      },
      {
        name: 'Duration',
        value: '6ms 440μs ',
      },
      {
        name: 'State',
        value: 'Sleeping',
      },
      {
        name: 'Process',
        value: 'hilogd [441] ',
      },
    ];
    litTable.setAttribute('selectable', '123');
    let tableColmn = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn.setAttribute('title', '621');
    tableColmn.setAttribute('data-index', '16');
    tableColmn.setAttribute('key', '261');
    tableColmn.setAttribute('align', 'flex-start');
    tableColmn.setAttribute('height', '202px');
    let tableColmn1 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn1.setAttribute('title', '12');
    tableColmn1.setAttribute('data-index', '12');
    tableColmn1.setAttribute('key', '67');
    tableColmn1.setAttribute('align', 'flex-start');
    tableColmn1.setAttribute('height', '120px');
    let tableColmn2 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn2.setAttribute('title', '13');
    tableColmn2.setAttribute('data-index', '13');
    tableColmn2.setAttribute('key', '163');
    tableColmn2.setAttribute('align', 'flex-start');
    tableColmn2.setAttribute('height', '4px');
    litTable.tableColumns = [tableColmn, tableColmn1, tableColmn2];
    litTable.tbodyElement = document.createElement('div');
    expect(litTable.renderTable()).toBeUndefined();
  });

  it('LitTableTest03', () => {
    litTable.switch = document.querySelector('#switch') as HTMLInputElement;
    expect(litTable.connectedCallback()).toBeUndefined();
  });

  it('LitTableTest04', () => {
    let rowLength = litTable.getCheckRows().length == 0;
    expect(rowLength).toBeTruthy();
  });

  it('LitTableTest05', () => {
    expect(
      litTable.deleteRowsCondition(() => {
        return true;
      })
    ).toBeUndefined();
  });

  it('LitTableTest06', () => {
    expect(litTable.selectable).not.toBeUndefined();
  });

  it('LitTableTest07', () => {
    litTable.selectable = true;
    expect(litTable.selectable).toBeTruthy();
  });

  it('LitTableTest08', () => {
    expect(litTable.scrollY).not.toBeUndefined();
  });

  it('LitTableTest09', () => {
    expect(litTable.dataSource).not.toBeUndefined();
  });

  it('LitTableTest10', () => {
    expect(litTable.recycleDataSource).not.toBeUndefined();
  });

  it('LitTableTest11', () => {
    expect(litTable.meauseElementHeight()).toBe(27);
  });

  it('LitTableTest12', () => {
    expect(litTable.meauseTreeElementHeight()).toBe(27);
  });

  it('LitTableTest13', () => {
    document.body.innerHTML = "<lit-table id='tab' tree></lit-table>";
    let table = document.querySelector('#tab') as LitTable;
    let htmlElement = document.createElement('lit-table-column') as LitTableColumn;
    htmlElement.setAttribute('title', '1');
    htmlElement.setAttribute('data-index', '1');
    htmlElement.setAttribute('key', '1');
    htmlElement.setAttribute('align', 'flex-start');
    htmlElement.setAttribute('height', '32px');
    table!.appendChild(htmlElement);
    setTimeout(() => {
      table.recycleDataSource = [
        {
          id: 1,
          name: 'name',
        },
        {
          id: 2,
          name: 'nameValue',
        },
      ];
      expect(table.meauseTreeElementHeight()).toBe(27);
    }, 20);
  });

  it('LitTableTest14', () => {
    expect(litTable.createExpandBtn({ expanded: false, data: { status: true } })).not.toBeUndefined();
  });

  it('LitTableTest15', () => {
    let newTableElement = document.createElement('div');
    newTableElement.classList.add('tr');
    newTableElement.style.cursor = 'pointer';
    newTableElement.style.gridTemplateColumns = '1,2,3';
    newTableElement.style.position = 'absolute';
    newTableElement.style.top = '0px';
    newTableElement.style.left = '0px';
    litTable.currentRecycleList = [newTableElement];
    litTable.recycleDs = [{ rowHidden: false, data: { isSearch: true } }];
    litTable.tbodyElement = document.createElement('div');
    litTable.treeElement = document.createElement('div');
    litTable.tableElement = document.createElement('div');
    litTable.theadElement = document.createElement('div');
    expect(litTable.reMeauseHeight()).toBeUndefined();
  });

  it('LitTableTest15', () => {
    const rowData = {
      data: [
        {
          isSelected: undefined,
        },
      ],
    };
    litTable.columns.forEach = jest.fn(() => true);
    expect(litTable.createNewTableElement(rowData)).not.toBeUndefined();
  });

  it('LitTableTest16', () => {
    let element = document.createElement('div');
    let ch = document.createElement('div');
    element.appendChild(ch);
    let rowObject = { rowHidden: false, data: { isSearch: true } };
    let tableColmn = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn.setAttribute('data-index', '1');
    tableColmn.setAttribute('title', '1');
    tableColmn.setAttribute('data-index', '2');
    tableColmn.setAttribute('align', 'flex-start');
    tableColmn.setAttribute('height', '32px');
    tableColmn.setAttribute('key', '2');
    let tableColmn1 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn1.setAttribute('align', 'flex-start');
    tableColmn1.setAttribute('height', '32px');
    tableColmn1.setAttribute('title', '2');
    tableColmn1.setAttribute('data-index', '2');
    tableColmn1.setAttribute('key', '2');
    litTable.columns = [tableColmn, tableColmn1];
    expect(litTable.freshCurrentLine(element, rowObject)).toBeUndefined();
  });

  it('LitTableTest16', () => {
    litTable.recycleDs.length = 1;
    litTable.setCurrentSelection = jest.fn(() => true);
    expect(litTable.scrollToData()).toBeUndefined();
  });

  it('LitTableTest17', () => {
    litTable.recycleDs = [{ rowHidden: false, data: { isSearch: true } }];
    let dataSource = [
      {
        id: 11,
        name: 'name',
      },
      {
        id: 21,
        name: 'value',
      },
    ];
    expect(litTable.expandList(dataSource)).toBeUndefined();
  });

  it('LitTableTest18', () => {
    expect(litTable.clearAllSelection()).toBeUndefined();
  });

  it('LitTableTest19', () => {
    const mockEvent = new MouseEvent('click', { button: 0 });
    expect(() => litTable.dispatchRowClickEvent({ data: { isSelected: '' } }, [], mockEvent)).not.toThrow();
  });

  it('LitTableTest20', () => {
    litTable.treeElement = jest.fn(() => undefined);
    litTable.treeElement.children = jest.fn(() => [1]);
    litTable.columns.forEach = jest.fn(() => true);
    litTable.treeElement.lastChild = jest.fn(() => true);
    litTable.treeElement.lastChild.style = jest.fn(() => true);
    expect(litTable.createNewTreeTableElement({ data: '' })).not.toBeUndefined();
  });

  it('LitTableTest21', () => {
    litTable.tableElement = jest.fn(() => undefined);
    litTable.tableElement.scrollTop = jest.fn(() => 1);
    expect(litTable.move1px()).toBeUndefined();
  });

  it('LitTableTest22', () => {
    document.body.innerHTML = `<lit-table id="aaa"></lit-table>`;
    let litTable = document.querySelector('#aaa') as LitTable;
    expect(litTable.setMouseIn(true, [])).toBeUndefined();
  });

  it('LitTableTest23', () => {
    let tableIcon = document.createElement('lit-icon') as LitIcon;
    let mouseClickEvent: MouseEvent = new MouseEvent('click', <MouseEventInit>{ movementX: 1, movementY: 2 });
    tableIcon.dispatchEvent(mouseClickEvent);
  });

  it('LitTableTest24', () => {
    document.body.innerHTML = `<lit-table id="aaa"></lit-table>`;
    let litTable = document.querySelector('#aaa') as LitTable;
    const data = {
      isSelected: true,
    };
    expect(litTable.setCurrentSelection(data)).toBeUndefined();
  });

  it('LitTableTest25', () => {
    document.body.innerHTML = `<lit-table id="aaa"></lit-table>`;
    let litTable = document.querySelector('#aaa') as LitTable;
    litTable.formatName = true;
    expect(litTable.formatName).toBeTruthy();
  });

  it('LitTableTest26', () => {
    let litTable = new LitTable();
    expect(litTable.dataExportInit()).toBeUndefined();
  });
  it('LitTableTest27', () => {
    let litTable = new LitTable();
    let htmlElement = document.createElement('lit-table-column') as LitTableColumn;
    htmlElement.setAttribute('title', '41');
    htmlElement.setAttribute('data-index', '1');
    htmlElement.setAttribute('key', '14');
    htmlElement.setAttribute('align', 'flex-start');
    htmlElement.setAttribute('height', '34px');
    litTable.columns = [htmlElement];
    document.body.innerHTML = `<lit-table id="aaa"> <lit-progress-bar id="export_progress_bar" class="progress"></lit-progress-bar></lit-table>`;
    let progressBar = document.querySelector('#export_progress_bar') as LitProgressBar;
    litTable.exportProgress = progressBar;
    expect(litTable.exportData()).toBeUndefined();
  });

  it('LitTableTest28', () => {
    expect(litTable.formatExportData()).not.toBeUndefined();
  });

  it('LitTableTest29', () => {
    expect(litTable.setSelectedRow(true, [])).toBeUndefined();
  });

  it('LitTableTest30', () => {
    document.body.innerHTML = `<lit-table id="aaa"></lit-table>`;
    let litTable = document.querySelector('#aaa') as LitTable;
    litTable.setAttribute('tree', true);
    expect(litTable.dataSource).toStrictEqual([]);
  });

  it('LitTableTest31', () => {
    document.body.innerHTML = `<lit-table id="aaa"></lit-table>`;
    let litTable = document.querySelector('#aaa') as LitTable;
    litTable.rememberScrollTop = true;
    expect(litTable.recycleDataSource).toStrictEqual([]);
  });

  it('LitTableTest32', () => {
    let litTable = new LitTable();
    expect(litTable.dataExportInit()).toBeUndefined();
  });

  it('LitTableTest33', () => {
    let tableColmn = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn.setAttribute('title', '21');
    tableColmn.setAttribute('data-index', '13');
    tableColmn.setAttribute('key', '4');
    tableColmn.setAttribute('align', 'flex-start');
    tableColmn.setAttribute('height', '32px');
    let tableColmn1 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn1.setAttribute('title', '52');
    tableColmn1.setAttribute('data-index', '244');
    tableColmn1.setAttribute('key', '25');
    tableColmn1.setAttribute('align', 'flex-start');
    tableColmn1.setAttribute('height', '24px');

    let tableColmn2 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn2.setAttribute('title', '53');
    tableColmn2.setAttribute('data-index', '35');
    tableColmn2.setAttribute('key', '35');
    tableColmn2.setAttribute('align', 'flex-start');
    tableColmn2.setAttribute('height', '325px');
    litTable.columns = [tableColmn, tableColmn1, tableColmn2];
    let dataSource = [
      {
        id: 22,
        name: 'name',
      },
      {
        id: 12,
        name: 'nameValue',
      },
    ];
    expect(litTable.formatExportData(dataSource)).toBeTruthy();
  });

  it('LitTableTest34', () => {
    let list = [
      {
        memoryTap: 'All Heap',
        existing: 1481,
        existingString: '44.89 Kb',
        freeByteString: '42.54 Kb',
        allocCount: 461,
        freeCount: 103,
        freeByte: 43451,
        totalBytes: 641,
        totalBytesString: '4.44 Kb',
        maxStr: '275 byte',
        max: 264,
        totalCount: 149,
        existingValue: [1948, 411, 51820],
      },
    ];
    LitTable.createNewTreeTableElement = jest.fn().mockResolvedValue({});
    litTable.treeElement = document.createElement('div');
    litTable.tableElement = document.createElement('div');
    litTable.setAttribute('selectable', '123');
    litTable.setAttribute('tree', '');
    litTable.recycleDataSource = [
      {
        id: 1,
        name: 'name',
      },
      {
        id: 2,
        name: 'nameValue',
      },
    ];
    let tableColmn = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn.setAttribute('title', '6');
    tableColmn.setAttribute('data-index', '22');
    tableColmn.setAttribute('key', '29');
    tableColmn.setAttribute('align', 'flex-start');
    tableColmn.setAttribute('height', '42px');
    let tableColmn1 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn1.setAttribute('title', '125');
    tableColmn1.setAttribute('data-index', '22');
    tableColmn1.setAttribute('key', '12');
    tableColmn1.setAttribute('align', 'flex-start');
    tableColmn1.setAttribute('height', '121px');
    let tableColmn2 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn2.setAttribute('title', '31');
    tableColmn2.setAttribute('data-index', '13');
    tableColmn2.setAttribute('key', '31');
    tableColmn2.setAttribute('align', 'flex-start');
    tableColmn2.setAttribute('height', '12px');
    litTable.columns = [tableColmn, tableColmn1, tableColmn2];
    litTable.tbodyElement = document.createElement('div');
    litTable.theadElement = document.createElement('div');
    expect(litTable.meauseTreeRowElement(list)).toBeTruthy();
  });

  it('LitTableTest35', () => {
    let list = [
      {
        memoryTap: 'All Heap',
        existing: 43482,
        existingString: '6.89 Kb',
        freeByteString: '76.54 Kb',
        allocCount: 462,
        freeCount: 103,
        freeByte: 456,
        totalBytes: 622,
        totalBytesString: '6.44 Kb',
        maxStr: '200 byte',
        max: 222,
        totalCount: 12,
        existingValue: [1348, 6662, 2220],
      },
    ];
    LitTable.createNewTreeTableElement = jest.fn().mockResolvedValue({});
    litTable.treeElement = document.createElement('div');
    litTable.tableElement = document.createElement('div');
    litTable.setAttribute('selectable', '123');
    let tableColmn = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn.setAttribute('title', '103');
    tableColmn.setAttribute('data-index', '13');
    tableColmn.setAttribute('key', '10');
    tableColmn.setAttribute('align', 'flex-start');
    tableColmn.setAttribute('height', '32px');
    let tableColmn1 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn1.setAttribute('align', 'flex-start');
    tableColmn1.setAttribute('height', '32px');
    tableColmn1.setAttribute('title', '2');
    tableColmn1.setAttribute('data-index', '23');
    tableColmn1.setAttribute('key', '20');
    let tableColmn2 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn2.setAttribute('title', '31');
    tableColmn2.setAttribute('key', '30');
    tableColmn2.setAttribute('align', 'flex-start');
    tableColmn2.setAttribute('data-index', '3');
    tableColmn2.setAttribute('height', '32px');
    litTable.columns = [tableColmn, tableColmn1, tableColmn2];
    litTable.theadElement = document.createElement('div');
    litTable.tbodyElement = document.createElement('div');
    expect(litTable.meauseAllRowHeight(list)).toBeTruthy();
  });

  it('LitTableTest36', () => {
    let tableColmn = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn.setAttribute('data-index', '14');
    tableColmn.setAttribute('key', '141');
    tableColmn.setAttribute('align', 'flex-start');
    tableColmn.setAttribute('height', '32px');
    tableColmn.setAttribute('title', '114');
    let tableColmn1 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn1.setAttribute('key', '214');
    tableColmn1.setAttribute('align', 'flex-start');
    tableColmn1.setAttribute('title', '24');
    tableColmn1.setAttribute('data-index', '24');
    tableColmn1.setAttribute('height', '32px');
    let tableColmn2 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn2.setAttribute('title', '34');
    tableColmn2.setAttribute('key', '314');
    tableColmn2.setAttribute('align', 'flex-start');
    tableColmn2.setAttribute('height', '32px');
    tableColmn2.setAttribute('data-index', '34');
    litTable.columns = [tableColmn, tableColmn1, tableColmn2];
    let dataSource = [
      {
        id: 13,
        name: 'name',
      },
      {
        id: 23,
        name: 'nameValue',
      },
    ];
    expect(litTable.formatExportCsvData(dataSource)).toBeTruthy();
  });

  it('LitTableTest37', () => {
    let element = document.createElement('div');
    litTable.tableElement = document.createElement('div');
    let firstElement = document.createElement('div');
    let ch = document.createElement('div');
    element.appendChild(ch);
    let rowObject = { rowHidden: false, data: { isSearch: true } };
    let tableColmn = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn.setAttribute('height', '32px');
    tableColmn.setAttribute('title', '16');
    tableColmn.setAttribute('data-index', '1');
    tableColmn.setAttribute('align', 'flex-start');
    tableColmn.setAttribute('height', '36px');
    tableColmn.setAttribute('key', '1');
    let tableColmn1 = document.createElement('lit-table-column') as LitTableColumn;
    tableColmn1.setAttribute('key', '2');
    tableColmn1.setAttribute('align', 'flex-start');
    tableColmn1.setAttribute('height', '32px');
    tableColmn1.setAttribute('title', '2');
    tableColmn1.setAttribute('data-index', '2');
    litTable.columns = [tableColmn, tableColmn1];
    expect(litTable.freshCurrentLine(element, rowObject, firstElement)).toBeUndefined();
  });
  it('LitTableTest38', () => {
    litTable.hideDownload = true;
    expect(litTable.hideDownload).toBeTruthy();
  });
  it('LitTableTest39', () => {
    litTable.hideDownload = false;
    expect(litTable.hideDownload).not.toBeUndefined();
  });
  it('LitTableTest40', () => {
    expect(litTable.createBtn({ expanded: false, data: { status: true } })).not.toBeUndefined();
  });
  it('LitTableTest41', () => {
    expect(litTable.mouseOut()).toBeUndefined();
  });
  it('LitTableTest42', () => {
    litTable.isRecycleList = true;
    expect(litTable.setCurrentHover({})).toBeUndefined();
  });
  it('LitTableTest43', () => {
    expect(litTable.clearAllHover({})).toBeUndefined();
  });
});
