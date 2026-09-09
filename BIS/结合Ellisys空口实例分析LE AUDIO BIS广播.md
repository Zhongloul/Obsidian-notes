# 结合Ellisys空口实例分析LE AUDIO BIS广播

[结合Ellisys空口实例分析LE AUDIO BIS广播_ellisys 怎么分析-CSDN博客](file:///D:/%E6%A1%8C%E9%9D%A2/%E8%B5%84%E6%96%99/le%20audio/%E7%BB%93%E5%90%88Ellisys%E7%A9%BA%E5%8F%A3%E5%AE%9E%E4%BE%8B%E5%88%86%E6%9E%90LE%20AUDIO%20BIS%E5%B9%BF%E6%92%AD.html)

### BIS广播角色

自从BT 5.0引入了扩展广播，其实就是在为LE AUDIO BIS的应用打下基础，相对于传统的广播，扩展广播的通道不再局限于37，38，39三个频道，而是可以扩展到0-36任意一个频道。根据Basic audio Profile为LEA BIS定义了4个角色：Broadcast Source , Broadcast Sink , Broadcast Assistant和Scan Delegator，参考下图:  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/56622f2c317e4b0fac8955172228e992.png)  
根据协议规范，Broadcast source，Broadcast Sink和Scan Delegator都可以发送广播，四个角色的作用如下：

|角色|作用|
| --------------------| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Broadcast Source|1：建立和配置BIG，每个BIG包含若干BISes；<br />2：为每个BIS广播音频数据流；<br />3：能够被Broadcast Assistant或者Broadcast sink发现|
|Broadcast Sink|1：能够发现和接收Broadcast source广播音频数据流；<br />2：也能够展露自己的audio capabilities。|
|Broadcast Assistan|1：能够发现Broadcast source的广播音频流，能够发现Broadcast Sink的audio capabilities；<br />2：能够和Scan Delegator建立ACL连接并代表其进行扫描工作，能够传输Broadcast\_Codes给Scan Delegator让其告诉Broadcast Sink去解密被加密过的音频数据流；<br />3：Broadcast Assistant要求Scan Delegator发现广播音频流的数据，并可以通过其请求Broadcast Sink接收广播音频流。|
|Scan Delegator|1：Scan Delegator与 Broadcast Assistant 连接后，可以要求broadcast assistant代表其进行扫描。<br />2:和Broadcast Assistant建立连接后，能够接收Broadcast\_codes等必要信息给Broadcast Sink，让其能够解密音频广播流。|

这里的Broadcast Source和Broadcast assistant可以是一个设备（比如手机），也可以是分开的独立设备（比如一个电视，一个手机），而Broadcast sink和Scan Delegator通常是一个设备，比如音响，耳机等。

下面我们结合ellisys空口实例来看Broadcast Source的3种类型广播：ADV\_EXT\_IND, AUX\_ADV\_IND和AUX\_SYNC\_IND,他们三者之间的关系如下：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/932ccba3ac4a4d0ba4f3ad11d44dcf84.png)  
详细参考：https://www.bluetooth.com/specifications/specs/  
下面一一分析：

### ADV\_EXT\_IND

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e28d5c203d4e4bcab97cd0c12be00c6e.png)

如上图ADV\_EXT\_IND是在37，38，39 channel上依次发送，并不是同时发。感觉这里有点问题，理论上应该同时发送才对，这个地方疑问后续再挖掘。

如上图，ADV\_EXT\_IND参数解释如下：

|参数|值|详解|
| ---------------------------| -------------------------------------| -----------------------------------------------------------------------------------|
|PDU Type|ADV\_EXT\_IND|广播类型|
|Adv Mode|Non Connectable / Non Scannable|不可连接不可扫描模式，就是手机不可以连接，发送scan request也不会回复scan response|
|Flags|AdvA \| AdvDataInfo \| AuxPtr|标志位，此数据包包含AdvA，AdvDataInfo 和 AuxPtr字段|
|Advertising Address|91:C7:0E:5D:FB:90|广播地址|
|Advertising Data ID (DID)|0xE7F|此广播数据的编号，这是一个随机数，整个广播周期不会变化|
|Advertising Set ID (SID)|0x5|广播集ID，SID用于区分广播设备发送的不同数据集|
|LL Channel|29 (data) (RF 31, 2464 Mhz)|指明接下来的AUX\_ADV\_IND在29通道|
|CA (Clock Accuracy)|51 ppm to 500 ppm|时钟精度|
|Offset Units|30 us|时钟偏移单位|
|Auxiliary Offset|19.980 ms [@0.032 022 500]|接下来的AUX\_ADV\_IND在当前时钟偏移19.980 ms|
|Auxiliary PHY|LE 2M|使用LE 2M PHY|

### AUX\_ADV\_IND

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6ad83442c40f48fe85dee917b2835394.png)  
如上图所示，再第一个ADV\_EXT\_IND之后的20ms左右，29 channel上出现了辅助广播AUX\_ADV\_IND，广播包的参数详解如下：

|参数|值|详解|
| ---------------------------| ------------------------------| ---------------------------------------------------------------|
|PDU Type|AUX\_ADV\_IND|广播类型|
|Flags|AdvDataInfo|SyncInfo|
|Advertising Data ID (DID)|0xE7F|这个与ADV\_EXT\_IND的DID值相等|
|Advertising Set ID (SID)|0x5|这个与ADV\_EXT\_IND的SID值相等|
|Sync Packet Offset|19.98 ms|表示AUX\_SYNC\_IND出现在偏移19.98 ms 之后|
|Offset Units|30 us|时钟偏移单位|
|Offset Adjust|No|不需要偏移调整|
|Interval|120 ms|周期广播AUX\_SYNC\_IND的广播周期为120ms|
|Channel Map|Used: 0-36 / Unused: none|周期广播AUX\_SYNC\_IND的广播频道0-36都可以|
|SCA (Clock Accuracy)|251 ppm - 501 ppm|时钟精度|
|Access Address|0x4E09EDA1|周期广播AUX\_SYNC\_IND的Access Address|
|CRC Initial Seed|0x1983AE|周期广播AUX\_SYNC\_IND的CRC Initial seed|
|Event Counter|85|AUX\_ADV\_IND数值统计，每广播一个AUX\_ADV\_IND加1|
|Uuid|Broadcast Audio Announcement|0x1852|
|Broadcast ID|0x563412|随机数，跟BIG绑定，在BIG周期内不会变|
|Broadcast Name|“xxx”|广播名字|

### AUX\_SYNC\_IND

首先看一下AUX\_SYNC\_IND的Access Address 和CRC Init Seed：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/56f72993901a4edbab789522b84ebb90.png)  
发现了吧，这两个值跟上面的AUX\_ADV\_IND的SyncInfo里面定义的是一致的。下面再看看AUX\_SYNC\_IND包内容解析：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1470f03ec98749d1a3b991ee3b0dd8f0.png)  
首先看BIG Info:

|参数|值|详解|
| ---------------------| --------------------| ---------------------------------------------------------------------------------------------------------------------------------|
|BIG Offset|840us|BIG音频流的偏移为840us|
|ISO Interval|20 ms|BIG发包周期为20ms|
|Num BIS|1|BIG有1个BIS|
|NSE|8|number of subevent，意思是说在ISO interval (20ms)内,一个BIS流有8次输出数据的机会。至于要不要传输8次，就要看下面的BN和有没有重传|
|BN|2|BN值，可以理解为一个ISO interval里，手机可以发给耳机2个有效数据包，重传的不算。|
|Sub Interval|594 us|可以理解为在一个ISO interval里，同一个BIS，手机发第一个包和第二个包的间隔为594us|
|PTO|0|Pre-transmition offset,大概意思是后面的数据包提前传输的偏移|
|BIS Spacing|4.752 ms|两个不同BIS之前的间隔|
|IRC|4|The Immediate Repetition Count，重传次数最多为4次|
|Max PDU|100|一个包最大字节数为100|
|Framing Mode|RFU|成帧方式，因为是广播，具体由Broadcast sink决定|
|Seed Access Address|0x299CF76E|为各个BIS生成Access address的基础|
|SDU Interval|10.000 ms|帧间间隔，可以理解为发送和接收两个方向，一个方向为10ms|
|Max SDU Size|100|SDU最大字节数为100|
|Base CRC Init|0xA854|Base CRC Init ，为各个BIS生成CRC Init的基础|
|Channel Map|0x0000001FFFFFFFFF|数据流信道Map|
|PHY LE|2M|2M的PHY|
|BIS Payload Counter|1’020|当前BIS数据流计数|
|Framed|Unframed|帧没有分包，就是100个字节一个帧|
|BIS1 Access Address|0xD49AF76E|BIS1的access address|
|BIS1 CRCInit|0xA85401|BIS1的 CRCInit|

再看下advertising data的内容：

|参数|值|详解|
| --------------------------------------| ---------------------------------------| ------------------------|
|Uuid|Basic Audio Announcement|0x1851|
|Presentation Delay|40 us|40us后起播，用于同步用|
|Coding Format|LC3|LC3编码器|
|Sampling Frequency|48000 Hz|采样率48kHZ|
|Frame Duration|10 ms|帧间隔10ms|
|Octets Per Codec Frame|100|一帧100个字节|
|Intended Contexts|Media|播放内容为音乐媒体|
|Uuid|Public Broadcast Announcement Service|0x1856|
|Encryption|Yes|加密|
|Standard Quality Audio Configuration|Present|中等音频质量配置|
|High Quality Audio Configuration|Not Present|非高清音频配置|

### BIS ISOC

先看下BIS1 ISOC的access address和CRCInit：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6d3dcb8bd4ee4f06b932ed71b40e7535.png)  
再看下BIS ISOC数据帧的内容：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/9c06f5107881467e91d5b9a3fe2cbb77.png)  
这个里面我们只有一个参数比较陌生了，那就是BIG Sync Delay, 关于这个参数，BT core spec有描述：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8ef448248cd24d748fbfe9c10d37717e.png)

‍
