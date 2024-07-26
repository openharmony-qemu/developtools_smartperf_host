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

  async initSample(start_ts: number, file: any): Promise<TraceRow<SampleStruct>> {
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
      this.getJsonData(file).then((res: any) => {
        const propertyData = res.data;
        const treeNodes = res.relation.children || [res.relation.RS.children[0]];
        const uniqueProperty = this.removeDuplicates(propertyData);
        const flattenTreeArray = this.getFlattenTreeData(treeNodes);
        const height = (Math.max(...flattenTreeArray.map((obj: any) => obj.depth)) + 1) * 20;
        const sampleProperty = this.setRelationDataProperty(flattenTreeArray, uniqueProperty);
        const startTS = flattenTreeArray[0].property[0].begin;
        traceRow.supplier = () =>
          new Promise((resolve): void => {
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
  addTraceRowEventListener(row: TraceRow<any>, start_ts: number) {
    row.uploadEl?.addEventListener('sample-file-change', (e: any) => {
      this.getJsonData(e).then((res: any) => {
        this.resetChartData(row);
        const propertyData = res.data;
        const treeNodes = res.relation.children || [res.relation.RS.children[0]];
        const uniqueProperty = this.removeDuplicates(propertyData);
        const flattenTreeArray = this.getFlattenTreeData(treeNodes);
        const height = (Math.max(...flattenTreeArray.map((obj: any) => obj.depth)) + 1) * 20;
        const sampleProperty = this.setRelationDataProperty(flattenTreeArray, uniqueProperty);
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
  resetChartData(row: TraceRow<any>) {
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
  getJsonData(file: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.readAsText(file.detail || file);
      reader.onloadend = (e: any) => {
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
  getFlattenTreeData(treeData: Array<any>, depth: number = 0, parentName: string = ''): Array<any> {
    let result: Array<object> = [];
    treeData.forEach((node) => {
      const name: string = node['function_name'];
      const newNode: any = {};
      if (name.indexOf('unknown') > -1) {
        newNode['children'] = this.getUnknownAllChildrenNames(node);
      }
      newNode.detail = node.detail;
      newNode.depth = depth;
      newNode.name = name;
      newNode.parentName = parentName;
      newNode.property = [];
      result.push(newNode);
      if (node.children) {
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
  removeDuplicates(propertyData: Array<any>): Array<any> {
    const result: Array<any> = [];
    propertyData.forEach((propertyGroup) => {
      const groups: Array<any> = [];
      propertyGroup.forEach((property: any) => {
        const duplicateObj = groups.find((group) => group.func_name === property.func_name);
        if (duplicateObj) {
          duplicateObj.begin = Math.min(duplicateObj.begin, property.begin);
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
  setRelationDataProperty(relationData: Array<any>, propertyData: Array<any>): Array<any> {
    const sampleProperty = relationData;
    //数组每一项进行比对
    propertyData.forEach((propertyGroup) => {
      propertyGroup.forEach((property: any) => {
        const relation = sampleProperty.find((relation) => relation['name'] === property['func_name']);
        //property属性存储每帧数据
        relation?.property.push({
          name: property['func_name'],
          detail: relation['detail'],
          end: property['end'],
          begin: property['begin'],
          depth: relation['depth'],
          instructions: property['instructions'],
          cycles: property['cycles'],
        });
      });
    });

    //获取所有名字为unknown的数据
    const unknownRelation = sampleProperty.filter((relation) => relation['name'].indexOf('unknown') > -1);
    //二维数组 用于存放unknown下所有子节点的数据
    let twoDimensionalArray: Array<any> = [];
    let result: Array<any> = [];
    unknownRelation.forEach((unknownItem) => {
      result = [];
      twoDimensionalArray = [];
      const children = unknownItem['children'];
      //先获取到unknwon节点下每个子节点的property
      Object.keys(children).forEach((key) => {
        unknownItem.children[key] = sampleProperty.find((relation) => relation['name'] === key).property;
      });
      //将每个子节点的property加到二维数组中
      Object.values(children).forEach((value: any) => {
        if (value.length > 0) {
          twoDimensionalArray.push(value);
        }
      });
      if (twoDimensionalArray.length > 0) {
        //取每列的最大值和最小值
        for (let i = 0; i < twoDimensionalArray[0].length; i++) {
          const data = {
            name: unknownItem.name,
            detail: unknownItem.detail,
            begin: twoDimensionalArray[0][i].begin,
            end: 0,
            depth: unknownItem.depth,
          };
          for (let j = 0; j < twoDimensionalArray.length; j++) {
            data.end = Math.max(twoDimensionalArray[j][i].end, data.end);
            data.begin = Math.min(twoDimensionalArray[j][i].begin, data.begin);
          }
          result.push(data);
        }
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
  getUnknownAllChildrenNames(node: any, names: any = {}): object {
    if (node['children']) {
      node['children'].forEach((child: any) => {
        if (child['function_name'].indexOf('unknown') < 0) {
          names[child.function_name] = [];
        } else {
          this.getUnknownAllChildrenNames(child, names);
        }
      });
    }
    return names;
  }
}
