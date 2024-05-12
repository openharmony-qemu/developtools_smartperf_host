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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { log } from '../../../../../log/Log';
import { PowerDetailsEnergy } from '../../../../bean/EnergyStruct';
import { SpHiSysEnergyChart } from '../../../chart/SpHiSysEnergyChart';
import { resizeObserver } from '../SheetUtils';
import { getTabPowerDetailsData } from '../../../../database/sql/ProcessThread.sql';
import { TabPanePowerDetailsHTML } from './TabPanePowerDetails.html';
import { NUM_100, NUM_3 } from '../../../../bean/NumBean';

@element('tabpane-power-details')
export class TabPanePowerDetails extends BaseElement {
  private tblPowerDetails: LitTable | null | undefined;
  private sourcePowerDetails: Array<unknown> = [];
  private itemType: unknown;

  set data(valPowerDetails: SelectionParam) {
    this.queryDataByDB(valPowerDetails);
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.tblPowerDetails!);
  }

  getTimeTypeValue(): string[] {
    return [
      'foreground_duration',
      'background_duration',
      'screen_on_duration',
      'screen_off_duration',
      'foreground_count',
      'background_count',
      'screen_on_count',
      'screen_off_count',
      'duration',
      'energy',
      'usage',
      'camera_id',
    ];
  }

  getDurationTypeValue(): string[] {
    return [
      'background_time',
      'screen_on_time',
      'screen_off_time',
      'load',
      'uid',
      'usage',
      'charge',
      'foreground_count',
      'background_count',
      'screen_on_count',
      'screen_off_count',
      'energy',
      'duration',
    ];
  }

  getEnergyTypeValue(): string[] {
    return [
      'background_time',
      'screen_on_time',
      'screen_off_time',
      'load',
      'charge',
      'foreground_count',
      'background_count',
      'screen_on_count',
      'screen_off_count',
      'camera_id',
      'uid',
      'foreground_duration',
      'foreground_energy',
      'background_duration',
      'background_energy',
      'screen_on_duration',
      'screen_on_energy',
      'screen_off_duration',
      'screen_off_energy',
    ];
  }

  getCountTypeValue(): string[] {
    return [
      'background_time',
      'screen_on_time',
      'screen_off_time',
      'load',
      'energy',
      'usage',
      'foreground_duration',
      'background_duration',
      'screen_on_duration',
      'screen_off_duration',
      'camera_id',
      'uid',
      'duration',
      'charge',
    ];
  }

  initElements(): void {
    this.tblPowerDetails = this.shadowRoot?.querySelector<LitTable>('#tb-power-details-energy');
    this.tblPowerDetails!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    this.sourcePowerDetails = [];
    this.itemType = {
      time_type: [],
      duration_type: [],
      energy_type: [],
      count_type: [],
    };
    // @ts-ignore
    this.itemType.time_type = this.getTimeTypeValue();
    // @ts-ignore
    this.itemType.duration_type = this.getDurationTypeValue();
    // @ts-ignore
    this.itemType.energy_type = this.getEnergyTypeValue();
    // @ts-ignore
    this.itemType.count_type = this.getCountTypeValue();
  }

  getPowerData(): unknown {
    return {
      POWER_IDE_CPU: new PowerDetailsEnergy('CPU'),
      POWER_IDE_LOCATION: new PowerDetailsEnergy('LOCATION'),
      POWER_IDE_GPU: new PowerDetailsEnergy('GPU'),
      POWER_IDE_DISPLAY: new PowerDetailsEnergy('DISPLAY'),
      POWER_IDE_CAMERA: new PowerDetailsEnergy('CAMERA'),
      POWER_IDE_BLUETOOTH: new PowerDetailsEnergy('BLUETOOTH'),
      POWER_IDE_FLASHLIGHT: new PowerDetailsEnergy('FLASHLIGHT'),
      POWER_IDE_AUDIO: new PowerDetailsEnergy('AUDIO'),
      POWER_IDE_WIFISCAN: new PowerDetailsEnergy('WIFISCAN'),
    };
  }

  getTotalEnergy(powerData: unknown): number {
    return (
      // @ts-ignore
      powerData.POWER_IDE_CPU.getTotalEnergy(false) +
      // @ts-ignore
      powerData.POWER_IDE_LOCATION.getTotalEnergy(false) +
      // @ts-ignore
      powerData.POWER_IDE_GPU.getTotalEnergy(true) +
      // @ts-ignore
      powerData.POWER_IDE_DISPLAY.getTotalEnergy(true) +
      // @ts-ignore
      powerData.POWER_IDE_CAMERA.getTotalEnergy(false) +
      // @ts-ignore
      powerData.POWER_IDE_BLUETOOTH.getTotalEnergy(false) +
      // @ts-ignore
      powerData.POWER_IDE_FLASHLIGHT.getTotalEnergy(false) +
      // @ts-ignore
      powerData.POWER_IDE_AUDIO.getTotalEnergy(false) +
      // @ts-ignore
      powerData.POWER_IDE_WIFISCAN.getTotalEnergy(false)
    );
  }

  queryDataByDB(val: SelectionParam | unknown): void {
    // @ts-ignore
    getTabPowerDetailsData(val.leftNs - val.leftNs, val.rightNs).then((items): void => {
      log(`getTabPowerDetailsData size :${items.length}`);
      let detailsData: Array<unknown> = [];
      let set = new Set();
      set.add('COUNT');
      set.add('LOAD');
      set.add('CHARGE');
      set.add('CAMERA_ID');
      let powerData: unknown = this.getPowerData();
      let tsMax = 0;
      let currentAppIndex = -1;
      items.forEach((item): void => {
        // @ts-ignore
        let powerDatum: unknown = powerData[item.eventName];
        if (item.appKey.toLocaleLowerCase() === 'appname') {
          // @ts-ignore
          powerDatum.appName = SpHiSysEnergyChart.app_name;
          currentAppIndex = item.eventValue.split(',').indexOf(SpHiSysEnergyChart.app_name!);
          tsMax = 0;
        } else if (currentAppIndex > -1 && (set.has(item.appKey) ? item.startNS >= tsMax : true)) {
          if (set.has(item.appKey)) {
            // @ts-ignore
            powerDatum[item.appKey.toLocaleLowerCase()] =
              item.startNS >= tsMax
                ? ((tsMax = item.startNS), item.eventValue)
                : // @ts-ignore
                  powerDatum[item.appKey.toLocaleLowerCase()];
          } else {
            // @ts-ignore
            powerDatum[item.appKey.toLocaleLowerCase()] =
              // @ts-ignore
              (powerDatum[item.appKey.toLocaleLowerCase()] || 0) +
              parseInt(item.eventValue.split(',')[currentAppIndex]);
          }
        }
      });
      let totalEnergy = this.getTotalEnergy(powerData);
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_CPU', false, 'time_type'));
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_LOCATION', false, 'duration_type'));
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_GPU', true, 'energy_type'));
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_DISPLAY', true, 'energy_type'));
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_CAMERA', false, 'duration_type'));
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_BLUETOOTH', false, 'duration_type'));
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_FLASHLIGHT', false, 'duration_type'));
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_AUDIO', false, 'duration_type'));
      detailsData.push(this.setEnergyItems(powerData, totalEnergy, 'POWER_IDE_WIFISCAN', false, 'count_type'));
      if (detailsData.length > 0) {
        this.sourcePowerDetails = detailsData;
        this.tblPowerDetails!.recycleDataSource = detailsData;
      } else {
        this.sourcePowerDetails = [];
        this.tblPowerDetails!.recycleDataSource = [];
      }
      this.updateTableStyles();
    });
    let th = this.tblPowerDetails?.shadowRoot?.querySelector<HTMLDivElement>('.th');
    if (th) {
      th!.style.gridColumnGap = '5px';
    }
  }

  updateTableStyles(): void {
    this.tblPowerDetails?.shadowRoot?.querySelectorAll<HTMLDivElement>('.td').forEach((td): void => {
      td.style.fontSize = '14px';
      td.style.fontWeight = '400';
      td.style.opacity = '0.9';
      td.style.lineHeight = '16px';
    });
  }

  setEnergyItems(
    powerData: unknown,
    totalEnergy: number,
    energyName: string,
    isSimpleEnergy: boolean,
    type: unknown
  ): unknown {
    // @ts-ignore
    let ratio = (powerData[energyName].getTotalEnergy(isSimpleEnergy) * NUM_100) / totalEnergy;
    if (totalEnergy === 0) {
      // @ts-ignore
      powerData[energyName].energyConsumptionRatio = '0.000 %';
    } else {
      // @ts-ignore
      powerData[energyName].energyConsumptionRatio = `${ratio.toFixed(NUM_3)} %`;
    }
    return this.getEnergyStyle(powerData, energyName, type);
  }

  getEnergyStyle(powerData: unknown, energyName: string, type: unknown): unknown {
    // @ts-ignore
    this.itemType[type].forEach((item: unknown): void => {
      // @ts-ignore
      powerData[energyName][item] = '-';
    });
    if (type === 'energy_type') {
      if (energyName === 'POWER_IDE_GPU') {
        // @ts-ignore
        powerData[energyName].duration = '-';
      } else {
        // @ts-ignore
        powerData[energyName].usage = '-';
      }
    } else if (type === 'duration_type') {
      if (energyName !== 'POWER_IDE_CAMERA') {
        // @ts-ignore
        powerData[energyName].camera_id = '-';
      }
    }
    // @ts-ignore
    return powerData[energyName];
  }

  initHtml(): string {
    return TabPanePowerDetailsHTML;
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(property, sort, type) {
      return function (aPowerDetails: PowerDetailsEnergy, bPowerDetails: PowerDetailsEnergy) {
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(bPowerDetails[property] === '-' ? 0 : bPowerDetails[property]) - // @ts-ignore
                parseFloat(aPowerDetails[property] === '-' ? 0 : aPowerDetails[property]) // @ts-ignore
            : parseFloat(aPowerDetails[property] === '-' ? 0 : aPowerDetails[property]) - // @ts-ignore
                parseFloat(bPowerDetails[property] === '-' ? 0 : bPowerDetails[property]);
        } else {
          // @ts-ignore
          if (bPowerDetails[property] > aPowerDetails[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (bPowerDetails[property] === aPowerDetails[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    // @ts-ignore
    if (detail.key === 'appName') {
      // @ts-ignore
      this.sourcePowerDetails.sort(compare(detail.key, detail.sort, 'string'));
    } else {
      // @ts-ignore
      this.sourcePowerDetails.sort(compare(detail.key, detail.sort, 'number'));
    }
    this.tblPowerDetails!.recycleDataSource = this.sourcePowerDetails;

    this.tblPowerDetails?.shadowRoot?.querySelectorAll<HTMLDivElement>('.td').forEach((td): void => {
      td.style.fontSize = '14px';
      td.style.fontWeight = '400';
      td.style.opacity = '0.9';
      td.style.lineHeight = '16px';
    });
  }
}
