# ASCS(Audio Stream Control Service)

ASCS：AUDIO STREAM CONTROL SERVICE，音频流控制服务，顾名思义会对音频流的一些参数去做控制的服务，下面我们还是以手机和耳机为例，结合空口来分析ASCS都有哪些内容：

### 1：ASE CODEC CONFIG

配置ASE的codec，左右耳分别有3个ASE（这是通过前面ATT服务从耳机读取出来的），然后手机开始配置，下面以左耳（右耳类似）为例，结合空口看看手机是如何配置ASE CODEC：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/fde652d234db4874a8bbe12a75eaee1e.png)  
如上图所示，红色框表示手机通过EATT Write来配置codec，绿色框是耳机通知手机，配置成功与否，最后配置成啥样。具体来看看：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/37ffef64f0c040b9bd01d776cf0cd515.png)  
如上图，手机给左耳配置了3个ASE，每个ASE codec config下面都定义了ASE ID，Latency，PHY和Codec四个选项，可以看到ASE ID 1和3的latency比较平衡，这两个ASE是为通话准备的，ASE ID 2的latency很高，这个是为音乐准备的，具体看看ASE 2的codec配置如何：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/02e75f9ae6e749cf98908197e6c56f46.png)  
如上图可以看到codec的配置：

|配置项|值|
| ---------------| ------|
|采样率|48k|
|帧间隔|10ms|
|音频通道分配|左耳|
|每帧字节数|155|
|SDU包含几个帧|1|

再看看耳机返回的Notification:  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/aa1117cb85b141fca3fdfaf030a8b5e8.png)  
主要关注红色框里面的几个参数：

|参数|值|详解|
| ---------------------------------| ----------| ---------------------------------------------------------|
|Framing|unframed|非成帧方式，在应用层组包|
|preferred Retransmission number|13|重传次数13次，这个是比较高的|
|presentation delay|20-40|后面四个参数都是为QOS准备，这个是为了左右耳做音频同步的|

### 2：ASE QOS CONFIG

配置左右耳机的3个ASE的QOS，下面还是以左耳为例来看配置命令：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/88adc8c892dd42c68ec5bb3f26082e89.png)  
如上图所示，红色框表示手机通过EATT Write来配置QOS，绿色框是耳机通知手机，配置成功与否，最后配置成啥样。具体来看看：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/93eca2c2b9cb4e8994da6de623e1110f.png)  
如上图，手机给左耳的三个ASE都配置了QOS，我们看一下红色框标准的ASE 2的配置，里面的参数在上面已经解释过了，再看看耳机返回的ASE ID 2的QOS Notification:  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/591f5af186f8493face300a09f150553.png)

### 3：ASE ENABLE

通过前面两个步骤，手机已经获取了耳机的3个ASE codec信息和QOS信息，然后手机会根据自己的场景（音乐，通话，游戏等）选择合适的ASE：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3c00f558c0bd4241a04a4cbf900150af.png)  
如上图红色框是分别enable 左右耳机的ASE，可以看到右边黄色框的ASE ID等于2，audio data context type为Media，说明是音乐场景。耳机会返回Enabling NOTIFICATION,如上面绿色框。

### 4：ASE STREAMING

ASE ENABLE之后，手机会发起LLCP CIS连接：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/ca0bf803455e4053afbc6706eb41e959.png)  
如上图：红色框表示手机给左右耳机建立两条CIS链路，绿色框代表耳机通知手机ASE 进入streaming状态，黄色框表示手机发给耳机的ISO数据。
