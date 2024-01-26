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

import { JSONToCSV } from '../../../src/base-ui/utils/CSVFormater';

describe('JSONToCSV Test', () => {
  it('JSONToCSVTest01', () => {
    const data = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Alice', age: 25, city: 'San Francisco' },
    ];
    const Obj = {
      data: data,
      showLabel: true,
      fileName: 'TestExport',
      columns: {
        title: ['Name', 'Age', 'City'],
        key: ['name', 'age', 'city'],
        formatter: undefined,
      },
    };
    const mockSaveCsvFile = jest.fn();
    JSONToCSV.saveCsvFile = mockSaveCsvFile;
    JSONToCSV.setCsvData(Obj);
    expect(mockSaveCsvFile).toHaveBeenCalled();
    expect(mockSaveCsvFile).toHaveBeenCalledWith('TestExport.csv', expect.any(String));
  });
});