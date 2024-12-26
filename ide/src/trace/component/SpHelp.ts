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
import { LitMainMenuGroup } from '../../base-ui/menu/LitMainMenuGroup';
import { LitMainMenu, MenuGroup, MenuItem } from '../../base-ui/menu/LitMainMenu';
import { LitMainMenuItem } from '../../base-ui/menu/LitMainMenuItem';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { EventDefinition, eventDefinitions } from '../enums/helpDocEnums';

@element('sp-help')
export class SpHelp extends BaseElement {
  private appContent: HTMLElement | undefined | null;
  private helpFile: HTMLElement | undefined | null;
  private navbarContainer: HTMLElement | undefined | null;
  private backToTop: HTMLElement | undefined | null;

  get dark(): boolean {
    return this.hasAttribute('dark');
  }

  set dark(dark: boolean) {
    if (dark) {
      this.setAttribute('dark', `${dark}`);
    } else {
      this.removeAttribute('dark');
    }
    this.helpFile!.innerHTML =
      '<object type="text/html" data=' +
      `/application/doc/quickstart_device_record.html?${dark} width="100%" height="100%"></object>`;
    this.navbarInit('quickstart_device_record');
  }

  initElements(): void {
    let parentElement = this.parentNode as HTMLElement;
    parentElement.style.overflow = 'hidden';
    this.appContent = this.shadowRoot?.querySelector('#app-content') as HTMLElement;
    this.helpFile = this.shadowRoot?.querySelector('#help-file') as HTMLElement;
    this.navbarContainer = this.shadowRoot?.querySelector('#navbar-container') as HTMLElement;
    this.backToTop = this.shadowRoot?.querySelector('.back') as HTMLElement;
    let mainMenu = this.shadowRoot?.querySelector('#main-menu') as LitMainMenu;
    let header = mainMenu.shadowRoot?.querySelector('.header') as HTMLDivElement;
    let color = mainMenu.shadowRoot?.querySelector('.customColor') as HTMLDivElement;
    let analysis = mainMenu.shadowRoot?.querySelector('.ai_analysis') as HTMLDivElement;
    let version = mainMenu.shadowRoot?.querySelector('.version') as HTMLDivElement;
    color.style.display = 'none';
    analysis.style.display = 'none';
    header.style.display = 'none';
    version.style.display = 'none';
    this.setupMainMenu(mainMenu, this);
    mainMenu.style.width = '330px';
    let body = mainMenu.shadowRoot?.querySelector('.menu-body') as HTMLDivElement;
    let groups = body.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
    groups.forEach((value) => {
      let items = value.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
      items.forEach((item) => {
        item.style.width = '330px';
      });
      if (value.title === 'TraceStreamer') {
        let items = value.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
        items.forEach((i) => {
          if (i.title !== 'TraceStreamer数据库说明') {
            i.style.display = 'none';
          }
        });
      }
      if (value.title === 'SmartPerf') {
        value.style.display = 'none';
      }
    });
    let urlParams = new URL(window.location.href).searchParams;
    if (urlParams && urlParams.get('action') && urlParams.get('action')!.length > 4) {
      this.itemHelpClick(urlParams, this);
    }
  }

  private itemHelpClick(urlParams: URLSearchParams, that: this): void {
    if (urlParams.get('action')!.length > 4) {
      let helpDocIndex = urlParams.get('action')!.substring(5);
      let helpDocDetail = this.getEventDefinitionByIndex(Number(helpDocIndex));
      that.helpFile!.innerHTML = `<object type="text/html" data='/application/doc/${helpDocDetail!.name}.html?${that.dark
        }' width="100%" height="100%"></object>`;

      this.navbarInit(helpDocDetail!.name);
    }
  }

  private getEventDefinitionByIndex(index: number): EventDefinition | null {
    for (let key in eventDefinitions) {
      if (eventDefinitions[key].index === index) {
        return eventDefinitions[key];
      }
    }
    return null;
  }

  private setupMainMenu(mainMenu: LitMainMenu, that: this): void {
    mainMenu.menus = [
      {
        collapsed: false,
        title: 'QuickStart',
        second: false,
        icon: 'caret-down',
        describe: '',
        children: [
          this.setupCaptureAndImportMenu(that),
          this.setupMemoryMenu(that),
          this.setupNativeMenu(that),
          this.setupTsMenu(that),
          this.setupAnalysisTemplateMenu(that),
          this.setupFileMenu(that),
          this.setupOtherMenu(that),
        ],
      },
      {
        collapsed: false,
        title: 'TraceStreamer',
        second: false,
        icon: 'caret-down',
        describe: '',
        children: [
          this.setupDatabaseMenu(that),
          this.setupCompileMenu(that),
          this.setupAnalysisMenu(that),
          this.setupEventListMenu(that),
          this.setupToolDescriptionMenu(that),
          this.setupBinderMenu(that),
          this.setupWakeUpMenu(that),
        ],
      },
      {
        collapsed: false,
        title: 'SmartPerf',
        second: false,
        icon: 'caret-down',
        describe: '',
        children: [this.setupSmartPerfMenu(that)],
      },
    ];
  }

  private setupCaptureAndImportMenu(that: this): MenuGroup {
    return {
      collapsed: false,
      title: '抓取和导入',
      describe: '',
      second: true,
      icon: 'caret-down',
      children: [
        {
          title: '设备端抓取trace说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'record', 'quickstart_device_record', '1');
          },
        },
        {
          title: 'web端抓取trace说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'online_record', 'quickstart_web_record', '2');
          },
        },
        {
          title: 'web端加载trace说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'load', 'quickstart_systemtrace', '3');
          },
        },
      ],
    };
  }

  private setupOtherMenu(that: this): MenuGroup {
    return {
      collapsed: false,
      title: '其他',
      describe: '',
      icon: 'caret-down',
      second: true,
      children: this.setupOtherMenuItems(that),
    };
  }
  private setupOtherMenuItems(that: this): MenuItem[] {
    return [
      this.createSubMenuItem('Sql分析和Metrics说明', 'sql', 'quickstart_sql_metrics', that, '17'),
      this.createSubMenuItem('HiSystemEvent抓取和展示说明', 'hisys', 'quickstart_hisystemevent', that, '18'),
      this.createSubMenuItem('sdk抓取和展示说明', 'sdk_record', 'quickstart_sdk', that, '19'),
      this.createSubMenuItem('调用栈可视化和不同库函数调用占比说明', 'import_so', 'quickstart_Import_so', that, '20'),
      this.createSubMenuItem('Hilog抓取和展示说明', 'hilog', 'quickstart_hilog', that, '21'),
      this.createSubMenuItem('Ability Monitor抓取和展示说明', 'ability', 'quickstart_ability_monitor', that, '22'),
      this.createSubMenuItem('Trace解析能力增强', 'trace_parsing', 'quickstart_parsing_ability', that, '23'),
      this.createSubMenuItem('应用操作技巧', 'operation_skills', 'quickstart_Application_operation_skills', that, '24'),
      this.createSubMenuItem('快捷键说明', 'keywords_shortcuts', 'quickstart_keywords_shortcuts', that, '25'),
      this.createSubMenuItem('Xpower抓取和展示说明', 'xpower', 'quickstart_xpower', that, '26'),
      this.createSubMenuItem('扩展程序安装指导', 'extensions', 'quickstart_extensions', that, '27'),
      this.createSubMenuItem('FFRT抓取和展示说明', 'ffrt', 'quickstart_ffrt', that, '28'),
    ];
  }

  private createSubMenuItem(title: string, event: string, docName: string, that: this, index: string): MenuItem {
    return {
      title: title,
      icon: '',
      clickHandler: (item: MenuItem): void => {
        that.handleMemoryMenuItemClick(that, event, docName, index);
      },
    };
  }

  private setupMemoryMenu(that: this): MenuGroup {
    return {
      collapsed: false,
      title: '内存',
      describe: '',
      icon: 'caret-down',
      second: true,
      children: [
        {
          title: 'Js Memory抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'js_memory', 'quickstart_Js_memory', '4');
          },
        },
        {
          title: 'Native Memory抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'native', 'quickstart_native_memory', '5');
          },
        },
        {
          title: '页内存抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'virtual_memory', 'quickstart_page_fault', '6');
          },
        },
        {
          title: '系统内存抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'memory_template', 'quickstart_memory_template', '7');
          },
        },
      ],
    };
  }

  private handleMemoryMenuItemClick(that: this, event: string, docName: string, index?: string): void {
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: event,
      action: 'help_doc',
    });
    that.helpFile!.innerHTML = `<object type="text/html" data='/application/doc/${docName}.html?${that.dark}' width="100%" height="100%"></object>`;
    this.navbarInit(docName);
    this.changeItemURL(index!);
  }

  private navbarInit(docName: string): void {
    fetch(`/application/doc/${docName}.html`)
      .then(response => response.text())
      .then(htmlString => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const hTags = Array.from(doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((header) => ({
          id: header.id,
          text: header.textContent!.trim()
        }));
        this.navbarContainer!.innerHTML = `<ul id="nav-links">${hTags.map(hTag => {
          let backData: string = '';
          if (hTag.id) {
            backData = `<li class="tooltip"><a id="${hTag.id}" data-full-text="${hTag.text}">${hTag.text}</a><span class="tooltiptext" id="tooltip-${hTag.id}">${hTag.text}</span>
          </li>`;
          }
          return backData;
        }).join('')
          }</ul>`;

        let navLinks = this.navbarContainer!.querySelectorAll('#nav-links a');
        navLinks.forEach((navLink) => {
          navLink.addEventListener('click', (e) => {
            let lis = this.navbarContainer!.querySelectorAll('#nav-links li');
            lis.forEach(li => li.classList.remove('active'));
            navLink.closest('li')!.classList.add('active');
            let targetId = navLink.id;
            e.preventDefault();
            this.helpFile!.innerHTML = `<object type="text/html" data='/application/doc/${docName}.html?dark=${this.dark}&targetId=${targetId}' width="100%" height="100%"></object>`;
          });
        });

        this.backToTop!.querySelector('#back-to-top')!.addEventListener('click', (e) => {
          e.preventDefault();
          navLinks.forEach((navLink) => {
            navLink.closest('li')?.classList.remove('active');
          });
          this.helpFile!.innerHTML = `<object type="text/html" data='/application/doc/${docName}.html?dark=${this.dark}' width="100%" height="100%"></object>`;
        });

      })
      .catch(error => {
        console.error('Error fetching and modifying HTML:', error);
      });
  }

  private changeItemURL(index: string): void {
    let url = new URL(window.location.href);
    let actionParam = url.searchParams.get('action');
    let newActionValue = `help_${index}`;
    if (actionParam) {
      url.searchParams.set('action', newActionValue);
      let newURL = url.href;
      history.pushState({}, '', newURL);
    } else {
      history.pushState({}, '', window.location.origin + window.location.pathname);
    }
  }

  private setupNativeMenu(that: this): MenuGroup {
    return {
      collapsed: false,
      title: 'Native栈',
      describe: '',
      second: true,
      icon: 'caret-down',
      children: [
        {
          title: 'HiPerf的抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'perf', 'quickstart_hiperf', '8');
          },
        },
      ],
    };
  }

  private setupTsMenu(that: this): MenuGroup {
    return {
      collapsed: false,
      title: 'TS栈',
      describe: '',
      second: true,
      icon: 'caret-down',
      children: [
        {
          title: 'Cpuprofiler抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'arkts', 'quickstart_arkts', '9');
          },
        },
      ],
    };
  }

  private setupAnalysisTemplateMenu(that: this): MenuGroup {
    return {
      collapsed: false,
      title: '分析模板',
      describe: '',
      second: true,
      icon: 'caret-down',
      children: [
        {
          title: 'Frame timeline抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'frame_record', 'quickstart_Frametimeline', '10');
          },
        },
        {
          title: 'Animation的抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'animation', 'quickstart_animation', '11');
          },
        },
        {
          title: 'TaskPool抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'taskpool', 'quickstart_taskpool', '12');
          },
        },
        {
          title: 'App startup的抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'app_startup', 'quickstart_app_startup', '13');
          },
        },
        {
          title: 'Scheduling analysis抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'scheduling_record', 'quickstart_schedulinganalysis', '14');
          },
        },
      ],
    };
  }

  private setupFileMenu(that: this): MenuGroup {
    return {
      collapsed: false,
      title: '文件',
      describe: '',
      second: true,
      icon: 'caret-down',
      children: [
        {
          title: 'FileSystem抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'file_system', 'quickstart_filesystem', '15');
          },
        },
        {
          title: 'Bio抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem): void {
            that.handleMemoryMenuItemClick(that, 'bio', 'quickstart_bio', '16');
          },
        },
      ],
    };
  }

  private setupDatabaseMenu(that: this): MenuItem {
    return {
      title: 'TraceStreamer数据库说明',
      icon: '',
      clickHandler: function (item: MenuItem): void {
        that.handleMemoryMenuItemClick(that, 'trace_streamer_explain', 'des_tables', '29');
      },
    };
  }

  private setupCompileMenu(that: this): MenuItem {
    return {
      title: '编译Trace_streamer',
      icon: '',
      clickHandler: function (item: MenuItem): void {
        that.handleMemoryMenuItemClick(that, 'trace_streamer_compile', 'compile_trace_streamer');
      },
    };
  }

  private setupAnalysisMenu(that: this): MenuItem {
    return {
      title: 'TraceStreamer 解析数据状态表',
      icon: '',
      clickHandler: function (item: MenuItem): void {
        that.handleMemoryMenuItemClick(that, 'trace_streamer_des', 'des_stat');
      },
    };
  }

  private setupSmartPerfMenu(that: this): MenuItem {
    return {
      title: 'SmartPerf 编译指导',
      icon: '',
      clickHandler: function (item: MenuItem): void {
        that.handleMemoryMenuItemClick(that, 'smartperf_guide', 'quickstart_smartperflinux_compile_guide');
      },
    };
  }

  private setupEventListMenu(that: this): MenuItem {
    return {
      title: 'TraceStreamer支持解析事件列表',
      icon: '',
      clickHandler: function (item: MenuItem): void {
        that.handleMemoryMenuItemClick(that, 'support_event', 'des_support_event');
      },
    };
  }

  private setupToolDescriptionMenu(that: this): MenuItem {
    return {
      title: 'trace_streamer工具说明',
      icon: '',
      clickHandler: function (item: MenuItem): void {
        that.handleMemoryMenuItemClick(that, 'quickstart_trace_streamer', 'quickstart_trace_streamer');
      },
    };
  }

  private setupBinderMenu(that: this): MenuItem {
    return {
      title: 'binder事件上下文如何关联',
      icon: '',
      clickHandler: function (item: MenuItem): void {
        that.handleMemoryMenuItemClick(that, 'binder', 'des_binder');
      },
    };
  }

  private setupWakeUpMenu(that: this): MenuItem {
    return {
      title: 'wakeup唤醒说明',
      icon: '',
      clickHandler: function (item: MenuItem): void {
        that.handleMemoryMenuItemClick(that, 'wakeup', 'des_wakup');
      },
    };
  }

  initHtml(): string {
    return `
        <style>
        .sp-help-vessel {
            min-height: 100%;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows:1fr;
            background-color: var(--dark-background5,#F6F6F6);
        }
        :host{
            width: 100%;
            display: block;
            height: 100%;
            background-color: var(--dark-background5,#F6F6F6);
        }
        .body{
            width: 99%;
            margin-left: 15px;
            display: grid;
            grid-template-columns: min-content  1fr;
            border-radius: 16px 16px 16px 16px;
        }

        .content{
          border-style: none none none solid;
          border-width: 1px;
          border-color: rgba(166,164,164,0.2);
          border-radius: 0px 16px 16px 0px;
          padding-left:15px;
          display: flex;
          overflow-y: hidden;
          box-sizing: border-box;
        }
        #navbar-container { 
          border-left: 5px solid #ecb829;
        }
        #navbar-container ul {  
          list-style-type: none; 
          width:100%;
          margin: 0;  
          padding: 0;
        } 
        #navbar-container ul li { 
          position: relative;
          width:100%;
          height:30px;
          line-height:30px; 
          text-align: left;
          padding: 0 10px;
          box-sizing: border-box;
          border: none; 
          margin: 0;
        } 
        #navbar-container ul li a {  
          width:100%;
          height:100%;
          color: black;
          font-family: Helvetica;
          font-size: 14px;
          text-decoration: none;  
          display: block; 
          padding: 0;  
          border: none;
          white-space: nowrap; 
          overflow: hidden;
          text-overflow: ellipsis;
        }  
        #navbar-container ul li:hover,  
        #navbar-container ul li:focus {  
          color: #ecb829;
          cursor: pointer;
        } 
        #navbar-container ul li:hover a,  
        #navbar-container ul li:focus a {
          color: #ecb829;
        }
        #navbar-container ul li .tooltiptext { 
          position: absolute;   
          bottom: 0;
          left: 50%; 
          transform: translateX(-50%);
          visibility: hidden;  
          width: 100%; 
          background-color: #ecb829;  
          color: #fff;
          font-family: Helvetica;
          font-size: 14px;  
          text-align: center; 
          border-radius: 6px;  
          padding: 5px 5px; 
          margin-left:5px; 
          position: absolute;  
          z-index: 1;  
          opacity: 0;  
          transition: opacity 0.3s;  
          margin-bottom: 40px; 
          &::after {  
              content: '';  
              position: absolute;  
              bottom: -10px;
              left: 50%; 
              margin-left: -10px; 
              width: 0;  
              height: 0; 
              border-style: solid;  
              border-width: 10px 10px 0 10px; 
              border-color: #ecb829 transparent transparent transparent; 
            }  
         } 
         #navbar-container ul li.tooltip:hover .tooltiptext {  
          visibility: visible;  
          opacity: 1;  
         }   
         #navbar-container ul li.active, #navbar-container ul li.active a {  
          color: #ecb829;  
         }

        </style>
        <div class="sp-help-vessel">
         <div class="body">
            <lit-main-menu id="main-menu" class="menugroup" data=''></lit-main-menu>
            <div id="app-content" class="content">
               <div id="help-file" style="width:100%;overflow-y: hidden;"></div>
                      <nav id="navbar-container" style="position:fixed;top:80px;left:79%;width:18%;"></nav>
                      <div class="back" style="position:fixed;top:80px;left:98%;width:2%;">
                          <lit-icon id="back-to-top" name="vertical-align-top" style="font-weight: bold;cursor: pointer;" size="20">
                          </lit-icon>
                      </div>
               </div>
            </div>
         </div>
        </div>
        `;
  }
}
