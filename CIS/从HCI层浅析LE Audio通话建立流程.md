# 从HCI层浅析LE Audio通话建立流程

‍

### 背景

BLE AUDIO音乐播放已经调通了，接下来调试BLE AUDIO的通话，BLE AUDIO通话跟音乐协议类似，都是走CIS链路，也是用同样的codec，比经典蓝牙音乐和通话分别采用不同的A2DP和HFP显得协调多了，下面还是以手机和2个蓝牙耳机为例，结合HCI LOG来分析LE AUDIO通话协议的建立：

### 连接建立过程

1. 当我们开始拨通电话号码，对方响铃的时候，手机会通过前面建立的CCP EATT链路通知耳机准备好进行通话：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/dc3383aa77324d668c00bb76b67270a1.png)

2. 紧接着手机会把音乐的ASE disable，然后断开前面建立的两个CIS，同时去除CIG：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1b4bef1938cd480caa41c03aabaae3b6.png)

3. 接下来就开始建立通话的CIG：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e51827a5063643a29a47d89ccd4edf48.png)  
注意上面红色框框，比较和音乐的CIG的区别发现，MAX SDU SIZE由155变成了80，RTN（重传次数）由13变成了2，说明通话更加注重时效性。

4. 下来会设4条Setup ISO Data Path命令：

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f3c3478d803349b687b9c184ecd0b78c.png)  
这里比前面音乐也多了两条，因为通话是双向的，音乐是单向，每个方向都要单独设置一条命令，所以2个耳机是4条命令。

5. 接下来会通过ASE Control 命令去enable 2个相关ASE，尤其要注意右边红色框框的Audio data context  
   type由音乐的Media变成了conversational，这个就代表这当前应用场景是通话，而不是音乐

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/10ebd7a63fb8448cb191568302b389b0.png)

6. 接下来耳机会通知手机ASE端口已经准备好了，手机就可以建立CIS连接了： ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7898cb631abb4c559997bd882bafb620.png)
7. 接下来手机会发送ASE命令 Receiver start ready做通话前的最后同步，耳机回复ACK后，双方就可以进行愉快的通话啦：  
   ​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/c3ce0886d6d4479884f113171baadc72.png)
