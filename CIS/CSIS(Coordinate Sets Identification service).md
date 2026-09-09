# CSIS(Coordinate Sets Identification service)

CSIS是Coordinate Sets Identification service,翻译过来就是协调集识别服务。什么是协调集，可以理解为具有相同特征的一伙设备，最典型的就是左右两个蓝牙耳机是一个协调集，所以它们具有相同的协调集标志，但是具有相同协调集的设备要如何识别，这就是本篇需要讲解的内容，其实还是比较简单，下面还是以手机和蓝牙耳机为例，看看BLE AUDIO CSIS是如何工作：

### 扩展广播里的RSI

RSI是Resolvable Set Identifier,可解析的协调集标志 ，我们可以把它类比RPA，这个值会附属在我们的左右耳机的广播里，下面从HCI看看实例：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/af59ba334cef41278e757e417cba2047.png)  
如上图，主耳和副耳的广播都附带有RSI值，手机扫描到的时候，会把这些值存储起来，以便后面解释用。

### 主耳BLE连接

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/80020c1d937d46eda8fe510e4c611a81.png)

### 读取SIRK

SIRK是Set Identity Resolvable Key的缩写，也就是解析RSI的钥匙，可以理解为类似IRK， 手机和主耳建立BLE连接后，会通过ATT服务读取耳机传过来的RSIK：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8b29ff48a46a4d99b060c731d634ba3e.png)如上图，红色框表示读到的SIRK的值，下面解释一下绿色框的三个值的含义：

|参数|值|解释|
| ------| ----------| -------------------------------------------------------------------|
|Size|2|表示此协调集有2个成员|
|Lock|Unlocked|此成员有没有锁定,可以理解为没有锁定，就是可以是主耳，也可以是副耳|
|Rank|2|Rank可以理解为手机给两个耳机发送音频流的顺序|

### 手机BLE连接副耳

通过读取了主耳的SIRK，然后把主副耳的RSI解析出来，发现这两个设备是同一协调集，这样手机就会主动去连接副耳：  
​![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1b7e18b9a0a04a1b933b1e5dc8328130.png)

### 总结：

BLE AUDIO CSIS服务还是比较简单，说就是找寻同类型设备，这样方便后面进来的同类型设备可以自动连接，不需要人工干预了。

![](https://profile-avatar.csdnimg.cn/d9ca4493abec4870adb2639e29a68ade_jzj1234555.jpg!1)[https://blog.csdn.net/Jzj1234555 Tim_Jiangzj](https://blog.csdn.net/Jzj1234555)

[关注]()

- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/newHeart2021Black.png)[19]()  
  点赞
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/newUnHeart2021Black.png)  
  踩
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/newCollectBlack.png)[3]()  
  收藏

  觉得还不错? 一键收藏 ![](https://csdnimg.cn/release/blogv2/dist/pc/img/collectionCloseWhite.png)
- ![打赏](https://csdnimg.cn/release/blogv2/dist/pc/img/newRewardBlack.png)  
  打赏
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/guideRedReward01.png) 知道了  
  ​![](https://csdnimg.cn/release/blogv2/dist/pc/img/newComment2021Black.png)[ 0]()  
  评论
- ‍
- ![](https://csdnimg.cn/release/blogv2/dist/pc/img/newShareBlack.png)  
  [复制链接]()

  [分享到 QQ]()

  [分享到新浪微博]()

  ![](https://csdnimg.cn/release/blogv2/dist/pc/img/share/icon-wechat.png)扫一扫
