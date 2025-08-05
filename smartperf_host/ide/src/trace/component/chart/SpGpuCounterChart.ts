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
import {
  GpuCounterStruct,
  MaleoonCounterObj,
  GpuCounterType,
  GpuCounterRender,
} from '../../database/ui-worker/ProcedureWorkerGpuCounter';
import { folderSupplier, folderThreadHandler } from './SpChartManager';
import { queryRangeTime } from '../../database/sql/SqlLite.sql';

export class SpGpuCounterChart {
  trace: SpSystemTrace;
  // @ts-ignore
  private folderRow: TraceRow<unknown> | undefined;
  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(res: Array<unknown>): Promise<void> {
    if (res.length === 0) {
      let startTime = await queryRangeTime();
      this.initFolder(res, false);
      //@ts-ignore
      this.addTraceRowEventListener(startTime[0].start_ts, startTime[0].end_ts);
    } else {
      // @ts-ignore
      const { gpuCounterType, start_time } = this.handleCsvData(res);
      this.initFolder(res, true);
      await this.initGpuCounters(gpuCounterType, start_time);
    }
  }

  initFolder(res: Array<unknown>, isSimpleUpload: boolean): void {
    this.folderRow = TraceRow.skeleton();
    this.folderRow.rowId = 'GpuCounter';
    this.folderRow.index = 0;
    this.folderRow.rowType = TraceRow.ROW_TYPE_GPU_COUNTER_GROUP;
    this.folderRow.rowParentId = '';
    this.folderRow.style.height = '40px';
    this.folderRow.rowHidden = this.folderRow!.expansion;
    this.folderRow.setAttribute('children', '');
    this.folderRow.folder = res.length > 0 ? true : false;
    this.folderRow.name = 'Gpu counter';
    //@ts-ignore
    this.folderRow.supplier = folderSupplier();
    // @ts-ignore
    this.folderRow.onThreadHandler = folderThreadHandler(this.folderRow, this.trace);
    if (!isSimpleUpload) {
      this.folderRow.addRowSampleUpload('.csv');
    }
    this.folderRow.addEventListener('expansion-change', this.trace.extracted(this.folderRow));
    this.trace.rowsEL?.appendChild(this.folderRow);
  }

  async initGpuCounters(gpuCounterType: unknown, start_time: number): Promise<void> {
    // @ts-ignore
    for (const key in gpuCounterType) {
      let typeRows = TraceRow.skeleton();
      typeRows.rowId = key;
      typeRows.rowType = TraceRow.ROW_TYPE_GPU_COUNTER;
      typeRows.rowParentId = this.folderRow?.rowId;
      typeRows.folder = true;
      typeRows.folderTextLeft = 20;
      typeRows.rowHidden = !this.folderRow!.expansion;
      typeRows.style.height = '40px';
      typeRows.name = `${key}`;
      typeRows.selectChangeHandler = this.trace.selectChangeHandler;
      //@ts-ignore
      typeRows.supplier = folderSupplier();
      typeRows.onThreadHandler = folderThreadHandler(typeRows, this.trace);
      this.folderRow!.addChildTraceRow(typeRows);
      // @ts-ignore
      this.initTypeRow(gpuCounterType[key], key, typeRows, start_time);
    }
  }

  initTypeRow(rowList: unknown, key: string, parentRow: unknown, start_time: number): void {
    const typeName = this.getKeyTypeName(key);
    // @ts-ignore
    for (let i = 0; i < rowList.length; i++) {
      let typeRow = TraceRow.skeleton<GpuCounterStruct>();
      // @ts-ignore
      let maxValue = Math.max(...rowList[i].map((it: GpuCounterStruct) => Number(it.height)));
      typeRow.rowId = `${typeName[i]}`;
      typeRow.rowType = TraceRow.ROW_TYPE_GPU_COUNTER;
      typeRow.rowParentId = key;
      typeRow.folder = false;
      typeRow.folderTextLeft = 40;
      typeRow.style.height = '40px';
      // @ts-ignore
      typeRow.rowHidden = !parentRow.expansion;
      typeRow.setAttribute('children', '');
      typeRow.name = `${typeName[i]}`;
      typeRow.selectChangeHandler = this.trace.selectChangeHandler;
      typeRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      typeRow.focusHandler = (): void => this.focusHandler(typeRow, GpuCounterStruct.hoverGpuCounterStruct!);
      typeRow.findHoverStruct = (): void => {
        GpuCounterStruct.hoverGpuCounterStruct = typeRow.getHoverStruct(false);
      };
      typeRow.supplierFrame = (): Promise<GpuCounterStruct[]> =>
        new Promise((resolve): void => {
          // @ts-ignore
          resolve(rowList[i]);
        });
      typeRow.onThreadHandler = (useCache): void => {
        let context: CanvasRenderingContext2D;
        if (typeRow.currentContext) {
          context = typeRow.currentContext;
        } else {
          context = typeRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
        }
        typeRow.canvasSave(context);
        (renders.gpuCounter as GpuCounterRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            type: `${typeName[i]}`,
            startTime: start_time,
            maxValue: maxValue,
          },
          typeRow
        );
        typeRow.canvasRestore(context);
      };
      // @ts-ignore
      parentRow.addChildTraceRow(typeRow);
    }
  }

  focusHandler(row: TraceRow<GpuCounterStruct>, struct: GpuCounterStruct): void {
    let tip = '';
    if (struct) {
      tip = `
      <span> ${struct.height}</span>
      `;
    }
    this.trace?.displayTip(row, struct, tip);
  }

  getKeyTypeName(key: string): Array<string> {
    const typeName: { [key: string]: Array<string> } = {
      cycle: ['gpu clocks', 'tiler utilization', 'binning utilization', 'rendering utilization', 'compute utilization'],
      drawcall: [
        'drawcall count',
        'vertex count',
        'primitives count',
        'visible primitives count',
        'compute invocations count',
      ],
      shader_cycle: [
        'shader utilization',
        'eu utilization',
        'eu stall utilization',
        'eu idle utilization',
        'control flow instr utilization',
        'half float instr utilization',
        'tu utilization',
      ],
      local_count: ['concurrent warps', 'instruction count', 'quads count', 'texels count'],
      local_wr: ['memory read', 'memory write', 'memory traffic'],
    };
    return typeName[key];
  }

  handleCsvData(res: unknown, start_ts: number = 0, end_ts: number = 0): unknown {
    // @ts-ignore
    const minIndex = this.getMinData(res) + 1;
    const gpuCounterMap = this.initGpuCounterMap();
    // @ts-ignore
    this.maleoon_gpu_counter_init(gpuCounterMap, res[0]);
    // @ts-ignore
    let start_time_data = res[minIndex].split(',');
    // @ts-ignore
    let start_time = Number(start_time_data[gpuCounterMap.timestamp]);
    let last_record_time = 0;
    // @ts-ignore
    let maleoonCounter = new maleoon_counter_obj();
    // @ts-ignore
    let read_line_num = res.length - 1;
    let utilization_array = [
      'tiler_utilization',
      'binning_utilization',
      'rendering_utilization',
      'compute_utilization',
      'shader_utilization',
      'eu_utilization',
      'eu_stall_utilization',
      'eu_idle_utilization',
      'control_flow_instr_utilization',
      'half_float_instr_utilization',
      'tu_utilization',
      'concurrent_warps',
    ];

    let count_array = [
      'gpu_clocks',
      'drawcall_count',
      'vertex_count',
      'primitives_count',
      'visible_primitives_count',
      'instruction_count',
      'quads_count',
      'texels_count',
      'compute_invocations_count',
      'memory_read',
      'memory_write',
      'memory_traffic',
    ];

    for (let i = minIndex; i < read_line_num; i++) {
      // @ts-ignore
      let datas = res[i].split(',');
      if (datas.length !== 25) {
        continue;
      }
      if (
        // @ts-ignore
        (start_ts > 0 && Number(datas[gpuCounterMap.timestamp]) < start_ts) ||
        // @ts-ignore
        (end_ts > 0 && Number(datas[gpuCounterMap.timestamp]) > end_ts)
      ) {
        continue;
      }
      // @ts-ignore
      let time_passed = Number(datas[gpuCounterMap.timestamp]) - start_time;
      //去重
      if (time_passed <= last_record_time) {
        continue;
      }
      time_passed -= last_record_time;
      last_record_time += time_passed;
      utilization_array.forEach((item) => {
        maleoonCounter[item].push({
          // @ts-ignore
          startNS: Number(datas[gpuCounterMap.timestamp]),
          // @ts-ignore
          height: gpuCounterMap[item] === -1 ? 0 : Math.floor(Number(datas[gpuCounterMap[item]])),
        });
      });
      count_array.forEach((item) => {
        maleoonCounter[item].push({
          // @ts-ignore
          startNS: Number(datas[gpuCounterMap.timestamp]),
          // @ts-ignore
          height: gpuCounterMap[item] === -1 ? 0 : Math.floor(Number(datas[gpuCounterMap[item]])),
        });
      });
    }
    utilization_array.forEach((item) => {
      for (let i = 0; i < maleoonCounter[item].length; i++) {
        //@ts-ignore
        maleoonCounter[item][i].dur = maleoonCounter[item][i + 1]?.startNS - maleoonCounter[item][i].startNS || 0;
      }
    });
    count_array.forEach((item) => {
      for (let i = 0; i < maleoonCounter[item].length; i++) {
        //@ts-ignore
        maleoonCounter[item][i].dur = maleoonCounter[item][i + 1]?.startNS - maleoonCounter[item][i].startNS || 0;
      }
    });
    const gpuCounterType = this.groupByGpuCounterType(maleoonCounter);
    return { gpuCounterType, start_time };
  }

  initGpuCounterMap(): unknown {
    let gpu_counter_map = {
      timestamp: -1,

      gpu_clocks: -1,
      tiler_utilization: -1,
      binning_utilization: -1,
      rendering_utilization: -1,
      compute_utilization: -1,

      drawcall_count: -1,
      vertex_count: -1,
      primitives_count: -1,
      visible_primitives_count: -1,
      compute_invocations_count: -1,

      shader_utilization: -1,
      eu_utilization: -1,
      eu_stall_utilization: -1,
      eu_idle_utilization: -1,
      control_flow_instr_utilization: -1,
      half_float_instr_utilization: -1,
      tu_utilization: -1,

      concurrent_warps: -1,
      instruction_count: -1,
      quads_count: -1,
      texels_count: -1,

      memory_read: -1,
      memory_write: -1,
      memory_traffic: -1,
    };
    return gpu_counter_map;
  }

  maleoon_gpu_counter_init(gpu_counter_map: unknown, head_line: string): void {
    // @ts-ignore
    gpu_counter_map.timestamp = -1;
    // @ts-ignore
    gpu_counter_map.gpu_clocks = -1;
    // @ts-ignore
    gpu_counter_map.tiler_utilization = -1;
    // @ts-ignore
    gpu_counter_map.binning_utilization = -1;
    // @ts-ignore
    gpu_counter_map.rendering_utilization = -1;
    // @ts-ignore
    gpu_counter_map.compute_utilization = -1;

    // @ts-ignore
    gpu_counter_map.drawcall_count = -1;
    // @ts-ignore
    gpu_counter_map.vertex_count = -1;
    // @ts-ignore
    gpu_counter_map.primitives_count = -1;
    // @ts-ignore
    gpu_counter_map.visible_primitives_count = -1;
    // @ts-ignore
    gpu_counter_map.compute_invocations_count = -1;

    // @ts-ignore
    gpu_counter_map.shader_utilization = -1;
    // @ts-ignore
    gpu_counter_map.eu_utilization = -1;
    // @ts-ignore
    gpu_counter_map.eu_stall_utilization = -1;
    // @ts-ignore
    gpu_counter_map.eu_idle_utilization = -1;
    // @ts-ignore
    gpu_counter_map.control_flow_instr_utilization = -1;
    // @ts-ignore
    gpu_counter_map.half_float_instr_utilization = -1;
    // @ts-ignore
    gpu_counter_map.tu_utilization = -1;

    // @ts-ignore
    gpu_counter_map.concurrent_warps = -1;
    // @ts-ignore
    gpu_counter_map.instruction_count = -1;
    // @ts-ignore
    gpu_counter_map.quads_count = -1;
    // @ts-ignore
    gpu_counter_map.texels_count = -1;

    // @ts-ignore
    gpu_counter_map.memory_read = -1;
    // @ts-ignore
    gpu_counter_map.memory_write = -1;
    // @ts-ignore
    gpu_counter_map.memory_traffic = -1;

    let paras = head_line.split(',');
    for (let i = 0; i < paras.length; i++) {
      // @ts-ignore
      if (paras[i] === 'TIMESTAMP') {
        // @ts-ignore
        gpu_counter_map.timestamp = i;
      }

      if (paras[i] === 'GPU Clocks') {
        // @ts-ignore
        gpu_counter_map.gpu_clocks = i;
      }
      if (paras[i] === 'Tiler Utilization') {
        // @ts-ignore
        gpu_counter_map.tiler_utilization = i;
      }
      if (paras[i] === 'Binning Queue Utilization') {
        // @ts-ignore
        gpu_counter_map.binning_utilization = i;
      }
      if (paras[i] === 'Rendering Queue Utilization') {
        // @ts-ignore
        gpu_counter_map.rendering_utilization = i;
      }
      if (paras[i] === 'Compute Queue Utilization') {
        // @ts-ignore
        gpu_counter_map.compute_utilization = i;
      }

      if (paras[i] === 'Drawcalls Count') {
        // @ts-ignore
        gpu_counter_map.drawcall_count = i;
      }
      if (paras[i] === 'Vertex Count') {
        // @ts-ignore
        gpu_counter_map.vertex_count = i;
      }
      if (paras[i] === 'Primitive Count') {
        // @ts-ignore
        gpu_counter_map.primitives_count = i;
      }
      if (paras[i] === 'Visible Primitive Count') {
        // @ts-ignore
        gpu_counter_map.visible_primitives_count = i;
      }
      if (paras[i] === 'Compute Shader Invocations') {
        // @ts-ignore
        gpu_counter_map.compute_invocations_count = i;
      }

      if (paras[i] === 'Shader Core Utilization') {
        // @ts-ignore
        gpu_counter_map.shader_utilization = i;
      }
      if (paras[i] === 'EU Utilization') {
        // @ts-ignore
        gpu_counter_map.eu_utilization = i;
      }
      if (paras[i] === 'EU Stall') {
        // @ts-ignore
        gpu_counter_map.eu_stall_utilization = i;
      }
      if (paras[i] === 'EU Idle') {
        // @ts-ignore
        gpu_counter_map.eu_idle_utilization = i;
      }
      if (paras[i] === 'Instructions Diverged') {
        // @ts-ignore
        gpu_counter_map.control_flow_instr_utilization = i;
      }
      if (paras[i] === 'Half-float Instructions') {
        // @ts-ignore
        gpu_counter_map.half_float_instr_utilization = i;
      }
      if (paras[i] === 'TU Utilization') {
        // @ts-ignore
        gpu_counter_map.tu_utilization = i;
      }

      if (paras[i] === 'Concurrent Warps') {
        // @ts-ignore
        gpu_counter_map.concurrent_warps = i;
      }
      if (paras[i] === 'Instructions Executed') {
        // @ts-ignore
        gpu_counter_map.instruction_count = i;
      }
      if (paras[i] === 'Quads Shaded') {
        // @ts-ignore
        gpu_counter_map.quads_count = i;
      }
      if (paras[i] === 'Texels Sampled') {
        // @ts-ignore
        gpu_counter_map.texels_count = i;
      }

      if (paras[i] === 'External Memory Read') {
        // @ts-ignore
        gpu_counter_map.memory_read = i;
      }
      if (paras[i] === 'External Memory Write') {
        // @ts-ignore
        gpu_counter_map.memory_write = i;
      }
      if (paras[i] === 'External Memory Traffic') {
        // @ts-ignore
        gpu_counter_map.memory_traffic = i;
      }
    }
  }

  groupByGpuCounterType(maleoonCounter: MaleoonCounterObj): GpuCounterType {
    const gpuCounterType = new GpuCounterType();
    let index = 0;
    for (const key in maleoonCounter) {
      if (index < 5) {
        gpuCounterType.cycle.push(maleoonCounter[key]);
      }
      if (index >= 5 && index < 10) {
        gpuCounterType.drawcall.push(maleoonCounter[key]);
      }
      if (index >= 10 && index < 17) {
        gpuCounterType.shader_cycle.push(maleoonCounter[key]);
      }
      if (index >= 17 && index < 21) {
        gpuCounterType.local_count.push(maleoonCounter[key]);
      }
      if (index >= 21 && index < 24) {
        gpuCounterType.local_wr.push(maleoonCounter[key]);
      }
      index++;
    }
    return gpuCounterType;
  }

  /**
   * 监听文件上传事件
   * @param row
   * @param start_ts
   */
  addTraceRowEventListener(startTime: number, endTime: number): void {
    this.folderRow?.uploadEl?.addEventListener('sample-file-change', (e: unknown) => {
      this.getCsvData(e).then((res: unknown) => {
        this.resetChartData(this.folderRow!);
        // @ts-ignore
        const { gpuCounterType } = this.handleCsvData(res, startTime, endTime);
        this.initGpuCounters(gpuCounterType, startTime);
        if (!this.folderRow!.folder) {
          this.folderRow!.folder = true;
        }
      });
    });
  }

  /**
   * 清空缓存
   * @param row
   */
  // @ts-ignore
  resetChartData(row: TraceRow<unknown>): void {
    if (row.expansion) {
      row.describeEl?.click();
    }
    row.childrenList = [];
  }

  getMinData(list: Array<unknown>): number {
    // @ts-ignore
    const sliceList = list.slice(1, 11).map((item) => Number(item.split(',')[0]));
    const nonZeroList = sliceList.filter((item) => item !== 0).sort((a, b) => a - b);
    const minIndex = sliceList.findIndex((item) => item === nonZeroList[0]);
    return minIndex;
  }

  /**
   * 获取上传的文件内容 转为json格式
   * @param file
   * @returns
   */
  getCsvData(file: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      // @ts-ignore
      reader.readAsText(file.detail || file);
      reader.onloadend = (e: unknown): void => {
        // @ts-ignore
        const fileContent = e.target?.result.split(/[\r\n]/).filter(Boolean);
        try {
          resolve(fileContent);
          document.dispatchEvent(new CustomEvent('file-correct'));
        } catch (error) {
          document.dispatchEvent(new CustomEvent('file-error'));
        }
      };
    });
  }
}
