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
import { HeapDataInterface, ParseListener } from './HeapDataInterface';
import { AllocationFunction, FileType } from './model/UiStruct';
import { getTimeForLog } from './utils/Utils';
import { HeapNode, FileStruct } from './model/DatabaseStruct';
import { info } from '../log/Log';
import {
  queryHeapEdge,
  queryHeapFile,
  queryHeapInfo,
  queryHeapNode,
  queryHeapSample,
  queryHeapString,
} from '../trace/database/sql/SqlLite.sql';
import { queryHeapFunction, queryHeapTraceNode } from '../trace/database/sql/Func.sql';

export class LoadDatabase {
  private static loadDB: LoadDatabase;
  private fileModule!: Array<FileStruct>;

  static getInstance(): LoadDatabase {
    if (!this.loadDB) {
      this.loadDB = new LoadDatabase();
    }
    return this.loadDB;
  }

  private async loadFile(listener: ParseListener): Promise<void> {
    this.fileModule = [];
    let results = await queryHeapFile();
    for (let row of results) {
      let fileStruct = new FileStruct();
      fileStruct.id = row.id;
      fileStruct.name = row.name;
      fileStruct.startTs = row.startTs;
      fileStruct.endTs = row.endTs;
      fileStruct.pid = row.pid;
      fileStruct.size = row.size;
      if (fileStruct.name.startsWith('Snapshot')) {
        fileStruct.type = FileType.SNAPSHOT;
      } else {
        fileStruct.type = FileType.TIMELINE;
      }
      info(`read ${fileStruct.name} from db  ${getTimeForLog()}`);
      await this.loadInfo(fileStruct);
      await this.loadStrings(fileStruct);
      await this.loadNode(fileStruct);
      await this.loadEdge(fileStruct);
      await this.loadTraceFunctionInfos(fileStruct);
      await this.loadTraceTree(fileStruct);
      await this.loadSamples(fileStruct);
      info(`read ${fileStruct.name} from db Success  ${getTimeForLog()}`);
      this.fileModule.push(fileStruct);
    }
    let dataParse = HeapDataInterface.getInstance();
    dataParse.setPraseListener(listener);
    dataParse.parseData(this.fileModule);
  }

  private async loadInfo(file: FileStruct): Promise<void> {
    let result = await queryHeapInfo(file.id);
    for (let row of result) {
      //@ts-ignore
      if (row.key.includes('types')) {
        continue;
      }
      //@ts-ignore
      switch (row.key) {
        case 'node_count':
          //@ts-ignore
          file.snapshotStruct.nodeCount = row.intValue;
          break;
        case 'edge_count':
          //@ts-ignore
          file.snapshotStruct.edgeCount = row.intValue;
          break;
        case 'trace_function_count':
          //@ts-ignore
          file.snapshotStruct.functionCount = row.intValue;
          break;
      }
    }
  }

  private async loadNode(file: FileStruct): Promise<void> {
    let result = await queryHeapNode(file.id);
    let heapNodes = file.snapshotStruct.nodeMap;
    let firstEdgeIndex = 0;
    for (let row of result) {
      let node = new HeapNode(
        file.id,
        row.nodeIndex,
        row.type,
        file.snapshotStruct.strings[row.nameIdx],
        row.id,
        row.selfSize,
        row.edgeCount,
        row.traceNodeId,
        row.detachedness,
        firstEdgeIndex
      );
      if (file.snapshotStruct.rootNodeId === -1) {
        file.snapshotStruct.rootNodeId = row.id;
      }
      heapNodes.set(node.id, node);
      firstEdgeIndex += row.edgeCount;
    }
  }

  private async loadEdge(file: FileStruct): Promise<void> {
    file.snapshotStruct.edges = await queryHeapEdge(file.id);
  }

  private async loadTraceFunctionInfos(file: FileStruct): Promise<void> {
    file.snapshotStruct.functionInfos = await queryHeapFunction(file.id);
  }

  private async loadTraceTree(file: FileStruct): Promise<void> {
    let result = await queryHeapTraceNode(file.id);
    let heapTraceNode = file.snapshotStruct.traceNodes;
    let strings = file.snapshotStruct.strings;
    for (let row of result) {
      let traceNode = new AllocationFunction(
        //@ts-ignore
        row.id,
        //@ts-ignore
        strings[row.name],
        //@ts-ignore
        strings[row.scriptName],
        //@ts-ignore
        row.scriptId,
        //@ts-ignore
        row.line,
        //@ts-ignore
        row.column,
        //@ts-ignore
        row.count,
        //@ts-ignore
        row.size,
        //@ts-ignore
        row.liveCount,
        //@ts-ignore
        row.liveSize,
        false
      );
      //@ts-ignore
      traceNode.parentsId.push(row.parentId);
      //@ts-ignore
      traceNode.functionIndex = row.functionInfoIndex;
      traceNode.fileId = file.id;
      heapTraceNode.push(traceNode);
    }
  }

  private async loadSamples(file: FileStruct): Promise<void> {
    file.snapshotStruct.samples = await queryHeapSample(file.id);
  }

  private async loadStrings(file: FileStruct): Promise<void> {
    let result = await queryHeapString(file.id);
    for (let data of result) {
      //@ts-ignore
      file.snapshotStruct.strings.push(data.string);
    }
  }

  async loadDatabase(listener: ParseListener): Promise<void> {
    await this.loadFile(listener);
  }
}
