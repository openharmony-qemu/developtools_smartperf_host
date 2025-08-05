# 关于wakeup事件和waking事件的处理说明
对于trace事件的waking和wakeup处理，我们的策略如下：  
waking是开始唤醒线程，wakeup是线程正式被唤醒，进入runnable（可运行状态）；  
我们的策略是：被唤醒才是真正进入runnable状态。