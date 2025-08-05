
## TS解析htrace数据时间戳的规则
ProfilerPluginData是所有proto格式数据插件的最外层message。  
其中包含多个时间戳。根据name字段反序列化的data字段中包含一个时间戳，一般为具体事件发生的时刻；另外tv_sec, tv_nsec号数据域组成最外层的时间戳，一般为端侧使用该插件采集数据上报的时刻。  
在一些需要精确展示事件时间的业务中, 采用的是data中的时间; 在一些周期性采集统计数据的业务(如：进程的内存数据)中使用的是最外层tv_sec, tv_nsec.  
message ProfilerPluginData {  
    string name = 1;  
    uint32 status = 2;  
    bytes data = 3;  
    enum ClockId {  
        CLOCKID_REALTIME = 0;  
        CLOCKID_REALTIME_ALARM = 1;     // since Linux 3.0; Linux-specific  
        CLOCKID_REALTIME_COARSE = 2;    // since Linux 2.6.32; Linux-specific  
        CLOCKID_TAI = 3;                // since Linux 3.10; Linux-specific  
        CLOCKID_MONOTONIC = 4;  
        CLOCKID_MONOTONIC_COARSE = 5;   // since Linux 2.6.32; Linux-specific  
        CLOCKID_MONOTONIC_RAW = 6;      // since Linux 2.6.28; Linux-specific  
        CLOCKID_BOOTTIME = 7;           // since Linux 2.6.39; Linux-specific  
        CLOCKID_BOOTTIME_ALARM = 8;     // since Linux 3.0; Linux-specific  
        CLOCKID_PROCESS_CPUTIME_ID = 9; // since Linux 2.6.12  
        CLOCKID_THREAD_CPUTIME_ID = 10; // since Linux 2.6.12  
    };  
    ClockId clock_id = 4;  
    uint64 tv_sec = 5;  
    uint64 tv_nsec = 6;  
    string version = 7; // "1.01"  
}  
  
## 解析不同插件数据使用的时间戳对照表  
<table>
    <tr>
        <td></td>
        <td>对应的插件</td>
        <td>对应的业务说明</td>
    </tr>
    <tr>
        <td rowspan="4">使用ProfilerPluginData.data中的时间戳</td>
        <td>ftrace-plugin</td>
        <td>ftrace</td>
    </tr>
    <tr>
        <td>hilog-plugin</td>
        <td>hilog日志</td>
    </tr>
    <tr>
        <td>nativehook</td>
        <td>native_memory(malloc, free, mmap,munmap, 统计事件)</td>
    </tr>
    <tr>
        <td>hidump-plugin</td>
        <td>fps</td>
    </tr>
    <tr>
        <td rowspan="6">使用ProfilerPluginData.tv_sec 和tv_nsec/td>
        <td>memory-plugin</td>
        <td>系统内存</td>
    </tr>
    <tr>
        <td>network-plugin</td>
        <td>网络</td>
    </tr>
    <tr>
        <td>cpu-plugin</td>
        <td>cpu占用率</td>
    </tr>
    <tr>
        <td>process-plugin</td>
        <td>进程内存</td>
    </tr>
    <tr>
        <td>diskio-plugin</td>
        <td>磁盘读写速率</td>
    </tr>
    <tr>
        <td>hisysevent-plugin</td>
        <td>hisysevent</td>
    </tr>
</table>