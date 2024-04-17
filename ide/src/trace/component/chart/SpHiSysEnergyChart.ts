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

import { SpSystemTrace } from '../SpSystemTrace';
import { info } from '../../../log/Log';
import { TraceRow } from '../trace/base/TraceRow';
import { BaseStruct } from '../../bean/BaseStruct';
import {
  EnergyAnomalyRender,
  EnergyAnomalyStruct
} from '../../database/ui-worker/ProcedureWorkerEnergyAnomaly';
import {
  EnergySystemStruct,
  EnergySystemRender
} from '../../database/ui-worker/ProcedureWorkerEnergySystem';
import {
  EnergyPowerStruct,
  EnergyPowerRender
} from '../../database/ui-worker/ProcedureWorkerEnergyPower';
import {
  EnergyStateStruct,
  EnergyStateRender
} from '../../database/ui-worker/ProcedureWorkerEnergyState';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { TreeItemData } from '../../../base-ui/tree/LitTree';
import {
  energySysEventSender,
  hiSysEnergyAnomalyDataSender, hiSysEnergyPowerSender,
  hiSysEnergyStateSender
} from '../../database/data-trafic/EnergySysEventSender';
import {
  queryAnomalyData,
  queryConfigEnergyAppName,
  queryEnergyAppName,
  queryEnergyEventExits, queryMaxStateValue, queryStateInitValue
} from '../../database/sql/SqlLite.sql';
import { queryPowerData } from '../../database/sql/ProcessThread.sql';
import { NUM_200, NUM_3 } from '../../bean/NumBean';

export class SpHiSysEnergyChart {
  static app_name: string | null;
  trace: SpSystemTrace;
  private energyTraceRow: TraceRow<BaseStruct> | undefined;
  private timer: number | undefined;
  private eventNameMap: Map<number, string> = new Map();
  private appKeyMap: Map<number, string> = new Map();
  private eventValueMap: Map<number, string> = new Map();
  private powerEventNameMap: Map<number, string> = new Map();
  private powerAppKeyNameMap: Map<number, string> = new Map();
  private powerEventValueMap: Map<number, string> = new Map();
  private stateName: Array<string> = [
    'BRIGHTNESS_NIT',
    'SIGNAL_LEVEL',
    'WIFI_EVENT_RECEIVED',
    'AUDIO_STREAM_CHANGE',
    'AUDIO_VOLUME_CHANGE',
    'WIFI_STATE',
    'BLUETOOTH_BR_SWITCH_STATE',
    'BR_SWITCH_STATE',
    'LOCATION_SWITCH_STATE',
    'SENSOR_STATE',
  ];
  private initValueList: Array<string> = [
    'brightness',
    'nocolumn',
    'nocolumn',
    'nocolumn',
    'nocolumn',
    'wifi',
    'bt_state',
    'bt_state',
    'location',
    'nocolumn',
  ];
  private stateList: Array<string> = [
    'Brightness Nit',
    'Signal Level',
    'Wifi Event Received',
    'Audio Stream Change',
    'Audio Volume Change',
    'Wifi State',
    'Bluetooth Br Switch State',
    'Br Switch State',
    'Location Switch State',
    'Sensor State',
  ];

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    let result = await queryEnergyEventExits();
    if (result.length <= 0) {return}
    let anomalyData = await queryAnomalyData();
    let powerData = await queryPowerData();
    for (let index = 0; index < anomalyData.length; index++) {
      let item = anomalyData[index];
      this.eventNameMap.set(item.id!, item.eventName ?? '');
      this.appKeyMap.set(item.id!, item.appKey ?? '');
      this.eventValueMap.set(item.id!, item.eventValue ?? '');
    }
    for (let index = 0; index < powerData.length; index++) {
      let item = powerData[index];
      this.powerEventNameMap.set(item.id, item.eventName ?? '');
      this.powerAppKeyNameMap.set(item.id, item.appKey ?? '');
      this.powerEventValueMap.set(item.id, item.eventValue ?? '');
    }
    await this.initEnergyRow();
    this.initAnomaly();
    this.initSystem();
    this.initPower();
    await this.initState();
  }

  private async initEnergyRow(): Promise<void> {
    await this.initEnergyChartRow();
    this.energyTraceRow!.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    this.energyTraceRow!.selectChangeHandler = this.trace.selectChangeHandler;
    this.energyTraceRow!.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>(
      (resolve) => resolve([]));
    this.energyTraceRow!.onThreadHandler = (useCache: boolean): void => {
      this.energyTraceRow?.canvasSave(this.trace.canvasPanelCtx!);
      if (this.energyTraceRow!.expansion) {
        this.trace.canvasPanelCtx?.clearRect(0, 0, this.energyTraceRow!.frame.width, this.energyTraceRow!.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          this.energyTraceRow!
        );
      }
      this.energyTraceRow?.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
    this.energyTraceRow!.addEventListener('expansion-change', () => {
      TraceRow.range!.refresh = true;
      this.trace.refreshCanvas(false);
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = window.setTimeout((): void => {
        TraceRow.range!.refresh = false;
      }, NUM_200);
    });
    this.trace.rowsEL?.appendChild(this.energyTraceRow!);
  };

  private initAnomaly = (): void => {
    let time = new Date().getTime();
    let anomalyTraceRow = this.initAnomalyChartRow();
    anomalyTraceRow.supplierFrame = async (): Promise<EnergyAnomalyStruct[]> => {
      return hiSysEnergyAnomalyDataSender(anomalyTraceRow).then((res: EnergyAnomalyStruct[]) => {
        for (let index = 0; index < res.length; index++) {
          let item = res[index];
          item.eventName = this.eventNameMap.get(res[index].id!);
          item.appKey = this.appKeyMap.get(res[index].id!);
          item.eventValue = this.eventValueMap.get(res[index].id!);
        }
        return res;
      });
    };
    anomalyTraceRow.findHoverStruct = (): void => {
      EnergyAnomalyStruct.hoverEnergyAnomalyStruct = anomalyTraceRow.getHoverStruct();
    };
    anomalyTraceRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (anomalyTraceRow.currentContext) {
        context = anomalyTraceRow.currentContext;
      } else {
        context = anomalyTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      anomalyTraceRow.canvasSave(context);
      (renders.energyAnomaly as EnergyAnomalyRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'energyAnomaly',
          appName: SpHiSysEnergyChart.app_name || '',
          canvasWidth: this.trace.canvasPanel?.width || 0,
        },
        anomalyTraceRow
      );
      anomalyTraceRow.canvasRestore(context, this.trace);
    };
    this.energyTraceRow?.addChildTraceRow(anomalyTraceRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the anomaly is: ', durTime);
  };

  private initSystem = (): void => {
    let time = new Date().getTime();
    let systemTraceRow = this.initSystemChartRow();
    systemTraceRow.supplierFrame = async (): Promise<EnergySystemStruct[]> => {
      return energySysEventSender(systemTraceRow).then((res: EnergySystemStruct[]) => {
        return res;
      });
    };
    systemTraceRow.findHoverStruct = (): void => {
      EnergySystemStruct.hoverEnergySystemStruct = systemTraceRow.getHoverStruct();
    };
    systemTraceRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (systemTraceRow.currentContext) {
        context = systemTraceRow.currentContext;
      } else {
        context = systemTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      systemTraceRow.canvasSave(context);
      (renders.energySystem as EnergySystemRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'energySystem',
        },
        systemTraceRow
      );
      systemTraceRow.canvasRestore(context, this.trace);
    };
    this.energyTraceRow?.addChildTraceRow(systemTraceRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the Ability Memory is: ', durTime);
  };

  private initPower = (): void => {
    let time = new Date().getTime();
    let powerTraceRow = this.initPowerChartRow();
    powerTraceRow.supplierFrame = async (): Promise<EnergyPowerStruct[]> => {
      return hiSysEnergyPowerSender(powerTraceRow).then((res) => {
        for (let index = 0; index < res.length; index++) {
          let item = res[index];
          item.eventName = this.powerEventNameMap.get(res[index].id!);
          item.appKey = this.powerAppKeyNameMap.get(res[index].id!);
          item.eventValue = this.powerEventValueMap.get(res[index].id!);
        }
        return this.getPowerData(res);
      });
    };
    powerTraceRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (powerTraceRow.currentContext) {
        context = powerTraceRow.currentContext;
      } else {
        context = powerTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      powerTraceRow.canvasSave(context);
      (renders.energyPower as EnergyPowerRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'energyPower',
          appName: SpHiSysEnergyChart.app_name || '',
        },
        powerTraceRow!
      );
      powerTraceRow!.canvasRestore(context, this.trace);
    };
    this.energyTraceRow?.addChildTraceRow(powerTraceRow);
    let durTime = new Date().getTime() - time;
    info('The time to load the energy power is: ', durTime);
  };

  private initState = async (): Promise<void> => {
    let time = new Date().getTime();
    for (let index = 0; index < this.stateList.length; index++) {
      let stateResult = await queryStateInitValue(this.stateName[index], this.initValueList[index]);
      let maxStateData = await queryMaxStateValue(this.stateName[index]);
      if (!maxStateData[0]) {
        continue;
      }
      let maxStateTotal = this.getMaxStateTotal(maxStateData);
      let stateTraceRow = this.initStatChartRow(index);
      stateTraceRow.supplierFrame = async (): Promise<EnergyStateStruct[]> => {
        const res = await hiSysEnergyStateSender(this.stateName, index, stateTraceRow);
        let stateInitValue = this.initValueList[index] === 'nocolumn' ? [] : stateResult;
        for (let i = 0; i < res.length; i++) {
          let item = res[i];
          item.type = this.stateName[index];
        }
        return stateInitValue.concat(res);
      };
      stateTraceRow.onThreadHandler = (useCache: boolean): void => {
        let context: CanvasRenderingContext2D;
        if (stateTraceRow.currentContext) {
          context = stateTraceRow.currentContext;
        } else {
          context = stateTraceRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
        }
        stateTraceRow.canvasSave(context);
        (renders.energyState as EnergyStateRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            type: `energyState${index}`,
            maxState: maxStateData[0].maxValue,
            maxStateName: maxStateData[0].type.toLocaleLowerCase().endsWith('br_switch_state') ?
              '-1' :
              maxStateTotal.toString(),
          },
          stateTraceRow
        );
        stateTraceRow.canvasRestore(context, this.trace);
      };
      this.energyTraceRow?.addChildTraceRow(stateTraceRow);
      let durTime = new Date().getTime() - time;
      info('The time to load the Ability Memory is: ', durTime);
    }
  };

  private getMaxStateTotal(maxStateData: Array<{
    type: string;
    maxValue: number;
  }>): string {
    let maxStateTotal = maxStateData[0].maxValue.toString();
    let statType = maxStateData[0].type.toLocaleLowerCase();
    if (statType.includes('state') && !statType.endsWith('br_switch_state')) {
      if (maxStateData[0].maxValue === 0) {
        maxStateTotal = 'enable';
      } else {
        maxStateTotal = 'disable';
      }
    } else if (statType.includes('sensor')) {
      if (statType.includes('enable')) {
        maxStateTotal = 'enable';
      } else {
        maxStateTotal = 'disable';
      }
    }
    return maxStateTotal;
  }

  private initStatChartRow(index: number): TraceRow<EnergyStateStruct> {
    let stateTraceRow = TraceRow.skeleton<EnergyStateStruct>();
    stateTraceRow.rowParentId = 'energy';
    stateTraceRow.rowHidden = true;
    stateTraceRow.rowId = `energy-state-${this.stateList[index]}`;
    stateTraceRow.rowType = TraceRow.ROW_TYPE_STATE_ENERGY;
    stateTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    stateTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    stateTraceRow.style.height = '40px';
    stateTraceRow.style.width = '100%';
    stateTraceRow.setAttribute('children', '');
    stateTraceRow.name = `${this.stateList[index]}`;
    stateTraceRow.focusHandler = (): void => {
      let tip;
      if (EnergyStateStruct.hoverEnergyStateStruct?.type!.toLocaleLowerCase().includes('state')) {
        tip = `<span>Switch Status: ${
          EnergyStateStruct.hoverEnergyStateStruct?.value === 1 ? 'disable' : 'enable'
        }</span>`;
        if (EnergyStateStruct.hoverEnergyStateStruct?.type!.toLocaleLowerCase().endsWith('br_switch_state')) {
          tip = `<span>${SpHiSysEnergyChart.getBlueToothState(
            EnergyStateStruct.hoverEnergyStateStruct?.value
          )}</span>`;
        }
      } else {
        tip = `<span>value: ${EnergyStateStruct.hoverEnergyStateStruct?.value?.toFixed(2) || 0}</span>`;
      }
      this.trace?.displayTip(stateTraceRow, EnergyStateStruct.hoverEnergyStateStruct, tip);
    };
    return stateTraceRow;
  }

  private async initEnergyChartRow(): Promise<void> {
    SpHiSysEnergyChart.app_name = '';
    let appNameFromTable = await queryEnergyAppName();
    let configAppName = await queryConfigEnergyAppName();
    if (configAppName.length > 0 && appNameFromTable.length > 0) {
      let name = configAppName[0].process_name;
      if (name !== null) {
        let filterList = appNameFromTable.filter((appNameFromTableElement) => {
          return appNameFromTableElement.string_value?.trim() === name;
        });
        if (filterList.length > 0) {
          SpHiSysEnergyChart.app_name = name;
        }
      }
    }
    if (appNameFromTable.length > 0 && SpHiSysEnergyChart.app_name === '') {
      SpHiSysEnergyChart.app_name = appNameFromTable[0].string_value;
    }
    this.energyTraceRow = TraceRow.skeleton<BaseStruct>();
    this.energyTraceRow.addRowSettingPop();
    this.energyTraceRow.rowSetting = 'enable';
    this.energyTraceRow.rowSettingPopoverDirection = 'bottomLeft';
    let nameList: Array<TreeItemData> = [];
    for (let index = 0; index < appNameFromTable.length; index++) {
      let appName = appNameFromTable[index].string_value;
      nameList.push({
        key: `${appName}`,
        title: `${appName}`,
        checked: index === 0,
      });
    }
    this.energyTraceRow.rowSettingList = nameList;
    this.energyTraceRow.onRowSettingChangeHandler = (value): void => {
      SpHiSysEnergyChart.app_name = value[0];
      this.trace.refreshCanvas(false);
    };
    this.energyTraceRow.rowId = 'energy';
    this.energyTraceRow.rowType = TraceRow.ROW_TYPE_ENERGY;
    this.energyTraceRow.rowParentId = '';
    this.energyTraceRow.folder = true;
    this.energyTraceRow.addTemplateTypes('EnergyEvent');
    this.energyTraceRow.name = 'Energy';
    this.energyTraceRow.style.height = '40px';
  }

  private initAnomalyChartRow(): TraceRow<EnergyAnomalyStruct> {
    let anomalyTraceRow = TraceRow.skeleton<EnergyAnomalyStruct>();
    anomalyTraceRow.rowParentId = 'energy';
    anomalyTraceRow.rowHidden = true;
    anomalyTraceRow.rowId = 'energy-anomaly';
    anomalyTraceRow.rowType = TraceRow.ROW_TYPE_ANOMALY_ENERGY;
    anomalyTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    anomalyTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    anomalyTraceRow.setAttribute('height', '55px');
    let element = anomalyTraceRow.shadowRoot?.querySelector('.root') as HTMLDivElement;
    element!.style.height = '55px';
    anomalyTraceRow.style.width = '100%';
    anomalyTraceRow.setAttribute('children', '');
    anomalyTraceRow.name = 'Anomaly Event';
    anomalyTraceRow.focusHandler = (): void => {
      this.trace?.displayTip(
        anomalyTraceRow,
        EnergyAnomalyStruct.hoverEnergyAnomalyStruct,
        `<span>AnomalyName:${EnergyAnomalyStruct.hoverEnergyAnomalyStruct?.eventName || ''}</span>`
      );
    };
    return anomalyTraceRow;
  }

  private initSystemChartRow(): TraceRow<EnergySystemStruct> {
    let systemTraceRow = TraceRow.skeleton<EnergySystemStruct>();
    systemTraceRow.rowParentId = 'energy';
    systemTraceRow.rowHidden = true;
    systemTraceRow.rowId = 'energy-system';
    systemTraceRow.rowType = TraceRow.ROW_TYPE_SYSTEM_ENERGY;
    systemTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    systemTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    systemTraceRow.setAttribute('height', '80px');
    let element = systemTraceRow.shadowRoot?.querySelector('.root') as HTMLDivElement;
    element!.style.height = '90px';
    systemTraceRow.style.width = '100%';
    systemTraceRow.setAttribute('children', '');
    systemTraceRow.name = 'System Event';
    systemTraceRow.focusHandler = (): void => {
      this.trace?.displayTip(
        systemTraceRow,
        EnergySystemStruct.hoverEnergySystemStruct,
        this.getSystemFocusHtml()
      );
    };
    return systemTraceRow;
  }

  private getSystemFocusHtml(): string {
    return `
<div style="width: 250px">
  <div style=" display: flex">
    <div style="width: 75%;text-align: left">WORKSCHEDULER: </div>
    <div style="width: 20%;text-align: left">${EnergySystemStruct.hoverEnergySystemStruct?.workScheduler! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 75%;text-align: left">POWER_RUNNINGLOCK: </div>
    <div style="width: 20%;text-align: left">${EnergySystemStruct.hoverEnergySystemStruct?.power! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 75%;text-align: left">LOCATION: </div>
    <div style="width: 20%;text-align: left">${EnergySystemStruct.hoverEnergySystemStruct?.location! || 0}</div>
  </div>
</div>`;
  }

  private getPowerFocusHtml(): string {
    return `
<div style="width: 120px">
  <div style="display: flex">
    <div style="width: 80%;text-align: left">CPU: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.cpu! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 80%;text-align: left">location: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.location! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 80%;text-align: left">GPU: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.gpu! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 80%;text-align: left">display: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.display! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 80%;text-align: left">camera: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.camera! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 80%;text-align: left">bluetooth: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.bluetooth! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 80%;text-align: left">flashlight: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.flashlight! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 80%;text-align: left">audio: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.audio! || 0}</div>
  </div>
  <div style="display: flex">
    <div style="width: 80%;text-align: left">wifiScan: </div>
    <div style="width: 20%;text-align: left">${EnergyPowerStruct.hoverEnergyPowerStruct?.wifiscan! || 0}</div>
  </div>
</div>`;
  }

  private initPowerChartRow(): TraceRow<EnergyPowerStruct> {
    let powerTraceRow = TraceRow.skeleton<EnergyPowerStruct>();
    powerTraceRow.rowParentId = 'energy';
    powerTraceRow.rowHidden = true;
    powerTraceRow.rowId = 'energy-power';
    powerTraceRow.rowType = TraceRow.ROW_TYPE_POWER_ENERGY;
    powerTraceRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    powerTraceRow.selectChangeHandler = this.trace.selectChangeHandler;
    powerTraceRow.setAttribute('height', '200px');
    let element = powerTraceRow.shadowRoot?.querySelector('.root') as HTMLDivElement;
    element!.style.height = '200px';
    powerTraceRow.style.width = '100%';
    powerTraceRow.setAttribute('children', '');
    powerTraceRow.name = 'Power';
    powerTraceRow.focusHandler = (): void => {
      this.trace?.displayTip(
        powerTraceRow,
        EnergyPowerStruct.hoverEnergyPowerStruct,
        this.getPowerFocusHtml()
      );
    };
    return powerTraceRow;
  }

  private getPowerData(items: any): EnergyPowerStruct[] {
    let powerDataMap: any = {};
    let appNameList: string[] = [];
    items.forEach((item: {
      id: number,
      startNS: number,
      eventName: string,
      appKey: string,
      eventValue: string
    }): void => {
      let dataItem = powerDataMap[item.startNS];
      if (dataItem === undefined) {
        if (item.appKey === 'APPNAME') {
          let appMap: any = {};
          let appNames = item.eventValue.split(',');
          appNameList = appNames;
          if (appNames.length > 0) {
            for (let appNamesKey of appNames) {
              appMap[appNamesKey] = new EnergyPowerStruct();
              appMap[appNamesKey].name = appNamesKey;
              appMap[appNamesKey].ts = item.startNS;
            }
            powerDataMap[item.startNS] = appMap;
          }
        }
      } else {
        if (item.appKey !== 'APPNAME') {
          this.powerDataMap(item.eventName, item.eventValue, appNameList, dataItem);
        } else {
          let dataMap = powerDataMap[item.startNS];
          let appNames = item.eventValue.split(',');
          appNameList = appNames;
          if (appNames.length > 0) {
            for (let appNamesKey of appNames) {
              dataMap[appNamesKey] = new EnergyPowerStruct();
              dataMap[appNamesKey].name = appNamesKey;
              dataMap[appNamesKey].ts = item.startNS;
            }
          }
        }
      }
    });
    return Object.values(powerDataMap);
  }

  private powerDataMap(name: string, eventValue: string, appNameList: string[], dataItem: any): void {
    let values = eventValue.split(',');
    for (let i = 0; i < values.length; i++) {
      let appName = appNameList[i];
      let obj = dataItem[appName];
      if (obj !== undefined) {
        let eventName = name.split('_');
        let s = eventName[eventName.length - 1].toLocaleLowerCase();
        if (obj[s] === undefined) {
          obj[s] = parseInt(values[i]);
        } else {
          obj[s] += parseInt(values[i]);
        }
      }
    }
  }

  public static getBlueToothState(num: number | undefined): string {
    switch (num) {
      case 0:
        return 'STATE_TURNING_ON';
      case 1:
        return 'STATE_TURN_ON';
      case 2:
        return 'STATE_TURNING_OFF';
      case NUM_3:
        return 'STATE_TURN_OFF';
      default:
        return 'UNKNOWN_STATE';
    }
  }
}
