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

import { element } from '../../../../base-ui/BaseElement';
import { TimeRange } from '../timer-shaft/RangeRuler';
import '../../../../base-ui/icon/LitIcon';
import { Rect } from '../timer-shaft/Rect';
import { BaseStruct } from '../../../bean/BaseStruct';
import { ns2x } from '../TimerShaftElement';
import { TraceRowObject } from './TraceRowObject';
import { LitCheckBox } from '../../../../base-ui/checkbox/LitCheckBox';
import { LitIcon } from '../../../../base-ui/icon/LitIcon';
import '../../../../base-ui/popover/LitPopoverV';
import '../../../../base-ui/tree/LitTree';
import { LitPopover } from '../../../../base-ui/popover/LitPopoverV';
import { info } from '../../../../log/Log';
import { ColorUtils } from './ColorUtils';
import { drawSelectionRange, isFrameContainPoint, PairPoint } from '../../../database/ui-worker/ProcedureWorkerCommon';
import { TraceRowConfig } from './TraceRowConfig';
import { type TreeItemData, LitTree } from '../../../../base-ui/tree/LitTree';
import { SpSystemTrace } from '../../SpSystemTrace';
import { TraceRowHtml } from './TraceRow.html';
import { Utils } from './Utils';
import { SpChartList } from '../SpChartList';

export class RangeSelectStruct {
  startX: number | undefined;
  endX: number | undefined;
  startNS: number | undefined;
  endNS: number | undefined;
}

let collectList: Array<TraceRow<BaseStruct>> = [];
let rowDragId: string | undefined | null;
let dragDirection: string = '';

@element('trace-row')
export class TraceRow<T extends BaseStruct> extends HTMLElement {
  sharedArrayBuffers: unknown;
  intersectionRatio: number = 0;
  static ROW_TYPE_SPSEGNENTATION = 'spsegmentation';
  static ROW_TYPE_CPU_COMPUTILITY = 'cpu-computility';
  static ROW_TYPE_GPU_COMPUTILITY = 'gpu-computility';
  static ROW_TYPE_BINDER_COUNT = 'binder-count';
  static ROW_TYPE_SCHED_SWITCH = 'sched-switch';
  static ROW_TYPE_CPU = 'cpu-data';
  static ROW_TYPE_CPU_STATE = 'cpu-state';
  static ROW_TYPE_CPU_FREQ = 'cpu-freq';
  static ROW_TYPE_CPU_FREQ_LIMIT = 'cpu-limit-freq';
  static ROW_TYPE_CPU_FREQ_ALL = 'cpu-frequency';
  static ROW_TYPE_IMPORT = 'import-match-file';
  static ROW_TYPE_CPU_STATE_ALL = 'cpu-State';
  static ROW_TYPE_CPU_FREQ_LIMITALL = 'cpu-frequency-limit';
  static ROW_TYPE_FPS = 'fps';
  static ROW_TYPE_NATIVE_MEMORY = 'native-memory';
  static ROW_TYPE_GPU_MEMORY = 'gpu-memory';
  static ROW_TYPE_OTHER_SOURCE = 'other-source';
  static ROW_TYPE_HIPERF = 'hiperf';
  static ROW_TYPE_HIPERF_THREADTYPE: Array<number> = [-2];
  static ROW_TYPE_DELIVER_INPUT_EVENT = 'DeliverInputEvent';
  static ROW_TYPE_TOUCH_EVENT_DISPATCH = 'TouchEventDispatch';
  static ROW_TYPE_HIPERF_CPU = 'hiperf-cpu';
  static ROW_TYPE_PERF_CALLCHART = 'hiperf-callchart';
  static ROW_TYPE_HIPERF_PROCESS = 'hiperf-process';
  static ROW_TYPE_HIPERF_THREAD = 'hiperf-thread';
  static ROW_TYPE_HIPERF_REPORT = 'hiperf-report';
  static ROW_TYPE_HIPERF_EVENT = 'hiperf-event';
  static ROW_TYPE_PROCESS = 'process';
  static ROW_TYPE_APP_STARTUP = 'app-startup';
  static ROW_TYPE_STATIC_INIT = 'static-init';
  static ROW_TYPE_THREAD = 'thread';
  static ROW_TYPE_THREAD_SYS_CALL = 'thread-sys-call';
  static ROW_TYPE_THREAD_NAME = 'sameThread_process';
  static ROW_TYPE_MEM = 'mem';
  static ROW_TYPE_VIRTUAL_MEMORY_GROUP = 'virtual-memory-group';
  static ROW_TYPE_VIRTUAL_MEMORY = 'virtual-memory-cell';
  static ROW_TYPE_FILE_SYSTEM_GROUP = 'file-system-group';
  static ROW_TYPE_FILE_SYSTEM = 'file-system-cell';
  static ROW_TYPE_HEAP = 'heap';
  static ROW_TYPE_GPU_HEAP = 'gpu_heap';
  static ROW_TYPE_OTHER_SOURCE_HEAP = 'otherSource_heap';
  static ROW_TYPE_ARK_TS = 'ark-ts';
  static ROW_TYPE_HEAP_SNAPSHOT = 'heap-snapshot';
  static ROW_TYPE_HEAP_TIMELINE = 'heap-timeline';
  static ROW_TYPE_FUNC = 'func';
  static ROW_TYPE_MONITOR = 'ability-monitor';
  static ROW_TYPE_CPU_ABILITY = 'cpu-ability';
  static ROW_TYPE_MEMORY_ABILITY = 'memory-ability';
  static ROW_TYPE_DISK_ABILITY = 'disk-ability';
  static ROW_TYPE_NETWORK_ABILITY = 'network-ability';
  static ROW_TYPE_DMA_ABILITY = 'dma-ability';
  static ROW_TYPE_DMA_FENCE = 'dma-fence';
  static ROW_TYPE_GPU_MEMORY_ABILITY = 'gpu-memory-ability';
  static ROW_TYPE_SDK = 'sdk';
  static ROW_TYPE_SDK_COUNTER = 'sdk-counter';
  static ROW_TYPE_SDK_SLICE = 'sdk-slice';
  static ROW_TYPE_ENERGY = 'energy';
  static ROW_TYPE_ANOMALY_ENERGY = 'anomaly-energy';
  static ROW_TYPE_SYSTEM_ENERGY = 'system-energy';
  static ROW_TYPE_POWER_ENERGY = 'power-energy';
  static ROW_TYPE_STATE_ENERGY = 'state-energy';
  static ROW_TYPE_SYS_MEMORY_GPU = 'sys-memory-gpu';
  static ROW_TYPE_SYS_MEMORY_GPU_GL = 'sys-memory-gpu-gl';
  static ROW_TYPE_SYS_MEMORY_GPU_GRAPH = 'sys-memory-gpu-graph';
  static ROW_TYPE_SYS_MEMORY_GPU_TOTAL = 'sys-memory-gpu-total';
  static ROW_TYPE_SYS_MEMORY_GPU_WINDOW = 'sys-memory-gpu-window';
  static ROW_TYPE_VM_TRACKER_SMAPS = 'smaps';
  static ROW_TYPE_VM_TRACKER = 'VmTracker';
  static ROW_TYPE_DMA_VMTRACKER = 'dma-vmTracker';
  static ROW_TYPE_GPU_MEMORY_VMTRACKER = 'gpu-memory-vmTracker';
  static ROW_TYPE_GPU_RESOURCE_VMTRACKER = 'sys-memory-gpu-resource';
  static ROW_TYPE_VMTRACKER_SHM = 'VmTracker-shm';
  static ROW_TYPE_HANG_GROUP = 'hang-group';
  static ROW_TYPE_CLOCK_GROUP = 'clock-group';
  static ROW_TYPE_COLLECT_GROUP = 'collect-group';
  static ROW_TYPE_HANG = 'hang';
  static ROW_TYPE_HANG_INNER = 'hang-inner';
  static ROW_TYPE_CLOCK = 'clock';
  static ROW_TYPE_XPOWER = 'xpower';
  static ROW_TYPE_XPOWER_SYSTEM_GROUP = 'xpower-system-group';
  static ROW_TYPE_XPOWER_BUNDLE_NAME_GROUP = 'xpower-bundle-name-group';
  static ROW_TYPE_XPOWER_STATISTIC = 'xpower-statistic';
  static ROW_TYPE_XPOWER_APP_DETAIL_DISPLAY = 'xpower-app-detail-display';
  static ROW_TYPE_XPOWER_WIFI_PACKETS = 'xpower-wifi-packets';
  static ROW_TYPE_XPOWER_WIFI_BYTES = 'xpower-wifi-bytes';
  static ROW_TYPE_XPOWER_SYSTEM = 'xpower-system';
  static ROW_TYPE_XPOWER_THREAD_COUNT = 'xpower-thread-count';
  static ROW_TYPE_XPOWER_THREAD_INFO = 'xpower-thread-info';
  static ROW_TYPE_XPOWER_GPU_COUNT = 'xpower-gpu-count';
  static ROW_TYPE_XPOWER_GPU_FREQUENCY = 'xpower-gpu-frequency';
  static ROW_TYPE_IRQ_GROUP = 'irq-group';
  static ROW_TYPE_IRQ = 'irq';
  static ROW_TYPE_JANK = 'janks';
  static ROW_TYPE_FRAME = 'frame';
  static ROW_TYPE_FRAME_ANIMATION = 'frame-animation';
  static ROW_TYPE_FRAME_DYNAMIC = 'frame-dynamic';
  static ROW_TYPE_FRAME_SPACING = 'frame-spacing';
  static ROW_TYPE_JS_CPU_PROFILER = 'js-cpu-profiler-cell';
  static ROW_TYPE_PURGEABLE_TOTAL_ABILITY = 'purgeable-total-ability';
  static ROW_TYPE_PURGEABLE_PIN_ABILITY = 'purgeable-pin-ability';
  static ROW_TYPE_PURGEABLE_TOTAL_VM = 'purgeable-total-vm';
  static ROW_TYPE_PURGEABLE_PIN_VM = 'purgeable-pin-vm';
  static ROW_TYPE_LOGS = 'logs';
  static ROW_TYPE_SAMPLE = 'bpftrace';
  static ROW_TYPE_ALL_APPSTARTUPS = 'all-appstartups';
  static ROW_TYPE_PERF_TOOL_GROUP = 'perf-tool-group';
  static ROW_TYPE_PERF_TOOL = 'perf-tool';
  static ROW_TYPE_GPU_COUNTER_GROUP = 'gpu-counter-group';
  static ROW_TYPE_GPU_COUNTER = 'gpu-counter';
  static ROW_TYPE_SNAPSHOT = 'snapShots';
  static FRAME_WIDTH: number = 0;
  static range: TimeRange | undefined | null;
  static rangeSelectObject: RangeSelectStruct | undefined;
  static ROW_TYPE_HI_SYSEVENT = 'hi-sysevent'; // @ts-ignore
  public obj: TraceRowObject<unknown> | undefined | null;
  isHover: boolean = false;
  hoverX: number = 0;
  hoverY: number = 0;
  index: number = 0;
  public must: boolean = false;
  public isTransferCanvas = false;
  onComplete: Function | undefined;
  isComplete: boolean = false;
  public dataList: Array<T> = [];
  public dataList2: Array<T> = [];
  public dataListCache: Array<T> = [];
  public fixedList: Array<T> = [];
  public sliceCache: number[] = [-1, -1];
  public describeEl: HTMLElement | null | undefined;
  public canvas: Array<HTMLCanvasElement> = [];
  public canvasVessel: HTMLDivElement | null | undefined;
  public tipEL: HTMLDivElement | null | undefined;
  public checkBoxEL: LitCheckBox | null | undefined;
  public collectEL: LitIcon | null | undefined;
  public onThreadHandler: ((useCache: boolean, buf: ArrayBuffer | undefined | null) => void) | undefined | null;
  public onRowSettingChangeHandler: ((keys: Array<string>, nodes: Array<unknown>) => void) | undefined | null;
  public onRowSettingCheckBoxChangeHandler: ((keys: boolean[]) => void) | undefined | null;
  public onRowCheckFileChangeHandler: (() => void) | undefined | null;
  public supplier: (() => Promise<Array<T>>) | undefined | null; // @ts-ignore
  public favoriteChangeHandler: ((fav: TraceRow<unknown>) => void) | undefined | null; // @ts-ignore
  public selectChangeHandler: ((traceRow: TraceRow<unknown>) => void) | undefined | null;
  dpr = window.devicePixelRatio || 1;
  // @ts-ignore
  offscreen: Array<OffscreenCanvas | undefined> = [];
  canvasWidth = 0;
  canvasHeight = 0;
  private _collectGroup: string | undefined;
  public _frame: Rect | undefined;
  public isLoading: boolean = false;
  public tampName: string = '';
  public readonly args: unknown;
  public templateType: Set<string> = new Set<string>();
  private rootEL: HTMLDivElement | null | undefined;
  private nameEL: HTMLLabelElement | null | undefined;
  private rowSettingTree: LitTree | null | undefined;
  private rowSettingPop: LitPopover | null | undefined;
  private rowSettingCheckBoxPop: LitPopover | null | undefined;
  private _rowSettingCheckBoxList: string[] | null | undefined;
  private _rowSettingCheckedBoxList: boolean[] | null | undefined;
  private fileEL: unknown;
  private rowCheckFilePop: LitPopover | null | undefined;
  private _rangeSelect: boolean = false;
  private _drawType: number = 0;
  private _enableCollapseChart: boolean = false;
  online: boolean = false;
  static isUserInteraction: boolean;
  asyncFuncName: string | Array<string> | undefined | null;
  asyncFuncNamePID: number | undefined | null;
  asyncFuncThreadName: Array<unknown> | string | undefined | null;
  translateY: number = 0; //single canvas offsetY;
  // @ts-ignore
  childrenList: Array<TraceRow<unknown>> = []; // @ts-ignore
  parentRowEl: TraceRow<unknown> | undefined;
  _rowSettingList: Array<TreeItemData> | null | undefined;
  public supplierFrame: (() => Promise<Array<T>>) | undefined | null; //实时查询
  public getCacheData: ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined; //实时查询
  public loadingFrame: boolean = false; //实时查询,正在查询中
  public needRefresh: boolean = true;
  _frameRateList: Array<number> | undefined; //存储平均帧率数据
  _avgRateTxt: string | undefined | null; //存储帧率显示文字
  public folderIcon: LitIcon | null | undefined;
  private sampleUploadEl: HTMLDivElement | null | undefined;
  private jsonFileEl: HTMLInputElement | null | undefined;

  focusHandler?: (ev: MouseEvent) => void | undefined;
  findHoverStruct?: () => void | undefined;
  public funcMaxHeight: number = 0;
  currentContext: CanvasRenderingContext2D | undefined | null;
  static ROW_TYPE_LTPO: string | null | undefined;
  static ROW_TYPE_HITCH_TIME: string | null | undefined;
  asyncFuncStartTID!: number | undefined;
  protoParentId: string | null | undefined;
  protoPid: string | undefined;
  summaryProtoPid: Array<string> | undefined;
  private trace: SpSystemTrace | undefined;

  constructor(
    args: {
      canvasNumber: number;
      alpha: boolean;
      contextId: string;
      isOffScreen: boolean;
      skeleton?: boolean;
    } = {
        canvasNumber: 1,
        alpha: false,
        contextId: '2d',
        isOffScreen: true,
        skeleton: false,
      },
    traceId?: string
  ) {
    super();
    this.args = args;
    this.attachShadow({ mode: 'open' }).innerHTML = this.initHtml();
    if (traceId) {
      this.traceId = traceId;
    }
    this.initElements();
  }

  static skeleton<T extends BaseStruct>(traceId?: string): TraceRow<T> {
    let tr = new TraceRow<T>(
      {
        alpha: false,
        canvasNumber: 0,
        contextId: '',
        isOffScreen: false,
        skeleton: true,
      },
      traceId
    );
    tr.isTransferCanvas = true;
    return tr;
  }

  static get observedAttributes(): string[] {
    return [
      'folder',
      'sticky',
      'name',
      'expansion',
      'children',
      'height',
      'row-type',
      'row-id',
      'row-parent-id',
      'sleeping',
      'check-type',
      'collect-type',
      'collect-group',
      'disabled-check',
      'row-discard',
      'func-expand',
      'row-setting',
      'row-setting-list',
      'row-setting-popover-direction',
    ];
  }

  get uploadEl(): HTMLDivElement | null | undefined {
    return this.sampleUploadEl;
  }

  get frameRateList(): Array<number> | undefined {
    return this._frameRateList;
  }

  set frameRateList(value: Array<number> | undefined) {
    this._frameRateList = value;
  }

  get avgRateTxt(): string | undefined | null {
    return this._avgRateTxt;
  }

  set avgRateTxt(value: string | undefined | null) {
    this._avgRateTxt = value;
  }

  get funcExpand(): boolean {
    return this.getAttribute('func-expand') === 'true';
  }

  set funcExpand(b: boolean) {
    this.setAttribute('func-expand', b ? 'true' : 'false');
  }

  get sticky(): boolean {
    return this.hasAttribute('sticky');
  }

  set sticky(fixed: boolean) {
    if (fixed) {
      this.setAttribute('sticky', '');
    } else {
      this.removeAttribute('sticky');
    }
  }

  get hasParentRowEl(): boolean {
    return this.parentRowEl !== undefined;
  }

  get rowDiscard(): boolean {
    return this.hasAttribute('row-discard');
  }

  set rowDiscard(value: boolean) {
    let height = 0;
    if (value) {
      this.setAttribute('row-discard', '');
      this.style.display = 'none';
      height = 0;
    } else {
      this.removeAttribute('row-discard');
      this.style.display = 'block';
      height = this.clientHeight;
    }
    if (this.collect) {
      window.publish(window.SmartEvent.UI.RowHeightChange, {
        expand: this.funcExpand,
        value: height,
      });
    }
  }

  get collectGroup(): string | undefined {
    return this._collectGroup;
  }

  set collectGroup(value: string | undefined) {
    this._collectGroup = value;
    this.setAttribute('collect-group', value || '');
  }

  set rowSetting(value: string) {
    this.setAttribute('row-setting', value);
  }

  get rowSetting(): string {
    return this.getAttribute('row-setting') || 'disable';
  }

  set rowSettingPopoverDirection(value: string) {
    if (this.rowSettingPop) {
      this.rowSettingPop.placement = value;
    }
    if (this.rowSettingPop) {
      this.rowSettingPop.placement = value;
    }
  }

  get rowSettingPopoverDirection(): string {
    return this.rowSettingPop?.placement || 'bottomLeft';
  }

  set rowSettingList(value: Array<TreeItemData> | null | undefined) {
    this._rowSettingList = value;
    if (this.rowSettingTree) {
      this.rowSettingTree.treeData = value || [];
    }
    if (this.rowSettingTree) {
      this.rowSettingTree.treeData = value || [];
    }
  }

  set rowSettingMultiple(value: boolean) {
    if (this.rowSettingTree) {
      this.rowSettingTree.multiple = value;
    }
  }

  get rowSettingList(): TreeItemData[] | null | undefined {
    return this._rowSettingList;
  }

  set rowSettingCheckBoxList(value: Array<string> | null | undefined) {
    this._rowSettingCheckBoxList = value;
  }

  get rowSettingCheckBoxList(): Array<string> | null | undefined {
    return this._rowSettingCheckBoxList;
  }

  get rowSettingCheckedBoxList(): Array<boolean> | null | undefined {
    return this._rowSettingCheckedBoxList;
  }

  get collect(): boolean {
    return this.hasAttribute('collect-type');
  }

  set collect(value: boolean) {
    if (value) {
      this.setAttribute('collect-type', '');
    } else {
      this.removeAttribute('collect-type');
    }
  }

  get rangeSelect(): boolean {
    return this._rangeSelect;
  }

  set rangeSelect(value: boolean) {
    this._rangeSelect = value && this.traceId === Utils.currentSelectTrace;
  }

  sleeping: boolean = false;

  get rowType(): string | undefined | null {
    return this.getAttribute('row-type');
  }

  set rowType(val) {
    this.setAttribute('row-type', val || '');
  }

  get traceId(): string | undefined | null {
    return this.getAttribute('trace-id');
  }

  set traceId(val) {
    this.setAttribute('trace-id', val || '');
  }

  get rowId(): string | undefined | null {
    return this.getAttribute('row-id');
  }

  set rowId(val) {
    let id = this.traceId ? `${val || ''}-${this.traceId}` : `${val || ''}`;
    this.setAttribute('row-id', id);
  }

  get rowParentId(): string | undefined | null {
    return this.getAttribute('row-parent-id');
  }

  set rowParentId(val) {
    this.setAttribute('row-parent-id', val || '');
  }

  get namePrefix(): string | undefined | null {
    return this.getAttribute('name-prefix');
  }

  set namePrefix(val) {
    this.setAttribute('name-prefix', val || '');
  }

  set rowHidden(val: boolean) {
    let height = 0;
    if (val) {
      this.setAttribute('row-hidden', '');
      height = 0;
    } else {
      this.removeAttribute('row-hidden');
      height = this.clientHeight;
    }
    if (this.collect) {
      window.publish(window.SmartEvent.UI.RowHeightChange, {
        expand: this.funcExpand,
        value: height,
      });
    }
  }

  get name(): string {
    return this.getAttribute('name') || '';
  }

  set name(value: string) {
    this.setAttribute('name', value);
  }

  get folder(): boolean {
    return this.hasAttribute('folder');
  }

  set folder(value: boolean) {
    if (value) {
      this.setAttribute('folder', '');
      this.folderIcon = document.createElement('lit-icon') as LitIcon;
      this.folderIcon.classList.add('icon');
      this.folderIcon.setAttribute('name', 'caret-down');
      this.folderIcon.setAttribute('size', '19');
      this.folderIcon.style.display = 'flex';
      this.describeEl?.insertBefore(this.folderIcon, this.describeEl.children[0]);
    } else {
      this.removeAttribute('folder');
    }
  }

  get expansion(): boolean {
    return this.hasAttribute('expansion');
  }

  fragment: DocumentFragment = document.createDocumentFragment();

  set expansion(value) {
    if (value === this.expansion) {
      return;
    }
    if (value) {
      this.updateChildRowStatus();
    } else {
      this.sticky = false;
      this.childRowToFragment(false);
    }
    if (value) {
      this.setAttribute('expansion', '');
    } else {
      this.removeAttribute('expansion');
    }
    this.dispatchEvent(
      new CustomEvent('expansion-change', {
        detail: {
          expansion: this.expansion,
          rowType: this.rowType,
          rowId: this.rowId,
          rowParentId: this.rowParentId,
        },
      })
    );
  }

  childRowToFragment(expansion: boolean): void {
    for (const childrenRow of this.childrenList) {
      if (!childrenRow.collect) {
        this.fragment.append(childrenRow);
      }
      if (!expansion) {
        if (childrenRow.childrenList && childrenRow.folder && childrenRow.expansion) {
          childrenRow.expansion = false;
        }
      }
    }
  }

  updateChildRowStatus(): void {
    this.fragment = document.createDocumentFragment();
    this.childRowToFragment(true);
    this.insertAfter(this.fragment, this);
  }

  clearMemory(): void {
    this.dataList2 = [];
    this.dataList = [];
    this.dataListCache = [];
    this.fixedList = [];
    if (this.rootEL) {
      this.rootEL.innerHTML = '';
    }
    if (this.folder) {
      this.childrenList.forEach((child) => {
        if (child.clearMemory !== undefined) {
          child.clearMemory();
        }
      });
      this.childrenList = [];
    }
  }

  addTemplateTypes(...type: string[]): void {
    type.forEach((item) => {
      this.templateType.add(item);
    });
    if (this.hasParentRowEl) {
      this.toParentAddTemplateType(this);
    }
  }
  // @ts-ignore
  toParentAddTemplateType = (currentRowEl: TraceRow<unknown>): void => {
    let parentRow = currentRowEl.parentRowEl;
    if (parentRow !== undefined) {
      currentRowEl.templateType.forEach((item) => {
        parentRow!.templateType.add(item);
      });
      if (parentRow.parentRowEl !== undefined) {
        this.toParentAddTemplateType(parentRow);
      }
    }
  };

  getHoverStruct(
    strict: boolean = true,
    offset: boolean = false,
    maxKey: string | undefined = undefined
  ): T | undefined {
    let item: T | undefined;
    if (this.isHover) {
      if (maxKey) {
        let arr = this.dataListCache
          .filter((re) => re.frame && isFrameContainPoint(re.frame, this.hoverX, this.hoverY, strict, offset)) // @ts-ignore
          .sort((targetA, targetB) => (targetB as unknown)[maxKey] - (targetA as unknown)[maxKey]);
        item = arr[0];
      } else {
        item = this.dataListCache.find(
          (re) => re.frame && isFrameContainPoint(re.frame, this.hoverX, this.hoverY, strict, offset)
        );
      }
    }
    return item;
  }

  // @ts-ignore
  addChildTraceRow(child: TraceRow<unknown>): void {
    // @ts-ignore
    TraceRowConfig.allTraceRowList.push(child);
    child.parentRowEl = this;
    this.toParentAddTemplateType(child);
    child.setAttribute('scene', '');
    this.childrenList.push(child);
    child.rowHidden = false;
    this.fragment.appendChild(child);
  }

  // @ts-ignore
  addChildTraceRowAfter(child: TraceRow<unknown>, targetRow: TraceRow<unknown>, hidden: boolean = false): void {
    // @ts-ignore
    TraceRowConfig.allTraceRowList.push(child);
    child.parentRowEl = this;
    this.toParentAddTemplateType(child);
    let index = this.childrenList.indexOf(targetRow);
    child.setAttribute('scene', '');
    if (index !== -1) {
      this.childrenList.splice(index + 1, 0, child);
      child.rowHidden = hidden;
      this.fragment.insertBefore(child, this.fragment.childNodes.item(index + 1));
    } else {
      this.childrenList.push(child);
      child.rowHidden = hidden;
      this.fragment.append(child);
    }
  }

  addChildTraceRowBefore(child: TraceRow<BaseStruct>, targetRow: TraceRow<BaseStruct>): void {
    TraceRowConfig.allTraceRowList.push(child);
    child.parentRowEl = this;
    this.toParentAddTemplateType(child);
    let index = this.childrenList.indexOf(targetRow);
    child.setAttribute('scene', '');
    if (index !== -1) {
      this.childrenList.splice(index, 0, child);
      this.fragment.insertBefore(child, this.fragment.childNodes.item(index));
    } else {
      this.childrenList.push(child);
      child.rowHidden = false;
      this.fragment.appendChild(child);
    }
  }

  addRowSampleUpload(type: string = 'application/json'): void {
    this.sampleUploadEl = document.createElement('div');
    this.sampleUploadEl!.className = 'upload';
    this.sampleUploadEl!.innerHTML = `
    <input id="file" class="file" accept="${type}"  type="file" style="display:none;pointer-events:none"/>
    <label for="file" style="cursor:pointer">
      <lit-icon class="folder" name="copy-csv" size="19"></lit-icon>
    </label>`;
    this.jsonFileEl = this.sampleUploadEl!.querySelector('.file') as HTMLInputElement;
    this.sampleUploadEl!.addEventListener('change', () => {
      let files = this.jsonFileEl!.files;
      if (files && files.length > 0) {
        this.sampleUploadEl!.dispatchEvent(
          new CustomEvent('sample-file-change', {
            detail: files[0],
          })
        );
        if (this.jsonFileEl) {
          this.jsonFileEl.value = '';
        }
      }
    });
    this.sampleUploadEl!.addEventListener('click', (e): void => {
      e.stopPropagation();
    });
    this.describeEl?.appendChild(this.sampleUploadEl!);
  }
  // @ts-ignore
  addChildTraceRowSpecifyLocation(child: TraceRow<unknown>, index: number): void {
    // @ts-ignore
    TraceRowConfig.allTraceRowList.push(child);
    child.parentRowEl = this;
    child.setAttribute('scene', '');
    this.childrenList.splice(index, 0, child);
    child.rowHidden = false;
    this.fragment.insertBefore(child, this.fragment.childNodes.item(index));
  }

  insertAfter(newEl: DocumentFragment, targetEl: HTMLElement): void {
    let parentEl = targetEl.parentNode;
    if (parentEl) {
      if (parentEl!.lastChild === targetEl) {
        parentEl!.appendChild(newEl);
      } else {
        parentEl!.insertBefore(newEl, targetEl.nextSibling);
      }
    }
  }

  sortRenderServiceData(
    child: TraceRow<BaseStruct>,
    targetRow: TraceRow<BaseStruct>,
    threadRowArr: Array<TraceRow<BaseStruct>>,
    flag: boolean
  ): void {
    if (child.rowType === 'thread') {
      threadRowArr.push(child);
    } else {
      let index: number = threadRowArr.indexOf(targetRow);
      if (index !== -1) {
        threadRowArr.splice(index + 1, 0, child);
      } else {
        threadRowArr.push(child);
      }
    }
    if (flag) {
      let order: string[] = [
        'VSyncGenerator',
        'VSync-rs',
        'VSync-app',
        'render_service',
        'RSUniRenderThre',
        'Release Fence',
        'Acquire Fence',
        'RSHardwareThrea',
        'Present Fence',
      ];
      let filterOrderArr: Array<TraceRow<BaseStruct>> = [];
      let filterNotOrderArr: Array<TraceRow<BaseStruct>> = [];
      for (let i = 0; i < threadRowArr.length; i++) {
        // @ts-ignore
        const element: TraceRow<unknown> = threadRowArr[i];
        let renderFlag: boolean =
          element.name.startsWith('render_service') && element.rowId === element.rowParentId ? true : false;
        if (renderFlag) {
          // @ts-ignore
          filterOrderArr.push(element);
        } else if (order.includes(element.namePrefix!) && !element.name.startsWith('render_service')) {
          // @ts-ignore
          filterOrderArr.push(element);
        } else if (!order.includes(element.namePrefix!) || !renderFlag) {
          // @ts-ignore
          filterNotOrderArr.push(element);
        }
      }
      filterOrderArr.sort((star, next) => {
        return order.indexOf(star.namePrefix!) - order.indexOf(next.namePrefix!);
      });
      let combinedArr = [...filterOrderArr, ...filterNotOrderArr];
      combinedArr.forEach((item): void => {
        this.addChildTraceRow(item);
      });
    }
  }

  set tip(value: string) {
    if (this.tipEL) {
      this.tipEL.innerHTML = value;
    }
  }

  get frame(): Rect {
    if (this._frame) {
      this._frame.width = TraceRow.FRAME_WIDTH;
      this._frame.height = this.clientHeight;
      return this._frame;
    } else {
      this._frame = new Rect(0, 0, TraceRow.FRAME_WIDTH, this.clientHeight || 40);
      return this._frame;
    }
  }

  set frame(f: Rect) {
    this._frame = f;
  }

  get checkType(): string {
    return this.getAttribute('check-type') || '';
  }

  set checkType(value: string) {
    if (!value || value.length === 0) {
      this.removeAttribute('check-type');
      return;
    }
    if (this.getAttribute('check-type') === value) {
      return;
    }
    if (this.folder) {
      this.childrenList.forEach((it) => (it.checkType = value));
    }
    if (this.refreshCheckType()) {
      return;
    }
    this.setAttribute('check-type', value);
    if (this.hasAttribute('disabled-check')) {
      this.checkBoxEL!.style.display = 'none';
      return;
    }
    switch (value) {
      case '-1':
        this.checkBoxEL!.style.display = 'none';
        this.rangeSelect = false;
        break;
      case '0':
        this.checkBoxEL!.style.display = 'flex';
        this.checkBoxEL!.checked = false;
        this.checkBoxEL!.indeterminate = false;
        this.rangeSelect = false;
        break;
      case '1':
        this.checkBoxEL!.style.display = 'flex';
        this.checkBoxEL!.checked = false;
        this.checkBoxEL!.indeterminate = true;
        this.rangeSelect = false;
        break;
      case '2':
        this.rangeSelect = true;
        this.checkBoxEL!.style.display = 'flex';
        this.checkBoxEL!.checked = true;
        this.checkBoxEL!.indeterminate = false;
        break;
    }
  }

  get drawType(): number {
    return this._drawType;
  }

  set drawType(value: number) {
    this._drawType = value; // @ts-ignore
    let radioList: NodeListOf<unknown> = this.shadowRoot!.querySelectorAll('input[type=radio][name=status]');
    if (radioList!.length > 0) {
      // @ts-ignore
      radioList[Number(value)].checked = true;
    }
  }

  get highlight(): boolean {
    return this.hasAttribute('expansion');
  }

  set highlight(value: boolean) {
    if (value) {
      this.setAttribute('highlight', '');
    } else {
      this.removeAttribute('highlight');
    }
  }

  set folderPaddingLeft(value: number) {
    if (this.folderIcon) {
      this.folderIcon.style.marginLeft = `${value}px`;
    }
  }

  set folderTextLeft(value: number) {
    this.nameEL!.style.marginLeft = `${value}px`;
  }

  set xpowerRowTitle(value: string) {
    this.nameEL!.title = `${value}`;
  }

  initElements(): void {
    this.rootEL = this.shadowRoot?.querySelector('.root');
    this.checkBoxEL = this.shadowRoot?.querySelector<LitCheckBox>('.lit-check-box');
    this.collectEL = this.shadowRoot?.querySelector<LitIcon>('.collect');
    this.describeEl = this.shadowRoot?.querySelector('.describe');
    this.trace = document.querySelector("body > sp-application")!.shadowRoot!.querySelector("#sp-system-trace") as SpSystemTrace;
    this.nameEL = this.shadowRoot?.querySelector('.name');
    this.canvasVessel = this.shadowRoot?.querySelector('.panel-vessel');
    this.tipEL = this.shadowRoot?.querySelector('.tip'); // @ts-ignore
    let canvasNumber = this.args.canvasNumber; // @ts-ignore
    if (!this.args.skeleton) {
      for (let i = 0; i < canvasNumber; i++) {
        let canvas = document.createElement('canvas');
        canvas.className = 'panel';
        this.canvas.push(canvas);
        if (this.canvasVessel) {
          this.canvasVessel.appendChild(canvas);
        }
      }
    }
    this.checkBoxEvent();
    this.describeEl?.addEventListener('click', () => {
      if (this.folder) {
        this.expansion = !this.expansion;
        this.sticky = this.expansion;
      }
    });
    this.funcExpand = true;
    if (this.rowSettingTree) {
      this.rowSettingTree.onChange = (e: unknown): void => {
        // @ts-ignore
        this.rowSettingPop!.visible = false;
        if (this.rowSettingTree?.multiple) {
          // @ts-ignore
          this.rowSettingPop!.visible = true;
        } else {
          // @ts-ignore
          this.rowSettingPop!.visible = false;
        } //@ts-ignore
        this.onRowSettingChangeHandler?.(this.rowSettingTree!.getCheckdKeys(), this.rowSettingTree!.getCheckdNodes());
      };
    }
    this.checkType = '-1';
  }

  private checkBoxEvent(): void {
    this.checkBoxEL!.onchange = (ev: unknown): void => {
      info('checkBoxEL onchange '); // @ts-ignore
      if (!ev.target.checked) {
        info('checkBoxEL target not checked');
        this.rangeSelect = false;
        this.checkType = '0';
      } else {
        this.rangeSelect = true;
        this.checkType = '2';
      } // @ts-ignore
      this.setCheckBox(ev.target.checked); // @ts-ignore
      ev.stopPropagation();
    };
    // 防止事件冒泡触发两次describeEl的点击事件
    this.checkBoxEL!.onclick = (ev: unknown): void => {
      // @ts-ignore
      ev.stopPropagation();
    };
  }

  addRowCheckFilePop(): void {
    this.rowCheckFilePop = document.createElement('litpopover') as LitPopover;
    this.rowCheckFilePop.innerHTML = `<div slot="content" id="jsonFile" style="display: block;height: auto;max-height:200px;overflow-y:auto">
    </div>
    <lit-icon name="copy-csv" size="19" id="myfolder"></lit-icon>
    <input type="file" id="jsoninput" style="width:0px;height:0px"placeholder=''/>`;
    this.rowCheckFilePop.id = 'rowCheckFile';
    this.rowCheckFilePop.className = 'popover checkFile';
    this.rowCheckFilePop.setAttribute('trigger', 'click');
    this.rowCheckFilePop?.addEventListener('mouseenter', (e): void => {
      window.publish(window.SmartEvent.UI.HoverNull, undefined);
    });
    this.fileEL = this.rowCheckFilePop.querySelector('#jsoninput');
    this.rowCheckFilePop.addEventListener('click', (e): void => {
      // @ts-ignore
      this.fileEL.click();
    }); // @ts-ignore
    this.fileEL.addEventListener('click', (event: Event) => {
      event.stopPropagation();
    });

    window.addEventListener('storage', (e): void => {
      if (e.storageArea === sessionStorage) {
        if (e.key === 'freqInfoData') {
          this.onRowCheckFileChangeHandler?.();
        }
      }
    }); // @ts-ignore
    this.fileEL.addEventListener(
      'change',
      (e: unknown): void => {
        // @ts-ignore
        let file = e.target.files[0];
        if (file && file.type === 'application/json') {
          let file_reader = new FileReader();
          file_reader.readAsText(file, 'UTF-8');
          file_reader.onload = (): void => {
            let fc = file_reader.result;
            window.sessionStorage.setItem('freqInfoData', JSON.stringify(fc));
            this.onRowCheckFileChangeHandler?.();
            alert('json文件上传成功！'); // @ts-ignore
            this.fileEL.value = '';
          };
        } else {
          return;
        }
      },
      false
    );
    this.describeEl?.appendChild(this.rowCheckFilePop);
  }

  addRowSettingCheckBox(appendAll: boolean = true): void {
    let nameEl = this.shadowRoot && (this.shadowRoot.querySelector('.name') as HTMLLabelElement);
    nameEl && (nameEl.style.maxWidth = '160px');
    let collectEl = (this.shadowRoot && this.shadowRoot.querySelector('.collect') as LitIcon);
    collectEl && (collectEl.style.marginRight = '20px');
    this.rowSettingCheckBoxPop = document.createElement('lit-popover') as LitPopover;
    let checkboxHtml = '';
    if (appendAll) {
      checkboxHtml += `<div class="checkboxAll" style="margin-bottom: 2px;">
        <lit-check-box class="lit-checkbox" value="All" checked></lit-check-box></div>`;
    }
    this._rowSettingCheckBoxList && this._rowSettingCheckBoxList.forEach((item) => {
      checkboxHtml += `<div class="checkboxItem" style="margin-bottom: 2px;">
      <lit-check-box class="lit-checkbox" ${ appendAll ? 'checked' : '' } style="margin-left: ${appendAll ? 20 : 5}px;color:#000" not-close value="${item}"></lit-check-box>
      </div>`;
    });
    this._rowSettingCheckedBoxList = new Array(this._rowSettingCheckBoxList?.length).fill(appendAll);
    this.rowSettingCheckBoxPop.innerHTML = `<div slot="content" id="settingList"
      style="display: block;height: auto;max-height:200px;overflow-y:auto">
      ${checkboxHtml} </div>
      <lit-icon name="setting" size="19" id="setting"></lit-icon>`;
    let allCheckBox = this.rowSettingCheckBoxPop!.querySelector('.checkboxAll>.lit-checkbox') as LitCheckBox;
    let checkBoxItems = this.rowSettingCheckBoxPop.querySelectorAll('.checkboxItem>.lit-checkbox');
    checkBoxItems.forEach(item => {
      // @ts-ignore
      item.onchange = (e: unknown): void => {
        // @ts-ignore
        this._rowSettingCheckedBoxList[this._rowSettingCheckBoxList?.indexOf(item.value)] = item.checked;
        if (appendAll) {
          const allChecked = this._rowSettingCheckedBoxList!.every(item => item);
          allCheckBox.checked = allChecked;
        }
        this.onRowSettingCheckBoxChangeHandler?.(this._rowSettingCheckedBoxList!);
      };
    });
    if (appendAll) {
      allCheckBox.onchange = (e: unknown): void => {
        checkBoxItems.forEach(item => {
          // @ts-ignore
          item.checked = allCheckBox.checked;
        });
        this._rowSettingCheckedBoxList!.forEach((_, index) => {
          this._rowSettingCheckedBoxList![index] = allCheckBox.checked;
        });
        this.onRowSettingCheckBoxChangeHandler?.(this._rowSettingCheckedBoxList!);
      };
    }
    this.rowSettingCheckBoxPop.id = 'rowSetting';
    this.rowSettingCheckBoxPop.className = 'popover setting';
    this.rowSettingCheckBoxPop.setAttribute('placement', 'bottomLeft');
    this.rowSettingCheckBoxPop.setAttribute('trigger', 'click');
    this.rowSettingCheckBoxPop.setAttribute('haveCheckbox', 'true');
    this.rowSettingCheckBoxPop?.addEventListener('mouseenter', (): void => {
      window.publish(window.SmartEvent.UI.HoverNull, undefined);
    });
    this.describeEl?.appendChild(this.rowSettingCheckBoxPop);
  }

  addRowSettingPop(): void {
    let nameEl = this.shadowRoot && (this.shadowRoot.querySelector('.name') as HTMLLabelElement);
    let favoriteList = this.trace!.shadowRoot?.querySelector("#favorite-chart-list") as SpChartList;
    nameEl && (nameEl.style.maxWidth = '160px');
    let collectEl = (this.shadowRoot && this.shadowRoot.querySelector('.collect') as LitIcon);
    collectEl && (collectEl.style.marginRight = '20px');
    this.rowSettingPop = document.createElement('lit-popover') as LitPopover;
    this.rowSettingPop.innerHTML = `<div slot="content" id="settingList"
      style="display: block;height: auto;max-height:200px;overflow-y:auto">
      <lit-tree id="rowSettingTree" checkable="true"></lit-tree>
      </div>
      <lit-icon name="setting" size="19" id="setting"></lit-icon>`;
    this.rowSettingPop.id = 'rowSetting';
    this.rowSettingPop.className = 'popover setting';
    this.rowSettingPop.setAttribute('placement', 'bottomLeft');
    this.rowSettingPop.setAttribute('trigger', 'click');
    this.rowSettingPop.setAttribute('haveRadio', 'true');
    this.rowSettingTree = this.rowSettingPop.querySelector('#rowSettingTree') as LitTree;
    this.rowSettingTree.onChange = (): void => {
      TraceRow.ROW_TYPE_HIPERF_THREADTYPE = [];
      let isVisible = false;
      // @ts-ignore
      this.rowSettingPop!.visible = isVisible;
      if (this.rowSettingTree?.multiple) {
        isVisible = true;
      }
      // @ts-ignore
      this.rowSettingPop!.visible = isVisible;
      TraceRow.ROW_TYPE_HIPERF_THREADTYPE.push(Number(this.rowSettingTree!.getCheckdKeys())); //@ts-ignore
      this.onRowSettingChangeHandler?.(this.rowSettingTree!.getCheckdKeys(), this.rowSettingTree!.getCheckdNodes());
      if (LitPopover) {
        favoriteList.style.height = LitPopover.isChangeHeight ? `${LitPopover.finalHeight}px` : '300px';
      }
    };
    this.rowSettingPop?.addEventListener('mouseenter', (): void => {
      window.publish(window.SmartEvent.UI.HoverNull, undefined);
    });
    this.describeEl?.appendChild(this.rowSettingPop);
  }

  getRowSettingKeys(): Array<string> {
    if (this.rowSetting === 'enable') {
      //@ts-ignore
      return this.rowSettingTree!.getCheckdKeys();
    }
    return [];
  }

  getRowSettingCheckStateByKey(key: string): boolean {
    const index = this._rowSettingCheckBoxList?.indexOf(key);
    if (index != undefined) {
      return this._rowSettingCheckedBoxList?.[index] === true;
    }
    return false;
  }

  //@ts-ignore
  expandFunc(rootRow: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (this._enableCollapseChart && !this.funcExpand) {
      let foldHeight = Number(this.style.height.substring(0, this.style.height.length - 2));
      this.style.height = `${this.funcMaxHeight}px`;
      this.funcExpand = true;
      rootRow.needRefresh = true;
      sp.refreshCanvas(true);
      if (this.collect) {
        window.publish(window.SmartEvent.UI.RowHeightChange, {
          expand: this.funcExpand,
          value: this.funcMaxHeight - foldHeight,
        });
      }
    }
  }

  enableCollapseChart(H: number, trace: unknown): void {
    this._enableCollapseChart = true;
    this.nameEL!.onclick = (): void => {
      if (this.funcMaxHeight > H || this.clientHeight > H) {
        if (this.funcExpand) {
          this.funcMaxHeight = this.clientHeight;
          this.style.height = H + 'px';
          this.funcExpand = false;
        } else {
          this.style.height = `${this.funcMaxHeight}px`;
          this.funcExpand = true;
        }
        this.trace!.linkNodes.length && this.trace!.linkNodes.forEach((linkNodeItem) => this.handlerLink(linkNodeItem));
        TraceRow.range!.refresh = true;
        this.needRefresh = true;
        //@ts-ignore
        trace.refreshCanvas(true);
        if (this.collect) {
          window.publish(window.SmartEvent.UI.RowHeightChange, {
            expand: this.funcExpand,
            value: this.funcExpand ? this.funcMaxHeight : this.funcMaxHeight - H,
          });
        }
      }
    };
  }

  handlerLink(linkItem: PairPoint[]): void {
    linkItem[0].offsetY = linkItem[0].rowEL.funcExpand ? linkItem[0].sourceOffsetY! : 7;//24/2-5
    linkItem[1].offsetY = linkItem[1].rowEL.funcExpand ? linkItem[1].sourceOffsetY! : 7;
    linkItem[0].y = linkItem[0].rowEL.translateY + linkItem[0].offsetY;
    linkItem[1].y = linkItem[1].rowEL.translateY + linkItem[1].offsetY;
  }

  initCanvas(list: Array<HTMLCanvasElement>): void {
    let timerShaftEL = document!
      .querySelector('body > sp-application')!
      .shadowRoot!.querySelector('#sp-system-trace')!
      .shadowRoot!.querySelector('div > timer-shaft-element');
    let timerShaftCanvas = timerShaftEL!.shadowRoot!.querySelector<HTMLCanvasElement>('canvas');
    let tempHeight: number = 0;
    if (this.rowType === TraceRow.ROW_TYPE_FUNC) {
      tempHeight = 20;
    } else if (this.rowType === TraceRow.ROW_TYPE_THREAD) {
      tempHeight = 30;
    } else if (this.rowType === TraceRow.ROW_TYPE_SYSTEM_ENERGY) {
      tempHeight = 80;
    } else if (this.rowType === TraceRow.ROW_TYPE_POWER_ENERGY) {
      tempHeight = 200;
    } else if (this.rowType === TraceRow.ROW_TYPE_ANOMALY_ENERGY) {
      tempHeight = 55;
    } else {
      tempHeight = 40;
    }
    this.dpr = window.devicePixelRatio || 1;
    list.forEach((canvas): void => {
      this.rootEL!.style.height = `${this.getAttribute('height') || '40'}px`;
      canvas.style.width = timerShaftCanvas!.style.width;
      canvas.style.height = `${tempHeight}px`;
      this.canvasWidth = timerShaftCanvas!.width;
      this.canvasHeight = Math.ceil(tempHeight * this.dpr);
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      // @ts-ignore
      this.offscreen.push(canvas!.transferControlToOffscreen());
    });
  }

  updateWidth(width: number): void {
    this.dpr = window.devicePixelRatio || 1;
    let tempHeight: number = 0;
    if (this.rowType === TraceRow.ROW_TYPE_FUNC) {
      tempHeight = 20;
    } else if (this.rowType === TraceRow.ROW_TYPE_THREAD) {
      tempHeight = 30;
    } else if (this.rowType === TraceRow.ROW_TYPE_SYSTEM_ENERGY) {
      tempHeight = 90;
    } else if (this.rowType === TraceRow.ROW_TYPE_POWER_ENERGY) {
      tempHeight = 200;
    } else if (this.rowType === TraceRow.ROW_TYPE_ANOMALY_ENERGY) {
      tempHeight = 55;
    } else {
      tempHeight = 40;
    }
    if (this.canvas.length > 1) {
      tempHeight = 20;
    }
    this.canvas.forEach((it): void => {
      this.canvasWidth = Math.ceil((width - (this.describeEl?.clientWidth || 248)) * this.dpr);
      this.canvasHeight = Math.ceil(tempHeight * this.dpr);
      it!.style.width = `${width - (this.describeEl?.clientWidth || 248)}px`; // @ts-ignore
      if (this.args.isOffScreen) {
        this.draw(true);
      }
    });
  }

  drawLine(item: HTMLDivElement, direction: string /*string[top|bottom]*/): void {
    if (!item) {
      return;
    }
    switch (direction) {
      case 'top':
        item.classList.remove('line-bottom');
        item.classList.add('line-top');
        break;
      case 'bottom':
        item.classList.remove('line-top');
        item.classList.add('line-bottom');
        break;
      case '':
        item.classList.remove('line-top');
        item.classList.remove('line-bottom');
        break;
    }
  }

  connectedCallback(): void {
    this.describeEl!.ondragstart = (ev: DragEvent): void => this.rowDragstart(ev);
    this.describeEl!.ondragleave = (ev: unknown): void => {
      // @ts-ignore
      this.drawLine(ev.currentTarget, '');
      // @ts-ignore
      (window as unknown).collectResize = false;
      return undefined;
    };
    this.describeElEvent();
    this.collectEL!.onclick = (e): void => {
      this.collect = !this.collect;
      if (this.collect) {
        this.describeEl!.draggable = false;
      } else {
        this.describeEl!.draggable = false;
      }
      document.dispatchEvent(
        new CustomEvent('collect', {
          detail: {
            type: e.type,
            row: this,
          },
        })
      );
      this.favoriteChangeHandler?.(this);
    }; // @ts-ignore
    if (!this.args.skeleton) {
      this.initCanvas(this.canvas);
    }
  }

  private describeElEvent(): void {
    this.describeEl!.ondragend = (ev: unknown): void => {
      rowDragId = null; // @ts-ignore
      ev.target.classList.remove('drag'); // @ts-ignore
      this.drawLine(ev.currentTarget, '');
      return undefined;
    };
    this.describeEl!.ondragover = (ev: unknown): undefined => {
      if (!this.collect || rowDragId === this.rowId) {
        return;
      } // @ts-ignore
      let rect = ev.currentTarget.getBoundingClientRect(); // @ts-ignore
      if (ev.clientY >= rect.top && ev.clientY < rect.top + rect.height / 2) {
        //上面
        dragDirection = 'top'; // @ts-ignore
        this.drawLine(ev.currentTarget, 'top'); // @ts-ignore
      } else if (ev.clientY <= rect.bottom && ev.clientY > rect.top + rect.height / 2) {
        //下面
        dragDirection = 'bottom'; // @ts-ignore
        this.drawLine(ev.currentTarget, 'bottom');
      }
      return undefined;
    };
    this.describeEl!.ondrop = (ev: unknown): void => {
      if (!this.collect) {
        return;
      } // @ts-ignore
      this.drawLine(ev.currentTarget, '');
      let spacer = this.parentElement!.previousElementSibling! as HTMLDivElement;
      let startDragNode = collectList.findIndex((it): boolean => it.rowId === rowDragId);
      let endDragNode = collectList.findIndex((it): boolean => it === this);
      if (startDragNode === -1 || endDragNode === -1) {
        return;
      }
      if (startDragNode < endDragNode && dragDirection === 'top') {
        endDragNode--;
      } else if (startDragNode > endDragNode && dragDirection === 'bottom') {
        endDragNode++;
      }
      collectList.splice(endDragNode, 0, ...collectList.splice(startDragNode, 1));
      collectList.forEach((it, i): void => {
        if (i === 0) {
          // @ts-ignore
          it.style.top = `${spacer.offsetTop + 48}px`;
        } else {
          it.style.top = `${collectList[i - 1].offsetTop + collectList[i - 1].offsetHeight}px`;
        }
      });
    };
  }

  rowDragstart(ev: unknown): void {
    rowDragId = this.rowId; // @ts-ignore
    ev.target.classList.add('drag');
  }

  setCheckBox(isCheck: boolean): void {
    if (this.folder) {
      // favorite row  check change;
      window.publish(window.SmartEvent.UI.CheckALL, {
        rowId: this.rowId,
        isCheck: isCheck,
      });
      this.childrenList!.forEach((ck): void => {
        ck.setAttribute('check-type', isCheck ? '2' : '0');
        let allCheck: LitCheckBox | null | undefined = ck?.shadowRoot?.querySelector('.lit-check-box');
        if (allCheck) {
          allCheck!.checked = isCheck;
        }
      });
    }
    this.selectChangeHandler?.(this);
  }

  onMouseHover(x: number, y: number, tip: boolean = true): T | undefined | null {
    if (this.tipEL) {
      this.tipEL.style.display = 'none';
    }
    return null;
  }

  setTipLeft(x: number, struct: unknown): void {
    if (struct === null && this.tipEL) {
      this.tipEL.style.display = 'none';
      return;
    }
    if (this.tipEL) {
      this.tipEL.style.display = 'flex';
      if (x + this.tipEL.clientWidth > (this.canvasVessel!.clientWidth || 0)) {
        this.tipEL.style.transform = `translateX(${x - this.tipEL.clientWidth - 1}px)`;
      } else {
        this.tipEL.style.transform = `translateX(${x}px)`;
      }
    }
  }

  onMouseLeave(x: number, y: number): void {
    if (this.tipEL) {
      this.tipEL.style.display = 'none';
    }
    if (this.rowSettingCheckBoxPop) {
      //@ts-ignore
      this.rowSettingCheckBoxPop.visible = false;
    }
  }

  loadingPin1: number = 0;
  loadingPin2: number = 0;
  static currentActiveRows: Array<string> = [];

  drawFrame(): void {
    if (!this.hasAttribute('row-hidden') && !this.hasAttribute('row-discard')) {
      if (!this.loadingFrame || window.isLastFrame || !this.isComplete) {
        if (this.needRefresh || window.isLastFrame) {
          this.loadingFrame = true;
          this.needRefresh = false;
          this.loadingPin1 = TraceRow.range?.startNS || 0;
          this.loadingPin2 = TraceRow.range?.endNS || 0;
          TraceRow.currentActiveRows.push(`${this.rowType}-${this.rowId}`);
          this.supplierFrame!().then((res) => {
            if (this.onComplete) {
              this.onComplete();
              this.onComplete = undefined;
            }
            this.dataListCache = res;
            this.dataListCache.push(...this.fixedList);
            this.isComplete = true;
            this.loadingFrame = false;
            let idx = TraceRow.currentActiveRows.findIndex((it): boolean => it === `${this.rowType}-${this.rowId}`);
            if (idx !== -1) {
              TraceRow.currentActiveRows.splice(idx, 1);
            }
            requestAnimationFrame(() => {
              this.onThreadHandler?.(true, null);
              if (TraceRow.currentActiveRows) {
                window.publish(window.SmartEvent.UI.LoadFinish, '');
              }
              window.publish(window.SmartEvent.UI.LoadFinishFrame, '');
            });
          });
        } else if (this.fixedList.length > 0 && !this.dataListCache.includes(this.fixedList[0])) {
          this.dataListCache.push(this.fixedList[0]);
        }
      }
      this.onThreadHandler?.(true, null);
    }
  }

  refreshCheckType(): boolean {
    if (!this.rangeSelect && this.traceId !== Utils.currentSelectTrace) {
      this.checkBoxEL!.style.display = 'none';
      this.rangeSelect = false;
      this.removeAttribute('check-type');
      return true;
    }
    return false;
  }

  draw(useCache: boolean = false): void {
    this.dpr = window.devicePixelRatio || 1;
    if (this.sleeping) {
      return;
    }
    this.refreshCheckType();
    if (this.supplierFrame) {
      //如果设置了实时渲染,则调用drawFrame
      this.drawFrame();
      return;
    }
    if (this.online) {
      if (!useCache && !TraceRow.isUserInteraction) {
        this.supplier?.().then((res) => {
          // @ts-ignore
          this.onThreadHandler?.(useCache, res as unknown);
        });
      }
      this.onThreadHandler?.(useCache, null);
      return;
    }
    if (!this.isComplete) {
      if (this.supplier && !this.isLoading) {
        this.isLoading = true;
        this.must = true;
        let promise = this.supplier();
        if (promise) {
          promise.then((res): void => {
            this.dataList = res;
            if (this.onComplete) {
              this.onComplete();
            }
            window.publish(window.SmartEvent.UI.TraceRowComplete, this);
            this.isComplete = true;
            this.isLoading = false;
            this.draw(false);
          });
        } else {
          this.isLoading = false;
          this.draw(false);
        }
      }
    } else {
      if (!this.hasAttribute('row-hidden')) {
        if (this.onThreadHandler && this.dataList) {
          this.onThreadHandler!(false, null);
        }
      }
    }
  }

  canvasSave(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(0, this.translateY);
    const clipRect = new Path2D(); // @ts-ignore
    clipRect.rect(0, 0, this.frame.width, this.frame.height);
    ctx.clip(clipRect);
  }

  canvasRestore(ctx: CanvasRenderingContext2D, trace?: SpSystemTrace | null): void {
    drawSelectionRange(ctx, this);
    ctx.restore();
  }

  clearCanvas(ctx: CanvasRenderingContext2D): void {
    if (ctx) {
      this.canvas.forEach((it): void => {
        ctx.clearRect(0, 0, it!.clientWidth || 0, it!.clientHeight || 0);
      });
    }
  }

  drawLines(ctx: CanvasRenderingContext2D): void {
    if (ctx) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.getLineColor();
      TraceRow.range?.xs.forEach((it): void => {
        ctx.moveTo(Math.floor(it), 0);
        ctx.lineTo(Math.floor(it), this.shadowRoot?.host.clientHeight || 0);
      });
      ctx.stroke();
    }
  }

  getLineColor(): string {
    return window.getComputedStyle(this.rootEL!, null).getPropertyValue('border-bottom-color');
  }

  drawSelection(ctx: CanvasRenderingContext2D): void {
    if (this.rangeSelect) {
      TraceRow.rangeSelectObject!.startX = Math.floor(
        ns2x(
          TraceRow.rangeSelectObject!.startNS!,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS!, // @ts-ignore
          this.frame
        )
      );
      TraceRow.rangeSelectObject!.endX = Math.floor(
        ns2x(
          TraceRow.rangeSelectObject!.endNS!,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS!, // @ts-ignore
          this.frame
        )
      );
      if (ctx) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#666666';
        ctx.fillRect(
          TraceRow.rangeSelectObject!.startX!, // @ts-ignore
          this.frame.y,
          TraceRow.rangeSelectObject!.endX! - TraceRow.rangeSelectObject!.startX!, // @ts-ignore
          this.frame.height
        );
        ctx.globalAlpha = 1;
      }
    }
  }

  isInTimeRange(startTime: number, duration: number): boolean {
    return (
      (startTime || 0) + (duration || 0) > (TraceRow.range?.startNS || 0) &&
      (startTime || 0) < (TraceRow.range?.endNS || 0)
    );
  }

  buildArgs(obj: unknown): unknown {
    let result: unknown = {
      list: this.must ? this.dataList : undefined,
      offscreen: !this.isTransferCanvas ? this.offscreen[0] : undefined, //是否离屏
      dpr: this.dpr, //屏幕dpr值
      xs: TraceRow.range?.xs, //线条坐标信息
      isHover: this.isHover,
      hoverX: this.hoverX,
      hoverY: this.hoverY,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      isRangeSelect: this.rangeSelect,
      rangeSelectObject: TraceRow.rangeSelectObject,
      lineColor: this.getLineColor(),
      chartColor: ColorUtils.MD_PALETTE[0],
      startNS: TraceRow.range?.startNS || 0,
      endNS: TraceRow.range?.endNS || 0,
      totalNS: TraceRow.range?.totalNS || 0,
      slicesTime: TraceRow.range?.slicesTime,
      range: TraceRow.range,
      frame: this.frame,
      flagMoveInfo: null,
      flagSelectedInfo: null,
      wakeupBean: null,
    }; // @ts-ignore
    Reflect.ownKeys(obj).forEach((it): void => {
      // @ts-ignore
      result[it] = obj[it];
    });
    return result;
  }

  getTransferArray(): unknown[] {
    let tsf = [];
    if (!this.isTransferCanvas) {
      tsf.push(this.offscreen[0]);
    }
    if (this.must && this.dataList instanceof ArrayBuffer) {
      tsf.push(this.dataList);
    }
    return tsf;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    switch (name) {
      case 'name':
        if (this.nameEL) {
          this.nameEL.textContent = newValue;
          this.nameEL.title = newValue;
        }
        break;
      case 'height':
        if (newValue !== oldValue) {
          // @ts-ignore
          if (!this.args.isOffScreen) {
          }
        }
        break;
      case 'check-type':
        if (newValue === 'check') {
          this.checkBoxEL?.setAttribute('checked', '');
        } else {
          this.checkBoxEL?.removeAttribute('checked');
        }
        break;
    }
  }

  focusContain(e: MouseEvent, inFavoriteArea: boolean, prevScrollY: number = 0, favoriteHeight: number): boolean {
    let _y = (e.currentTarget as HTMLElement).getBoundingClientRect().y;
    let myRect = this.getBoundingClientRect();
    let x = e.offsetX;
    let y = e.offsetY + _y;
    let rectY = myRect.y;
    let rectHeight = myRect.height;
    if (!inFavoriteArea && favoriteHeight !== undefined) {
      let expand = sessionStorage.getItem('expand');
      let foldHeight = Number(sessionStorage.getItem('foldHeight'));
      y = expand === 'true' ?
        (e.offsetY + prevScrollY - 148 - favoriteHeight!) :
        (e.offsetY + prevScrollY - (148 - foldHeight) - favoriteHeight!);
      rectY = this.offsetTop;
      rectHeight = this.clientHeight;
    }
    if (x >= myRect.x && x <= myRect.x + myRect.width && y >= rectY &&
      y <= rectY + rectHeight) {
      this.hoverX = x - this.describeEl!.clientWidth;
      this.hoverY = y - rectY;
      this.isHover = this.collect === inFavoriteArea;
      return true;
    } else {
      this.isHover = false;
      if (this.tipEL) {
        this.tipEL.style.display = 'none';
      }
      return false;
    }
  }

  initHtml(): string {
    return TraceRowHtml;
  }
}
