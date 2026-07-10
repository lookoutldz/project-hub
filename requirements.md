# LOOKO Terminal - 个人导航主页

## 1. 项目简介

LOOKO Terminal 是一个纯前端的个人导航主页。

它不是传统的网址导航，而是一个模拟终端（Terminal），作为所有个人项目的统一入口。

设计目标：

* 轻量（Lightweight）
* 简洁（Minimal）
* 有个性（Unique）
* 对开发者友好（Developer Friendly）

整个项目仅使用：

* HTML
* CSS
* JavaScript

无需任何前端框架。

部署目标：

* Cloudflare Pages

---

# 2. 设计理念

整个网站围绕一句话展开：

> Everything starts from the terminal.

访客既可以：

* 像使用终端一样输入命令；
* 也可以直接在终端输出区域点击项目入口进行跳转。

整个系统本身就是一个 Terminal。

---

# 3. 整体风格

整体采用复古终端风格。

特点：

* 深色背景，整体接近老式 CRT / 终端屏幕观感
* 等宽字体
* 以琥珀色、暗绿色或低饱和磷光色作为主要文字颜色
* 极简 UI
* 无图片依赖
* 无复杂装饰
* 内容优先
* 避免现代网页 App 风格的卡片、阴影、渐变和大面积圆角

推荐字体：

* IBM Plex Mono
* Courier Prime
* Space Mono

整体视觉类似：

```text
LOOKO OS

Type "help" for help.

looko@home:~$
```

---

# 4. 页面布局

采用单 Terminal 布局。

```text
+-------------------------------------------------------------+
| LOOKO Terminal Version 1.0                                  |
| Initializing...                                             |
| Ready.                                                      |
|                                                             |
| PROJECTS                                                    |
|   🌿 1. The Moss     🎵 2. arkvoice     🎮 3. steamtower    |
|   🌏 4. GitHub       🌏 5. BLOG                             |
|                                                             |
| Type "help" for help.                                       |
|                                                             |
| looko@home:~$ 🁢                                             |
+-------------------------------------------------------------+
```

整个页面只有一个终端窗口：

* 顶部是系统标题与启动信息；
* 中间是历史输出；
* 底部是输入行；
* 历史输出遵循真实终端的信息流方向：旧内容在上，最新输出始终追加在最底部；
* 当前可输入的提示符必须始终位于历史输出之后，也就是整个 Terminal 的最底部；
* 当输出内容超出可视区域时，界面应自动滚动到底部，优先保证用户能看到最新输出和当前输入行；
* 所有项目入口都以内联终端输出的形式出现。
* 终端窗口本身应具有旧显示器或早期系统控制台的气质，而不是现代面板式 UI。
* 可以加入非常轻微的屏幕辉光、扫描线、噪点或边框质感，但必须克制，不能影响阅读。

---

# 5. Terminal

Terminal 是整个网站本身。

启动时：

```text
+-------------------------------------------------------------+
| LOOKO Terminal Version 1.0                                  |
| Initializing...                                             |
| Ready.                                                      |
|                                                             |
| PROJECTS                                                    |
|   🌿 1. The Moss     🎵 2. arkvoice     🎮 3. steamtower    |
|   🌏 4. GitHub       🌏 5. BLOG                             |
|                                                             |
| Type "help" for help.                                       |
|                                                             |
| looko@home:~$ 🁢                                             |
+-------------------------------------------------------------+
```

随后等待用户输入。

终端行为需要尽可能贴近真实 Terminal：

* 输入光标应紧跟在用户已经输入的内容之后，而不是固定停留在输入区域末端的某个绝对位置；
* 当用户尚未输入任何内容时，光标应直接位于提示符后方；
* 用户按下回车后，当前输入行会保留在历史记录中，命令结果紧接着输出在下一行，再在最底部生成新的提示符；
* 整个交互过程应保持单一文本流，不能把输入区做成脱离历史输出的独立表单面板；
* 光标可使用块状或下划线闪烁形式，但风格必须统一，并符合整体复古终端气质。

---

# 6. 内置命令

## help

显示帮助。

```text
Available commands

help
ls
open
about
clear
```

---

## ls

列出所有项目。

```text
PROJECTS                                             
  🌿 1. The Moss     🎵 2. arkvoice     🎮 3. steamtower     
  🌏 4. GitHub       🌏 5. BLOG                            
```

---

## open

打开项目。

例如：

```text
open moss
```

或者序号

```text
open 1
```

输出：

```text
Opening Moss...
```

随后跳转。

支持：

```text
open moss

open arkvoice

open steamtower

open github

open blog

open 1

open 2

open 3

open 4

open 5
```

---

## about

介绍作者。

例如：

```text
Looko

Backend Developer / Full Stack Developer

Building useful things.
```

---

## clear

清空终端。


## ↑ ↓

历史命令。

体验类似 Bash。

---

# 8. 终端内点击导航

项目列表可以在终端输出中直接点击。

例如：

```text
  🌿 1. The Moss     🎵 2. arkvoice     🎮 3. steamtower     
  🌏 4. GitHub       🌏 5. BLOG      
```

输出中的项目名或链接名可点击，点击后直接跳转。

点击项在视觉上仍然应表现为终端输出内容，而不是普通网页超链接。

可通过以下方式表达可点击状态：

* 悬浮时仅改变文字亮度、下划线、前缀符号或反色效果
* 不使用默认蓝色链接样式
* 不出现明显按钮感、胶囊感或卡片感

因此：

* 普通用户可以直接点击终端中的项目；
* 开发者可以通过命令交互完成同样操作。

两种方式仍然等价，但都发生在 Terminal 内部。

---

# 9. 彩蛋

加入一些开发者彩蛋。

例如：

## whoami

```text
Looko
```

---

## pwd

```text
/home/looko
```

---

## date

输出当前时间。

---

## fastfetch / neofetch

输出：

```text
              _,,>#b&HMHd&&bb>\_                    looko@home
          _oHMMMMMMMMMMMMMMMMH**H:.                 ------------
        oHMMMMMMMMMMMMMMMMMMMM#v`?  `.              OS: macOS Tahoe 26.5.2 (25F84) arm64
     .dMMMMMMMMMMMMMMMMMMMMMMH*`+|     .            Host: MacBook Pro (14-inch, 2021)
    ,MMMMMMMMMMMMMMMMMMMMMb|?+.,H       -.          Kernel: Darwin 25.5.0
   ddHMMMMMMMMMMMMMMMMMMMMMb  `'          .         Uptime: 5 days, 21 hours, 23 mins
  HMMkZ**HMMMMMMMMMMMMMMMMH\  -   .        :        Packages: 118 (brew), 53 (brew-cask)
 dTMMM*  `9MMMP'"*MMMMPT"` ..               :       Shell: Looko-Shell 5.9
|M6H''    4MP'   `"HMMM|   !|.      .        .      Display (Color LCD): 2294x1490 @ 2x in 14", 120 Hz [Built-in]
1MHp'      #L      $ *"'  .-:&.              .      WM: Quartz Compositor 1.600.0
MMM'        "     q:H.  .o#-``'              :      WM Theme: Multicolor (Light)
MM'                ?H?.|MMH::::-o,_.         -      Theme: Liquid Glass
M[                  `*?:::'|` `"`:9MH\~-.    `      Font: .AppleSystemUIFont [System], Helvetica [User]
&M.                     ""'`'^'.:.`?'`. '|  -:      Cursor: Fill - Black, Outline - White (32px)
`M|d,                       .dbHM[.1?     .. :      Terminal: iTerm 3.6.11
 9||| .                  _obMMMMMMMMH,   .  :       Terminal Font: HackNF-Regular (12pt)
  H.^                    MMMMMMMMMMMM}     -        CPU: Apple M1 Max (8+2) @ 3.23 GHz
   \                     |MMH#*HMMMMH'    .'        GPU: Apple M1 Max (32) @ 1.30 GHz [Integrated]
    .                    `      `#*'   ,:-          Memory: 49.67 GiB / 64.00 GiB (78%)
     `                           '' .-'.            Swap: Unused
       `.                           .-              Disk (/): 768.88 GiB / 926.35 GiB (83%) - apfs [Read-only]
          '- .                   .-`                Battery (bq40z651): 80% [AC Connected]
              '`\bqHMMMMMMHHb--`                    Locale: zh_CN.UTF-8
```

---

## sudo

```text
You are already root.
```

---

## rm -rf /

```text
Nice try :)
```

---

未知命令：

```text
Command not found.

Type "help".
```

---

# 10. 页面动画

动画保持克制。

仅保留：

* 启动时的逐行初始化输出
* 光标闪烁
* 输入逐字打印
* 命令执行后的短暂响应延迟
* 跳转前短暂 Loading

不加入：

* 粒子背景
* 复杂 3D
* 大量特效
* 炫酷转场
* 明显现代化的弹性动画或浮层动效

整体偏静态，并更接近老终端缓慢、克制、带少量机械感的反馈节奏。

---

# 11. 响应式

桌面：

单 Terminal 居中显示。

平板：

单 Terminal 缩窄。

手机：

单 Terminal 全宽显示。

所有项目入口都在 Terminal 内保持可点击。

---

# 12. 技术要求

HTML：

负责页面结构。

CSS：

负责：

* 配色
* 排版
* Terminal 风格
* 响应式

JavaScript：

负责：

* Terminal
* 命令解析
* 命令补全
* 历史记录
* 页面跳转

无需任何框架。

---

# 13. 项目结构

```text
/
├── index.html
├── style.css
├── app.js
├── favicon.ico
└── assets/
```

保持极简。

---

# 14. 后续扩展

未来可以增加：

* Theme（Dark / Light）
* 搜索项目
* 项目分类
* Recent Updates
* RSS
* 更多彩蛋
* 多语言

但第一版尽量保持简单。

---

# 15. 核心理念

LOOKO Terminal 并不是“一个页面里放了一个终端组件”。

它本身就应该像一整个 Terminal。

所有信息、导航、提示、反馈、跳转，都应该在这一个 Terminal 里完成。

访客无需学习命令即可使用，因为项目入口本身也会以内联终端输出的方式出现并支持点击。

整个网站的目标不是炫技，而是通过一个完整、一致、真实的 Terminal 体验，展示个人项目、知识沉淀与创作成果。
