/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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

import { z } from 'zod';

export const SpSetTraceFileSchema = { traceFile: z.string() };
export const SpExecuteQuerySchema = { query: z.string() };
export const SpListProcessesSchema = {};
export const SpListTablesSchema = {};
export const SpListTableStructureSchema = { table: z.string() };

export const SpTriageJankSchema = { ipid: z.number().optional() };
export const SpAnalyzeJankDetailSchema = { ipid: z.number(), startTime: z.number().optional(), endTime: z.number().optional() };
export const SpJankCpuContextSchema = { ipid: z.number(), startTime: z.number(), endTime: z.number() };

export const SpTriageMemorySchema = { ipid: z.number().optional() };
export const SpAnalyzeMemoryDetailSchema = { ipid: z.number(), metric: z.string().optional() };
export const SpAnalyzeNativeHookSchema = {
  ipid: z.number(),
  eventType: z.union([z.string(), z.number()]).optional(),
  isStatistic: z.boolean().default(false),
};
export const SpAnalyzeJsHeapSchema = { ipid: z.number() };

export const SpTriageCpuSchema = { cpuId: z.number().optional() };
export const SpAnalyzeSchedLatencySchema = { itid: z.number().optional() };
export const SpAnalyzeThreadStateSchema = { itid: z.number() };

export const SpTriageGpuSchema = { ipid: z.number().optional() };
export const SpTriageIoSchema = { ipid: z.number().optional() };
export const SpTriageNetworkSchema = { ipid: z.number().optional() };
export const SpTriagePowerSchema = { metricName: z.string().optional() };
export const SpTriageHangSchema = { ipid: z.number().optional() };

export const SpShowTimelineSchema = { startTime: z.number().optional(), endTime: z.number().optional(), ipid: z.number().optional() };
export const SpSelectProcessSchema = { ipid: z.number(), processName: z.string().optional() };
export const SpFocusRangeSchema = { startTime: z.number(), endTime: z.number() };
export const SpShowQueryResultSchema = { query: z.string(), title: z.string().optional() };

export const SpGetCurrentTraceSchema = {};

export const SpRegisterSkillSchema = { name: z.string(), description: z.string(), schema: z.record(z.unknown()), sqlTemplate: z.string(), domain: z.string().optional() };
export const SpExecuteSkillSchema = { name: z.string(), params: z.record(z.unknown()).optional() };
export const SpListSkillsSchema = {};
export const SpDeleteSkillSchema = { name: z.string() };

export const SpSearchKnowledgeSchema = { query: z.string(), topK: z.number().optional() };
export const SpUploadKnowledgeSchema = { name: z.string(), content: z.string(), type: z.string() };
export const SpDeleteKnowledgeSchema = { name: z.string() };

export const SpExecuteWorkflowSchema = { name: z.string(), args: z.record(z.unknown()).optional() };
export const SpListWorkflowsSchema = {};
