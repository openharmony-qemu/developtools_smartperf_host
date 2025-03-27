/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF unknown KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { TabPerfFuncAsmHtml } from './TabPerfFuncAsm.html';
import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import {
  FormattedAsmInstruction,
  PerfFunctionAsmParam,
  OriginAsmInstruction,
} from '../../../../bean/PerfAnalysis';
import { WebSocketManager } from '../../../../../webSocket/WebSocketManager';
import { Constants, TypeConstants } from '../../../../../webSocket/Constants';

@element('tab-perf-func-asm')
export class TabPerfFuncAsm extends BaseElement {
  private assmblerTable: LitTable | null | undefined;
  private loadingElement: HTMLElement | null | undefined;
  private functionName: string = '';
  private totalCount: number = 0;
  private totalCountElement: HTMLDivElement | null | undefined;
  private textFileOffElement: HTMLDivElement | null | undefined;
  private errorMessageElement: HTMLDivElement | null | undefined;
  private funcBaseAddr: bigint = BigInt(0);
  // Key: offset; Value: selfcount
  private funcSampleMap: Map<number, number> = new Map();
  private showUpData: FormattedAsmInstruction[] = [];
  private originalShowUpData: FormattedAsmInstruction[] = [];
  private formattedAsmIntructionArray: FormattedAsmInstruction[] = [];
  private resizeObserver: ResizeObserver | null = null;

  initHtml(): string {
    return TabPerfFuncAsmHtml;
  }

  initElements(): void {
    this.assmblerTable = this.shadowRoot!.querySelector<LitTable>(
        '#perf-function-asm-table'
    );
    this.loadingElement =
        this.shadowRoot!.querySelector<HTMLElement>('#loading');
    this.totalCountElement =
        this.shadowRoot!.querySelector<HTMLDivElement>('#total-count');
    this.textFileOffElement =
        this.shadowRoot!.querySelector<HTMLDivElement>('#text-file-off');
    this.errorMessageElement = this.shadowRoot!.querySelector<HTMLDivElement>('#error-message');

    this.assmblerTable!.style.display = 'grid';

    this.assmblerTable!.itemTextHandleMap.set('addr', (value: unknown) => {
      return `0x${(value as number).toString(16)}`;
    });

    this.assmblerTable!.itemTextHandleMap.set('selfcount', (value: unknown) => {
      return (value as number) === 0 ? '' : (value as number).toString();
    });

    this.assmblerTable!.itemTextHandleMap.set('percent', (value: unknown) => {
      return (value as number) === 0 ? '' : (value as number).toString();
    });

    this.assmblerTable!.itemTextHandleMap.set('instruction', (value: unknown) => {
      return (value as string) === '' ? 'INVALID' : (value as string);
    });

    this.assmblerTable!.itemTextHandleMap.set('sourceLine', (value: unknown) => {
      return (value as string) || '';
    });

    this.assmblerTable!.addEventListener('column-click', ((evt: Event) => {
      const {key, sort} = (evt as CustomEvent).detail;
      if (key === 'selfcount') {
        if (sort === 0) {
          this.assmblerTable!.recycleDataSource = this.originalShowUpData;
          this.assmblerTable!.reMeauseHeight();
        } else {
          this.showUpData.sort((a, b) => {
            return sort === 1
                ? a.selfcount - b.selfcount
                : b.selfcount - a.selfcount;
          });
          this.assmblerTable!.recycleDataSource = this.showUpData;
          this.assmblerTable!.reMeauseHeight();
        }
      } else if (key === 'percent') {
        if (sort === 0) {
          this.assmblerTable!.recycleDataSource = this.originalShowUpData;
          this.assmblerTable!.reMeauseHeight();
        } else {
          this.showUpData.sort((a, b) => {
            return sort === 1 ? a.percent - b.percent : b.percent - a.percent;
          });
          this.assmblerTable!.recycleDataSource = this.showUpData;
          this.assmblerTable!.reMeauseHeight();
        }
      }
    }) as EventListener);
  }

  private updateTotalCount(): void {
    if (this.functionName) {
      this.totalCountElement!.innerHTML = `<span class="title-label">Total Count:</span> ${this.totalCount}`;
    }
  }

  private showLoading(): void {
    if (this.loadingElement) {
      this.loadingElement.removeAttribute('hidden');
    }
  }

  private hideLoading(): void {
    if (this.loadingElement) {
      this.loadingElement.setAttribute('hidden', '');
    }
  }

  private showError(message: string): void {
    if (this.errorMessageElement) {
      this.errorMessageElement.textContent = message;
      this.errorMessageElement.style.display = 'block';
    }
  }

  private hideError(): void {
    if (this.errorMessageElement) {
      this.errorMessageElement.style.display = 'none';
    }
  }

  set data(data: PerfFunctionAsmParam) {
    if (this.functionName === data.functionName || data.functionName === undefined) {
      return;
    }

    (async (): Promise<void> => {
      try {
        this.clearData();
        this.functionName = data.functionName;
        this.totalCount = data.totalCount;
        this.updateTotalCount();
        this.showLoading();
        // @ts-ignore
        const vaddrInFile = data.vaddrList[0].vaddrInFile;
        // 1. 先转成 BigInt
        // 2. 用 asUintN 转成无符号64位
        // 3. 如果需要用作数值运算，再转回 Number
        this.funcBaseAddr = BigInt.asUintN(64, BigInt(vaddrInFile));
        // 1. 计算采样数据
        this.calculateFuncAsmSapleCount(data.vaddrList);
        // 2. 等待汇编指令数据
        let callback: (cmd: number, e: Uint8Array) => void;

        await Promise.race([
          new Promise<void>((resolve, reject) => {
            callback = (cmd: number, e: Uint8Array): void => {
              try {

                if (cmd === Constants.DISASSEMBLY_QUERY_BACK_CMD) {
                  const result = JSON.parse(new TextDecoder().decode(e));
                  if (result.resultCode === 0) {
                    if (result.anFileOff) {
                      this.textFileOffElement!.innerHTML = `<span class="title-label">.text section:</span> ${result.anFileOff}`;
                      this.textFileOffElement!.style.display = 'block';
                    } else {
                      this.textFileOffElement!.style.display = 'none';
                    }
                    this.formatAsmInstruction(JSON.parse(result.resultMessage));
                    this.calcutelateShowUpData();
                    resolve();
                  } else {
                    reject(new Error(`Failed with code: ${result.resultCode}, error message: ${result.resultMessage}`));
                  }
                  WebSocketManager.getInstance()?.unregisterCallback(TypeConstants.DISASSEMBLY_TYPE, callback);
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                WebSocketManager.getInstance()?.unregisterCallback(TypeConstants.DISASSEMBLY_TYPE, callback);
                reject(new Error(`Error while processing WebSocket message: ${errorMessage}`));
              }
            };

            WebSocketManager.getInstance()?.registerCallback(TypeConstants.DISASSEMBLY_TYPE, callback);
          }),
          new Promise((_, reject) => setTimeout(() => {
            WebSocketManager.getInstance()?.unregisterCallback(TypeConstants.DISASSEMBLY_TYPE, callback);
            reject(new Error('Request timeout, please install the extended service according to the help document'));
          }, 30000))
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.showError(`Error: can't get assembly instruction because ${errorMessage}, show sample list without assembly instruction`);
        this.calcutelateErrorShowUpData();
      } finally {
        this.showUpData = [...this.originalShowUpData];
        this.assmblerTable!.recycleDataSource = this.showUpData;
        this.assmblerTable!.reMeauseHeight();
        this.hideLoading();
      }
    })();
  }

  private calcutelateErrorShowUpData(): void {
    this.funcSampleMap.forEach((selfCount, offsetToVaddr) => {
      this.originalShowUpData.push({
        selfcount: selfCount,
        percent: Math.round((selfCount / this.totalCount) * 10000) / 100,
        // 地址计算也使用 BigInt
        addr: Number(BigInt.asUintN(64, this.funcBaseAddr + BigInt(offsetToVaddr))),
        instruction: '',
        sourceLine: ''
      });
    });
  }

  private calculateFuncAsmSapleCount(vaddrList: Array<unknown>): void {
    vaddrList.forEach(item => {
      // @ts-ignore
      const count = this.funcSampleMap.get(item.offsetToVaddr) || 0;
      // @ts-ignore
      this.funcSampleMap.set(item.offsetToVaddr, count + 1);
    });
  }

  private formatAsmInstruction(originAsmInstruction: Array<OriginAsmInstruction>): void {
    this.formattedAsmIntructionArray = originAsmInstruction.map(instructs => ({
      selfcount: 0,
      percent: 0,
      addr: parseInt(instructs.addr, 16),
      instruction: instructs.instruction,
      sourceLine: instructs.sourceLine
    }) as FormattedAsmInstruction);
  }


  private clearData(): void {
    this.hideError();
    this.funcSampleMap.clear();
    this.showUpData = [];
    this.originalShowUpData = [];
    this.formattedAsmIntructionArray = [];
    this.assmblerTable!.recycleDataSource = [];
  }

  private calcutelateShowUpData(): void {
    this.funcSampleMap.forEach((selfCount, offsetToVaddr) => {
      let instructionPosition = offsetToVaddr / 4;
      this.formattedAsmIntructionArray[instructionPosition].selfcount = selfCount;
      this.formattedAsmIntructionArray[instructionPosition].percent = Math.round((selfCount / this.totalCount) * 10000) / 100;
    });
    this.originalShowUpData = this.formattedAsmIntructionArray;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    // 初始化 ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
      if (this.assmblerTable && this.parentElement) {
        this.assmblerTable.style.height = `${this.parentElement.clientHeight - 50}px`;
        this.assmblerTable!.reMeauseHeight();
      }
    });
    this.resizeObserver.observe(this.parentElement!);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();

    // 断开 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
}