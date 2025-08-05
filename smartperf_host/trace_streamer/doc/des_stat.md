# TraceStreamer 解析数据状态表
TraceStreamer使用stat表统计解析trace数据源过程遇到的重要事件状态。通过stat表可以对trace数据源中各个类型事件的数据的数量，数据质量有一个基本了解。  
我们对不同类型的数据，统计了收到多少条，数据逻辑是否匹配，是否有不合法数据，是否有数据丢失情况，所有这些，是基于对数据格式本身和数据前后关系的主观认识。欢迎开发者提供更多的思路来帮我们完善数据本身的校验工作。
## stat表支持统计的事件
如[des_support_event.md](des_support_event.md)中所描述。
## 事件对应解析状态 
每种事件解析数据都有5种状态，描述如下表：
|stat_type|description|
|----     |----       |
|received  | 统计trace数据源中总共有多少该事件。|
|data_lost | 统计TraceStreamer解析过程中发现丢失数据条数。 |
|not_match | 统计有多少数据与上下文其他数据不匹配。 |
|not_supported | 统计有多少暂不支持解析该事件（一个事件可能包含多种类型的子事件， TraceStreamer可能支持该事件的一部分子事件）。| 
|invalid_data | 统计收到多少条该事件的非法数据。|

## 数据状态级别
数据状态级别总共有4种，分别是：info, warn, error,fatal。由于数据的重要性不同，不同事件的同一种状态可能对应不同的级别。
例如binder_transaction_received的 not_supported状态的数据为info级别，而binder_transaction_alloc_buf的not_supported状态数据为warn级别。  
可以在src/cfg/trace_streamer_config.cpp的InitSecurityMap方法中自行定义相关事件的优先级。

## 事件，状态与级别对应关系
我们通过一张表，来记录所有事件的解析情况，拿下面这条数据举例：
|	event_name	|	count| stat_type	|	serverity	|
|----           |---|----           |----           |
|	binder_transaction	|12|	received	|	info	|
|	binder_transaction	|1|	data_lost	|	error	|
|	binder_transaction	|3|	not_match	|	info	|
|	binder_transaction	|0|	not_supported	|	info	|
|	binder_transaction	|5|	invalid_data	|	error	|
|	-	|	-	|-|-	|
上面的图表表示：一共收到了12条binder_transaction的数据，其中有3条数据业务上不匹配，有5条数据格式非法。