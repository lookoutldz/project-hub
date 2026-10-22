# LOOKO Terminal - 个人导航主页

## 1. 项目简介

LOOKO Terminal 是 Looko 的个人导航主页，访问地址为 `https://lookoutldz.top/`。

它不是传统的网址导航，而是一整块模拟的琥珀色 CRT 终端屏幕，作为所有个人项目的统一入口。

设计目标：

* 轻量（Lightweight）：无框架、无构建、首屏资源尽量小
* 简洁（Minimal）：只有一块屏幕和一条状态栏
* 有个性（Unique）：像一台真实的老式字符终端
* 对开发者友好（Developer Friendly）：命令、补全、历史、短链

技术栈：

* HTML
* CSS
* JavaScript（原生 ES Modules）

不使用任何前端框架，不需要构建步骤。

部署目标：

* Cloudflare Pages（仓库根目录直接作为站点根目录发布，无构建命令）

---

# 2. 设计理念

> Everything starts from the terminal.

整个网站本身就是终端，而不是“网页里放了一个终端组件”。

因此：

* 屏幕铺满整个浏览器视口，没有窗口外框、标题栏、红黄绿按钮；
* 所有信息、导航、提示、反馈、跳转，都以终端输出的形式出现；
* 访客无需学习命令即可使用：项目入口直接以可点击的终端输出出现；
* 开发者可以用命令完成同样的操作。两种方式等价，且都发生在终端内部。

---

# 3. 视觉方案：琥珀磷光 CRT

## 3.1 单色原则

真实的老终端只有一种荧光色。整个界面只使用一种磷光色相，通过亮度和反色区分信息，不混入其他颜色。

| 层级 | 用途 |
| --- | --- |
| 暗（dim） | 启动日志、提示、补全候选、次要信息 |
| 正常（normal） | 正文、提示符 |
| 亮（bright） | 标题、用户输入、强调 |
| 反色（inverse） | 链接悬停/聚焦、状态栏、错误标记、光标 |

默认配色（琥珀）：

| Token | 值 |
| --- | --- |
| `--bg` | `#0c0904` |
| `--fg` | `#ffb000` |
| `--fg-bright` | `#ffd480` |
| `--fg-dim` | `#a87614` |

所有前景色与背景的对比度必须不低于 WCAG AA（4.5:1）。

可选配色（绿色磷光，通过 `theme green` 切换）：

| Token | 值 |
| --- | --- |
| `--bg` | `#030a05` |
| `--fg` | `#33ff66` |
| `--fg-bright` | `#b3ffc6` |
| `--fg-dim` | `#1f9c40` |

## 3.2 禁止项

* 窗口外框、标题栏、macOS 风格圆点
* 卡片、按钮外观、胶囊、圆角
* UI 层面的投影与渐变（屏幕质感除外，见 3.4）
* 默认蓝色链接与默认下划线链接
* emoji（非等宽、跨平台不一致，会破坏对齐）
* 粒子、3D、弹性动画、浮层动效、炫酷转场

## 3.3 字体

* 主字体：IBM Plex Mono（400 / 600），自托管 woff2，仅包含拉丁字符子集
* 不依赖 Google Fonts 等第三方字体服务（国内访问不稳定）
* 回退：`ui-monospace, "SF Mono", Menlo, Consolas, "Noto Sans Mono CJK SC", monospace`
* 正文字号：桌面 16px，手机 14px

## 3.4 屏幕质感

仅允许以下三种屏幕质感，且必须克制，不影响阅读：

* 文字辉光：很弱的 `text-shadow`（2–3px）
* 扫描线：极淡的横向扫描线叠加层
* 暗角：屏幕四周轻微变暗

用户开启“提高对比度”（`prefers-contrast: more`）时关闭辉光、扫描线和暗角。

## 3.5 光标

* 块状光标，使用反色显示光标所在字符；
* 光标紧跟在已输入内容之后；未输入时紧贴提示符；
* 光标可随 ← → / Home / End 在输入内容中移动，并正确定位；
* 闪烁为 1 秒周期的生硬开关（`steps`），不使用渐隐；输入时暂停闪烁；
* 输入框失去焦点时显示为空心块状光标。

---

# 4. 页面布局

整个页面只有两部分：

```text
+--------------------------------------------------------------+
| LOOKO OS 1.0 (tty1)                                          |
| Initializing... ok                                           |
| Mounting 5 routes... ok                                      |
| Ready.                                                       |
|                                                              |
| PROJECTS                                                     |
|   [1] the-moss    [2] arkvoice    [3] steamtower             |
|   [4] github      [5] blog                                   |
|                                                              |
| Type "help" for commands, or click a project.                |
|                                                              |
| looko@home:~$ █                                              |
|                                                              |
|██ LOOKO-TTY1 │ 5 routes │ ↑↓ history  Tab complete │ 22:14 ██|
+--------------------------------------------------------------+
```

* 屏幕区：铺满视口，内部滚动；
* 状态栏：固定在底部，反色单行，参考 tmux / vim 状态栏。

屏幕区规则：

* 历史输出遵循真实终端的信息流方向：旧内容在上，新输出追加在底部；
* 当前提示符始终位于所有历史输出之后；
* 有新输出时自动滚动到底部，保证能看到最新输出和输入行；
* 整个交互是单一文本流，输入行不能做成脱离输出的独立表单面板。

状态栏内容：

| 区域 | 内容 |
| --- | --- |
| 左 | `LOOKO-TTY1` |
| 中 | 项目数量，如 `5 routes`；跳转时显示 `OPENING <name>` |
| 中 | 快捷键提示 `↑↓ history  Tab complete`（窄屏隐藏） |
| 右 | 当前时间 `HH:MM` |

---

# 5. 项目数据

所有项目定义在 `js/projects.js` 中，是唯一数据来源。首屏 HTML、`ls`、`open`、补全、短链都与它保持一致。

| 序号 | 名称 | 别名 | 地址 | 短链 |
| --- | --- | --- | --- | --- |
| 1 | `the-moss` | `moss` | `https://moss.lookoutldz.top/` | `/the-moss`、`/moss` |
| 2 | `arkvoice` | | `https://arkvoice.top/` | `/arkvoice` |
| 3 | `steamtower` | | `https://steamtower.top/` | `/steamtower` |
| 4 | `github` | `gh` | `https://github.com/lookoutldz/` | `/github`、`/gh` |
| 5 | `blog` | `juejin` | `https://juejin.cn/user/4341288062690398` | `/blog`、`/juejin` |

项目在终端中显示为 `[序号] 名称`，例如 `[1] the-moss`。

每个名称和别名都有对应短链。新增或修改项目时，需要同步更新 `js/projects.js`、`index.html` 首屏列表和 `_redirects`；`tests/site.test.js` 会校验三者一致。

---

# 6. 终端行为

## 6.1 启动

* 首屏的启动信息、项目列表和提示语直接写在 `index.html` 中；
* JS 加载后以逐行输出的方式重放这些内容（每行约 120ms），然后显示提示符；
* 同一浏览器会话内再次访问时跳过启动动画；
* 启动过程中按任意键或点击屏幕可立即跳过；
* 开启“减少动态效果”（`prefers-reduced-motion: reduce`）时不播放启动动画。

## 6.2 输入与执行

* 按 Enter 后，当前输入行连同提示符保留在历史中，结果紧接着输出在下一行，最后在底部生成新提示符；
* 命令执行前有约 80ms 的短暂响应延迟；
* 命令不区分大小写，参数按空白分隔；
* 空输入按 Enter 只回显一行空提示符。

## 6.3 快捷键

| 按键 | 行为 |
| --- | --- |
| Enter | 执行命令 |
| ↑ / ↓ | 浏览历史命令，体验类似 Bash |
| Tab | 补全命令或参数；有多个候选时列出候选 |
| Ctrl+L | 清屏 |
| Ctrl+C | 取消当前输入，回显 `^C` |
| Ctrl+U | 删除光标前的内容 |

## 6.4 补全

* 空输入时按 Tab 列出公开命令；
* 第一个词有前缀时补全命令名，匹配范围包括彩蛋命令（方便探索发现）；
* `open`、`man`、`theme` 补全对应参数；
* 有唯一候选时直接补全；有多个候选时补全公共前缀，并以暗色列出候选。

## 6.5 点击导航

* 项目条目是真实的 `<a href>` 链接，样式完全是终端文字；
* 悬停或键盘聚焦时整项反色显示；
* 普通左键点击：在输入行逐字“打出” `open <名称>` 并执行，与手动输入完全等价；
* Ctrl / Cmd / Shift / 中键点击：交给浏览器原生行为（新标签页等），终端不拦截；
* 跳转在当前标签页进行，跳转前输出 `Opening <名称>...` 并短暂停顿约 500ms；
* 从目标页面返回时（bfcache 恢复），终端恢复为可输入状态。

## 6.6 焦点

* 点击屏幕任意空白处聚焦输入；
* 如果用户正在选择文本，则不抢夺焦点，保证可以复制输出内容。

---

# 7. 命令

## 7.1 公开命令（出现在 help 中）

| 命令 | 说明 |
| --- | --- |
| `help` | 列出公开命令及简介 |
| `ls [-l]` | 列出项目；`-l` 显示序号、名称和域名 |
| `open <target>` | 打开项目；`target` 可以是序号、名称或别名 |
| `about` | 介绍作者 |
| `history` | 列出本次会话的历史命令 |
| `theme [amber\|green]` | 查看或切换配色，选择保存在本地 |
| `man <command>` | 显示命令用法 |
| `clear` | 清屏 |

`open` 的输出示例：

```text
looko@home:~$ open moss
Opening the-moss...
```

`open` 的错误处理：

```text
looko@home:~$ open
usage: open <target>
targets: 1-5, the-moss, arkvoice, steamtower, github, blog

looko@home:~$ open foo
 ERR  open: no such target: foo
targets: 1-5, the-moss, arkvoice, steamtower, github, blog
```

`about` 输出：

```text
Looko
Backend Developer / Full Stack Developer
Building useful things.
```

`cat about.md` 与 `about` 等价。

## 7.2 彩蛋命令（不出现在 help 中）

| 命令 | 输出 |
| --- | --- |
| `whoami` | `looko` |
| `pwd` | `/home/looko` |
| `date` | 当前本地时间，如 `2026-10-22 22:14:05 Asia/Shanghai` |
| `echo <text>` | 原样输出文本 |
| `fastfetch` / `neofetch` | 字符画显示器 + 系统信息（窄屏时信息排在字符画下方） |
| `sudo <any>` | `You are already root.` |
| `rm -rf /` | `Nice try :)` |
| `rm <其他>` | `rm: read-only file system` |
| `cat <其他文件>` | `cat: <file>: No such file or directory` |
| `exit` | 输出 `logout`，清屏并重新播放启动过程 |

`fastfetch` 的信息栏包含：OS、Host、Kernel、Shell、Resolution（实际视口尺寸）、Theme、Font、Uptime（本次会话时长）、Routes、Locale（浏览器语言）。

## 7.3 未知命令

```text
looko@home:~$ foo
 ERR  command not found: foo
Type "help" for available commands.
```

其中 ` ERR ` 以反色显示。

---

# 8. 动画

仅保留：

* 启动时的逐行输出
* 光标闪烁
* 点击项目时输入行逐字打出命令
* 命令执行前的短暂延迟
* 跳转前的短暂停顿

开启“减少动态效果”时：不播放启动动画、光标不闪烁、点击项目时命令直接出现。

整体节奏接近老终端：缓慢、克制、略带机械感。

---

# 9. 响应式

* 所有尺寸下都是全屏单屏幕，没有外边距；
* 使用 `100dvh`，并在移动端跟随 `visualViewport` 调整高度，避免软键盘遮挡输入行；
* 手机（≤ 640px）：正文 14px，项目列表每行显示更少条目，状态栏隐藏快捷键提示；
* 隐藏的真实输入框字号保持 16px，避免 iOS 聚焦时自动放大页面；
* 所有项目入口在任何尺寸下都可点击。

---

# 10. 渐进增强与 SEO

* 不执行 JS 时：首屏启动信息与项目链接完整可见、可点击，只是没有提示符和命令交互；
* 首屏链接是真实 `<a href>`，搜索引擎可以抓取；
* JS 执行失败时，首屏内容在约 2 秒后自动显示，不会一直空白；
* 保留现有 meta、Open Graph、Twitter Card、JSON-LD、`robots.txt`、`sitemap.xml`；
* 社交分享图使用独立的 1200×630 `assets/og.png`。

---

# 11. 可访问性

* 输出区使用 `role="log"`，新输出可被读屏软件播报；
* 真实输入框有可读的 `aria-label`；视觉上的文字和光标层对读屏隐藏；
* 项目链接可通过 Tab 键聚焦，聚焦样式与悬停一致（整项反色）；
* 颜色对比度满足 WCAG AA。

---

# 12. 技术方案

## 12.1 项目结构

```text
/
├── index.html          # 页面结构与首屏静态输出
├── _redirects          # Cloudflare Pages 短链
├── _headers            # 响应头：缓存与 CSP
├── robots.txt
├── sitemap.xml
├── requirements.md
├── assets/
│   ├── fonts/          # IBM Plex Mono woff2（拉丁子集）
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── og.png
├── css/
│   ├── style.css
│   └── noscript.css    # 无 JS 时显示首屏内容
├── js/
│   ├── main.js         # 入口：启动、事件绑定
│   ├── terminal.js     # 输出渲染、输入层、光标、滚动
│   ├── shell.js        # 分词、解析、目标匹配、补全（纯函数）
│   ├── commands.js     # 命令注册表
│   └── projects.js     # 项目数据
└── tests/              # node --test，无需依赖
```

## 12.2 模块职责

* `projects.js`：导出项目列表与按序号、名称、别名查找目标的函数。
* `shell.js`：纯函数，不访问 DOM。负责分词、命令查找、补全、公共前缀计算。
* `commands.js`：命令注册表。每条命令形如 `{ name, aliases, usage, summary, hidden, complete, run }`。`help`、`man` 和补全都从注册表生成。`run(ctx, args)` 只通过 `ctx` 与终端交互，因此可以用假 `ctx` 测试。
* `terminal.js`：维护输出区和输入层。所有文本通过 `textContent` 写入，不使用 `innerHTML`。
* `main.js`：启动流程、键盘与点击事件、状态栏时钟、主题初始化。

## 12.3 输入层

* 一个视觉透明、覆盖在输入行上的真实 `<input>`，负责键盘、输入法和移动端软键盘；
* 旁边渲染“光标前文字 / 光标字符 / 光标后文字”三段，通过 `selectionStart` 定位块状光标；
* 输入层的文字与光标对读屏隐藏，真实输入框负责可访问性。

## 12.4 Cloudflare Pages 配置

`_redirects`：为每个项目提供短链，例如 `/moss` 302 跳转到对应项目地址。

`_headers`：

* 字体文件长期缓存（内容不变）；
* `Content-Security-Policy` 只允许同源脚本、样式、字体和图片；
* 页面中不使用内联脚本和内联样式（JSON-LD 数据块除外，它不会被执行）。

## 12.5 本地存储

* 配色选择保存在 `localStorage`；
* “本会话已播放启动动画”标记保存在 `sessionStorage`；
* 所有存储读写都包裹在 `try/catch` 中，存储不可用时功能照常工作。

## 12.6 测试

* 使用 Node 内置测试运行器，在仓库根目录执行 `node --test`；
* 覆盖分词、目标匹配、补全、各命令的输出与错误分支；
* DOM 行为通过浏览器手动验证（桌面与手机宽度）。

---

# 13. 后续扩展

* 搜索项目、项目分类
* Recent Updates / RSS
* 更多彩蛋
* 多语言

第一版保持简单。
