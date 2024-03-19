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
import { drawSelectionRange, isFrameContainPoint } from '../../../database/ui-worker/ProcedureWorkerCommon';
import { TraceRowConfig } from './TraceRowConfig';
import { type TreeItemData, LitTree } from '../../../../base-ui/tree/LitTree';
import { SpSystemTrace } from '../../SpSystemTrace';
import { TraceRowHtml } from './TraceRow.html';

export class RangeSelectStruct {
  startX: number | undefined;
  endX: number | undefined;
  startNS: number | undefined;
  endNS: number | undefined;
}

let collectList: Array<any> = [];
let rowDragElement: EventTarget | undefined | null;
let dragDirection: string = '';

@element('trace-row')
export class TraceRow<T extends BaseStruct> extends HTMLElement {
  sharedArrayBuffers: any;
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
  static ROW_TYPE_CPU_STATE_ALL = 'cpu-State';
  static ROW_TYPE_CPU_FREQ_LIMITALL = 'cpu-frequency-limit';
  static ROW_TYPE_FPS = 'fps';
  static ROW_TYPE_NATIVE_MEMORY = 'native-memory';
  static ROW_TYPE_HIPERF = 'hiperf';
  static ROW_TYPE_DELIVER_INPUT_EVENT = 'DeliverInputEvent';
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
  static ROW_TYPE_MEM = 'mem';
  static ROW_TYPE_VIRTUAL_MEMORY_GROUP = 'virtual-memory-group';
  static ROW_TYPE_VIRTUAL_MEMORY = 'virtual-memory-cell';
  static ROW_TYPE_FILE_SYSTEM_GROUP = 'file-system-group';
  static ROW_TYPE_FILE_SYSTEM = 'file-system-cell';
  static ROW_TYPE_HEAP = 'heap';
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
  static ROW_TYPE_CLOCK_GROUP = 'clock-group';
  static ROW_TYPE_COLLECT_GROUP = 'collect-group';
  static ROW_TYPE_CLOCK = 'clock';
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
  static ROW_TYPE_ALL_APPSTARTUPS = 'all-appstartups';
  static FRAME_WIDTH: number = 0;
  static range: TimeRange | undefined | null;
  static rangeSelectObject: RangeSelectStruct | undefined;
  static ROW_TYPE_HI_SYSEVENT = 'hi-sysevent';
  public obj: TraceRowObject<any> | undefined | null;
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
  public onRowSettingChangeHandler: ((keys: Array<string>, nodes: Array<any>) => void) | undefined | null;
  public onRowCheckFileChangeHandler: ((file: string | ArrayBuffer | null) => void) | undefined | null;
  public supplier: (() => Promise<Array<T>>) | undefined | null;
  public favoriteChangeHandler: ((fav: TraceRow<any>) => void) | undefined | null;
  public selectChangeHandler: ((traceRow: TraceRow<any>) => void) | undefined | null;
  dpr = window.devicePixelRatio || 1;
  // @ts-ignore
  offscreen: Array<OffscreenCanvas | undefined> = [];
  canvasWidth = 0;
  canvasHeight = 0;
  private _collectGroup: string | undefined;
  public _frame: Rect | undefined;
  public isLoading: boolean = false;
  public tampName: string = '';
  public readonly args: any;
  public templateType: Set<string> = new Set<string>();
  private rootEL: HTMLDivElement | null | undefined;
  private nameEL: HTMLLabelElement | null | undefined;
  private rowSettingTree: LitTree | null | undefined;
  private rowSettingPop: LitPopover | null | undefined;
  private fileEL: any;
  private rowCheckFilePop: LitPopover | null | undefined;
  private _rangeSelect: boolean = false;
  private _drawType: number = 0;
  private _enableCollapseChart: boolean = false;
  online: boolean = false;
  static isUserInteraction: boolean;
  asyncFuncName: string | undefined | null;
  asyncFuncNamePID: number | undefined | null;
  translateY: number = 0; //single canvas offsetY;
  childrenList: Array<TraceRow<any>> = [];
  parentRowEl: TraceRow<any> | undefined;
  _rowSettingList: Array<TreeItemData> | null | undefined;
  public supplierFrame: (() => Promise<Array<T>>) | undefined | null; //实时查询
  public getCacheData: ((arg: any) => Promise<Array<any>> | undefined) | undefined; //实时查询
  public loadingFrame: boolean = false; //实时查询,正在查询中
  public needRefresh: boolean = true;
  _docompositionList: Array<number> | undefined;
  public folderIcon: LitIcon | null | undefined;

  focusHandler?: (ev: MouseEvent) => void | undefined;
  findHoverStruct?: () => void | undefined;
  public funcMaxHeight: number = 0;
  currentContext: CanvasRenderingContext2D | undefined | null;

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
    }
  ) {
    super();
    this.args = args;
    this.attachShadow({ mode: 'open' }).innerHTML = this.initHtml();
    this.initElements();
  }

  static skeleton<T extends BaseStruct>(): TraceRow<T> {
    let tr = new TraceRow<T>({
      alpha: false,
      canvasNumber: 0,
      contextId: '',
      isOffScreen: false,
      skeleton: true,
    });
    tr.isTransferCanvas = true;
    return tr;
  }

  static get observedAttributes() {
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
  get docompositionList(): Array<number> | undefined {
    return this._docompositionList;
  }

  set docompositionList(value: Array<number> | undefined) {
    this._docompositionList = value;
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
    if (value) {
      this.setAttribute('row-discard', '');
      this.style.display = 'none';
    } else {
      this.removeAttribute('row-discard');
      this.style.display = 'block';
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

  get collect(): boolean {
    return this.hasAttribute('collect-type');
  }

  set collect(value) {
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
    this._rangeSelect = value;
  }

  sleeping: boolean = false;

  get rowType(): string | undefined | null {
    return this.getAttribute('row-type');
  }

  set rowType(val) {
    this.setAttribute('row-type', val || '');
  }

  get rowId(): string | undefined | null {
    return this.getAttribute('row-id');
  }

  set rowId(val) {
    this.setAttribute('row-id', val || '');
  }

  get rowParentId(): string | undefined | null {
    return this.getAttribute('row-parent-id');
  }

  set rowParentId(val) {
    this.setAttribute('row-parent-id', val || '');
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

  toParentAddTemplateType = (currentRowEl: TraceRow<any>): void => {
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

  getHoverStruct(strict: boolean = true, offset: boolean = false, maxKey: string | undefined = undefined): T | undefined {
    if (this.isHover) {
      if (maxKey) {
        let arr =  this.dataListCache.filter(
          (re) => re.frame && isFrameContainPoint(re.frame, this.hoverX, this.hoverY, strict, offset)
        ).sort((targetA, targetB) => (targetB as any)[maxKey] - (targetA as any)[maxKey]);
        return arr[0];
      } else {
        return this.dataListCache.find(
          (re) => re.frame && isFrameContainPoint(re.frame, this.hoverX, this.hoverY, strict, offset)
        );
      }

    }
  }

  addChildTraceRow(child: TraceRow<any>) {
    TraceRowConfig.allTraceRowList.push(child);
    child.parentRowEl = this;
    this.toParentAddTemplateType(child);
    child.setAttribute('scene', '');
    this.childrenList.push(child);
    child.rowHidden = false;
    this.fragment.appendChild(child);
  }

  addChildTraceRowAfter(child: TraceRow<any>, targetRow: TraceRow<any>) {
    TraceRowConfig.allTraceRowList.push(child);
    child.parentRowEl = this;
    this.toParentAddTemplateType(child);
    let index = this.childrenList.indexOf(targetRow);
    child.setAttribute('scene', '');
    if (index != -1) {
      this.childrenList.splice(index + 1, 0, child);
      child.rowHidden = false;
      this.fragment.insertBefore(child, this.fragment.childNodes.item(index + 1));
    } else {
      this.childrenList.push(child);
      child.rowHidden = false;
      this.fragment.append(child);
    }
  }

  addChildTraceRowBefore(child: TraceRow<BaseStruct>, targetRow: TraceRow<BaseStruct>) {
    TraceRowConfig.allTraceRowList.push(child);
    child.parentRowEl = this;
    this.toParentAddTemplateType(child);
    let index = this.childrenList.indexOf(targetRow);
    child.setAttribute('scene', '');
    if (index != -1) {
      this.childrenList.splice(index, 0, child);
      this.fragment.insertBefore(child, this.fragment.childNodes.item(index));
    } else {
      this.childrenList.push(child);
      child.rowHidden = false;
      this.fragment.appendChild(child);
    }
  }

  addChildTraceRowSpecifyLocation(child: TraceRow<any>, index: number) {
    TraceRowConfig.allTraceRowList.push(child);
    child.parentRowEl = this;
    child.setAttribute('scene', '');
    this.childrenList.splice(index, 0, child);
    child.rowHidden = false;
    this.fragment.insertBefore(child, this.fragment.childNodes.item(index));
  }

  insertAfter(newEl: DocumentFragment, targetEl: HTMLElement) {
    let parentEl = targetEl.parentNode;
    if (parentEl) {
      if (parentEl!.lastChild === targetEl) {
        parentEl!.appendChild(newEl);
      } else {
        parentEl!.insertBefore(newEl, targetEl.nextSibling);
      }
    }
  }

  set tip(value: string) {
    if (this.tipEL) {
      this.tipEL.innerHTML = value;
    }
  }

  get frame(): Rect | any {
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
    this._drawType = value;
    let radioList: NodeListOf<any> = this.shadowRoot!.querySelectorAll('input[type=radio][name=status]');
    if (radioList!.length > 0) {
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
      this.folderIcon.style.marginLeft = value + 'px';
    }
  }

  set folderTextLeft(value: number) {
    this.nameEL!.style.marginLeft = value + 'px';
  }

  initElements(): void {
    this.rootEL = this.shadowRoot?.querySelector('.root');
    this.checkBoxEL = this.shadowRoot?.querySelector<LitCheckBox>('.lit-check-box');
    this.collectEL = this.shadowRoot?.querySelector<LitIcon>('.collect');
    this.describeEl = this.shadowRoot?.querySelector('.describe');
    this.nameEL = this.shadowRoot?.querySelector('.name');
    this.canvasVessel = this.shadowRoot?.querySelector('.panel-vessel');
    this.tipEL = this.shadowRoot?.querySelector('.tip');
    let canvasNumber = this.args['canvasNumber'];
    if (!this.args['skeleton']) {
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
      this.rowSettingTree.onChange = (e: any): void => {
        // @ts-ignore
        this.rowSettingPop!.visible = false;
        if (this.rowSettingTree?.multiple) {
          // @ts-ignore
          this.rowSettingPop!.visible = true;
        } else {
          // @ts-ignore
          this.rowSettingPop!.visible = false;
        }
        this.onRowSettingChangeHandler?.(this.rowSettingTree!.getCheckdKeys(), this.rowSettingTree!.getCheckdNodes());
      };
    }
    this.checkType = '-1';
  }

  private checkBoxEvent(): void {
    this.checkBoxEL!.onchange = (ev: any) => {
      info('checkBoxEL onchange ');
      if (!ev.target.checked) {
        info('checkBoxEL target not checked');
        this.rangeSelect = false;
        this.checkType = '0';
      } else {
        this.rangeSelect = true;
        this.checkType = '2';
      }
      this.setCheckBox(ev.target.checked);
      ev.stopPropagation();
    };
    // 防止事件冒泡触发两次describeEl的点击事件
    this.checkBoxEL!.onclick = (ev: any) => {
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
    this.rowCheckFilePop?.addEventListener('mouseenter', (e) => {
      window.publish(window.SmartEvent.UI.HoverNull, undefined);
    });
    this.fileEL = this.rowCheckFilePop.querySelector('#jsoninput');
    this.rowCheckFilePop.onclick = (): void => {
      this.fileEL.click();
      this.fileEL.addEventListener(
        'change',
        (e: any) => {
          let file = e.target.files[0];
          if (file.type === 'application/json') {
            let file_reader = new FileReader();
            file_reader.readAsText(file, 'UTF-8');
            file_reader.onload = () => {
              let fc = file_reader.result;
              this.onRowCheckFileChangeHandler?.(fc);
            };
          } else {
            return;
          }
        },
        false
      );
    };
    this.describeEl?.appendChild(this.rowCheckFilePop);
  }

  addRowSettingPop(): void {
    this.rowSettingPop = document.createElement('lit-popover') as LitPopover;
    this.rowSettingPop.innerHTML = `<div slot="content" id="settingList" style="display: block;height: auto;max-height:200px;overflow-y:auto">
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
      let isVisible = false;
      // @ts-ignore
      this.rowSettingPop!.visible = isVisible;
      if (this.rowSettingTree?.multiple) {
        isVisible = true;
      }
      // @ts-ignore
      this.rowSettingPop!.visible = isVisible;
      this.onRowSettingChangeHandler?.(this.rowSettingTree!.getCheckdKeys(), this.rowSettingTree!.getCheckdNodes());
    };
    this.rowSettingPop?.addEventListener('mouseenter', (e) => {
      window.publish(window.SmartEvent.UI.HoverNull, undefined);
    });
    this.describeEl?.appendChild(this.rowSettingPop);
  }

  getRowSettingKeys(): Array<string> {
    if (this.rowSetting === 'enable') {
      return this.rowSettingTree!.getCheckdKeys();
    }
    return [];
  }

  expandFunc(): void {
    if (this._enableCollapseChart && !this.funcExpand) {
      this.style.height = `${this.funcMaxHeight}px`;
      this.funcExpand = true;
      if (this.collect) {
        window.publish(window.SmartEvent.UI.RowHeightChange, {
          expand: this.funcExpand,
          value: this.funcMaxHeight - 20,
        });
      }
    }
  }

  enableCollapseChart(): void {
    this._enableCollapseChart = true;
    this.nameEL!.onclick = () => {
      if (this.funcMaxHeight > 20 || this.clientHeight > 20) {
        if (this.funcExpand) {
          this.funcMaxHeight = this.clientHeight;
          this.style.height = '20px';
          this.funcExpand = false;
        } else {
          this.style.height = `${this.funcMaxHeight}px`;
          this.funcExpand = true;
        }
        TraceRow.range!.refresh = true;
        this.needRefresh = true;
        this.draw(false);
        if (this.collect) {
          window.publish(window.SmartEvent.UI.RowHeightChange, {
            expand: this.funcExpand,
            value: this.funcMaxHeight - 20,
          });
        }
      }
    };
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
    list.forEach((canvas, i) => {
      this.rootEL!.style.height = `${this.getAttribute('height') || '40'}px`;
      canvas.style.width = timerShaftCanvas!.style.width;
      canvas.style.height = tempHeight + 'px';
      this.canvasWidth = timerShaftCanvas!.width;
      this.canvasHeight = Math.ceil(tempHeight * this.dpr);
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      // @ts-ignore
      this.offscreen.push(canvas!.transferControlToOffscreen());
    });
  }

  updateWidth(width: number) {
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
    this.canvas.forEach((it) => {
      this.canvasWidth = Math.ceil((width - (this.describeEl?.clientWidth || 248)) * this.dpr);
      this.canvasHeight = Math.ceil(tempHeight * this.dpr);
      it!.style.width = width - (this.describeEl?.clientWidth || 248) + 'px';
      if (this.args.isOffScreen) {
        this.draw(true);
      }
    });
  }

  drawLine(item: HTMLDivElement, direction: string /*string[top|bottom]*/) {
    if (!item) return;
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

  connectedCallback() {
    this.describeEl!.ondragstart = (ev: DragEvent) => this.rowDragstart(ev);
    this.describeEl!.ondragleave = (ev: any) => {
      this.drawLine(ev.currentTarget, '');
      return undefined;
    };
    this.describeElEvent();
    this.collectEL!.onclick = (e) => {
      if (this.isComplete) {
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
      }
    };
    if (!this.args['skeleton']) {
      this.initCanvas(this.canvas);
    }
  }

  private describeElEvent(): void {
    this.describeEl!.ondragend = (ev: any) => {
      rowDragElement = null;
      ev.target.classList.remove('drag');
      this.drawLine(ev.currentTarget, '');
      return undefined;
    };
    this.describeEl!.ondragover = (ev: any) => {
      if (!this.collect) return;
      if (rowDragElement === this) return;
      let rect = ev.currentTarget.getBoundingClientRect();
      if (ev.clientY >= rect.top && ev.clientY < rect.top + rect.height / 2) {
        //上面
        dragDirection = 'top';
        this.drawLine(ev.currentTarget, 'top');
      } else if (ev.clientY <= rect.bottom && ev.clientY > rect.top + rect.height / 2) {
        //下面
        dragDirection = 'bottom';
        this.drawLine(ev.currentTarget, 'bottom');
      }
      return undefined;
    };
    this.describeEl!.ondrop = (ev: any) => {
      if (!this.collect) return;
      this.drawLine(ev.currentTarget, '');
      let spacer = this.parentElement!.previousElementSibling! as HTMLDivElement;
      let startDragNode = collectList.findIndex((it) => it === rowDragElement);
      let endDragNode = collectList.findIndex((it) => it === this);
      if (startDragNode === -1 || endDragNode === -1) return;
      if (startDragNode < endDragNode && dragDirection === 'top') {
        endDragNode--;
      } else if (startDragNode > endDragNode && dragDirection === 'bottom') {
        endDragNode++;
      }
      collectList.splice(endDragNode, 0, ...collectList.splice(startDragNode, 1));
      collectList.forEach((it, i) => {
        if (i === 0) {
          it.style.top = `${spacer.offsetTop + 48}px`;
        } else {
          it.style.top = `${collectList[i - 1].offsetTop + collectList[i - 1].offsetHeight}px`;
        }
      });
    };
  }

  rowDragstart(ev: any) {
    rowDragElement = this;
    ev.target.classList.add('drag');
  }

  setCheckBox(isCheck: boolean) {
    if (this.folder) {
      // favorite row  check change;
      window.publish(window.SmartEvent.UI.CheckALL, {
        rowId: this.rowId,
        isCheck: isCheck,
      });
      this.childrenList!.forEach((ck) => {
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

  setTipLeft(x: number, struct: any) {
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

  onMouseLeave(x: number, y: number) {
    if (this.tipEL) {
      this.tipEL.style.display = 'none';
    }
  }

  loadingPin1: number = 0;
  loadingPin2: number = 0;
  static currentActiveRows:Array<string> = [];
  drawFrame(): void {
    if (!this.hasAttribute('row-hidden')) {
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
            let idx = TraceRow.currentActiveRows.findIndex(it=> it === `${ this.rowType }-${ this.rowId }`)
            if (idx!=-1){
              TraceRow.currentActiveRows.splice(idx, 1);
            }
            requestAnimationFrame(() => {
              this.onThreadHandler?.(true, null);
              if (TraceRow.currentActiveRows.isEmpty()){
                window.publish(window.SmartEvent.UI.LoadFinish,"");
              }
              window.publish(window.SmartEvent.UI.LoadFinishFrame,"");
            });
          });
        } else if (this.fixedList.length > 0 && !this.dataListCache.includes(this.fixedList[0])) {
          this.dataListCache.push(this.fixedList[0]);
        }
      }
      this.onThreadHandler?.(true, null);
    }
  }
  draw(useCache: boolean = false) {
    this.dpr = window.devicePixelRatio || 1;
    if (this.sleeping) {
      return;
    }
    if (this.supplierFrame) {
      //如果设置了实时渲染,则调用drawFrame
      this.drawFrame();
      return;
    }
    if (this.online) {
      if (!useCache && !TraceRow.isUserInteraction) {
        this.supplier?.().then((res) => {
          this.onThreadHandler?.(useCache, res as any);
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
          promise.then((res) => {
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

  canvasSave(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(0, this.translateY);
    const clipRect = new Path2D();
    clipRect.rect(0, 0, this.frame.width, this.frame.height);
    ctx.clip(clipRect);
  }

  canvasRestore(ctx: CanvasRenderingContext2D, trace?: SpSystemTrace | null) {
    drawSelectionRange(ctx, this);
    ctx.restore();
  }

  clearCanvas(ctx: CanvasRenderingContext2D) {
    if (ctx) {
      this.canvas.forEach((it) => {
        ctx.clearRect(0, 0, it!.clientWidth || 0, it!.clientHeight || 0);
      });
    }
  }

  drawLines(ctx: CanvasRenderingContext2D) {
    if (ctx) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.getLineColor();
      TraceRow.range?.xs.forEach((it) => {
        ctx.moveTo(Math.floor(it), 0);
        ctx.lineTo(Math.floor(it), this.shadowRoot?.host.clientHeight || 0);
      });
      ctx.stroke();
    }
  }

  getLineColor() {
    return window.getComputedStyle(this.rootEL!, null).getPropertyValue('border-bottom-color');
  }

  drawSelection(ctx: CanvasRenderingContext2D) {
    if (this.rangeSelect) {
      TraceRow.rangeSelectObject!.startX = Math.floor(
        ns2x(
          TraceRow.rangeSelectObject!.startNS!,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS!,
          this.frame
        )
      );
      TraceRow.rangeSelectObject!.endX = Math.floor(
        ns2x(
          TraceRow.rangeSelectObject!.endNS!,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS!,
          this.frame
        )
      );
      if (ctx) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#666666';
        ctx.fillRect(
          TraceRow.rangeSelectObject!.startX!,
          this.frame.y,
          TraceRow.rangeSelectObject!.endX! - TraceRow.rangeSelectObject!.startX!,
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

  buildArgs(obj: any) {
    let result: any = {
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
    };
    Reflect.ownKeys(obj).forEach((it) => {
      result[it] = obj[it];
    });
    return result;
  }

  getTransferArray() {
    let tsf = [];
    if (!this.isTransferCanvas) {
      tsf.push(this.offscreen[0]);
    }
    if (this.must && this.dataList instanceof ArrayBuffer) {
      tsf.push(this.dataList);
    }
    return tsf;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    switch (name) {
      case 'name':
        if (this.nameEL) {
          this.nameEL.textContent = newValue;
          this.nameEL.title = newValue;
        }
        break;
      case 'height':
        if (newValue != oldValue) {
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

  focusContain(e: MouseEvent, inFavoriteArea: boolean): boolean {
    let _y = (e.currentTarget as HTMLElement).getBoundingClientRect().y;
    let myRect = this.getBoundingClientRect();
    let x = e.offsetX;
    let y = e.offsetY + _y;
    if (x >= myRect.x && x <= myRect.x + myRect.width && y >= myRect.y && y <= myRect.y + myRect.height) {
      this.hoverX = x - this.describeEl!.clientWidth;
      this.hoverY = y - myRect.y;
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
