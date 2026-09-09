# PAC(Published Audio Capability)

PAC，published audio capability用于声明audio服务能力，是Bluetooth LE AUDIO核心服务之一，下面以手机和耳机为例，结合空口分析PAC到底有哪些交互内容：

### 1：读取Source/Sink PAC

首先手机会读取左耳的Source PAC和Sink PAC:  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/ffb5860dc59442189176b913ea383de8.png)  
如上图，红色框是代表读取左耳的sink和source PAC,绿色框代表读取右耳的sink和source。  
接下来以左耳的Sink PAC(Source PAC类似)为例，看看都有哪些内容：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/c58b449dbdfe48b996e040d031597e25.png) 如上图所示，我们看到耳机的Sink PAC总共有4条PAC记录，然后每条PAC下面有有两个分项：Codec和Metadata。  
接下来具体看看一条PAC的codec和Metadata里面的内容（其他条PAC格式类似）：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d8ae66e6bc504a4f81adba89c6a851cd.png)  
从上图可以看到:

- codec分项有：

编码格式LC3，采样率16K HZ，帧间间隔支持7.5ms和10ms，每帧字节30-40字节，一个SDU最大支持帧数为1.

- metadata分项有：

优先选择的audio data context type为未定义。

### 2读取audio source/sink location

在读取PAC的同时也会读取各个PAC所代表的location，下面看看读入audio location都有啥：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/531389b06696453e9a2b7b7fa1616bf8.png)  
如上图，红色框代表读取左耳的location，绿色框代表读取右耳的location。再看看耳机返回Sink audio location具体内容：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/c751f6788e884f5995b99524b1bbca29.png)  
从上图可以看到LE Audio支持的位置场景相对丰富，前左前右，后左后右，边左边右等各种场景。  
3：

### 读取 avaliable audio context

分别读取左右耳机的的avaliable audio context:  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/67dac70c8e86482ab147f2fa38288336.png)  
如上图红色框代表读取左耳的avaliable audio context，绿色则代表读取右耳的，接下来看看avaliable audio context里面有啥内容：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/fb1fd57b271445c388f56047b551a854.png)  
从上图可以看到，耳机的sink avaliable context支持的音频数据类型比较多，包括音乐，通话，游戏，助听器等等，source avaliable支持的音频数据类型要少一些，只支持通话，Live和响铃。

### 4：读取supported audio context

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8b15a30de670424f9be3173bf9f082a9.png)  
如上图，红色代表左耳，绿色代表右耳，再看看里面的具体内容：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/dc3c425b97f64aa48672530aa8f82e2d.png)  
可以看到耳机对source 和sink的supported audio context的场景是全部支持。
