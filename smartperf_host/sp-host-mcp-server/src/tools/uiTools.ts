import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrowserBridge } from '../browserBridge';
import { TraceEngine } from '../traceEngine';
import { SpShowTimelineSchema, SpSelectProcessSchema, SpFocusRangeSchema, SpShowQueryResultSchema, SpGetCurrentTraceSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';

const UI_CMD = {
  SHOW_TIMELINE: 1,
  SELECT_PROCESS: 2,
  FOCUS_RANGE: 3,
  SHOW_QUERY_RESULT: 4,
};

function notConnectedResult(): { content: Array<{ type: 'text'; text: string }>; isError?: boolean } {
  return { content: [{ type: 'text', text: 'Extension service not connected. UI operations require the extension service and browser to be running. Start the extension service first, then retry.' }], isError: true };
}

export function registerUiTools(server: McpServer, bridge: BrowserBridge, engine: TraceEngine): void {
  server.tool('sp-show-timeline', SpToolDescriptions.spShowTimeline, SpShowTimelineSchema, async (args) => {
    if (!bridge.isConnected()) return notConnectedResult();
    const { sent, result } = await bridge.sendUiCommand(UI_CMD.SHOW_TIMELINE, {
      startTime: args.startTime,
      endTime: args.endTime,
      ipid: args.ipid,
    });
    if (!sent) return { content: [{ type: 'text', text: 'Failed to send command.' }], isError: true };
    return { content: [{ type: 'text', text: result ? `Browser response: ${JSON.stringify(result)}` : 'Timeline command sent to browser.' }] };
  });

  server.tool('sp-select-process', SpToolDescriptions.spSelectProcess, SpSelectProcessSchema, async (args) => {
    if (!bridge.isConnected()) return notConnectedResult();
    const { sent, result } = await bridge.sendUiCommand(UI_CMD.SELECT_PROCESS, {
      ipid: args.ipid,
      processName: args.processName,
    });
    if (!sent) return { content: [{ type: 'text', text: 'Failed to send command.' }], isError: true };
    return { content: [{ type: 'text', text: result ? `Browser response: ${JSON.stringify(result)}` : 'Select process command sent to browser.' }] };
  });

  server.tool('sp-focus-range', SpToolDescriptions.spFocusRange, SpFocusRangeSchema, async (args) => {
    if (!bridge.isConnected()) return notConnectedResult();
    const { sent, result } = await bridge.sendUiCommand(UI_CMD.FOCUS_RANGE, {
      startTime: args.startTime,
      endTime: args.endTime,
    });
    if (!sent) return { content: [{ type: 'text', text: 'Failed to send command.' }], isError: true };
    return { content: [{ type: 'text', text: result ? `Browser response: ${JSON.stringify(result)}` : 'Focus range command sent to browser.' }] };
  });

  server.tool('sp-show-query-result', SpToolDescriptions.spShowQueryResult, SpShowQueryResultSchema, async (args) => {
    if (!bridge.isConnected()) return notConnectedResult();
    const { sent, result } = await bridge.sendUiCommand(UI_CMD.SHOW_QUERY_RESULT, {
      query: args.query,
      title: args.title,
    });
    if (!sent) return { content: [{ type: 'text', text: 'Failed to send command.' }], isError: true };
    return { content: [{ type: 'text', text: result ? `Browser response: ${JSON.stringify(result)}` : 'Show query result command sent to browser.' }] };
  });

  server.tool('sp-get-current-trace', SpToolDescriptions.spGetCurrentTrace, SpGetCurrentTraceSchema, async () => {
    if (!bridge.isConnected()) {
      return { content: [{ type: 'text', text: 'Extension service not connected. sp-get-current-trace requires the extension service and browser to be running. Start the extension service first, then retry.' }], isError: true };
    }
    const { sent, result } = await bridge.requestExportDb();
    if (!sent) {
      return { content: [{ type: 'text', text: 'Extension service not available. Start the extension service and open SP Host in browser with a trace file loaded.' }], isError: true };
    }
    if (!result?.success && result?.code === -1) {
      return { content: [{ type: 'text', text: `Failed to get trace from browser: ${result.message}` }], isError: true };
    }
    if (result?.code === 0 && result?.message) {
      const dbPath = result.message;
      const loadResult = await engine.setDbFile(dbPath);
      return loadResult;
    }
    return { content: [{ type: 'text', text: `Unexpected response: ${JSON.stringify(result)}` }], isError: true };
  });
}
