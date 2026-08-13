import { execFile } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { resolvePlaceholders } from './resolvePlaceholders';

const execFileAsync = promisify(execFile);

export interface SpToolResult {
  readonly content: ReadonlyArray<{ readonly type: 'text'; readonly text: string }>;
  readonly isError?: boolean;
}

const MAX_ROWS = 5000;

export class TraceEngine {
  private traceFile: string;
  private dbFile: string | null = null;
  private db: Database.Database | null = null;
  private dbReady: Promise<Database.Database> | null = null;
  private traceStreamerPath: string;
  private dbGeneration = 0;
  private dbFromBrowser = false;

  constructor(traceFile: string, traceStreamerPath?: string) {
    this.traceFile = traceFile;
    this.traceStreamerPath = traceStreamerPath || process.env.TRACE_STREAMER_PATH || 'trace_streamer';
  }

  async setTraceFile(traceFile: string): Promise<SpToolResult> {
    this.closeDb();
    const gen = ++this.dbGeneration;
    this.traceFile = traceFile;
    this.dbFile = null;
    this.db = null;
    this.dbReady = null;
    await this.ensureDb();
    if (this.dbGeneration !== gen) {
      return { content: [{ type: 'text', text: 'Trace file was changed during export.' }], isError: true };
    }
    return { content: [{ type: 'text', text: `Trace file set to: ${traceFile}. DB exported successfully.` }] };
  }

  async setDbFile(dbPath: string): Promise<SpToolResult> {
    this.closeDb();
    if (!fs.existsSync(dbPath)) {
      return { content: [{ type: 'text', text: `DB file not found: ${dbPath}` }], isError: true };
    }
    try {
      this.db = new Database(dbPath, { readonly: true });
      this.dbFile = dbPath;
      this.traceFile = '';
      this.dbFromBrowser = true;
      this.dbReady = Promise.resolve(this.db);
      const tables = this.db.prepare("SELECT count(*) as cnt FROM sqlite_schema WHERE type='table'").get() as any;
      return { content: [{ type: 'text', text: `DB file loaded: ${dbPath} (${tables.cnt} tables)` }] };
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Failed to open DB: ${e.message || e}` }], isError: true };
    }
  }

  getTraceFile(): string {
    return this.traceFile;
  }

  async query(sql: string, options?: { allowPragma?: boolean }): Promise<SpToolResult> {
    const upperSql = sql.replace(/'(?:''|[^'])*'/g, "''").toUpperCase();
    if (/\b(ATTACH|DETACH)\b/.test(upperSql)) {
      return { content: [{ type: 'text', text: 'ATTACH/DETACH are not allowed in queries.' }], isError: true };
    }
    if (!options?.allowPragma && /\bPRAGMA\b/.test(upperSql)) {
      return { content: [{ type: 'text', text: 'PRAGMA is not allowed in user queries. Use sp-list-table-structure instead.' }], isError: true };
    }
    let database: Database.Database;
    try {
      database = await this.ensureDb();
    } catch (e: any) {
      return { content: [{ type: 'text', text: `DB error: ${e.message || e}` }], isError: true };
    }
    try {
      const stmt = database.prepare(sql);
      const rows = stmt.all();
      if (rows.length > MAX_ROWS) {
        return { content: [{ type: 'text', text: `Query returned ${rows.length} rows, max ${MAX_ROWS}. Use aggregate queries.` }], isError: true };
      }
      return { content: [{ type: 'text', text: JSON.stringify(rows) }] };
    } catch (e: any) {
      return { content: [{ type: 'text', text: `SQL error: ${e.message || e}` }], isError: true };
    }
  }

  async queryWithParams(sqlTemplate: string, params: Record<string, unknown>): Promise<SpToolResult> {
    const sql = resolvePlaceholders(sqlTemplate, params);
    return this.query(sql);
  }

  private async ensureDb(): Promise<Database.Database> {
    if (this.db && this.dbFile) return this.db;
    if (this.dbReady) return this.dbReady;

    const gen = this.dbGeneration;
    this.dbReady = (async () => {
      if (!this.traceFile) throw new Error('No trace file set. Use sp-set-trace-file first.');
      if (!fs.existsSync(this.traceFile)) {
        throw new Error(`Trace file not found: ${this.traceFile}`);
      }
      const tmpDir = path.join(os.tmpdir(), 'sp-agent');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const dbPath = path.join(tmpDir, `trace-${Date.now()}-${process.pid}.db`);
      try {
        await execFileAsync(this.traceStreamerPath, [this.traceFile, '-e', dbPath], { timeout: 120000 });
      } catch (e: any) {
        throw new Error(`Failed to export trace DB: ${e.message || e}`);
      }
      if (this.dbGeneration !== gen) {
        try { fs.unlinkSync(dbPath); } catch {}
        throw new Error('Trace file was changed during export.');
      }
      if (!fs.existsSync(dbPath)) {
        throw new Error('trace_streamer export failed: DB file not created');
      }
      this.dbFile = dbPath;
      this.db = new Database(dbPath, { readonly: true });
      return this.db;
    })();

    try {
      return await this.dbReady;
    } catch (e) {
      this.dbReady = null;
      this.dbFile = null;
      throw e;
    }
  }

  closeDb(): void {
    if (this.db) {
      try { this.db.close(); } catch {}
      this.db = null;
    }
    if (this.dbFile && !this.dbFromBrowser) {
      try { fs.unlinkSync(this.dbFile); } catch {}
    }
    this.dbFile = null;
    this.dbReady = null;
    this.dbFromBrowser = false;
  }

  async listProcesses(): Promise<SpToolResult> {
    return this.query('SELECT id, ipid, pid, name FROM process ORDER BY name');
  }

  async listTables(): Promise<SpToolResult> {
    return this.query("SELECT name, type FROM sqlite_schema WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name");
  }

  async listTableStructure(table: string): Promise<SpToolResult> {
    const safeTable = table.replace(/'/g, "''");
    return this.query(`pragma table_info('${safeTable}')`, { allowPragma: true });
  }
}
