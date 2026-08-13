import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SpSearchKnowledgeSchema, SpUploadKnowledgeSchema, SpDeleteKnowledgeSchema } from '../zodSchemas';
import { SpToolDescriptions } from '../toolDescriptions';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const KNOWLEDGE_DIR = path.join(os.homedir(), '.sp-agent', 'knowledge');

function validateName(name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Invalid knowledge name: ${name}. Only alphanumeric, underscore, and hyphen are allowed.`);
  }
}

function ensureKnowledgeDir(): void {
  if (!fs.existsSync(KNOWLEDGE_DIR)) fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
}

export function registerKnowledgeTools(server: McpServer): void {
  server.tool('sp-search-knowledge', SpToolDescriptions.spSearchKnowledge, SpSearchKnowledgeSchema, async ({ query, topK }) => {
    ensureKnowledgeDir();
    const k = topK || 5;
    const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json'));
    const results: Array<{ name: string; snippet: string; score: number }> = [];
    const queryLower = query.toLowerCase();
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
        const contentLower = content.toLowerCase();
        let score = 0;
        const terms = queryLower.split(/\s+/);
        for (const term of terms) {
          const idx = contentLower.indexOf(term);
          if (idx >= 0) score += 1;
        }
        if (score > 0) {
          const firstMatch = contentLower.indexOf(queryLower.split(/\s+/)[0]);
          const start = Math.max(0, firstMatch - 100);
          const end = Math.min(content.length, firstMatch + 200);
          results.push({ name: file, snippet: content.slice(start, end), score });
        }
      } catch {}
    }
    results.sort((a, b) => b.score - a.score);
    return { content: [{ type: 'text', text: JSON.stringify(results.slice(0, k)) }] };
  });

  server.tool('sp-upload-knowledge', SpToolDescriptions.spUploadKnowledge, SpUploadKnowledgeSchema, async ({ name, content, type }) => {
    validateName(name);
    ensureKnowledgeDir();
    const ext = type === 'json' ? 'json' : type === 'txt' ? 'txt' : 'md';
    const filePath = path.join(KNOWLEDGE_DIR, `${name}.${ext}`);
    const existed = fs.existsSync(filePath);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { content: [{ type: 'text', text: existed ? `Knowledge document "${name}" updated.` : `Knowledge document "${name}" saved.` }] };
  });

  server.tool('sp-delete-knowledge', SpToolDescriptions.spDeleteKnowledge, SpDeleteKnowledgeSchema, async ({ name }) => {
    validateName(name);
    ensureKnowledgeDir();
    const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.startsWith(name + '.'));
    if (files.length === 0) {
      return { content: [{ type: 'text', text: `Knowledge document "${name}" not found.` }], isError: true };
    }
    for (const f of files) {
      fs.unlinkSync(path.join(KNOWLEDGE_DIR, f));
    }
    return { content: [{ type: 'text', text: `Knowledge document "${name}" deleted.` }] };
  });
}
