# native_hook配置文件解析逻辑
TS通过解析native_hook_config.proto中的配置识别native_hook数据模式。  
理解以下内容，请参考《native_hook_config.proto》和《native_hook_result.proto》  
1. 当statistics_interval有值时，代表抓到的native_hook数据为统计数据， 并且默认使用了调用栈压缩和字符串压缩。  
    包含数据： RecordStatisticsEvent, StackMap(离线符号化时ip生效， 非离线符号化时frame_map_id生效).  
    非离线符号化包含： ThreadNameMap, FilePathMAp, FrameMap， Frame  
    离线符号化包含：SymbolTalbe, MapsInfo。  
    不包含数据：AllocEvent， FreeEvent, MmapEvent, MunmapEvent，MemTagEvent.    
2. 当offline_symbolization为true时， 代表抓到的数据需要离线符号化处理。并且默认使用了调用栈压缩和字符串压缩。  
    生效message包括： SymbolTalbe, MapsInfo  
3. 当callframe_compressed为true时， 代表抓到的数据使用了调用栈压缩。 并且默认使用字符串压缩。  
    生效message包括： StackMap， FrameMap。  
4. 当string_compressed为true时，字符串压缩生效。  
    生效message包括：FilePathMap, SymbolMap, ThreadNameMap(非统计数据生效)。