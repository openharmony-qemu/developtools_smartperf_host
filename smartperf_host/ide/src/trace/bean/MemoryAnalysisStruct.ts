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
import { MemoryStatisticType, MemoryTraceRowType, MemoryType } from "./MemoryEnum";


function getBinaryByteWithUnit(bytes: number): string {
  if (bytes === 0) {
    return '0Bytes';
  }
  let currentBytes = bytes;
  let kib1 = 1024;
  let mib1 = 1024 * 1024;
  let gib1 = 1024 * 1024 * 1024;
  let res = '';
  if (bytes < 0) {
    res = '-';
    currentBytes = Math.abs(currentBytes);
  }
  if (currentBytes >= gib1) {
    res += `${(currentBytes / gib1).toFixed(2)}GB`;
  } else if (currentBytes >= mib1) {
    res += `${(currentBytes / mib1).toFixed(2)}MB`;
  } else if (currentBytes >= kib1) {
    res += `${(currentBytes / kib1).toFixed(2)}KB`;
  } else {
    res += `${currentBytes.toFixed(2)}Bytes`;
  }
  return res;
}


export class AnalysisObj {
  tName?: string;
  tid?: number;
  typeName?: string;
  typeId?: number;
  libName?: string;
  libId?: number;
  symbolName?: string;
  symbolId?: number;

  tableName = '';

  applySize: number;
  applySizeFormat: string;
  applyCount: number;
  releaseSize: number;
  releaseSizeFormat: string;
  releaseCount: number;
  existSize: number;
  existSizeFormat: string;
  existCount: number;

  applySizePercent?: number | string;
  applyCountPercent?: number | string;
  releaseSizePercent?: number | string;
  releaseCountPercent?: number | string;
  existSizePercent?: number | string;
  existCountPercent?: number | string;

  constructor(applySize: number, applyCount: number, releaseSize: number, releaseCount: number) {
    this.applySize = applySize;
    this.applyCount = applyCount;
    this.releaseSize = releaseSize;
    this.releaseCount = releaseCount;
    this.existSize = applySize - releaseSize;
    this.existCount = applyCount - releaseCount;
    this.applySizeFormat = getBinaryByteWithUnit(this.applySize);
    this.releaseSizeFormat = getBinaryByteWithUnit(this.releaseSize);
    this.existSizeFormat = getBinaryByteWithUnit(this.existSize);
  }
}

export class SizeObj {
  applySize = 0;
  applyCount = 0;
  releaseSize = 0;
  releaseCount = 0;
}


export class AnalysisSample {
  id: number;
  count: number;
  size: number;
  type: number;
  typeName?: string;
  startTs: number;

  isRelease: boolean;
  releaseCount?: number;
  releaseSize?: number;

  endTs?: number;
  subType?: string;
  tid?: number;
  threadName?: string;
  addr?: string;

  libId!: number;
  libName!: string;
  symbolId!: number;
  symbolName!: string;


  private nativeMemoryInit(type: number | string): void {
    switch (type) {
      case MemoryType.MEMORY_M_ALLOC_NAME:
      case MemoryStatisticType.MALLOC:
        this.type = 0;
        this.typeName = MemoryType.MEMORY_M_ALLOC_NAME;
        this.isRelease = false;
        break;
      case MemoryType.MEMORY_M_MAP_NAME:
      case MemoryStatisticType.MMAP:
        this.isRelease = false;
        this.typeName = MemoryType.MEMORY_M_MAP_NAME;
        this.type = 1;
        break;
      case MemoryType.MEMORY_M_FILE_PAGE_MSG:
      case MemoryStatisticType.FILE_PAGE_MSG:
        this.isRelease = false;
        this.typeName = MemoryType.MEMORY_M_FILE_PAGE_MSG;
        this.type = 2;
        break;
      case MemoryType.MEMORY_M_MEMORY_USING_MSG:
      case MemoryStatisticType.MEMORY_USING_MSG:
        this.isRelease = false;
        this.typeName = MemoryType.MEMORY_M_MEMORY_USING_MSG;
        this.type = 3;
        break;
      case MemoryType.MEMORY_M_FREE_NAME:
        this.isRelease = true;
        this.typeName = MemoryType.MEMORY_M_FREE_NAME;
        this.type = 2;
        break;
      case MemoryType.MEMORY_M_UNMAP_NAME:
        this.isRelease = true;
        this.typeName = MemoryType.MEMORY_M_UNMAP_NAME;
        this.type = 3;
        break;
      case MemoryType.ARKTS_Alloc_NAME:
      case MemoryStatisticType.ARKTS:
        this.type = 10;
        this.typeName = MemoryType.ARKTS_Alloc_NAME;
        this.isRelease = false;
        break;
      case MemoryType.JS_Alloc_NAME:
      case MemoryStatisticType.JS:
        this.type = 11;
        this.typeName = MemoryType.JS_Alloc_NAME;
        this.isRelease = false;
        break;
      case MemoryType.KMP_Alloc_NAME:
      case MemoryStatisticType.KMP:
        this.type = 12;
        this.typeName = MemoryType.KMP_Alloc_NAME;
        this.isRelease = false;
        break;
      case MemoryType.ION_Alloc_NAME:
      case MemoryStatisticType.DMA:
        this.type = 15;
        this.typeName = MemoryType.ION_Alloc_NAME;
        this.isRelease = false;
        break;
      case MemoryType.SO_Alloc_NAME:
      case MemoryStatisticType.SO:
        this.type = 9;
        this.typeName = MemoryType.SO_Alloc_NAME;
        this.isRelease = false;
        break;
      case MemoryType.ASHMEM_Alloc_NAME:
      case MemoryStatisticType.ASHMEM:
        this.type = 14;
        this.typeName = MemoryType.ASHMEM_Alloc_NAME;
        this.isRelease = false;
        break;
      case MemoryType.ARKTS_Free_NAME:
        this.isRelease = true;
        this.typeName = MemoryType.ARKTS_Free_NAME;
        this.type = 17;
        break;
      case MemoryType.JS_Free_NAME:
        this.isRelease = true;
        this.typeName = MemoryType.JS_Free_NAME;
        this.type = 18;
        break;
      case MemoryType.KMP_Free_NAME:
        this.isRelease = true;
        this.typeName = MemoryType.KMP_Free_NAME;
        this.type = 19;
        break;
      case MemoryType.ION_Free_NAME:
        this.isRelease = true;
        this.typeName = MemoryType.ION_Free_NAME;
        this.type = 20;
        break;
      case MemoryType.SO_Free_NAME:
        this.isRelease = true;
        this.typeName = MemoryType.SO_Free_NAME;
        this.type = 21;
        break;
      case MemoryType.ASHMEM_Free_NAME:
        this.isRelease = true;
        this.typeName = MemoryType.ASHMEM_Free_NAME;
        this.type = 22;
        break;
      default:
        this.isRelease = false;
        this.type = -1;
    }
  }

  private gpuMemoryInit(type: number | string): void {
    switch (type) {
      case MemoryType.GPU_VK_Alloc_NAME:
        this.isRelease = false;
        this.type = 0;
        this.typeName = MemoryType.GPU_VK_Alloc_NAME;
        break;
      case MemoryType.GPU_GLES_Alloc_NAME:
        this.isRelease = false;
        this.type = 1;
        this.typeName = MemoryType.GPU_GLES_Alloc_NAME;
        break;
      case MemoryType.GPU_CL_Alloc_NAME:
        this.isRelease = false;
        this.type = 2;
        this.typeName = MemoryType.GPU_CL_Alloc_NAME;
        break;
      case MemoryType.GPU_VK_Free_NAME:
        this.isRelease = true;
        this.type = 3;
        this.typeName = MemoryType.GPU_VK_Free_NAME;
        break;
      case MemoryType.GPU_GLES_Free_NAME:
        this.isRelease = true;
        this.type = 4;
        this.typeName = MemoryType.GPU_GLES_Free_NAME;
        break;
      case MemoryType.GPU_CL_Free_NAME:
        this.isRelease = true;
        this.type = 5;
        this.typeName = MemoryType.GPU_CL_Free_NAME;
        break;
      case MemoryType.GPU_VK_SIMPLE_NAME:
      case MemoryStatisticType.GPU_VK:
        this.type = 6;
        this.isRelease = false;
        this.typeName = MemoryType.GPU_VK_SIMPLE_NAME;
        break;
      case MemoryType.GPU_GLES_SIMPLE_NAME:
      case MemoryStatisticType.GPU_GLES:
        this.isRelease = false;
        this.type = 7;
        this.typeName = MemoryType.GPU_GLES_SIMPLE_NAME;
        break;
      case MemoryType.GPU_CL_SIMPLE_NAME:
      case MemoryStatisticType.GPU_CL:
        this.isRelease = false;
        this.type = 8;
        this.typeName = MemoryType.GPU_CL_SIMPLE_NAME;
        break;
      default:
        this.isRelease = false;
        this.type = -1;
    }
  }

  private otherSourceMemoryInit(type: number | string): void {
    switch (type) {
      case MemoryType.FD_SIMPLE_NAME:
      case MemoryType.FD_OPEN_NAME:
      case MemoryStatisticType.FD:
        this.typeName = MemoryType.FD_SIMPLE_NAME;
        this.type = 4;
        this.isRelease = false;
        break;
      case MemoryType.THREAD_SIMPLE_NAME:
      case MemoryType.THREAD_CREATE_NAME:
      case MemoryStatisticType.THREAD:
        this.typeName = MemoryType.THREAD_SIMPLE_NAME;
        this.isRelease = false;
        this.type = 5;
        break;
      case MemoryType.FD_CLOSE_NAME:
        this.isRelease = true;
        this.type = 6;
        this.typeName = MemoryType.FD_SIMPLE_NAME;
        break;
      case MemoryType.THREAD_DESTROY_NAME:
        this.isRelease = true;
        this.type = 7;
        this.typeName = MemoryType.THREAD_SIMPLE_NAME;
        break;
      default:
        this.isRelease = false;
        this.type = -1;
    }
  }

  constructor(id: number, size: number, count: number, type: number | string, startTs: number, memoryType: string) {
    this.id = id;
    this.size = size;
    this.count = count;
    this.startTs = startTs;
    this.isRelease = false;
    this.type = -1;
    switch (memoryType) {
      case MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY:
        this.nativeMemoryInit(type);
        break;
      case MemoryTraceRowType.ROW_TYPE_GPU_MEMORY:
        this.gpuMemoryInit(type as string);
        break;
      case MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE:
        this.otherSourceMemoryInit(type as string);
    }
  }
}
