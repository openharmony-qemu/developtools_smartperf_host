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

import '../../base-ui/table/lit-table';
import { LitProgressBar } from '../../base-ui/progress-bar/LitProgressBar';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { queryMetric } from '../database/sql/SqlLite.sql';
import { SpMetricsHtml } from './SpMetrics.html';

@element('sp-metrics')
export class SpMetrics extends BaseElement {
  private selectMetricEl: HTMLSelectElement | undefined;
  private runButtonEl: HTMLButtonElement | undefined | null;
  private responseJson: HTMLPreElement | undefined | null;
  private metricProgressLoad: LitProgressBar | undefined;

  reset(): void {
    this.selectMetricEl!.selectedIndex = 0;
    this.responseJson!.textContent = '';
  }

  initElements(): void {
    this.metricProgressLoad = this.shadowRoot?.querySelector('.sp-load-metric') as LitProgressBar;
    this.selectMetricEl = this.shadowRoot?.querySelector('.sql-select') as HTMLSelectElement;
    this.runButtonEl = this.shadowRoot?.querySelector('.sql-select-button') as HTMLButtonElement;
    this.responseJson = this.shadowRoot?.querySelector('.response-json') as HTMLPreElement;
  }

  runClickListener = (): void => {
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: 'metrics',
      action: 'metrics',
    });
    this.responseJson!.textContent = '';
    this.metricProgressLoad!.loading = true;
    let index = this.selectMetricEl!.selectedIndex;
    let optionEl = this.selectMetricEl?.querySelectorAll<HTMLOptionElement>('option')[index];
    if (optionEl && optionEl.value !== '') {
      queryMetric(optionEl.value).then((result) => {
        this.metricProgressLoad!.loading = false;
        this.responseJson!.textContent = result.toString();
      });
    } else {
      this.metricProgressLoad!.loading = false;
    }
  };

  connectedCallback(): void {
    this.runButtonEl?.addEventListener('click', this.runClickListener);
  }

  disconnectedCallback(): void {
    this.runButtonEl?.removeEventListener('click', this.runClickListener);
  }

  initHtml(): string {
    return SpMetricsHtml;
  }
}
