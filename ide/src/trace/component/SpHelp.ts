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

  get dark(): boolean {
    return this.hasAttribute('dark');
  }

  set dark(dark: boolean) {
    if (dark) {
      this.setAttribute('dark', `${dark}`);
    } else {
      this.removeAttribute('dark');
    }
    this.appContent!.innerHTML =
      '<object type="text/html" data=' +
      `/application/doc/quickstart_device_record.html?${dark} width="100%" height="100%"></object>`;
  }

  initElements(): void {
    let parentElement = this.parentNode as HTMLElement;
    parentElement.style.overflow = 'hidden';
    this.appContent = this.shadowRoot?.querySelector('#app-content') as HTMLElement;
    let mainMenu = this.shadowRoot?.querySelector('#main-menu') as LitMainMenu;
    let header = mainMenu.shadowRoot?.querySelector('.header') as HTMLDivElement;
    let color = mainMenu.shadowRoot?.querySelector('.customColor') as HTMLDivElement;
    let version = mainMenu.shadowRoot?.querySelector('.version') as HTMLDivElement;
    color.style.display = 'none';
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
      this.itemHelpClick(urlParams);
    }
  }

  private itemHelpClick(urlParams: URLSearchParams): void {
    if (urlParams.get('action')!.length > 4) {
      let helpDocIndex = urlParams.get('action')!.substring(5);
      let helpDocDetail = this.getEventDefinitionByIndex(Number(helpDocIndex));
      this.appContent!.innerHTML = `<object type="text/html" data='/application/doc/${helpDocDetail!.name}.html?${
        this.dark
      }' width="100%" height="100%"></object>`;
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
    that.appContent!.innerHTML = `<object type="text/html" data='/application/doc/${docName}.html?${that.dark}' width="100%" height="100%"></object>`;
    this.changeItemURL(index!);
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
        that.handleMemoryMenuItemClick(that, 'trace_streamer_explain', 'des_tables', '26');
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
            width: 90%;
            margin-left: 3%;
            display: grid;
            grid-template-columns: min-content  1fr;
            background-color: var(--dark-background3,#FFFFFF);
            border-radius: 16px 16px 16px 16px;
        }

        .content{
          background: var(--dark-background3,#FFFFFF);
          border-style: none none none solid;
          border-width: 1px;
          border-color: rgba(166,164,164,0.2);
          border-radius: 0px 16px 16px 0px;
          padding: 40px 20px 40px 20px;
          display: flex;
        }

        </style>
        <div class="sp-help-vessel">
         <div class="body">
            <lit-main-menu id="main-menu" class="menugroup" data=''></lit-main-menu>
            <div id="app-content" class="content">
            </div>
         </div>
        </div>
        `;
  }
}
