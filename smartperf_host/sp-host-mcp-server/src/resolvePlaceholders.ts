export function resolvePlaceholders(sql: string, params: Record<string, unknown>): string {
  let result = sql;

  for (const [key, value] of Object.entries(params)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  result = result.replace(/^--(?!\s*AND).*\n/gm, '\n');
  result = result.replace(/\n{2,}/g, '\n');
  return result.trim();
}
