# Smartperf
## 简介
SmartPerf性能调优工具包含 [SmartPerf_Host](./smartperf_host/README_zh.md) 和 SmartPerf_Device 两大组件。

SmartPerf_Host是专为OpenHarmony打造的性能功耗调优平台，通过GUI泳道图细粒度分析CPU调度、频点、线程时间片、内存及帧率等数据。

SmartPerf_Device包含 [device_ui](./smartperf_device/device_ui/README_zh.md) 和 [device_command](./smartperf_device/device_command/README_zh.md)。device_ui则提供悬浮窗实时监控，采集CPU/GPU/温度/功耗/RAM/FPS等指标，并生成本地测试报告。device_command则提供命令行版本SP_daemon，可采集CPU、GPU、Temperature、Power、应用RAM、FPS等指标，通过设置采集指标，对采集数据进行实时打印、导出csv。二者协同实现深度调优与实时监控闭环。