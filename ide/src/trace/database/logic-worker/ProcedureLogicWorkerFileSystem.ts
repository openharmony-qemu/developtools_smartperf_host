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

import { SelectionParam } from '../../bean/BoxSelection';
import {
  ChartStruct,
  convertJSON,
  DataCache,
  FileCallChain,
  getByteWithUnit,
  getProbablyTime,
  getTimeString,
  LogicHandler,
  MerageBean,
  merageBeanDataSplit,
  postMessage,
  setFileName,
} from './ProcedureLogicWorkerCommon';

export let FILE_TYPE_MAP = {
  '0': 'OPEN',
  '1': 'CLOSE',
  '2': 'READ',
  '3': 'WRITE',
};

export let DISKIO_TYPE_MAP = {
  '1': 'DATA_READ',
  '2': 'DATA_WRITE',
  '3': 'METADATA_READ',
  '4': 'METADATA_WRITE',
  '5': 'PAGE_IN',
  '6': 'PAGE_OUT',
};

export let VM_TYPE_MAP = {
  '1': 'File Backed In',
  '2': 'Page Cache Hit',
  '3': 'Swap From Zram',
  '4': 'Swap From Disk',
  '5': 'Zero Fill Page',
  '6': 'Zero FAKE Page',
  '7': 'Copy On Write',
};

const FS_TYPE = 0;
const PF_TYPE = 1;
const BIO_TYPE = 2;

export type MerageMap = {
  [pid: string]: FileMerageBean;
};

export class ProcedureLogicWorkerFileSystem extends LogicHandler {
  private dataCache: DataCache = DataCache.getInstance();
  handlerMap: Map<string, FileSystemCallTreeHandler> = new Map<string, FileSystemCallTreeHandler>();
  currentEventId: string = '';
  tab: string = '';
  isAnalysis: boolean = false;
  private lib: object | undefined;
  private symbol: object | undefined;
  private isTopDown: boolean = true;

  handle(data: unknown): void {
    //@ts-ignore
    if (data.id) {
      //@ts-ignore
      this.currentEventId = data.id;
      for (let handle of this.handlerMap.values()) {
        handle.setEventId(this.currentEventId);
      }
    }
    //@ts-ignore
    if (data && data.type) {
      //@ts-ignore
      switch (data.type) {
        case 'fileSystem-init':
          this.initCallchains();
          break;
        case 'fileSystem-queryCallchains':
          this.fileSystemQueryCallchains(data);
          break;
        case 'fileSystem-queryFileSamples':
          this.fileSystemQueryFileSamples(data);
          break;
        case 'fileSystem-queryIoSamples':
          this.fileSystemQueryIoSamples(data);
          break;
        case 'fileSystem-queryVirtualMemorySamples':
          this.fileSystemQueryVirtualMemorySamples(data);
          break;
        case 'fileSystem-action':
          this.fileSystemAction(data);
          break;
        case 'fileSystem-queryStack':
          this.fileSystemQueryStack(data);
          break;
        case 'fileSystem-queryFileSysEvents':
          this.fileSystemQueryFileSysEvents(data);
          break;
        case 'fileSystem-queryVMEvents':
          this.fileSystemQueryVMEvents(data);
          break;
        case 'fileSystem-queryIOEvents':
          this.fileSystemQueryIOEvents(data);
          break;
        case 'fileSystem-reset':
          this.fileSystemReset();
          break;
      }
    }
  }

  private fileSystemQueryCallchains(data: unknown): void {
    //@ts-ignore
    let callChains = convertJSON(data.params.list) || [];
    this.dataCache.clearEBpf();
    //@ts-ignore
    this.initCallChainTopDown(callChains);
    self.postMessage({
      // @ts-ignore
      id: data.id,
      action: 'fileSystem-init',
      results: [],
    });
  }
  private fileSystemQueryFileSamples(data: unknown): void {
    const fsHandler = this.handlerMap.get('fileSystem') as FileSystemCallTreeHandler;
    //@ts-ignore
    this.handlerMap.get('fileSystem').samplesList = convertJSON(data.params.list) || [];
    let fsResults;
    if (this.isAnalysis) {
      this.isAnalysis = false;
      self.postMessage({
        id: this.currentEventId,
        //@ts-ignore
        action: data.action,
        results: this.fileSystemAnalysis(FS_TYPE, fsHandler.samplesList),
      });
    } else {
      if (this.lib) {
        let samplesList = this.fileSystemAnalysis(FS_TYPE, fsHandler.samplesList, this.lib);
        fsHandler.freshCurrentCallChains(samplesList, this.isTopDown);
        fsResults = fsHandler.allProcess;
        this.lib = undefined;
      } else if (this.symbol) {
        let samplesList = this.fileSystemAnalysis(FS_TYPE, fsHandler.samplesList, this.symbol);
        fsHandler.freshCurrentCallChains(samplesList, this.isTopDown);
        fsResults = fsHandler.allProcess;
        this.symbol = undefined;
      } else {
        fsResults = fsHandler.resolvingAction([
          {
            funcName: 'getCallChainsBySampleIds',
            funcArgs: [this.isTopDown],
          },
        ]);
      }
      self.postMessage({
        id: this.currentEventId,
        //@ts-ignore
        action: data.action,
        results: fsResults,
      });
    }
  }
  private fileSystemQueryIoSamples(data: unknown): void {
    const ioHandler = this.handlerMap.get('io') as FileSystemCallTreeHandler;
    //@ts-ignore
    ioHandler.samplesList = convertJSON(data.params.list) || [];
    let ioResults;
    if (this.isAnalysis) {
      this.isAnalysis = false;
      self.postMessage({
        id: this.currentEventId,
        //@ts-ignore
        action: data.action,
        results: this.fileSystemAnalysis(BIO_TYPE, ioHandler.samplesList),
      });
    } else {
      if (this.lib) {
        let samplesList = this.fileSystemAnalysis(BIO_TYPE, ioHandler.samplesList, this.lib);
        ioHandler.freshCurrentCallChains(samplesList, this.isTopDown);
        ioResults = ioHandler.allProcess;
        this.lib = undefined;
      } else if (this.symbol) {
        let samplesList = this.fileSystemAnalysis(BIO_TYPE, ioHandler.samplesList, this.symbol);
        ioHandler.freshCurrentCallChains(samplesList, this.isTopDown);
        ioResults = ioHandler.allProcess;
        this.symbol = undefined;
      } else {
        ioResults = ioHandler.resolvingAction([
          {
            funcName: 'getCallChainsBySampleIds',
            funcArgs: [this.isTopDown],
          },
        ]);
      }
      self.postMessage({
        id: this.currentEventId,
        //@ts-ignore
        action: data.action,
        results: ioResults,
      });
    }
  }
  private fileSystemQueryVirtualMemorySamples(data: unknown): void {
    const vmHandler = this.handlerMap.get('virtualMemory') as FileSystemCallTreeHandler;
    //@ts-ignore
    vmHandler.samplesList = convertJSON(data.params.list) || [];
    let vmResults;
    if (this.isAnalysis) {
      this.isAnalysis = false;
      self.postMessage({
        id: this.currentEventId,
        //@ts-ignore
        action: data.action,
        results: this.fileSystemAnalysis(PF_TYPE, vmHandler.samplesList),
      });
    } else {
      if (this.lib) {
        let samplesList = this.fileSystemAnalysis(PF_TYPE, vmHandler.samplesList, this.lib);
        vmHandler.freshCurrentCallChains(samplesList, this.isTopDown);
        vmResults = vmHandler.allProcess;
        this.lib = undefined;
      } else if (this.symbol) {
        let samplesList = this.fileSystemAnalysis(PF_TYPE, vmHandler.samplesList, this.symbol);
        vmHandler.freshCurrentCallChains(samplesList, this.isTopDown);
        vmResults = vmHandler.allProcess;
        this.symbol = undefined;
      } else {
        vmResults = vmHandler.resolvingAction([
          {
            funcName: 'getCallChainsBySampleIds',
            funcArgs: [this.isTopDown],
          },
        ]);
      }
      self.postMessage({
        id: this.currentEventId,
        //@ts-ignore
        action: data.action,
        results: vmResults,
      });
    }
  }
  private fileSystemAction(data: unknown): void {
    //@ts-ignore
    if (data.params) {
      this.isTopDown = false;
      //@ts-ignore
      this.handlerMap.get(data.params.callType)!.isHideEvent = false;
      //@ts-ignore
      this.handlerMap.get(data.params.callType)!.isHideThread = false;
      //@ts-ignore
      let filter = data.params.args.filter((item: unknown) => item.funcName === 'getCurrentDataFromDb');
      // 从lib层跳转
      //@ts-ignore
      let libFilter = data.params.args.filter((item: unknown): boolean => item.funcName === 'showLibLevelData');
      // 从fun层跳转
      //@ts-ignore
      let funFilter = data.params.args.filter((item: unknown): boolean => item.funcName === 'showFunLevelData');
      //@ts-ignore
      let callChainsFilter = data.params.args.filter(
        //@ts-ignore
        (item: unknown): boolean => item.funcName === 'getCallChainsBySampleIds'
      );
      callChainsFilter.length > 0 ? (this.isTopDown = callChainsFilter[0].funcArgs[0]) : (this.isTopDown = true);
      if (libFilter.length !== 0) {
        this.lib = {
          libId: libFilter[0].funcArgs[0],
          libName: libFilter[0].funcArgs[1],
        };
      } else if (funFilter.length !== 0) {
        this.symbol = {
          symbolId: funFilter[0].funcArgs[0],
          symbolName: funFilter[0].funcArgs[1],
        };
      }
      if (filter.length === 0) {
        // @ts-ignore
        self.postMessage({
          //@ts-ignore
          id: data.id,
          //@ts-ignore
          action: data.action,
          //@ts-ignore
          results: this.handlerMap.get(data.params.callType)!.resolvingAction(data.params.args),
        });
      } else {
        //@ts-ignore
        if (data.params.isAnalysis) {
          this.isAnalysis = true;
        }
        //@ts-ignore
        this.handlerMap.get(data.params.callType)!.resolvingAction(data.params.args);
      }
    }
  }
  private fileSystemQueryStack(data: unknown): void {
    //@ts-ignore
    let res = this.getStacksByCallchainId(data.params.callchainId);
    self.postMessage({
      //@ts-ignore
      id: data.id,
      //@ts-ignore
      action: data.action,
      results: res,
    });
  }
  private fileSystemQueryFileSysEvents(data: unknown): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let res = convertJSON(data.params.list) || [];
      //@ts-ignore
      postMessage(data.id, data.action, this.supplementFileSysEvents(res as Array<FileSysEvent>, this.tab));
    } else {
      //@ts-ignore
      this.tab = data.params.tab;
      //@ts-ignore
      this.queryFileSysEvents(data.params.leftNs, data.params.rightNs, data.params.typeArr, data.params.tab);
    }
  }
  private fileSystemQueryVMEvents(data: unknown): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let res = convertJSON(data.params.list) || [];
      //@ts-ignore
      postMessage(data.id, data.action, this.supplementVMEvents(res as Array<VirtualMemoryEvent>));
    } else {
      //@ts-ignore
      this.queryVMEvents(data.params.leftNs, data.params.rightNs, data.params.typeArr);
    }
  }
  private fileSystemQueryIOEvents(data: unknown): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let res = convertJSON(data.params.list) || [];
      //@ts-ignore
      postMessage(data.id, data.action, this.supplementIoEvents(res as Array<IoCompletionTimes>));
    } else {
      //@ts-ignore
      this.queryIOEvents(data.params.leftNs, data.params.rightNs, data.params.diskIOipids);
    }
  }
  private fileSystemReset(): void {
    this.handlerMap.get('fileSystem')!.isHideEvent = false;
    this.handlerMap.get('fileSystem')!.isHideThread = false;
  }
  public clearAll(): void {
    this.dataCache.clearEBpf();
    for (let key of this.handlerMap.keys()) {
      this.handlerMap.get(key)!.clear();
    }
    this.handlerMap.clear();
  }
  queryFileSysEvents(leftNs: number, rightNs: number, typeArr: Array<number>, tab: string): void {
    let types: string = Array.from(typeArr).join(',');
    let sql: string = '';
    if (tab === 'events') {
      sql = this.queryFileSysEventsSQL1(types);
    } else if (tab === 'history') {
      sql = this.queryFileSysEventsSQL2(types);
    } else {
      sql = this.queryFileSysEventsSQL3(rightNs);
    }
    this.queryData(this.currentEventId, 'fileSystem-queryFileSysEvents', sql, {
      $leftNS: leftNs,
      $rightNS: rightNs,
    });
  }

  private queryFileSysEventsSQL1(types: string): string {
    return `select A.callchain_id as callchainId,
                (A.start_ts - B.start_ts) as startTs,
                dur,
                A.type,
                ifnull(C.name,'Process') || '[' || C.pid || ']' as process,
                ifnull(D.name,'Thread') || '[' || D.tid || ']' as thread,
                first_argument as firstArg,
                second_argument as secondArg,
                third_argument as thirdArg,
                fourth_argument as fourthArg,
                return_value as returnValue,
                fd,
                file_id as fileId,
                error_code as error
            from file_system_sample A, trace_range B
            left join process C on A.ipid = C.id
            left join thread D on A.itid = D.id
            where A.type in (${types}) 
            and (A.end_ts - B.start_ts) >= $leftNS 
            and (A.start_ts - B.start_ts) <= $rightNS
            order by A.end_ts;`;
  }
  private queryFileSysEventsSQL2(types: string): string {
    return `select A.callchain_id as callchainId,
                    (A.start_ts - B.start_ts) as startTs,
                    dur,
                    fd,
                    A.type,
                    A.file_id as fileId,
                    ifnull(C.name,'Process') || '[' || C.pid || ']' as process
            from file_system_sample A, trace_range B
            left join process C on A.ipid = C.id
            where A.type in (${types}) and fd not null 
            and (A.start_ts - B.start_ts) <= $rightNS 
            and (A.end_ts - B.start_ts) >= $leftNS 
            order by A.end_ts;`;
  }
  private queryFileSysEventsSQL3(rightNs: number): string {
    return `select TB.callchain_id                                  as callchainId,
                (TB.start_ts - TR.start_ts)                         as startTs,
                (${rightNs} - TB.start_ts)                          as dur,
                TB.fd,
                TB.type,
                TB.file_id                                          as fileId,
                ifnull(TC.name, 'Process') || '[' || TC.pid || ']'  as process
            from (
            select fd, ipid,
                    max(case when type = 0 then A.end_ts else 0 end) as openTs,
                    max(case when type = 1 then A.end_ts else 0 end) as closeTs
                from file_system_sample A
                where type in (0, 1) 
                and A.end_ts >= $leftNS
                and A.start_ts <= $rightNS
                group by fd, ipid
                ) TA
            left join file_system_sample TB on TA.fd = TB.fd and TA.ipid = TB.ipid and TA.openTs = TB.end_ts
            left join process TC on TB.ipid = TC.ipid
            left join trace_range TR
            where startTs not null and TB.fd not null and TA.closeTs < TA.openTs
            order by TB.end_ts;`;
  }
  queryVMEvents(leftNs: number, rightNs: number, typeArr: Array<number>): void {
    let sql = `select
                A.callchain_id as callchainId,
                (A.start_ts - B.start_ts) as startTs,
                dur,
                addr as address,
                C.pid,
                T.tid,
                size,
                A.type,
                ifnull(T.name,'Thread') || '[' || T.tid || ']' as thread,
                ifnull(C.name,'Process') || '[' || C.pid || ']' as process
            from paged_memory_sample A,trace_range B
            left join process C on A.ipid = C.id
            left join thread T on T.id = A.itid 
            where (
                (A.end_ts - B.start_ts) >= $leftNS and (A.start_ts - B.start_ts) <= $rightNS
            );`;
    this.queryData(this.currentEventId, 'fileSystem-queryVMEvents', sql, {
      $leftNS: leftNs,
      $rightNS: rightNs,
    });
  }

  queryIOEvents(leftNs: number, rightNs: number, diskIOipids: Array<number>): void {
    let ipidsSql = '';
    if (diskIOipids.length > 0) {
      ipidsSql += `and A.ipid in (${diskIOipids.join(',')})`;
    }
    let sql = `select
                A.callchain_id as callchainId,
                (A.start_ts - B.start_ts) as startTs,
                latency_dur as dur,
                path_id as pathId,
                dur_per_4k as durPer4k,
                tier,
                size,
                A.type,
                block_number as blockNumber,
                T.tid,
                C.pid,
                ifnull(T.name,'Thread') || '[' || T.tid || ']' as thread,
                ifnull(C.name,'Process') || '[' || C.pid || ']' as process
            from bio_latency_sample A,trace_range B
            left join process C on A.ipid = C.id
            left join thread T on T.id = A.itid 
            where (
                (A.end_ts - B.start_ts) >= $leftNS and (A.start_ts - B.start_ts) <= $rightNS
            ) ${ipidsSql};`;
    this.queryData(this.currentEventId, 'fileSystem-queryIOEvents', sql, {
      $leftNS: leftNs,
      $rightNS: rightNs,
    });
  }

  getStacksByCallchainId(id: number): Stack[] {
    let stacks = this.dataCache.eBpfCallChainsMap.get(id) ?? [];
    let arr: Array<Stack> = [];
    for (let s of stacks) {
      let st: Stack = new Stack();
      st.path = (this.dataCache.dataDict?.get(s.pathId) ?? 'Unknown Path').split('/').reverse()[0];
      st.symbol = `${s.symbolsId === null ? s.ip : this.dataCache.dataDict?.get(s.symbolsId) ?? ''} (${st.path})`;
      st.type = st.path.endsWith('.so.1') || st.path.endsWith('.dll') || st.path.endsWith('.so') ? 0 : 1;
      arr.push(st);
    }
    return arr;
  }

  supplementIoEvents(res: Array<IoCompletionTimes>): IoCompletionTimes[] {
    return res.map((event): IoCompletionTimes => {
      if (typeof event.pathId === 'string') {
        event.pathId = parseInt(event.pathId);
      }
      event.startTsStr = getTimeString(event.startTs);
      event.durPer4kStr = event.durPer4k === 0 ? '-' : getProbablyTime(event.durPer4k);
      event.sizeStr = getByteWithUnit(event.size);
      event.durStr = getProbablyTime(event.dur);
      event.path = event.pathId ? this.dataCache.dataDict?.get(event.pathId) ?? '-' : '-';
      // @ts-ignore
      event.operation = DISKIO_TYPE_MAP[`${event.type}`] || 'UNKNOWN';
      let stacks = this.dataCache.eBpfCallChainsMap.get(event.callchainId) || [];
      if (stacks.length > 0) {
        let stack = stacks[0];
        event.backtrace = [
          stack.symbolsId === null ? stack.ip : this.dataCache.dataDict?.get(stack.symbolsId) ?? '',
          `(${stacks.length} other frames)`,
        ];
      } else {
        event.backtrace = [];
      }
      return event;
    });
  }

  supplementVMEvents(res: Array<VirtualMemoryEvent>): VirtualMemoryEvent[] {
    return res.map((event): VirtualMemoryEvent => {
      event.startTsStr = getTimeString(event.startTs);
      event.sizeStr = getByteWithUnit(event.size * 4096);
      event.durStr = getProbablyTime(event.dur);
      // @ts-ignore
      event.operation = VM_TYPE_MAP[`${event.type}`] || 'UNKNOWNN';
      return event;
    });
  }

  supplementFileSysEvents(res: Array<FileSysEvent>, tab: string): FileSysEvent[] {
    res.map((r): void => {
      let stacks = this.dataCache.eBpfCallChainsMap.get(r.callchainId);
      r.startTsStr = getTimeString(r.startTs);
      r.durStr = getProbablyTime(r.dur);
      if (tab === 'events') {
        r.firstArg = r.firstArg ?? '0x0';
        r.secondArg = r.secondArg ?? '0x0';
        r.thirdArg = r.thirdArg ?? '0x0';
        r.fourthArg = r.fourthArg ?? '0x0';
        r.returnValue = r.returnValue ?? '0x0';
        r.error = r.error ?? '0x0';
        r.path = this.dataCache.dataDict?.get(r.fileId) ?? '-';
      }
      // @ts-ignore
      r.typeStr = FILE_TYPE_MAP[`${r.type}`] ?? '';
      if (stacks && stacks.length > 0) {
        let stack = stacks[0];
        r.depth = stacks.length;
        r.symbol = stack.symbolsId === null ? stack.ip : this.dataCache.dataDict?.get(stack.symbolsId) ?? '';
        if (tab !== 'events') {
          r.path = this.dataCache.dataDict?.get(r.fileId) ?? '-';
        }
        r.backtrace = [r.symbol, `(${r.depth} other frames)`];
      } else {
        r.depth = 0;
        r.symbol = '';
        r.path = '';
        r.backtrace = [];
      }
    });
    return res;
  }

  initCallchains(): void {
    if (this.handlerMap.size > 0) {
      this.handlerMap.forEach((value: FileSystemCallTreeHandler): void => {
        value.clearAll();
      });
      this.handlerMap.clear();
    }
    this.handlerMap.set('fileSystem', new FileSystemCallTreeHandler('fileSystem', this.queryData.bind(this)));
    this.handlerMap.set('io', new FileSystemCallTreeHandler('io', this.queryData.bind(this)));
    this.handlerMap.set('virtualMemory', new FileSystemCallTreeHandler('virtualMemory', this.queryData.bind(this)));
    this.queryData(
      this.currentEventId,
      'fileSystem-queryCallchains',
      'select callchain_id as callChainId,depth,symbols_id as symbolsId,file_path_id as pathId,ip from ebpf_callstack',
      {}
    );
  }

  initCallChainTopDown(list: FileCallChain[]): void {
    const callChainsMap = this.dataCache.eBpfCallChainsMap;
    list.forEach((callchain: FileCallChain): void => {
      if (callChainsMap.has(callchain.callChainId)) {
        callChainsMap.get(callchain.callChainId)!.push(callchain);
      } else {
        callChainsMap.set(callchain.callChainId, [callchain]);
      }
    });
  }

  fileSystemAnalysis(type: number, samplesList: Array<FileSample>, obj?: unknown): Array<FileAnalysisSample> {
    let analysisSampleList: Array<FileAnalysisSample> = [];
    for (let sample of samplesList) {
      let analysisSample = new FileAnalysisSample(sample);
      let callChainList = this.dataCache.eBpfCallChainsMap.get(sample.callChainId) || [];
      if (callChainList.length === 0) {
        continue;
      }
      let depth = callChainList.length - 1;
      let lastCallChain: FileCallChain | undefined | null;
      //let lastFilter
      while (true) {
        if (depth < 0) {
          lastCallChain = callChainList[depth];
          break;
        }
        lastCallChain = callChainList[depth];
        let symbolName = this.dataCache.dataDict?.get(lastCallChain.symbolsId);
        let libPath = this.dataCache.dataDict?.get(lastCallChain.pathId);
        if (
          (type === BIO_TYPE && symbolName?.includes('submit_bio')) ||
          (type !== BIO_TYPE && libPath && (libPath.includes('musl') || libPath.includes('libc++')))
        ) {
          depth--;
        } else {
          break;
        }
      }
      this.setAnalysisSample(analysisSample, lastCallChain, callChainList);
      //@ts-ignore
      if ((obj && (obj.libId === analysisSample.libId || obj.symbolId === analysisSample.symbolId)) || !obj) {
        analysisSampleList.push(analysisSample);
      }
    }
    return analysisSampleList;
  }
  private setAnalysisSample(
    analysisSample: FileAnalysisSample,
    lastCallChain: FileCallChain,
    callChainList: FileCallChain[]
  ): void {
    if (!lastCallChain) {
      lastCallChain = callChainList[callChainList.length - 1];
    }
    analysisSample.libId = lastCallChain.pathId;
    analysisSample.symbolId = lastCallChain.symbolsId;
    let libPath = this.dataCache.dataDict?.get(analysisSample.libId) || '';
    let pathArray = libPath.split('/');
    analysisSample.libName = pathArray[pathArray.length - 1];
    let symbolName = this.dataCache.dataDict?.get(analysisSample.symbolId);
    if (!symbolName) {
      symbolName = lastCallChain.ip + ' (' + analysisSample.libName + ')';
    }
    analysisSample.symbolName = symbolName;
  }
}

class FileSystemCallTreeHandler {
  currentTreeMapData: MerageMap = {};
  allProcess: FileMerageBean[] = [];
  dataSource: FileMerageBean[] = [];
  currentDataType: string = '';
  currentTreeList: FileMerageBean[] = [];
  samplesList: FileSample[] = [];
  splitMapData: MerageMap = {};
  searchValue: string = '';
  currentEventId: string = '';
  isHideThread: boolean = false;
  isHideEvent: boolean = false;
  queryData = (eventId: string, action: string, sql: string, args: unknown): void => { };

  constructor(type: string, queryData: unknown) {
    this.currentDataType = type;
    //@ts-ignore
    this.queryData = queryData;
  }

  clear(): void {
    this.allProcess.length = 0;
    this.dataSource.length = 0;
    this.currentTreeList.length = 0;
    this.samplesList.length = 0;
    this.splitMapData = {};
  }

  setEventId(eventId: string): void {
    this.currentEventId = eventId;
  }
  queryCallChainsSamples(selectionParam: SelectionParam, sql?: string): void {
    switch (this.currentDataType) {
      case 'fileSystem':
        this.queryFileSamples(selectionParam, sql);
        break;
      case 'io':
        this.queryIOSamples(selectionParam, sql);
        break;
      case 'virtualMemory':
        this.queryPageFaultSamples(selectionParam, sql);
        break;
    }
  }

  queryFileSamples(selectionParam: SelectionParam, sql?: string): void {
    let sqlFilter = '';
    if (selectionParam.fileSystemType !== undefined && selectionParam.fileSystemType.length > 0) {
      sqlFilter += ' and s.type in (';
      sqlFilter += selectionParam.fileSystemType.join(',');
      sqlFilter += ') ';
    }
    if (sql) {
      sqlFilter += sql;
    } else {
      if (
        selectionParam.diskIOipids.length > 0 &&
        !selectionParam.diskIOLatency &&
        selectionParam.fileSystemType.length === 0
      ) {
        sqlFilter += `and s.ipid in (${selectionParam.diskIOipids.join(',')})`;
      }
    }
    this.queryData(
      this.currentEventId,
      'fileSystem-queryFileSamples',
      `select s.start_ts - t.start_ts as ts, s.callchain_id as callChainId,h.tid,h.name as threadName,s.dur,s.type,p.pid,p.name as processName from file_system_sample s,trace_range t 
left join process p on p.id = s.ipid  
left join thread h on h.id = s.itid 
where s.end_ts >= ${selectionParam.leftNs} + t.start_ts 
and s.start_ts <= ${selectionParam.rightNs} + t.start_ts 
${sqlFilter} and callchain_id != -1;`,
      {
        $startTime: selectionParam.leftNs,
        $endTime: selectionParam.rightNs,
      }
    );
  }

  queryIOSamples(selectionParam: SelectionParam, sql?: string): void {
    let sqlFilter = '';
    const types: number[] = [];
    if (selectionParam.diskIOReadIds.length > 0) {
      types.push(...[1, 3]);
    }
    if (selectionParam.diskIOWriteIds.length > 0) {
      types.push(...[2, 4]);
    }
    if (selectionParam.diskIOipids.length > 0) {
      types.push(...[5, 6]);
    }
    if (sql) {
      sqlFilter = sql;
    } else {
      if (selectionParam.diskIOipids.length > 0) {
        sqlFilter += `and (s.ipid in (${selectionParam.diskIOipids.join(',')}) and s.type in (${types.join(',')})) `;
      }
    }

    this.queryData(
      this.currentEventId,
      'fileSystem-queryIoSamples',
      `select s.start_ts - t.start_ts as ts, s.callchain_id as callChainId,h.tid,h.name as threadName,s.latency_dur as dur,s.type,p.pid,p.name as processName from bio_latency_sample s,trace_range t
left join process p on p.id = s.ipid
left join thread h on h.id = s.itid
where s.end_ts >= ${selectionParam.leftNs} + t.start_ts 
and s.start_ts <= ${selectionParam.rightNs} + t.start_ts 
${sqlFilter} 
and callchain_id != -1;`,
      {
        $startTime: selectionParam.leftNs,
        $endTime: selectionParam.rightNs,
      }
    );
  }

  queryPageFaultSamples(selectionParam: SelectionParam, sql?: string): void {
    let sqlFilter = '';
    if (sql) {
      sqlFilter = sql;
    } else {
      if (
        selectionParam.diskIOipids.length > 0 &&
        !selectionParam.diskIOLatency &&
        !selectionParam.fileSysVirtualMemory
      ) {
        sqlFilter += ` and s.ipid in (${selectionParam.diskIOipids.join(',')})`;
      }
    }
    this.queryData(
      this.currentEventId,
      'fileSystem-queryVirtualMemorySamples',
      `select s.start_ts - t.start_ts as ts, s.callchain_id as callChainId,h.tid,h.name as threadName,s.dur,s.type,p.pid,p.name as processName from paged_memory_sample s,trace_range t 
left join process p on p.id = s.ipid  
left join thread h on h.id = s.itid 
where s.end_ts >= ${selectionParam.leftNs} + t.start_ts 
and s.start_ts <= ${selectionParam.rightNs} + t.start_ts ${sqlFilter} and callchain_id != -1;`,
      {
        $startTime: selectionParam.leftNs,
        $endTime: selectionParam.rightNs,
      }
    );
  }

  freshCurrentCallChains(samples: FileSample[], isTopDown: boolean): void {
    this.currentTreeMapData = {};
    this.currentTreeList = [];
    this.allProcess = [];
    this.dataSource = [];
    let totalCount = 0;
    samples.forEach((sample: FileSample): void => {
      totalCount += sample.dur;
      let callChains = this.createThreadAndType(sample);
      let minDepth = 2;
      if (this.isHideEvent) {
        minDepth--;
      }
      if (this.isHideThread) {
        minDepth--;
      }
      if (callChains.length === minDepth) {
        return;
      }
      let topIndex = isTopDown ? 0 : callChains.length - 1;
      if (callChains.length > 0) {
        let root =
          this.currentTreeMapData[callChains[topIndex].symbolsId + '' + callChains[topIndex].pathId + sample.pid];
        if (root === undefined) {
          root = new FileMerageBean();
          this.currentTreeMapData[callChains[topIndex].symbolsId + '' + callChains[topIndex].pathId + sample.pid] =
            root;
          this.currentTreeList.push(root);
        }
        FileMerageBean.merageCallChainSample(root, callChains[topIndex], sample, false);
        if (callChains.length > 1) {
          this.merageChildrenByIndex(root, callChains, topIndex, sample, isTopDown);
        }
      }
    });
    let rootMerageMap = this.mergeNodeData(totalCount);
    this.handleCurrentTreeList(totalCount);
    //@ts-ignore
    this.allProcess = Object.values(rootMerageMap);
  }

  private mergeNodeData(totalCount: number): MerageMap {
    let rootMerageMap: MerageMap = {};
    Object.values(this.currentTreeMapData).forEach((mergeData: FileMerageBean): void => {
      if (rootMerageMap[mergeData.pid] === undefined) {
        let fileMerageBean = new FileMerageBean(); //新增进程的节点数据
        fileMerageBean.canCharge = false;
        fileMerageBean.isProcess = true;
        fileMerageBean.symbol = mergeData.processName;
        fileMerageBean.children.push(mergeData);
        fileMerageBean.initChildren.push(mergeData);
        fileMerageBean.dur = mergeData.dur;
        fileMerageBean.count = mergeData.count;
        fileMerageBean.total = totalCount;
        fileMerageBean.tsArray = [...mergeData.tsArray];
        fileMerageBean.durArray = [...mergeData.durArray];
        rootMerageMap[mergeData.pid] = fileMerageBean;
      } else {
        rootMerageMap[mergeData.pid].children.push(mergeData);
        rootMerageMap[mergeData.pid].initChildren.push(mergeData);
        rootMerageMap[mergeData.pid].dur += mergeData.dur;
        rootMerageMap[mergeData.pid].count += mergeData.count;
        rootMerageMap[mergeData.pid].total = totalCount;
        for (const ts of mergeData.tsArray) {
          rootMerageMap[mergeData.pid].tsArray.push(ts);
        }
        for (const dur of mergeData.durArray) {
          rootMerageMap[mergeData.pid].durArray.push(dur);
        }
      }
      mergeData.parentNode = rootMerageMap[mergeData.pid]; //子节点添加父节点的引用
    });
    return rootMerageMap;
  }
  private handleCurrentTreeList(totalCount: number): void {
    let id = 0;
    this.currentTreeList.forEach((currentNode: FileMerageBean): void => {
      currentNode.total = totalCount;
      this.setMerageName(currentNode);
      if (currentNode.id === '') {
        currentNode.id = id + '';
        id++;
      }
      if (currentNode.parentNode) {
        if (currentNode.parentNode.id === '') {
          currentNode.parentNode.id = id + '';
          id++;
        }
        currentNode.parentId = currentNode.parentNode.id;
      }
    });
  }
  createThreadAndType(sample: FileSample): FileCallChain[] {
    let typeCallChain = new FileCallChain();
    typeCallChain.callChainId = sample.callChainId;
    let map = {};
    if (this.currentDataType === 'fileSystem') {
      map = FILE_TYPE_MAP;
    } else if (this.currentDataType === 'io') {
      map = DISKIO_TYPE_MAP;
    } else if (this.currentDataType === 'virtualMemory') {
      map = VM_TYPE_MAP;
    }
    // @ts-ignore
    typeCallChain.ip = map[sample.type.toString()] || 'UNKNOWN';
    typeCallChain.symbolsId = sample.type;
    typeCallChain.pathId = -1;
    let threadCallChain = new FileCallChain();
    threadCallChain.callChainId = sample.callChainId;
    threadCallChain.ip = (sample.threadName || 'Thread') + `-${sample.tid}`;
    threadCallChain.symbolsId = sample.tid;
    threadCallChain.isThread = true;
    threadCallChain.pathId = -1;
    let list: FileCallChain[] = [];
    const eBpfCallChainsMap = DataCache.getInstance().eBpfCallChainsMap;
    if (!this.isHideEvent) {
      list.push(typeCallChain);
    }
    if (!this.isHideThread) {
      list.push(threadCallChain);
    }
    list.push(...(eBpfCallChainsMap.get(sample.callChainId) || []));
    return list;
  }

  merageChildrenByIndex(
    currentNode: FileMerageBean,
    callChainDataList: FileCallChain[],
    index: number,
    sample: FileSample,
    isTopDown: boolean
  ): void {
    isTopDown ? index++ : index--;
    let isEnd = isTopDown ? callChainDataList.length === index + 1 : index === 0;
    let node: FileMerageBean;
    if (
      //@ts-ignore
      currentNode.initChildren.filter((child: FileMerageBean) => {
        if (
          child.ip === callChainDataList[index]?.ip ||
          (child.symbolsId !== null &&
            child.symbolsId === callChainDataList[index]?.symbolsId &&
            child.pathId === callChainDataList[index]?.pathId)
        ) {
          node = child;
          FileMerageBean.merageCallChainSample(child, callChainDataList[index], sample, isEnd);
          return true;
        }
        return false;
      }).length === 0
    ) {
      node = new FileMerageBean();
      FileMerageBean.merageCallChainSample(node, callChainDataList[index], sample, isEnd);
      currentNode.children.push(node);
      currentNode.initChildren.push(node);
      this.currentTreeList.push(node);
      node.parentNode = currentNode;
    }
    if (node! && !isEnd) {
      this.merageChildrenByIndex(node, callChainDataList, index, sample, isTopDown);
    }
  }

  setMerageName(currentNode: FileMerageBean): void {
    if (currentNode.pathId === -1) {
      currentNode.canCharge = false;
      currentNode.symbol = currentNode.ip;
      currentNode.symbol = currentNode.symbol;
      currentNode.lib = '';
      currentNode.path = '';
    } else {
      const dataCache = DataCache.getInstance();
      currentNode.symbol = dataCache.dataDict?.get(currentNode.symbolsId) || currentNode.ip || 'unknown';
      currentNode.path = dataCache.dataDict?.get(currentNode.pathId) || 'unknown';
      currentNode.lib = setFileName(currentNode.path);
      currentNode.addr = currentNode.ip;
      currentNode.symbol = `${currentNode.symbol} (${currentNode.lib})`;
    }
  }
  public resolvingAction(params: unknown[]): FileMerageBean[] {
    if (params.length > 0) {
      params.forEach((paramItem: unknown): void => {
        //@ts-ignore
        if (paramItem.funcName && paramItem.funcArgs) {
          //@ts-ignore
          this.handleDataByFuncName(paramItem.funcName, paramItem.funcArgs);
        }
      });
      this.dataSource = this.allProcess.filter((process: FileMerageBean): boolean => {
        return process.children && process.children.length > 0;
      });
    }
    return this.dataSource;
  }
  private handleDataByFuncName(funcName: string, args: Array<unknown>): void {
    switch (funcName) {
      case 'getCallChainsBySampleIds':
        this.freshCurrentCallChains(this.samplesList, args[0] as boolean);
        break;
      case 'getCurrentDataFromDb':
        this.getCurrentDataFromDb(args);
        break;
      case 'hideSystemLibrary':
        merageBeanDataSplit.hideSystemLibrary(this.allProcess, this.splitMapData);
        break;
      case 'hideNumMaxAndMin':
        merageBeanDataSplit.hideNumMaxAndMin(this.allProcess, this.splitMapData, args[0] as number, args[1] as string);
        break;
      case 'hideThread':
        this.isHideThread = args[0] as boolean;
        break;
      case 'hideEvent':
        this.isHideEvent = args[0] as boolean;
        break;
      case 'splitAllProcess':
        merageBeanDataSplit.splitAllProcess(this.allProcess, this.splitMapData, args[0]);
        break;
      case 'resetAllNode':
        merageBeanDataSplit.resetAllNode(this.allProcess, this.currentTreeList, this.searchValue);
        break;
      case 'resotreAllNode':
        merageBeanDataSplit.resotreAllNode(this.splitMapData, args[0] as string[]);
        break;
      case 'clearSplitMapData':
        this.clearSplitMapData(args[0] as string);
        break;
      case 'splitTree':
        let map = this.splitMapData;
        let list = this.currentTreeList;
        merageBeanDataSplit.splitTree(
          map,
          this.allProcess,
          args[0] as string,
          args[1] as boolean,
          args[2] as boolean,
          list,
          this.searchValue
        );
        break;
      case 'setSearchValue':
        this.searchValue = args[0] as string;
        break;
    }
  }
  private getCurrentDataFromDb(args: Array<unknown>): void {
    if (args[1]) {
      let sql = this.setSQLCondition(args[1]);
      //@ts-ignore
      this.queryCallChainsSamples(args[0], sql);
    } else {
      //@ts-ignore
      this.queryCallChainsSamples(args[0]);
    }
  }
  private setSQLCondition(funcArgs: unknown): string {
    let sql = '';
    //@ts-ignore
    if (funcArgs.processId !== undefined) {
      //@ts-ignore
      sql += `and p.pid = ${funcArgs.processId}`;
    }
    //@ts-ignore
    if (funcArgs.typeId !== undefined) {
      //@ts-ignore
      sql += ` and s.type = ${funcArgs.typeId}`;
    }
    //@ts-ignore
    if (funcArgs.threadId !== undefined) {
      //@ts-ignore
      sql += ` and h.tid = ${funcArgs.threadId}`;
    }
    return sql;
  }
  clearAll(): void {
    this.samplesList = [];
    this.splitMapData = {};
    this.currentTreeMapData = {};
    this.currentTreeList = [];
    this.searchValue = '';
    this.allProcess = [];
    this.dataSource = [];
    this.splitMapData = {};
    this.currentDataType = '';
  }

  clearSplitMapData(symbolName: string): void {
    if (symbolName in this.splitMapData) {
      Reflect.deleteProperty(this.splitMapData, symbolName);
    }
  }
}

class FileSample {
  type: number = 0;
  callChainId: number = 0;
  dur: number = 0;
  pid: number = 0;
  tid: number = 0;
  threadName: string = '';
  processName: string = '';
  ts: number = 0;
}

class FileAnalysisSample extends FileSample {
  libId = 0;
  symbolId = 0;
  libName = '';
  symbolName = '';
  constructor(fileSample: FileSample) {
    super();
    this.type = fileSample.type;
    this.callChainId = fileSample.callChainId;
    this.dur = fileSample.dur;
    this.pid = fileSample.pid;
    this.tid = fileSample.tid;
    this.threadName = fileSample.threadName;
    this.processName = fileSample.processName;
  }
}

export class FileMerageBean extends MerageBean {
  ip: string = '';
  symbolsId: number = 0;
  pathId: number = 0;
  processName: string = '';
  type: number = 0;

  static merageCallChainSample(
    currentNode: FileMerageBean,
    callChain: FileCallChain,
    sample: FileSample,
    isEnd: boolean
  ): void {
    if (currentNode.processName === '') {
      currentNode.ip = callChain.ip;
      currentNode.pid = sample.pid;
      currentNode.canCharge = true;
      currentNode.pathId = callChain.pathId;
      currentNode.symbolsId = callChain.symbolsId;
      currentNode.processName = `${sample.processName || 'Process'} (${sample.pid})`;
    }
    if (isEnd) {
      currentNode.selfDur += sample.dur;
      currentNode.self = getProbablyTime(currentNode.selfDur);
    }
    if (callChain.isThread && !currentNode.isThread) {
      currentNode.isThread = callChain.isThread;
    }
    currentNode.dur += sample.dur;
    currentNode.count++;
    currentNode.tsArray.push(sample.ts);
    currentNode.durArray.push(sample.dur);
  }
}

export class Stack {
  type: number = 0;
  symbol: string = '';
  path: string = '';
}

export class FileSysEvent {
  isSelected: boolean = false;
  id: number = 0;
  callchainId: number = 0;
  startTs: number = 0;
  startTsStr: string = '';
  durStr: string = '';
  dur: number = 0;
  process: string = '';
  thread: string = '';
  type: number = 0;
  typeStr: string = '';
  fd: number = 0;
  size: number = 0;
  depth: number = 0;
  firstArg: string = '';
  secondArg: string = '';
  thirdArg: string = '';
  fourthArg: string = '';
  returnValue: string = '';
  error: string = '';
  path: string = '';
  symbol: string = '';
  backtrace: Array<string> = [];
  fileId: number = 0;
}

export class IoCompletionTimes {
  isSelected: boolean = false;
  type: number = 0;
  callchainId: number = 0;
  startTs: number = 0;
  startTsStr: string = '';
  durStr: string = '';
  dur: number = 0;
  tid: number = 0;
  pid: number = 0;
  process: string = '';
  thread: string = '';
  path: string = '';
  pathId: number = 0;
  operation: string = '';
  size: number = 0;
  sizeStr: string = '';
  blockNumber: string = '';
  tier: number = 0;
  backtrace: Array<string> = [];
  durPer4kStr: string = '';
  durPer4k: number = 0;
}

export class VirtualMemoryEvent {
  isSelected: boolean = false;
  callchainId: number = 0;
  startTs: number = 0;
  startTsStr: string = '';
  durStr: string = '';
  dur: number = 0;
  process: string = '';
  thread: string = '';
  address: string = '';
  size: number = 0;
  sizeStr: string = '';
  type: number = 0;
  tid: number = 0;
  pid: number = 0;
  operation: string = '';
}
