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

import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SortDetail } from '../SheetUtils';
import { XpowerComponentTopStruct } from './TabPaneXpowerComponentTop';

export function sortByColumn(detail: SortDetail, dataSource: Array<unknown>, table: LitTable): void {
  function compare(property: string | number, sort: number, type: string) {
    return function (
      xpowerComponentTopLeftData: XpowerComponentTopStruct,
      xpowerComponentTopRightData: XpowerComponentTopStruct
    ): number {
      if (type === 'number') {
        return sort === 2 // @ts-ignore
          ? parseFloat(xpowerComponentTopRightData[property]) - parseFloat(xpowerComponentTopLeftData[property]) // @ts-ignore
          : parseFloat(xpowerComponentTopLeftData[property]) - parseFloat(xpowerComponentTopRightData[property]);
      } else {
        // @ts-ignore
        if (xpowerComponentTopRightData[property] > xpowerComponentTopLeftData[property]) {
          return sort === 2 ? 1 : -1;
        } else {
          // @ts-ignore
          if (xpowerComponentTopRightData[property] === xpowerComponentTopLeftData[property]) {
            return 0;
          } else {
            return sort === 2 ? -1 : 1;
          }
        }
      }
    };
  }

  if (detail.key === 'appNameStr') {// @ts-ignore
    dataSource.sort(compare(detail.key, detail.sort, 'string'));
  } else {
    // @ts-ignore
    dataSource.sort(compare(detail.key, detail.sort, 'number'));
  }
  table!.recycleDataSource = dataSource;
}
