# 音乐MCS和MCP(Media Control Service／Profile)

Bluetooth LE AUDIO的MCS和MCP就是类似于经典蓝牙AVRCP协议，也是作为媒体控制协议，MCS就是Media control service, 这个是服务端位于手机侧，类似于AVRCP TG。MCP是 Media control profile，这个是client位于耳机端，可以理解为AVRCP Controller，下面还是以手机和耳机为例，结合空口来理解MCS和MCP：

### MCS服务发现

耳机和手机在进行了LEA连接后，通过双击耳机可以起播手机音乐，在播放音乐之前，耳机需要知道手机端MCS服务特征值：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/20f79d73fa324bc0a2d2480fedca5dbf.png)  
如上图，耳机首先发起ATT查询UUID 0x1849的主要服务，这个0x1849就是GMCS的UUID，手机回复耳机MCS服务的特征值位于63-96之间，接下来我们看看MCS都有哪些特征值：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/780ff3c1f99543538152cec8d156434c.png)  
图上图所示，我们看到MCS总共有12个特征值，下面分别解释这12个特征值的含义：

|特征UUID|value Handle|详解|
| ---------------------------------------------------| --------------| ----------------------------------------------------------------|
|Characteristic UUID Media State|65|媒体状态|
|Characteristic UUID Media Control Point Supported|68|支持哪些媒体控制方式|
|Characteristic UUID Media Player Name|71|媒体播放器名字|
|Characteristic UUID Media Control Point|74|媒体控制点，耳机对手机的play,pause等控制都是通过写入这个特征值|
|Characteristic UUID Track Changed|77|轨道改变，可以理解为一段音乐播放完毕发生了变化。|
|Characteristic UUID Track Title|80|一段音轨的歌词|
|Characteristic UUID Track Duration|83|一段音轨的持续时间|
|Characteristic UUID Track Position|86|音轨位置|
|Characteristic UUID Playing Orders Supported|89|支持哪些播放次序，比如顺序单曲播放，单曲循环等|
|Characteristic UUID Playing Order|91|当前播放次序|
|Characteristic UUID Content Control ID|94|内容控制ID|
|Characteristic UUID Seeking Speed|96|快进快退的速度|

### 媒体控制：起播

1. 在媒体播放前，耳机需要获取一些手机播放器的信息，如播放器支持的控制方式，媒体状态，当前播放歌曲次序方式,如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7f74a7c201674c3cad6a0bc5c366748a.png)

2. 耳机会通过写入Media control point特征值来开启手机媒体播放playing，手机会回复通知给耳机，告知手机起播成功：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7fe7dce0fc6441dd8adb3cb43da7d211.png)

3. 手机接着会通过写入enable ASE control point，然后建立CIS连接：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/589e4f66088d47e1b195ea116100b708.png)

4. 耳机告知了手机ASE状态为streaming之后，手机就可以发送ISO数据包给耳机了：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/a0ba568f7cf24772a7d0d35a54da2083.png)

### 媒体控制：下一首

同理通过写入Media control point : Next track来实现音乐播放下一首  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/9f6e309c0c284f50a45400281e522ae6.png)

### 媒体控制：暂停

也是通过写入Media control point: Pause来实现音乐停播或暂停：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/64dbfcdb48004dfc8567c47310410e57.png)
