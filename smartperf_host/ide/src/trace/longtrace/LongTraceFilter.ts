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

export interface LongTraceDropLog {
  message: string;
  fileNames: string[];
}

export interface LongTraceFilterResult {
  normalFiles: File[];
  specialFiles: File[];
  logs: LongTraceDropLog[];
}

import {
  LONG_TRACE_NORMAL_MATCH_PATTERN,
  LONG_TRACE_SPECIAL_MATCH_PATTERN,
} from './LongTraceConstants';

const LONG_TRACE_FILE_NAME_SEPARATOR = '_';
const LONG_TRACE_FILE_SUFFIX = '.htrace';

/**
 * 从文件名中解析出序号 N
 * 文件名格式示例：xxx_20230101_120000_123.htrace
 * 其中 123 即为要提取的序号
 * @param fileName 文件名
 * @returns 成功返回序号数字，失败返回 undefined
 */
export function parseSequenceNumber(fileName: string): number | undefined {
  // 找到最后一个下划线的位置
  const lastUnderscoreIndex = fileName.lastIndexOf(LONG_TRACE_FILE_NAME_SEPARATOR);
  // 找到 .htrace 后缀的起始位置
  const suffixIndex = fileName.lastIndexOf(LONG_TRACE_FILE_SUFFIX);
  // 如果找不到下划线或后缀，或下划线在后缀之后，格式非法
  if (lastUnderscoreIndex < 0 || suffixIndex < 0 || lastUnderscoreIndex >= suffixIndex) {
    return undefined;
  }
  // 截取序号字符串
  const nText = fileName.slice(lastUnderscoreIndex + LONG_TRACE_FILE_NAME_SEPARATOR.length, suffixIndex);
  // 转换为数字
  const n = Number(nText);
  // 如果不是有限数字，解析失败
  if (!Number.isFinite(n)) {
    return undefined;
  }
  return n;
}

/**
 * 构建“类型不匹配”丢弃日志
 * 当文件名既不符合 normal 模式也不符合 special 模式时调用
 * @param fileName 不匹配的文件名
 * @returns 对应的丢弃日志对象
 */
function buildTypeMismatchLog(fileName: string): LongTraceDropLog {
  return { message: `Ignored: does not match normal/special pattern: ${fileName}`, fileNames: [fileName] };
}

/**
 * 构建“序号解析失败”丢弃日志
 * 当无法从 normal 文件名中解析出序号 N 时调用
 * @param fileName 解析失败的文件名
 * @returns 对应的丢弃日志对象
 */
function buildNParseFailedLog(fileName: string): LongTraceDropLog {
  return { message: `Discarded: failed to parse sequence number N: ${fileName}`, fileNames: [fileName] };
}

/**
 * 构建“序号重复”丢弃日志
 * 当同一序号 N 出现多个文件时，整组丢弃并记录
 * @param n 重复的序号值
 * @param fileNames 拥有相同 N 的所有文件名
 * @returns 对应的丢弃日志对象
 */
function buildDuplicateNLog(n: number, fileNames: string[]): LongTraceDropLog {
  return { message: `Discarded entire group due to duplicate N=${n}, files=${fileNames.join(',')}`, fileNames };
}

/**
 * 构建“连续性中断”丢弃日志
 * 当序号序列出现跳号时，丢弃断点及之后的所有文件
 * @param expected 当前期望的序号值
 * @param ignoredFileNames 因中断而被忽略的所有文件名
 * @returns 对应的丢弃日志对象
 */
function buildDiscontinuityLog(expected: number, ignoredFileNames: string[]): LongTraceDropLog {
  return {
    message: `Continuity break: expectedN=${expected}, ignored subsequent=${ignoredFileNames.join(',')}`,
    fileNames: ignoredFileNames,
  };
}

export class LongTraceFilter {
  /**
   * 过滤并分类长trace文件
   * 1. 按文件名匹配规则区分为normal/special/不匹配
   * 2. 对normal文件提取序号N，去重并检查连续性
   * 3. 返回分类结果及丢弃原因日志
   */
  static filter(files: File[]): LongTraceFilterResult {
    const logs: LongTraceDropLog[] = []; // 丢弃日志列表
    const filesByN = new Map<number, File[]>(); // 以序号N为键，存放同N的normal文件
    const specialFiles: File[] = []; // 符合special规则的文件

    // 第一轮：按文件名规则初筛
    for (const file of files) {
      const isNormalMatch = LONG_TRACE_NORMAL_MATCH_PATTERN.test(file.name);
      const isSpecialMatch = LONG_TRACE_SPECIAL_MATCH_PATTERN.test(file.name);

      if (!isNormalMatch && !isSpecialMatch) {
        // 既不符合normal也不符合special，记录丢弃原因
        logs.push(buildTypeMismatchLog(file.name));
        continue;
      }

      if (isSpecialMatch) {
        // special文件直接收集，后续不再处理
        specialFiles.push(file);
        continue;
      }

      // 解析normal文件的序号N
      const n = parseSequenceNumber(file.name);
      if (n === undefined) {
        // N解析失败，丢弃
        logs.push(buildNParseFailedLog(file.name));
        continue;
      }

      // 按N分组，后续做去重
      const group = filesByN.get(n) ?? [];
      group.push(file);
      filesByN.set(n, group);
    }

    // 第二轮：同N去重，保留唯一文件
    const unique: Array<{ n: number; file: File }> = [];
    for (const [n, group] of filesByN.entries()) {
      if (group.length > 1) {
        // 同一N出现多个文件，整组丢弃
        logs.push(buildDuplicateNLog(n, group.map((f) => f.name)));
        continue;
      }
      unique.push({ n, file: group[0] });
    }

    // 按N升序排列，准备连续性检查
    unique.sort((a, b) => a.n - b.n);
    if (unique.length === 0) {
      // 没有合法normal文件，直接返回
      return { normalFiles: [], specialFiles, logs };
    }

    // 第三轮：连续性检查，遇到断点则丢弃后续所有
    const normalFiles: File[] = [];
    let expected = unique[0].n; // 期望的下一个N
    for (const item of unique) {
      if (item.n !== expected) {
        // 连续性断点，记录日志并丢弃当前及之后所有文件
        const ignored = unique.filter((u) => u.n >= item.n).map((u) => u.file.name);
        logs.push(buildDiscontinuityLog(expected, ignored));
        break;
      }
      // 连续性正确，保留
      normalFiles.push(item.file);
      expected += 1;
    }

    return { normalFiles, specialFiles, logs };
  }
}
