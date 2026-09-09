# 通话TBS和CCP

Bluetooth LE AUDIO通话的TBS和CCP就是类似于经典蓝牙HFP电话控制协议，也是作为LE AUDIO电话控制协议，TBS就是Telephoney Bear Service, 这个是服务端位于手机侧，类似于HFP Gateway。CCP是 Call Control Profile，这个是Client位于耳机端，可以理解为HFP Client，下面还是以手机和耳机为例，结合空口来理解TBS和CCP：

### TBS发特征值现

耳机和手机在进行了LE Audio连接后，用户通过双击耳机可以起播手机音乐，在播放音乐的过程中，突然接到一个电话，通过双击耳机可以接通电话，然而耳机要控制手机接通电话，必须先知道手机端TBS支持的特征值：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7016fdde2de54cdaae4383f462520610.png) 如上图，耳机首先发起ATT查询UUID 0x184C的主要服务，这个0x184C就是GTBS的UUID，手机回复耳机TBS服务的特征值位于97-141之间，接下来我们看看TBS都有哪些特征值：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/921938d658e247bc80761aa5af125b0c.png)  
图上图所示，我们看到TBS总共有16个特征值，下面分别解释这16个特征值的含义：

|特征UUID|value Handle|详解|
| ---------------------------------------------------------------| --------------| ------------------------------------------------------------------------------------------------------------------------------|
|Characteristic UUID Bearer Provider Name|99|手机的名字|
|Characteristic UUID Bearer Technology|102|手机支持的通信技术，3G，4G还是5G|
|Characteristic UUID Call Control Point Optional Opcodes|105|通话控制点可选操作码|
|Characteristic UUID Call State|107|呼叫状态，目前总共支持有Incoming，Dialing，Alerting，Active，Locally Held，Remotely Held，Locally and Remotely Held，7中状态|
|Characteristic UUID Call Control Point|110|通话控制点，耳机通过写入此特征值来控制手机接听或者挂断电话等动作|
|Characteristic UUID Bearer UCI|113|统一呼叫标志符，不超过5个字符，例如电话表示：“tel:”|
|Characteristic UUID Bearer URI Schemes|115|统一资源标志符采用的策略，一般为统一呼叫标识符和呼叫ID的组合，例如来电：tel:139xxxxxxxx组成一个URI|
|Characteristic UUID Bearer Signal Strength|118|手机信号强度|
|Characteristic UUID Bearer Signal Strength Reporting Interval|121|手机信号强度报告更新周期|
|Characteristic UUID Bearer List Current Calls|123|手机当前通话列表|
|Characteristic UUID Status Flags|126|手机可以通知此特征值来表示手机的带内铃声，静音模式的使能和去能|
|Characteristic UUID Incoming Call Target Bearer URI|129|来电URI|
|Characteristic UUID Incoming Call|132|来电呼叫|
|Characteristic UUID Termination Reason|135|断开电话理由|
|Characteristic UUID Call Friendly Name|138|呼叫友好名称|
|Characteristic UUID Content Control ID|141|内容控制ID|

### 通话控制：来电

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/25bc1819729b4f2796ca72af99a93667.png)

1. 在播放音乐过程中，如果有来电，首先手机会通知左右耳机，媒体播放暂停，如上图红色框，发送ATT Notification Packet(Media State: Paused)
2. 手机告知左右耳机电话播放器支持的行为和名字，如橙色框。
3. 手机会通知耳机有来电Incoming call的电话号码，以及当前的通话状态：Incoming，当前电话列表（主要是三方电话），以及来电的URI：tel:xxxxxxxxxxx，如黄色框。
4. 耳机通过写入媒体控制点特征值来让手机停止播放音乐，这一步感觉耳机的行为有点多余，因为第一步手机就告知耳机媒体播放器已经暂停了，如绿色框。

### 通话控制：接通电话

1. 首先，耳机会收到电话的来电通知，以及音乐媒体播放的暂停，如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d4c629101fbd4b72970271ded0d659ec.png)

2. 然后耳机会通过写入call control point，操作码是accept来告诉手机接通电话，然后手机返回通话状态为：active，如下图

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/338d4f081b7a4bc2992c9e4c4a817837.png)

3. 接着手机会通过写入左右耳的ASE Control point去disable 音乐播放的ASE ID 2，然后断开左右耳音乐CIS，如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/a43384a895884086a37e32f5b74ceb45.png)

4. 紧接着手机会通过写入ASE control point去enable ASE ID 1和ASE ID 3，这两个是用于通话的端点，同时改变audio context为conversational，然后手机会为左右耳机会建立CIS连接，如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/90ff5cdfe0ac472a98b51263e705ef4a.png)

5. 最后手机会通过写入ASE Control Point,操作码是receiver start ready，让耳机做好接收通话音频数据的准备，同时手机也会设置绝对音量，接下来手机就会发送通话音频数据了,如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d960bf5f65e5449e9ec1b23e24bda72b.png)

### 通话控制：挂断电话

1. 耳机挂断电话只需要耳机写入call control point特征值，opcode是teminate即可，后面手机会通知左右耳机挂断的结果，以及挂断的原因，如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8a26fb28209d4f21908509f7a4e13c8c.png)

2. 然后同理手机会通过写入ASE Control point来disable ASE 1和ASE3端点，如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/278a4b5602eb4d368cc373f9bb5ef89e.png)

3. 然后手机会断掉左右耳通话CIS，如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6ae5feb4705d4c33bce4fcecaf656879.png)

4. 最后，手机为左右耳机建立音乐CIS连接，又可以愉快的听歌了，如下图：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/9b862c37a0d84e099bd413d0532826d6.png)
