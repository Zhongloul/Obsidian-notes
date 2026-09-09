
# 
本文作者XTOOLBOX,本站得到了作者本人的转载授权。

更完整的说明见《[使用微软系统描述符1.0制作免驱动自定义USB设备](http://www.usbzh.com/article/detail-1068.html "使用微软系统描述符1.0制作免驱动自定义USB设备")》和《[使用微软系统描述符2.0制作免驱动自定义USB设备](http://www.usbzh.com/article/detail-1069.html "使用微软系统描述符2.0制作免驱动自定义USB设备")》

做过USB设备开发的人，对USB中的自定义[HID](https://www.usbzh.com/article/detail-76.html)设备一定不陌生。很多时候为了通过USB接口与上位机进行通讯，都会采用自定义[HID](https://www.usbzh.com/article/detail-76.html)设备的方式。采用这种方式的通讯设备，优点是不需要写驱动程序，Windows上也有相应的API进行操作。这种方式的缺点是通讯速率比较慢，因为[HID](https://www.usbzh.com/article/detail-76.html)设备采用中断方式传输数据，对[全速](https://www.usbzh.com/article/detail-851.html)设备而言最快一秒钟只能传64K字节数据。而USB[全速](https://www.usbzh.com/article/detail-851.html)设备的理论带宽能达到1M字节每秒，连10%的性能都没有达到。

如果采用Bulk传输，则可以达到理论最大带宽，榨干USB总线的性能。但是采用Bulk传输的时候，设备要么做成串口这样的标准设备，免去驱动的编写，这样设备就不是自定义的，使用起来不如自定义设备那么方便。要么做成Bulk传输的自定义设备，但是这样就得写编写驱动程序，而驱动开发也是一个大坑。

那么能不能既能获得自定义的好处，又不进行驱动开发呢？答案是肯定的。

为了省掉自定义设备的驱动开发，微软操碎了心。在Win8或更高版本的系统中，微软集成了[WinUSB](https://www.usbzh.com/article/detail-629.html)的WCID设备。[WinUSB](https://www.usbzh.com/article/detail-629.html)是微软提供的一个USB设备的通用驱动程序，这个驱动早在XP SP2就开始提供了。使用这个驱动用户不需要编写内核层的驱动程序就能访问USB设备。WCID则是USB驱动一种新的匹配机制，在2012年左右引入的。通常USB设备都是通过VID和PID来进行匹配的，而使用了WCID之后，设备不通过VID和PID来匹配驱动，而是通过一个叫做兼容ID(Windows Compatible ID)的东西来匹配，这样就不用为每一个VID和PID不同的设备编写[IN](https://www.usbzh.com/article/detail-450.html)F文件了。

需要说明的是，这里说的免驱动有两层含义：一层是不需要编写驱动程序，系统自带了驱动程序，只需写一个inf文件，如USB串口；另一层是不需要编写inf文件，系统会根据[设备类型](https://www.usbzh.com/article/detail-273.html)来安装驱动，这需要操作系统的支持。

对于[WinUSB](https://www.usbzh.com/article/detail-629.html)设备而言，在Win8之前不用编写驱动程序，但是需要编写inf文件，匹配设备。在Win8之后，如果设备支持WCID，连inf也不用编写。

下面将介绍如何在设备中增加对WCID的支持，让在能在Win8之后的系统上实在真正的即插即用。

首先得要有一个能用起来的自定义设备，在这个设备的[设备描述符](https://www.usbzh.com/article/detail-104.html)中，USB版本号设置为2.00，在这个设备的基础之上进行如下的修改：

## 第一步

响应ID为0xEE的字符描述符请求，字符描述的内容为：

```
{
0x12,                                         /* bLength */
USB_STRING_DESCRIPTOR_TYPE,                   /* bDescriptorType */
'M', 0x00,                                    /* wcChar0 */
'S', 0x00,                                    /* wcChar1 */
'F', 0x00,                                    /* wcChar2 */
'T', 0x00,                                    /* wcChar3 */
'1', 0x00,                                    /* wcChar4 */
'0', 0x00,                                    /* wcChar5 */
'0', 0x00,                                    /* wcChar6 */
0x17,                                         /* bVendorCode */
0x00,                                         /* bReserved */
}
```

这一步是为了让Windows将我们的设备识别为WCID设备，以便进行下一步操作

## 第二步

响应请求号为0x17并且index为4的厂商自定义请求，返回内容为：

```
{
    0x28, 0x00, 0x00, 0x00,                       /* dwLength */
    0x00, 0x01,                                   /* bcdVersion */
    0x04, 0x00,                                   /* wIndex */
    0x01,                                         /* bCount */
    0,0,0,0,0,0,0,                                /* Reserved */
    /* WCID Function  */
    0x00,                                         /* bFirstInterfaceNumber */
    0x01,                                         /* bReserved */
    /* CID */
    'W', 'I', 'N', 'U', 'S', 'B', 0x00, 0x00, 
    /* sub CID */
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0,0,0,0,0,0,                                  /* Reserved */
};
```

这一步是为了向Windows上报我们设备的WCID值，因为我们需要的是WinUSB的驱动，所以上报的内容就是WinUSB驱动的WCID：“W[IN](https://www.usbzh.com/article/detail-450.html)USB”。

## 第三步

响应请求号为0x17并且index为5的厂商自定义请求，返回内容为：

```
{
  ///////////////////////////////////////
  /// WCID property descriptor
  ///////////////////////////////////////
  0x8e, 0x00, 0x00, 0x00,                           /* dwLength */
  0x00, 0x01,                                       /* bcdVersion */
  0x05, 0x00,                                       /* wIndex */
  0x01, 0x00,                                       /* wCount */

  ///////////////////////////////////////
  /// registry propter descriptor
  ///////////////////////////////////////
  0x84, 0x00, 0x00, 0x00,                           /* dwSize */
  0x01, 0x00, 0x00, 0x00,                           /* dwPropertyDataType */
  0x28, 0x00,                                       /* wPropertyNameLength */
  /* DeviceInterfaceGUID */
  'D', 0x00, 'e', 0x00, 'v', 0x00, 'i', 0x00,       /* wcName_20 */
  'c', 0x00, 'e', 0x00, 'I', 0x00, 'n', 0x00,       /* wcName_20 */
  't', 0x00, 'e', 0x00, 'r', 0x00, 'f', 0x00,       /* wcName_20 */
  'a', 0x00, 'c', 0x00, 'e', 0x00, 'G', 0x00,       /* wcName_20 */
  'U', 0x00, 'I', 0x00, 'D', 0x00, 0x00, 0x00,      /* wcName_20 */
  0x4e, 0x00, 0x00, 0x00,                           /* dwPropertyDataLength */
  /* {1D4B2365-4749-48EA-B38A-7C6FDDDD7E26} */
  '{', 0x00, '1', 0x00, 'D', 0x00, '4', 0x00,       /* wcData_39 */
  'B', 0x00, '2', 0x00, '3', 0x00, '6', 0x00,       /* wcData_39 */
  '5', 0x00, '-', 0x00, '4', 0x00, '7', 0x00,       /* wcData_39 */
  '4', 0x00, '9', 0x00, '-', 0x00, '4', 0x00,       /* wcData_39 */
  '8', 0x00, 'E', 0x00, 'A', 0x00, '-', 0x00,       /* wcData_39 */
  'B', 0x00, '3', 0x00, '8', 0x00, 'A', 0x00,       /* wcData_39 */
  '-', 0x00, '7', 0x00, 'C', 0x00, '6', 0x00,       /* wcData_39 */
  'F', 0x00, 'D', 0x00, 'D', 0x00, 'D', 0x00,       /* wcData_39 */
  'D', 0x00, '7', 0x00, 'E', 0x00, '2', 0x00,       /* wcData_39 */
  '6', 0x00, '}', 0x00, 0x00, 0x00,                 /* wcData_39 */
}
```

这一步是为了向Windows注册接口的GUID。

上述内容添加完成后，将你的设备插入电脑，会发现设备能够自动安装上WinUSB驱动程序，如下图所示：

![15465888691](https://www.usbzh.com/uploadimg/202206/15465888691.png "15465888691")

现在问题又来了，设备管理器中确实看到设备驱动已经安装，并且能正常使用，但是要怎么用呢。

微软为了让这个WinUSB能用起来，提供了对应的API。不过这个API用起来不是那么方便，libusb对WinUSB做了进一步的封装，提供了Windows和Linux上访问USB设备的统一接口。笔者对libusb按照Qt的风格又做了一次封装，封装成了QLibUsb。

QLibUsb用起来会更方便一些了。先用enumDevices枚举设备，枚举时可以指定VID和PID，也可以不指定。然后调用open打开设备。打开成功后通过readEndpoints得到设备所有的IN端点号，通过writeEndpoints得到设备所有的[OUT](https://www.usbzh.com/article/detail-449.html)端点号。调用write函数向指定的[OUT](https://www.usbzh.com/article/detail-449.html)端点写数据。当有IN端点收到数据时，会触发设备的epDataReady信号，在这个信号中对收到的数据进行处理。QLibUsb代码地址：[https://github.com/xtoolbox/qtlua/tree/master/src/qlibusb](https://github.com/xtoolbox/qtlua/tree/master/src/qlibusb)

运行XToolbox.exe后，在USB View框中填入VID和PID后点击【Refresh】按钮搜索设备，在下拉框中选中需要测试的设备后点击Open打开设备。设备打开成功后会在下方显示输入端点和输出端点，选中一个输出端点，填入一些数据后，点击【send】按钮发送数据。当接收到数据时，会在对应的输入端点栏中显示。如下图：  
​![154712936790](https://www.usbzh.com/uploadimg/202206/154712936790.png "154712936790")

上图中USB设备测试工具下载地址：

- Github镜像 [https://github.com/xtoolbox/TeenyUSB/releases/download/0.1/TeenyUSB_pc_tool.zip](https://github.com/xtoolbox/TeenyUSB/releases/download/0.1/TeenyUSB_pc_tool.zip)
- 21ic镜像 [http://dl.21ic.com/download/teenyusb_tool-285388.html](http://dl.21ic.com/download/teenyusb_tool-285388.html)

如果要在Win8以前的系统中支持WinUSB设备，还是需要编写inf文件，生成inf文件的工具下载：

- Github镜像[https://github.com/xtoolbox/TeenyUSB/releases/download/0.1/TeenyDT.zip](https://github.com/xtoolbox/TeenyUSB/releases/download/0.1/TeenyDT.zip)
- 21ic镜像 [http://dl.21ic.com/download/teenydt-285389.html](http://dl.21ic.com/download/teenydt-285389.html)

关于WCID免驱动设备的更多内容在[这里](https://github.com/xtoolbox/TeenyUSB/wiki/WCID-Device "这里")。

更多关于STM32上USB设备开发的资料也可以阅读《STM32 USB设备开发指南》，此书还在编写中。下载地址：Github镜像，21ic镜像

完整的免驱动自定义设备代码在code.tusb.org，也包括上述测试工具的源代码

本文链接为:http://www.usbzh.com/article/detail-1070.html ,欢迎转载，转载请附上本文链接。原文转自：http://blog.xtoolbox.org/custom\_usb\_device\_without\_driver/

随手分享，手有余香

HID人机交互QQ群：564808376    UAC音频QQ群：218581009    UVC相机QQ群：331552032    BOT&UASP大容量存储QQ群：258159197    STC-USB单片机QQ群：315457461    USB技术交流QQ群2:580684376    USB技术交流QQ群：952873936     USB技术交流3:1031974172

 [ 使用微软系统描述符2.0制作免驱动自定义USB设备](https://www.usbzh.com/article/detail-1069.html "使用微软系统描述符2.0制作免驱动自定义USB设备")

 [ WinUsb读取设备描述符及端点读写示例](https://www.usbzh.com/article/detail-1097.html "WinUsb读取设备描述符及端点读写示例")

#### 0 篇笔记 写笔记

[USB ](https://www.usbzh.com/article/detail-625.html)​*[WCID](https://www.usbzh.com/article/detail-625.html)*​[设备中特殊字符描述符](https://www.usbzh.com/article/detail-625.html)

*WCID*全称”Windows Compatible ID，中文名为“Windows兼容ID”。 *WCID*设备是一种向Windows系统提供额外信息的USB设备，以便于自动安装驱动程序，并在某些情况下允许立即访问。USB设备驱动的匹配安装一般是以VID/PID进行驱动匹配的，但*WCID*设备却是根据C......

[使用WinUSB读写USB设备](https://www.usbzh.com/article/detail-628.html)

Windows为WinUSB设备提供了API，主要通过以下几个步骤访问设备。通过扩展描述符中的GUID查看接口的路径用接口的路径作为参数，调用CreateFile打开接口使用WinUsb\_Initialize得到WinUSB句柄通过WinUsb\_WritePipe和WinUsb\_ReadPipe对......

[使用微软](https://www.usbzh.com/article/detail-1068.html)​*[系统描述符](https://www.usbzh.com/article/detail-1068.html)*​[1.0制作免驱动自定义USB设备](https://www.usbzh.com/article/detail-1068.html)

本文作者XTOOLBOX,本站得到了作者本人的转载授权。本文介绍如何使用微软的操作*系统描述符*来实现自定义USB设备在Windows系统上的免驱动使用。前言在Linux上开发USB设备是不需要特别的驱动的，Linux内核的USB驱动会将USB设备的基本操作都暴露到应用层，由应用层来完成实际的业......

[使用微软](https://www.usbzh.com/article/detail-1069.html)​*[系统描述符](https://www.usbzh.com/article/detail-1069.html)*​[2.0制作免驱动自定义USB设备](https://www.usbzh.com/article/detail-1069.html)

本文作者XTOOLBOX,本站得到了作者本人的转载授权。前言在《使用微软*系统描述符*1.0制作免驱动自定义USB设备》一文中，介绍了如何使用1.0版本的*系统描述符*来制作免驱动设备，这里将介绍如何使用2.0版本的*系统描述符*来制作免驱动设备。无论是1.0还是2.0，都是为了让系统给设备安装WinUS......

[简单几步，让自定义USB设备也能免驱动运行](https://www.usbzh.com/article/detail-1070.html)

本文作者XTOOLBOX,本站得到了作者本人的转载授权。更完整的说明见《使用微软*系统描述符*1.0制作免驱动自定义USB设备》和《使用微软*系统描述符*2.0制作免驱动自定义USB设备》做过USB设备开发的人，对USB中的自定义HID设备一定不陌生。很多时候为了通过USB接口与上位机进行通讯，都会......

[USB ](https://www.usbzh.com/article/detail-1552.html)​*[WCID](https://www.usbzh.com/article/detail-1552.html)* [ 设备开发](https://www.usbzh.com/article/detail-1552.html)

什么是 *WCID* 设备？*WCID* 代表的是“Windows Compatible ID”，即Windows 兼容 ID。它是一种向 Windows 系统提供额外信息的 USB 设备，以便于自动安装驱动程序，在大多数情况下即插即用。在通常的情况下，除非是人体学输入设备 (HID) 或是大容量存储设备......

[CH569设备USB2.0支持](https://www.usbzh.com/article/detail-1576.html)​*[WCID](https://www.usbzh.com/article/detail-1576.html)*​[-WINUSB-基于MSOS-V1.0](https://www.usbzh.com/article/detail-1576.html)

CH569是USB3.0设备，WCH给的示例CH372Device本身USB3.0是支持WINUSB的，但是USB2.0不支持(不是不支持，是代码没有写)。故这里对USB2.0代码完善支持，让其通过微软*系统描述符*1.0支持WINUSB.关于微软*系统描述符*1.0详见https://www.usbzh......

[CH569设备USB2.0支持](https://www.usbzh.com/article/detail-1577.html)​*[WCID](https://www.usbzh.com/article/detail-1577.html)*​[-WINUSB-基于MSOS-V2.0](https://www.usbzh.com/article/detail-1577.html)

由于MSOS1.0是通过0xee的字符串触发的，且需要设备描述符bcdUSB的值设为0x200，在获取信息时需要：获取字符串描述符（0xee),解析出vendorId发送vendor控制请求，Index\=04 00 获取兼容ID的内容发送vendor控制请求，Index\=05 00 获取Winu......

关注公众号

![](https://www.usbzh.com/res/img/comm/gongzhonghao.jpg)[https://www.usbzh.com/blog/usbzh.html](https://www.usbzh.com/blog/usbzh.html)

 [ 分类导航](https://www.usbzh.com/article/detail-1070.html#)

- [HID人机交互](https://www.usbzh.com/article/detail-1070.html#collapse5)
- [Linux&USB](https://www.usbzh.com/article/detail-1070.html#collapse93)
- [UAC音频](https://www.usbzh.com/article/detail-1070.html#collapse1)
- [CDC](https://www.usbzh.com/article/detail-1070.html#collapse102)
- [TYPE-C](https://www.usbzh.com/article/detail-1070.html#collapse41)
- [USB规范](https://www.usbzh.com/article/detail-1070.html#collapse11)
- [USB大容量存储](https://www.usbzh.com/article/detail-1070.html#collapse57)
- [USB百科](https://www.usbzh.com/article/detail-1070.html#collapse2)
- [USB周边](https://www.usbzh.com/article/detail-1070.html#collapse3)
- [UVC摄像头](https://www.usbzh.com/article/detail-1070.html#collapse12)
- [USB资源](https://www.usbzh.com/article/detail-1070.html#collapse70)
- [Windows系统USB](https://www.usbzh.com/article/detail-1070.html#collapse63)
- [Windows下USB驱动基础知识](https://www.usbzh.com/article/forum-63.html "Windows下USB驱动基础知识")
- [-](https://www.usbzh.com/article/forum-98.html "-")
- [USBHound驱动开发笔记](https://www.usbzh.com/article/forum-85.html "USBHound驱动开发笔记")
- [USBIP解读及源码分析](https://www.usbzh.com/article/forum-62.html "USBIP解读及源码分析")
- [USB应用层开发](https://www.usbzh.com/article/forum-52.html "USB应用层开发")
- [USB通用驱动源码分析](https://www.usbzh.com/article/forum-54.html "USB通用驱动源码分析")
- [Windows下USB百科](https://www.usbzh.com/article/forum-38.html "Windows下USB百科")
- [WinUSB](https://www.usbzh.com/article/forum-58.html "WinUSB")
- [音视频博客](https://www.usbzh.com/article/forum-81.html "音视频博客")

##### ![USB中文网](https://www.usbzh.com/res/img/comm/bottom-log.png) USB中文网

专注于USB技术开发,USB技术传播

在线USB技术解惑,帮助USB开发者快速成长！

本站联系:[public@usbzh.com](mailto:public@usbzh.com)

Copyright © 2021-2025 [USB中文网](http://www.usbzh.com/) | [关于我们](https://www.usbzh.com/article/detail-312.html) [免责声明](https://www.usbzh.com/article/detail-317.html) [隐私政策](https://www.usbzh.com/article/detail-316.html) [网站地图](https://www.usbzh.com/sitemap.xml) [陕ICP备19020272号-5](https://beian.miit.gov.cn/)
