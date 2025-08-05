/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
import {
    CycleDataBean,
    GpuCountBean,
    SearchGpuFuncBean,
    TreeDataBean,
    TreeDataStringBean,
  } from '../../../src/trace/bean/GpufreqBean';
  describe('GpuCountBean', () => {
    it('test GpuCountBean 01', () => {
      let data = new GpuCountBean(0, 0, 0, 0, 0, 0, '0', 0);
      expect(data.freq).toEqual(0);
    });
  
    it('test GpuCountBean 02', () => {
      let data = new SearchGpuFuncBean();
      data.startTime = 4;
      expect(data.startTime).toEqual(4);
    });
  
    it('test GpuCountBean 03', () => {
      let data = new TreeDataBean();
      data.startTime = 4;
      expect(data.startTime).toEqual(4);
    });
  
    it('test GpuCountBean 04', () => {
      let data = new CycleDataBean(0, 0, 0, 0, 0, '0', 0);
      expect(data.colorIndex).toEqual(0);
    });
  
    it('test GpuCountBean 05', () => {
      let data = new TreeDataStringBean('0', '0', '0', '0', '0', '0', 0);
      expect(data.thread).toEqual('0');
    });
  });