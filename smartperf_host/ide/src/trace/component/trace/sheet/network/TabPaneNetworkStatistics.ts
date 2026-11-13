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
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { NetworkRequestStruct, NetworkTimeInformation, NetworkDomainStatistics, IpStatistics, UrlStatistics, TransactionData, IpSummaryData } from '../../../../bean/NetworkStruct';
import { queryNetworkInformation, queryNetworkTimeInformation } from '../../../../database/sql/Network.sql';
import { resizeObserver } from '../SheetUtils';

interface EnrichedNetworkData extends NetworkRequestStruct {
  startTime: number;
  startTimeStr: string;
  endTime: number;
  duration: number;
  durationStr: string;
  blockedTime: number;
  waitingTime: number;
  responseTime: number;
}

interface DetailTreeNode {
  name: string;
  count: number;
  totalDuration: number;
  totalDurationStr: string;
  avgDuration: number;
  avgDurationStr: string;
  maxDuration: number;
  maxDurationStr: string;
  blockMaxTime: number;
  blockMaxTimeStr: string;
  blockAvgTime: number;
  blockAvgTimeStr: string;
  waitingMaxTime: number;
  waitingMaxTimeStr: string;
  waitingAvgTime: number;
  waitingAvgTimeStr: string;
  receiveMaxTime: number;
  receiveMaxTimeStr: string;
  receiveAvgTime: number;
  receiveAvgTimeStr: string;
  children: DetailTreeNode[];
  status: boolean;
  level: number;
}

@element('tabpane-global-network-statistic')
export class TabPaneNetworkStatistics extends BaseElement {
  private networkTableList: LitTable | null | undefined;
  private networkTableDetail: LitTable | null | undefined;
  private networkDataSource: Array<EnrichedNetworkData> = [];
  private networkDataSourceRaw: Array<EnrichedNetworkData> = [];
  private timeInfoMap: Map<string, NetworkTimeInformation> = new Map();
  private showDetail: boolean = false;
  private detailDataSource: DetailTreeNode[] = [];
  private detailDataSourceRaw: DetailTreeNode[] = [];
  private ipSummaryDataSource: Array<IpSummaryData> = [];
  private ipSummaryDataSourceRaw: Array<IpSummaryData> = [];
  private detailListDataSource: Array<EnrichedNetworkData> = [];
  private detailListDataSourceRaw: Array<EnrichedNetworkData> = [];
  private selectedRowData: EnrichedNetworkData | null = null;
  private selectedIpAddress: string | null = null;

  set data(selectionParam: SelectionParam) {
    this.showDetail = false;
    this.selectedRowData = null;
    this.selectedIpAddress = null;
    this.showDetailValue(false);
    this.queryDataByDB(selectionParam);
  }

  setShowDetail(ipAddress: string | false): void {
    if (ipAddress === false) {
      this.showDetailValue(false);
    } else {
      this.selectedIpAddress = ipAddress;
      this.showDetailValue(true);
    }
  }

  showDetailValue(show: boolean): void {
    this.showDetail = show;
    const backBtn = this.shadowRoot?.getElementById('back-btn') as HTMLDivElement;
    if (backBtn) {
      backBtn.style.display = show ? 'flex' : 'none';
    }

    if (show) {
      this.networkTableList!.style.display = 'none';
      this.networkTableDetail!.style.display = 'grid';
      this.networkTableDetail!.loading = true;
      this.buildDetailListByIpAddress();
      this.networkTableDetail!.loading = false;
    } else {
      this.networkTableDetail!.style.display = 'none';
      this.networkTableList!.style.display = 'grid';
      this.networkTableList!.loading = true;
      this.buildIpSummaryData();
      this.networkTableList!.loading = false;
    }
  }

  initElements(): void {
    this.networkTableList = this.shadowRoot?.querySelector<LitTable>('#tb-network-list');
    this.networkTableDetail = this.shadowRoot?.querySelector<LitTable>('#tb-network-detail');

    this.networkTableList!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortIpSummaryColumn(evt.detail);
    });

    this.networkTableDetail!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortDetailListColumn(evt.detail);
    });
  }

  initHtml(): string {
    return `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .toolbar {
          display: flex;
          align-items: center;
        }
        .back-btn {
          display: none;
          align-items: center;
          margin-top: 5px;
          cursor: pointer;
        }
        .back-box {
          background-color: var(--bark-expansion,#0C65D1);
          border-radius: 5px;
          color: #fff;
          display: flex;
          width: 40px;
          height: 20px;
          justify-content: center;
          align-items: center;
        }
      </style>
      <div class="container">
        <div class="toolbar">
          <div class="back-btn" id="back-btn">
            <div class="back-box">
              <lit-icon name="arrowleft"></lit-icon>
            </div>
          </div>
        </div>
        <lit-table id="tb-network-list" style="height: auto"></lit-table>
        <lit-table id="tb-network-detail" style="display: none;"></lit-table>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.initializeListColumns();
    this.initializeDetailColumns();

    this.networkTableList?.addEventListener('td-click', (evt: Event) => {
      const customEvent = evt as CustomEvent<IpSummaryData>;
      if (!this.showDetail) {
        const data = customEvent.detail;
        if (data && data.ipAddress) {
          this.setShowDetail(data.ipAddress);
        }
      }
    });

    const backBtn = this.shadowRoot?.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      this.setShowDetail(false);
    });

    resizeObserver(this.parentElement!, this.networkTableList!);
    resizeObserver(this.parentElement!, this.networkTableDetail!);
  }

  initializeListColumns(): void {
    if (!this.networkTableList) return;

    const columns = this.getIpSummaryColumns();
    this.networkTableList.innerHTML = '';

    columns.forEach(col => {
      const column = document.createElement('lit-table-column');
      column.setAttribute('title', col.title);
      column.setAttribute('key', col.key);
      column.setAttribute('width', col.width);
      column.setAttribute('data-index', col.key);
      column.setAttribute('align', 'flex-start');
      column.setAttribute('order', '');
      if (col.tdJump) {
        column.setAttribute('tdJump', '');
      }
      this.networkTableList!.appendChild(column);
    });
  }

  getIpSummaryColumns(): Array<{title: string; key: string; width: string; tdJump?: boolean}> {
    return [
      { title: 'Domain', key: 'ipAddress', width: '200px' },
      { title: 'Count', key: 'count', width: '100px', tdJump: true },
      { title: 'Total Duration(ms)', key: 'totalDurationStr', width: '150px' },
      { title: 'Avg Duration(ms)', key: 'avgDurationStr', width: '150px' },
      { title: 'Max Duration(ms)', key: 'maxDurationStr', width: '150px' },
      { title: 'Block Max(ms)', key: 'blockMaxTimeStr', width: '120px' },
      { title: 'Block Avg(ms)', key: 'blockAvgTimeStr', width: '120px' },
      { title: 'Waiting Max(ms)', key: 'waitingMaxTimeStr', width: '130px' },
      { title: 'Waiting Avg(ms)', key: 'waitingAvgTimeStr', width: '130px' },
      { title: 'Receive Max(ms)', key: 'receiveMaxTimeStr', width: '130px' },
      { title: 'Receive Avg(ms)', key: 'receiveAvgTimeStr', width: '130px' }
    ];
  }

  getTableColumns(): Array<{title: string; key: string; width: string}> {
    return [
      { title: 'Start(ms)', key: 'startTimeStr', width: '150px' },
      { title: 'RequestId', key: 'requestId', width: '100px' },
      { title: 'Method', key: 'requestMethod', width: '100px' },
      { title: 'Url', key: 'requestUri', width: '400px' },
      { title: 'Duration(ms)', key: 'durationStr', width: '120px' },
      { title: 'Code', key: 'responseStatusCode', width: '80px' },
      { title: 'IpAddress', key: 'ipAddress', width: '150px' },
      { title: 'Version', key: 'version', width: '100px' },
      { title: 'EffectiveUrl', key: 'responseEffectiveUrl', width: '400px' }
    ];
  }

  initializeDetailColumns(): void {
    if (!this.networkTableDetail) return;

    const columns = this.getTableColumns();
    this.networkTableDetail.innerHTML = '';
    columns.forEach(col => {
      const column = document.createElement('lit-table-column');
      column.setAttribute('title', col.title);
      column.setAttribute('key', col.key);
      column.setAttribute('width', col.width);
      column.setAttribute('data-index', col.key);
      column.setAttribute('align', 'flex-start');
      column.setAttribute('order', '');
      this.networkTableDetail!.appendChild(column);
    });
  }

  buildIpSummaryData(): void {
    const ipMap = new Map<string, {
      count: number;
      totalDuration: number;
      totalBlockTime: number;
      totalWaitingTime: number;
      totalReceiveTime: number;
      maxDuration: number;
      blockMaxTime: number;
      waitingMaxTime: number;
      receiveMaxTime: number;
    }>();

    this.networkDataSourceRaw.forEach(item => {
      const key = `${item.ipid}-${item.itid}`;
      const timeInfo = this.timeInfoMap.get(key);
      if (!timeInfo) return;

      const duration = timeInfo.endTime - timeInfo.beginTime;
      const blockedTime = timeInfo.tlsEndTime - timeInfo.beginTime;
      const waitingTime = timeInfo.firstRecvTime - timeInfo.firstSendTime;
      const receiveTime = timeInfo.endTime - timeInfo.firstRecvTime;

      if (!ipMap.has(item.ipAddress)) {
        ipMap.set(item.ipAddress, {
          count: 0,
          totalDuration: 0,
          totalBlockTime: 0,
          totalWaitingTime: 0,
          totalReceiveTime: 0,
          maxDuration: 0,
          blockMaxTime: 0,
          waitingMaxTime: 0,
          receiveMaxTime: 0
        });
      }

      const stat = ipMap.get(item.ipAddress)!;
      stat.count++;
      stat.totalDuration += duration;
      stat.maxDuration = Math.max(stat.maxDuration, duration);
      stat.totalBlockTime += blockedTime;
      stat.blockMaxTime = Math.max(stat.blockMaxTime, blockedTime);
      stat.totalWaitingTime += waitingTime;
      stat.waitingMaxTime = Math.max(stat.waitingMaxTime, waitingTime);
      stat.totalReceiveTime += receiveTime;
      stat.receiveMaxTime = Math.max(stat.receiveMaxTime, receiveTime);
    });

    const summaryData = Array.from(ipMap.entries()).map(([ip, stat]) => ({
      ipAddress: ip,
      count: stat.count,
      totalDuration: stat.totalDuration,
      totalDurationStr: (stat.totalDuration / 1000000.0).toFixed(3),
      avgDuration: stat.totalDuration / stat.count,
      avgDurationStr: ((stat.totalDuration / stat.count) / 1000000.0).toFixed(3),
      maxDuration: stat.maxDuration,
      maxDurationStr: (stat.maxDuration / 1000000.0).toFixed(3),
      blockMaxTime: stat.blockMaxTime,
      blockMaxTimeStr: (stat.blockMaxTime / 1000000.0).toFixed(3),
      blockAvgTime: stat.totalBlockTime / stat.count,
      blockAvgTimeStr: ((stat.totalBlockTime / stat.count) / 1000000.0).toFixed(3),
      waitingMaxTime: stat.waitingMaxTime,
      waitingMaxTimeStr: (stat.waitingMaxTime / 1000000.0).toFixed(3),
      waitingAvgTime: stat.totalWaitingTime / stat.count,
      waitingAvgTimeStr: ((stat.totalWaitingTime / stat.count) / 1000000.0).toFixed(3),
      receiveMaxTime: stat.receiveMaxTime,
      receiveMaxTimeStr: (stat.receiveMaxTime / 1000000.0).toFixed(3),
      receiveAvgTime: stat.totalReceiveTime / stat.count,
      receiveAvgTimeStr: ((stat.totalReceiveTime / stat.count) / 1000000.0).toFixed(3)
    }));

    this.ipSummaryDataSourceRaw = [...summaryData];
    this.ipSummaryDataSource = [...summaryData];
    this.networkTableList!.recycleDataSource = this.ipSummaryDataSource;
  }

  buildDetailListByIpAddress(): void {
    if (!this.selectedIpAddress) return;

    const detailList = this.networkDataSourceRaw
      .filter(item => item.ipAddress === this.selectedIpAddress)
      .map(item => ({
        ...item,
        startTimeStr: (item.startTime / 1000000.0).toFixed(3),
        durationStr: (item.duration / 1000000.0).toFixed(3)
      }));

    this.detailListDataSourceRaw = [...detailList];
    this.detailListDataSource = [...detailList];
    this.networkTableDetail!.recycleDataSource = this.detailListDataSource;
  }

  buildDetailTreeData(): void {
    if (!this.selectedRowData) return;

    const selectedDomain = this.selectedRowData.domain;
    const selectedIp = this.selectedRowData.ipAddress;

    const domainMap = new Map<string, IpStatistics[]>();

    this.networkDataSourceRaw.forEach(item => {
      const key = `${item.ipid}-${item.itid}`;
      const timeInfo = this.timeInfoMap.get(key);
      if (!timeInfo || item.domain !== selectedDomain) return;

      if (!domainMap.has(item.domain)) {
        domainMap.set(item.domain, []);
      }

      const ipList = domainMap.get(item.domain)!;
      let ipStat = ipList.find(ip => ip.ip === item.ipAddress);

      if (!ipStat) {
        ipStat = {
          ip: item.ipAddress,
          urlList: []
        };
        ipList.push(ipStat);
      }

      const url = item.responseEffectiveUrl || (item.domain + item.requestUri);
      let urlStat = ipStat.urlList.find(u => u.url === url);

      if (!urlStat) {
        urlStat = {
          url: url,
          count: 0,
          totalDuration: 0,
          totalBlockTime: 0,
          totalWaitingTime: 0,
          totalReceiveTime: 0,
          avgDuration: 0,
          maxDuration: 0,
          blockMaxTime: 0,
          blockAvgTime: 0,
          waitingMaxTime: 0,
          waitingAvgTime: 0,
          receiveMaxTime: 0,
          receiveAvgTime: 0,
          transactions: []
        };
        ipStat.urlList.push(urlStat);
      }

      const transactionData = {
        ...item,
        url: url,
        duration: timeInfo.endTime - timeInfo.beginTime,
        blockedTime: timeInfo.tlsEndTime - timeInfo.beginTime,
        waitingTime: timeInfo.firstRecvTime - timeInfo.firstSendTime,
        responseTime: timeInfo.endTime - timeInfo.firstRecvTime
      };

      if (!urlStat.transactions) {
        urlStat.transactions = [];
      }
      urlStat.transactions.push(transactionData);

      urlStat.count++;
      const duration = timeInfo.endTime - timeInfo.beginTime;
      urlStat.totalDuration += duration;
      urlStat.maxDuration = Math.max(urlStat.maxDuration, duration);

      const blockedTime = timeInfo.tlsEndTime - timeInfo.beginTime;
      const waitingTime = timeInfo.firstRecvTime - timeInfo.firstSendTime;
      const receiveTime = timeInfo.endTime - timeInfo.firstRecvTime;

      urlStat.totalBlockTime += blockedTime;
      urlStat.totalWaitingTime += waitingTime;
      urlStat.totalReceiveTime += receiveTime;
      urlStat.blockMaxTime = Math.max(urlStat.blockMaxTime, blockedTime);
      urlStat.waitingMaxTime = Math.max(urlStat.waitingMaxTime, waitingTime);
      urlStat.receiveMaxTime = Math.max(urlStat.receiveMaxTime, receiveTime);
    });

    this.detailDataSource = [];

    domainMap.forEach((ipList, domain) => {
      if (domain !== selectedDomain) return;

      let totalCount = 0;
      let totalDuration = 0;
      let totalBlockTime = 0;
      let totalWaitingTime = 0;
      let totalReceiveTime = 0;
      let maxDuration = 0;
      let blockMax = 0;
      let waitingMax = 0;
      let receiveMax = 0;

      ipList.forEach(ipStat => {
        ipStat.urlList.forEach(urlStat => {
          if (!urlStat) return;
          totalCount += urlStat.count;
          totalDuration += urlStat.totalDuration;
          totalBlockTime += urlStat.totalBlockTime;
          totalWaitingTime += urlStat.totalWaitingTime;
          totalReceiveTime += urlStat.totalReceiveTime;
          maxDuration = Math.max(maxDuration, urlStat.maxDuration);
          blockMax = Math.max(blockMax, urlStat.blockMaxTime);
          waitingMax = Math.max(waitingMax, urlStat.waitingMaxTime);
          receiveMax = Math.max(receiveMax, urlStat.receiveMaxTime);
        });
      });

      const allNode: DetailTreeNode = {
        name: 'All',
        count: totalCount,
        totalDuration: totalDuration,
        totalDurationStr: (totalDuration / 1000000.0).toFixed(3),
        avgDuration: totalDuration / totalCount,
        avgDurationStr: ((totalDuration / totalCount) / 1000000.0).toFixed(3),
        maxDuration: maxDuration,
        maxDurationStr: (maxDuration / 1000000.0).toFixed(3),
        blockMaxTime: blockMax,
        blockMaxTimeStr: (blockMax / 1000000.0).toFixed(3),
        blockAvgTime: totalCount > 0 ? totalBlockTime / totalCount : 0,
        blockAvgTimeStr: totalCount > 0 ? ((totalBlockTime / totalCount) / 1000000.0).toFixed(3) : '0',
        waitingMaxTime: waitingMax,
        waitingMaxTimeStr: (waitingMax / 1000000.0).toFixed(3),
        waitingAvgTime: totalCount > 0 ? totalWaitingTime / totalCount : 0,
        waitingAvgTimeStr: totalCount > 0 ? ((totalWaitingTime / totalCount) / 1000000.0).toFixed(3) : '0',
        receiveMaxTime: receiveMax,
        receiveMaxTimeStr: (receiveMax / 1000000.0).toFixed(3),
        receiveAvgTime: totalCount > 0 ? totalReceiveTime / totalCount : 0,
        receiveAvgTimeStr: totalCount > 0 ? ((totalReceiveTime / totalCount) / 1000000.0).toFixed(3) : '0',
        children: [],
        status: false,
        level: 0
      };

      this.detailDataSource.push(allNode);

      ipList.forEach(ipStat => {
        let ipTotalCount = 0;
        let ipTotalDuration = 0;
        let ipTotalBlockTime = 0;
        let ipTotalWaitingTime = 0;
        let ipTotalReceiveTime = 0;
        let ipMaxDuration = 0;
        let ipBlockMax = 0;
        let ipWaitingMax = 0;
        let ipReceiveMax = 0;

        ipStat.urlList.forEach(urlStat => {
          ipTotalCount += urlStat.count;
          ipTotalDuration += urlStat.totalDuration;
          ipTotalBlockTime += urlStat.totalBlockTime;
          ipTotalWaitingTime += urlStat.totalWaitingTime;
          ipTotalReceiveTime += urlStat.totalReceiveTime;
          ipMaxDuration = Math.max(ipMaxDuration, urlStat.maxDuration);
          ipBlockMax = Math.max(ipBlockMax, urlStat.blockMaxTime);
          ipWaitingMax = Math.max(ipWaitingMax, urlStat.waitingMaxTime);
          ipReceiveMax = Math.max(ipReceiveMax, urlStat.receiveMaxTime);
        });

        const ipNode: DetailTreeNode = {
          name: `${ipStat.ip}`,
          count: ipTotalCount,
          totalDuration: ipTotalDuration,
          totalDurationStr: (ipTotalDuration / 1000000.0).toFixed(3),
          avgDuration: ipTotalDuration / ipTotalCount,
          avgDurationStr: ((ipTotalDuration / ipTotalCount) / 1000000.0).toFixed(3),
          maxDuration: ipMaxDuration,
          maxDurationStr: (ipMaxDuration / 1000000.0).toFixed(3),
          blockMaxTime: ipBlockMax,
          blockMaxTimeStr: (ipBlockMax / 1000000.0).toFixed(3),
          blockAvgTime: ipTotalCount > 0 ? ipTotalBlockTime / ipTotalCount : 0,
          blockAvgTimeStr: ipTotalCount > 0 ? ((ipTotalBlockTime / ipTotalCount) / 1000000.0).toFixed(3) : '0',
          waitingMaxTime: ipWaitingMax,
          waitingMaxTimeStr: (ipWaitingMax / 1000000.0).toFixed(3),
          waitingAvgTime: ipTotalCount > 0 ? ipTotalWaitingTime / ipTotalCount : 0,
          waitingAvgTimeStr: ipTotalCount > 0 ? ((ipTotalWaitingTime / ipTotalCount) / 1000000.0).toFixed(3) : '0',
          receiveMaxTime: ipReceiveMax,
          receiveMaxTimeStr: (ipReceiveMax / 1000000.0).toFixed(3),
          receiveAvgTime: ipTotalCount > 0 ? ipTotalReceiveTime / ipTotalCount : 0,
          receiveAvgTimeStr: ipTotalCount > 0 ? ((ipTotalReceiveTime / ipTotalCount) / 1000000.0).toFixed(3) : '0',
          children: [],
          status: false,
          level: 1
        };

        allNode.children.push(ipNode);

        ipStat.urlList.forEach(urlStat => {
          if (!urlStat) return;

          urlStat.avgDuration = urlStat.totalDuration / urlStat.count;
          urlStat.blockAvgTime = urlStat.count > 0 ? urlStat.totalBlockTime / urlStat.count : 0;
          urlStat.waitingAvgTime = urlStat.count > 0 ? urlStat.totalWaitingTime / urlStat.count : 0;
          urlStat.receiveAvgTime = urlStat.count > 0 ? urlStat.totalReceiveTime / urlStat.count : 0;

          const urlNode: DetailTreeNode = {
            name: urlStat.url,
            count: urlStat.count,
            totalDuration: urlStat.totalDuration,
            totalDurationStr: (urlStat.totalDuration / 1000000.0).toFixed(3),
            avgDuration: urlStat.avgDuration,
            avgDurationStr: (urlStat.avgDuration / 1000000.0).toFixed(3),
            maxDuration: urlStat.maxDuration,
            maxDurationStr: (urlStat.maxDuration / 1000000.0).toFixed(3),
            blockMaxTime: urlStat.blockMaxTime,
            blockMaxTimeStr: (urlStat.blockMaxTime / 1000000.0).toFixed(3),
            blockAvgTime: urlStat.blockAvgTime,
            blockAvgTimeStr: (urlStat.blockAvgTime / 1000000.0).toFixed(3),
            waitingMaxTime: urlStat.waitingMaxTime,
            waitingMaxTimeStr: (urlStat.waitingMaxTime / 1000000.0).toFixed(3),
            waitingAvgTime: urlStat.waitingAvgTime,
            waitingAvgTimeStr: (urlStat.waitingAvgTime / 1000000.0).toFixed(3),
            receiveMaxTime: urlStat.receiveMaxTime,
            receiveMaxTimeStr: (urlStat.receiveMaxTime / 1000000.0).toFixed(3),
            receiveAvgTime: urlStat.receiveAvgTime,
            receiveAvgTimeStr: (urlStat.receiveAvgTime / 1000000.0).toFixed(3),
            children: [],
            status: false,
            level: 2
          };

          ipNode.children.push(urlNode);

          urlStat.transactions?.forEach((trans: TransactionData) => {
            const transNode: DetailTreeNode = {
              name: trans.requestId,
              count: 1,
              totalDuration: trans.duration,
              totalDurationStr: (trans.duration / 1000000.0).toFixed(3),
              avgDuration: trans.duration,
              avgDurationStr: (trans.duration / 1000000.0).toFixed(3),
              maxDuration: trans.duration,
              maxDurationStr: (trans.duration / 1000000.0).toFixed(3),
              blockMaxTime: trans.blockedTime,
              blockMaxTimeStr: (trans.blockedTime / 1000000.0).toFixed(3),
              blockAvgTime: trans.blockedTime,
              blockAvgTimeStr: (trans.blockedTime / 1000000.0).toFixed(3),
              waitingMaxTime: trans.waitingTime,
              waitingMaxTimeStr: (trans.waitingTime / 1000000.0).toFixed(3),
              waitingAvgTime: trans.waitingTime,
              waitingAvgTimeStr: (trans.waitingTime / 1000000.0).toFixed(3),
              receiveMaxTime: trans.responseTime,
              receiveMaxTimeStr: (trans.responseTime / 1000000.0).toFixed(3),
              receiveAvgTime: trans.responseTime,
              receiveAvgTimeStr: (trans.responseTime / 1000000.0).toFixed(3),
              children: [],
              status: false,
              level: 3
            };

            urlNode.children.push(transNode);
          });
        });
      });
    });

    this.networkTableDetail!.recycleDataSource = this.detailDataSource;
    this.detailDataSourceRaw = JSON.parse(JSON.stringify(this.detailDataSource));
  }

  async queryDataByDB(val: SelectionParam): Promise<void> {
    if (this.networkTableList) {
      this.networkTableList.loading = true;
    }
    const processIds = val.shouldQueryByProcess && val.networkIds.length > 0 ? val.networkIds : undefined;
    const networkInfo = await queryNetworkInformation(val.leftNs, val.rightNs, processIds);
    const timeInfoArray = await queryNetworkTimeInformation(val.leftNs, val.rightNs, processIds);

    this.timeInfoMap.clear();
    timeInfoArray.forEach(info => {
      const key = `${info.ipid}-${info.itid}`;
      this.timeInfoMap.set(key, info);
    });

    this.networkDataSource = networkInfo.map(item => {
      const key = `${item.ipid}-${item.itid}`;
      const timeInfo = this.timeInfoMap.get(key);
      const enrichedItem = item as EnrichedNetworkData;

      if (timeInfo) {
        enrichedItem.startTime = timeInfo.beginTime;
        enrichedItem.endTime = timeInfo.endTime;
        enrichedItem.duration = timeInfo.endTime - timeInfo.beginTime;

        const blockedTime = timeInfo.tlsEndTime - timeInfo.beginTime;
        const waitingTime = timeInfo.firstRecvTime - timeInfo.firstSendTime;
        const responseTime = timeInfo.endTime - timeInfo.firstRecvTime;

        enrichedItem.blockedTime = blockedTime;
        enrichedItem.waitingTime = waitingTime;
        enrichedItem.responseTime = responseTime;
      }

      return enrichedItem;
    });
    this.networkDataSourceRaw = [...this.networkDataSource];
    this.networkDataSource.sort((a, b) => a.startTime - b.startTime);
    this.networkDataSource = this.networkDataSource.map(item => ({
      ...item,
      startTimeStr: (item.startTime / 1000000.0).toFixed(3),
      durationStr: (item.duration / 1000000.0).toFixed(3)
    }));
    this.buildIpSummaryData();
    if (this.networkTableList) {
      this.networkTableList.loading = false;
    }
  }

  updateTable(): void {
    if (this.networkTableList) {
      this.networkTableList.recycleDataSource = this.networkDataSource;
    }
  }

  sortByColumn(detail: { key: string; sort: number }): void {
    if (detail.sort === 0) {
      this.networkDataSource = this.networkDataSourceRaw.map(item => ({
        ...item,
        startTimeStr: (item.startTime / 1000000.0).toFixed(3),
        durationStr: (item.duration / 1000000.0).toFixed(3)
      }));
      this.updateTable();
      return;
    }
    const sortKey = detail.key as keyof EnrichedNetworkData;

    if (sortKey === 'startTimeStr' || sortKey === 'durationStr') {
      const numKey = sortKey.replace('Str', '') as keyof EnrichedNetworkData;
      this.networkDataSource.sort((a, b) => {
        const valA = a[numKey] as number ?? 0;
        const valB = b[numKey] as number ?? 0;
        return detail.sort === 2 ? valB - valA : valA - valB;
      });
    } else {
      this.networkDataSource.sort((a, b) => {
        const valA = a[sortKey] ?? '';
        const valB = b[sortKey] ?? '';
        if (valA < valB) return detail.sort === 2 ? 1 : -1;
        if (valA > valB) return detail.sort === 2 ? -1 : 1;
        return 0;
      });
    }
    this.updateTable();
  }

  sortByColumnDetail(detail: { key: string; sort: number }): void {
    const sortKey = detail.key as keyof DetailTreeNode;
    const sortList: DetailTreeNode[] = JSON.parse(JSON.stringify(this.detailDataSourceRaw));

    if (detail.sort === 0) {
      this.detailDataSource = [...this.detailDataSourceRaw];
      this.networkTableDetail!.recycleDataSource = this.detailDataSource;
      this.networkTableDetail!.setStatus(this.detailDataSource, true);
      this.networkTableDetail!.recycleDs = this.networkTableDetail!.meauseTreeRowElement(this.detailDataSource, RedrawTreeForm.Expand);
      return;
    }

    const numKeys = ['totalDurationStr', 'avgDurationStr', 'maxDurationStr', 'blockMaxTimeStr', 'blockAvgTimeStr', 'waitingMaxTimeStr', 'waitingAvgTimeStr', 'receiveMaxTimeStr', 'receiveAvgTimeStr'];
    const numKey = numKeys.includes(sortKey) ? (sortKey.replace('Str', '') as keyof DetailTreeNode) : sortKey;

    sortList.forEach(item => {
      if (item.children) {
        item.children.forEach(child => {
          if (child.children) {
            child.children.sort((a, b) => {
              let valA: DetailTreeNode[keyof DetailTreeNode];
              let valB: DetailTreeNode[keyof DetailTreeNode];

              if (numKeys.includes(sortKey)) {
                valA = a[numKey] as number ?? 0;
                valB = b[numKey] as number ?? 0;
                return detail.sort === 2 ? (valB as number) - (valA as number) : (valA as number) - (valB as number);
              } else {
                valA = a[sortKey];
                valB = b[sortKey];
                if (sortKey === 'name') {
                  return detail.sort === 1 ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
                } else {
                  return detail.sort === 1 ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
                }
              }
            });
          }
        });
      }
    });

    this.detailDataSource = sortList;
    this.networkTableDetail!.recycleDataSource = this.detailDataSource;
    this.networkTableDetail!.setStatus(this.detailDataSource, true);
    this.networkTableDetail!.recycleDs = this.networkTableDetail!.meauseTreeRowElement(this.detailDataSource, RedrawTreeForm.Expand);
  }

  sortIpSummaryColumn(detail: { key: string; sort: number }): void {
    if (detail.sort === 0) {
      this.ipSummaryDataSource = [...this.ipSummaryDataSourceRaw];
      this.networkTableList!.recycleDataSource = this.ipSummaryDataSource;
      return;
    }

    const sortKey = detail.key;
    const sortList = [...this.ipSummaryDataSourceRaw];

    const numKeys = ['totalDurationStr', 'avgDurationStr', 'maxDurationStr', 'blockMaxTimeStr', 'blockAvgTimeStr', 'waitingMaxTimeStr', 'waitingAvgTimeStr', 'receiveMaxTimeStr', 'receiveAvgTimeStr'];
    const numKey = (numKeys.includes(sortKey) ? (sortKey.replace('Str', '')) : sortKey) as keyof IpSummaryData;

    sortList.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      if (numKeys.includes(sortKey)) {
        valA = a[numKey] as number ?? 0;
        valB = b[numKey] as number ?? 0;
        return detail.sort === 2 ? (valB as number) - (valA as number) : (valA as number) - (valB as number);
      } else {
        const key = sortKey as keyof IpSummaryData;
        valA = a[key];
        valB = b[key];

        if (sortKey === 'ipAddress') {
          return detail.sort === 1 ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
        } else {
          return detail.sort === 1 ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        }
      }
    });

    this.ipSummaryDataSource = sortList;
    this.networkTableList!.recycleDataSource = this.ipSummaryDataSource;
  }

  sortDetailListColumn(detail: { key: string; sort: number }): void {
    if (detail.sort === 0) {
      this.detailListDataSource = [...this.detailListDataSourceRaw];
      this.networkTableDetail!.recycleDataSource = this.detailListDataSource;
      return;
    }

    const sortKey = detail.key as keyof EnrichedNetworkData;
    const sortList = [...this.detailListDataSourceRaw];

    if (sortKey === 'startTimeStr' || sortKey === 'durationStr') {
      const numKey = sortKey.replace('Str', '') as keyof EnrichedNetworkData;
      sortList.sort((a, b) => {
        const valA = a[numKey] as number ?? 0;
        const valB = b[numKey] as number ?? 0;
        return detail.sort === 2 ? valB - valA : valA - valB;
      });
    } else {
      sortList.sort((a, b) => {
        const valA = a[sortKey] ?? '';
        const valB = b[sortKey] ?? '';
        if (valA < valB) return detail.sort === 2 ? 1 : -1;
        if (valA > valB) return detail.sort === 2 ? -1 : 1;
        return 0;
      });
    }

    this.detailListDataSource = sortList;
    this.networkTableDetail!.recycleDataSource = this.detailListDataSource;
  }
}
