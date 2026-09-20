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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TraceEngine } from './traceEngine';
import { BrowserBridge, EXTENSION_PORT } from './browserBridge';
import { registerTraceTools } from './tools/traceTools';
import { registerJankTools } from './tools/jankTools';
import { registerMemoryTools } from './tools/memoryTools';
import { registerCpuTools } from './tools/cpuTools';
import { registerExtendedTriageTools } from './tools/extendedTriageTools';
import { registerUiTools } from './tools/uiTools';
import { registerSkillTools } from './tools/skillTools';
import { registerWorkflowTools } from './tools/workflowTools';
import { registerKnowledgeTools } from './tools/knowledgeTools';

const server = new McpServer({
  name: 'smartperf-host',
  version: '1.1.0',
});

const engine = new TraceEngine(
  process.env.TRACE_FILE || '',
  process.env.TRACE_STREAMER_PATH,
);

const bridge = new BrowserBridge({
  port: parseInt(process.env.SP_AGENT_EXT_PORT || String(EXTENSION_PORT), 10),
  autoConnect: false,
});

bridge.on('connected', () => {
  console.error('[sp-agent] Connected to extension service');
});

bridge.on('disconnected', () => {
  console.error('[sp-agent] Disconnected from extension service');
});

bridge.on('error', (err: unknown) => {
  console.error('[sp-agent] Extension service error:', err instanceof Error ? err.message : String(err));
});

registerTraceTools(server, engine);
registerJankTools(server, engine);
registerMemoryTools(server, engine);
registerCpuTools(server, engine);
registerExtendedTriageTools(server, engine);
registerUiTools(server, bridge, engine);
registerSkillTools(server, engine);
registerWorkflowTools(server, engine);
registerKnowledgeTools(server);

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error('[sp-agent] MCP Server started');
  if (process.env.TRACE_FILE) {
    console.error(`[sp-agent] Default trace file: ${process.env.TRACE_FILE}`);
  }
}).catch((err: unknown) => {
  console.error('[sp-agent] Failed to start:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

process.on('SIGINT', () => {
  engine.closeDb();
  bridge.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  engine.closeDb();
  bridge.disconnect();
  process.exit(0);
});
