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

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TraceEngine } from '../traceEngine';
import { SpRegisterSkillSchema, SpExecuteSkillSchema, SpListSkillsSchema, SpDeleteSkillSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
import { resolvePlaceholders } from '../resolvePlaceholders';

const SKILLS_DIR = path.join(os.homedir(), '.sp-agent', 'skills');

const BUILTIN_PREFIXES = [
  'sp-triage-', 'sp-analyze-', 'sp-jank-', 'sp-list-',
  'sp-execute-query', 'sp-execute-skill', 'sp-execute-workflow',
  'sp-set-', 'sp-show-', 'sp-select-',
  'sp-focus-', 'sp-register-', 'sp-delete-', 'sp-search-',
  'sp-upload-', 'sp-list-workflow',
];

interface RegisterSkillArgs {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  sqlTemplate: string;
  domain?: string;
}

interface SkillRecord {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  sqlTemplate: string;
  domain: string;
}

function ensureSkillsDir(): void {
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }
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
  if (forbidden.test(cleaned)) {
    return false;
  }

  const trimmed = cleaned.trim();
  if (trimmed.includes(';')) {
    return false;
  }

  if (!/^\s*(SELECT|WITH)\b/i.test(sql.trim())) {
    return false;
  }

  return true;
}

function isBuiltinTool(name: string): boolean {
  return BUILTIN_PREFIXES.some(p => name.startsWith(p));
}

function skillPath(name: string): string {
  return path.join(SKILLS_DIR, `${name}.json`);
}

async function registerSkillHandler(args: RegisterSkillArgs): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
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
}

async function executeSkillHandler(
  args: { name: string; params?: Record<string, unknown> },
  engine: TraceEngine
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const { name, params } = args;
  validateName(name);
  const p = skillPath(name);
  if (!fs.existsSync(p)) {
    return { content: [{ type: 'text', text: `Skill "${name}" not found. Use sp-list-skills to see available skills.` }], isError: true };
  }
  let skill: SkillRecord;
  try {
    skill = JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (e: unknown) {
    return { content: [{ type: 'text', text: `Failed to load skill "${name}".` }], isError: true };
  }
  return loadSkillSql(engine, name, skill.sqlTemplate, params || {});
}

export function registerSkillTools(server: McpServer, engine: TraceEngine): void {
  server.tool(
    'sp-register-skill',
    SpToolDescriptions.spRegisterSkill,
    SpRegisterSkillSchema,
    async (args) => registerSkillHandler(args)
  );

  server.tool(
    'sp-execute-skill',
    SpToolDescriptions.spExecuteSkill,
    SpExecuteSkillSchema,
    async (args) => executeSkillHandler(args, engine)
  );

  server.tool('sp-list-skills', SpToolDescriptions.spListSkills, SpListSkillsSchema, async () => {
    ensureSkillsDir();
    const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.json'));
    const skills = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(SKILLS_DIR, f), 'utf-8')) as SkillRecord;
      } catch (e: unknown) {
        console.warn('[sp-agent] Failed to parse skill file:', f, e instanceof Error ? e.message : String(e));
        return null;
      }
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

export function loadSkillSql(
  engine: TraceEngine,
  skillName: string,
  sqlTemplate: string,
  params: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const sql = resolvePlaceholders(sqlTemplate, params);
  return engine.query(sql) as Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }>;
}
