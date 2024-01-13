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
import { LitMainMenu, MenuItem } from '../../base-ui/menu/LitMainMenu';
import { LitMainMenuItem } from '../../base-ui/menu/LitMainMenuItem';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';

@element('sp-help')
export class SpHelp extends BaseElement {
  private appContent: HTMLElement | undefined | null;

  get dark() {
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
    let that = this;
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
    this.setupMainMenu(mainMenu, that);
    mainMenu.style.width = '330px';
    let body = mainMenu.shadowRoot?.querySelector('.menu-body') as HTMLDivElement;
    let groups = body.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
    groups.forEach((value) => {
      let items = value.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
      items.forEach((item) => {
        item.style.width = '330px';
      });
      if (value.title == 'TraceStreamer') {
        let items = value.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
        items.forEach((i) => {
          if (i.title != 'TraceStreamer数据库说明') {
            i.style.display = 'none';
          }
        });
      }
      if (value.title == 'SmartPerf') {
        value.style.display = 'none';
      }
    });
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
        children: [
          this.setupSmartPerfMenu(that),
        ],
      },
    ];
  }

  private setupCaptureAndImportMenu(that: this) {
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
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'record', 'quickstart_device_record');
          },
        },
        {
          title: 'web端抓取trace说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'online_record', 'quickstart_web_record');
          },
        },
        {
          title: 'web端加载trace说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'load', 'quickstart_systemtrace');
          },
        },
      ],
    };
  }

  private setupOtherMenu(that: this) {
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
      this.createSubMenuItem('Sql分析和Metrics说明', 'sql', 'quickstart_sql_metrics', that),
      this.createSubMenuItem('HiSystemEvent抓取和展示说明', 'hisys', 'quickstart_hisystemevent', that),
      this.createSubMenuItem('sdk抓取和展示说明', 'sdk_record', 'quickstart_sdk', that),
      this.createSubMenuItem('调用栈可视化和不同库函数调用占比说明', 'import_so', 'quickstart_Import_so', that),
      this.createSubMenuItem('Hilog抓取和展示说明', 'hilog', 'quickstart_hilog', that),
      this.createSubMenuItem('Ability Monitor抓取和展示说明', 'ability', 'quickstart_ability_monitor', that),
      this.createSubMenuItem('Trace解析能力增强', 'trace_parsing', 'quickstart_parsing_ability', that),
      this.createSubMenuItem('应用操作技巧', 'operation_skills', 'quickstart_Application_operation_skills', that),
      this.createSubMenuItem('快捷键说明', 'keywords_shortcuts', 'quickstart_keywords_shortcuts', that),
    ];
  }

  private createSubMenuItem(title: string, event: string, docName: string, that: this): MenuItem {
    return {
      title: title,
      icon: '',
      clickHandler: (item: MenuItem) => {
        that.handleMemoryMenuItemClick(that, event, docName);
      },
    };
  }


  private setupMemoryMenu(that: this) {
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
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'js_memory', 'quickstart_Js_memory');
          },
        },
        {
          title: 'Native Memory抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'native', 'quickstart_native_memory');
          },
        },
        {
          title: '页内存抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'virtual_memory', 'quickstart_page_fault');
          },
        },
        {
          title: '系统内存抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'memory_template', 'quickstart_memory_template');
          },
        },
      ],
    };
  }

  private handleMemoryMenuItemClick(that: this, event: string, docName: string): void {
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: event,
      action: 'help_doc',
    });
    that.appContent!.innerHTML =
      `<object type="text/html" data='/application/doc/${docName}.html?${that.dark}' width="100%" height="100%"></object>`;
  }

  private setupNativeMenu(that: this) {
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
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'perf', 'quickstart_hiperf');
          },
        },
      ],
    }
  }

  private setupTsMenu(that: this) {
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
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'arkts', 'quickstart_arkts');
          },
        },
      ],
    }
  }

  private setupAnalysisTemplateMenu(that: this) {
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
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'frame_record', 'quickstart_Frametimeline');
          },
        },
        {
          title: 'Animation的抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'animation', 'quickstart_animation');
          },
        },
        {
          title: 'TaskPool抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'taskpool', 'quickstart_taskpool');
          },
        },
        {
          title: 'App startup的抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'app_startup', 'quickstart_app_startup');
          },
        },
        {
          title: 'Scheduling analysis抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'scheduling_record', 'quickstart_schedulinganalysis');
          },
        },
      ],
    }
  }

  private setupFileMenu(that: this) {
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
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'file_system', 'quickstart_filesystem');
          },
        },
        {
          title: 'Bio抓取和展示说明',
          icon: '',
          clickHandler: function (item: MenuItem) {
            that.handleMemoryMenuItemClick(that, 'bio', 'quickstart_bio');
          },
        },
      ],
    }
  }

  private setupDatabaseMenu(that: this) {
    return {
      title: 'TraceStreamer数据库说明',
      icon: '',
      clickHandler: function (item: MenuItem) {
        that.handleMemoryMenuItemClick(that, 'trace_streamer_explain', 'des_tables');
      },
    };
  }

  private setupCompileMenu(that: this) {
    return {
      title: '编译Trace_streamer',
      icon: '',
      clickHandler: function (item: MenuItem) {
        that.handleMemoryMenuItemClick(that, 'trace_streamer_compile', 'compile_trace_streamer');
      },
    };
  }

  private setupAnalysisMenu(that: this) {
    return {
      title: 'TraceStreamer 解析数据状态表',
      icon: '',
      clickHandler: function (item: MenuItem) {
        that.handleMemoryMenuItemClick(that, 'trace_streamer_des', 'des_stat');
      },
    };
  }

  private setupSmartPerfMenu(that: this) {
    return {
      title: 'SmartPerf 编译指导',
      icon: '',
      clickHandler: function (item: MenuItem) {
        that.handleMemoryMenuItemClick(that, 'smartperf_guide', 'quickstart_smartperflinux_compile_guide');
      },
    };
  }

  private setupEventListMenu(that: this) {
    return {
      title: 'TraceStreamer支持解析事件列表',
      icon: '',
      clickHandler: function (item: MenuItem) {
        that.handleMemoryMenuItemClick(that, 'support_event', 'des_support_event');
      },
    }
  }

  private setupToolDescriptionMenu(that: this) {
    return {
      title: 'trace_streamer工具说明',
      icon: '',
      clickHandler: function (item: MenuItem) {
        that.handleMemoryMenuItemClick(that, 'quickstart_trace_streamer', 'quickstart_trace_streamer');
      },
    };
  }

  private setupBinderMenu(that: this) {
    return {
      title: 'binder事件上下文如何关联',
      icon: '',
      clickHandler: function (item: MenuItem) {
        that.handleMemoryMenuItemClick(that, 'binder', 'des_binder');
      },
    };
  }

  private setupWakeUpMenu(that: this) {
    return {
      title: 'wakeup唤醒说明',
      icon: '',
      clickHandler: function (item: MenuItem) {
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
            margin-top: 2%;
            margin-bottom: 2%;
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
