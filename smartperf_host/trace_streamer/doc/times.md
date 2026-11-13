# 关于时钟号的说明
trace_streamer内部使用了和设备侧同步的时钟号，现将各个时钟号进行记录，并对个别时钟号进行特别说明  
```
TS_CLOCK_UNKNOW = 0,
TS_CLOCK_BOOTTIME = 1,
TS_CLOCK_REALTIME = 2,
TS_CLOCK_REALTIME_COARSE = 3,
TS_MONOTONIC = 4,
TS_MONOTONIC_COARSE = 5,
TS_MONOTONIC_RAW = 6,
```
- boot time  与monotonic时间相同，不过会累加上系统休眠的时间，它代表着系统上电后的总时间。
- monotonic time  该时间自系统开机后就一直单调地增加，它不像xtime可以因用户的调整时间而产生跳变，不过该时间不计算系统休眠的时间，也就是说，系统休眠时，monotoic时间不会递增。
- raw monotonic time  该时间与monotonic时间类似，也是单调递增的时间，唯一的不同是：raw monotonic time“更纯净”，他不会受到NTP时间调整的影响，它代表着系统独立时钟硬件对时间的统计。  
