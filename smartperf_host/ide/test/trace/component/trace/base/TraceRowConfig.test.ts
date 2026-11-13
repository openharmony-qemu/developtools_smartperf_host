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

import { TraceRowConfig } from '../../../../../src/trace/component/trace/base/TraceRowConfig';
import '../../../../../src/trace/component/trace/base/TraceRowConfig';
import { TraceRow } from '../../../../../src/trace/component/trace/base/TraceRow';
import '../../../../../src/trace/component/trace/base/TraceRow';
import { BaseStruct } from '../../../../../src/trace/bean/BaseStruct';
import '../../../../../src/trace/bean/BaseStruct';
import { LitCheckBox } from "../../../../../src/base-ui/checkbox/LitCheckBox";

jest.mock('../../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {
    CpuStruct: {
      wakeupBean: undefined
    }
  }
});
jest.mock('../../../../../src/trace/component/trace/TimerShaftElement', () => {
});

describe('TraceRowConfig Test', () => {
  document.body.innerHTML = `<div><sp-application><lit-search id="lit-search"></lit-search></sp-application><trace-row-config id="config"></trace-row-config>
                                    <sp-system-trace></sp-system-trace></div>`;

  let spSystemTrace = document.querySelector('sp-system-trace');
  let shadowRoot = spSystemTrace.attachShadow({mode: 'open'});
  let rowsPaneDiv = document.createElement('div');
  rowsPaneDiv.classList.add('rows-pane');
  let traceRow = TraceRow.skeleton<BaseStruct>();
  traceRow.setAttribute('row-parent-id', '');
  traceRow.addTemplateTypes('Memory');
  shadowRoot.appendChild(rowsPaneDiv);
  rowsPaneDiv.appendChild(traceRow);

  let nodes = [{
    children: [
      {
        children: [
          {
            children: [],
            depth: 3,
            id: 3,
            isCheck: true,
            nodeName: "Cpu chart",
            scene: []
          }
        ],
        depth: 2,
        id: 2,
        isCheck: false,
        nodeName: "Cpu",
        parent: {
          id: 1, nodeName: 'Cpu', children: [], depth: 1, isCheck: false,
          scene: []
        },
        scene: []
      }
    ],
    depth: 1,
    id: 1,
    isCheck: false,
    nodeName: "Cpu",
    scene: []
  }]

  let json = {
    "subsystems": [
      {
        "subsystem": "Cpu",
        "components": [
          {
            "component": "Cpu",
            "charts": [
              {
                "chartName": "Cpu",
                "chartId": ""
              }
            ]
          }
        ]
      }
    ]
  }

  let traceRowConfig = document.querySelector<TraceRowConfig>('#config');

  it('TraceRowConfig Test01', () => {
    traceRowConfig.init();
    expect(traceRowConfig.selectTypeList.length).toBe(0);
  });

  it('TraceRowConfig Test02', () => {
    traceRowConfig.init();
    let checkBox = new LitCheckBox;
    checkBox.checked = true;
    let node = {
      children: [],
      depth: 3,
      id: 6,
      isCheck: true,
      nodeName: "Cpu",
      scene: []
    }
    traceRowConfig.displayRow(node, checkBox);
    expect(traceRowConfig.subsystemSelectList.length).toBe(2)
  });
  it('TraceRowConfig Test03', () => {
    traceRowConfig.init();
    let checkBox = new LitCheckBox;
    let node = {
      children: [],
      depth: 3,
      id: 6,
      isCheck: false,
      nodeName: "Cpu",
      scene: []
    }
    traceRowConfig.displayRow(node, checkBox);
    expect(traceRowConfig.subsystemSelectList.length).toBe(0)
  });


  it('TraceRowConfig Test04', () => {
    expect(traceRowConfig.refreshSelectList(nodes)).toBeUndefined();
  });

  it('TraceRowConfig Test05', () => {
    traceRowConfig.init()
    let favoriteRow = new TraceRow<any>;
    traceRowConfig.spSystemTrace.collectRows = [favoriteRow];
    traceRowConfig.spSystemTrace.rowsPaneEL = jest.fn();
    traceRowConfig.spSystemTrace.rowsPaneEL.scroll = jest.fn(() => true);
    traceRowConfig.spSystemTrace.canvasPanel = jest.fn();
    traceRowConfig.spSystemTrace.refreshFavoriteCanvas = jest.fn(() => true);
    traceRowConfig.spSystemTrace.refreshCanvas = jest.fn(() => true);
    traceRowConfig.resetChartTable();
    expect(traceRowConfig.traceRowList.length).toBe(1);
  });

  it('TraceRowConfig Test06', () => {
    traceRowConfig.refreshNodes(nodes);
    expect(nodes[0].isCheck).toBeTruthy();
  });

  it('TraceRowConfig Test07', () => {
    traceRowConfig.clearSearchAndFlag();
    expect(traceRowConfig.spSystemTrace.hoverFlag ).toBeUndefined();
  });

  it('TraceRowConfig Test08', () => {
    traceRowConfig.expandedNodeList = new Set([1, 2, 3]);
    traceRowConfig.changeNode(1);
    expect(traceRowConfig.expandedNodeList.has(1)).toBeFalsy()
  });

  it('TraceRowConfig Test09', () => {
    traceRowConfig.expandedNodeList = new Set([2, 3]);
    traceRowConfig.changeNode(1);
    expect(traceRowConfig.expandedNodeList.has(1)).toBeTruthy();
  });

  it('TraceRowConfig Test10', () => {
    traceRowConfig.treeNodes = [];
    traceRowConfig.loadTempConfig(JSON.stringify(json));
    expect(traceRowConfig.treeNodes.length).toBe(2);
  });

  it('TraceRowConfig Test11', () => {
    let node = {
      children: [],
      depth: 3,
      id: 6,
      isCheck: false,
      nodeName: "Cpu",
      scene: [],
      parent: {
        id: 8, nodeName: 'Cpu', children: [], depth: 2, isCheck: false,
        scene: []
      },
    }
    traceRowConfig.setParentSelect(node, false);
    expect(node.isCheck).toBeFalsy();
    traceRowConfig.setParentSelect(node, true);
    expect(node.parent.isCheck).toBeTruthy();
  });
});
