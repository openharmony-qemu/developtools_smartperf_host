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
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { SampleStruct, SampleRender } from '../../database/ui-worker/ProcedureWorkerBpftrace';
import { queryStartTime } from '../../database/sql/SqlLite.sql';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';

export class SpBpftraceChart {
  private trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(file: File | null) {
    if (!file) {
      let startTime = await queryStartTime();
      //@ts-ignore
      let folder = await this.initSample(startTime[0].start_ts, file);
      this.trace.rowsEL?.appendChild(folder);
    } else {
      let folder = await this.initSample(-1, file);
      this.trace.rowsEL?.appendChild(folder);
    }
  }

  async initSample(start_ts: number, file: unknown): Promise<TraceRow<SampleStruct>> {
    let traceRow = TraceRow.skeleton<SampleStruct>();
    traceRow.rowId = 'bpftrace';
    traceRow.index = 0;
    traceRow.rowType = TraceRow.ROW_TYPE_SAMPLE;
    traceRow.rowParentId = '';
    traceRow.folder = false;
    traceRow.style.height = '40px';
    traceRow.name = 'bpftrace';
    traceRow.selectChangeHandler = this.trace.selectChangeHandler;
    traceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    //添加上传按钮
    if (!file) {
      traceRow.addRowSampleUpload();
    }
    this.addTraceRowEventListener(traceRow, start_ts);
    //单独上传
    if (file) {
      this.getJsonData(file).then((res: unknown) => {
        // @ts-ignore
        const propertyData = res.data;
        // @ts-ignore
        const treeNodes = res.relation.children || [res.relation.RS.children[0]];
        const uniqueProperty = this.removeDuplicates(propertyData);
        const flattenTreeArray = this.getFlattenTreeData(treeNodes);
        // @ts-ignore
        const height = (Math.max(...flattenTreeArray.map((obj: unknown) => obj.depth)) + 1) * 20;
        // @ts-ignore
        const sampleProperty = this.setRelationDataProperty(flattenTreeArray, uniqueProperty);
        // @ts-ignore
        const startTS = flattenTreeArray[0].property[0].begin;
        traceRow.supplier = () =>
          new Promise((resolve): void => {
            // @ts-ignore
            resolve(sampleProperty);
          });
        traceRow.onThreadHandler = (useCache) => {
          let context: CanvasRenderingContext2D;
          if (traceRow.currentContext) {
            context = traceRow.currentContext;
          } else {
            context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          traceRow.canvasSave(context);
          (renders.sample as SampleRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: 'bpftrace',
              start_ts: startTS,
              uniqueProperty: uniqueProperty,
              // @ts-ignore
              flattenTreeArray: flattenTreeArray,
            },
            traceRow
          );
          traceRow.canvasRestore(context);
        };
        traceRow.style.height = `${height}px`;
      });
    } else {
      traceRow.supplier = () =>
        new Promise((resolve): void => {
          resolve([]);
        });
      traceRow.onThreadHandler = (useCache) => {
        let context: CanvasRenderingContext2D;
        if (traceRow.currentContext) {
          context = traceRow.currentContext;
        } else {
          context = traceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
        }
        traceRow.canvasSave(context);
        (renders.sample as SampleRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            type: 'bpftrace',
            start_ts: 0,
            uniqueProperty: [],
            flattenTreeArray: [],
          },
          traceRow
        );
        traceRow.canvasRestore(context);
      };
    }
    return traceRow;
  }

  /**
   * 监听文件上传事件
   * @param row
   * @param start_ts
   */
  // @ts-ignore
  addTraceRowEventListener(row: TraceRow<unknown>, start_ts: number): void {
    row.uploadEl?.addEventListener('sample-file-change', (e: unknown) => {
      this.getJsonData(e).then((res: unknown) => {
        this.resetChartData(row);
        // @ts-ignore
        const propertyData = res.data;
        // @ts-ignore
        const treeNodes = res.relation.children || [res.relation.RS.children[0]];
        const uniqueProperty = this.removeDuplicates(propertyData);
        const flattenTreeArray = this.getFlattenTreeData(treeNodes);
        // @ts-ignore
        const height = (Math.max(...flattenTreeArray.map((obj: unknown) => obj.depth)) + 1) * 20;
        const sampleProperty = this.setRelationDataProperty(flattenTreeArray, uniqueProperty);
        // @ts-ignore
        const startTS = start_ts > 0 ? start_ts : flattenTreeArray[0].property[0].begin;
        row.supplier = () =>
          new Promise((resolve): void => {
            resolve(sampleProperty);
          });
        row.onThreadHandler = (useCache) => {
          let context: CanvasRenderingContext2D;
          if (row.currentContext) {
            context = row.currentContext;
          } else {
            context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          row.canvasSave(context);
          (renders.sample as SampleRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              type: 'bpftrace',
              start_ts: startTS,
              uniqueProperty: uniqueProperty,
              // @ts-ignore
              flattenTreeArray: flattenTreeArray,
            },
            row
          );
          row.canvasRestore(context);
        };
        row.style.height = `${height}px`;
      });
    });
  }

  /**
   * 清空缓存
   * @param row
   */
  // @ts-ignore
  resetChartData(row: TraceRow<unknown>): void {
    row.dataList = [];
    row.dataList2 = [];
    row.dataListCache = [];
    row.isComplete = false;
  }

  /**
   * 获取上传的文件内容 转为json格式
   * @param file
   * @returns
   */
  getJsonData(file: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      // @ts-ignore
      reader.readAsText(file.detail || file);
      reader.onloadend = (e: unknown): void => {
        // @ts-ignore
        const fileContent = e.target?.result;
        try {
          resolve(JSON.parse(fileContent));
          document.dispatchEvent(new CustomEvent('file-correct'));
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            event: 'bpftrace',
            action: 'bpftrace',
          });
        } catch (error) {
          document.dispatchEvent(new CustomEvent('file-error'));
        }
      };
    });
  }

  /**
   * 树结构扁平化
   * @param treeData
   * @param depth
   * @param parentName
   * @returns
   */
  getFlattenTreeData(treeData: Array<unknown>, depth: number = 0, parentName: string = ''): Array<unknown> {
    let result: Array<object> = [];
    treeData.forEach((node) => {
      // @ts-ignore
      const name: string = node.function_name;
      const newNode: unknown = {};
      if (name.indexOf('unknown') > -1) {
        // @ts-ignore
        newNode.children = this.getUnknownAllChildrenNames(node);
      }
      // @ts-ignore
      newNode.detail = node.detail;
      // @ts-ignore
      newNode.depth = depth;
      // @ts-ignore
      newNode.name = name;
      // @ts-ignore
      newNode.parentName = parentName;
      // @ts-ignore
      newNode.property = [];
      // @ts-ignore
      result.push(newNode);
      // @ts-ignore
      if (node.children) {
        // @ts-ignore
        result = result.concat(this.getFlattenTreeData(node.children, depth + 1, node.function_name));
      }
    });
    return result;
  }

  /**
   * 查找重复项
   * @param propertyData
   * @returns
   */
  removeDuplicates(propertyData: Array<unknown>): Array<unknown> {
    const result: Array<unknown> = [];
    propertyData.forEach((propertyGroup) => {
      const groups: Array<unknown> = [];
      // @ts-ignore
      propertyGroup.forEach((property: unknown) => {
        // @ts-ignore
        const duplicateObj = groups.find((group) => group.func_name === property.func_name);
        if (duplicateObj) {
          // @ts-ignore
          duplicateObj.begin = Math.min(duplicateObj.begin, property.begin);
          // @ts-ignore
          duplicateObj.end = Math.max(duplicateObj.end, property.end);
        } else {
          groups.push(property);
        }
      });
      result.push(groups);
    });
    return result;
  }

  /**
   * 关系树赋值
   * @param relationData
   * @param propertyData
   */
  setRelationDataProperty(relationData: Array<unknown>, propertyData: Array<unknown>): Array<unknown> {
    const sampleProperty = relationData;
    //数组每一项进行比对
    propertyData.forEach((propertyGroup) => {
      // @ts-ignore
      propertyGroup.forEach((property: unknown) => {
        // @ts-ignore
        const relation = sampleProperty.find((relation) => relation.name === property.func_name);
        //property属性存储每帧数据
        // @ts-ignore
        relation?.property.push({
          // @ts-ignore
          name: property.func_name,
          // @ts-ignore
          detail: relation.detail,
          // @ts-ignore
          end: property.end,
          // @ts-ignore
          begin: property.begin,
          // @ts-ignore
          depth: relation.depth,
          // @ts-ignore
          instructions: property.instructions,
          // @ts-ignore
          cycles: property.cycles,
        });
      });
    });

    //获取所有名字为unknown的数据
    // @ts-ignore
    const unknownRelation = sampleProperty.filter((relation) => relation.name.indexOf('unknown') > -1);
    //二维数组 用于存放unknown下所有子节点的数据
    let twoDimensionalArray: Array<unknown> = [];
    let result: Array<unknown> = [];
    unknownRelation.forEach((unknownItem) => {
      result = [];
      twoDimensionalArray = [];
      // @ts-ignore
      const children = unknownItem.children;
      //先获取到unknwon节点下每个子节点的property
      Object.keys(children).forEach((key) => {
        // @ts-ignore
        unknownItem.children[key] = sampleProperty.find((relation) => relation.name === key).property;
      });
      //将每个子节点的property加到二维数组中
      Object.values(children).forEach((value: unknown) => {
        // @ts-ignore
        if (value.length > 0) {
          twoDimensionalArray.push(value);
        }
      });
      if (twoDimensionalArray.length > 0) {
        //取每列的最大值和最小值
        // @ts-ignore
        for (let i = 0; i < twoDimensionalArray[0].length; i++) {
          const data = {
            // @ts-ignore
            name: unknownItem.name,
            // @ts-ignore
            detail: unknownItem.detail,
            // @ts-ignore
            begin: twoDimensionalArray[0][i].begin,
            end: 0,
            // @ts-ignore
            depth: unknownItem.depth,
          };
          for (let j = 0; j < twoDimensionalArray.length; j++) {
            // @ts-ignore
            data.end = Math.max(twoDimensionalArray[j][i].end, data.end);
            // @ts-ignore
            data.begin = Math.min(twoDimensionalArray[j][i].begin, data.begin);
          }
          result.push(data);
        }
        // @ts-ignore
        unknownItem.property = result;
      }
    });
    return sampleProperty;
  }

  /**
   * 获取unknown节点下所有孩子节点的名称
   * @param node
   * @param names
   */
  getUnknownAllChildrenNames(node: unknown, names: unknown = {}): object {
    // @ts-ignore
    if (node.children) {
      // @ts-ignore
      node.children.forEach((child: unknown) => {
        // @ts-ignore
        if (child.function_name.indexOf('unknown') < 0) {
          // @ts-ignore
          names[child.function.name] = [];
        } else {
          this.getUnknownAllChildrenNames(child, names);
        }
      });
    }
    // @ts-ignore
    return names;
  }
}
