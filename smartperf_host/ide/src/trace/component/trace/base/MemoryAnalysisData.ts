/*
 * Copyright (C) 2025-2026 Huawei Device Co., Ltd.
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

import { SelectionParam } from "../../../bean/BoxSelection";
import { AnalysisObj, AnalysisSample, SizeObj } from "../../../bean/MemoryAnalysisStruct";
import { getCurrentTypes, MemoryBasicType, MemoryStatisticType, MemoryTraceRowType, MemoryType } from "../../../bean/MemoryEnum";
import { procedurePool } from "../../../database/Procedure";
import { queryNativeHookResponseTypes } from "../../../database/sql/NativeHook.sql";
import { SpSystemTrace } from "../../SpSystemTrace";
import { Utils } from "./Utils";

const PIE_CHART_LIMIT = 20;

interface TypeConfig {
  eventId: number; // 内存类型
  eventType: string; // 内存类型名称
  hasSubType: boolean; // 是否有子类型
}

// 内存类型 对应显示名称
const typeConfigs: TypeConfig[] = [
  { eventId: MemoryStatisticType.MALLOC, eventType: MemoryType.MEMORY_M_ALLOC_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.ARK_GLOBAL_HANDLE, eventType: MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.ARK_LOCAL_HANDLE, eventType: MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.MMAP, eventType: MemoryType.MEMORY_M_MAP_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.FILE_PAGE_MSG, eventType: MemoryType.MEMORY_M_FILE_PAGE_MSG, hasSubType: true },
  { eventId: MemoryStatisticType.MEMORY_USING_MSG, eventType: MemoryType.MEMORY_M_MEMORY_USING_MSG, hasSubType: true },
  { eventId: MemoryStatisticType.ARKTS, eventType: MemoryType.ARKTS_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.JS, eventType: MemoryType.JS_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.DART_HEAP, eventType: MemoryType.DART_HEAP_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.ARKTS_STATIC_HEAP, eventType: MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.RN, eventType: MemoryType.RN_HERMES_HEAP_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.KMP, eventType: MemoryType.KMP_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.DMA, eventType: MemoryType.ION_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.ASHMEM, eventType: MemoryType.ASHMEM_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.SO, eventType: MemoryType.SO_Alloc_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.GPU_VK, eventType: MemoryType.GPU_VK_SIMPLE_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.GPU_GLES, eventType: MemoryType.GPU_GLES_SIMPLE_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.GPU_CL, eventType: MemoryType.GPU_CL_SIMPLE_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.FD, eventType: MemoryType.FD_SIMPLE_NAME, hasSubType: true },
  { eventId: MemoryStatisticType.THREAD, eventType: MemoryType.THREAD_SIMPLE_NAME, hasSubType: true },
];

interface ResponseTypeMapping {
  selectionKey: string;
  statisticTypes?: number[];
  normalTypes?: string[];
}

interface InitConfig {
  mappings: ResponseTypeMapping[];
}

export interface AnalysisUICallback {
  loading(isLoading: boolean): void;
  setTypeChartData(data: Array<AnalysisObj>, statisticData: AnalysisObj): void;
  setThreadChartData(data: Array<AnalysisObj>, statisticData: AnalysisObj): void;
  setLibChartData(data: Array<AnalysisObj>, statisticData: AnalysisObj): void;
  setFunctionChartData(data: Array<AnalysisObj>, statisticData: AnalysisObj): void;
}

export class MemoryAnalysisDataLogic {

  private uiCallBack?: AnalysisUICallback;
  private isStatistic!: boolean;
  private memoryType!: MemoryTraceRowType;
  private currentLevelApplySize = 0; // 当前层级申请内存大小
  private currentLevelReleaseSize = 0; // 当前层级释放内存大小
  private currentLevelExistSize = 0; // 当前层级存在内存大小
  private currentLevelApplyCount = 0; // 当前层级申请次数
  private currentLevelReleaseCount = 0; // 当前层级释放次数
  private currentLevelExistCount = 0; // 当前层级存在内存大小

  private processData!: Array<AnalysisSample>; // 当前框选范围从数据从数据库查询到的数据
  private eventTypeData!: Array<AnalysisObj>; // 类型页数据
  private threadData!: Array<AnalysisObj>; // 线程页数据
  private libData!: Array<AnalysisObj>; // Lib页数据
  private functionData!: Array<AnalysisObj>; // 函数页数据
  private typeMap!: Map<number, Array<AnalysisSample>>; // 当前框选范围从数据从数据库查询到的数据根据EventType分组

  init(memoryType: MemoryTraceRowType, isStatistic: boolean) {
    this.isStatistic = isStatistic;
    this.memoryType = memoryType;
  }

  setUiInterface(uiInterface: AnalysisUICallback): void {
    this.uiCallBack = uiInterface;
  }

  setIsStatistic(isStatistic: boolean): void {
    this.isStatistic = isStatistic;
  }

  setMemoryType(memoryType: MemoryTraceRowType): void {
    this.memoryType = memoryType;
  }

  getEventTypeData(): Array<AnalysisObj> {
    return this.eventTypeData;
  }

  getThreadData(): Array<AnalysisObj> {
    return this.threadData;
  }

  getLibData(): Array<AnalysisObj> {
    return this.libData;
  }

  getFunctionData(): Array<AnalysisObj> {
    return this.functionData;
  }
  public setCurrentSelectIPid(iPid: number): void {
    procedurePool.submitWithName('logic0', `${this.memoryType}-set-current_ipid`, iPid, undefined, (): void => { });
  }

  /**
   * 通用内存分析响应类型初始化方法
   * @param val 包含内存数据的选择参数对象
   * @param config 初始化配置，包含内存类型映射关系
   */
  private initGenericResponseTypeList<T extends SelectionParam>(
    val: T,
    config: InitConfig,
  ): void {
    // 动态生成字段名
    // 统计数据字段名（如 nativeMemoryStatistic）
    const statisticField = `${this.memoryType}Statistic` as keyof T;
    // 普通数据字段名（如 nativeMemory）
    const normalField = this.memoryType as keyof T;
    // 当前进程ID字段名（如 nativeMemoryCurrentIPid）
    const currentIPidField = `${this.memoryType}CurrentIPid` as keyof T;

    // 判断是否为统计数据模式
    const isStatistic = (val[statisticField] as unknown[]).length > 0;
    // 根据模式选择对应的数据源
    const selection = isStatistic ? val[statisticField] : val[normalField];
    let types: Array<string | number> = [];

    // 根据选择的项目匹配对应的类型
    for (const mapping of config.mappings) {
      if ((selection as unknown[]).includes(mapping.selectionKey)) {
        if (isStatistic && mapping.statisticTypes) {
          types.push(...mapping.statisticTypes);
        } else if (!isStatistic && mapping.normalTypes) {
          types.push(...mapping.normalTypes);
        }
      }
    }

    queryNativeHookResponseTypes(
      val.leftNs,
      val.rightNs,
      types,
      val[currentIPidField] as number,
      isStatistic
    ).then((res): void => {
      procedurePool.submitWithName('logic0', `${this.memoryType}-init-responseType`, res, undefined, (): void => { });
    });
  }

  private initNativeMemoryResponseTypeList(val: SelectionParam): void {
    this.initGenericResponseTypeList(val, {
      mappings: [
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[0], // All Heap & Anonymous VM
          statisticTypes: [
            MemoryStatisticType.MALLOC,
            MemoryStatisticType.ARK_GLOBAL_HANDLE,
            MemoryStatisticType.ARK_LOCAL_HANDLE,
            MemoryStatisticType.MMAP,
            MemoryStatisticType.FILE_PAGE_MSG,
            MemoryStatisticType.MEMORY_USING_MSG,
            MemoryStatisticType.ARKTS,
            MemoryStatisticType.JS,
            MemoryStatisticType.DART_HEAP,
            MemoryStatisticType.ARKTS_STATIC_HEAP,
            MemoryStatisticType.RN,
            MemoryStatisticType.KMP,
            MemoryStatisticType.SO,
            MemoryStatisticType.ASHMEM,
            MemoryStatisticType.DMA
          ],
          normalTypes: [
            `'${MemoryType.MEMORY_M_ALLOC_NAME}'`,
            `'${MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME}'`,
            `'${MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME}'`,
            `'${MemoryType.MEMORY_M_MAP_NAME}'`,
            `'${MemoryType.ARKTS_Alloc_NAME}'`,
            `'${MemoryType.JS_Alloc_NAME}'`,
            `'${MemoryType.DART_HEAP_Alloc_NAME}'`,
            `'${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}'`,
            `'${MemoryType.RN_HERMES_HEAP_Alloc_NAME}'`,
            `'${MemoryType.KMP_Alloc_NAME}'`,
            `'${MemoryType.SO_Alloc_NAME}'`,
            `'${MemoryType.ASHMEM_Alloc_NAME}'`,
            `'${MemoryType.ION_Alloc_NAME}'`
          ]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[1], // All Heap (泳道组)
          statisticTypes: [
            MemoryStatisticType.MALLOC,
            MemoryStatisticType.ARK_GLOBAL_HANDLE,
            MemoryStatisticType.ARK_LOCAL_HANDLE,
            MemoryStatisticType.ARKTS,
            MemoryStatisticType.JS,
            MemoryStatisticType.DART_HEAP,
            MemoryStatisticType.ARKTS_STATIC_HEAP,
            MemoryStatisticType.RN,
            MemoryStatisticType.KMP
          ],
          normalTypes: [
            `'${MemoryType.MEMORY_M_ALLOC_NAME}'`,
            `'${MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME}'`,
            `'${MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME}'`,
            `'${MemoryType.ARKTS_Alloc_NAME}'`,
            `'${MemoryType.JS_Alloc_NAME}'`,
            `'${MemoryType.DART_HEAP_Alloc_NAME}'`,
            `'${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}'`,
            `'${MemoryType.RN_HERMES_HEAP_Alloc_NAME}'`,
            `'${MemoryType.KMP_Alloc_NAME}'`
          ]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[2], // Native Heap
          statisticTypes: [MemoryStatisticType.MALLOC, MemoryStatisticType.ARK_GLOBAL_HANDLE, MemoryStatisticType.ARK_LOCAL_HANDLE],
          normalTypes: [`'${MemoryType.MEMORY_M_ALLOC_NAME}'`, `'${MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME}'`, `'${MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[3], // ArkTs Heap
          statisticTypes: [MemoryStatisticType.ARKTS],
          normalTypes: [`'${MemoryType.ARKTS_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[4], // ArkWeb Heap
          statisticTypes: [MemoryStatisticType.JS],
          normalTypes: [`'${MemoryType.JS_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[5], // DART HEAP
          statisticTypes: [MemoryStatisticType.DART_HEAP],
          normalTypes: [`'${MemoryType.DART_HEAP_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[6], // ArkTS Static Heap
          statisticTypes: [MemoryStatisticType.ARKTS_STATIC_HEAP],
          normalTypes: [`'${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[7], // RN HEAP
          statisticTypes: [MemoryStatisticType.RN],
          normalTypes: [`'${MemoryType.RN_HERMES_HEAP_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[8], // KMP Heap
          statisticTypes: [MemoryStatisticType.KMP],
          normalTypes: [`'${MemoryType.KMP_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[9], // All Anonymous VM (泳道组)
          statisticTypes: [
            MemoryStatisticType.MMAP,
            MemoryStatisticType.FILE_PAGE_MSG,
            MemoryStatisticType.MEMORY_USING_MSG,
            MemoryStatisticType.SO,
            MemoryStatisticType.ASHMEM,
            MemoryStatisticType.DMA
          ],
          normalTypes: [
            `'${MemoryType.MEMORY_M_MAP_NAME}'`,
            `'${MemoryType.SO_Alloc_NAME}'`,
            `'${MemoryType.ASHMEM_Alloc_NAME}'`,
            `'${MemoryType.ION_Alloc_NAME}'`
          ]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[10], // VM ION
          statisticTypes: [MemoryStatisticType.DMA],
          normalTypes: [`'${MemoryType.ION_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[11], // VM Ashmem
          statisticTypes: [MemoryStatisticType.ASHMEM],
          normalTypes: [`'${MemoryType.ASHMEM_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[12], // VM SO
          statisticTypes: [MemoryStatisticType.SO],
          normalTypes: [`'${MemoryType.SO_Alloc_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.NATIVE_MEMORY[13], // VM Others
          statisticTypes: [
            MemoryStatisticType.MMAP,
            MemoryStatisticType.FILE_PAGE_MSG,
            MemoryStatisticType.MEMORY_USING_MSG
          ],
          normalTypes: [`'${MemoryType.MEMORY_M_MAP_NAME}'`]
        }
      ]
    });
  }

  private initGpuResponseTypeList(val: SelectionParam): void {
    this.initGenericResponseTypeList(val, {
      mappings: [
        {
          selectionKey: MemoryBasicType.GPU_MEMORY[0],
          statisticTypes: [
            MemoryStatisticType.GPU_VK,
            MemoryStatisticType.GPU_GLES,
            MemoryStatisticType.GPU_CL
          ],
          normalTypes: ["'VulKan'", "'OpenGLES'", "'OpenCL'"]
        },
        {
          selectionKey: MemoryBasicType.GPU_MEMORY[1],
          statisticTypes: [MemoryStatisticType.GPU_VK],
          normalTypes: ["'VulKan'"]
        },
        {
          selectionKey: MemoryBasicType.GPU_MEMORY[2],
          statisticTypes: [MemoryStatisticType.GPU_GLES],
          normalTypes: ["'OpenGLES'"]
        },
        {
          selectionKey: MemoryBasicType.GPU_MEMORY[3],
          statisticTypes: [MemoryStatisticType.GPU_CL],
          normalTypes: ["'OpenCL'"]
        }
      ]
    });
  }

  private initOtherSourceResponseTypeList(val: SelectionParam): void {
    this.initGenericResponseTypeList(val, {
      mappings: [
        {
          selectionKey: MemoryBasicType.OTHER_SOURCE[1],
          statisticTypes: [MemoryStatisticType.FD],
          normalTypes: [`'${MemoryType.FD_OPEN_NAME}'`]
        },
        {
          selectionKey: MemoryBasicType.OTHER_SOURCE[2],
          statisticTypes: [MemoryStatisticType.THREAD],
          normalTypes: [`'${MemoryType.THREAD_CREATE_NAME}'`]
        }
      ]
    },);
  }

  public initResponseTypeList(val: SelectionParam): void {
    switch (this.memoryType) {
      case MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY:
        this.initNativeMemoryResponseTypeList(val);
        break;
      case MemoryTraceRowType.ROW_TYPE_GPU_MEMORY:
        this.initGpuResponseTypeList(val);
        break;
      case MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE:
        this.initOtherSourceResponseTypeList(val);
        break;
    }
  }

  public getEventTypeSize(val: SelectionParam): void {
    const targetFilters = getCurrentTypes(val, this.memoryType, this.isStatistic);
    this.getDataFromWorker(val, targetFilters);
  }

  /**
 * 获取类型大小数据并进行处理和统计
 * 该函数负责处理事件类型数据，计算各类事件的占比，并将结果传递给UI回调函数
 * 
 * @returns {void}
 */
  public getTypeSize(): void {
    this.resetCurrentLevelData();
    // 设置主类型Map
    this.typeMap = this.typeSizeGroup(this.processData);
    this.currentLevelExistSize = this.currentLevelApplySize - this.currentLevelReleaseSize;
    this.currentLevelExistCount = this.currentLevelApplyCount - this.currentLevelReleaseCount;
    this.eventTypeData = [];

    for (const config of typeConfigs) {
      const sampleArray = this.typeMap.get(config.eventId);

      if (!sampleArray || sampleArray.length === 0) {
        continue;
      }
      if (config.hasSubType) {
        // 子类型需要单独显示
        const subTypeMap = this.buildSubTypeMap(sampleArray, config.eventType);
        subTypeMap.forEach((arr: Array<AnalysisSample>, subType: string) => {
          const mapType = this.setTypeMap(this.typeMap, config.eventId, subType);
          if (mapType) {
            this.calPercent(mapType);
            this.eventTypeData.push(mapType);
          }
        });
      } else {
        const typeItem = this.setTypeMap(this.typeMap, config.eventId, config.eventType);
        if (typeItem) {
          this.calPercent(typeItem);
          this.eventTypeData.push(typeItem);
        }
      }
    }
    this.baseSort(this.eventTypeData);
    const typeStatisticsData = this.totalData();
    this.eventTypeData = this.sumHandler(this.eventTypeData);
    this.uiCallBack?.setTypeChartData(this.eventTypeData, typeStatisticsData);

  }

  sumHandler = (data: Array<AnalysisObj>): Array<AnalysisObj> => {
    const totals = {
      totalApplyCount: data.reduce((sum, item) => sum + item.applyCount, 0),
      totalApplySize: data.reduce((sum, item) => sum + item.applySize, 0),
      totalExistCount: data.reduce((sum, item) => sum + item.existCount, 0),
      totalExistSize: data.reduce((sum, item) => sum + item.existSize, 0),
      totalReleaseCount: data.reduce((sum, item) => sum + item.releaseCount, 0),
      totalReleaseSize: data.reduce((sum, item) => sum + item.releaseSize, 0),
    };
    const grouped = data.reduce((acc, item) => {
      const key = item.tableName;
      if (!acc[key]) {
        acc[key] = {
          ...item,
          _rawItems: [item]
        };
      } else {
        acc[key].applyCount += item.applyCount;
        acc[key].applySize += item.applySize;
        acc[key].existCount += item.existCount;
        acc[key].existSize += item.existSize;
        acc[key].releaseCount += item.releaseCount;
        acc[key].releaseSize += item.releaseSize;
        acc[key]._rawItems.push(item);
      }
      return acc;
    }, {} as Record<string, AnalysisObj & { _rawItems: AnalysisObj[] }>);
    const result = Object.values(grouped).map((group) => {
      const { _rawItems, ...finalItem } = group;
      const safePercentage = (value: number, total: number): string => {
        if (total === 0) return "0.00";
        return ((value / total) * 100).toFixed(2);
      };
      const applyCountPercent = safePercentage(group.applyCount, totals.totalApplyCount);
      const applySizePercent = safePercentage(group.applySize, totals.totalApplySize);
      const existCountPercent = safePercentage(group.existCount, totals.totalExistCount);
      const existSizePercent = safePercentage(group.existSize, totals.totalExistSize);
      const releaseCountPercent = safePercentage(group.releaseCount, totals.totalReleaseCount);
      const releaseSizePercent = safePercentage(group.releaseSize, totals.totalReleaseSize);
      return {
        ...finalItem,
        applyCountPercent,
        applySizePercent,
        existCountPercent,
        existSizePercent,
        releaseCountPercent,
        releaseSizePercent,
        applySizeFormat: Utils.getBinaryByteWithUnit(group.applySize),
        existSizeFormat: Utils.getBinaryByteWithUnit(group.existSize),
        releaseSizeFormat: Utils.getBinaryByteWithUnit(group.releaseSize)
      };
    });
    return result;
  };

  /**
   * 构建子类型映射表
   * 将样本数组按照子类型进行分组，如果子类型不存在则使用事件类型作为分组键
   * @param sampleArray - 分析样本数组
   * @param eventType - 事件类型，当样本的子类型为空时使用此值作为映射键
   * @returns 返回以子类型为键、对应样本数组为值的映射表
   */
  private buildSubTypeMap(
    sampleArray: Array<AnalysisSample>,
    eventType: string
  ): Map<string, Array<AnalysisSample>> {
    const subTypeMap = new Map<string, Array<AnalysisSample>>();
    // 遍历样本数组，按子类型分组存储
    for (const item of sampleArray) {
      const key = item.subType ?? eventType;
      const list = subTypeMap.get(key) ?? [];
      list.push(item);
      subTypeMap.set(key, list);
    }

    return subTypeMap;
  }

  private setTypeMap(typeMap: Map<number, Array<AnalysisSample>>, tyeId: number, typeName: string): AnalysisObj | null {
    let applySize = 0;
    let releaseSize = 0;
    let applyCount = 0;
    let releaseCount = 0;
    let currentType = typeMap.get(tyeId);
    if (!currentType) {
      return null;
    }
    for (let applySample of typeMap.get(tyeId)!) {
      let condition = false;
      switch (this.memoryType) {
        case MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY:
          // 子类型需要特殊处理

          // 有子类型的类型：ARKTS, ARKWEB, RN, KMP, ION, ASHMEM, SO, MMAP
          if ([MemoryStatisticType.MALLOC, MemoryStatisticType.ARK_GLOBAL_HANDLE, MemoryStatisticType.ARK_LOCAL_HANDLE, MemoryStatisticType.MMAP, MemoryStatisticType.FILE_PAGE_MSG, MemoryStatisticType.MEMORY_USING_MSG, MemoryStatisticType.ARKTS, MemoryStatisticType.JS,
          MemoryStatisticType.DART_HEAP, MemoryStatisticType.ARKTS_STATIC_HEAP, MemoryStatisticType.RN, MemoryStatisticType.KMP, MemoryStatisticType.DMA, MemoryStatisticType.ASHMEM,
          MemoryStatisticType.SO].includes(tyeId)) {
            condition = (applySample.subType && applySample.subType === typeName) || // 有子类型且与当前类型一致
              (!applySample.subType && applySample.typeName === typeName); // 没有子类型，但类型名称一致
          }
          break;
        case MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE:
        case MemoryTraceRowType.ROW_TYPE_GPU_MEMORY:
          condition = (applySample.subType && applySample.subType === typeName) || // 有子类型且与当前类型一致
            // 没有子类型，是否为主类型,由于显示的名字跟类型名字有差异，显示只显示简写，所以用StartWith;
            (!applySample.subType && applySample.typeName!.startsWith(typeName));
          break;
      }
      if (condition) {
        applySize += applySample.size;
        applyCount += applySample.count;
        if (this.isStatistic) {
          releaseSize += applySample.releaseSize!;
          releaseCount += applySample.releaseCount!;
        } else {
          if (applySample.isRelease) {
            releaseSize += applySample.size;
            releaseCount += applySample.count;
          }
        }
      }
    }
    let typeItem = new AnalysisObj(applySize, applyCount, releaseSize, releaseCount);
    typeItem.typeId = tyeId;
    typeItem.typeName = typeName;
    typeItem.tableName = typeName;
    return typeItem;
  }

  private typeSizeGroup(dbArray: Array<AnalysisSample>): Map<number, Array<AnalysisSample>> {
    let typeMap = new Map<number, Array<AnalysisSample>>();
    if (!dbArray || dbArray.length === 0) {
      return typeMap;
    }
    const setSize = (item: AnalysisSample): void => {
      this.currentLevelApplySize += item.size;
      this.currentLevelApplyCount += item.count;
      if (this.isStatistic) {
        this.currentLevelReleaseSize += item.releaseSize!;
        this.currentLevelReleaseCount += item.releaseCount!;
      } else {
        if (item.isRelease) {
          this.currentLevelReleaseSize += item.size;
          this.currentLevelReleaseCount += item.count;
        }
      }
    };
    // 根据类型设置Map
    for (let itemData of dbArray) {
      setSize(itemData);
      if (typeMap.has(itemData.type)) {
        typeMap.get(itemData.type)?.push(itemData);
      } else {
        let itemArray: Array<AnalysisSample> = [];
        itemArray.push(itemData);
        typeMap.set(itemData.type, itemArray);
      }
    }
    return typeMap;
  }

  private getDataFromWorker(val: SelectionParam, typeFilter: Array<number | string>): void {
    this.getDataByWorkerQuery(
      {
        leftNs: val.leftNs,
        rightNs: val.rightNs,
        types: typeFilter,
        isStatistic: this.isStatistic,
      },
      (results: object) => {
        this.processData = JSON.parse(JSON.stringify(results));
        this.getTypeSize();
      }
    );
  }

  private getDataByWorkerQuery(args: object, handler: Function): void {
    this.uiCallBack?.loading(true);
    procedurePool.submitWithName('logic0', `${this.memoryType}-queryAnalysis`, args, undefined, (results: object) => {
      handler(results);
      this.uiCallBack?.loading(false);
    });
  }

  private resetCurrentLevelData(parent?: AnalysisObj): void {
    if (parent) {
      this.currentLevelApplySize = parent.applySize;
      this.currentLevelApplyCount = parent.applyCount;
      this.currentLevelExistSize = parent.existSize;
      this.currentLevelExistCount = parent.existCount;
      this.currentLevelReleaseSize = parent.releaseSize;
      this.currentLevelReleaseCount = parent.releaseCount;
    } else {
      this.currentLevelApplySize = 0;
      this.currentLevelApplyCount = 0;
      this.currentLevelExistSize = 0;
      this.currentLevelExistCount = 0;
      this.currentLevelReleaseSize = 0;
      this.currentLevelReleaseCount = 0;
    }
  }

  private totalData() {
    const totalData = new AnalysisObj(0, 0, 0, 0);
    totalData.existSizeFormat = Utils.getBinaryByteWithUnit(this.currentLevelExistSize);
    totalData.existSizePercent = this.currentLevelExistSize === 0 ? 0 : ((this.currentLevelExistSize / this.currentLevelExistSize) * 100).toFixed(2);
    totalData.existCount = this.currentLevelExistCount;
    totalData.existCountPercent = this.currentLevelExistCount === 0 ? 0 : ((this.currentLevelExistCount / this.currentLevelExistCount) * 100).toFixed(2);
    totalData.releaseSizeFormat = Utils.getBinaryByteWithUnit(this.currentLevelReleaseSize);
    totalData.releaseSizePercent = this.currentLevelReleaseSize === 0 ? 0 : ((this.currentLevelReleaseSize / this.currentLevelReleaseSize) * 100).toFixed(2);
    totalData.releaseCount = this.currentLevelReleaseCount;
    totalData.releaseCountPercent = this.currentLevelReleaseCount === 0 ? 0 : ((this.currentLevelReleaseCount / this.currentLevelReleaseCount) * 100).toFixed(2);
    totalData.applySizeFormat = Utils.getBinaryByteWithUnit(this.currentLevelApplySize);
    totalData.applySizePercent = this.currentLevelApplySize === 0 ? 0 : ((this.currentLevelApplySize / this.currentLevelApplySize) * 100).toFixed(2);
    totalData.applySize = this.currentLevelApplySize;
    totalData.applyCount = this.currentLevelApplyCount;
    totalData.applyCountPercent = this.currentLevelApplyCount === 0 ? 0 : ((this.currentLevelApplyCount / this.currentLevelApplyCount) * 100).toFixed(2);
    totalData.existSize = 0;
    totalData.tableName = '';
    totalData.tName = '';
    totalData.libName = '';
    totalData.symbolName = '';
    return totalData;
  }

  private calPercent(item: AnalysisObj): void {
    item.applySizePercent = this.currentLevelApplySize === 0 ? '0' : ((item.applySize / this.currentLevelApplySize) * 100).toFixed(2);
    item.applyCountPercent = this.currentLevelApplyCount === 0 ? '0' : ((item.applyCount / this.currentLevelApplyCount) * 100).toFixed(2);
    item.releaseSizePercent = this.currentLevelReleaseSize === 0 ? '0' : ((item.releaseSize / this.currentLevelReleaseSize) * 100).toFixed(2);
    item.releaseCountPercent = this.currentLevelReleaseCount === 0 ? '0' : ((item.releaseCount / this.currentLevelReleaseCount) * 100).toFixed(2);
    item.existSizePercent = this.currentLevelExistSize === 0 ? '0' : ((item.existSize / this.currentLevelExistSize) * 100).toFixed(2);
    item.existCountPercent = this.currentLevelExistCount === 0 ? '0' : ((item.existCount / this.currentLevelExistCount) * 100).toFixed(2);
  }

  private calSizeObj(dbData: Array<AnalysisSample>): SizeObj {
    let sizeObj = new SizeObj();
    for (let item of dbData) {
      if (this.isStatistic) {
        sizeObj.applyCount += item.count;
        sizeObj.applySize += item.size;
        sizeObj.releaseCount += item.releaseCount!;
        sizeObj.releaseSize += item.releaseSize!;
      } else {

        sizeObj.applyCount += item.count;
        sizeObj.applySize += item.size;
        if (item.isRelease) {

          sizeObj.releaseCount += item.count;
          sizeObj.releaseSize += item.size;
        }
      }
    }
    return sizeObj;
  }

  private baseSort(data: Array<AnalysisObj>): void {
    // OtherSource只有count, 其他的根据Size排序
    const sortKey = this.memoryType === MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE ? 'existCount' : 'existSize';
    data.sort((a, b) => b[sortKey] - a[sortKey]);
    this.uiCallBack?.loading(false);
  }

  public getPieChartData(res: AnalysisObj[]): AnalysisObj[] {
    if (res.length > PIE_CHART_LIMIT) {
      let pieChartArr: AnalysisObj[] = [];
      let other: AnalysisObj = new AnalysisObj(0, 0, 0, 0);
      other.tableName = 'other';
      for (let i = 0; i < res.length; i++) {
        if (i < PIE_CHART_LIMIT - 1) {
          pieChartArr.push(res[i]);
        } else {
          other.existCount += res[i].existCount;
          other.existSize += res[i].existSize;
          other.applySize += res[i].applySize;
          other.applyCount += res[i].applyCount;
          other.releaseSize += res[i].releaseSize;
          other.releaseCount += res[i].releaseCount;
          other.existSizeFormat = Utils.getBinaryByteWithUnit(other.existSize);
          other.applySizeFormat = Utils.getBinaryByteWithUnit(other.applySize);
          other.releaseSizeFormat = Utils.getBinaryByteWithUnit(other.releaseSize);
          other.existSizePercent = this.currentLevelExistSize === 0 ? 0 : ((other.existSize / this.currentLevelExistSize) * 100).toFixed(2);
          other.existCountPercent = this.currentLevelExistCount === 0 ? 0 : ((other.existCount / this.currentLevelExistCount) * 100).toFixed(2);
          other.applySizePercent = this.currentLevelApplySize === 0 ? 0 : ((other.applySize / this.currentLevelApplySize) * 100).toFixed(2);
          other.applyCountPercent = this.currentLevelApplyCount === 0 ? 0 : ((other.applyCount / this.currentLevelApplyCount) * 100).toFixed(2);

          other.releaseSizePercent = this.currentLevelReleaseSize === 0 ? 0 : ((other.releaseSize / this.currentLevelReleaseSize) * 100).toFixed(2);
          other.releaseCountPercent = this.currentLevelReleaseCount === 0 ? 0 : ((other.releaseCount / this.currentLevelReleaseCount) * 100).toFixed(2);
        }
      }
      pieChartArr.push(other);
      return pieChartArr;
    }
    return res;
  }

  public getThreadSize(selectItem: AnalysisObj): void {
    this.uiCallBack?.loading(true);
    let threadMap = new Map<number, Array<AnalysisSample>>();
    this.resetCurrentLevelData(selectItem);
    for (let itemData of this.processData) {
      // 过滤不属于选中Type的数据
      if (selectItem.typeName !== (itemData.subType || itemData.typeName)) {
        continue;
      }
      if (threadMap.has(itemData.tid!)) {

        threadMap.get(itemData.tid!)?.push(itemData);
      } else {
        let itemArray: Array<AnalysisSample> = [];
        itemArray.push(itemData);
        threadMap.set(itemData.tid!, itemArray);
      }
    }
    this.threadData = [];
    threadMap.forEach((dbData: Array<AnalysisSample>, tid: number) => {
      const sizeObj = this.calSizeObj(dbData);
      let analysis = new AnalysisObj(sizeObj.applySize, sizeObj.applyCount, sizeObj.releaseSize, sizeObj.releaseCount);
      this.calPercent(analysis);
      analysis.typeId = selectItem.typeId;
      analysis.typeName = selectItem.typeName;
      analysis.tid = tid;
      if (dbData[0].threadName && dbData[0].threadName.length > 0) {

        analysis.tName = `${dbData[0].threadName}(${tid})`;
      } else {
        analysis.tName = `Thread ${tid}`;
      }
      analysis.tableName = analysis.tName;
      this.threadData.push(analysis);
    });
    this.baseSort(this.threadData);
    const threadStatisticsData = this.totalData();
    this.uiCallBack?.loading(false);
    this.uiCallBack?.setThreadChartData(this.threadData, threadStatisticsData);
  }

  public getLibSize(selectItem: AnalysisObj): void {
    this.uiCallBack?.loading(true);
    let typeId = selectItem.typeId;
    let typeName = selectItem.typeName;
    let tid = selectItem.tid;
    let libMap = new Map<number, Array<AnalysisSample>>();
    this.resetCurrentLevelData(selectItem);
    this.libData = [];
    if (!this.processData) {
      return;
    }
    for (let itemData of this.processData) {
      if (selectItem.typeName !== (itemData.subType || itemData.typeName)) {
        continue;
      }
      if (tid !== undefined && tid !== itemData.tid) {
        continue;
      }
      let libId = itemData.libId;
      if (libMap.has(libId!)) {

        libMap.get(libId)?.push(itemData);
      } else {
        let dataArray: Array<AnalysisSample> = [];
        dataArray.push(itemData);
        libMap.set(libId!, dataArray);
      }
    }
    this.libData = [];
    libMap.forEach((libItems, libId) => {
      let libPath = SpSystemTrace.DATA_DICT.get(libId)?.split('/');
      let libName = '';
      if (libPath) {
        libName = libPath[libPath.length - 1];
      }
      const sizeObj = this.calSizeObj(libItems);
      let analysis = new AnalysisObj(sizeObj.applySize, sizeObj.applyCount, sizeObj.releaseSize, sizeObj.releaseCount);
      this.calPercent(analysis);
      analysis.typeId = typeId;
      analysis.typeName = typeName;
      analysis.tid = tid;
      analysis.tName = 'Thread ' + tid;
      analysis.libId = libId;
      analysis.libName = libName;
      analysis.tableName = analysis.libName;
      this.libData.push(analysis);
    });
    this.baseSort(this.libData);
    const libStatisticsData = this.totalData();

    this.uiCallBack?.setLibChartData(this.libData, libStatisticsData);
  }

  public getFunctionSize(selectItem: AnalysisObj): void {
    this.uiCallBack?.loading(true);
    let typeId = selectItem.typeId;
    let typeName = selectItem.typeName;
    let tid = selectItem.tid;
    let libId = selectItem.libId;
    let symbolMap = new Map<number, Array<AnalysisSample>>();
    this.resetCurrentLevelData(selectItem);
    if (!this.processData) {
      return;
    }
    for (let data of this.processData) {
      // 过滤不属于选中Type & lib的数据
      if (selectItem.typeName !== (data.subType || data.typeName) || data.libId !== libId) {
        continue;
      }
      if (tid !== undefined && tid !== data.tid) {
        continue;
      }
      if (symbolMap.has(data.symbolId)) {

        symbolMap.get(data.symbolId)?.push(data);
      } else {
        let dataArray: Array<AnalysisSample> = [];
        dataArray.push(data);
        symbolMap.set(data.symbolId, dataArray);
      }
    }
    this.functionData = [];
    symbolMap.forEach((symbolItems, symbolId) => {
      let symbolPath = SpSystemTrace.DATA_DICT.get(symbolId)?.split('/');
      let symbolName = symbolPath ? symbolPath[symbolPath.length - 1] : 'null';
      const sizeObj = this.calSizeObj(symbolItems);
      let analysis = new AnalysisObj(sizeObj.applySize, sizeObj.applyCount, sizeObj.releaseSize, sizeObj.releaseCount);
      this.calPercent(analysis);
      analysis.typeId = typeId;
      analysis.typeName = typeName;
      analysis.tid = tid;
      analysis.tName = 'Thread ' + tid;
      analysis.libId = libId;
      analysis.libName = selectItem.libName;
      analysis.symbolId = symbolId;
      analysis.symbolName = symbolName;
      analysis.tableName = analysis.symbolName;
      this.functionData.push(analysis);
    });
    this.baseSort(this.functionData);
    const functionStatisticsData = this.totalData();
    this.uiCallBack?.setFunctionChartData(this.functionData, functionStatisticsData);
  }

  public getCurrentLevelData(): AnalysisObj {
    const currentTotalData = new AnalysisObj(this.currentLevelApplySize, this.currentLevelApplyCount,
      this.currentLevelReleaseSize, this.currentLevelReleaseCount);
    return currentTotalData;
  }

}