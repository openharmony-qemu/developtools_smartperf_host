import { TabPerfFuncAsmHtml } from "./TabPerfFuncAsm.html";
import { BaseElement, element } from "../../../../../base-ui/BaseElement";
import { LitTable } from "../../../../../base-ui/table/lit-table";
import {
  AsmInstruction,
  PerfFunctionAsmShowUpData,
  PerfFunctionAsmStruct,
  PerfFunctionSelfCountPerAssembler,
} from "../../../../bean/PerfAnalysis";
import { WebSocketManager } from "../../../../../webSocket/WebSocketManager";
import { ConstructorType } from "../../../../../js-heap/model/UiStruct";
import { TypeConstants } from "../../../../../webSocket/Constants";

@element("tab-perf-func-asm")
export class TabPerfFuncAsm extends BaseElement {
  private assmblerTable: LitTable | null | undefined;
  private loadingElement: HTMLElement | null | undefined;
  private functionName: string = "";
  private totalCount: number = 0;
  private functionNameElement: HTMLDivElement | null | undefined;
  private totalCountElement: HTMLDivElement | null | undefined;
  private functionSelfCountPerAssembler: PerfFunctionSelfCountPerAssembler[] =
    [];
  private asmInstruction: AsmInstruction[] = [];
  private showUpData: PerfFunctionAsmShowUpData[] = [];
  private originalShowUpData: PerfFunctionAsmShowUpData[] = [];
  private currentAsmList: Array<unknown> = [];

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
    this.assmblerTable!.style.display = "grid";

    this.assmblerTable!.itemTextHandleMap.set("addr", (value: unknown) => {
      return `0x${(value as number).toString(16)}`;
    });

    this.assmblerTable!.itemTextHandleMap.set("selfCount", (value: unknown) => {
      return (value as number) === 0 ? "" : (value as number).toString();
    });

    this.assmblerTable!.itemTextHandleMap.set("percent", (value: unknown) => {
      return (value as number) === 0 ? "" : (value as number).toString();
    });

    this.assmblerTable!.addEventListener("column-click", ((evt: Event) => {
      const { key, sort } = (evt as CustomEvent).detail;
      if (key === "selfCount") {
        if (sort === 0) {
          this.resetSort();
        } else {
          this.showUpData.sort((a, b) => {
            return sort === 1
              ? a.selfCount - b.selfCount
              : b.selfCount - a.selfCount;
          });
          this.refreshFunctionAsmData();
        }
      } else if (key === "percent") {
        if (sort === 0) {
          this.resetSort();
        } else {
          this.showUpData.sort((a, b) => {
            return sort === 1 ? a.percent - b.percent : b.percent - a.percent;
          });
          this.refreshFunctionAsmData();
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

  set data(data: PerfFunctionAsmStruct) {
    this.showUpData = [];
    this.refreshFunctionAsmData();
  }

  private calcutelateShowUpData(): void {
    const selfCountMap = new Map<number, number>();
    this.functionSelfCountPerAssembler.forEach((item) => {
      selfCountMap.set(item.addr, item.selfcount);
    });

    this.showUpData = this.asmInstruction.map((asmItem: AsmInstruction) => ({
      addr: asmItem.addr,
      instruction: asmItem.instruction,
      selfCount: selfCountMap.get(asmItem.addr) || 0,
      percent:
        Math.round(
          ((selfCountMap.get(asmItem.addr) || 0) / this.totalCount) * 10000
        ) / 100,
    }));
    this.originalShowUpData = [...this.showUpData];
  }

  private refreshFunctionAsmData(): void {
    this.assmblerTable!.recycleDataSource = this.showUpData;
    console.log(this.assmblerTable!.recycleDataSource);
    this.assmblerTable!.reMeauseHeight();
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

  private resetSort(): void {
    this.showUpData = [...this.originalShowUpData];
    this.refreshFunctionAsmData();
  }
}
