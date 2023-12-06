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

import { BaseElement, element } from '../../../../base-ui/BaseElement';
import '../../../../base-ui/checkbox/LitCheckBox';
import { LitCheckBox } from '../../../../base-ui/checkbox/LitCheckBox';
import { TraceRow } from './TraceRow';
import { SpSystemTrace } from '../../SpSystemTrace';
import { LitSearch } from '../search/Search';
import { TraceSheet } from './TraceSheet';
import { CpuStruct } from '../../../database/ui-worker/ProcedureWorkerCPU';
import { type BaseStruct } from '../../../bean/BaseStruct';
import { LitIcon } from '../../../../base-ui/icon/LitIcon';

@element('trace-row-config')
export class TraceRowConfig extends BaseElement {
  static allTraceRowList: Array<TraceRow<BaseStruct>> = [];
  private selectTypeList: Array<string> | undefined = [];
  private subsystemSelectList: Array<SceneNode> | undefined = [];
  private spSystemTrace: SpSystemTrace | null | undefined;
  private sceneTable: HTMLDivElement | null | undefined;
  private chartTable: HTMLDivElement | null | undefined;
  private inputElement: HTMLInputElement | null | undefined;
  private configTitle: HTMLDivElement | null | undefined;
  private traceRowList: NodeListOf<TraceRow<BaseStruct>> | undefined;
  private exportFileIcon: LitIcon | null | undefined;
  private openTempFile: HTMLInputElement | null | undefined;
  private treeNodes: SubsystemNode[] = [];
  private expandedNodeList: Set<number> = new Set();
  private tempString: string | null = null;
  private subSystemSearch: string | undefined;
  private backTemp: LitIcon | null | undefined;
  private backTableHTML: string | undefined;
  private otherRowNames: Array<SceneNode> = [];
  private sceneList = [
    'FrameTimeline',
    'TaskPool',
    'AnimationEffect',
    'AppStartup',
    'HiSysEvent',
    'EnergyEvent',
    'Memory',
    'ProcessMemory',
    'ArkTs',
    'NativeMemory',
    'HiPerf',
    'HiEBpf',
  ];

  static get observedAttributes(): string[] {
    return ['mode'];
  }

  init(): void {
    this.selectTypeList = [];
    this.subsystemSelectList = [];
    this.otherRowNames = [];
    this.inputElement!.value = '';
    this.spSystemTrace = this.parentElement!.querySelector<SpSystemTrace>('sp-system-trace');
    this.traceRowList =
      this.spSystemTrace!.shadowRoot?.querySelector('div[class=rows-pane]')!.querySelectorAll<TraceRow<BaseStruct>>(
        "trace-row[row-parent-id='']"
      );
    TraceRowConfig.allTraceRowList.push(...this.traceRowList!);
    this.refreshAllConfig(true, true);
  }

  private refreshAllConfig(
    isRefreshTopTable: boolean = false,
    isRefreshBottomTable: boolean = false,
    isSubSysConfig: boolean = false
  ): void{
    let allowSceneList: Array<string> = [];
    this.selectTypeList = [];
    let topPanel = new DocumentFragment();
    let bottomPanel = new DocumentFragment();
    this.traceRowList!.forEach((traceRow: TraceRow<BaseStruct>) => {
      traceRow.setAttribute('scene', '');
      this.otherRowNames.push({
        nodeName: traceRow.name,
        scene: [...traceRow.templateType]
      });
      if (isRefreshTopTable) {
        this.sceneTable!.innerHTML = '';
        if (traceRow.templateType.size > 0) {
          traceRow.templateType.forEach((type) => {
            if (this.sceneList.indexOf(type) >= 0 && allowSceneList.indexOf(type) < 0) {
              allowSceneList.push(type);
              this.initConfigSceneTable(type, topPanel);
            }
          });
        }
      }
      if (isRefreshBottomTable) {
        if (isSubSysConfig) {
          this.backTableHTML = '';
          this.chartTable!.innerHTML = '';
        } else {
          this.removeAttribute('temp_config');
          this.backTableHTML = this.chartTable!.innerHTML;
          this.chartTable!.innerHTML = '';
          this.initConfigChartTable(traceRow, bottomPanel);
        }
      }
    });
    this.sceneTable?.appendChild(topPanel);
    this.chartTable?.appendChild(bottomPanel);
  }

  initConfigSceneTable(item: string, topPanel: DocumentFragment): void {
    let spliceIndex = 1;
    let div = document.createElement('div');
    div.className = 'scene-option-div';
    div.textContent = item;
    let optionCheckBox: LitCheckBox = new LitCheckBox();
    optionCheckBox.checked = false;
    optionCheckBox.style.justifySelf = 'center';
    optionCheckBox.style.height = '100%';
    optionCheckBox.title = item;
    optionCheckBox.addEventListener('change', () => {
      this.clearLines(optionCheckBox.title);
      if (optionCheckBox.checked) {
        this.selectTypeList!.push(item);
      } else {
        if (this.selectTypeList!.length > 0) {
          let indexNum = this.selectTypeList!.indexOf(item);
          this.selectTypeList!.splice(indexNum, spliceIndex);
        }
      }
      this.resetChartOption();
      this.resetChartTable();
    });
    let htmlDivElement = document.createElement('div');
    htmlDivElement.style.display = 'grid';
    htmlDivElement.style.gridTemplateColumns = '1fr 1fr';
    htmlDivElement.appendChild(div);
    htmlDivElement.appendChild(optionCheckBox);
    topPanel.appendChild(htmlDivElement);
  }

  clearLines(type: string): void {
    if (type === 'FrameTimeline' || type === 'AppStartup') {
      this.spSystemTrace?.removeLinkLinesByBusinessType('janks');
    } else if (type === 'Task Pool') {
      this.spSystemTrace?.removeLinkLinesByBusinessType('task');
    }
  }

  initConfigChartTable(row: TraceRow<BaseStruct>, bottomPanel: DocumentFragment): void {
    let templateType = '';
    if (row.templateType.size > 0) {
      templateType = [...row.templateType].reduce((pre, cur) => `${pre}:${cur}`);
    }
    let div = document.createElement('div');
    div.className = 'chart-option-div chart-item';
    div.textContent = row.name;
    div.title = row.name;
    div.setAttribute('search_text', row.name);
    let optionCheckBox: LitCheckBox = new LitCheckBox();
    optionCheckBox.checked = true;
    optionCheckBox.className = 'chart-config-check chart-item';
    optionCheckBox.style.height = '100%';
    optionCheckBox.style.justifySelf = 'center';
    optionCheckBox.title = templateType;
    optionCheckBox.setAttribute('search_text', row.name);
    optionCheckBox.addEventListener('change', () => {
      if (row.folder) {
        TraceRowConfig.allTraceRowList.forEach((chartRow): void => {
          let upParentRow = chartRow;
          while (upParentRow.hasParentRowEl) {
            if (!upParentRow.parentRowEl) {
              break;
            }
            upParentRow = upParentRow.parentRowEl;
          }
          if (upParentRow === row) {
            if (optionCheckBox.checked) {
              chartRow.rowHidden = false;
              chartRow.setAttribute('scene', '');
            } else {
              row.expansion = true;
              chartRow.removeAttribute('scene');
              chartRow.rowHidden = true;
            }
          }
        });
      }
      if (optionCheckBox.checked) {
        row.rowHidden = false;
        row.setAttribute('scene', '');
      } else {
        row.removeAttribute('scene');
        row.rowHidden = true;
      }
      this.refreshSystemPanel();
    });
    bottomPanel.append(...[div, optionCheckBox]);
  }

  resetChartOption(): void {
    this.shadowRoot!.querySelectorAll<LitCheckBox>('.chart-item').forEach((litCheckBox: LitCheckBox) => {
      let isShowCheck: boolean = false;
      if (this.selectTypeList!.length === 0) {
        isShowCheck = true;
      } else {
        if (litCheckBox.title !== '') {
          let divTemplateTypeList = litCheckBox.title.split(':');
          for (let index = 0; index < divTemplateTypeList.length; index++) {
            let type = divTemplateTypeList[index];
            if (this.selectTypeList!.indexOf(type) >= 0) {
              isShowCheck = true;
              break;
            }
          }
        }
      }
      litCheckBox.checked = isShowCheck;
    });
  }

  resetChartTable(): void {
    if (this.traceRowList && this.traceRowList.length > 0) {
      this.traceRowList.forEach((traceRow: TraceRow<BaseStruct>) => {
        let isShowRow: boolean = false;
        if (this.selectTypeList!.length === 0) {
          traceRow.rowHidden = false;
          traceRow.setAttribute('scene', '');
          this.refreshChildRow(traceRow.childrenList, true);
        } else {
          let templateTypeList = [...traceRow.templateType];
          isShowRow = templateTypeList.some(type => this.selectTypeList!.includes(type));
          traceRow.expansion = false;
          if (isShowRow) {
            if (traceRow.templateType.size > 0) {
              traceRow.rowHidden = false;
              traceRow.setAttribute('scene', '');
              if (traceRow.childrenList && traceRow.childrenList.length > 0) {
                this.refreshChildRow(traceRow.childrenList, isShowRow);
              }
            }
          } else {
            traceRow.removeAttribute('scene');
            traceRow.rowHidden = true;
            this.refreshChildRow(traceRow.childrenList);
          }
        }
      });
      this.spSystemTrace?.collectRows.forEach((favoriteRow) => {
        let isShowRow: boolean = false;
        if (this.selectTypeList!.length === 0) {
          favoriteRow.rowHidden = false;
          favoriteRow.setAttribute('scene', '');
        } else {
          if (favoriteRow.parentRowEl) {
            favoriteRow.parentRowEl.expansion = false;
            let favoriteList = [...favoriteRow.parentRowEl!.templateType];
            isShowRow = favoriteList.some(type => this.selectTypeList!.includes(type));
          } else {
            let typeList = [...favoriteRow.templateType];
            isShowRow = typeList.some(type => this.selectTypeList!.includes(type));
          }
          if (isShowRow) {
            favoriteRow.rowHidden = false;
            favoriteRow.setAttribute('scene', '');
          } else {
            favoriteRow.removeAttribute('scene');
            favoriteRow.rowHidden = true;
          }
        }
      });
      if(this.hasAttribute('temp_config')) {
        // 按照this.selectTypeList 更新treeNodes
        this.refreshNodes(this.treeNodes);
        this.refreshTable();
      }
    }
    this.refreshSystemPanel();
  }

  refreshNodes(nodes: SubsystemNode[]): void {
    if(this.selectTypeList?.length !== 0) {
      for (let index = 0; index < nodes.length; index++) {
        let item = nodes[index];
        let exists = false;
        item.scene?.forEach(sceneItem => {
          if (this.selectTypeList!.some(elem => elem === sceneItem)) {
            exists = true;
            return;
          }
        });
        if(exists) {
          item.isCheck = true;
        } else {
          item.isCheck = false;
        }
        this.refreshNodes(item.children);
      }
    } else {
      for (let index = 0; index < nodes.length; index++) {
        let item = nodes[index];
        item.isCheck = true;
        this.refreshNodes(item.children);
      }
    }
  }


  refreshChildRow(childRows: Array<TraceRow<BaseStruct>>, isShowScene: boolean = false): void {
    childRows.forEach((row) => {
      if (isShowScene) {
        row.setAttribute('scene', '');
        if (row.childrenList && row.childrenList.length > 0) {
          this.refreshChildRow(row.childrenList, isShowScene);
        }
        row.expansion = false;
      } else {
        row.removeAttribute('scene');
        row.rowHidden = true;
        if (row.childrenList && row.childrenList.length > 0) {
          this.refreshChildRow(row.childrenList);
        }
      }
    });
  }

  refreshSystemPanel(): void {
    this.clearSearchAndFlag();
    this.spSystemTrace!.rowsPaneEL!.scroll({
      top: 0 - this.spSystemTrace!.canvasPanel!.offsetHeight,
      left: 0,
      behavior: 'smooth',
    });
    this.spSystemTrace!.refreshFavoriteCanvas();
    this.spSystemTrace!.refreshCanvas(true);
  }

  clearSearchAndFlag(): void {
    let traceSheet = this.spSystemTrace!.shadowRoot?.querySelector('.trace-sheet') as TraceSheet;
    if (traceSheet) {
      traceSheet!.setAttribute('mode', 'hidden');
    }
    let search = document.querySelector('sp-application')!.shadowRoot?.querySelector('#lit-search') as LitSearch;
    if (search) {
      search.clear();
    }
    let highlightRow = this.spSystemTrace!.shadowRoot?.querySelector<TraceRow<BaseStruct>>('trace-row[highlight]');
    if (highlightRow) {
      highlightRow.highlight = false;
    }
    this.spSystemTrace!.timerShaftEL?.removeTriangle('inverted');
    CpuStruct.wakeupBean = undefined;
    this.spSystemTrace!.hoverFlag = undefined;
    this.spSystemTrace!.selectFlag = undefined;
  }

  initElements(): void {
    this.sceneTable = this.shadowRoot!.querySelector<HTMLDivElement>('#scene-select');
    this.chartTable = this.shadowRoot!.querySelector<HTMLDivElement>('#chart-select');
    this.inputElement = this.shadowRoot!.querySelector('input');
    this.backTemp = this.shadowRoot?.querySelector<LitIcon>('#back-temp');
    this.openTempFile = this.shadowRoot?.querySelector<HTMLInputElement>('#open-temp-file');
    this.exportFileIcon = this.shadowRoot?.querySelector<LitIcon>('#export-file-icon');
    let loadTemp = this.shadowRoot?.querySelector<LitIcon>('#custom-temp');
    let openFileIcon = this.shadowRoot?.querySelector<LitIcon>('#open-file-icon');
    this.configTitle = this.shadowRoot?.querySelector<HTMLDivElement>('#config_title');
    let jsonUrl = `https://${window.location.host.split(':')[0]}:${window.
      location.port}/application/trace/config/customTempConfig.json`;
    loadTemp!.addEventListener('click', () => {
      fetch(jsonUrl).then((res) => {
        if (res.ok) {
          res.text().then((text) => {
            this.tempString = text;
            this.loadTempConfig();
          });
        }
      })['catch']((err) => {
        console.log(err);
      });
    });
    openFileIcon!.addEventListener('click', () => {
      this.openTempFile!.value = '';
      this.openTempFile?.click();
    });
  }

  private filterFilterSearch(): void {
    this.shadowRoot!.querySelectorAll<HTMLElement>('.temp-chart-item').forEach((subSystemOption: HTMLElement) => {
      this.subSystemSearch = subSystemOption.getAttribute('search_text') || '';
      if (this.subSystemSearch!.indexOf(this.inputElement!.value) < 0) {
        subSystemOption.style.display = 'none';
      } else {
        subSystemOption.style.display = 'grid';
      }
    });
  }

  connectedCallback(): void {
    this.inputElement?.addEventListener('keyup', () => {
      this.shadowRoot!.querySelectorAll<HTMLElement>('.chart-item').forEach((elementOption: HTMLElement) => {
        let searchText = elementOption.getAttribute('search_text') || '';
        if (searchText!.indexOf(this.inputElement!.value) < 0) {
          elementOption.style.display = 'none';
        } else {
          elementOption.style.display = 'block';
        }
      });
      this.filterFilterSearch();
    });
    this.backTemp!.addEventListener('click', () => {
      this.init();
      this.resetChartTable();
      this.backTemp!.style.display = 'none';
      this.exportFileIcon!.style.display = 'none';
      this.configTitle!.innerHTML = 'Timeline Details';
    });
    this.openTempFile!.addEventListener('change', (event) => {
      let that = this;
      let fileList = (event.target as HTMLInputElement).files;
      if (fileList && fileList.length > 0) {
        let file = fileList[0];
        if (file) {
          let reader = new FileReader();
          reader.onload = (): void => {
            that.tempString = reader.result as string;
            that.loadTempConfig();
          };
          reader.readAsText(file);
        }
      }
    });
    this.exportFileIcon!.addEventListener('click', () => {
      this.exportConfig();
    });
  }

  exportConfig(): void {
    let a = document.createElement('a');
    let encoder = new TextEncoder();
    let tempBuffer = encoder.encode(this.tempString!);
    a.href = URL.createObjectURL(new Blob([tempBuffer]));
    a.download = 'customTempConfig';
    a.click();
    window.URL.revokeObjectURL(a.href);
  }

  loadTempConfig(): void {
    this.selectTypeList = [];
    this.subsystemSelectList = [];
    this.otherRowNames = [];
    this.refreshAllConfig(true, true);
    this.resetChartTable();
    this.inputElement!.value = '';
    this.backTableHTML = this.chartTable?.innerHTML;
    let configJson;
    try {
      configJson = JSON.parse(this.tempString!);
      this.configTitle!.innerHTML = 'SubSystem Template';
      let subsystemsKey: string = 'subsystems';
      if(!configJson[subsystemsKey]) {
        this.exportFileIcon!.style.display = 'none';
        this.backTemp!.style.display = 'none';
        this.configTitle!.innerHTML = 'Timeline Details';
        return;
      }
    } catch (e) {
      this.exportFileIcon!.style.display = 'none';
      this.backTemp!.style.display = 'none';
      this.configTitle!.innerHTML = 'Timeline Details';
      return;
    }
    this.exportFileIcon!.style.display = 'block';
    this.backTemp!.style.display = 'block';
    let id = 0;
    this.treeNodes = this.buildSubSystemTreeData(id, configJson);
    this.buildTempOtherList(id);
    this.setAttribute('temp_config', '');
    this.subsystemSelectList = [];
    this.expandedNodeList.clear();
    this.refreshTable();
  }

  private buildSubSystemTreeData(id: number, configJson: any): SubsystemNode[] {
    let subsystemsKey: string = 'subsystems';
    let keys = Object.keys(configJson);
    let subSystems: SubsystemNode[] = [];
    if (keys.indexOf(subsystemsKey) >= 0) {
      let subsystemsData = configJson[subsystemsKey];
      for (let subIndex = 0; subIndex < subsystemsData.length; subIndex++) {
        let currentSystemData = subsystemsData[subIndex];
        let currentSubName = currentSystemData.subsystem;
        id++;
        let subsystemStruct: SubsystemNode = {
          id: id,
          nodeName: currentSubName,
          children: [],
          depth: 1,
          isCheck: true
        };
        if (subSystems.indexOf(subsystemStruct) < 0) {
          let currentCompDates = currentSystemData.components;
          for (let compIndex = 0; compIndex < currentCompDates.length; compIndex++) {
            let currentCompDate = currentCompDates[compIndex];
            let currentCompName = currentCompDate.component;
            let currentChartDates = currentCompDate.charts;
            id++;
            let componentStruct: SubsystemNode = {
              id: id,
              parent: subsystemStruct,
              nodeName: currentCompName,
              children: [],
              depth: 2,
              isCheck: true
            };
            for (let chartIndex = 0; chartIndex < currentChartDates.length; chartIndex++) {
              let currentChartDate = currentChartDates[chartIndex];
              let currentChartName = currentChartDate.chartName;
              let currentChartId = currentChartDate.chartId;
              let findChartNames: Array<string> | undefined = [];
              let scene: string[] = [];
              if (this.traceRowList) {
                for (let index = 0; index < this.traceRowList.length; index++) {
                  let item = this.traceRowList[index];
                  let chartId = '';
                  let name = item.name;
                  let pattern = / (\d+)$/;
                  let match = item.name.match(pattern);
                  if (match) {
                    chartId = match[0].trim();
                    name = item.name.split(match[0])[0];
                    if (name !== 'Cpu') {
                      if (name.toLowerCase().endsWith(currentChartName.toLowerCase()) || currentChartId === chartId) {
                        scene.push(...item.templateType);
                        findChartNames.push(item.name);
                      }
                    } else {
                      if (name.toLowerCase().endsWith(currentChartName.toLowerCase())) {
                        scene.push(...item.templateType);
                        findChartNames.push(item.name);
                      }
                    }
                  } else {
                    if (item.name.toLowerCase().endsWith(currentChartName.toLowerCase())) {
                      scene.push(...item.templateType);
                      findChartNames.push(item.name);
                    }
                  }
                }
              }
              findChartNames.forEach(currentChartName => {
                id++;
                let chartStruct: SubsystemNode = {
                  id: id,
                  parent: componentStruct,
                  nodeName: currentChartName,
                  children: [],
                  depth: 3,
                  isCheck: true,
                  scene: scene
                };
                if (componentStruct.children.indexOf(chartStruct) < 0) {
                  let rowNumber = this.otherRowNames.findIndex(row => row.nodeName === chartStruct.nodeName);
                  if (rowNumber >= 0) {
                    this.otherRowNames.splice(rowNumber, 1);
                  }
                  componentStruct.children.push(chartStruct);
                }
              });
            }
            if (subsystemStruct.children.indexOf(componentStruct) < 0) {
              subsystemStruct.children.push(componentStruct);
            }
          }
          subSystems.push(subsystemStruct);
        }
      }
    }
    return subSystems;
  }

  refreshTable(): void {
    this.chartTable!.innerHTML = '';
    this.subsystemSelectList = [];
    for (let index = 0; index < this.treeNodes.length; index++) {
      this.buildSubsystem(this.treeNodes[index]);
    }
    this.filterFilterSearch();
  }

  buildSubsystem(subsystemNode: SubsystemNode): void {
    let subsystemDiv = document.createElement('div');
    subsystemDiv.className = 'layout temp-chart-item';
    subsystemDiv.title = subsystemNode.nodeName!;
    subsystemDiv.setAttribute('search_text', subsystemNode.nodeName!);
    if (subsystemNode.scene) {
      subsystemDiv.title = subsystemNode.scene.toString();
    }
    if (subsystemNode.depth !== 3) {
      let container = document.createElement('div');
      container.style.display = 'flex';
      container.style.marginLeft = `${subsystemNode.depth * 25}px`;
      container.style.alignItems = 'center';
      let expandIcon = document.createElement('lit-icon') as LitIcon;
      expandIcon.name = 'caret-down';
      expandIcon.className = 'expand-icon';
      if (this.expandedNodeList.has(subsystemNode.id)) {
        expandIcon.setAttribute('expansion', '');
      } else {
        expandIcon.removeAttribute('expansion');
      }
      expandIcon.addEventListener('click', () => {
        this.changeNode(subsystemNode.id);
        this.refreshTable();
      });
      let componentDiv = document.createElement('div');
      componentDiv.className = 'subsystem-div';
      componentDiv.textContent = subsystemNode.nodeName!;
      container.appendChild(expandIcon);
      container.appendChild(componentDiv);
      subsystemDiv.appendChild(container);
    } else {
      let chartDiv = document.createElement('div');
      chartDiv.className = 'chart-option';
      chartDiv.textContent = subsystemNode.nodeName!;
      subsystemDiv.appendChild(chartDiv);
    }
    let configCheckBox: LitCheckBox = new LitCheckBox();
    configCheckBox.className = 'scene-check-box temp-chart-item';
    configCheckBox.setAttribute('search_text', subsystemNode.nodeName!);
    if(subsystemNode.scene) {
      configCheckBox.title = subsystemNode.scene.toString();
    }
    configCheckBox.checked = subsystemNode.isCheck!;
    configCheckBox.addEventListener('change', () => {
      this.spSystemTrace?.removeLinkLinesByBusinessType('janks');
      this.spSystemTrace?.removeLinkLinesByBusinessType('task');
      this.setChildIsSelect(subsystemNode, configCheckBox);
      this.setParentSelect(subsystemNode, configCheckBox.checked);
      this.refreshTable();
      if (subsystemNode.depth === 3) {
        this.traceRowList?.forEach((row) => {
          if (row.name === subsystemNode.nodeName) {
            if (configCheckBox.checked) {
              row.setAttribute('scene', '');
              row.removeAttribute('row-hidden');
            } else {
              row.expansion = false;
              row.removeAttribute('scene');
              row.setAttribute('row-hidden', '');
            }
          }
        });
        if (configCheckBox.checked) {
          this.subsystemSelectList?.push({
            nodeName: subsystemNode.nodeName!,
            scene: Array(configCheckBox.title)
          });
        } else {
          let chartNumber = this.subsystemSelectList?.findIndex(row => row.nodeName === subsystemNode.nodeName!);
          if (chartNumber !== undefined && chartNumber !== null) {
            this.subsystemSelectList?.splice(chartNumber, 1);
          }
        }
      }
      this.refreshSystemPanel();
    });
    subsystemDiv.appendChild(configCheckBox);
    this.chartTable?.appendChild(subsystemDiv);
    if (subsystemNode.children && this.expandedNodeList.has(subsystemNode.id)) {
      subsystemNode.children.forEach(item => {
        this.buildSubsystem(item);
      });
    }
  }

  private buildTempOtherList(id: number): void {
    let otherRootNode: SubsystemNode = {
      children: [], depth: 1, id: id, nodeName: 'other', isCheck: true
    };
    for (let index = 0; index < this.otherRowNames!.length; index++) {
      otherRootNode.children.push({
        children: [],
        depth: 3,
        id: id++,
        nodeName: this.otherRowNames![index].nodeName,
        isCheck: true,
        parent: otherRootNode,
        scene: this.otherRowNames![index].scene
      });
    }
    this.treeNodes.push(otherRootNode);
  }

  private setChildIsSelect(node: SubsystemNode, configCheckBox: LitCheckBox): void {
    node.isCheck = configCheckBox.checked;
    if (node.children.length > 0) {
      node.children.forEach(childItem => {
        if (childItem.depth === 3) {
          if (configCheckBox.checked) {
            this.subsystemSelectList?.push({
              nodeName: childItem.nodeName!,
              scene: Array(configCheckBox.title)
            });
          } else {
            let chartNumber = this.subsystemSelectList?.findIndex(row => row.nodeName === node.nodeName!);
            if (chartNumber !== undefined && chartNumber !== null) {
              this.subsystemSelectList?.splice(chartNumber, 1);
            }
          }
          this.traceRowList?.forEach((item) => {
            if (item.name === childItem.nodeName) {
              if (configCheckBox.checked) {
                item.setAttribute('scene', '');
                item.removeAttribute('row-hidden');
              } else {
                item.expansion = false;
                item.removeAttribute('scene');
                item.setAttribute('row-hidden', '');
              }
            }
          });
        }
        this.setChildIsSelect(childItem, configCheckBox);
      });
    }
  }

  private setParentSelect(node: SubsystemNode, isSelect: boolean): void {
    if (!isSelect && node.parent) {
      node.parent.isCheck = isSelect;
      if (node.parent.parent) {
        node.parent.parent.isCheck = isSelect;
      }
    }
  }

  private changeNode(currentNode: number): void {
    if (this.expandedNodeList.has(currentNode)) {
      this.expandedNodeList['delete'](currentNode);
    } else {
      this.expandedNodeList.add(currentNode);
    }
    this.refreshTable();
  }

  initHtml(): string {
    return `
            <style>
                :host([hidden]) {
                    visibility: hidden;
                }
                :host{
                    visibility: visible;
                    background-color: #F6F6F6;
                    cursor: auto;
                }
                .config-title {
                    height: 100px;
                    border-top: 1px solid #D5D5D5;
                    background-color: #0A59F7;
                    display: flex;
                    align-items: center;
                    padding: 0 20px;
                }
                .title-text {
                    font-family: Helvetica-Bold;
                    font-size: 16px;
                    color: #FFFFFF;
                    text-align: left;
                    font-weight: 700;
                    margin-right: auto;
                }
                .config-close {
                    text-align: right;
                    cursor: pointer;
                    opacity: 1;
                }
                .config-close:hover {
                    opacity: 0.7;
                }
                .title_div{
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  padding-left: 15px;
                  padding-right: 20px;
                  background-color: #F6F6F6;
                  height: 3.4em;
                  flex-wrap: wrap;
                }
                .config-scene-select {
                  height: auto;
                  max-height: 120px;
                  overflow-y: auto;
                  background: #FFFFFF;
                  overflow-x: hidden;
                  border-radius: 5px;
                  border: solid 1px #e0e0e0;
                }
                :host([temp_config]) .config-chart-select {
                  height: auto;
                  overflow-y: auto;
                  display: block;
                  padding: 0px;
                }
                .config-chart-select {
                  display: grid;
                  height: inherit;
                  padding: 10px 30px;
                  background: #FFFFFF;
                  overflow-y: scroll; 
                  overflow-x: hidden;
                  border-radius: 5px;
                  border: solid 1px #e0e0e0;
                  grid-template-columns: auto auto;
                  grid-template-rows: repeat(auto-fit, 35px);
                }
                .config-img {
                    margin-right: 12px;
                } 
                .chart-option-div {
                    height: 35px;
                    line-height: 35px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .scene-option-div {
                    height: 35px;
                    line-height: 35px;
                    margin-left: 28px;
                }
                .subsystem-div {
                    height: 35px;
                    line-height: 35px;
                    margin-left: 10px;
                }
                .chart-option {
                    height: 35px;
                    line-height: 35px;
                    margin-left: 75px;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
                input{
                    border: 0;
                    outline: none;
                    background-color: transparent;
                    cursor: pointer;
                    -webkit-user-select:none;
                    -moz-user-select:none;
                    user-select:none;
                    display: inline-flex;
                    width:100%;
                    color: rgba(0,0,0,0.6);
                }
                .multipleSelect{
                    outline: none;
                    font-size: 1rem;
                    -webkit-user-select:none;
                    -moz-user-select:none;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.3s;
                    user-select:none;
                    width: max-content;
                    color: #ffffff;
                    cursor: pointer;
                    line-height: 40px;
                    text-align: center;
                    border:1px solid #dcdcdc;
                    border-radius:16px;
                    background-color: #FFFFFF;
                    height: 30px;
                }
                .expand-icon:not([expansion]) {
                    transform: rotateZ(-90deg);
                }
                .layout {
                  display: grid; 
                  grid-template-columns: 1fr 1fr;
                }
                .scene-check-box {
                  justify-self: center; 
                  height: 100%;
                }
                .temp-icon {
                  margin-left: 20px;
                  width: 20px;
                }
            </style>
            <div class="config-title">
               <span class="title-text">Display Template</span>
               <lit-icon class="config-close" name="close" title="Config Close" size="20">
               </lit-icon>
            </div>
            <div class="config-scene" style="display: contents;">
                <div class="title_div">
                  <img class="config-img" title="Template Select" src="img/config_scene.png">
                  <div>Template Select</div>
                </div>
            </div>
            <div class="config-select config-scene-select" id="scene-select"></div>
            <div class="config-chart" style="display: contents;">
                 <div class="title_div" style='justify-content: space-between;'>
                    <div style='display: flex;'>
                      <img class="config-img" title="Timeline Details" src="img/config_chart.png">
                      <div id="config_title">Timeline Details</div> 
                    </div>
                    <div style='display: flex;'>
                      <div class="multipleSelect" tabindex="0">
                          <div class="multipleRoot" id="select" style="width:100%">
                              <input id="singleInput"/> 
                          </div>
                          <lit-icon class="icon" name='search' color="#c3c3c3" style="margin-right: 10px;"></lit-icon>
                      </div>
                      <div style='display: flex;align-items: center;'>
                          <lit-icon id="back-temp" class="temp-icon" title="restore configuration" style="display: none;" 
                          name="restore"  size="30"></lit-icon>
                          <lit-icon id="custom-temp" class="temp-icon" title="Load json" name="load-file" size="30"></lit-icon>
                          <lit-icon id="open-file-icon" class="temp-icon" style="margin-left: 20px;" name="open-file"
                          title="open json file" size="30"></lit-icon>
                          <input id="open-temp-file" style="display:none;pointer-events: none;" type="file"/>
                          <lit-icon id="export-file-icon" class="temp-icon" title="export json" style="margin-left: 20px;
                          display: none;" size="30" name="download-file"></lit-icon>
                      </div>
                    </div>
                </div>
            </div>
            <div class="config-select config-chart-select" id="chart-select">
            </div>
`;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'mode' && newValue === '') {
      this.init();
    }
  };
}

export interface SubsystemNode {
  id: number;
  parent?: SubsystemNode;
  nodeName: string | undefined | null;
  children: SubsystemNode[];
  depth: number;
  isCheck?: boolean;
  scene?: string[];
}

export interface SceneNode {
  nodeName: string | undefined | null;
  scene?: string[];
}
