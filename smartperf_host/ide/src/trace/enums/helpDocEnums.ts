/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
const events = {
  RECORD_EVENT: 'record',
  ONLINE_RECORD_EVENT: 'online_record',
  LOAD_EVENT: 'load',
  JS_MEMORY_EVENT: 'js_memory',
  NATIVE_EVENT: 'native',
  VIRTUAL_MEMORY_EVENT: 'virtual_memory',
  MEMORY_TEMPLATE_EVENT: 'memory_template',
  PERF_EVENT: 'perf',
  ARKTS_EVENT: 'arkts',
  FRAME_RECORD_EVENT: 'frame_record',
  ANIMATION_EVENT: 'animation',
  TASKPOOL_EVENT: 'taskpool',
  APP_STARTUP_EVENT: 'app_startup',
  SCHEDULING_RECORD_EVENT: 'scheduling_record',
  FILE_SYSTEM_EVENT: 'file_system',
  BIO_EVENT: 'bio',
  SQL_EVENT: 'sql',
  HISYS_EVENT: 'hisys',
  SDK_RECORD_EVENT: 'sdk_record',
  IMPORT_SO_EVENT: 'import_so',
  HILOG_EVENT: 'hilog',
  ABILITY_EVENT: 'ability',
  TRACE_PARSING_EVENT: 'trace_parsing',
  OPERATION_SKILLS_EVENT: 'operation_skills',
  KEYWORDS_SHORTCUTS_EVENT: 'keywords_shortcuts',
  XPOWER_EVENT: 'xpower',
  EXTEND_EVENT: 'extensions',
  FFRT_EVENT: 'ffrt',
  LIMIT_EVENT: 'limit',
  TRACE_STREAMER_EXPLAIN_EVENT: 'trace_streamer_explain',
};

export interface EventDefinition {
  event: string;
  name: string;
  index: number;
}

export const eventDefinitions: { [key: string]: EventDefinition } = {
  quickstart_device_record: {
    event: events.RECORD_EVENT,
    name: 'quickstart_device_record',
    index: 1,
  },
  quickstart_web_record: {
    event: events.ONLINE_RECORD_EVENT,
    name: 'quickstart_web_record',
    index: 2,
  },
  quickstart_systemtrace: {
    event: events.LOAD_EVENT,
    name: 'quickstart_systemtrace',
    index: 3,
  },
  quickstart_Js_memory: {
    event: events.JS_MEMORY_EVENT,
    name: 'quickstart_Js_memory',
    index: 4,
  },
  quickstart_native_memory: {
    event: events.NATIVE_EVENT,
    name: 'quickstart_native_memory',
    index: 5,
  },
  quickstart_page_fault: {
    event: events.VIRTUAL_MEMORY_EVENT,
    name: 'quickstart_page_fault',
    index: 6,
  },
  quickstart_memory_template: {
    event: events.MEMORY_TEMPLATE_EVENT,
    name: 'quickstart_memory_template',
    index: 7,
  },
  quickstart_hiperf: {
    event: events.PERF_EVENT,
    name: 'quickstart_hiperf',
    index: 8,
  },
  quickstart_arkts: {
    event: events.ARKTS_EVENT,
    name: 'quickstart_arkts',
    index: 9,
  },
  quickstart_Frametimeline: {
    event: events.FRAME_RECORD_EVENT,
    name: 'quickstart_Frametimeline',
    index: 10,
  },
  quickstart_animation: {
    event: events.ANIMATION_EVENT,
    name: 'quickstart_animation',
    index: 11,
  },
  quickstart_taskpool: {
    event: events.TASKPOOL_EVENT,
    name: 'quickstart_taskpool',
    index: 12,
  },
  quickstart_app_startup: {
    event: events.APP_STARTUP_EVENT,
    name: 'quickstart_app_startup',
    index: 13,
  },
  quickstart_schedulinganalysis: {
    event: events.SCHEDULING_RECORD_EVENT,
    name: 'quickstart_schedulinganalysis',
    index: 14,
  },
  quickstart_filesystem: {
    event: events.FILE_SYSTEM_EVENT,
    name: 'quickstart_filesystem',
    index: 15,
  },
  quickstart_bio: {
    event: events.BIO_EVENT,
    name: 'quickstart_bio',
    index: 16,
  },
  quickstart_sql_metrics: {
    event: events.SQL_EVENT,
    name: 'quickstart_sql_metrics',
    index: 17,
  },
  quickstart_hisystemevent: {
    event: events.HISYS_EVENT,
    name: 'quickstart_hisystemevent',
    index: 18,
  },
  quickstart_sdk: {
    event: events.SDK_RECORD_EVENT,
    name: 'quickstart_sdk',
    index: 19,
  },
  quickstart_Import_so: {
    event: events.IMPORT_SO_EVENT,
    name: 'quickstart_Import_so',
    index: 20,
  },
  quickstart_hilog: {
    event: events.HILOG_EVENT,
    name: 'quickstart_hilog',
    index: 21,
  },
  quickstart_ability_monitor: {
    event: events.ABILITY_EVENT,
    name: 'quickstart_ability_monitor',
    index: 22,
  },
  quickstart_parsing_ability: {
    event: events.TRACE_PARSING_EVENT,
    name: 'quickstart_parsing_ability',
    index: 23,
  },
  quickstart_Application_operation_skills: {
    event: events.OPERATION_SKILLS_EVENT,
    name: 'quickstart_Application_operation_skills',
    index: 24,
  },
  quickstart_keywords_shortcuts: {
    event: events.KEYWORDS_SHORTCUTS_EVENT,
    name: 'quickstart_keywords_shortcuts',
    index: 25,
  },
  quickstart_xpower: {
    event: events.XPOWER_EVENT,
    name: 'quickstart_xpower',
    index: 26,
  },
  quickstart_extensions: {
    event: events.EXTEND_EVENT,
    name: 'quickstart_extensions',
    index: 27,
  },
  quickstart_ffrt: {
    event: events.FFRT_EVENT,
    name: 'quickstart_ffrt',
    index: 28,
  },
  quickstart_limit: {
    event: events.LIMIT_EVENT,
    name: 'quickstart_limit',
    index: 29,
  },
  des_tables: {
    event: events.TRACE_STREAMER_EXPLAIN_EVENT,
    name: 'des_tables',
    index: 30,
  },
};
