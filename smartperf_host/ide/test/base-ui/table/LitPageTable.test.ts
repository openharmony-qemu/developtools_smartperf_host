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

import { LitPageTable } from '../../../src/base-ui/table/LitPageTable';
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
  let litTable = new LitPageTable();
  litTable.selectable = true;
  litTable.selectable = false;
  litTable.scrollY = 'scrollY';

  litTable.recycleDataSource = [];

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

  it('LitTablePageTest01', () => {
    expect(litTable.adoptedCallback()).toBeUndefined();
  });

  it('LitTablePageTest02', () => {
    expect(litTable.disconnectedCallback()).toBeUndefined();
  });

  it('LitTablePageTest03', () => {
    expect(litTable.attributeChangedCallback('name', 'a', 'b')).toBeUndefined();
  });

  it('LitTablePageTest04', () => {
    litTable.hideDownload = true;
    expect(litTable.hideDownload).toBeTruthy();
  });

  it('LitTablePageTest05', () => {
    expect(litTable.hideDownload).not.toBeUndefined();
  });

  it('LitTablePageTest06', () => {
    litTable.hideDownload = false;
    expect(litTable.hideDownload).toBeFalsy();
  });

  it('LitTablePageTest07', () => {
    expect(litTable.selectable).not.toBeUndefined();
  });

  it('LitTablePageTest08', () => {
    litTable.selectable = true;
    expect(litTable.selectable).toBeTruthy();
  });

  it('LitTablePageTest09', () => {
    expect(litTable.scrollY).not.toBeUndefined();
  });

  it('LitTablePageTest10', () => {
    litTable.scrollY = '';
    expect(litTable.scrollY).not.toBeUndefined();
  });

  it('LitTablePageTest11', () => {
    expect(litTable.recycleDataSource).not.toBeUndefined();
  });

  it('LitTablePageTest12', () => {
    expect(litTable.measureReset()).toBeUndefined();
  });

  it('LitTablePageTest13', () => {
    litTable.pagination = true;
    expect(litTable.pagination).toBeTruthy();
  });

  it('LitTablePageTest14', () => {
    litTable.setAttribute('pagination', '');
    litTable.pagination = false;
    expect(litTable.pagination).toBeFalsy();
  });

  it('LitTablePageTest15', () => {
    expect(litTable.initElements()).toBeUndefined();
  });

  it('LitTablePageTest16', () => {
    expect(litTable.initPageEventListener()).toBeUndefined();
  });

  it('LitTablePageTest17', () => {
    litTable.rememberScrollTop = true;
    expect(litTable.toTop()).toBeUndefined();
  });

  it('LitTablePageTest18', () => {
    litTable.rememberScrollTop = true;
    litTable.toTop();
    expect(litTable.tableElement!.scrollTop).toEqual(0);
    expect(litTable.tableElement!.scrollLeft).toEqual(0);
  });

  it('LitTablePageTest19', () => {
    litTable.rememberScrollTop = false;
    litTable.toTop();
    expect(litTable.tableElement!.scrollTop).toEqual(0);
    expect(litTable.tableElement!.scrollLeft).toEqual(0);
  });

  it('LitTablePageTest20', () => {
    expect(typeof litTable.initHtml()).toEqual('string');
  });

  it('LitTablePageTest21', () => {
    expect(litTable.connectedCallback()).toBeUndefined();
  });

  it('LitTablePageTest22', () => {
    const rowData = {
      data: [
        {
          isSelected: undefined,
        },
      ],
    };
    expect(litTable.meauseElementHeight(rowData)).toBe(27);
  });

  it('LitTablePageTest23', () => {
    const rowData = {
      data: [
        {
          isSelected: undefined,
        },
      ],
    };
    expect(litTable.meauseTreeElementHeight(rowData, 1)).toBe(27);
  });

  it('LitTablePageTest24', () => {
    document.body.innerHTML = "<lit-table id='tab' tree></lit-table>";
    let table = document.querySelector('#tab') as LitPageTable;
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
      expect(table.meauseTreeElementHeight('1', 2)).toBe(27);
    }, 20);
  });

  it('LitTablePageTest25', () => {
    expect(litTable.createExpandBtn({ expanded: false, data: { status: true } })).not.toBeUndefined();
  });

  it('LitTablePageTest26', () => {
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

  it('LitTablePageTest27', () => {
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

  it('LitTablePageTest28', () => {
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

  it('LitTablePageTest29', () => {
    litTable.recycleDs.length = 1;
    litTable.setCurrentSelection = jest.fn(() => true);
    expect(litTable.scrollToData(litTable.recycleDataSource)).toBeUndefined();
  });

  it('LitTablePageTest30', () => {
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

  it('LitTablePageTest31', () => {
    expect(litTable.clearAllSelection()).toBeUndefined();
  });

  it('LitTablePageTest32', () => {
    expect(litTable.dispatchRowClickEvent({ data: { isSelected: '' } }, [], { button: '' })).toBeUndefined();
  });

  it('LitTablePageTest33', () => {
    litTable.treeElement = jest.fn(() => undefined);
    litTable.treeElement.children = jest.fn(() => [1]);
    litTable.columns.forEach = jest.fn(() => true);
    litTable.treeElement.lastChild = jest.fn(() => true);
    litTable.treeElement.lastChild.style = jest.fn(() => true);
    expect(litTable.createNewTreeTableElement({ data: '' })).not.toBeUndefined();
  });

  it('LitTablePageTest34', () => {
    let tableIcon = document.createElement('lit-icon') as LitIcon;
    let mouseClickEvent: MouseEvent = new MouseEvent('click', <MouseEventInit>{ movementX: 1, movementY: 2 });
    tableIcon.dispatchEvent(mouseClickEvent);
  });

  it('LitTablePageTest35', () => {
    document.body.innerHTML = `<lit-table id="aaa"></lit-table>`;
    let litTable = document.querySelector('#aaa') as LitTable;
    litTable.formatName = true;
    expect(litTable.formatName).toBeTruthy();
  });

  it('LitTablePageTest36', () => {
    expect(litTable.formatExportData(litTable.recycleDataSource)).not.toBeUndefined();
  });

  it('LitTablePageTest37', () => {
    expect(litTable.setSelectedRow(true, [])).toBeUndefined();
  });

  it('LitTablePageTest38', () => {
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

  it('LitTablePageTest39', () => {
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
  it('LitTablePageTest40', () => {
    litTable.hideDownload = true;
    expect(litTable.hideDownload).toBeTruthy();
  });
  it('LitTablePageTest41', () => {
    litTable.hideDownload = false;
    expect(litTable.hideDownload).not.toBeUndefined();
  });
  it('LitTablePageTest42', () => {
    expect(litTable.createBtn({ expanded: false, data: { status: true } })).not.toBeUndefined();
  });
  it('LitTablePageTest43', () => {
    expect(litTable.mouseOut()).toBeUndefined();
  });
  it('LitTablePageTest44', () => {
    expect(litTable.setCurrentHover({})).toBeUndefined();
  });
  it('LitTablePageTest45', () => {
    expect(litTable.clearAllHover({})).toBeUndefined();
  });
});
