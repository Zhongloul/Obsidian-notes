
 本文围绕USB-HID报表描述符展开，介绍其用途，它能识别多种设备，定义数据格式和使用方法。阐述报表描述符由项目组成，项目分短、长项目及Main、Global和Local三大类，还详细解析了各项目如Usage Page、Report ID等的功能和作用。

- **说一下为什么写这篇文章，主要是最近在做关于USB-HID设备的描述符，看到关于HID报表描述符的解析有点少，自己看了下，后续还会发布还有关于USB的各种解析，有兴趣可以看看，可以让你更加明白USB工作机制。**
- **传送门：**   **[HID键盘描述符范例](https://britripe.blog.csdn.net/article/details/111681135)**
- 你的HID设备 怎么识别 鼠标 键盘 VR 医疗设备 网络通信设备等等等，都是用这个报表来实现，这个报表是USB最灵活也是最复杂的报表。
- *可以描述上千种设备，一点也不夸张！*

1. 报表描述符定义了执行设备功能的数据格式和使用方法。
2. 报表描述符和 USB 的其他描述符是不一样的，它不是一个简单的表格，报表描述符是 USB 所有描述符中最复杂的。 ***报表描述符非常复杂而有弹性，因为它需要处理各种用途的设备报表的数据必须以简洁的格式来储存，这样才不会浪费设备内的储存空间以及数据传输时的总线时间。***    实际上可以这样理解，报表内容的简洁，是通过报表描述符全面的、复杂的数据描述实现的。
3. 报表描述符必须先描述数据的大小与内容。 **报表描述符的内容与大小因设备的不同而不同，在进行报表传输之前，主机必须先请求设备的报表描述符，只有得到了报表描述符才可正确解析报表的数据。**
4. 报表描述符是报表描述项目（Item）的集合，每一个描述项目都有相对统一的数据结构，项目很多，通过编码实现。

#### 项目

1. 报表描述符由描述 HID 设备的数据项目（Item）组成，项目的第一个字节（项目前缀）由三部分构成， **即项目类型（item type）、项目标签（item tag）和项目长度（item size）。**   其中项目类型说明项目的数据类型，项目标签说明项目的功能，项目长度说明项目的数据部分的长度。
2. HID 的项目有短项目和长项目两种，其中短项目的格式如下图：  
   *短项目的数据字节数由 bSize 的值定义，bSize 为 0、1、2、3 时 Data 部分的字节数分别为 0、1、2、4 个字节。短项目的项目类型由 bType 定义，bType 为 0、1、2 时分别为 Main、Global 和 Local 类型。*
3. 长项目可以携带较多的数据，其格式如下图：  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/59d95e893b437e0a090d5375fa3b2ac0.png "HID 报表长项目格式")

   *目中的第一个字节为上图中的特定值时表明该项目是一个长项目。长项目中的bDataSize 说明 Data 部分的字节数，bLongItemTag 在 HID 规范中没有定义。*
4. 下面是通过汇编实现的一个简单的报表描述符，描述符的每一行是一个项目，该描述符描述了一个从设备接收 2 个字节的输入报表和发送 2 个字节到设备的输出报表。

   ```cpp
   HID_Report_desc_table: 
    db 06h, A0h, FFh ; Usage Page(Vendor defined) 定义设备功能 
    db 09h, A5h ; Usage(Vendor Defined) 定义用法 
    db A1h, 01h ; Collection(Application) 开一个集合 
    db 09H, A6h ; Usage(Vendor defined) 定义用法 

    ; 输入报表 
    db 09h, A7h ; Usgae(Vendor defined) 定义用法 
    db 15h, 80h ; Logical Minimum 定义输入最小值=-128 
    db 25h, 7Fh ; Logical Maximum 定义输入最大值=+127 
    db 75h, 08h ; Report Size 定义报表数据项大小=8 
    db 95h, 02h ; Report Count 定义报表数据向个数=2 
    db 81h, 02h ; Input(Data,Variable,Absolute) 输入项目 

    ; 输出报表 
    db 09h, A9h ; Usgae(Vendor defined) 定义用法 
    db 15h, 80h ; Logical Minimum 定义输入最小值=-128 
    db 25h, 7Fh ; Logical Maximum 定义输入最大值=+127 
    db 75h, 08h ; Report Size 定义报表数据项大小=8 
    db 95h, 02h ; Report Count 定义报表数据向个数=2 
    db 91h, 02h ; Output(Data,Variable,Absolute) 输出项目 

    db C0h ; End Collection 关闭集合 
   ```

#### 项目的分类

1. 报表的项目有 Main、Global 和 Local 三大类，每一类都有多个不同的项目，实现不同的描述。

   ```
   Main 类项目用于定义报表描述符中的数据项。也可以组合其中的若干数据项成为一个
   集合。Main 项目可以分为带数据的 Main 项目和不带数据的 Main 项目。带数据项的 Main
   用于生成报表中的数据项，包括 Input、Output 和 Feature 项目。不带数据的 Main 项目不
   生成报表中的数据项，包括 Collection 和 End Collection 项目。 

   Global 类项目实现对数据的描述，用来识别报表并且描述报表内的数据，包括数据的
   功能、最大与最小允许值以及数据项的大小与数目等。改变由 Main 类项目生成的项目状
   态表。Global 类项目描述对后续的所有项目有效，除非遇到有新的 Global 类项目。 

   Local 类项目定义控制的特征，这一类项目的作用域不超过下一个 Main 项目，所以在
   每一 Main 项目之前可能有多个 Local 项目。Local 项目用于描述后面的 Input、Output 和
   Feature 项目
   ```
2. 下表列出的是全部的项目的前缀字和简要功能说明  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/ac0004f9fd6455e47599beaaf966714b.png "HID项目列表")
3. 如上图所示：在这些项目中，Usage Page 用来指定设备的功能，而 Usage 项目用来指定个别报表的功能。Usage Page 项目相当于是 HID 的子集合，Usage 相当于是 Usage Page 的子集合。
4. 下面来解析 下项目列表的用法：这书上没有提及我给大家解释一下，举两个特例大家应该就明白了，如下图![](https://i-blog.csdnimg.cn/blog_migrate/36e1cad2be4e5dbc88bf6c326343162a.png)

   ![](https://i-blog.csdnimg.cn/blog_migrate/3d6e9a7a127ad80969c33698ffdd3e00.png)
5. 再进一步解析项目之间的分类如下图所示（举例为短项目，长项目我觉得应该是类似的，认真看看就明白了，这个看明白了 我觉得USB描述符不在话下）：  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/e5af8eeebc8944498ba7b9de19327bc2.png)

#### 报表描述符的项目

1. Input、Outpot 和 Feature 项目
2. 这 3 个项目用来定义报表中的数据字段。
3. ```cpp
   Input 项目可以应用到任何控制、计数器读数或其他设备传给主机的信息。一个输入报
   表包含一个或多个 Input 项目，主机使用中断输入传输来请求输入报表。 

   Ouput 项目用来定义主机传送给设备的信息。一个输出报表包含一个或多个 Output
   项目。输出报表包含控制状态的数据。如果有中断输出管道，HID1.1 兼容主机使用中断输
   出传输来传送输出报表，否则使用 Set_Report 控制请求。 

   Feature 项目应用到主机传送给设备的信息，或是主机从设备读取 Feature 项目。一
   个特征报表包含一个或多个 Feature 项目，Feature 项目通常是包合影响设备与其组件整
   体行为的配置。特征报表通常是控制可以使用实际的控制面板调整的设置，例如主机可以
   使用虚拟控制面板来让用户选择控制特征。主机使用 Set_Report 与 Get_Report 请求来传
   送与接收特征报表。
   ```
4. 在每一个 Input、Output 和 Feature 项目的前缀字之后是 32 位描述数据，目前最多定义了 9 个位，余的位则是保留。位 0\~8 的定义中只有位 7 不能应用于 Input 项目，除此之外其他的位定义都适应于 Input、Output 和 Feature 项目。下图是关于这三个项目的数据定义：  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/70b6c92af3b942a63125f4b8c4238922.png)  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/dc9fcff36210afad96993b2869437f9d.png "Input、Output 和 Feature 项目的数据项说明标题")
5. 下面就来解析下 Input，后面两项大家以此类推就好啦 请看下图：  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/d4fb94bb4c3202f8c0b7eb011ce62cf6.png)

#### Collection 和End Collection 项目

1. **所有的报表类型都可以使用 Collection 与 End Collection 项目来将相关的 Main 类型项目组成群组。**    这两个项目分别用于打开和关闭集合。所有在 Collection 与 End Collection项目之间的 Main 类型项目都是 Collection 的一部分。
2. **Collection 有 3 种类型：Application、Physical 与 Logical**  ​，其项目的数据项的值分别为 1、0 和 2。厂商也可以自己定义 Collection 类型，数据项的值为 80h\~FFh 保留给厂商定义。End Collection 项目无数据项。
3. Application Collection 包含有共同用途的项目或执行单一功能的项目。 **例如键盘的开机描述符将键盘的按键与 LED 指示灯数据集合成一个 Application Collection。**    所有的报表必须在一个 Application Collection 内。
4. Physical Collection 包含在一个单一几何点上的数据项目，可以将每个位置的数据集合成一个 Physical Collection。在设备报告多个传感器的位置的时候，使用 PhysicalCollection 指明不同的数据来自不同的传感器。
5. Logical Collection 形成一个数据结构，包含由 Collection 所连结的不同类型的项目。例如数据缓冲区的内容以及缓冲区内字节数目的计数。

#### Usage Page 和Usage 项目

1. Usage page 项目的数据部分为 1\~2 个字节，目前的定义全部都是一个字节。UsagePage 定义了常用的设备功能，关于 Usage Page（以及其他项目）的具体定义内容，可以查阅 HID Usage tables（http://www.usb.org/developers/hidpage/#Class\_Definition），下表是来自 HID Usage tables 的 Usage Page 定义。如下图  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/0e0c2698de8c589fc8c36be677e607f9.png)  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/43eaf8c7567fcebefec0625069d73ec9.png "Usage Page定义")
2. **关于Usage Page的每一个有效定义项，都有一个相应的下一级定义**  ​。如Usage Page的数据项数值为1，则设备定义为Generic Desktop Controls，关于该类设备的具体功能可以在HID Usage Tables中查到具体的定义。下表是HID Usage Tables中对GenericDesktop Controls设备的功能定义。比如 Usage Page \= 1 （Generic Desktop Controls） 如上图的 PageID\= 01 然后这个集合里面又可以分下面那么多种设备 如下图：  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/b9493d3183b408d2c02d8ecf605897d5.png)  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/0356c0a9ef92fb9cc2152aa7e55827ce.png)  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/2c12320348018800a66b022e5096b5cb.png "Generic Desktop Controls 用法定义")
3. 因此  HID报表描述符功能真的很强大，很灵活。
4. **用法（Usage）定义了各种各样设备特性，对于 Usage Page 的每一项都定义了常用的各种用法。**
5. 上表中的用法类型（Usage Type）描述了应用程序如何处理由 Main 类型项目生成的数据，具体的定义和详细说明请参阅 HID Usage Tables。

#### Report ID 项目

1. **Report ID 放在信息包中报表数据之前，设备可以支持多个相同类型的报表，每一个报表包含不同的数据与其特有的 ID。**
2. 在报表描述符中， **Report ID 项目作用于其后续所有的项目，直到遇到下一个 Report ID为止。如果报表描述符中没有 Report ID 项目，默认的 ID 值是 0，**   **描述符不能定义一个为0 的 Report ID**   **（以我的理解额 报告ID为0 就不要定义，定义报告ID的话就不要为0）。输入报表、输出报表与特征报表可以分享同一个 Report ID。**
3. 在 Set\_Report 和 Get\_Report 请求传输中，主机在设置事务的 wValue 字段的低字节中指定一个 Report ID。 在中断传输中如果接口支持一个以上的 Report ID，Report ID 必须是传送报表中的第一个字节。 **如果接口只支持数值为 0 的默认 Report ID，此 Report ID不应该在中断传输中随着报表一起传送。**

#### Logical Minimum 和 Logical Maximum 项目

1. Logical Minimum 与 Logical Maximum 项目定义报表的变量（Variable）或阵 列（Array）数据的限制范围，此限制范围以逻辑单位来表示。例如设备报表的一个电流值读数是500mA，而一个单位是 2mA，则 Logical Maximum 值等于 250。（其实是用来描述一个字节的上下限）
2. 负数值以 2 的补码来表示。如果 Logical Minimum 与 Logical Maximum 都是正数，就不需要有正负号位。不管 Logical Minimum 与 Logical Maximum 是以有正负号或是无正负号的数值来表示，设备都可以正确地传输数据。 ​**数据的接收者必须知道数据是否可以是负值**  ​。

#### Physical Minimum 和 Physical Maximum 项目

1. Physical Minimum 和 Physical Maximum 项目定义数值的限制范围， ​**该限制范围使用Unit 项目定义的单位来表示**  ​。上例中设备报表的一个电流值读数是 500mA，单位是 2mA，Logical Maximum 值等于 250，而 Physical Maximum 值是 500。
2. **Logical Minimum 与 Logical Maximum 值说明了设备返回数值的边界，可以根据Physical Minimum 和 Physical Maximum 值对数据进行偏移和比例变换。**

#### Unit 项目

1. Unit 项目指定报表数据在使用 Physical 与 Unit Exponent 项目转换后使用什么度量单位，以及单位的幂指数值。Unit 的数值部分可以长达 4 字节，按照 4 位为一段分段，可以分为 8 个半字节段，由高到低分别为半字节 7、半字节 6、…、半字节 0。每一个半字节对应不同的基本单位，其数值表示单位的指数值，采用 4 位 2 的补码表示，取值范围是-8\~+7之间。
2. 从半字节 0\~6 由下表给出了具体的定义，其中半字节 0 表示测量系统，半字节 7 保留。例如在半字节 0 数值为 1（表示采用线性公制测量系统）的条件下，半字节 1 表示长度（单位为厘米），如果其数值为 1 表示厘米，数值为 2 表示（厘米）2，成为面积单位。半字节3 表示时间（单位为秒），如果其数值为-2，表示（秒）-2。  
   ​![](https://i-blog.csdnimg.cn/blog_migrate/ed8ac6e13b6b4995865a18548a5db045.png "Unit 单位的定义")
3. 虽然表中只是定义了有限的基本单位，但可以通过这些基本单位的组合派生出大多数其它的常用单位。

   ```cpp
   例如报表使用一个字节传送一个从-20 到 110 华氏度温度值，可以定义以下报表描述
   项目： 
   Logical Minimum = -128 
   Logical Maximum = 127 
   Physical Minimum = -20 
   Physical Maximum = 110 
   Unit Exponent = 0 
   Unit = 30003h 

   Unit 的半字节 0=3 选择英制线性测量系统，半字节 4=3 选择华氏温度单位。 
   130（110+20）华氏度的数值范围线性分布到了 256 和有效数值区域，每一位相当于
   0.51 华氏度，这样就提高了分辨率。
   ```

#### Report Size 和 Report Count 项目

1. **Report Size 项目指定 Input、Output 与 Feature 项目字段的大小，以位为单位。**
2. Report Count 项目指定 Input、Output 与 Feature 项目包含的字段数目。
3. 例如两个 8 位的字段，Report Size 等于 8，而 Report Count 等于 2。8 个 1 位的字段，Report Size 等于 1，而 Report Count 等于 8。3
4. Input、Output 与 Feature 项目报表可以有多个项目Size 和 Report Count 项目。

#### Usage、Usage Minimum 和 Usage Maximum 项目

1. 这 3 个项目输入 Local 类型项目。
2. Usage 项目和 Global 类型的 Usage Page 项目协同描述项目或集合的功能。一个报表可以指定一个 Usage 给许多个控制，或是指定不同的 Usage 给每一个控制。如果一个报表项目之前有一个 Usage，此 Usage 应用到该项目的所有控制。如果一个报表项目之前有一个以上的 Usage，每一个 Usage 应用到一个控制，Usage 与控制是按顺序结合的。

   ```
   例如下面报表描述符的一个局部，报表含有 2 个输入字节，第一个字节的用法是 x，
   第 2 个字节是 y。 

   Report Size (8) 
   Report Count (2) 
   Usage (x) 
   Usage (y) 
   Input (Data, Variable, Absolute) 
   ```
3. 如果一个报表项目之前有一个以上的 Usage，而且控制的数目多于 Usage 的数目，每一个 Usage 与一个控制对应，最后一个 Usage 则应用到所有剩余的控制。

   ```
   例如在下面报表包含 16 个字节输入数据，第一个字节对应用法 x，第 2 个字节对应用法 y，剩余的 14 个字节对应厂商定义的用法。

   Usage (x) 
   Usage (y) 
   Usage (Vendor defined) 
   Report Size (8) 
   Report Count (16) 
   Input (Data, Variable, Absolute)
   ```
4. Usage Minimum 和 Usage Maximum 可以指定一个 Usage 给多个控制或是数组项目。将从 Usage Minimum 到 Usgae Maximun 定义的用法顺序对应到多个控制中。

   ```
   例如在一个键盘描述符中定义的标准键盘的左、右修饰键的输入项目中，使用一个字
   节的 8 位分别输入键盘的左、右 Ctrl 键、Shift 键、Alt 键和 GUI 键，从 HID Usage tables
   文档中的第 10 节可以查到关于键盘用法的定义，其中上述 8 个修饰键的用法定义值为 224
   到 231。以下是报表描述符的修饰键部分描述。 

   Usage Page (1) ; 1 = Generic Desktop Controls 
   Usage (6) ; 6 = Keyboard 
   Collection (1) ; 1 = Application 
   Usage Page (7) ; 7 = Keyboard/Keypad 
   Usage Minimum (224) 
   Usage Maximum (231) 
   Logical Minimum (0) 
   Logical Maximum (1) 
   Report Size (1) 
   Report Count (8) 
   Input (Data, Variable, Absolute) 
   …… 
   ```
   #### 自此，本章结束了，有不懂的一起探讨！
