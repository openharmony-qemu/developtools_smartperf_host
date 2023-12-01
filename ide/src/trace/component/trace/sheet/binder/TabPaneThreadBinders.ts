import { BaseElement, element } from '../../../../../base-ui/BaseElement.js';
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table.js';
import { SelectionParam } from '../../../../bean/BoxSelection.js';
import '../../../StackBar.js'
import { getTabBindersCount } from '../../../../database/SqlLite.js';
import { Utils } from '../../base/Utils.js';
import { resizeObserver } from '../SheetUtils.js';
import { BinderGroup } from '../../../../bean/BinderProcessThread.js';

@element('tabpane-thread-binder')
export class TabPaneThreadBinders extends BaseElement {
    private threadBindersTbl: LitTable | null | undefined;
    private currentSelectionParam: Selection | undefined;

    set data(threadStatesParam: SelectionParam | any) {
        if (this.currentSelectionParam === threadStatesParam) {
            return;
        }
        this.threadBindersTbl!.loading = true;
        this.currentSelectionParam = threadStatesParam;
        this.threadBindersTbl!.recycleDataSource = [];
        let binderList: BinderGroup[] = [];
        let threadIds = threadStatesParam.threadIds;
        let processIds: any[] = [...new Set(threadStatesParam.processIds)];
        getTabBindersCount(processIds, threadIds, threadStatesParam.leftNs, threadStatesParam.rightNs).then((result) => {
            if (result != null && result.length > 0 && result[0].count != 0) {
                binderList = result;
            }
            if (binderList.length > 0) {
                this.timeUnitConversion(binderList);
                this.threadBindersTbl!.recycleDataSource = this.transferToTreeData(binderList);
                this.threadBindersTbl!.loading = false;
                this.theadClick(this.threadBindersTbl!.recycleDataSource);
            } else if (binderList.length === 0) {
                this.threadBindersTbl!.recycleDataSource = [];
                this.threadBindersTbl!.loading = false;
                this.theadClick(this.threadBindersTbl!.recycleDataSource);
            }
        })
    }

    timeUnitConversion(binderList: Array<BinderGroup>) {
        binderList.forEach(b => {
            b.cycleDur = Number((b.cycleDur / 1000000).toFixed(3));
            b.cycleStartTime = Number((b.cycleStartTime / 1000000).toFixed(3));
        })
    }

    initElements(): void {
        this.threadBindersTbl = this.shadowRoot?.querySelector<LitTable>('#tb-binder-count');
        this.threadBindersTbl!.itemTextHandleMap.set('title', Utils.transferBinderTitle);
    }

    connectedCallback() {
        super.connectedCallback();
        resizeObserver(this.parentElement!, this.threadBindersTbl!);
    }

    transferToTreeData(binderList: BinderGroup[]): BinderGroup[] {
        let group: any = {};
        binderList.forEach((it: BinderGroup) => {
            if (group[`${it.pid}`]) {
                let process = group[`${it.pid}`];
                process.totalCount += it.count;
                let thread = process.children.find((child: BinderGroup) => child.title === `T-${it.tid}`);
                if (thread) {
                    thread.totalCount += it.count;
                    thread.binderTransactionCount += it.name == 'binder transaction' ? it.count : 0;
                    thread.binderAsyncRcvCount += it.name == 'binder async rcv' ? it.count : 0;
                    thread.binderReplyCount += it.name == 'binder reply' ? it.count : 0;
                    thread.binderTransactionAsyncCount += it.name == 'binder transaction async' ? it.count : 0;
                } else {
                    process.children.push({
                        title: `T-${it.tid}`,
                        totalCount: it.count,
                        binderTransactionCount: it.name == 'binder transaction' ? it.count : 0,
                        binderAsyncRcvCount: it.name == 'binder async rcv' ? it.count : 0,
                        binderReplyCount: it.name == 'binder reply' ? it.count : 0,
                        binderTransactionAsyncCount: it.name == 'binder transaction async' ? it.count : 0,
                        tid: it.tid,
                        pid: it.pid
                    })
                }
            } else {
                group[`${it.pid}`] = {
                    title: `P-${it.pid}`,
                    totalCount: it.count,
                    tid: it.tid,
                    pid: it.pid,
                    cycleDur: it.cycleDur || 0,
                    cycleStartTime: it.cycleStartTime,
                    children: [
                        {
                            title: `T-${it.tid}`,
                            totalCount: it.count,
                            binderTransactionCount: it.name == 'binder transaction' ? it.count : 0,
                            binderAsyncRcvCount: it.name == 'binder async rcv' ? it.count : 0,
                            binderReplyCount: it.name == 'binder reply' ? it.count : 0,
                            binderTransactionAsyncCount: it.name == 'binder transaction async' ? it.count : 0,
                            tid: it.tid,
                            pid: it.pid,
                        }
                    ]
                }
            }
        });
        return Object.values(group);
    }

    private theadClick(data: Array<BinderGroup>) {
        let labels = this.threadBindersTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
        if (labels) {
            for (let i = 0; i < labels.length; i++) {
                let label = labels[i].innerHTML;
                labels[i].addEventListener('click', (e) => {
                    if (label.includes('Process') && i === 0) {
                        this.threadBindersTbl!.setStatus(data, false);
                        this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    } else if (label.includes('Thread') && i === 1) {
                        for (let item of data) {
                            item.status = true;
                            if (item.children != undefined && item.children.length > 0) {
                                this.threadBindersTbl!.setStatus(item.children, false);
                            }
                        }
                        this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
                    }
                });
            }
        }
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
    
        `
    }
}    