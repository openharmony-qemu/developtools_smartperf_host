/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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
import { type LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import '../../../StackBar';
import { queryBinderByThreadId } from '../../../../database/sql/ProcessThread.sql';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { type BinderGroup, type BinderItem } from '../../../../bean/BinderProcessThread';
import { SliceGroup } from '../../../../bean/StateProcessThread';

@element('tabpane-binders')
export class TabPaneBinders extends BaseElement {
  private threadBindersTbl: LitTable | null | undefined;
  private threadBindersTblSource: Array<SelectionData> = [];
  private currentSelectionParam: SelectionParam | undefined;

  set data(threadStatesParam: SelectionParam | any) {
    if (this.currentSelectionParam === threadStatesParam) {
      return;
    }
    this.currentSelectionParam = threadStatesParam;
    this.initBinderData(threadStatesParam);
  }

  initBinderData(threadStatesParam: SelectionParam): void {
    this.threadBindersTbl!.loading = true;
    this.threadBindersTbl!.recycleDataSource = [];
    let binderList: BinderItem[] = [];
    let threadIds = threadStatesParam.threadIds;
    let processIds: number[] = [...new Set(threadStatesParam.processIds)];
    queryBinderByThreadId(processIds, threadIds, threadStatesParam.leftNs, threadStatesParam.rightNs).then((result) => {
      if (result !== null && result.length > 0) {
        binderList = result;
      }
      if (binderList.length > 0) {
        this.threadBindersTbl!.recycleDataSource = this.transferToTreeData(binderList); // @ts-ignore
        this.threadBindersTblSource = this.threadBindersTbl!.recycleDataSource;
        this.threadBindersTbl!.loading = false; // @ts-ignore
        this.tHeadClick(this.threadBindersTbl!.recycleDataSource);
      } else if (binderList.length === 0) {
        this.threadBindersTbl!.recycleDataSource = [];
        this.threadBindersTblSource = [];
        this.threadBindersTbl!.loading = false; // @ts-ignore
        this.tHeadClick(this.threadBindersTbl!.recycleDataSource);
      }
    });
  }

  transferToTreeData(binderList: BinderItem[]): BinderGroup[] {
    let group: any = {};
    binderList.forEach((it: BinderItem) => {
      if (group[`${it.pid}`]) {
        let process = group[`${it.pid}`];
        process.totalCount += 1;
        let thread = process.children.find((child: BinderGroup) => child.title === `T-${it.tid}`);
        if (thread) {
          thread.totalCount += 1;
          thread.binderTransactionCount += it.name === 'binder transaction' ? 1 : 0;
          thread.binderAsyncRcvCount += it.name === 'binder async rcv' ? 1 : 0;
          thread.binderReplyCount += it.name === 'binder reply' ? 1 : 0;
          thread.binderTransactionAsyncCount += it.name === 'binder transaction async' ? 1 : 0;
        } else {
          process.children.push({
            title: `T-${it.tid}`,
            totalCount: 1,
            binderTransactionCount: it.name === 'binder transaction' ? 1 : 0,
            binderAsyncRcvCount: it.name === 'binder async rcv' ? 1 : 0,
            binderReplyCount: it.name === 'binder reply' ? 1 : 0,
            binderTransactionAsyncCount: it.name === 'binder transaction async' ? 1 : 0,
            tid: it.tid,
            pid: it.pid,
          });
        }
      } else {
        group[`${it.pid}`] = {
          title: `P-${it.pid}`,
          totalCount: 1,
          tid: it.tid,
          pid: it.pid,
          children: [
            {
              title: `T-${it.tid}`,
              totalCount: 1,
              binderTransactionCount: it.name === 'binder transaction' ? 1 : 0,
              binderAsyncRcvCount: it.name === 'binder async rcv' ? 1 : 0,
              binderReplyCount: it.name === 'binder reply' ? 1 : 0,
              binderTransactionAsyncCount: it.name === 'binder transaction async' ? 1 : 0,
              tid: it.tid,
              pid: it.pid,
            },
          ],
        };
      }
    });
    return Object.values(group);
  }

  private tHeadClick(data: Array<SliceGroup>): void {
    let labels = this.threadBindersTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', () => {
          if (label.includes('Process') && i === 0) {
            this.threadBindersTbl!.setStatus(data, false);
            this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(
              data,
              RedrawTreeForm.Retract
            );
          } else if (label.includes('Thread') && i === 1) {
            for (let item of data) {
              item.status = true;
              if (item.children !== undefined && item.children.length > 0) {
                this.threadBindersTbl!.setStatus(item.children, false);
              }
            }
            this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(
              data,
              RedrawTreeForm.Retract
            );
          }
        });
      }
    }
  }

  initElements(): void {
    this.threadBindersTbl = this.shadowRoot?.querySelector<LitTable>('#tb-binder-count');
    this.threadBindersTbl!.itemTextHandleMap.set('title', (value) =>
      Utils.transferBinderTitle(value, this.currentSelectionParam?.traceId));
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadBindersTbl!);
  }

  initHtml(): string {
    return `
      <style>
      :host{
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
      }
      #tb-binder-count{
          height: auto;
          overflow-x: auto;
          width: calc(100vw - 270px)
      }
      </style>
      <lit-table id="tb-binder-count" tree>
          <lit-table-column title="Process/Thread" data-index="title" key="title"  align="flex-start" width="27%" retract>
          </lit-table-column>
          <lit-table-column title="Total count" data-index="totalCount" key="totalCount" align="flex-start">
          </lit-table-column>
          <lit-table-column title="Binder transaction count" data-index="binderTransactionCount" key="binderTransactionCount" align="flex-start">
          </lit-table-column>
          <lit-table-column title="Binder transaction async count" data-index="binderTransactionAsyncCount" key="binderTransactionAsyncCount" align="flex-start">
          </lit-table-column>
          <lit-table-column title="Binder reply count" data-index="binderReplyCount" key="binderReplyCount" align="flex-start">
          </lit-table-column>
          <lit-table-column title="Binder async rcv count" data-index="binderAsyncRcvCount" key="binderAsyncRcvCount" align="flex-start">
          </lit-table-column>
      </lit-table>
  `;
  }
}
