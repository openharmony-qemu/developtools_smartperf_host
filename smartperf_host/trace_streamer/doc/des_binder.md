# binder事件上下文如何关联
binder事件相对复杂，这里是从ftrace事件中抽离出来的binder相关消息，用来作为开发者或用户追踪binder事件的参考。 
a binder event is identified by the sender and receive device, and a reply message only end
the last binder msg which reply the calling one.  
the alloc_buf msg can always flow the binder_transaction, so we no need to identify the alloc msg with transactionID. 

## TAG TT need reply!!!  needReply = !isReply && !(flags & 0x01)
```
RenderThread-2267  ( 1592) [003] ...1 168766.128108: binder_transaction: transaction=25155526 dest_node=25155471 dest_proc=506 dest_thread=0 reply=0 flags=0x10 code=0x9
RenderThread-2267  ( 1592) [003] ...1 168766.128110: binder_transaction_alloc_buf: transaction=25155526 data_size=120 offsets_size=8
```
### received
```
Binder:506_2-537   (  506) [003] ...1 168766.128154: binder_transaction_received: transaction=25155526
```
### binder is in DB, TAG A needReply
```
Binder:506_2-537   (  506) [003] ...1 168766.128221: binder_transaction: transaction=25155529 dest_node=25155527 dest_proc=1592 dest_thread=2267 reply=0 flags=0x10 code=0x5f474854
Binder:506_2-537   (  506) [003] ...1 168766.128223: binder_transaction_alloc_buf: transaction=25155529 data_size=72 offsets_size=0
```
### the flowing is for TAG A, this is the reply for TAG A
```
RenderThread-2267  ( 1592) [003] ...1 168766.128262: binder_transaction: transaction=25155530 dest_node=0 dest_proc=506 dest_thread=537 reply=1 flags=0x8 code=0x0

RenderThread-2267  ( 1592) [003] ...1 168766.128264: binder_transaction_alloc_buf: transaction=25155530 data_size=4 offsets_size=0
```
### calc the dur of TAG A
```
Binder:506_2-537   (  506) [003] ...1 168766.128288: binder_transaction_received: transaction=25155530
```
### binder last TAG A needReply, this is TAG B needReply!!!
```
Binder:506_2-537   (  506) [003] ...1 168766.128328: binder_transaction: transaction=25155532 dest_node=25155527 dest_proc=1592 dest_thread=2267 reply=0 flags=0x10 code=0x2
Binder:506_2-537   (  506) [003] ...1 168766.128330: binder_transaction_alloc_buf: transaction=25155532 data_size=72 offsets_size=0
```
##	in db
```
RenderThread-2267  ( 1592) [003] ...1 168766.128347: binder_transaction_received: transaction=25155532
```
## the reply message is not in db Session D, this is the reply for TAG B
```
RenderThread-2267  ( 1592) [003] ...1 168766.128361: binder_transaction: transaction=25155533 dest_node=0 dest_proc=506 dest_thread=537 reply=1 flags=0x0 code=0x0
RenderThread-2267  ( 1592) [003] ...1 168766.128363: binder_transaction_alloc_buf: transaction=25155533 data_size=4 offsets_size=0
```
### no this message in db, calcate the dur of TAG B
```
Binder:506_2-537   (  506) [003] ...1 168766.128385: binder_transaction_received: transaction=25155533
```
### no this message in db Session E, this is the reply for TAG TT
```
Binder:506_2-537   (  506) [003] ...1 168766.128412: binder_transaction: transaction=25155534 dest_node=0 dest_proc=1592 dest_thread=2267 reply=1 flags=0x0 code=0x0

Binder:506_2-537   (  506) [003] ...1 168766.128413: binder_transaction_alloc_buf: transaction=25155534 data_size=68 offsets_size=0
```
## the dur of TAG TT is calcated by the flowing msg 
```
RenderThread-2267  ( 1592) [003] ...1 168766.128430: binder_transaction_received: transaction=25155534
```