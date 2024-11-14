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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';

import { BaseStruct } from '../../bean/BaseStruct';
import { CounterStruct, SdkCounterRender } from '../../database/ui-worker/ProduceWorkerSdkCounter';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { SdkSliceRender, SdkSliceStruct } from '../../database/ui-worker/ProduceWorkerSdkSlice';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { TabUtil } from '../trace/sheet/sdk/TabUtil';
import { queryCounterMax, querySdkCount, querySdkCounterData, querySdkSliceData } from '../../database/sql/Sdk.sql';
import { queryStartTime } from '../../database/sql/SqlLite.sql';
import { NUM_7 } from '../../bean/NumBean';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';

export class SpSdkChart {
  trace: SpSystemTrace;
  private pluginName = 'dubai-plugin';

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  private parseJsonByCounterType(startTime: number, showType: unknown, configObj: unknown, table: unknown): void {
    let chartSql = this.createSql(
      startTime, //@ts-ignore
      showType.tableName, //@ts-ignore
      showType.columns,
      'where counter_id' + ' = $counter_id'
    ); //@ts-ignore
    let maxValue = this.createMaxValueSql(showType.tableName, 'where counter_id = $counter_id'); //@ts-ignore
    let innerTable = showType.inner;
    let countSql = this.createSql(startTime, innerTable.tableName, innerTable.columns); //@ts-ignore
    table.push({
      countSql: countSql,
      chartSql: chartSql,
      maxSql: maxValue,
      type: 'counter', //@ts-ignore
      name: configObj.disPlayName, //@ts-ignore
      pluginName: configObj.pluginName,
    });
  }

  private parseJsonBySliceType(startTime: number, showType: unknown, configObj: unknown, table: unknown[]): void {
    let chartSql = this.createSliceSql(
      startTime, //@ts-ignore
      showType.tableName, //@ts-ignore
      showType.columns,
      'where' + ` slice_id = $column_id and (start_ts - ${startTime}) between $startNS and $endNS;`
    ); //@ts-ignore
    let innerTable = showType.inner;
    let countSql;
    let countOtherSql = ''; //@ts-ignore
    if (configObj.pluginName === this.pluginName) {
      countSql = this.createSql(startTime, innerTable.tableName, innerTable.columns, 'where slice_name like $suffix');
      countOtherSql = this.createSql(
        startTime,
        innerTable.tableName,
        innerTable.columns,
        '' +
          "where slice_name not like '%_cpu' and slice_name not like '%_display' and " +
          "slice_name not like '%_gpu' and slice_name not like '%_System_idle' and " +
          "slice_name not like '%_wifi_data' and slice_name not like '%_sensor' and " +
          "slice_name not like '%_audio' "
      );
    } else {
      countSql = this.createSql(startTime, innerTable.tableName, innerTable.columns);
    }
    table.push({
      countSql: countSql,
      chartSql: chartSql,
      type: 'slice', //@ts-ignore
      name: configObj.disPlayName, //@ts-ignore
      pluginName: configObj.pluginName,
      countOtherSql: countOtherSql,
    });
  }

  parseJson(startTime: number, map: Map<number, string>): Map<number, unknown> {
    let tablesMap = new Map();
    let keys = map.keys();
    for (let key of keys) {
      let table: unknown[] = [];
      let configObj: unknown = map.get(key);
      if (configObj !== undefined) {
        //@ts-ignore
        let configStr = configObj.jsonConfig;
        let json = JSON.parse(configStr);
        let tableConfig = json.tableConfig;
        if (tableConfig !== null) {
          let showTypes = tableConfig.showType;
          for (let i = 0; i < showTypes.length; i++) {
            let showType = showTypes[i];
            let type = TabUtil.getTableType(showType);
            if (type === 'counter') {
              this.parseJsonByCounterType(startTime, showType, configObj, table);
            } else if (type === 'slice') {
              this.parseJsonBySliceType(startTime, showType, configObj, table);
            }
          }
          tablesMap.set(key, table);
        }
      }
    }
    return tablesMap;
  }

  private createSliceSql(startTime: number, tableName: string, columns: Array<unknown>, where?: string): string {
    let sliceSelectSql = 'select ';
    for (let i = 0; i < columns.length; i++) {
      let column = columns[i]; //@ts-ignore
      if (column.column === 'start_ts') {
        //@ts-ignore
        column.column = `(start_ts - ${startTime}) AS start_ts`;
      } //@ts-ignore
      if (column.column === 'end_ts') {
        //@ts-ignore
        column.column = `(end_ts - ${startTime}) AS end_ts`;
      }
      if (i === columns.length - 1) {
        //@ts-ignore
        sliceSelectSql = `${sliceSelectSql + column.column} `;
      } else {
        //@ts-ignore
        sliceSelectSql = `${sliceSelectSql + column.column}, `;
      }
    }
    sliceSelectSql = `${sliceSelectSql}from ${tableName}`;
    if (where !== undefined) {
      sliceSelectSql = `${sliceSelectSql} ${where}`;
    }
    return sliceSelectSql;
  }

  private createMaxValueSql(tableName: string, where?: string): string {
    let selectSql = `select max(value) as max_value from ${tableName}`;
    if (where !== undefined) {
      selectSql = `${selectSql} ${where}`;
    }
    return selectSql;
  }

  private createSql(startTime: number, tableName: string, columns: Array<unknown>, where?: string): string {
    let selectSql = 'select ';
    for (let i = 0; i < columns.length; i++) {
      let column = columns[i]; //@ts-ignore
      if (column.column === 'ts') {
        //@ts-ignore
        column.column = `ts - ${startTime} AS ts`;
      }
      if (i === columns.length - 1) {
        //@ts-ignore
        selectSql = `${selectSql + column.column} `;
      } else {
        //@ts-ignore
        selectSql = `${selectSql + column.column}, `;
      }
    }
    selectSql = `${selectSql}from ${tableName}`;
    if (where !== undefined) {
      selectSql = `${selectSql} ${where}`;
    }
    return selectSql;
  }

  async init(): Promise<void> {
    let configMap = SpSystemTrace.SDK_CONFIG_MAP;
    if (configMap === undefined) {
      return;
    }
    let res = await queryStartTime();
    //@ts-ignore
    let startTime = res[0].start_ts;
    // @ts-ignore
    let tablesMap = this.parseJson(startTime, configMap);
    let tableKeys = tablesMap.keys();
    for (let componentId of tableKeys) {
      let table = tablesMap.get(componentId);
      if (table !== null) {
        //@ts-ignore
        let nodeRow = this.initNodeRow(componentId, table[0].name); //@ts-ignore
        for (let index = 0; index < table.length; index++) {
          //@ts-ignore
          let sqlMap = table[index];
          if (sqlMap.type === 'counter') {
            let result = await querySdkCount(sqlMap.countSql, componentId);
            for (let i = 0; i < result.length; i++) {
              await this.initCounter(nodeRow, i, result[i], sqlMap, componentId);
            }
          } else if (sqlMap.type === 'slice' && sqlMap.pluginName === this.pluginName) {
            let suffixList = ['cpu', 'display', 'gpu', 'System_idle', 'wifi_data', 'sensor', 'audio'];
            for (let i = 0; i < suffixList.length; i++) {
              let result = await querySdkCount(sqlMap.countSql, componentId, { $suffix: `%${suffixList[i]}` });
              if (result.length > 0) {
                let groupNodeRow = await this.initSecondaryRow(nodeRow, i, suffixList[i]);
                for (let i = 0; i < result.length; i++) {
                  await this.initSlice(groupNodeRow, i, result[i], sqlMap, componentId);
                }
              }
            }
            let result = await querySdkCount(sqlMap.countOtherSql, componentId);
            if (result.length > 0) {
              let groupNodeRow = await this.initSecondaryRow(nodeRow, NUM_7, 'other');
              for (let i = 0; i < result.length; i++) {
                await this.initSlice(groupNodeRow, i, result[i], sqlMap, componentId);
              }
            }
          } else if (sqlMap.type === 'slice') {
            let result = await querySdkCount(sqlMap.countSql, componentId, {});
            for (let i = 0; i < result.length; i++) {
              await this.initSlice(nodeRow, i, result[i], sqlMap, componentId);
            }
          }
        }
      }
    }
  }

  private initCounterChartRow(
    componentId: number,
    expansion: boolean,
    counterId: string,
    counterName: string
  ): TraceRow<CounterStruct> {
    let traceRow = TraceRow.skeleton<CounterStruct>();
    traceRow.rowParentId = `Sdk-${componentId}`;
    traceRow.rowHidden = !expansion;
    traceRow.rowId = `${counterId}-${componentId}`;
    traceRow.rowType = TraceRow.ROW_TYPE_SDK_COUNTER;
    traceRow.folderPaddingLeft = 30;
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.style.height = '40px';
    traceRow.style.width = '100%';
    traceRow.setAttribute('children', '');
    traceRow.name = `${counterName}`;
    return traceRow;
  }

  private initCounter = async (
    nodeRow: TraceRow<BaseStruct>,
    index: number,
    result: unknown,
    sqlMap: unknown,
    componentId: number
  ): Promise<void> => {
    //@ts-ignore
    let traceRow = this.initCounterChartRow(componentId, nodeRow.expansion, result.counter_id, result.counter_name);
    traceRow.supplier = async (): Promise<CounterStruct[]> => //@ts-ignore
      querySdkCounterData(sqlMap.chartSql, result.counter_id, componentId);
    traceRow.focusHandler = (): void => {
      this.trace?.displayTip(
        traceRow,
        CounterStruct.hoverCounterStruct,
        `<span>${CounterStruct.hoverCounterStruct?.value?.toFixed(2)}</span>`
      );
    };
    traceRow.findHoverStruct = (): void => {
      CounterStruct.hoverCounterStruct = traceRow.getHoverStruct();
    }; //@ts-ignore
    let maxList = await queryCounterMax(sqlMap.maxSql, result.counter_id, componentId);
    //@ts-ignore
    let maxCounter = maxList[0].max_value;
    traceRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      //@ts-ignore
      (renders[TraceRow.ROW_TYPE_SDK_COUNTER] as SdkCounterRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `sdk-counter-${index}`,
          maxName: `${maxCounter}`,
          maxValue: maxCounter,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
    nodeRow.addChildTraceRow(traceRow);
  };

  private initNodeRow = (index: number, name: string): TraceRow<BaseStruct> => {
    let sdkFolder = TraceRow.skeleton();
    sdkFolder.rowId = `Sdk-${index}`;
    sdkFolder.index = index;
    sdkFolder.rowType = TraceRow.ROW_TYPE_SDK;
    sdkFolder.rowParentId = '';
    sdkFolder.style.height = '40px';
    sdkFolder.folder = true;
    sdkFolder.name = `${name}`;
    sdkFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    sdkFolder.selectChangeHandler = this.trace.selectChangeHandler;
    sdkFolder.supplier = async (): Promise<BaseStruct[]> => new Promise<[]>((resolve) => resolve([]));
    sdkFolder.onThreadHandler = (useCache: boolean): void => {
      sdkFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (sdkFolder.expansion) {
        // @ts-ignore
        this.trace.canvasPanelCtx?.clearRect(0, 0, sdkFolder.frame.width, sdkFolder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          // @ts-ignore
          sdkFolder
        );
      }
      sdkFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    this.trace.rowsEL?.appendChild(sdkFolder);
    return sdkFolder;
  };

  private initSecondaryRow = async (
    nodeRow: TraceRow<BaseStruct>,
    index: number,
    name: string
  ): Promise<TraceRow<BaseStruct>> => {
    let sdkSecondFolder = TraceRow.skeleton();
    sdkSecondFolder.rowId = `Sdk-${name}-${index}`;
    sdkSecondFolder.index = index;
    sdkSecondFolder.rowType = TraceRow.ROW_TYPE_SDK;
    sdkSecondFolder.rowParentId = nodeRow.rowId;
    sdkSecondFolder.rowHidden = !nodeRow.expansion;
    sdkSecondFolder.style.height = '40px';
    sdkSecondFolder.folder = true;
    sdkSecondFolder.folderPaddingLeft = 30;
    sdkSecondFolder.name = `${name}`;
    sdkSecondFolder.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    sdkSecondFolder.selectChangeHandler = this.trace.selectChangeHandler;
    sdkSecondFolder.supplier = async (): Promise<BaseStruct[]> => new Promise<[]>((resolve) => resolve([]));
    sdkSecondFolder.onThreadHandler = (useCache: boolean): void => {
      sdkSecondFolder.canvasSave(this.trace.canvasPanelCtx!);
      if (sdkSecondFolder.expansion) {
        // @ts-ignore
        this.trace.canvasPanelCtx?.clearRect(0, 0, sdkSecondFolder.frame.width, sdkSecondFolder.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          // @ts-ignore
          sdkSecondFolder
        );
      }
      sdkSecondFolder.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    this.trace.rowsEL?.appendChild(sdkSecondFolder);
    return sdkSecondFolder;
  };

  private initSliceChartRow(
    expansion: boolean,
    rowId: string,
    sliceId: string,
    sliceName: string,
    componentId: number
  ): TraceRow<SdkSliceStruct> {
    let traceRow = TraceRow.skeleton<SdkSliceStruct>();
    traceRow.rowType = TraceRow.ROW_TYPE_SDK_SLICE;
    traceRow.rowHidden = !expansion;
    traceRow.rowParentId = rowId;
    traceRow.folderPaddingLeft = 30;
    traceRow.style.height = '40px';
    traceRow.style.width = '100%';
    traceRow.name = `${sliceName}`;
    traceRow.setAttribute('children', '');
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.rowId = `${sliceId}-${componentId}`;
    return traceRow;
  }

  private initSlice = async (
    nodeRow: TraceRow<BaseStruct>,
    index: number,
    result: unknown,
    sqlMap: unknown,
    componentId: number
  ): Promise<void> => {
    let traceRow = this.initSliceChartRow(
      nodeRow.expansion,
      nodeRow.rowId!, //@ts-ignore
      result.slice_id, //@ts-ignore
      result.slice_name,
      componentId
    );
    traceRow.supplier = async (): Promise<SdkSliceStruct[]> =>
      querySdkSliceData(
        //@ts-ignore
        sqlMap.chartSql, //@ts-ignore
        result.slice_id,
        TraceRow.range?.startNS || 0,
        TraceRow.range?.endNS || 0,
        componentId
      );
    traceRow.focusHandler = (): void => {
      this.trace?.displayTip(
        traceRow,
        SdkSliceStruct.hoverSdkSliceStruct,
        `<span>${SdkSliceStruct.hoverSdkSliceStruct?.value}</span>`
      );
    };
    traceRow.findHoverStruct = (): void => {
      SdkSliceStruct.hoverSdkSliceStruct = traceRow.getHoverStruct();
    };
    traceRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (traceRow.currentContext) {
        context = traceRow.currentContext;
      } else {
        context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      traceRow.canvasSave(context);
      //@ts-ignore
      (renders[TraceRow.ROW_TYPE_SDK_SLICE] as SdkSliceRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: `sdk-slice-${index}`,
          maxName: '',
          maxValue: 0,
        },
        traceRow
      );
      traceRow.canvasRestore(context, this.trace);
    };
    nodeRow.addChildTraceRow(traceRow);
  };
}
