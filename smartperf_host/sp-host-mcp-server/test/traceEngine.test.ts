import { TraceEngine } from '../src/traceEngine';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Database from 'better-sqlite3';

jest.mock('child_process', () => ({
  execFile: jest.fn(() => ({})),
}));

import { execFile } from 'child_process';
const mockExecFile = execFile as unknown as jest.Mock;

describe('TraceEngine', () => {
  let engine: TraceEngine;
  let tmpDir: string;
  let traceFile: string;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), 'sp-agent-test-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    traceFile = path.join(tmpDir, 'test.htrace');
    fs.writeFileSync(traceFile, 'dummy');
    engine = new TraceEngine(traceFile, 'echo');
  });

  afterEach(() => {
    engine.closeDb();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('getTraceFile returns the configured trace file', () => {
    expect(engine.getTraceFile()).toBe(traceFile);
  });

  it('query returns error when trace file not found', async () => {
    const engine2 = new TraceEngine('/nonexistent.htrace', 'echo');
    const result = await engine2.query('SELECT 1');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Trace file not found');
  });

  it('query returns error when trace_streamer export fails', async () => {
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: Function) => {
      cb(new Error('trace_streamer not found'));
      return {};
    });
    const result = await engine.query('SELECT 1');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to export trace DB');
    mockExecFile.mockReset();
  });

  it('query returns error when DB file not created after export', async () => {
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: Function) => {
      cb(null);
      return {};
    });
    const result = await engine.query('SELECT 1');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('trace_streamer export failed');
    mockExecFile.mockReset();
  });

  it('closeDb is idempotent', () => {
    engine.closeDb();
    engine.closeDb();
  });

  it('queryWithParams delegates to resolvePlaceholders', async () => {
    const engine2 = new TraceEngine('/nonexistent.htrace', 'echo');
    const result = await engine2.queryWithParams('WHERE ipid = :ipid', { ipid: 5 });
    expect(result.isError).toBe(true);
  });
});
