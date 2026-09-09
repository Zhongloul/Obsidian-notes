
### 背景

VCP也就是volume control profile的缩写，是LE AUDIO音量控制服务，类似与AVRCP的音量控制，LE AUDIO也存在gateway和control client，可以这样理解在gateway上运行了VCS(volume control service)，VCOS（volume control offset service）和AICS(audio input control service），这三个服务结合在一起完成音量控制。（当然还包括LE AUDIO的另外一个Profile MICS(microphone input control service),但这个profile特别的简单，只有一个特征值Mute，也是起到控制音量Mute的作用）。本文以android手机和蓝牙耳机为例，手机相当于control client,耳机相当于gateway，结合空口看看VCP是如何运行的。

### 先看看core spec的VCS，VCOS和AICS配合完成音量控制的：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/10ce2720e6cd496f953c82e48f96adc7.png)  
从上图可以看到：

1. 总共有三个音频流，bluetooth audio，HDMI audio和microphone audio，这三个音频流各自有AICS来控制音量。
2. 这三个音频流经过MIX之后由VCS来控制绝对音量。
3. 音频分别传输到两个喇叭，还会经过VOCS来单独控制各个喇叭的音量。

### 查询VCS,VOCS,AICS服务

1. 手机先会查询到耳机支持的VCS和MICS，UUID分别是0x1844和0x184D ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/09248e771cb94110b1f80b0ae2a5c153.png)
2. 手机通过查询handle 4865-4875之间的include handle找到了VOCS(UUID:0x1845)和AICS(UUID:0x1843)：  
   ​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1934f7c8da254b509ae562990f78d565.png)
3. 接下来看看VCS包含了哪些特征值： ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/39cd8cbe56354bfa9df39fdfab0499a3.png)
4. 可以看到VCS主要包含三个特征值：

|特征值|handle值|详解|
| ----------------------| ----------| --------------------------------------------------------|
|Volume State|4869|反应当前音量值，以及Mute状态|
|volume Control point|4872|音量控制端点，手机端通过写入这个特征值来控制音量的大小|
|Volume Flags|4874|音量控制标志，由谁来控制音量|

5. 再看看VOCS包含了哪些特征值：  
   ​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/56181ef935464462bc01699fa2ebe299.png)  
   可以看到VOCS包含4个特征值：

|特征|handle值|详解|
| -----------------------------| ----------| ------------------------------------|
|Volume offset state|8195|反应当前分路音量值，以及Mute状态|
|Audio Location|8198|当前分路的位置，比如是左耳还是右耳|
|Volume Offset Control Point|8201|当前分路音量控制端点|
|Audio Output Description|8203|当前分路描述|

6. 再看看AICS包含了哪些特征值： ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/ab7a84e9ec5a4128ba69210ab48f8610.png)  
   可以看到AICS包含6个特征值：

|特征值|handle值|详解|
| ---------------------------| ----------| ---------------------------------------------------------------------------------------|
|Audio Input State|16387|反应了当前音频输入的状态：包括Gain\_Setting,Mute，Gain\_Mode,Change\_Counter|
|Gain Setting Properties|16390|反应当前增益设置值（最小单位0.1dB），最大和最小增益值|
|Audio Input Type|16392|音频输入类型，比如HIDM，bluetooth等|
|Audio Input Status|16394|反应当前音频状态，是不是active状态|
|Audio Input Control Point|16397|音频输入控制端点，控制增益大小等等|
|Audio Input Description|16399|当前音频输入描述|

7. 再看看MICS包含的特征值，就一个Mute:  
   ​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1d220e45286548c0949a765887d8c3dc.png)

### 手机设置耳机音量

目前耳机就用到了VCS控制端点来设置耳机的绝对音量：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/dd02b83270c641a087dba60ac6f48e12.png)  
如上图看到：

- opcode是set absolute volume，等于4是设置绝对音量；
- change counter：这是个同步用的随机值，从0-255循环加1，手机发这个值给耳机，耳机会加1回复给手机，手机再用当前值发给耳机，如此循环。
- Volume setting：这个是绝对音量从0-255，127就是一半音量大小，255就是最大音量。

再看看耳机回复给手机的Notification:  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7b0a2181ab4a4e88a70763198bfc33af.png)  
如上图看到，也是3个值：

- Volume Setting: 这个是绝对音量从0-255，127就是一半音量大小，255就是最大音量。
- change counter：这是个同步用的随机值，从0-255循环加1，手机发这个值给耳机，耳机会加1回复给手机，手机再用当前值发给耳机，如此循环。
- Mute:当前有没有Mute。
