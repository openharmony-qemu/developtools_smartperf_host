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

function escapeRegexKey(key: string): string {
  return key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripCommentedOptionalClauses(sql: string, params: Record<string, unknown>): string {
  let result = sql;
  for (const [key, value] of Object.entries(params)) {
    const escapedKey = escapeRegexKey(key);
    const commentLineRegex = new RegExp(
      `^\\s*--\\s*(AND\\s+[^\\n]*?\\s*(?:=|>=|<=|!=|\\s+IN\\s+)\\s*:${escapedKey}\\b\\s*)\\n?`,
      'gm'
    );
    if (value === null || value === undefined) {
      result = result.replace(commentLineRegex, '\n');
    } else {
      result = result.replace(commentLineRegex, '$1\n');
    }
  }
  return result;
}

function substituteParamValues(sql: string, params: Record<string, unknown>): string {
  let result = sql;
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const escapedKey = escapeRegexKey(key);
    const paramRegex = new RegExp(`:${escapedKey}\\b`, 'g');
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error(`Invalid number param :${key}: ${value}`);
      result = result.replace(paramRegex, () => String(value));
    } else if (typeof value === 'string') {
      const escaped = value.replace(/'/g, "''");
      result = result.replace(paramRegex, () => `'${escaped}'`);
    } else if (Array.isArray(value) && value.every(v => typeof v === 'number' && Number.isFinite(v))) {
      result = result.replace(paramRegex, () => `(${value.join(',')})`);
    } else {
      throw new Error(`Unsupported param type for :${key}: ${typeof value}`);
    }
  }
  return result;
}

function cleanupSql(sql: string): string {
  let result = sql.replace(/^--(?!\s*AND).*\n/gm, '\n');
  result = result.replace(/\n{2,}/g, '\n');
  return result.trim();
}

export function resolvePlaceholders(sql: string, params: Record<string, unknown>): string {
  let result = stripCommentedOptionalClauses(sql, params);
  result = substituteParamValues(result, params);
  return cleanupSql(result);
}
