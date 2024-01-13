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

import { BaseElement, element } from '../../base-ui/BaseElement';
import { LitTable } from '../../base-ui/table/lit-table';
import '../../base-ui/table/lit-table';
import { info } from '../../log/Log';
import { LitProgressBar } from '../../base-ui/progress-bar/LitProgressBar';
import { querySelectTraceStats, queryTraceMetaData } from '../database/sql/SqlLite.sql';
import { SpInfoAndStatHtml } from './SpInfoAndStas.html';

@element('sp-info-and-stats')
export class SpInfoAndStats extends BaseElement {
  private metaData: Array<MetaDataTable> = [];
  private infoData: Array<InfoDataTable> = [];
  private metaTableEl: LitTable | undefined;
  private infoTableEl: LitTable | undefined;

  initElements(): void {
    this.metaTableEl = this.shadowRoot!.querySelector<LitTable>('#metaData-table') as LitTable;
    this.infoTableEl = this.shadowRoot!.querySelector<LitTable>('#stats-table') as LitTable;
  }

  initInfoAndStatsData(): void {
    let progressLoad = this.shadowRoot?.querySelector('.load-metric') as LitProgressBar;
    progressLoad!.loading = true;
    let time = new Date().getTime();
    this.initMetricItemData().then(() => {
      let durTime = new Date().getTime() - time;
      info(`InfoAndStatsData query time is: ${durTime}ms`);
      if (this.metaData.length > 0) {
        this.metaTableEl!.recycleDataSource = this.metaData;
      } else {
        this.metaTableEl!.recycleDataSource = [];
      }
      info('metaData(metric) size is: ', this.metaData.length);
      if (this.infoData.length > 0) {
        this.infoTableEl!.recycleDataSource = this.infoData;
      } else {
        this.infoTableEl!.recycleDataSource = [];
      }
      new ResizeObserver(() => {
        if (this.parentElement?.clientHeight !== 0) {
          this.metaTableEl!.style.height = '100%';
          this.metaTableEl!.reMeauseHeight();
          this.infoTableEl!.reMeauseHeight();
        }
      }).observe(this.parentElement!);
      info('infoData(metric) size is: ', this.infoData.length);
      let metaDataStyle: HTMLDivElement | undefined | null = this.metaTableEl!.shadowRoot?.querySelector(
        'div.body'
      ) as HTMLDivElement;
      let metaDataHeadStyle: HTMLDivElement | undefined | null = this.metaTableEl!.shadowRoot?.querySelector(
        'div.thead'
      ) as HTMLDivElement;
      let statsStyle: HTMLDivElement | undefined | null = this.infoTableEl!.shadowRoot?.querySelector(
        'div.body'
      ) as HTMLDivElement;
      let statsHeadStyle: HTMLDivElement | undefined | null = this.infoTableEl!.shadowRoot?.querySelector(
        'div.thead'
      ) as HTMLDivElement;
      let timeOutTs = 20;
      setTimeout(() => {
        this.initDataTableStyle(metaDataStyle!);
        this.initDataTableStyle(metaDataHeadStyle!);
        this.initDataTableStyle(statsStyle!);
        this.initDataTableStyle(statsHeadStyle!);
      }, timeOutTs);
      progressLoad!.loading = false;
    });
  }

  initDataTableStyle(styleTable: HTMLDivElement): void {
    for (let index = 0; index < styleTable.children.length; index++) {
      // @ts-ignore
      styleTable.children[index].style.backgroundColor = 'var(--dark-background5,#F6F6F6)';
    }
    this.metaTableEl!.style.height = 'auto';
    this.metaTableEl!.style.minHeight = '80%';
    this.metaTableEl!.style.borderRadius = '16';
    this.infoTableEl!.style.height = 'auto';
    this.infoTableEl!.style.minHeight = '80%';
    this.infoTableEl!.style.borderRadius = '16';
  }

  async initMetricItemData(): Promise<void> {
    this.metaData = [];
    this.infoData = [];
    let mete = await queryTraceMetaData();
    if (mete) {
      for (let index = 0; index < mete.length; index++) {
        this.metaData.push({
          name: mete[index].name,
          value: mete[index].valueText,
        });
      }
    }
    let info = await querySelectTraceStats();
    if (info) {
      for (let index = 0; index < info.length; index++) {
        this.infoData.push({
          eventName: info[index].event_name,
          statType: info[index].stat_type,
          count: info[index].count,
        });
      }
    }
  }

  initHtml(): string {
    return SpInfoAndStatHtml;
  }
}

export class MetaDataTable {
  name: string | undefined;
  value: string | undefined;
  type?: string | undefined;
}

export class InfoDataTable {
  eventName: string | undefined;
  statType: string | undefined;
  count: number | undefined;
  source?: string | undefined;
  serverity?: string | undefined;
}
