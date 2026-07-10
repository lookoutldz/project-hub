# LOOKO OS - 个人导航主页

## 1. 项目简介

LOOKO OS 是一个纯前端的个人导航主页。

它不是传统的网址导航，而是一个模拟终端（Terminal）的个人操作系统（Personal OS），作为所有个人项目的统一入口。

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
* 也可以直接点击页面中的项目进行跳转。

终端只是交互方式，而不是使用门槛。

---

# 3. 整体风格

整体采用现代终端风格。

特点：

* 全黑背景
* 等宽字体
* 极简 UI
* 无图片依赖
* 无复杂装饰
* 内容优先

推荐字体：

* JetBrains Mono
* IBM Plex Mono

整体视觉类似：

```text
LOOKO OS

Type "help" to begin.

looko@home:~$
```

---

# 4. 页面布局

采用左右布局（桌面端）。

```text
+------------------------------------------------------+

LOOKO OS

Terminal                    Projects

looko@home:~$                🌱 Moss

                             🎵 ArkVoice

                             🎮 SteamTower

                             📦 GitHub

                             📝 Blog

+------------------------------------------------------+
```

左侧：

* Terminal

右侧：

* 导航项目
* 永久可见
* 支持点击

---

手机端改为上下布局：

```text
LOOKO OS

Terminal

looko@home:~$

--------------------

Projects

🌱 Moss

🎵 ArkVoice

🎮 SteamTower
```

---

# 5. Terminal

Terminal 是整个网站的核心。

启动时：

```text
LOOKO OS

Version 1.0

Initializing...

Ready.

Type "help" to begin.

looko@home:~$
```

随后等待用户输入。

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
Projects

moss
arkvoice
steamtower

Links

github
blog
```

---

## open

打开项目。

例如：

```text
open moss
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

---

# 7. 快捷键

支持：

## Tab

命令补全。

例如：

```text
open m
```

按 Tab：

```text
open moss
```

---

## ↑ ↓

历史命令。

体验类似 Bash。

---

## Ctrl + L

清屏。

等同：

```text
clear
```

---

# 8. 点击导航

所有导航项均可点击。

例如：

```
🌱 Moss
```

点击：

直接跳转。

因此：

* 普通用户无需输入命令；
* 开发者可以体验 Terminal。

两种方式完全等价。

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
LOOKO OS

Projects

Moss
ArkVoice
SteamTower

Languages

Kotlin
Java

Frameworks

Spring Boot
Godot
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

* 页面淡入
* 光标闪烁
* 输入逐字打印
* 跳转前短暂 Loading

不加入：

* 粒子背景
* 复杂 3D
* 大量特效
* 炫酷转场

整体偏静态。

---

# 11. 响应式

桌面：

左右布局。

平板：

左右布局但缩窄。

手机：

上下布局。

所有项目保持可点击。

Terminal 始终保留。

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

LOOKO OS 并不是为了模拟 Linux。

它是一个属于自己的个人操作系统。

访客无需学习命令即可使用。

熟悉终端的人，则可以获得更多交互乐趣。

整个网站的目标不是炫技，而是通过一种熟悉且富有开发者气质的交互方式，展示个人项目、知识沉淀与创作成果。
