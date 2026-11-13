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

const htmlStr = (): unknown => {
  let AsciiValues = [104, 116, 116, 112, 58, 47, 47, 119, 119, 119, 46, 119, 51, 46, 111, 114, 103, 47, 84, 82, 47, 82, 69, 67, 45, 104, 116, 109, 108, 52, 48];
  let str = String.fromCharCode.apply(null, AsciiValues);
  const html_start =
    `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns=${str}>`;
  return {
    uri: 'data:application/vnd.ms-excel;base64,',
    template_ExcelWorksheet:
      '<x:ExcelWorksheet><x:Name>{SheetName}</x:Name><x:WorksheetSource HRef="sheet{SheetIndex}.htm"/><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>',
    template_ListWorksheet: '<o:File HRef="sheet{SheetIndex}.htm"/>',
    template_WorkBook:
      `MIME-Version: 1.0
X-Document-Type: Workbook
Content-Type: multipart/related; boundary="----=_NextPart_dummy"

------=_NextPart_dummy
Content-Location: WorkBook.htm
Content-Type: text/html; charset=windows-1252

` +
      html_start +
      `
<head>
<meta name="Excel Workbook Frameset">
<meta http-equiv="Content-Type" charset="UTF-8" content="text/html; charset=windows-1252">
<link rel="File-List" href="filelist.xml">
<!--[if gte mso 9]><xml>
 <x:ExcelWorkbook>
    <x:ExcelWorksheets>{ExcelWorksheets}</x:ExcelWorksheets>
    <x:ActiveSheet>0</x:ActiveSheet>
 </x:ExcelWorkbook>
</xml><![endif]-->
</head>
<frameset>
    <frame src="sheet0.htm" name="frSheet">
    <noframes><body><p>This page uses frames, but your browser does not support them.</p></body></noframes>
</frameset>
</html>
{HTMLWorksheets}
Content-Location: filelist.xml
Content-Type: text/xml; charset="utf-8"

<xml xmlns:o="urn:schemas-microsoft-com:office:office">
    <o:MainFile HRef="../WorkBook.htm"/>
    {ListWorksheets}
    <o:File HRef="filelist.xml"/>
</xml>
------=_NextPart_dummy--
`,
  };
};

export class ExcelFormater {
  static tmplCellXML = '<Cell{attributeStyleID}{attributeFormula}><Data ss:Type="{nameType}">{data}</Data></Cell>';
  static base64 = function (s: unknown): string {
    //@ts-ignore
    return window.btoa(unescape(encodeURIComponent(s)));
  };

  static format(s: unknown, c: unknown): string {
    //@ts-ignore
    return s.replace(/{(\w+)}/g, function (m: unknown, p: unknown) {
      //@ts-ignore
      return c[p];
    });
  }

  static createExcelRow(columns: unknown[], data: unknown): string {
    let rowsXML = '';
    rowsXML += '<Row>';
    for (let k = 0; k < columns.length; k++) {
      //@ts-ignore
      let dataIndex = columns[k].getAttribute('data-index'); //@ts-ignore
      let columnName = columns[k].getAttribute('title');
      if (columnName === '') {
        columnName = dataIndex;
      }
      let ctx = {
        attributeStyleID: '',
        nameType: 'String', //@ts-ignore
        data: data ? data[dataIndex] || '' : columnName,
        attributeFormula: '',
      };
      rowsXML += this.format(this.tmplCellXML, ctx);
    }
    rowsXML += '</Row>'; //@ts-ignore
    if (data && data.children !== undefined && data.children.length > 0) {
      //@ts-ignore
      data.children.forEach((child: unknown) => {
        rowsXML += this.createExcelRow(columns, child);
      });
    }
    return rowsXML;
  }

  static addImage(baseStr: string): string {
    return `<Row>${this.format(this.tmplCellXML, {
      attributeStyleID: '',
      nameType: 'String',
      data: `<div><img src="${baseStr}"></img></div>`,
      attributeFormula: '',
    })}</Row>`;
  }

  static testExport(
    dataSource: { columns: unknown[]; tables: unknown[]; sheetName: string }[],
    fileName: string
  ): void {
    this.tablesToHtmlExcelMultipleSheet(dataSource, fileName);
  }

  static tablesToHtmlExcelMultipleSheet(
    dataSource: { columns: unknown[]; tables: unknown[]; sheetName: string }[],
    fileName: string,
    image?: string
  ): void {
    let sheets: unknown[] = [];
    dataSource.forEach((data): void => {
      sheets.push(this.createTableData(data.columns, data.tables, image));
    });
    this.tablesToExcelTestSheet(sheets, fileName, dataSource);
  }

  static createTableData(columns: unknown[], dataSource: unknown[], image?: string): string {
    let tableData = '';
    let columnDatas = columns.map((column) => {
      //@ts-ignore
      let dataIndex = column.getAttribute('data-index'); //@ts-ignore
      let columnName = column.getAttribute('title');
      if (columnName === '') {
        columnName = dataIndex;
      }
      return {
        columnName: columnName,
        dataIndex: dataIndex,
      };
    });
    tableData += this.createTHead(
      columnDatas.map((item) => {
        return item.columnName;
      })
    );
    let columnDataIndexes = columnDatas.map((item) => item.dataIndex);
    dataSource.forEach((data, index) => {
      if (index === 0 && image) {
        tableData += this.createTableRow(columnDataIndexes, data, image);
      } else {
        tableData += this.createTableRow(columnDataIndexes, data);
      }
    });
    return tableData;
  }

  static createTHead(columns: unknown[]): string {
    let header = '<thead>';
    columns.forEach((column) => {
      header += `<td>${column}</td>`;
    });
    header += '</thrad>';
    return header;
  }

  static createTableRow(columns: unknown[], data: unknown, image?: unknown): string {
    let childrenData = ''; //@ts-ignore
    if (data.children !== undefined) {
      //@ts-ignore
      data.children.forEach((child: unknown) => {
        if (child) {
          childrenData += this.createTableRow(columns, child);
        }
      });
    }
    return `<tr>${columns
      .map((column) => {
        //@ts-ignore
        return `<td>${(data[column] + '').replace('μ', 'u')}</td>` || '';
      })
      .join('')}${image ? `<td><div><img src="${image}"></img></div></td>` : ''}</tr>${childrenData}`;
  }

  static tablesToExcelTestSheet(
    tables: unknown[],
    filename: string,
    dataSource: { columns: unknown[]; tables: unknown[]; sheetName: string }[]
  ): void {
    let AsciiValues = [104, 116, 116, 112, 58, 47, 47, 119, 119, 119, 46, 119, 51, 46, 111, 114, 103, 47, 84, 82, 47, 82, 69,
      67, 45, 104, 116, 109, 108, 52, 48];
    let str = String.fromCharCode.apply(null, AsciiValues);
    const html_start =
      `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns=${str}>`; //@ts-ignore
    let { uri, template_ExcelWorksheet, template_ListWorksheet, template_WorkBook } = htmlStr();
    let template_HTMLWorksheet =
      `
------=_NextPart_dummy
Content-Location: sheet{SheetIndex}.htm
Content-Type: text/html; charset=windows-1252

` +
      html_start +
      `
<head>
    <meta http-equiv="Content-Type" charset="UTF-8" content="text/html; charset=windows-1252">
    <link id="Main-File" rel="Main-File" href="../WorkBook.htm">
    <link rel="File-List" href="filelist.xml">
</head>
<body><table>{SheetContent}</table></body>
</html>`;
    let context_WorkBook = {
      ExcelWorksheets: '',
      HTMLWorksheets: '',
      ListWorksheets: '',
    };
    tables.forEach((item, sheetIndex) => {
      context_WorkBook.ExcelWorksheets += this.format(template_ExcelWorksheet, {
        SheetIndex: sheetIndex,
        SheetName: dataSource[sheetIndex].sheetName,
      });
      context_WorkBook.HTMLWorksheets += this.format(template_HTMLWorksheet, {
        SheetIndex: sheetIndex,
        SheetContent: item,
      });
      context_WorkBook.ListWorksheets += this.format(template_ListWorksheet, {
        SheetIndex: sheetIndex,
      });
    });
    let link = document.createElement('a');
    link.href = uri + this.base64(this.format(template_WorkBook, context_WorkBook));
    link.download = filename + '.xls';
    link.target = '_blank';
    link.click();
  }
}
