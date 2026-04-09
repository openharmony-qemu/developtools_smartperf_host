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

import { LongTraceFilter } from '../../../src/trace/longtrace/LongTraceFilter';
const INVALID_TRACE_FILE_NAME = 'a.htrace';
const NORMAL_TRACE_FILE_NAME_ONE = 'hiprofiler_data_20260101_010101_1.htrace';
const NORMAL_TRACE_FILE_NAME_TWO = 'hiprofiler_data_20260101_010101_2.htrace';
const NORMAL_TRACE_FILE_NAME_THREE = 'hiprofiler_data_20260101_010101_3.htrace';
const NORMAL_TRACE_FILE_NAME_FOUR = 'hiprofiler_data_20260101_010101_4.htrace';
const SPECIAL_TRACE_FILE_NAME_ARKTS = 'hiprofiler_data_arkts.htrace';
const DUPLICATE_SEQUENCE_NUMBER = 2;
const DISCONTINUITY_EXPECTED_AFTER_ONE = 2;
const DISCONTINUITY_EXPECTED_AFTER_TWO = 3;

// 创建仅包含文件名的测试文件对象，便于聚焦过滤逻辑本身。
function createFile(name: string): File {
  return new File([new Uint8Array(0)], name);
}

describe('LongTraceFilter', () => {
  it('按命名规则分类文件，并记录类型不匹配日志', () => {
    // 一个非法命名文件 + 一个正常 trace 文件 + 一个 special 文件。
    const files = [
      createFile(INVALID_TRACE_FILE_NAME),
      createFile(NORMAL_TRACE_FILE_NAME_ONE),
      createFile(SPECIAL_TRACE_FILE_NAME_ARKTS),
    ];
    // 执行过滤。
    const res = LongTraceFilter.filter(files);
    // normal 文件仅保留符合普通命名规则的文件。
    expect(res.normalFiles.map((f) => f.name)).toEqual([NORMAL_TRACE_FILE_NAME_ONE]);
    // special 文件应被单独归类保留。
    expect(res.specialFiles.map((f) => f.name)).toEqual([SPECIAL_TRACE_FILE_NAME_ARKTS]);
    // 非法命名文件应记录“类型不匹配”日志。
    expect(res.logs).toContainEqual({
      message: `Ignored: does not match normal/special pattern: ${INVALID_TRACE_FILE_NAME}`,
      fileNames: [INVALID_TRACE_FILE_NAME],
    });
  });

  /*
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceFilter 实例能够正确合并补丁数据并回调结果。
   */
  it('遇到重复序号时丢弃整组文件，并在后续连续性中断时记录日志', () => {
    // 序号 2 重复两次，重复组会被整体丢弃，随后序列从 1 直接跳到 3。
    const files = [
      createFile(NORMAL_TRACE_FILE_NAME_ONE),
      createFile(NORMAL_TRACE_FILE_NAME_TWO),
      createFile(NORMAL_TRACE_FILE_NAME_TWO),
      createFile(NORMAL_TRACE_FILE_NAME_THREE),
    ];
    // 执行过滤。
    const res = LongTraceFilter.filter(files);
    // 去重后仅保留连续前缀中的第一页。
    expect(res.normalFiles.map((f) => f.name)).toEqual([NORMAL_TRACE_FILE_NAME_ONE]);
    // 重复序号的两份文件需要被整组丢弃。
    expect(res.logs).toContainEqual({
      message: `Discarded entire group due to duplicate N=${DUPLICATE_SEQUENCE_NUMBER}, files=${NORMAL_TRACE_FILE_NAME_TWO},${NORMAL_TRACE_FILE_NAME_TWO}`,
      fileNames: [NORMAL_TRACE_FILE_NAME_TWO, NORMAL_TRACE_FILE_NAME_TWO],
    });
    // 因为缺少序号 2，序列在期望值 2 处中断，后续文件会被忽略。
    expect(res.logs).toContainEqual({
      message: `Continuity break: expectedN=${DISCONTINUITY_EXPECTED_AFTER_ONE}, ignored subsequent=${NORMAL_TRACE_FILE_NAME_THREE}`,
      fileNames: [NORMAL_TRACE_FILE_NAME_THREE],
    });
  });

  /*
   * 测试条件：在会话绑定完成后，服务端下发补丁数据。
   * 测试目的：验证 LongTraceFilter 实例能够正确合并补丁数据并回调结果。
   */
  it('仅保留连续序列前缀，并在跳号时记录连续性中断日志', () => {
    // 序号 4 与前面的 1、2 不连续，因此应在 2 之后截断。
    const files = [
      createFile(NORMAL_TRACE_FILE_NAME_ONE),
      createFile(NORMAL_TRACE_FILE_NAME_TWO),
      createFile(NORMAL_TRACE_FILE_NAME_FOUR),
    ];
    // 执行过滤。
    const res = LongTraceFilter.filter(files);
    // 仅保留连续的 1、2 两页。
    expect(res.normalFiles.map((f) => f.name)).toEqual([
      NORMAL_TRACE_FILE_NAME_ONE,
      NORMAL_TRACE_FILE_NAME_TWO,
    ]);
    // 序号 4 触发连续性中断并被忽略。
    expect(res.logs).toContainEqual({
      message: `Continuity break: expectedN=${DISCONTINUITY_EXPECTED_AFTER_TWO}, ignored subsequent=${NORMAL_TRACE_FILE_NAME_FOUR}`,
      fileNames: [NORMAL_TRACE_FILE_NAME_FOUR],
    });
  });
});
