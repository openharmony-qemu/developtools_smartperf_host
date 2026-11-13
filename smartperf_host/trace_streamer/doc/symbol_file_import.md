# 关于符号文件导入的说明
trace_streamer支持导入符号文件（so文件）来对各种调用栈中涉及的地址进行二次符号化。  
由于抓取的trace文件中初始会携带程序所依赖的符号文件的全路径，因此，在做符号文件导入时，需按如下规则进行符号文件的识别和导入：  
- 1 一个函数地址是否被符号化，不仅取决于其地址范围是否和符号文件的符号地址相匹配，还取决于其符号所在的符号文件全路径，是否和被导入文件的全路径一致；  
- 2 对于Perf数据而言，额外检查了被导入文件的buildId，而ebpf和nativehook由于原始数据未携带buildId，对buildId不做检查。也就是说，对于perf来说，导入的so必须来自于抓取trace的同样系统版本，否则无效。  

基于以上条件，在导入符号文件时，宜对被导入的文件还原其在设备中的原始目录结构，例如，文件目录结构可能如下所示：
```
folder_to_import/system/lib64/libsec_shared.z.so
folder_to_import/system/lib64/libutils.z.so
folder_to_import/system/lib64/libhilog.so
folder_to_import/system/lib64/libskia_ohos.z.so
folder_to_import/system/lib64/libace.z.so
```
请注意，在folder_to_import文件夹之下，其文件的路径和其在设备（开发板）上的路径是一致的。  
此规则对hiperf, ebpf, nativehook通用。

其他需要注意的:  
关于perf文件的so导入操作，原始trace中的文件符号表（perf_files）只会包含调用栈中使用的符号，而导入so后，符号表中包含的是该文件全量的符号信息，会比原有的表更大，而且符号的serial_id也对应会发生变化，但这不影响最终调用栈的显示。