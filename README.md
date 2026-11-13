# Smartperf
## Introduction
The SmartPerf performance tuning tool includes two components: [SmartPerf_Host](./smartperf_host/README.md) and SmartPerf_Device.

SmartPerf_Host is a performance power consumption tuning platform specially designed for OpenHarmony. It analyzes CPU scheduling, frequency points, thread time slices, memory and frame rate data through GUI lane diagrams in fine-grained manner.

SmartPerf_Device contains [device_ui](./smartperf_device/device_ui/README_zh.md) and [device_command](./smartperf_device/device_command/README_zh.md). device_ui provides real-time monitoring of suspended windows, collects CPU/GPU/temperature/power consumption/RAM/FPS and other indicators, and generates local test reports. device_command provides the command line version SP_daemon, which can collect CPU, GPU, Temperature, Power, application RAM, FPS and other indicators. By setting acquisition indicators, the collected data can be printed in real time and exported csv. The two collaborate to achieve a closed loop of deep tuning and real-time monitoring.