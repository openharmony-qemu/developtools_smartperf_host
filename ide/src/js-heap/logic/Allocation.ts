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

import { AllocationFunction } from '../model/UiStruct';
import { FileStruct, HeapTraceFunctionInfo } from '../model/DatabaseStruct';

export class AllocationLogic {
  private fileStruct: FileStruct;
  private traceNodes: Array<AllocationFunction>;
  private bottomUpList: Array<AllocationFunction>;

  constructor(fileStruct: FileStruct) {
    this.fileStruct = fileStruct;
    this.bottomUpList = [];
    this.traceNodes = this.fileStruct.snapshotStruct.traceNodes;
    this.setBottomUpTree();
  }

  private setBottomUpTree() {
    let keyMap = new Map<String, AllocationFunction>();
    for (let node of this.traceNodes) {
      if (node.parentsId.length > 1) {
        node.hasParent = true;
      } else if (node.parentsId.length == 0) {
        node.hasParent = false;
      } else {
        if (node.parentsId[0] == -1) {
          node.hasParent = false;
        } else {
          node.hasParent = true;
        }
      }
      // combine node
      if (keyMap.has(node.name + node.functionIndex)) {
        let uniqueNode = keyMap.get(node.name + node.functionIndex);
        if (!uniqueNode) continue;
        uniqueNode.size += node.size;
        uniqueNode.count += node.count;
        uniqueNode.liveSize += node.liveSize;
        uniqueNode.liveCount += node.liveCount;
        uniqueNode.parentsId.push(...node.parentsId);
        uniqueNode.combineId.add(uniqueNode.id);
        uniqueNode.combineId.add(node.id);
      } else {
        keyMap.set(node.name + node.functionIndex, node);
        node.combineId.add(node.id);
        this.bottomUpList.push(node);
      }
    }
    this.bottomUpList.sort(function (a, b) {
      return b.size - a.size;
    });
  }

  private getNodeById(id: number): AllocationFunction | null {
    for (let func of this.bottomUpList) {
      if (func.id == id) {
        return func;
      }
    }
    return null;
  }

  private getFunctionStack(node: AllocationFunction, functionList: Array<HeapTraceFunctionInfo>) {
    functionList.push(this.fileStruct.snapshotStruct.functionInfos[node.functionIndex]);
    if (node.parentsId.length > 0) {
      for (let parentId of node.parentsId) {
        let parentNode = this.getNodeById(parentId);
        if (parentNode) {
          this.getFunctionStack(parentNode, functionList);
        }
      }
    }
  }

  /**
   * get Bottom Up FUnction List
   * @returns bottomUpList
   */
  public getFunctionList(): Array<AllocationFunction> {
    return this.bottomUpList;
  }

  /**
   * set node parents node
   * node has multi parent because bottom up combine multi node
   * @param node selected node
   */
  public getParent(node: AllocationFunction) {
    if (node.hasParent) {
      if (node.parentsId.length > 1) {
        for (let childrenId of node.parentsId) {
          let children = this.traceNodes[childrenId - 1].clone();
          children.size = node.size;
          children.count = node.count;
          children.liveSize = node.liveSize;
          children.liveCount = node.liveCount;
          node.parents.push(children);
        }
      } else if ((node.parentsId.length = 1)) {
        let childrenId = node.parentsId[0];
        if (!node.parents) node.parents = new Array<AllocationFunction>();
        let children = this.traceNodes[childrenId - 1].clone();
        children.size = node.size;
        children.count = node.count;
        children.liveSize = node.liveSize;
        children.liveCount = node.liveCount;
        node.parents.push(children);
        this.getParent(children);
      } else {
        // no need to do anything
      }
    }
  }

  /**
   * get use bottom up method combine's node ids
   * @param allocationNodeId node id
   * @returns node combine id
   */
  public getFunctionNodeIds(allocationNodeId: number): Array<number> {
    let node = this.getNodeById(allocationNodeId);
    if (node) {
      return Array.from(node.combineId);
    } else {
      return [];
    }
  }

  /**
   * get full stack for node
   * @param allocationNodeId node.traceNodeId
   * @returns stack list
   */
  public getNodeStack(allocationNodeId: number): Array<HeapTraceFunctionInfo> {
    let currentNode = this.getNodeById(allocationNodeId);
    let functionList = new Array<HeapTraceFunctionInfo>();
    if (currentNode) {
      this.getFunctionStack(currentNode, functionList);
    }
    return functionList;
  }
}
