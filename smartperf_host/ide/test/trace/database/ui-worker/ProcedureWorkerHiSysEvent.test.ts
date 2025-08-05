/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
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
import { HiSysEventStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerHiSysEvent';
jest.mock('../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('ProcedureWorkerHiSysEvent Test',()=>{
  it('ProcedureWorkerHiSysEventTest01 ', function () {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');
    const data = {
      frame: {
        x: 120,
        y: 120,
        width: 100,
        height: 100,
      },
      id: 21,
      ts: 254151,
      dur: 1201,
      name: '1583',
      depth: 6,
      jank_tag: true,
      cmdline: 'render.test',
      type: '0',
      pid: 21,
      frame_type: 'render_service',
      src_slice: '5',
      rs_ts: 3,
      rs_vsync: '2561',
      rs_dur: 965,
      rs_pid: 320,
      rs_name: 'name',
      gpu_dur: 102,
    };
    expect(HiSysEventStruct.draw(ctx,data)).toBeUndefined()
  });
  it('ProcedureWorkerHiSysEventTest02 ', function () {
    let node = {
      frame: {
        x: 65,
        y: 20,
        width: 99,
        height: 330,
      },
      startNS: 200,
      length: 1,
      height: 90,
      startTime: 0,
      dur: 31,
    };
    let frame= {
      x: 65,
      y: 20,
      width: 99,
      height: 330,
    }
    expect(HiSysEventStruct.setSysEventFrame(node,1,2,3,frame)).toBeUndefined()
  });
})