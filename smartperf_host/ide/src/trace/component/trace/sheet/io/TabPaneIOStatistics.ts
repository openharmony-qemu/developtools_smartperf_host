/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { SlicesTime } from '../../timer-shaft/SportRuler';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { TabPaneIoStatisticsHtml } from './TabPaneIOStatistics.html';
import { IOStruct } from 'src/trace/database/ui-worker/ProcedureWorkerIO';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { IOStatisticsRow, queryIOStatisticsByRange } from '../../../../database/sql/IO.sql';
import { resizeObserver } from '../SheetUtils';

@element('tabpane-io-statistics')
export class TabPaneIOStatistics extends BaseElement {
  private static readonly NS_PER_MS = 1000000;
  private table: LitTable | undefined | null;
  private currentSlicesTime: SlicesTime | null = null;
  private progressEL: LitProgressBar | null | undefined;
  private lastRangeKey: string | null = null;
  private currentSelection: SelectionParam | undefined;
  private defaultTableRows: Array<Record<string, string | number>> = [];
  private tableRows: Array<Record<string, string | number>> = [];

  setIoStatisticsData(dataList: Array<IOStruct>): void {
    if (!this.table) {
      return;
    }
    if (dataList.length > 0) {
      this.tableRows = dataList.map((d) => {
        const actualBytes = (d as IOStruct & { actualBytes?: number }).actualBytes;
        const durationNs = d.dur ?? d.endNS - d.startNS;
        return {
          process: '',
          thread: `Thread(${d.itid ?? 0})`,
          startTime: d.startNS,
          isWrite: d.isWrite ? 'Write' : 'Read',
          requestBytes: d.size,
          actualBytes: actualBytes ?? d.size,
          isPhysical: d.isPhysical ? 'Physical' : 'Logical',
          duration: this.formatDurationMs(durationNs),
          minDuration: this.formatDurationMs(d.minDuration ?? durationNs),
          avgDuration: this.formatDurationMs(d.avgDuration ?? durationNs),
          maxDuration: this.formatDurationMs(d.maxDuration ?? durationNs)
        };
      });
      this.defaultTableRows = [...this.tableRows];
      this.table.recycleDataSource = this.tableRows;
    } else {
      this.defaultTableRows = [];
      this.tableRows = [];
      this.table.recycleDataSource = [];
    }
  }

  initElements(): void {
    this.table = this.shadowRoot?.querySelector<LitTable>('#tb-io-statistics');
    this.progressEL = this.shadowRoot?.querySelector<LitProgressBar>('.progress');
    this.table!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  setCurrentSlicesTime(slicesTime: SlicesTime | null): void {
    this.currentSlicesTime = slicesTime;
    if (!slicesTime) {
      return;
    }
    this.fetchIOData(slicesTime.startTime, slicesTime.endTime);
  }

  set data(selection: SelectionParam) {
    if (this.currentSelection === selection) {
      return;
    }
    this.currentSelection = selection;
    // 缓存 key 需要包含选中泳道，避免同一时间范围切换泳道时不刷新
    const rowIds = (selection.ioStatisticsRowIds || []).slice().sort();
    const key = `${selection.leftNs}-${selection.rightNs}-${rowIds.join(',')}`;
    if (this.lastRangeKey === key) {
      return;
    }
    this.lastRangeKey = key;
    this.currentSlicesTime = null;
    this.fetchIOData(selection.leftNs, selection.rightNs, rowIds);
  }

  /**
   * 将 IO 泳道 rowId 解析为 is_write / is_block 过滤条件。
   * rowId 约定于 SpSystemIOChart：io-system-{logical|physical}-{read|write}
   */
  private buildIOFilters(rowIds: string[]): Array<{ isWrite: number; isBlock: number }> {
    const filters: Array<{ isWrite: number; isBlock: number }> = [];
    const seen = new Set<string>();
    rowIds.forEach((rowId) => {
      if (!rowId || !rowId.startsWith('io-system-')) {
        return;
      }
      const isBlock = rowId.includes('physical') ? 1 : 0;
      const isWrite = rowId.endsWith('write') ? 1 : 0;
      const key = `${isWrite}-${isBlock}`;
      if (!seen.has(key)) {
        seen.add(key);
        filters.push({ isWrite, isBlock });
      }
    });
    return filters;
  }

  private fetchIOData(startTimeNs: number, endTimeNs: number, rowIds: string[] = []): void {
    if (!this.table || !this.progressEL) {
      return;
    }
    this.progressEL!.loading = true;
    const filters = this.buildIOFilters(rowIds);
    queryIOStatisticsByRange(startTimeNs, endTimeNs, filters).then((list: IOStatisticsRow[]) => {
      if (list.length > 0) {
        this.table!.style.display = 'block';
        this.tableRows = list.map((row) => {
          return {
            process: `${row.pName ?? 'Process'}(${row.pid ?? 0})`,
            thread: `${row.tName ?? 'Thread'}(${row.tid ?? 0})`,
            startTime: row.start_time,
            duration: this.formatDurationMs(row.duration),
            minDuration: this.formatDurationMs(row.minDuration),
            avgDuration: this.formatDurationMs(row.avgDuration),
            maxDuration: this.formatDurationMs(row.maxDuration),
            isWrite: row.is_write === 1 ? 'Write' : 'Read',
            requestBytes: row.request_bytes,
            actualBytes: row.actualBytes,
            isPhysical: row.is_physical === 1 ? 'Physical' : 'Logical'
          };
        });
        this.defaultTableRows = [...this.tableRows];
        this.table!.recycleDataSource = this.tableRows;
      } else {
        this.table!.style.display = 'none';
        this.defaultTableRows = [];
        this.tableRows = [];
        this.table!.recycleDataSource = [];
      }
      this.progressEL!.loading = false;
    }).catch((error) => {
      console.error('[TabPaneIOStatistics] Failed to fetch IO statistics:', error);
      this.progressEL!.loading = false;
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.parentElement && this.table) {
      resizeObserver(this.parentElement, this.table, 20);
    }
  }

  private sortByColumn(detail: { key: string; sort: number }): void {
    if (!this.table || !detail?.key || this.tableRows.length === 0) {
      return;
    }
    if (detail.sort === 0) {
      this.tableRows = [...this.defaultTableRows];
      this.table.recycleDataSource = this.tableRows;
      return;
    }
    const rows = [...this.tableRows];
    const isDesc = detail.sort === 2;
    rows.sort((left, right) => {
      const leftVal = left[detail.key];
      const rightVal = right[detail.key];
      // 统一使用 Number 转换进行比较，支持数字和数字字符串
      const leftNum = Number(leftVal);
      const rightNum = Number(rightVal);
      if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
        return isDesc ? rightNum - leftNum : leftNum - rightNum;
      }
      // 非数字值使用字符串比较
      const leftStr = String(leftVal ?? '');
      const rightStr = String(rightVal ?? '');
      return isDesc ? rightStr.localeCompare(leftStr) : leftStr.localeCompare(rightStr);
    });
    this.tableRows = rows;
    this.table.recycleDataSource = rows;
  }

  private formatDurationMs(durationNs: number): string {
    return (durationNs / TabPaneIOStatistics.NS_PER_MS).toFixed(3);
  }

  initHtml(): string {
    return TabPaneIoStatisticsHtml;
  }
}
