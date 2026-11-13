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

import { BaseElement, element } from '../../../base-ui/BaseElement';
import LitSwitch, { LitSwitchChangeEvent } from '../../../base-ui/switch/lit-switch';
import { HiperfPluginConfig, ProfilerPluginConfig, TracePluginConfig, NativePluginConfig } from './bean/ProfilerServiceTypes';
import { SpRecordTemplateHtml } from './SpRecordTemplate.html';
import { Cmd } from '../../../command/Cmd';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';

@element('sp-record-template')
export class SpRecordTemplate extends BaseElement {
  static SCHEDULING_ANALYSIS_EVENT = [
    'sched/sched_wakeup',
    'sched/sched_switch',
    'sched/sched_wakeup_new',
    'sched/sched_waking',
    'sched/sched_process_exit',
    'sched/sched_process_free',
    'task/task_newtask',
    'task/task_rename',
    'power/cpu_frequency',
    'power/cpu_idle',
    'irq/irq_handler_entry',
    'irq/irq_handler_exit',
    'irq/softirq_entry',
    'irq/softirq_exit',
    'irq/softirq_raise',
  ];
  static FRAME_TIMELINE_EVENTS = [
    'sched/sched_switch',
    'sched/sched_wakeup',
    'sched/sched_wakeup_new',
    'sched/sched_waking',
    'sched/sched_process_exit',
    'sched/sched_process_free',
    'sched/sched_process_free',
    'task/task_rename',
    'power/cpu_frequency',
    'power/cpu_idle',
    'power/suspend_resume',
  ];
  static FRAME_TIMELINE_CATEGORIES_EVENT = [
    'ability',
    'ace',
    'app',
    'ark',
    'binder',
    'disk',
    'freq',
    'graphic',
    'idle',
    'irq',
    'memreclaim',
    'mmc',
    'multimodalinput',
    'ohos',
    'pagecache',
    'rpc',
    'sched',
    'sync',
    'window',
    'workq',
    'zaudio',
    'zcamera',
    'zimage',
    'zmedia',
  ];
  static HIPERF_DEFAULT_RECORD_ARGS =
    '-f 1000 -a  --cpu-limit 100 -e hw-cpu-cycles,sched:sched_waking' +
    ' --call-stack dwarf --clockid monotonic --offcpu -m 256';
  static HIPERF_NAPI_RECORD_ARGS_BEFORE = '';  
  static HIPERF_NAPI_RECORD_ARGS_APP = '-f 1000 --app';  
  static HIPERF_NAPI_RECORD_ARGS_PID = '-f 1000 -p';
  static HIPERF_NAPI_RECORD_ARGS_AFTER = '--cpu-limit 100 -e hw-cpu-cycles --call-stack dwarf --clockid monotonic -m 256';
  private frameTimeline: LitSwitch | undefined | null;
  private schedulingAnalysis: LitSwitch | undefined | null;
  private appStartup: LitSwitch | undefined | null;
  private taskPoolEl: LitSwitch | undefined | null;
  private dynamicEffectEl: LitSwitch | undefined | null;
  private packageName: LitSelectV | null | undefined;
  private napiEl: LitSwitch | undefined | null;
  private isNum:boolean = false;

  initElements(): void {
    this.frameTimeline = this.shadowRoot?.querySelector<LitSwitch>('#frame_timeline');
    this.schedulingAnalysis = this.shadowRoot?.querySelector<LitSwitch>('#scheduling_analysis');
    this.appStartup = this.shadowRoot?.querySelector<LitSwitch>('#app_startup');
    this.taskPoolEl = this.shadowRoot?.querySelector<LitSwitch>('#task_pool');
    this.dynamicEffectEl = this.shadowRoot?.querySelector<LitSwitch>('#dynamic_effect');
    this.napiEl = this.shadowRoot?.querySelector<LitSwitch>('#Napi');
    this.packageName = this.shadowRoot?.getElementById('napi_packageName') as LitSelectV;
    this.addProbeListener(
      this.frameTimeline!,
      this.schedulingAnalysis!,
      this.appStartup!,
      this.taskPoolEl!,
      this.dynamicEffectEl!
    );
    this.initNapiSwitchOption();
  }

  addProbeListener(...elements: HTMLElement[]): void {
    elements.forEach((element) => {
      element.addEventListener('change', (event: CustomEventInit<LitSwitchChangeEvent>) => {
        let detail = event.detail;
        if (detail!.checked) {
          this.dispatchEvent(new CustomEvent('addProbe', { detail: { elementId: element.getAttribute('name') } }));
        } else {
          this.dispatchEvent(new CustomEvent('delProbe', { detail: { elementId: element.getAttribute('name') } }));
        }
      });
    });
  }

  getTemplateConfig(): Array<ProfilerPluginConfig<{}>> {
    let config: Array<ProfilerPluginConfig<{}>> = [];
    let traceEventSet: string[] = [];
    let hiTraceCategories: string[] = [];
    let useFtracePlugin: boolean = false;
    if (this.frameTimeline?.checked || this.appStartup?.checked || this.dynamicEffectEl?.checked) {
      useFtracePlugin = true;
      SpRecordTemplate.FRAME_TIMELINE_CATEGORIES_EVENT.forEach((categories) => {
        if (hiTraceCategories.indexOf(categories) === -1) {
          hiTraceCategories.push(categories);
        }
      });
      if (this.appStartup?.checked) {
        hiTraceCategories.push('musl');
        config.push(this.createHiperfDefaultConfig(true));
      }
      SpRecordTemplate.FRAME_TIMELINE_EVENTS.forEach((ev) => {
        if (traceEventSet.indexOf(ev) === -1) {
          traceEventSet.push(ev);
        }
      });
    }
    if (this.napiEl?.checked && this.packageName?.value!) {
      useFtracePlugin = true;
      hiTraceCategories.push('ace');
      if (!this.appStartup?.checked) {
        config.push(this.createHiperfDefaultConfig(false));
      }
      config.push(this.createNativeConfig());
    }
    useFtracePlugin = this.schedulingAnalysisConfig(useFtracePlugin, traceEventSet);
    useFtracePlugin = this.taskPoolElConfig(useFtracePlugin, hiTraceCategories);
    if (useFtracePlugin) {
      let tracePluginConfig: TracePluginConfig = {
        ftraceEvents: traceEventSet,
        hitraceCategories: hiTraceCategories,
        flushIntervalMs: 1000,
        hitraceApps: [],
        bufferSizeKb: 20480,
        debugOn: false,
        flushThresholdKb: 4096,
        clock: 'boot',
        tracePeriodMs: 200,
        parseKsyms: true,
        rawDataPrefix: '',
        traceDurationMs: 0,
      };
      let htraceProfilerPluginConfig: ProfilerPluginConfig<TracePluginConfig> = {
        pluginName: 'ftrace-plugin',
        sampleInterval: 1000,
        configData: tracePluginConfig,
      };
      config.push(htraceProfilerPluginConfig);
    }
    return config;
  }

  private schedulingAnalysisConfig(useFtracePlugin: boolean, traceEventSet: string[]): boolean {
    if (this.schedulingAnalysis?.checked) {
      useFtracePlugin = true;
      SpRecordTemplate.SCHEDULING_ANALYSIS_EVENT.forEach((event) => {
        if (traceEventSet.indexOf(event) < 0) {
          traceEventSet.push(event);
        }
      });
    }
    return useFtracePlugin;
  }

  private taskPoolElConfig(useFtracePlugin: boolean, hitraceCategories: string[]): boolean {
    if (this.taskPoolEl!.checked) {
      useFtracePlugin = true;
      hitraceCategories.push('commonlibrary');
    }
    return useFtracePlugin;
  }

  private createHiperfDefaultConfig(isAll: boolean): ProfilerPluginConfig<HiperfPluginConfig> {
    let newVal = this.getDesiredString(this.packageName?.value!);
    SpRecordTemplate.HIPERF_NAPI_RECORD_ARGS_BEFORE = this.isNum ? SpRecordTemplate.HIPERF_NAPI_RECORD_ARGS_PID : SpRecordTemplate.HIPERF_NAPI_RECORD_ARGS_APP;
    let hiPerf: HiperfPluginConfig = {
      isRoot: false,
      outfileName: '/data/local/tmp/perf.data',
      recordArgs: isAll ? SpRecordTemplate.HIPERF_DEFAULT_RECORD_ARGS : `${SpRecordTemplate.HIPERF_NAPI_RECORD_ARGS_BEFORE} ${newVal} ${SpRecordTemplate.HIPERF_NAPI_RECORD_ARGS_AFTER}`,
    };
    return {
      pluginName: 'hiperf-plugin',
      sampleInterval: 5000,
      configData: hiPerf,
    };
  }

  private getDesiredString(str: string): string {
    if (/^\d+$/.test(str)) {
        this.isNum = true;
        return str;
    }
    if (str.includes(',')) {
        this.isNum = /^\d+$/.test(str.split(',')[0]) ? true : false;
        return str.split(',')[0];
    }
    this.isNum = false;
    return str;
}

private initNapiSwitchOption(): void {
  let litSwitch = this.shadowRoot?.querySelector('#Napi') as LitSwitch;
  let packageInput = this.packageName!.shadowRoot?.querySelector('input') as HTMLInputElement;
  this.packageName!.setAttribute('disabled', '');
  litSwitch.addEventListener('change', (event: Event): void => {
    // @ts-ignore
    let detail = event.detail;
    if (detail.checked) {
      this.packageName!.removeAttribute('disabled');
      packageInput.addEventListener('mousedown', (): void => {
        packageInput.readOnly = false;
        this.packageMouseDownHandler();
      });
    } else {
      packageInput.readOnly = true;
      this.packageName!.setAttribute('disabled', '');
      return;
    }
  });
}

private packageMouseDownHandler(): void {
  this.packageName!.dataSource([], '');
  Cmd.getPackage().then((packageList: string[]): void => {
    let finalDataList = packageList.map(str => str.replace(/\t/g, ''));
    if (finalDataList.length > 0) {
      this.packageName!.dataSource(finalDataList, '', true);
    } else {
      this.packageName!.dataSource([], '');
    }
  }).catch(error => {
    console.error('Error fetching package list:', error);
    this.packageName!.dataSource([], '');
  });
}

private createNativeConfig(): ProfilerPluginConfig<NativePluginConfig> {
  let newVal = this.getDesiredString(this.packageName?.value!);
  let native: NativePluginConfig = {
    pid: undefined,
    process_name: undefined,
    save_file: false,
    smb_pages: 16384,
    max_stack_depth: 20,
    string_compressed: true,
    fp_unwind: false,
    blocked: true,
    callframe_compress: true,
    record_accurately: true,
    offline_symbolization: true,
    startup_mode: false,
    js_stack_report: 2,
    max_js_stack_depth: 5,
    filter_napi_name: 'info',
    memtrace_enable: true,
    malloc_disable: true,
    mmap_disable: true,
  };
  if (this.isNum === true) {
    native.pid = Number(newVal); 
    delete native.process_name;
  } else {
    native.process_name = newVal; 
    delete native.pid;
  }

  return {
    pluginName: 'nativehook',
    sampleInterval: 5000,
    configData: native,
    is_protobuf_serialize: false
  };
}

  initHtml(): string {
    return SpRecordTemplateHtml;
  }
}
