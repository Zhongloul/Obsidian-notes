
### 背景

CIS ,coordinate isochronos stream，是BLE AUDIO单播形式的数据流，在前面文章[https://blog.csdn.net/Jzj1234555/article/details/142416588?spm=1001.2014.3001.5502](https://blog.csdn.net/Jzj1234555/article/details/142416588?spm=1001.2014.3001.5502) 我们了解了BLE AUDIO从连接到建立CIS的大概流程，但CIS到底是什么样的形式，如何在空中传播，里面的细节我们还是以手机和耳机为例，结合HCI LOG和AIR LOG来分析里面的细节。

### HCI

CIS的建立是central设备发起的，首先需要建立一个CIG，就是建一个群，里面有相同类型的设备，比如左右耳机就是同一个CIG里面两个同类型设备，分别为两个设备建立不同的CIS连接。  
hci层会涉及三个命令：

- HCI LE Set CIG Parameters
- HCI LE Setup ISO Data Path
- HCI LE Create CIS

#### HCI LE Set CIG Parameters

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/b969ab4a2ee347ddbafee9b72c2a031d.png)  
先看一下红色框里面的参数：

|参数|值|详解|
| ------------------------------| -------------| ----------------------------------------------------------------------|
|CIG ID|0x00|group ID为0|
|SDU Interval M TO S|10.000 ms|一个CIG ISO的发包周期，从手机到耳机发包的间隔为10ms|
|SDU Interval S TO M|10.000 ms|一个CIG的发包周期，从机（耳机）到主机（手机）发包的间隔为10ms|
|Packing|Interleaved|CIG里面的两个CIS数据包是交替传输：CIS0-\>CIS1-\>CIS0-\>CIS1|
|Framing|Unframed|ISO数据数据不分包|
|Max Transport Latency C To P|100 ms|中心设备（手机）到外围设备（耳机）的最大传输延迟为100ms|
|Max Transport Latency P To C|100 ms|外围设备到中心设备传输的最大延迟为100ms|
|CIS Count|2|当前CIG这个group里面有两个CIS连接|

看一下绿色框框里面的参数：

|参数|值|详解|
| ---------------------| -------| ---------------------------------------------|
|CIS ID|0x00|CIS的ID为0|
|Max SDU Size M TO S|155|从手机到耳机传输数据包的最大size为155个字节|
|Max SDU Size S TO M|0|从耳机到手机的传输数据包的最大size为0|
|PHY Type C To P|LE 2M|中心设备到外围设备的PHY是2M|
|PHY Type P To C|LE 2M|外围设备到中心设备的PHY是2M|
|RTN C To P|13|数据包可以重传13次|
|RTN P To C|13|数据包可以重传13次|

看看command complete event：![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/2a3474f4ba164eaab5dc8c7002bada11.png)  
因为有两条CIS，建立了两个ACL连接，返回两个connection handle。

#### HCI LE Setup ISO Data Path

这个命令主要设置ISO流的方向和选用的CODEC，每个CIS都需要单独设置：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f7ff2de15c7f449ba0101195be8b6ba0.png)  
方向是从手机流向耳机，codec ID为6代表选用的是LC3 codec。

#### HCI LE Create CIS

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f74fb63bc3454a5199663c4f8b36e71c.png)  
红色和绿色框框分别代表不同的CIS handle和ACL handle。  
这条命令设下去之后，手机和耳机的蓝牙芯片就会做LLCP协商建立CIS连接。

### 空口：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/89ecf2dae4ff4027aaca68e1d2529fb0.png)  
LL层也是通过三个命令协议CIS建立的参数：  
LLCP CIS Request  
LLCP CIS Response  
LLCP CIS Indication

#### LLCP CIS Request

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3a49be3b91984890b9f66731407b56b4.png)  
先看一下绿色框框的参数：

|参数|值|详解|
| ----------------------------------------| -----------| --------------------------------------------------|
|Central to Peripheral Max SDU Size|155|中心设备到外围设备最大传输数据size|
|Framed|Unframed|不分包传输|
|Peripheral to Central Max SDU Size|0|无数据从外围设备传输到中心设备|
|Central to Peripheral Max SDU Interval|10.000 ms|一个CIG ISO interval从中心设备到外围设备传输时间|
|Peripheral to Central Max SDU Interval|10.000 ms|一个CIG ISO interval从外围设备到中心设备传输时间|

再看一下红色框框的参数：

|参数|值|详解|
| -------------------------------------| -----------| ------------------------------------------------------------------------------------------------------------------------------|
|Central to Peripheral Max PDU Size|155|传输最大数据包的size|
|Number of SubEvents|7|意思是说在ISO interval (20ms)内,一个CIS流有7次输出数据的机会。至于要不要传输7次，就要看下面的BN和有没有重传|
|Sub Interval|2.048 ms|可以理解为在一个ISO interval里，同一个CIS，手机发第一个包和第二个包的间隔为2.048ms|
|Central to Peripheral Burst Number|2|BN值，可以理解为一个ISO interval里，手机可以发给耳机2个有效数据包，重传的不算。|
|Central to Peripheral Flush Timeout|4|FT值，可以理解为一个数据包最多可以在4个ISO interval里重传(20x4\=80ms)。|
|ISO Interval|20 ms|一个CIG发包的周期为20ms，其实就是上面 Central to Peripheral Max SDU Interval和Peripheral to Central Max SDU Interval相加之和|
|CIS Offset Min|11.250 ms|从当前ACL connEventcounter时间到第一个CIS锚点的时间最小偏移|
|CIS Offset Max|11.250 ms|从当前ACL connEventcounter时间到第一个CIS锚点的最大时间偏移|

#### LLCP CIS Response

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8bb10053afb84ecb8c9337d5f2247a16.png)

#### LLCP CIS Indication

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6c0e8c68dcf34f7a91fa6e0eb772bc06.png)  
这里有三个重要参数是CIS offset ，CIG Sync delay和CIS Sync delay，参考一下core spec可以理解为从CIG第一个锚点到传输数据的时间偏移：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6caf2afc46e34859b54c250f88559f9f.png)

‍
