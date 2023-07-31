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

// @ts-ignore
import { VmTrackerChart } from '../../../../dist/trace/component/chart/SpVmTrackerChart.js';
// @ts-ignore
import { SpChartManager } from '../../../../dist/trace/component/chart/SpChartManager.js';
const sqlite = require('../../../../dist/trace/database/SqlLite.js');
jest.mock('../../../../dist/trace/database/SqlLite.js');
jest.mock('../../../../dist/trace/database/ui-worker/ProcedureWorker.js', () => {
    return {};
});

window.ResizeObserver =
    window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
    }));

describe('SpVmTrackerChart Test', () => {
    let smapsData = sqlite.querySmapsData;
    let smapsSixData = [{
        startNs:0,
        value:1024,
        name:'dirty',
    }];
    smapsData.mockResolvedValue(smapsSixData);
    let dmaSmapsData = sqlite.queryDmaSampsData;
    let smapsDmaData = [{
        startNs:0,
        value:1024,
        flag:1,
        ipid:1,
        expTaskComm:'delay',
    }];
    dmaSmapsData.mockResolvedValue(smapsDmaData);
    let gpuMemoryData = sqlite.queryGpuMemoryData;
    let gpuData = [{
        startNs:0,
        value:1024,
        ipid:1,
    }];
    gpuMemoryData.mockResolvedValue(gpuData);
    let smapsExits = sqlite.querySmapsExits;
    let exits = [{
        event_name:'trace_smaps',
    }];
    smapsExits.mockResolvedValue(exits);
    let vmTrackerShmData = sqlite.queryVmTrackerShmData;
    let shmData = [{
        startNs:0,
        value:1024,
    }];
    vmTrackerShmData.mockResolvedValue(shmData);
    let purgeableProcessData = sqlite.queryPurgeableProcessData;
    let processData = [{
        startNs:0,
        value:1024,
    }];
    purgeableProcessData.mockResolvedValue(processData);
    let gpuGlData = sqlite.queryGpuGLData;
    let glData = [{
        startNs:0,
        value:1024,
    }];
    gpuGlData.mockResolvedValue(glData);
    let gpuTotalData = sqlite.queryGpuTotalData;
    let totalData = [{
        startNs:0,
        value:1024,
    }];
    gpuTotalData.mockResolvedValue(totalData);
    let gpuTotalType = sqlite.queryGpuTotalType;
    let totalType = [{
        id:1,
        data:'delay'
    }];
    gpuTotalType.mockResolvedValue(totalType);
    let gpuWindowData = sqlite.queryGpuWindowData;
    let windowsData = [{
        startNs:0,
        value:1024,
    }];
    gpuWindowData.mockResolvedValue(windowsData);
    let gpuWindowType = sqlite.queryGpuWindowType;
    let windowsType = [{
        id:1,
        data:'delay',
        pid:1,
    }];
    gpuWindowType.mockResolvedValue(windowsType);
    let manager = new SpChartManager();
    let spVmTrackerChart = new VmTrackerChart(manager);
    it('SpVmTrackerChart01', function () {
        spVmTrackerChart.initVmTrackerFolder();
        expect(spVmTrackerChart).toBeDefined();
    });
    it('SpVmTrackerChart02', function () {
        expect(spVmTrackerChart.getSmapsKeyName('USS')).toBeDefined();
    });
    it('SpVmTrackerChart03', function () {
        expect(spVmTrackerChart.initTraceRow('dirty','smaps','VmTracker')).toBeDefined();
    });
    it('SpVmTrackerChart04', function () {
        expect(spVmTrackerChart.initPurgeablePin()).toBeDefined();
    });
    it('SpVmTrackerChart05', function () {
        expect(spVmTrackerChart.initPurgeableTotal()).toBeDefined();
    });
    it('SpVmTrackerChart06', function () {
        expect(spVmTrackerChart.showTip).toBeDefined();
    });
});