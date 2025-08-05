# proto文件的格式和protoReader解析的类型对应关系
proto文件中数据类型的定义和其在ProtoReader解析中的类型对应关系如下表所示。
| 基础数据类型 | proto数据类型 | 类型标识 |  
| ------------- | ------------- | ----------- |  
|double, fixed64           |kFixed64      | 1        |
|int32, int64, bool, enum |kVarInt  |0 |
| string                  |kLengthDelimited | 2  |
|float, fixed32            |kFixed32      | 5 | 

关于repeated字段的说明  
除了string类型和自定义消息体（用户自定义的，非基本数据类型），其他基础数据类型在定义前加repeated会被识别为PackedRepeated包裹的类型。
