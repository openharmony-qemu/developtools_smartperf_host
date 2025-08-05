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

import { TabPaneCurrentSelection } from '../sheet/TabPaneCurrentSelection';
import { TabPaneFreq } from '../sheet/freq/TabPaneFreq';
import { TabPaneCpuByThread } from '../sheet/cpu/TabPaneCpuByThread';
import { SelectionParam } from '../../../bean/BoxSelection';
import { TabPaneCpuByProcess } from '../sheet/cpu/TabPaneCpuByProcess';
import { TabPaneCpuUsage } from '../sheet/cpu/TabPaneCpuUsage';
import { TabPaneSPT } from '../sheet/cpu/TabPaneSPT';
import { TabPanePTS } from '../sheet/cpu/TabPanePTS';
import { TabPaneSlices } from '../sheet/process/TabPaneSlices';
import { TabPaneCounter } from '../sheet/process/TabPaneCounter';
import { TabPaneFps } from '../sheet/fps/TabPaneFps';
import { TabPaneFlag } from '../timer-shaft/TabPaneFlag';
import { TabPaneBoxChild } from '../sheet/cpu/TabPaneBoxChild';
import { TabPaneNMStatstics } from '../sheet/native-memory/TabPaneNMStatstics';
import { TabPaneNMemory } from '../sheet/native-memory/TabPaneNMemory';
import { TabPaneNMSampleList } from '../sheet/native-memory/TabPaneNMSampleList';
import { TabpanePerfProfile } from '../sheet/hiperf/TabPerfProfile';
import { TabPanePerfSampleChild } from '../sheet/hiperf/TabPerfSampleChild';
import { TabPanePerfSample } from '../sheet/hiperf/TabPerfSampleList';
import { TabPaneLiveProcesses } from '../sheet/ability/TabPaneLiveProcesses';
import { TabPaneHistoryProcesses } from '../sheet/ability/TabPaneHistoryProcesses';
import { TabPaneCpuAbility } from '../sheet/ability/TabPaneCpuAbility';
import { TabPaneMemoryAbility } from '../sheet/ability/TabPaneMemoryAbility';
import { TabPaneDiskAbility } from '../sheet/ability/TabPaneDiskAbility';
import { TabPaneNetworkAbility } from '../sheet/ability/TabPaneNetworkAbility';
import { TabPaneFileStatistics } from '../sheet/file-system/TabPaneFilesystemStatistics';
import { TabpaneFilesystemCalltree } from '../sheet/file-system/TabPaneFileSystemCalltree';
import { TabPaneFileSystemEvents } from '../sheet/file-system/TabPaneFileSystemEvents';
import { TabPaneFileSystemDescHistory } from '../sheet/file-system/TabPaneFileSystemDescHistory';
import { TabPaneFileSystemDescTimeSlice } from '../sheet/file-system/TabPaneFileSystemDescTimeSlice';
import { TabPaneSdkSlice } from '../sheet/sdk/TabPaneSdkSlice';
import { TabPaneSdkCounter } from '../sheet/sdk/TabPaneSdkCounter';
import { TabPaneCounterSample } from '../sheet/cpu/TabPaneCounterSample';
import { TabPaneThreadStates } from '../sheet/process/TabPaneThreadStates';
import { TabPaneThreadUsage } from '../sheet/process/TabPaneThreadUsage';
import { TabPaneFrequencySample } from '../sheet/cpu/TabPaneFrequencySample';
import { TabPaneEnergyAnomaly } from '../sheet/energy/TabPaneEnergyAnomaly';
import { TabPaneSystemDetails } from '../sheet/energy/TabPaneSystemDetails';
import { TabPanePowerDetails } from '../sheet/energy/TabPanePowerDetails';
import { TabPanePowerBattery } from '../sheet/energy/TabPanePowerBattery';
import { TabPaneCpuStateClick } from '../sheet/cpu/TabPaneCpuStateClick';
import { TabPaneVirtualMemoryStatistics } from '../sheet/file-system/TabPaneVirtualMemoryStatistics';
import { TabPaneIOTierStatistics } from '../sheet/file-system/TabPaneIOTierStatistics';
import { TabPaneIOCallTree, TabPaneVMCallTree } from '../sheet/file-system/TabPaneIOCallTree';
import { TabPaneIoCompletionTimes } from '../sheet/file-system/TabPaneIoCompletionTimes';
import { TabPaneVirtualMemoryEvents } from '../sheet/file-system/TabPaneVMEvents';
import { TabPaneSmapsStatistics } from '../sheet/smaps/TabPaneSmapsStatistics';
import { TabPaneSmapsSample } from '../sheet/smaps/TabPaneSmapsSample';
import { TabPaneFreqLimit } from '../sheet/freq/TabPaneFreqLimit';
import { TabPaneCpuFreqLimits } from '../sheet/freq/TabPaneCpuFreqLimits';
import { TabpaneNMCalltree } from '../sheet/native-memory/TabPaneNMCallTree';
import { TabPaneClockCounter } from '../sheet/clock/TabPaneClockCounter';
import { TabPaneXpowerCounter } from '../sheet/xpower/TabPaneXpowerCounter';
import { TabPaneXpowerComponentTop } from '../sheet/xpower/TabPaneXpowerComponentTop';
import { TabPaneXpowerComponentAudio } from '../sheet/xpower/TabPaneXpowerComponentAudio';
import { TabPaneXpowerComponentDisplay } from '../sheet/xpower/TabPaneXpowerComponentDisplay';
import { TabPaneXpowerComponentCamera } from '../sheet/xpower/TabPaneXpowerComponentCamera';
import { TabPaneXpowerComponentCpu } from '../sheet/xpower/TabPaneXpowerComponentCpu';
import { TabPaneXpowerStatistic } from '../sheet/xpower/TabPaneXpowerStatistic';
import { TabPaneXpowerWifiBytes } from '../sheet/xpower/TabPaneXpowerWifiBytes';
import { TabPaneXpowerWifiPackets } from '../sheet/xpower/TabPaneXpowerWifiPackets';
import { TabPaneXpowerDisplay } from '../sheet/xpower/TabPaneXpowerAppDetailDisplay';
import { TabPaneXpowerStatisticCurrentData } from '../sheet/xpower/TabPaneXpowerStatisticCurrentData';
import { TabPaneXpowerThreadEnergy } from '../sheet/xpower/TabPaneXpowerThreadEnergy';
import { TabPaneXpowerThreadLoad } from '../sheet/xpower/TabPaneXpowerThreadLoad';
import { TabPaneXpowerThreadInfoSelection } from '../sheet/xpower/TabPaneXpowerThreadInfoSelection';
import { TabPaneXpowerGpuFreq } from '../sheet/xpower/TabPaneXpowerGpuFreq';
import { TabPaneXpowerGpuFreqSelection } from '../sheet/xpower/TabPaneXpowerGpuFreqSelection';
import { TabPaneHang } from '../sheet/hang/TabPaneHang';
import { TabPaneHangSummary } from '../sheet/hang/TabPaneHangSummary';
import { TabPaneIrqCounter } from '../sheet/irq/TabPaneIrqCounter';
import { TabPaneFrames } from '../sheet/jank/TabPaneFrames';
import { TabPanePerfAnalysis } from '../sheet/hiperf/TabPanePerfAnalysis';
import { TabPaneNMStatisticAnalysis } from '../sheet/native-memory/TabPaneNMStatisticAnalysis';
import { TabPaneFilesystemStatisticsAnalysis } from '../sheet/file-system/TabPaneFilesystemStatisticsAnalysis';
import { TabPaneIOTierStatisticsAnalysis } from '../sheet/file-system/TabPaneIOTierStatisticsAnalysis';
import { TabPaneVirtualMemoryStatisticsAnalysis } from '../sheet/file-system/TabPaneVirtualMemoryStatisticsAnalysis';
import { TabPaneCurrent } from '../sheet/TabPaneCurrent';
import { TabPaneStartup } from '../sheet/process/TabPaneStartup';
import { TabPaneSysCall } from '../sheet/process/TabPaneSysCall';
import { TabPaneStaticInit } from '../sheet/process/TabPaneStaticInit';
import { TabPaneTaskFrames } from '../sheet/task/TabPaneTaskFrames';
import { TabPaneFrameDynamic } from '../sheet/frame/TabPaneFrameDynamic';
import { TabFrameSpacing } from '../sheet/frame/TabFrameSpacing';
import { TabPaneSummary } from '../sheet/ark-ts/TabPaneSummary';
import { TabPaneComparison } from '../sheet/ark-ts/TabPaneComparison';
import { TabPaneJsCpuTopDown } from '../sheet/ark-ts/TabPaneJsCpuCallTree';
import { TabPaneJsCpuBottomUp } from '../sheet/ark-ts/TabPaneJsCpuBottomUp';
import { TabPaneJsCpuStatistics } from '../sheet/ark-ts/TabPaneJsCpuStatistics';
import { TabPaneGpuClickSelect } from '../sheet/gpu/TabPaneGpuClickSelect';
import { TabPaneGpuTotalBoxSelect } from '../sheet/gpu/TabPaneGpuTotalBoxSelect';
import { TabPaneGpuWindowBoxSelect } from '../sheet/gpu/TabPaneGpuWindowBoxSelect';
import { TabPaneGpuGL } from '../sheet/gpu/TabPaneGpuGL';
import { TabPanePurgTotal } from '../sheet/ability/TabPanePurgTotal';
import { TabPanePurgTotalSelection } from '../sheet/ability/TabPanePurgTotalSelection';
import { TabPanePurgPin } from '../sheet/ability/TabPanePurgPin';
import { TabPanePurgPinSelection } from '../sheet/ability/TabPanePurgPinSelection';
import { TabPaneVmTrackerShmSelection } from '../sheet/vmtracker/TabPaneVmTrackerShmSelection';
import { TabPaneVmTrackerShm } from '../sheet/vmtracker/TabPaneVmTrackerShm';
import { TabPaneDmaAbility } from '../sheet/ability/TabPaneDmaAbility';
import { TabPaneDmaSelectAbility } from '../sheet/ability/TabPaneDmaSelectAbility';
import { TabPaneGpuMemoryAbility } from '../sheet/ability/TabPaneGpuMemoryAbility';
import { TabPaneDmaVmTracker } from '../sheet/vmtracker/TabPaneDmaVmTracker';
import { TabPaneGpuMemoryVmTracker } from '../sheet/vmtracker/TabPaneGpuMemoryVmTracker';
import { TabPaneGpuMemorySelectAbility } from '../sheet/ability/TabPaneGpuMemorySelectAbility';
import { TabPaneGpuMemorySelectVmTracker } from '../sheet/vmtracker/TabPaneGpuMemorySelectVmTracker';
import { TabPaneDmaSelectVmTracker } from '../sheet/vmtracker/TabPaneDmaSelectVmTracker';
import { TabpanePerfBottomUp } from '../sheet/hiperf/TabPerfBottomUp';
import { TabPanePurgTotalComparisonAbility } from '../sheet/ability/TabPanePurgTotalComparisonAbility';
import { TabPanePurgPinComparisonAbility } from '../sheet/ability/TabPanePurgPinComparisonAbility';
import { TabPanePurgTotalComparisonVM } from '../sheet/vmtracker/TabPanePurgTotalComparisonVM';
import { TabPanePurgPinComparisonVM } from '../sheet/vmtracker/TabPanePurgPinComparisonVM';
import { TabPaneDmaAbilityComparison } from '../sheet/ability/TabPaneDmaAbilityComparison';
import { TabPaneGpuMemoryComparison } from '../sheet/ability/TabPaneGpuMemoryComparison';
import { TabPaneDmaVmTrackerComparison } from '../sheet/vmtracker/TabPaneDmaVmTrackerComparison';
import { TabPaneGpuMemoryVmTrackerComparison } from '../sheet/vmtracker/TabPaneGpuMemoryVmTrackerComparison';
import { TabPaneVmTrackerShmComparison } from '../sheet/vmtracker/TabPaneVmTrackerShmComparison';
import { TabPaneSmapsComparison } from '../sheet/smaps/TabPaneSmapsComparison';
import { TabPaneSmapsRecord } from '../sheet/smaps/TabPaneSmapsRecord';
import { TabPaneGpuClickSelectComparison } from '../sheet/gpu/TabPaneGpuClickSelectComparison';
import { TabPaneHiLogs } from '../sheet/hilog/TabPaneHiLogs';
import { TabPaneHiLogSummary } from '../sheet/hilog/TabPaneHiLogSummary';
import { TabPaneSchedPriority } from '../sheet/cpu/TabPaneSchedPriority';
import { TabPaneGpuResourceVmTracker } from '../sheet/vmtracker/TabPaneGpuResourceVmTracker';
import { TabPaneGpuGraph } from '../sheet/gpu/TabPaneGraph';
import { TabPaneFreqUsage } from '../sheet/frequsage/TabPaneFreqUsage';
import { TabPaneHisysEvents } from '../sheet/hisysevent/TabPaneHisysEvents';
import { TabPaneHiSysEventSummary } from '../sheet/hisysevent/TabPaneHiSysEventSummary';
import { TabPaneBinders } from '../sheet/binder/TabPaneBinders';
import { TabPaneGpufreq } from '../sheet/gpufreq/TabPaneGpufreqUsage';
import { TabPaneSampleInstruction } from '../sheet/bpftrace/TabPaneSampleInstruction';
import { TabPaneDataCut } from '../sheet/TabPaneDataCut';
import { TabPaneGpuCounterSelection } from '../sheet/gpu-counter/TabPaneGpuCounterSelection';
import { TabPaneGpuCounter } from '../sheet/gpu-counter/TabPaneGpuCounter';
import { TabPaneTimeParallel } from '../sheet/parallel/TabPaneTimeParallel';
import { TabPaneMtParallel } from '../sheet/parallel/TabPaneMtParallel';
import { TabPanePerfAsync } from '../sheet/hiperf/TabPerfAsyncList';
import { TabPaneUserPlugin } from '../sheet/userPlugin/TabPaneUserPlugin';
import { TabPaneDmaFence } from '../sheet/dma-fence/TabPaneDmaFenceSelect';
import { TabPaneSliceChild } from '../sheet/process/TabPaneSliceChild';
import { TabPaneSysCallChild } from '../sheet/process/TabPaneSysCallChild';
import { TabPerfFuncAsm } from '../sheet/hiperf/TabPerfFuncAsm';

export let tabConfig: {
  [key: string]: {
    title: string
    type: unknown
    require?: (param: SelectionParam) => boolean
  }
} = {
  'current-selection': {
    title: 'Current Selection',
    type: TabPaneCurrentSelection,
  }, //cpu data click
  'cpu-state-click': {
    title: 'Cpu State',
    type: TabPaneCpuStateClick,
  },
  'box-freq': {
    title: 'Frequency',
    type: TabPaneFreq,
  }, //freq data click
  'box-freq-limit': {
    title: 'Frequency Limits',
    type: TabPaneFreqLimit,
  },
  'box-cpu-freq-limit': {
    title: 'Cpu Frequency Limits',
    type: TabPaneCpuFreqLimits,
    require: (param: SelectionParam) => param.cpuFreqLimit.length > 0,
  },
  'box-cpu-thread': {
    title: 'CPU by thread',
    type: TabPaneCpuByThread,
    require: (param: SelectionParam) => param.cpus.length > 0,
  }, //range select
  'box-cpu-process': {
    title: 'CPU by process',
    type: TabPaneCpuByProcess,
    require: (param: SelectionParam) => param.cpus.length > 0,
  },
  'box-cpu-usage': {
    title: 'CPU Usage',
    type: TabPaneCpuUsage,
    require: (param: SelectionParam) => param.cpus.length > 0,
  },
  'box-spt': {
    title: 'Thread Switches',
    type: TabPaneSPT,
    require: (param: SelectionParam) => param.cpus.length > 0,
  },
  'box-pts': {
    title: 'Thread States',
    type: TabPanePTS,
    require: (param: SelectionParam) => param.cpus.length > 0,
  },
  'box-thread-states': {
    title: 'Thread by State',
    type: TabPaneThreadStates,
    require: (param: SelectionParam) => param.threadIds.length > 0,
  },
  'box-process-startup': {
    title: 'App Startups',
    type: TabPaneStartup,
    require: (param: SelectionParam) => param.processIds.length > 0 && param.startup,
  },
  'box-thread-syscall': {
    title: 'SysCall Event',
    type: TabPaneSysCall,
    require: (param: SelectionParam) => param.processSysCallIds.length > 0 || param.threadSysCallIds.length > 0,
  },
  'box-thread-syscall-child': {
    title: '',
    type: TabPaneSysCallChild,
  },
  'box-process-static-init': {
    title: 'Static Initialization',
    type: TabPaneStaticInit,
    require: (param: SelectionParam) => param.processIds.length > 0 && param.staticInit,
  },
  'box-thread-usage': {
    title: 'Thread Usage',
    type: TabPaneThreadUsage,
    require: (param: SelectionParam) => param.threadIds.length > 0,
  },
  'box-slices': {
    title: 'Slices',
    type: TabPaneSlices,
    require: (param: SelectionParam) => param.funTids.length > 0 || param.funAsync.length > 0 || param.funCatAsync.length > 0,
  },
  'box-perf-analysis': {
    title: 'Analysis',
    type: TabPanePerfAnalysis,
    require: (param: SelectionParam) => param.perfSampleIds.length > 0,
  },
  'box-perf-bottom-up': {
    title: 'Bottom Up',
    type: TabpanePerfBottomUp,
    require: (param: SelectionParam) => param.perfSampleIds.length > 0,
  },
  'box-perf-profile': {
    title: 'Perf Profile',
    type: TabpanePerfProfile,
    require: (param: SelectionParam) => param.perfSampleIds.length > 0 || param.threadIds.length > 0,
  },
  'box-perf-sample': {
    title: 'Sample List',
    type: TabPanePerfSample,
    require: (param: SelectionParam) => param.perfSampleIds.length > 0,
  },
  'box-perf-sample-child': {
    title: '',
    type: TabPanePerfSampleChild
  },
  'box-perf-async': {
    title: 'Async Call Profile',
    type: TabPanePerfAsync,
    require: (param: SelectionParam) => param.perfSampleIds.length > 0,
  },
  'box-counters': {
    title: 'Counters',
    type: TabPaneCounter,
    require: (param: SelectionParam) => param.processTrackIds.length > 0 || param.virtualTrackIds.length > 0,
  },
  'box-clock-counters': {
    title: 'Clock Counters',
    type: TabPaneClockCounter,
    require: (param: SelectionParam) => param.clockMapData.size > 0,
  },
  'box-xpower-counters': {
    title: 'Xpower Counters',
    type: TabPaneXpowerCounter,
    require: (param: SelectionParam) => param.xpowerMapData.size > 0,
  },
  'box-xpower-component-top': {
    title: 'Xpower Component Top',
    type: TabPaneXpowerComponentTop,
    require: (param: SelectionParam) => param.xpowerComponentTopMapData.size > 0,
  },
  'box-xpower-statistic': {
    title: 'Xpower Statistic',
    type: TabPaneXpowerStatistic,
    require: (param: SelectionParam) => param.xpowerStatisticMapData.size > 0,
  },
  'box-xpower-display': {
    title: 'Xpower Display Detail',
    type: TabPaneXpowerDisplay,
    require: (param: SelectionParam) => param.xpowerDisplayMapData.size > 0,
  },
  'box-xpower-wifiPackets': {
    title: 'Xpower WifiPackets',
    type: TabPaneXpowerWifiPackets,
    require: (param: SelectionParam) => param.xpowerWifiPacketsMapData.size > 0,
  },
  'box-xpower-wifiBytes': {
    title: 'Xpower WifiBytes',
    type: TabPaneXpowerWifiBytes,
    require: (param: SelectionParam) => param.xpowerWifiBytesMapData.size > 0,
  },
  'box-xpower-statistic-current-data': {
    title: 'Xpower Statistic Current Data',
    type: TabPaneXpowerStatisticCurrentData,
  },
  'box-xpower-thread-energy': {
    title: 'Xpower Thread energy',
    type: TabPaneXpowerThreadEnergy,
    require: (param: SelectionParam) => param.xpowerThreadEnergyMapData.size > 0,
  },
  'box-xpower-thread-load': {
    title: 'Xpower Thread Load',
    type: TabPaneXpowerThreadLoad,
    require: (param: SelectionParam) => param.xpowerThreadLoadMapData.size > 0,
  },
  'box-xpower-gpu-freq': {
    title: 'Xpower Gpu Frequency',
    type: TabPaneXpowerGpuFreq,
    require: (param: SelectionParam) => param.xpowerGpuFreqMapData.size > 0,
  },
  'box-hang': {
    title: 'Hangs',
    type: TabPaneHang,
    require: (param: SelectionParam) => param.hangMapData.size > 0,
  },
  'box-hang-summary': {
    title: 'Hang Summary',
    type: TabPaneHangSummary,
    require: (param: SelectionParam) => param.hangMapData.size > 0,
  },
  'box-irq-counters': {
    title: 'Irq Counters',
    type: TabPaneIrqCounter,
    require: (param: SelectionParam) => param.irqCallIds.length > 0 || param.softIrqCallIds.length > 0,
  },
  'box-fps': {
    title: 'FPS',
    type: TabPaneFps,
    require: (param: SelectionParam) => param.hasFps,
  },
  'box-cpu-child': {
    title: '',
    type: TabPaneBoxChild,
  },
  'box-native-statstics': {
    title: 'Statistics',
    type: TabPaneNMStatstics,
    require: (param: SelectionParam) => param.nativeMemory.length > 0,
  },
  'box-native-statistic-analysis': {
    title: 'Analysis',
    type: TabPaneNMStatisticAnalysis,
    require: (param: SelectionParam) => param.nativeMemory.length > 0 || param.nativeMemoryStatistic.length > 0,
  },
  'box-native-calltree': {
    title: 'Call Info',
    type: TabpaneNMCalltree,
    require: (param: SelectionParam) => param.nativeMemory.length > 0 || param.nativeMemoryStatistic.length > 0,
  },
  'box-native-memory': {
    title: 'Native Memory',
    type: TabPaneNMemory,
    require: (param: SelectionParam) => param.nativeMemory.length > 0,
  },
  'box-native-sample': {
    title: 'Snapshot List',
    type: TabPaneNMSampleList,
    require: (param: SelectionParam) => param.nativeMemory.length > 0,
  },

  'box-live-processes-child': {
    title: 'Live Processes',
    type: TabPaneLiveProcesses,
    require: (param: SelectionParam) =>
      param.cpuAbilityIds.length > 0 ||
      (param.memoryAbilityIds.length > 0 && param.diskAbilityIds.length > 0) ||
      param.networkAbilityIds.length > 0,
  },
  'box-history-processes-child': {
    title: 'Processes History',
    type: TabPaneHistoryProcesses,
    require: (param: SelectionParam) =>
      param.cpuAbilityIds.length > 0 ||
      param.memoryAbilityIds.length > 0 ||
      param.diskAbilityIds.length > 0 ||
      param.networkAbilityIds.length > 0,
  },
  'box-system-cpu-child': {
    title: 'System CPU Summary',
    type: TabPaneCpuAbility,
    require: (param: SelectionParam) => param.cpuAbilityIds.length > 0,
  },
  'box-system-memory-child': {
    title: 'System Memory Summary',
    type: TabPaneMemoryAbility,
    require: (param: SelectionParam) => param.memoryAbilityIds.length > 0,
  },
  'box-system-diskIo-child': {
    title: 'System Disk Summary',
    type: TabPaneDiskAbility,
    require: (param: SelectionParam) => param.diskAbilityIds.length > 0,
  },
  'box-system-network-child': {
    title: 'System Network Summary',
    type: TabPaneNetworkAbility,
    require: (param: SelectionParam) => param.networkAbilityIds.length > 0,
  },
  'box-sdk-slice-child': {
    title: 'Sdk Slice',
    type: TabPaneSdkSlice,
    require: (param: SelectionParam) => param.sdkSliceIds.length > 0,
  },
  'box-system-counter-child': {
    title: 'SDK Counter',
    type: TabPaneSdkCounter,
    require: (param: SelectionParam) => param.sdkCounterIds.length > 0,
  },
  'box-counter-sample': {
    title: 'Cpu State',
    type: TabPaneCounterSample,
    require: (param: SelectionParam) => param.cpuStateFilterIds.length > 0,
  },

  'box-frequency-sample': {
    title: 'Cpu Frequency',
    type: TabPaneFrequencySample,
    require: (param: SelectionParam) => param.cpuFreqFilterIds.length > 0,
  },
  'box-anomaly-details': {
    title: 'Anomaly details',
    type: TabPaneEnergyAnomaly,
    require: (param: SelectionParam) => param.anomalyEnergy.length > 0,
  },
  'box-system-details': {
    title: 'System Details',
    type: TabPaneSystemDetails,
    require: (param: SelectionParam) => param.systemEnergy.length > 0,
  },
  'box-power-battery': {
    title: 'Power Battery',
    type: TabPanePowerBattery,
    require: (param: SelectionParam) => param.powerEnergy.length > 0,
  },
  'box-power-details': {
    title: 'Power Details',
    type: TabPanePowerDetails,
    require: (param: SelectionParam) => param.powerEnergy.length > 0,
  },
  'box-file-system-statistics': {
    title: 'Filesystem statistics',
    type: TabPaneFileStatistics,
    require: (param: SelectionParam) => param.fileSystemType.length > 0,
  },
  'box-file-system-statistics-analysis': {
    title: 'Analysis',
    type: TabPaneFilesystemStatisticsAnalysis,
    require: (param: SelectionParam) => param.fileSystemType.length > 0,
  },
  'box-file-system-calltree': {
    title: 'Filesystem Calltree',
    type: TabpaneFilesystemCalltree,
    require: (param: SelectionParam) => param.fileSystemType.length > 0 || param.fsCount > 0,
  },
  'box-file-system-event': {
    title: 'Filesystem Events',
    type: TabPaneFileSystemEvents,
    require: (param: SelectionParam) => param.fileSystemType.length > 0,
  },
  'box-file-system-desc-history': {
    title: 'File Descriptor History',
    type: TabPaneFileSystemDescHistory,
    require: (param: SelectionParam) => param.fileSystemType.length > 0,
  },
  'box-file-system-desc-time-slice': {
    title: 'File Descriptor Time Slice',
    type: TabPaneFileSystemDescTimeSlice,
    require: (param: SelectionParam) => param.fileSystemType.length > 0,
  },
  'box-virtual-memory-statistics': {
    title: 'Page Fault Statistics',
    type: TabPaneVirtualMemoryStatistics,
    require: (param: SelectionParam) => param.fileSysVirtualMemory,
  },
  'box-virtual-memory-statistics-analysis': {
    title: 'Analysis',
    type: TabPaneVirtualMemoryStatisticsAnalysis,
    require: (param: SelectionParam) => param.fileSysVirtualMemory,
  },
  'box-vm-calltree': {
    title: 'Page Fault CallTree',
    type: TabPaneVMCallTree,
    require: (param: SelectionParam) => param.fileSysVirtualMemory || param.vmCount > 0,
  },
  'box-vm-events': {
    title: 'Page Fault Events',
    type: TabPaneVirtualMemoryEvents,
    require: (param: SelectionParam) => param.fileSysVirtualMemory,
  },
  'box-io-tier-statistics': {
    title: 'Disk I/O Tier Statistics',
    type: TabPaneIOTierStatistics,
    require: (param: SelectionParam) => param.diskIOLatency,
  },
  'box-io-tier-statistics-analysis': {
    title: 'Analysis',
    type: TabPaneIOTierStatisticsAnalysis,
    require: (param: SelectionParam) => param.diskIOLatency,
  },
  'box-io-calltree': {
    title: 'Disk I/O Latency Calltree',
    type: TabPaneIOCallTree,
    require: (param: SelectionParam) => param.diskIOLatency || param.diskIOipids.length > 0,
  },
  'box-io-events': {
    title: 'Trace Completion Times',
    type: TabPaneIoCompletionTimes,
    require: (param: SelectionParam) => param.diskIOLatency,
  },
  'box-smaps-statistics': {
    title: 'Smaps Statistic',
    type: TabPaneSmapsStatistics,
    require: (param: SelectionParam) => param.smapsType.length > 0,
  },
  'box-smaps-sample': {
    title: 'Smaps sample',
    type: TabPaneSmapsSample,
    require: (param: SelectionParam) => param.smapsType.length > 0,
  },
  'box-smaps-comparison': {
    title: 'Smaps Comparison',
    type: TabPaneSmapsComparison,
  },
  'box-smaps-record': {
    title: 'Native Heap',
    type: TabPaneSmapsRecord,
  },
  'box-vmtracker-shm': {
    title: 'SHM',
    type: TabPaneVmTrackerShm,
    require: (param: SelectionParam) => param.vmtrackershm.length > 0,
  },
  'box-vmtracker-shm-selection': {
    title: 'SHM Selection',
    type: TabPaneVmTrackerShmSelection,
  },
  'box-frames': {
    title: 'Frames',
    type: TabPaneFrames,
    require: (param: SelectionParam) => param.jankFramesData.length > 0,
  },
  'box-heap-summary': {
    title: 'Summary',
    type: TabPaneSummary,
    require: (param: SelectionParam) => param.jsMemory.length > 0,
  },
  'box-heap-comparison': {
    title: 'Comparison',
    type: TabPaneComparison,
  }, // snapshot data click
  'box-task-frames': {
    title: 'Frames',
    type: TabPaneTaskFrames,
    require: (param: SelectionParam) => param.taskFramesData.length > 0,
  },
  'box-frame-dynamic': {
    title: 'Frame Dynamic',
    type: TabPaneFrameDynamic,
    require: (param: SelectionParam) => param.frameDynamic.length > 0,
  },
  'box-frames-spacing': {
    title: 'Frame spacing',
    type: TabFrameSpacing,
    require: (param: SelectionParam) => param.frameSpacing.length > 0,
  },
  'box-js-Profiler-statistics': {
    title: 'Js Profiler Statistics',
    type: TabPaneJsCpuStatistics,
    require: (param: SelectionParam) => param.jsCpuProfilerData.length > 0,
  },
  'box-js-Profiler-bottom-up': {
    title: 'Js Profiler BottomUp',
    type: TabPaneJsCpuBottomUp,
    require: (param: SelectionParam) => param.jsCpuProfilerData.length > 0,
  },
  'box-js-Profiler-top-down': {
    title: 'Js Profiler CallTree',
    type: TabPaneJsCpuTopDown,
    require: (param: SelectionParam) => param.jsCpuProfilerData.length > 0,
  },
  'gpu-click-select': {
    title: 'Gpu Dump Selection',
    type: TabPaneGpuClickSelect,
  },
  'gpu-gl-box-select': {
    title: 'GL',
    type: TabPaneGpuGL,
    require: (param: SelectionParam) => param.gpu.gl,
  },
  'gpu-graph-box-select': {
    title: 'Graph',
    type: TabPaneGpuGraph,
    require: (param: SelectionParam) => param.gpu.graph,
  },
  'gpu-total-box-select': {
    title: 'Gpu Total',
    type: TabPaneGpuTotalBoxSelect,
    require: (param: SelectionParam) => param.gpu.gpuTotal,
  },
  'gpu-window-box-select': {
    title: 'Gpu Window',
    type: TabPaneGpuWindowBoxSelect,
    require: (param: SelectionParam) => param.gpu.gpuWindow,
  },
  'box-purgeable-total': {
    title: 'Purg Total',
    type: TabPanePurgTotal,
    require: (param: SelectionParam) => param.purgeableTotalAbility.length > 0 || param.purgeableTotalVM.length > 0,
  },
  'box-purgeable-total-selection': {
    title: 'Purg Total Selection',
    type: TabPanePurgTotalSelection,
  },
  'box-purgeable-pin': {
    title: 'Purg Pin',
    type: TabPanePurgPin,
    require: (param: SelectionParam) => param.purgeablePinAbility.length > 0 || param.purgeablePinVM.length > 0,
  },
  'box-purgeable-pin-selection': {
    title: 'Purg Pin Selection',
    type: TabPanePurgPinSelection,
  },
  'box-purgeable-total-comparison-ability': {
    title: 'Purg Total Comparison',
    type: TabPanePurgTotalComparisonAbility,
  },
  'box-purgeable-pin-comparison-ability': {
    title: 'Purg Pin Comparison',
    type: TabPanePurgPinComparisonAbility,
  },
  'box-purgeable-total-comparison-vm': {
    title: 'Purg Total Comparison',
    type: TabPanePurgTotalComparisonVM,
  },
  'box-purgeable-pin-comparison-vm': {
    title: 'Purg Pin Comparison',
    type: TabPanePurgPinComparisonVM,
  },
  'box-dma-ability': {
    title: 'DMA',
    type: TabPaneDmaAbility,
    require: (param: SelectionParam) => param.dmaAbilityData.length > 0,
  },
  'box-dma-selection-ability': {
    title: 'DMA Selection',
    type: TabPaneDmaSelectAbility,
  }, //DMA Ability click
  'box-gpu-memory-ability': {
    title: 'Gpu Memory',
    type: TabPaneGpuMemoryAbility,
    require: (param: SelectionParam) => param.gpuMemoryAbilityData.length > 0,
  },
  'box-smaps-dma': {
    title: 'DMA',
    type: TabPaneDmaVmTracker,
    require: (param: SelectionParam) => param.dmaVmTrackerData.length > 0,
  },
  'box-smaps-gpu-memory': {
    title: 'Gpu Memory',
    type: TabPaneGpuMemoryVmTracker,
    require: (param: SelectionParam) => param.gpuMemoryTrackerData.length > 0,
  },
  'box-smaps-gpu-resource': {
    title: 'Gpu Resource',
    type: TabPaneGpuResourceVmTracker,
  },
  'box-dma-selection-vmTracker': {
    title: 'DMA Selection',
    type: TabPaneDmaSelectVmTracker,
  }, //DMA VmTracker click
  'box-gpu-memory-selection-ability': {
    title: 'Gpu Memory Selection',
    type: TabPaneGpuMemorySelectAbility,
  }, // Gpu Memory ability click
  'box-gpu-memory-selection-vmTracker': {
    title: 'Gpu Memory Selection',
    type: TabPaneGpuMemorySelectVmTracker,
  }, //Gpu Memory DMA VmTracker click
  'box-dma-ability-comparison': {
    title: 'DMA Comparison',
    type: TabPaneDmaAbilityComparison,
  }, // dma Comparison ability click
  'box-gpu-memory-comparison': {
    title: 'Gpu Memory Comparison',
    type: TabPaneGpuMemoryComparison,
  }, // Gpu Memory Comparison click
  'box-vmTracker-comparison': {
    title: 'DMA Comparison',
    type: TabPaneDmaVmTrackerComparison,
  }, // DMA Comparison click
  'box-gpu-memory-vmTracker-comparison': {
    title: 'Gpu Memory Comparison',
    type: TabPaneGpuMemoryVmTrackerComparison,
  }, // DMA Comparison click
  'box-vmtracker-shm-comparison': {
    title: 'SHM Comparison',
    type: TabPaneVmTrackerShmComparison,
  },
  'gpu-click-select-comparison': {
    title: 'Gpu Dump Comparison',
    type: TabPaneGpuClickSelectComparison,
  },
  'box-hilogs': {
    title: 'Hilogs',
    type: TabPaneHiLogs,
    require: (param: SelectionParam) => param.hiLogs.length > 0,
  },
  'box-hilogs-summary': {
    title: 'Summary',
    type: TabPaneHiLogSummary,
    require: (param: SelectionParam) => param.hiLogs.length > 0,
  },
  'box-sched-priority': {
    title: 'Sched Priority',
    type: TabPaneSchedPriority,
    require: (param: SelectionParam) => param.cpus.length > 0,
  },
  'box-flag': {
    title: 'Flags Selection',
    type: TabPaneFlag,
  },
  'tabpane-current': {
    title: 'M Selection',
    type: TabPaneCurrent,
    require: (param: SelectionParam) => param.isCurrentPane,
  }, //current selection
  'tabpane-frequsage': {
    title: 'Freq Usage',
    type: TabPaneFreqUsage,
    require: (param: SelectionParam) => param.threadIds.length > 0,
  },
  'tab-hisysevents': {
    title: 'HiSysevents',
    type: TabPaneHisysEvents,
    require: (param: SelectionParam) => param.hiSysEvents.length > 0,
  },
  'tab-hisysevents-summary': {
    title: 'Statistics',
    type: TabPaneHiSysEventSummary,
    require: (param: SelectionParam) => param.hiSysEvents.length > 0,
  },
  'tabpane-gpufreq': {
    title: 'Gpufreq Usage',
    type: TabPaneGpufreq,
    require: (param: SelectionParam) => param.clockMapData.size === 1 && param.clockMapData.has('gpufreq Frequency') === true,
  },
  'tabpane-datacut': {
    title: 'Data Cut',
    type: TabPaneDataCut,
    require: (param: SelectionParam) => param.threadIds.length > 0 ||
      (param.clockMapData.size > 0 && param.clockMapData.has('gpufreq Frequency') === true),
  },
  'box-sample-instruction': {
    title: 'Data Flow',
    type: TabPaneSampleInstruction,
  },
  'box-gpu-counter-selection': {
    title: 'Gpu Counter',
    type: TabPaneGpuCounterSelection,
    require: (param: SelectionParam) => param.gpuCounter.length > 0,
  },
  'box-gpu-counter': {
    title: 'Gpu Counter',
    type: TabPaneGpuCounter,
  },
  'tabpane-time-parallel': {
    title: 'Time Parallel',
    type: TabPaneTimeParallel,
    require: (param: SelectionParam) => param.threadIds.length > 0,
  },
  'tabpane-mt-parallel': {
    title: 'MT Parallel',
    type: TabPaneMtParallel,
    require: (param: SelectionParam) => param.threadIds.length > 0,
  },
  'tab-pane-userplugin': {
    title: 'User Plugin',
    type: TabPaneUserPlugin,
  },
  'tabpane-dmafrence': {
    title: 'Dma Frence',
    type: TabPaneDmaFence,
    require: (param: SelectionParam) => param.dmaFenceNameData.length > 0,
  },
  'box-slice-child': {
    title: '',
    type: TabPaneSliceChild,
  },
  'tab-perf-func-asm': {
    title: '',
    type: TabPerfFuncAsm,
  },
  'box-xpower-thread-info-selection': {
    title: 'Thread Info Selection',
    type: TabPaneXpowerThreadInfoSelection,
  }, //xpower thread info click
  'box-xpower-gpu-freq-selection': {
    title: 'Gpu Freq Selection',
    type: TabPaneXpowerGpuFreqSelection,
  }, //xpower gpu freq click
};
