## 应用操作技巧

应用操作技巧主要展示各个小模块的使用技巧。

### 可导入符号表

符号表导入适用于所有支持调用栈的 Tab 页，创建文件夹，然后将需要导入的so文件放进文件夹内，在导入时，选择该文件夹即可，这样，系统将会获取到该文件夹内所有的so文件，更新数据库中符号数据。文件夹内 so 的格式需要与在设备上的路径一致，例如下图中，选择的文件夹为 import，选择导入的 libnative_hook.z.so，在设备上的路径是/system/lib64/，那么在本地选择的文件夹内也需要保证路径是 import/system/lib64/libnative_hook.z.so。
![GitHub Logo](../../figures/OperationSkills/Operation_soimport_dir.jpg)
以 NativeMemory 举例，导入 NativeMemory 文件，点击 Call info 的 Tab 页，在搜索框中输入 libnative_hook.z.so，会发现该 so 下的调用栈没有符号化完全。
![GitHub Logo](../../figures/OperationSkills/Operation_soimport_nativehook.jpg)
将本地编译的 so 通过导入按钮导入，本地导入路径是 import/system/lib64/libnative_hook.z.so，红框处是导入按钮。
![GitHub Logo](../../figures/OperationSkills/Operation_soimport_local.jpg)
导入 so 以后，在搜索框中输入 libnative_hook.z.so，会发现符号化数据已经更新。
![GitHub Logo](../../figures/OperationSkills/Operation_soimport_new.jpg)

### 网页连接文件打开接口

网页连接文件打开接口可以在网址后增加文件地址，打开后直接打开 trace。
接口的 url 路径如下：
![GitHub Logo](../../figures/OperationSkills/Opertion_urltrace.jpg)

-     蓝色框：是Smartperf工具的url(https://localhost:9000/application/)。
-     绿色框：trace文件的url，其中
                    第一部分是?trace=(固定格式)。
                    第二部分是trace文件的url(https://iot.itocm.com:9001/upload/ftrace_small.txt),此处根据文件的url实际地址填写。
                    第三部分,&link=true(固定格式)。
-     支持打开的trace文件类型: 本工具命令抓取的hiprofiler_data.htrace、hitrace命令行工具抓取的xxx.systrace、xxx.sys等、以上类型的zip压缩文件（压缩包里必须为单文件，压缩算法支持ZIP_DEFLATED和ZIP_BZIP2）、hitrace -z参数生成的压缩trace

### 内容支持宽度可伸缩

在表格每行的表头添加一个灰色竖线，拖动时单元格宽度随之改变。
![GitHub Logo](../../figures/OperationSkills/Tabdrag.jpg)

### 一键展开和收起，逐级展开和收起

将树形表格全部改为默认收起，在表头左上角添加双尖箭头图标,默认箭头朝外，点击图标，表格的每一层都展开，图标上的箭头改为朝里面，再次点击表格每一层都收起，图标上的箭头改为朝外面。
![GitHub Logo](../../figures/OperationSkills/Taboneclick.jpg)

### 支持 shift+m 多次框选，框选列表显示和操作（跳转，取消）,快捷键跳转 ctrl+[/]和一键取消

每次框选泳道图后，按下 shift+m 键，在当前框选的开始和结束位置出现卡尺，如果只按下 m 键，会将上一次按 m 键出现的卡尺清除，在当前框选位置画卡尺，页面上每个卡尺都放进 tab 页中，在 tab 页中可以给卡尺改变颜色和移除旗子。用快捷键改变当前选中的卡尺。按下快捷键“ctrl+[”或“ctrl+]”的时候，会跳转到当前选中卡尺的上\下一个卡尺上，也就是上\下一个卡尺两侧变为实心，对应表格中的那行背景颜色变浅蓝色。

### 旗子标记可快速跳转，框选列表显示和操作（跳转，取消）,快捷跳转 ctrl+,/.和一键取消

在时间刻度下方点击会出现旗子和 tab 页，每次点击都将旗子都放进 tab 页中，在 tab 页中可以给旗子改变颜色和移除旗子。用快捷键改变当前选中的旗子。按下快捷键“ctrl+，”或“ctrl+.”的时候，会跳转到当前选中旗子的上\下一个旗子上，也就是上\下一个旗子变为实心有旗杆，对应表格中的那行背景颜色变浅蓝色。
![GitHub Logo](../../figures/OperationSkills/rowskillflag.jpg)

### 泳道图支持一键收起和展开（收起前的状态）

点击时间刻度的最左边的双箭头，可以对已展开的泳道图进行一键收起和展开。
![GitHub Logo](../../figures/OperationSkills/rowskilon.jpg)

### 单个泳道图显示为多行时可折叠为 1 行（收藏和非收藏）

单个泳道图点击会将泳道图折叠为一行，折腾后的字体是蓝色。
![GitHub Logo](../../figures/OperationSkills/Tabskillfold.jpg)

### 已支持的泳道图按照模板分类显示，NaitveMemory，Hisysevent，应用内存等

导入 trace 文件后，页面右上角的出现漏斗图标，点击会出现 Display Template 页面，Template Select 区域显示已经添加到显示模板中的泳道图，每类泳道图后面会有一个多选框，默认不勾选，如果勾选页面上就只保留勾选的泳道图。
![GitHub Logo](../../figures/OperationSkills/Tabskilltemple.jpg)

点击![GitHub Logo](../../figures/OperationSkills/Tabskilltempleshow.jpg)图标会以子系统-->部件-->泳道层级去显示：
![GitHub Logo](../../figures/OperationSkills/Tabskillsubsystem.jpg)
点击![GitHub Logo](../../figures/OperationSkills/subsystemupload.jpg)导入模板的json配置，点击![GitHub Logo](../../figures/OperationSkills/subsystemdownload.jpg)下载模板的json配置，模板的配置文件格式如下：
![GitHub Logo](../../figures/OperationSkills/subsystemsconfig.jpg)

### 所有进程的用户输入事件归一显示，观察操作事件和对象

对于用户 InputEvent 会绘制到固定的泳道图。
![GitHub Logo](../../figures/OperationSkills/rowskillinput.jpg)

### 支持收藏的泳道图整体画布可伸缩

收藏以后的泳道图可以在红线位置处上下伸缩拖动。
![GitHub Logo](../../figures/OperationSkills/collectskilldrag.jpg)

### 用户自定义分组化收藏（2 组），及一键取消所有收藏

选择界面上的 G1 和 G2，可以根据自己的需求将泳道图收藏到对应 G1 或者 G2 中，点击 G1 和 G2 旁边的星号可以一键取消所有收藏。
![GitHub Logo](../../figures/OperationSkills/collectskillg.jpg)

### trace 顶部的 cpu 负载预览颜色随着负载降低，亮度降低的能力对比度提升

CPU 负载颜色的亮度，负载越大颜色更深，负载越小颜色越浅。
![GitHub Logo](../../figures/OperationSkills/colorcontrast.jpg)

### 导航栏/泳道图背景颜色支持颜色可选，字体颜色可感知 slice 的颜色而进行变化，颜色动态可配

给用户提供两种模式，浅色模式（导航栏白底黑字，泳道图颜色偏淡）和深色模式（导航栏黑底白字，泳道图颜色偏深），点击最左下方的小桶标志用户可以按需选择，并且用户可以自定义 systemTrace 页面的颜色，给用户更多自由，自己动手设置自己喜欢的颜色，提升用户体验。
![GitHub Logo](../../figures/OperationSkills/colorchoose.jpg)

### Trace 抓取动态可停

在抓取 trace 过程中，点击 StopRecord 按钮会对抓取命令进行启停,等待抓取停止命令返回后,将生成的文件拉取下来进行文件的解析。
![GitHub Logo](../../figures/OperationSkills/tracestop.jpg)

### Smartperf web 端集成 hdc 命令能力

在现有的配置界面上，新增一个 Web 版本的 shell 界面，可以支持 shell 命令。
![GitHub Logo](../../figures/OperationSkills/shellconfig.jpg)

### 分布式导入功能

在界面的如下入口可以导入分布式文件，将两个文件放到文件夹下，以文件夹的形式导入。
![GitHub Logo](../../figures/OperationSkills/disimport.jpg)
导入分布式文件以后，展示如下：
![GitHub Logo](../../figures/OperationSkills/distributetrace.jpg)
分布式Trace导入完成后，在泳道界面通过点击节点slice数据(分布式)，会构建同进程(线程)或跨进程(线程)、单trace或多trace间的折线。折线绘制规则是:同一调用链，相邻数据的spanId相同或者当前spanId和另一个数据的parentSpanId相同时绘制关联关系的折线。<br>
![GitHub Logo](../../figures/OperationSkills/distributeline.jpg)
分布式slice的信息如下：
![GitHub Logo](../../figures/OperationSkills/distributetab.jpg)
-     Name：数据的名称。
-     Depth：数据的在该泳道中的层级。
-     ChainId：调用链的id, 同一条调用链id是相同的。
-     SpanId：当前节点id。
-     ParentSpanId：当前节点的父节点id。
-     ChainFlag：当前节点在调用链中的flag类型，C(Client)、S(Server)。

### 用户自定义序列导入说明

自定义序列导入功能支持查看自定义序列泳道及Tab页信息。

#### 自定义插件使用步骤
#### 打开UserPluginsRow开关
进入Flags页面，将UserPluginsRow开关置为Enable。
![GitHub Logo](../../figures/OperationSkills/userpluginsrowFlag.JPG)

#### 导入trace文件，可以看到UserPluginRow泳道
![GitHub Logo](../../figures/OperationSkills/uerspluginrow.jpg)
#### 点击上传按钮，上传配置好的json文件，根据json文件内容进行泳道绘制
注意：重复导入文件会清空泳道。
![GitHub Logo](../../figures/OperationSkills/Importjsonbutton.jpg)
![GitHub Logo](../../figures/OperationSkills/afterimportjson.jpg)

#### 点选功能
点击泳道的trace点，Tab页 User Plugin展示json文件相关信息。
#### json文件格式
![GitHub Logo](../../figures/OperationSkills/jsondata.jpg)
![GitHub Logo](../../figures/OperationSkills/jsonrelation.jpg)
#### 注意：
-     relation为泳道结构，泳道名为relation下的detail与function_name的拼接；
-     data为relation里各层级的对应信息；
-     data下的begin和end应该在trace的持续时间范围之内，其它数据可根据需要自行配置；
-     data下的func_name、begin以及end为必选配置。