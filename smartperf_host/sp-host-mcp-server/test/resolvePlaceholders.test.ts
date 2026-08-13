import { resolvePlaceholders } from '../src/resolvePlaceholders';

describe('resolvePlaceholders', () => {
  it('activates comment condition line when param has value', () => {
    const sql = 'WHERE fs.type = 0\n-- AND fs.ipid = :ipid\nGROUP BY 1';
    expect(resolvePlaceholders(sql, { ipid: 5 })).toBe('WHERE fs.type = 0\nAND fs.ipid = 5\nGROUP BY 1');
  });

  it('deletes comment condition line when param is null', () => {
    const sql = 'WHERE fs.type = 0\n-- AND fs.ipid = :ipid\nGROUP BY 1';
    expect(resolvePlaceholders(sql, { ipid: null })).toBe('WHERE fs.type = 0\nGROUP BY 1');
  });

  it('replaces string param with single-quoted escaped value', () => {
    const sql = "WHERE mf.name = :metric\n";
    expect(resolvePlaceholders(sql, { metric: "mem.rss" })).toBe("WHERE mf.name = 'mem.rss'");
  });

  it('escapes single quotes in string param using double-write', () => {
    const sql = "WHERE name = :name\n";
    expect(resolvePlaceholders(sql, { name: "it's test" })).toBe("WHERE name = 'it''s test'");
  });

  it('replaces array param as IN list', () => {
    const sql = 'WHERE cpu IN :cpus\n';
    expect(resolvePlaceholders(sql, { cpus: [0, 1, 2] })).toBe('WHERE cpu IN (0,1,2)');
  });

  it('throws on NaN number param', () => {
    const sql = 'WHERE id = :id\n';
    expect(() => resolvePlaceholders(sql, { id: NaN })).toThrow('Invalid number param');
  });

  it('cleans pure comment lines (no :param)', () => {
    const sql = 'SELECT 1\n-- this is a note\nFROM table';
    expect(resolvePlaceholders(sql, {})).toBe('SELECT 1\nFROM table');
  });

  it('does not replace :ipid when replacing :ip (word boundary)', () => {
    const sql = 'WHERE id = :ip AND fs.ipid = :ipid\n';
    expect(resolvePlaceholders(sql, { ip: 5, ipid: 10 })).toBe('WHERE id = 5 AND fs.ipid = 10');
  });

  it('handles IN operator in comment condition', () => {
    const sql = 'WHERE type = 0\n-- AND cpu IN :cpus\nGROUP BY 1';
    expect(resolvePlaceholders(sql, { cpus: [0, 1, 2] })).toBe('WHERE type = 0\nAND cpu IN (0,1,2)\nGROUP BY 1');
  });

  it('handles >= operator in comment condition', () => {
    const sql = 'WHERE type = 0\n-- AND (fs.ts - TR.start_ts) >= :startTime\nGROUP BY 1';
    expect(resolvePlaceholders(sql, { startTime: 1000 })).toBe('WHERE type = 0\nAND (fs.ts - TR.start_ts) >= 1000\nGROUP BY 1');
  });

  it('throws on unsupported param type', () => {
    const sql = 'WHERE id = :id\n';
    expect(() => resolvePlaceholders(sql, { id: true })).toThrow('Unsupported param type');
  });

  it('handles undefined param same as null', () => {
    const sql = 'WHERE type = 0\n-- AND ipid = :ipid\nGROUP BY 1';
    expect(resolvePlaceholders(sql, { ipid: undefined })).toBe('WHERE type = 0\nGROUP BY 1');
  });
});
