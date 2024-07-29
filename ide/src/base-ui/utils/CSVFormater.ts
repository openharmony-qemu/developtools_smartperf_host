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

export class JSONToCSV {
  static setCsvData(obj: unknown): void {
    // @ts-ignore
    let data = obj.data;
    // @ts-ignore
    let isShowLabel = typeof obj.showLabel === 'undefined' ? true : obj.showLabel;
    // @ts-ignore
    let fileName = (obj.fileName || 'UserExport') + '.csv';
    // @ts-ignore
    let columns = obj.columns || {
      title: [],
      key: [],
      formatter: undefined,
    };
    let showLabel = typeof isShowLabel === 'undefined' ? true : isShowLabel;
    let row = '';
    let csv = '';
    let key: string;
    // 如果要现实表头文字
    if (showLabel) {
      // 如果有传入自定义的表头文字
      if (columns.title.length) {
        columns.title.map(function (n: unknown) {
          row += n + ',';
        });
      } else {
        // 如果没有，就直接取数据第一条的对象的属性
        for (key in data[0]) {
          row += key + ',';
        }
      }
      row = row.slice(0, -1);
      csv += row + '\r\n';
    }
    // 具体的数据处理
    data.map((n: unknown) => {
      row = '';
      // 如果存在自定义key值
      if (columns.key.length) {
        row = this.getCsvStr(columns, obj, n, row);
      } else {
        // @ts-ignore
        for (key in n) {
          row +=
            // @ts-ignore
            '"' + (typeof columns.formatter === 'function' ? columns.formatter(key, n[key]) || n[key] : n[key]) + '",';
        }
      }
      row.slice(0, row.length - 1); // 删除最后一个,
      csv += row + '\r\n'; // 添加换行符号
    });
    if (!csv) {
      return;
    }
    this.saveCsvFile(fileName, csv);
  }

  static getCsvStr(columns: unknown, obj: unknown, n: unknown, row: string): string {
    // @ts-ignore
    columns.key.map((m: unknown, idx: number) => {
      let strItem: unknown = '';
      // @ts-ignore
      if (obj.exportFormatter && obj.exportFormatter.has(m)) {
        // @ts-ignore
        strItem = obj.exportFormatter.get(m)?.(n) || n[m];
        // @ts-ignore
      } else if (obj.formatter && obj.formatter.has(m)) {
        // @ts-ignore
        strItem = obj.formatter.get(m)?.(n[m]) || n[m];
      } else {
        // @ts-ignore
        strItem = n[m];
      }
      if (typeof strItem === 'undefined') {
        strItem = '';
      } else if (typeof strItem === 'object') {
        strItem = JSON.stringify(strItem);
        // @ts-ignore
        strItem = strItem.replaceAll('"', '');
      }
      // @ts-ignore
      if (idx === 0 && typeof n.depthCSV !== 'undefined') {
        row +=
          '"' +
          // @ts-ignore
          this.treeDepth(n.depthCSV) +
          // @ts-ignore
          (typeof columns.formatter === 'function' ? columns.formatter(m, n[m]) || n[m] : strItem) +
          '",';
      } else {
        // @ts-ignore
        row += '"' + (typeof columns.formatter === 'function' ? columns.formatter(m, n[m]) || n[m] : strItem) + '",';
      }
    });
    return row;
  }

  static saveCsvFile(fileName: unknown, csvData: unknown): void {
    let alink: unknown = document.createElement('a');
    // @ts-ignore
    alink.id = 'csvDownloadLink';
    // @ts-ignore
    alink.href = this.getDownloadUrl(csvData);
    // @ts-ignore
    document.body.appendChild(alink);
    let linkDom: unknown = document.getElementById('csvDownloadLink');
    // @ts-ignore
    linkDom.setAttribute('download', fileName);
    // @ts-ignore
    linkDom.click();
    // @ts-ignore
    document.body.removeChild(linkDom);
    // @ts-ignore

  }

  static getDownloadUrl(csvData: unknown): string | undefined {
    let result;
    // @ts-ignore
    if (window.Blob && window.URL && (window.URL as unknown).createObjectURL) {
      result = URL.createObjectURL(
        new Blob(['\uFEFF' + csvData], {
          type: 'text/csv',
        })
      );
    }
    return result;
  }

  static treeDepth(depth: number): string {
    let str = '';
    for (let i = 0; i < depth; i++) {
      str += '    ';
    }
    return str;
  }

  static treeToArr(data: unknown): unknown[] {
    const result: Array<unknown> = [];
    // @ts-ignore
    data.forEach((item: unknown) => {
      let depthCSV = 0;
      const loop = (data: unknown, depth: unknown): void => {
        // @ts-ignore
        result.push({ depthCSV: depth, ...data });
        // @ts-ignore
        let child = data.children;
        if (child) {
          for (let i = 0; i < child.length; i++) {
            // @ts-ignore
            loop(child[i], depth + 1);
          }
        }
      };
      loop(item, depthCSV);
    });
    return result;
  }

  static columnsData(columns: Array<unknown>): {
    titleList: unknown[];
    ketList: unknown[];
  } {
    let titleList: Array<unknown> = [];
    let ketList: Array<unknown> = [];
    columns.forEach((column) => {
      // @ts-ignore
      let dataIndex = column.getAttribute('data-index');
      // @ts-ignore
      let columnName = column.getAttribute('title');
      if (columnName === '') {
        columnName = dataIndex === 'busyTimeStr' ? 'GetBusyTime(ms)' : dataIndex;
      }
      if (columnName !== '  ') {
        titleList.push(columnName);
        ketList.push(dataIndex);
      }
    });
    return {
      titleList: titleList,
      ketList: ketList,
    };
  }

  static async csvExport(dataSource: {
    columns: unknown[];
    tables: unknown[];
    fileName: string;
    columnFormatter: Map<string, (value: unknown) => string>;
    exportFormatter: Map<string, (value: unknown) => string>;
  }): Promise<string> {
    return new Promise((resolve) => {
      let data: unknown = this.columnsData(dataSource.columns);
      let columns = {
        // @ts-ignore
        title: data.titleList,
        // @ts-ignore
        key: data.ketList,
      };
      if (dataSource.tables.length > 0) {
        if (Array.isArray(dataSource.tables[0])) {
          dataSource.tables.forEach((childArr, childIndex) => {
            let resultArr = JSONToCSV.treeToArr(childArr);
            JSONToCSV.setCsvData({
              data: resultArr,
              fileName: `${dataSource.fileName}_${childIndex}`,
              columns: columns,
              formatter: dataSource.columnFormatter,
            });
          });
        } else {
          let resultArr = JSONToCSV.treeToArr(dataSource.tables);
          JSONToCSV.setCsvData({
            data: resultArr,
            fileName: dataSource.fileName,
            columns: columns,
            formatter: dataSource.columnFormatter,
            exportFormatter: dataSource.exportFormatter,
          });
        }
      }
      resolve('ok');
    });
  }
}
