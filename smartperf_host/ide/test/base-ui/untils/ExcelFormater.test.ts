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

import { ExcelFormater } from '../../../src/base-ui/utils/ExcelFormater';

describe('ExcelFormater', () => {
  it('ExcelFormaterTest01', function () {
    const s = 'Hello, {name}!';
    const c = { name: 'Alice' };
    const result = ExcelFormater.format(s, c);
    expect(result).toBe('Hello, Alice!');
  });
  it('ExcelFormaterTest02 ', function () {
    const columns = [
      { getAttribute: (attr: string) => (attr === 'data-index' ? 'name' : 'Name') },
      { getAttribute: (attr: string) => (attr === 'data-index' ? 'age' : 'Age') },
    ];
    const data = { name: 'Alice', age: 30 };
    const result = ExcelFormater.createExcelRow(columns, data);
    expect(result).toContain('<Row>');
    expect(result).toContain('<Cell><Data ss:Type="String">Alice</Data></Cell>');
    expect(result).toContain('<Cell><Data ss:Type="String">30</Data></Cell>');
  });
  it('ExcelFormaterTest03 ', function () {
    const columns = [
      { getAttribute: (attr: string) => (attr === 'data-index' ? 'parent' : 'Parent') },
    ];
    const data = {
      parent: 'Parent 1',
      children: [
        { child: 'Child 1' },
        { child: 'Child 2' },
      ],
    };
    const result = ExcelFormater.createExcelRow(columns, data);
    expect(result).toContain('<Row>');
    expect(result).toContain('<Cell><Data ss:Type="String">Parent 1</Data></Cell>');
    expect(result).toContain('<Row><Cell><Data ss:Type=\"String\">Parent 1</Data></Cell></Row><Row><Cell><Data ss:Type=\"String\"></Data></Cell></Row><Row><Cell><Data ss:Type=\"String\"></Data></Cell></Row>');
  });
  it('ExcelFormaterTest04 ', function () {
      const baseStr = 'path/to/image.jpg';
      const result = ExcelFormater.addImage(baseStr);
      expect(result).toContain('<Row>');
      expect(result).toContain(`<div><img src="${baseStr}"></img></div>`);
  });
  it('ExcelFormaterTest05 ', function () {
    const columns = [
      { getAttribute: (attr: string) => (attr === 'data-index' ? 'name' : 'Name'), title: 'Name' },
      { getAttribute: (attr: string) => (attr === 'data-index' ? 'age' : 'Age'), title: 'Age' },
    ];
    const dataSource = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 40 },
    ];
    const result = ExcelFormater.createTableData(columns, dataSource);
    expect(result).toContain('<thead>');
    expect(result).toContain('<td>Name</td>');
    expect(result).toContain('<td>Age</td>');
    expect(result).toContain('<tr>');
    expect(result).toContain('<td>Alice</td>');
    expect(result).toContain('<td>30</td>');
    expect(result).toContain('<tr>');
    expect(result).toContain('<td>Bob</td>');
    expect(result).toContain('<td>40</td>');
  });
  it('ExcelFormaterTest06 ', function () {
    const columns = ['Name', 'Age'];
    const result = ExcelFormater.createTHead(columns);
    expect(result).toContain('<thead>');
    expect(result).toContain('<td>Name</td>');
    expect(result).toContain('<td>Age</td>');
  });
  it('ExcelFormaterTest07 ', function () {
    const columns = ['Name', 'Age'];
    const data = { name: 'Alice', age: 30 };
    const result = ExcelFormater.createTableRow(columns, data);
    expect(result).toContain('<tr>');
    expect(result).toContain('<tr><td>undefined</td><td>undefined</td></tr>');
    expect(result).toContain('<tr><td>undefined</td><td>undefined</td></tr>');
  });
});