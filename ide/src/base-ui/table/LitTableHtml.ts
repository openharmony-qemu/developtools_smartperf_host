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

import { JSONToCSV } from '../utils/CSVFormater';

export const iconWidth = 20;
export const iconPadding = 5;

export const litPageTableHtml = `
        <style>
        :host{
            display: grid;
            grid-template-columns: repeat(1,1fr);
            width: 100%;
            position: relative;
            font-weight: 500;
            flex:1;
        }
        .tr{
            display: grid;
            grid-column-gap: 5px;
            min-width:100%;
        }
        .tr:nth-of-type(even){
        }
        .tr{
            background-color: var(--dark-background,#FFFFFF);
            line-height: 27px;
        }
        .tr:hover{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .tr[selected]{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .tr[high-light]{
            font-weight: 600;
        }
        .td{
            box-sizing: border-box;
            padding: 3px;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
            height: auto;
            line-height: 21px;
            cursor: pointer;
        }
        .td label{
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: normal;
        }
        .td text{
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap;
        }
        .td-order{
        }
        .td-order:before{

        }
        :host([grid-line]) .td{
            border-left: 1px solid #f0f0f0;
        }
        :host([grid-line]) .td:last-of-type{
            border-right: 1px solid #f0f0f0;
        }
        .table{
            width: 100%;
             color: var(--dark-color2,#262626);
        }
        .thead{
            display: grid;
            position: sticky;
            top: 0;
            font-weight: bold;
            font-size: .9rem;
            color: var(--dark-color1,#000);
            background-color: var(--dark-background,#FFFFFF);
            z-index: 1;
        }
        .tbody{
            width: 100%;
            top: 0;
            left: 0;
            right:0;
            bottom:0;
            padding-bottom: 30px;
            display: flex;
            flex-direction: row
            row-gap: 1px;
            column-gap: 1px;
        }
        .tbottom{
            height: 30px;
            width: calc(100% - 15px);
            position: absolute;
            bottom: 0;
            z-index: 1;
            justify-content: center;
            align-items: center;
            display: none;
            flex-direction: row;
            color: var(--dark-color1,#000);
            background-color: var(--dark-background,#FFFFFF);
        }
        :host([pagination]) .tbottom{
            display: flex;
        }
        .tree{
            overflow-x:hidden;
            overflow-y:hidden;
            display: grid;
            grid-template-columns: 1fr;
            row-gap: 1px;
            column-gap: 1px;
            position:relative;
        }
        .tree:hover{
            overflow-x: overlay;
        }
        .tree-first-body{
            min-width: 100%;
            box-sizing: border-box;
            display:flex;
            align-items:center;
            white-space: nowrap;
            font-weight: 500;
            cursor: pointer;
        }
        .tree-first-body[high-light]{
            font-weight: 600;
        }
        .tree-first-body:hover{
            background-color: var(--dark-background6,#DEEDFF); /*antd #fafafa 42b983*/
        }
        .body{
            display: grid;
            grid-template-columns: 1fr;
            row-gap: 1px;
            column-gap: 1px;
            flex:1;
            position: relative;
        }
        :host([grid-line])  .tbody{
            border-bottom: 1px solid #f0f0f0;
            background-color: #f0f0f0;
        }
        .th{
            grid-column-gap: 5px;
            display: grid;
            background-color: var(--dark-background,#FFFFFF);
        }

        .tree-icon{
            font-size: 1.2rem;
            width: 20px;
            height: 20px;
            padding-right: 5px;
            padding-left: 5px;
            cursor: pointer;
        }
        .tree-icon:hover{
            color: #42b983;
        }
        .row-checkbox,row-checkbox-all{

        }
        :host([no-head]) .thead{
            display: none;
        }
        .up-svg{
            position: absolute;
            right: 5px;
            top: 8px;
            bottom: 8px;
            width: 15px;
            height: 15px;
        }
        .down-svg{
            position: absolute;
            top: 8px;
            right: 5px;
            bottom: 8px;
            width: 15px;
            height: 15px;
        }
        .mouse-select{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .mouse-in{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .export{
            height:32px;
            width: 32px;
            cursor:pointer;
            display:none;
            align-items:center;
            justify-content:center;
            border-radius:5px;
            box-sizing: border-box;
            background-color: #000000;
            opacity: 0.3;
            position:absolute;
            right:20px;
            bottom:20px;
            z-index: 999999;
        }
        .resize{
            width: 2px;
            margin-right: 3px;
            height: 20px;
            background-color: #e0e0e0;
            cursor: col-resize;
        }
       
        .progress{
            position: absolute;
            height: 1px;
            top: 0;
            left: 0;
            right: 0;
            z-index: 999999;
        } 
        :host([hideDownload]) .export{
            display: none;
        }
        .td::-webkit-scrollbar {
          width: 0;
          background-color: transparent;
        }
        </style>
        <lit-progress-bar id="export_progress_bar" class="progress"></lit-progress-bar>
        <slot id="slot" style="display: none"></slot>
        <slot name="head"></slot>
        <div class="export">
            <lit-icon size="18" style="color: #ffffff" name="copyhovered" ></lit-icon>
        </div>
        <div class="table" style="overflow-x:auto;">
            <div class="thead"></div>
            <div class="tbody">
                <div class="tree"></div>
                <div class="body"></div>
            </div>
            <div class="tbottom">
                <div id="previousPage" style="cursor: pointer">上一页</div>
                <div id="currentPage" style="margin-left: 10px;margin-right: 10px">1</div>
                <input id="targetPage" style="width: 60px;margin-right: 10px" min="1" type="number"/>
                <div id="jumpPage" style="padding: 2px 10px;border: 1px solid #676767;margin-right: 10px;font-size: 13px;cursor: pointer">GO</div>
                <div id="nextPage" style="cursor: pointer">下一页</div>
            </div>
        </div>
        `;

export const litTableHtml = `
        <style>
        :host{
            display: grid;
            grid-template-columns: repeat(1,1fr);
            width: 100%;
            position: relative;
            font-weight: 500;
            flex:1;
        }
        .tr{
            display: grid;
            grid-column-gap: 5px;
            min-width:100%;
        }
        .tr:nth-of-type(even){
        }
        .tr{
            background-color: var(--dark-background,#FFFFFF);
        }
        .tr:hover{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .tr[selected]{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .tr[high-light]{
            font-weight: 600;
        }
        .td{
            box-sizing: border-box;
            padding: 3px;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
            height: auto;
            line-height: 21px;
            cursor: pointer;
        }
        .td label{
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: normal;
        }
        .td text{
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap;
        }
        .td-order{
        }
        .td-order:before{

        }
        :host([grid-line]) .td{
            border-left: 1px solid #f0f0f0;
        }
        :host([grid-line]) .td:last-of-type{
            border-right: 1px solid #f0f0f0;
        }
        .table{
            width: 100%;
             color: var(--dark-color2,#262626);
        }
        .thead{
            display: grid;
            position: sticky;
            top: 0;
            font-weight: bold;
            font-size: .9rem;
            color: var(--dark-color1,#000);
            background-color: var(--dark-background,#FFFFFF);
            z-index: 1;
        }
        .tbody{
            width: 100%;
            top: 0;
            left: 0;
            right:0;
            bottom:0;
            display: flex;
            flex-direction: row
            row-gap: 1px;
            column-gap: 1px;
        }
        .tree{
            overflow-x:hidden;
            overflow-y:hidden;
            display: grid;
            grid-template-columns: 1fr;
            row-gap: 1px;
            column-gap: 1px;
            position:relative;
        }
        .tree:hover{
            overflow-x: overlay;
        }
        .tree-first-body{
            min-width: 100%;
            box-sizing: border-box;
            display:flex;
            align-items:center;
            white-space: nowrap;
            font-weight: 500;
            cursor: pointer;
        }
        .tree-first-body[high-light]{
            font-weight: 600;
        }
        .tree-first-body:hover{
            background-color: var(--dark-background6,#DEEDFF); /*antd #fafafa 42b983*/
        }
        .body{
            display: grid;
            grid-template-columns: 1fr;
            row-gap: 1px;
            column-gap: 1px;
            flex:1;
            position: relative;
        }
        :host([grid-line])  .tbody{
            border-bottom: 1px solid #f0f0f0;
            background-color: #f0f0f0;
        }
        .th{
            grid-column-gap: 5px;
            display: grid;
            background-color: var(--dark-background,#FFFFFF);
        }
        :host([data-query-scene]) .th {
          background-color: #F6F6F6;
          color: #7E7E7E;
        }
        :host([data-query-scene]) .tr {
          background-color: #F6F6F6;
        }
        .tree-icon{
            font-size: 1.2rem;
            width: 20px;
            height: 20px;
            padding-right: 5px;
            padding-left: 5px;
            cursor: pointer;
        }
        .tree-icon:hover{
            color: #42b983;
        }
        .row-checkbox,row-checkbox-all{

        }
        :host([no-head]) .thead{
            display: none;
        }
        .up-svg{
            position: absolute;
            right: 5px;
            top: 8px;
            bottom: 8px;
            width: 15px;
            height: 15px;
        }
        .down-svg{
            position: absolute;
            top: 8px;
            right: 5px;
            bottom: 8px;
            width: 15px;
            height: 15px;
        }
        .button-icon{
          height: 32px;
          width: 164px;
          color: black;
          font-size: 14px;
          border: 1px solid black;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: var(--dark-background3,#FFFFFF);
          border-radius: 20px;
          padding: 15px;
          transition: opacity 0.2s;
          outline: none;
          position: relative;
          overflow: hidden;
        }
        .button-icon:active {
          background: var(--dark-background1,#f5f5f5)
        }
        .mouse-select{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .mouse-in{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .export{
            height:32px;
            width: 32px;
            cursor:pointer;
            display:none;
            align-items:center;
            justify-content:center;
            border-radius:5px;
            box-sizing: border-box;
            background-color: #000000;
            opacity: 0.3;
            position:absolute;
            right:20px;
            bottom:20px;
            z-index: 999999;
        }
        .resize{
            width: 2px;
            margin-right: 3px;
            height: 20px;
            background-color: #e0e0e0;
            cursor: col-resize;
        }
        .progress{
            position: absolute;
            height: 1px;
            top: 0;
            left: 0;
            right: 0;
            z-index: 999999;
        } 
        :host([hideDownload]) .export{
            display: none;
        }
        </style>
        <lit-progress-bar id="export_progress_bar" class="progress"></lit-progress-bar>
        <slot id="slot" style="display: none"></slot>
        <slot name="head"></slot>
        <div class="export">
            <lit-icon size="18" style="color: #ffffff" name="copyhovered" ></lit-icon>
        </div>
        <div class="table" style="overflow-x:auto;">
            <div class="thead"></div>
            <div class="tbody">
                <div class="tree"></div>
                <div class="body"></div>
            </div>
        </div>
        `;

export function createDownUpSvg(index: number, head: unknown): { upSvg: SVGSVGElement; downSvg: SVGSVGElement } {
  let NS = 'http://www.w3.org/2000/svg';
  let upSvg: SVGSVGElement = document.createElementNS(NS, 'svg') as SVGSVGElement;
  let upPath: Element = document.createElementNS(NS, 'path');
  upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
  upSvg.setAttribute('viewBox', '0 0 1024 1024');
  upSvg.setAttribute('stroke', 'let(--dark-color1,#212121)');
  upSvg.classList.add('up-svg');
  upPath.setAttribute(
    'd',
    'M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z'
  );
  upSvg.appendChild(upPath);
  let downSvg: SVGSVGElement = document.createElementNS(NS, 'svg') as SVGSVGElement;
  let downPath: Element = document.createElementNS(NS, 'path');
  downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
  downSvg.setAttribute('viewBox', '0 0 1024 1024');
  downSvg.setAttribute('stroke', 'let(--dark-color1,#212121)');
  downSvg.classList.add('down-svg');
  downPath.setAttribute(
    'd',
    'M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z'
  );
  downSvg.appendChild(downPath);
  if (index === 0) {
    //@ts-ignore
    head.sortType = 0; // 默认以第一列 降序排序 作为默认排序
    upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
    downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
  }
  upSvg.style.display = 'none';
  downSvg.style.display = 'none'; //@ts-ignore
  head.appendChild(upSvg); //@ts-ignore
  head.appendChild(downSvg);
  return { upSvg, downSvg };
}

export function exportData(that: unknown): void {
  //@ts-ignore
  if (that.exportLoading || that.ds.length === 0) {
    return;
  } //@ts-ignore
  that.exportLoading = true; //@ts-ignore
  that.exportProgress!.loading = true;
  let date = new Date();
  JSONToCSV.csvExport({
    //@ts-ignore
    columns: that.columns as unknown[], //@ts-ignore
    tables: that.ds,
    fileName: `${date.getTime()}`, //@ts-ignore
    columnFormatter: that.itemTextHandleMap, //@ts-ignore
    exportFormatter: that.exportTextHandleMap,
  }).then((res) => {
    //@ts-ignore
    that.exportLoading = false; //@ts-ignore
    that.exportProgress!.loading = false;
  });
}

export function formatExportData(dataSource: unknown[], that: unknown): unknown[] {
  if (dataSource === undefined || dataSource.length === 0) {
    return [];
  } //@ts-ignore
  if (that.columns === undefined) {
    return [];
  }
  return dataSource.map((item) => {
    let formatData: unknown = {}; //@ts-ignore
    that.columns!.forEach((column: unknown) => {
      //@ts-ignore
      let dataIndex = column.getAttribute('data-index'); //@ts-ignore
      let columnName = column.getAttribute('title');
      if (columnName === '') {
        columnName = dataIndex;
      } //@ts-ignore
      if (dataIndex && columnName && item[dataIndex] !== undefined) {
        //@ts-ignore
        formatData[columnName] = item[dataIndex];
      }
    }); //@ts-ignore
    if (item.children !== undefined) {
      //@ts-ignore
      formatData.children = formatExportData(item.children, that);
    }
    return formatData;
  });
}

export function recursionExportTableData(columns: unknown[], dataSource: unknown[]): string {
  let concatStr = '\r\n';
  dataSource.forEach((item, index) => {
    concatStr += columns
      .map((column) => {
        //@ts-ignore
        let dataIndex = column.getAttribute('data-index'); //@ts-ignore
        return `"${item[dataIndex] || ''}"    `;
      })
      .join(','); //@ts-ignore
    if (item.children !== undefined) {
      //@ts-ignore
      concatStr += recursionExportTableData(columns, item.children);
    }
    if (index !== dataSource.length - 1) {
      concatStr += '\r\n';
    }
  });
  return concatStr;
}

export function addCopyEventListener(that: unknown): void {
  //@ts-ignore
  that.tableElement?.addEventListener('copy', (e: unknown) => {
    // @ts-ignore
    let clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) {
      return;
    }
    // @ts-ignore
    let text = window.getSelection().toString();
    if (text) {
      //@ts-ignore
      e.preventDefault(); //@ts-ignore
      let length = that.tableColumns?.length || 1;
      let strings = text.split('\n');
      let formatStr = '';
      for (let i = 0; i < strings.length; i++) {
        if (i % length !== 0) {
          formatStr += '    ';
        }
        formatStr += strings[i];
        if (i !== 0 && i % length === length - 1) {
          formatStr += '\n';
        }
      }
      clipboardData.setData('text/plain', formatStr);
    }
  });
}

export function addSelectAllBox(rowElement: HTMLDivElement, that: unknown): void {
  //@ts-ignore
  if (that.selectable) {
    let box = document.createElement('div');
    box.style.display = 'flex';
    box.style.justifyContent = 'center';
    box.style.alignItems = 'center';
    box.style.gridArea = '_checkbox_';
    box.classList.add('td');
    box.style.backgroundColor = '#ffffff66';
    let checkbox = document.createElement('lit-checkbox');
    checkbox.classList.add('row-checkbox-all');
    checkbox.onchange = (e: unknown): void => {
      //@ts-ignore
      that.shadowRoot!.querySelectorAll('.row-checkbox').forEach((a: unknown) => (a.checked = e.detail.checked)); //@ts-ignore
      if (e.detail.checked) {
        //@ts-ignore
        that.shadowRoot!.querySelectorAll('.tr').forEach((a: unknown) => a.setAttribute('checked', ''));
      } else {
        //@ts-ignore
        that.shadowRoot!.querySelectorAll('.tr').forEach((a: unknown) => a.removeAttribute('checked'));
      }
    };
    box.appendChild(checkbox);
    rowElement.appendChild(box);
  }
}

export function fixed(td: HTMLElement, placement: string, bgColor: string): void {
  td.style.position = 'sticky';
  if (placement === 'left') {
    td.style.left = '0px';
    td.style.boxShadow = '3px 0px 5px #33333333';
  } else if (placement === 'right') {
    td.style.right = '0px';
    td.style.boxShadow = '-3px 0px 5px #33333333';
  }
}

export function formatName(key: string, name: unknown, that: unknown): unknown {
  let content = name; //@ts-ignore
  if (that.itemTextHandleMap.has(key)) {
    //@ts-ignore
    content = that.itemTextHandleMap.get(key)?.(name) || '';
  }
  if (content !== undefined && content !== null) {
    return content.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  return '';
}
