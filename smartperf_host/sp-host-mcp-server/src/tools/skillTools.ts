import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TraceEngine } from '../traceEngine';
import { SpRegisterSkillSchema, SpExecuteSkillSchema, SpListSkillsSchema, SpDeleteSkillSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
import { resolvePlaceholders } from '../resolvePlaceholders';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const SKILLS_DIR = path.join(os.homedir(), '.sp-agent', 'skills');

const BUILTIN_PREFIXES = [
  'sp-triage-', 'sp-analyze-', 'sp-jank-', 'sp-list-',
  'sp-execute-query', 'sp-execute-skill', 'sp-execute-workflow',
  'sp-set-', 'sp-show-', 'sp-select-',
  'sp-focus-', 'sp-register-', 'sp-delete-', 'sp-search-',
  'sp-upload-', 'sp-list-workflow',
];

function ensureSkillsDir(): void {
  if (!fs.existsSync(SKILLS_DIR)) fs.mkdirSync(SKILLS_DIR, { recursive: true });
}

function validateName(name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Invalid skill name: ${name}. Only alphanumeric, underscore, and hyphen are allowed.`);
  }
}

function validateSqlSafety(sql: string): boolean {
  const withoutStrings = sql.replace(/'(?:''|[^'])*'/g, "''");
  const cleaned = withoutStrings
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .toUpperCase();

  const forbidden = /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|ATTACH|DETACH|PRAGMA)\b/;
  if (forbidden.test(cleaned)) return false;

  const trimmed = cleaned.trim();
  if (trimmed.includes(';')) return false;

  if (!/^\s*(SELECT|WITH)\b/i.test(sql.trim())) return false;

  return true;
}

function isBuiltinTool(name: string): boolean {
  return BUILTIN_PREFIXES.some(p => name.startsWith(p));
}

function skillPath(name: string): string {
  return path.join(SKILLS_DIR, `${name}.json`);
}

export function registerSkillTools(server: McpServer, engine: TraceEngine): void {
  server.tool('sp-register-skill', SpToolDescriptions.spRegisterSkill, SpRegisterSkillSchema, async (args) => {
    validateName(args.name);
    if (!args.name.startsWith('sp-')) {
      return { content: [{ type: 'text', text: 'Skill name must start with "sp-" prefix.' }], isError: true };
    }
    if (isBuiltinTool(args.name)) {
      return { content: [{ type: 'text', text: `Skill "${args.name}" conflicts with built-in tool.` }], isError: true };
    }
    if (!validateSqlSafety(args.sqlTemplate)) {
      return { content: [{ type: 'text', text: 'Skill SQL must be SELECT-only. DROP/DELETE/UPDATE/INSERT/ALTER/CREATE are not allowed.' }], isError: true };
    }
    ensureSkillsDir();
    if (fs.existsSync(skillPath(args.name))) {
      return { content: [{ type: 'text', text: `Skill "${args.name}" already exists. Use sp-delete-skill first.` }], isError: true };
    }
    const skill = {
      name: args.name,
      description: args.description,
      schema: args.schema,
      sqlTemplate: args.sqlTemplate,
      domain: args.domain || 'custom',
      createdAt: Date.now(),
    };
    fs.writeFileSync(skillPath(args.name), JSON.stringify(skill, null, 2), 'utf-8');
    return { content: [{ type: 'text', text: `Skill "${args.name}" registered successfully.` }] };
  });

  server.tool('sp-execute-skill', SpToolDescriptions.spExecuteSkill, SpExecuteSkillSchema, async ({ name, params }) => {
    validateName(name);
    const p = skillPath(name);
    if (!fs.existsSync(p)) {
      return { content: [{ type: 'text', text: `Skill "${name}" not found. Use sp-list-skills to see available skills.` }], isError: true };
    }
    let skill: any;
    try {
      skill = JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch {
      return { content: [{ type: 'text', text: `Failed to load skill "${name}".` }], isError: true };
    }
    return loadSkillSql(engine, name, skill.sqlTemplate, params || {});
  });

  server.tool('sp-list-skills', SpToolDescriptions.spListSkills, SpListSkillsSchema, async () => {
    ensureSkillsDir();
    const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.json'));
    const skills = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(SKILLS_DIR, f), 'utf-8'));
      } catch { return null; }
    }).filter(Boolean);
    return { content: [{ type: 'text', text: JSON.stringify(skills) }] };
  });

  server.tool('sp-delete-skill', SpToolDescriptions.spDeleteSkill, SpDeleteSkillSchema, async ({ name }) => {
    validateName(name);
    const p = skillPath(name);
    if (!fs.existsSync(p)) {
      return { content: [{ type: 'text', text: `Skill "${name}" not found.` }], isError: true };
    }
    fs.unlinkSync(p);
    return { content: [{ type: 'text', text: `Skill "${name}" deleted.` }] };
  });
}

export function loadSkillSql(engine: TraceEngine, skillName: string, sqlTemplate: string, params: Record<string, unknown>) {
  const sql = resolvePlaceholders(sqlTemplate, params);
  return engine.query(sql);
}
