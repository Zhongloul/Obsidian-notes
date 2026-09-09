# 结合实例从空口分析LE AUDIO ISO（音乐和通话）

ISO ：isochoronous channel，Bluetooth LE AUDIO引入的同步通道，可以简单的理解为接收方需要在严格的时间范围内接收并确认数据，否则发送方就会丢弃，这样就能保住音频数据的时效性，尤其是对与语音通话更为重要。  
接下来我们还是以手机和耳机为例，通过空口来分析ISO数据包，这里会有两个场景：音乐和通话，看看他们之间的ISO数据包有何区别。

## 1：音乐

在手机发起传输ISO音乐帧之前，耳机会通过EATT Notification通知手机，相关ASE（ID\=\=2）可以streaming了，如下图CIS 0和CIS 1 Media streaming：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/25907b92148f4b46bdcd77c6f8c20c94.png)  
接下来看看ISO数据包的发包状态：![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/37e0965ce9f44621808b9973fd0c8ff3.png)

从上图绿色框看到ISO数据在传输的时候是交替传输，CIS0–\>CIS1–\>CIS0–\>CIS1,单个ISO数据payload都是155个字节，以20ms为一个ISO interval(CIG发包周期)，包含CIS0的两个单向包，和CIS1的两个单向包。  
接下来看看单个ISO包的内容：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/28b3030324594e1ca476db81e4cc41c8.png)  
从上图绿色框可以看到，因为音乐是单向传输数据，就是手机传给耳机，耳机不需要数据回给手机，所以耳机只需要回复一个NULL包即可。  
再看一下红色框里面的参数：

|参数|值|详解|
| -------------------| -----------| ----------------------------------------------------------------------------------------------------------------------------------|
|CIS ID|0|CIS ID号|
|CIG ID|0|CIG ID号|
|ISO Interval|20ms|一个CIG发包的周期为20ms|
|Sub Interval|2.048 ms|一个CIG发包周期内，同CIS的两个包之间的时间间隔|
|CIS Offset|23.75 ms|距离CIS锚点的偏移|
|CIS Sync Delay|14.186 ms|用于发包CIS锚点同步时间|
|CIG Sync Delay|14.186 ms|用于发包CIG锚点同步时间，与第一个CIS同时间点|
|NSE|7|Number of SubEvents，意思是说在ISO interval (20ms)内,一个CIS流有7次输出数据的机会。至于要不要传输7次，就要看下面的BN和有没有重传|
|BN|2|BN值，可以理解为一个ISO interval里（20ms），手机可以发给耳机2个有效数据包，重传的不算。|
|FT|4|FT值，可以理解为一个数据包最多可以在4个ISO interval里重传(20x4\=80ms)。|
|SDU Interval|10 ms|帧间间隔|
|PHY|LE 2M|采用2M PHY传输数据|
|Framing|Unframed|采用非成帧方式，不会在ISO层组包和分包，都会交给上层，但不会携带时间偏移信息|
|Transport Latency|64.186 ms|最大时延|

再看一下LC3 CODEC参数信息：

|参数|值|详解|
| --------------------| ------------| -------------------|
|Audio Channels|Front Left|左声道|
|Sampling Frequency|48 kHz|采样率48KHZ|
|Frame Duration|10 ms|帧间隔间10ms|
|Frame Size|155|帧字节数|
|Blocks per PDU|1|单个PDU分成多少块|

### 2：通话

同理，在手机和耳机发起传输ISO通话帧之前，耳机会通过EATT Notification通知手机，相关ASE(ID\=\=1和3)可以streaming了，如下图CIS 0和CIS 1 Conversational streaming：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/84aec56c53f24337bc172a38119f925f.png)

通话是双向数据传输，所以我们会看到两个方向的ISO数据：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/b04c806ff2414b48852a7e8aa4025099.png)  
从上图看到ISO数据在传输的顺序是：CIS0–\>CIS0–\>CIS1–\>CIS1,单个ISO数据payload都是80个字节，以10ms为一个ISO interval(CIG发包周期)，包含CIS0的两个双向包，和CIS1的两个双向包。  
接下来看看单个ISO包的内容：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1b7c589003fd494799892e75354affa5.png)  
如上图红色框，单个CIS在两个方向上都有数据传输，而且双方都需要回复CIE(close isochronous event)的NULL包确认，感觉这个地方可以优化一下，回包带确认即可。再看一下右边绿色框框的参数，下面把音乐和通话的参数都列出来，比较一下：

|参数|音乐（值）|通话（值）|详解|
| -------------------| ------------| ------------| ------------------------------------------------------------------------------------------------------------------------------------------|
|CIS ID|0|0|CIS ID号|
|CIG ID|0|2|CIG ID号|
|ISO Interval|20ms|10ms|一个CIG发包的周期,音乐为20ms，通话为10ms|
|Sub Interval|2.048 ms|2.12ms|一个CIG发包周期内，同CIS的两个包之间的时间间隔|
|CIS Offset|23.75 ms|11.25ms|距离CIS锚点的偏移|
|CIS Sync Delay|14.186 ms|6.21ms|用于发包CIS锚点同步时间|
|CIG Sync Delay|14.186 ms|6.21ms|用于发包CIG锚点同步时间，与第一个CIS同时间点|
|NSE|7|3|Number of SubEvents，意思是说在ISO interval (20ms)内,一个CIS流有7(3)次输出数据的机会。至于要不要传输7（3）次，就要看下面的BN和有没有重传|
|BN|2|1|BN值，可以理解为一个ISO interval里（20ms），手机可以发给耳机2个有效数据包，重传的不算。|
|FT|4|1|FT值，可以理解为音乐场景一个数据包最多可以在4个ISO interval里重传(20x4\=80ms)，通话场景最多在1一个iso interval重传（10ms）。|
|SDU Interval|10 ms|10ms|帧间间隔|
|PHY|LE 2M|LE 2M|采用2M PHY传输数据|
|Framing|Unframed|Unframed|采用非成帧方式，不会在ISO层组包和分包，都会交给上层，但不会携带时间偏移信息|
|Transport Latency|64.186 ms|3.79ms|最大时延|

再看一下LC3 CODEC参数信息：

|参数|音乐（值）|通话（值）|详解|
| --------------------| ------------| ------------| -------------------|
|Audio Channels|Front Left|Front Left|左声道|
|Sampling Frequency|48 kHz|32kHz|采样率48KHZ|
|Frame Duration|10 ms|10ms|帧间隔间10ms|
|Frame Size|155|80|一帧字节数|
|Blocks per PDU|1|1|单个PDU分成多少块|

通过上面表格的比较发现，音乐和通话在NSE, BN, FT ,Latency的数值有显著区别，通话的FT越小，说明对时效越发敏感。

还有一点需要注意的就是，耳机作为peripheral设备往手机central设备单向传输数据的时候，也需要由手机先传送一个Empty LE CIS包给耳机，然后耳机再回数据包给手机，如下图：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1a032c493dbd493e8167fd609df200f1.png)

![](https://profile-avatar.csdnimg.cn/d9ca4493abec4870adb2639e29a68ade_jzj1234555.jpg!1)[https://blog.csdn.net/Jzj1234555 Tim_Jiangzj](https://blog.csdn.net/Jzj1234555)

[已关注]()

- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/like-dark.png)[53]()  
  点赞
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/unlike-dark.png)  
  踩
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/collect-dark.png)[10]()  
  收藏

  觉得还不错? 一键收藏 ![](https://csdnimg.cn/release/blogv2/dist/pc/img/collectionCloseBlack.png)
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/guideRedReward01.png) 知道了  
  ​![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/comment-dark.png)[ 0]()  
  评论
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/share-dark.png)[ 分享]()  
  [复制链接]()

  [分享到 QQ]()

  [分享到新浪微博]()

  ![](https://csdnimg.cn/release/blogv2/dist/pc/img/share/icon-wechat.png)扫一扫
- ![打赏](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/reward-dark.png)[ 打赏]()  
  打赏
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/more-dark.png)  
  ​![打赏](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/reward-dark.png)[ 打赏 ]()![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/report-dark.png)[ 举报]()

  ![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/report-dark.png)[ 举报]()
