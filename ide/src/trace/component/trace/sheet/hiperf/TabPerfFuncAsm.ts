import { TabPerfFuncAsmHtml } from "./TabPerfFuncAsm.html";
import { BaseElement, element } from "../../../../../base-ui/BaseElement";
import { LitTable } from "../../../../../base-ui/table/lit-table";
import {
  FormattedAsmInstruction,
  PerfFunctionAsmParam,
  OriginAsmInstruction,
} from "../../../../bean/PerfAnalysis";
import { WebSocketManager } from "../../../../../webSocket/WebSocketManager";
import { Constants, TypeConstants } from "../../../../../webSocket/Constants";

@element("tab-perf-func-asm")
export class TabPerfFuncAsm extends BaseElement {
  private assmblerTable: LitTable | null | undefined;
  private loadingElement: HTMLElement | null | undefined;
  private functionName: string = "";
  private totalCount: number = 0;
  private functionNameElement: HTMLDivElement | null | undefined;
  private totalCountElement: HTMLDivElement | null | undefined;
  private errorMessageElement: HTMLDivElement | null | undefined;
  private funcBaseAddr: bigint = BigInt(0);
  // Key: offset; Value: selfcount
  private funcSampleMap: Map<number, number> = new Map();
  private showUpData: FormattedAsmInstruction[] = [];
  private originalShowUpData: FormattedAsmInstruction[] = [];
  private currentAsmList: Array<unknown> = [];
  private formattedAsmIntructionArray: FormattedAsmInstruction[] = [];
  initHtml(): string {
    return TabPerfFuncAsmHtml;
  }

  initElements(): void {
    this.assmblerTable = this.shadowRoot!.querySelector<LitTable>(
      "#perf-function-asm-table"
    );
    this.loadingElement =
      this.shadowRoot!.querySelector<HTMLElement>("#loading");
    this.functionNameElement =
      this.shadowRoot!.querySelector<HTMLDivElement>("#function-name");
    this.totalCountElement =
      this.shadowRoot!.querySelector<HTMLDivElement>("#total-count");
    this.errorMessageElement = this.shadowRoot!.querySelector<HTMLDivElement>("#error-message");
    this.assmblerTable!.style.display = "grid";

    this.assmblerTable!.itemTextHandleMap.set("addr", (value: unknown) => {
      return `0x${(value as number).toString(16)}`;
    });

    this.assmblerTable!.itemTextHandleMap.set("selfcount", (value: unknown) => {
      return (value as number) === 0 ? "" : (value as number).toString();
    });

    this.assmblerTable!.itemTextHandleMap.set("percent", (value: unknown) => {
      return (value as number) === 0 ? "" : (value as number).toString();
    });

    this.assmblerTable!.itemTextHandleMap.set("instruction", (value: unknown) => {
      return (value as string) === "" ? "INVALID" : (value as string);
    });

    this.assmblerTable!.addEventListener("column-click", ((evt: Event) => {
      const { key, sort } = (evt as CustomEvent).detail;
      console.log("lbh:sort", sort)
      if (key === "selfcount") {
        if (sort === 0) {
          console.log("lbh: sort0")
          this.assmblerTable!.recycleDataSource = this.originalShowUpData;
          console.log("lbh:sort recycle", this.assmblerTable!.recycleDataSource)
          console.log("lbh:sort originalShowUpData", this.originalShowUpData)
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
        console.log("after sort: ", this.originalShowUpData)
      } else if (key === "percent") {
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
    // 注册汇编代码请求回调函数
    WebSocketManager.getInstance()?.registerCallback(TypeConstants.DISASSEMBLY_TYPE, this.receiveAsmData.bind(this));
  }

  private receiveAsmData(cmd: unknown, e: unknown): void {
    // @ts-ignore
    const result = JSON.parse(new TextDecoder().decode(e));
    if (result.resultCode === 0) {
      this.currentAsmList = JSON.parse(result.resultMessage);
    }
  }

  private updateTitle(): void {
    if (this.functionName) {
      this.functionNameElement!.innerHTML = `<span class="title-label">Function Name:</span> ${this.functionName}`;
      this.totalCountElement!.innerHTML = `<span class="title-label">Total Count:</span> ${this.totalCount}`;
    }
    console.log(this.totalCount)
  }

  private showLoading(): void {
    if (this.loadingElement) {
      this.loadingElement.removeAttribute("hidden");
    }
  }

  private hideLoading(): void {
    if (this.loadingElement) {
      this.loadingElement.setAttribute("hidden", "");
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
    if (this.functionName === data.functionName) {
      return;
    }

    (async () => {
      try {
        this.clearData();
        this.functionName = data.functionName;
        this.totalCount = data.totalCount;
        this.updateTitle();
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
            callback = (cmd: number, e: Uint8Array) => {
              try {
                console.log('Received cmd:', cmd, 'Expected:', Constants.DISASSEMBLY_QUERY_BACK_CMD);
                
                if (cmd === Constants.DISASSEMBLY_QUERY_BACK_CMD) {
                  const result = JSON.parse(new TextDecoder().decode(e));
                  if (result.resultCode === 0) {
                    this.formatAsmInstruction(JSON.parse(result.resultMessage));
                    this.calcutelateShowUpData();
                    resolve();
                  } else {
                    reject(new Error(`Failed with code: ${result.resultCode}`));
                  }
                } else {
                  reject(new Error(`Unexpected command: ${cmd}`));
                }
                WebSocketManager.getInstance()?.unregisterCallback(TypeConstants.DISASSEMBLY_TYPE, callback);
              } catch (error) {
                WebSocketManager.getInstance()?.unregisterCallback(TypeConstants.DISASSEMBLY_TYPE, callback);
                reject(error);
              }
            };
            
            WebSocketManager.getInstance()?.registerCallback(TypeConstants.DISASSEMBLY_TYPE, callback);
          }),
          new Promise((_, reject) => setTimeout(() => {
            WebSocketManager.getInstance()?.unregisterCallback(TypeConstants.DISASSEMBLY_TYPE, callback);
            reject(new Error('Request timeout'));
          }, 5000))
        ]);

        // 5. 更新表格

      } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.showError(`Error: can't get assembly code because ${errorMessage},show sample list without assembly code`);
        this.calcutelateErrorShowUpData();
      } finally {
        console.log("lbh:finally:originalShowUpData ", this.originalShowUpData)
        console.log("lbh:finally:funcBaseAddr ", this.funcBaseAddr)
        console.log("lbh:finally:funcSampleMap ", this.funcSampleMap)
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
        instruction: ''
      })
    })
    console.log("lbh:calcutelateErrorShowUpData originalShowUpData ", this.originalShowUpData)
    console.log("lbh:calcutelateErrorShowUpData funcBaseAddr ", this.funcBaseAddr)
    console.log("lbh:calcutelateErrorShowUpData funcSampleMap ", this.funcSampleMap)
  }

  private calculateFuncAsmSapleCount(vaddrList: Array<unknown>): void {
    vaddrList.forEach(item => {
      // @ts-ignore
      const count = this.funcSampleMap.get(item.offsetToVaddr) || 0;
      // @ts-ignore
      this.funcSampleMap.set(item.offsetToVaddr, count + 1);
    });
  }

  private formatAsmInstruction(originAsmInstruction: Array<OriginAsmInstruction>) {
    this.formattedAsmIntructionArray = originAsmInstruction.map(instructs => ({
      selfcount: 0,
      percent: 0,
      addr: parseInt(instructs.addr, 16),
      instruction: instructs.instruction,
    }) as FormattedAsmInstruction);
  }


  private clearData(): void {
    this.hideError();
    this.funcSampleMap.clear();
    this.showUpData = [];
    this.originalShowUpData = [];
    this.currentAsmList = [];
    this.formattedAsmIntructionArray = [];
    this.assmblerTable!.recycleDataSource = [];
  }

  private calcutelateShowUpData(): void {
    this.funcSampleMap.forEach((selfCount, offsetToVaddr) => {
      let instructionPosition = offsetToVaddr / 4;
      this.formattedAsmIntructionArray[instructionPosition].selfcount = selfCount;
      this.formattedAsmIntructionArray[instructionPosition].percent = Math.round((selfCount / this.totalCount) * 10000) / 100;
    })
    this.originalShowUpData = this.formattedAsmIntructionArray;
  }

  public connectedCallback(): void {
    new ResizeObserver(() => {
      if (this.assmblerTable && this.parentElement) {
        this.assmblerTable.style.height = `${
          this.parentElement.clientHeight - 50
        }px`;
        this.assmblerTable.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }
}
