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
| Mounting 6 routes... ok                                      |
| Ready.                                                       |
|                                                              |
| PROJECTS                                                     |
|   [1] the-moss    [2] terra-echo  [3] github      [4] blog   |
|   [5] arklite     [6] byteriot                               |
|                                                              |
| Type "help" for commands, or click a project.                |
|                                                              |
| looko@home:~$ █                                              |
|                                                              |
|██ LOOKO-TTY1 │ 6 routes │ ↑↓ history  Tab complete │ 22:14 ██|
+--------------------------------------------------------------+
```

宽屏（宽 ≥ 960px 且高 ≥ 560px）时，`PROJECTS` 下方的项目列表改为一排截图卡片，每张卡片是项目截图加 `[序号] 名称`：

```text
| PROJECTS                                                     |
|   +----------+  +----------+  +----------+  +----------+     |
|   | 截图     |  | 截图     |  | 截图     |  | 截图     |     |
|   +----------+  +----------+  +----------+  +----------+     |
|   [1] the-moss  [2] terra-echo [3] github   [4] blog         |
```

* 卡片宽度随屏幕伸缩，放不下时换行，整排最宽 172 列；
* 截图与 `info` 中一样是磷光单色，平时调暗，悬停或键盘聚焦时恢复全亮并显示亮色描边，同时只有名称反色；
* 没有截图的项目、截图加载失败时只显示名称；
* 窄屏保持上面的纯文字列表；`ls` 始终输出纯文字列表。

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
| 中 | 项目数量，如 `6 routes`；跳转时显示 `OPENING <name>` |
| 中 | 快捷键提示 `↑↓ history  Tab complete`（窄屏隐藏） |
| 右 | 当前时间 `HH:MM` |

---

# 5. 项目数据

所有项目定义在 `js/projects.js` 中，是唯一数据来源。启动画面、`ls`、`open`、`info`、补全、短链都直接读取它。

| 序号 | 名称 | 别名 | 简介 | 地址 | 短链 |
| --- | --- | --- | --- | --- | --- |
| 1 | `the-moss` | `moss` | a digital garden of notes and thoughts | `https://moss.lookoutldz.top/` | `/the-moss`、`/moss` |
| 2 | `terra-echo` | `terraecho` | a music archive from the world of Terra | `https://terraecho.top/` | `/terra-echo`、`/terraecho` |
| 3 | `github` | `gh` | source code and side projects | `https://github.com/lookoutldz/` | `/github`、`/gh` |
| 4 | `blog` | `juejin` | technical writing on Juejin | `https://juejin.cn/user/4341288062690398` | `/blog`、`/juejin` |
| 5 | `arklite` | `ark` | an Arknights-inspired online game | `https://arklite.lookoutldz.top/` | `/arklite`、`/ark` |
| 6 | `byteriot` | `riot` | an independent game studio | `https://byteriot.top/` | `/byteriot`、`/riot` |

简介为英文短句，不超过 40 个字符，用于 `ls -l` 和 `info`。

项目在终端中显示为 `[序号] 名称`，例如 `[1] the-moss`。

新增、修改或下架项目时，只需修改 `js/projects.js` 这一个文件：

* 启动画面的项目列表、`Mounting N routes`、状态栏的项目数量都由 JS 从它生成；
* 短链由 Pages Function `functions/[name].js` 读取同一份数据，每个名称和别名自动成为短链；
* 短链只按名称和别名匹配，不按序号匹配，项目重新排序后已分享的短链不会指向别的项目；
* `index.html`、meta 描述和分享图不包含具体项目，`tests/site.test.js` 会校验 `index.html` 中没有写死项目列表。

---

# 6. 终端行为

## 6.1 启动

* 启动信息、项目列表和提示语由 JS 根据 `js/projects.js` 输出，`index.html` 中不写死；
* 以逐行输出的方式显示这些内容（每行约 120ms），然后显示提示符；
* 同一浏览器会话内再次访问时跳过启动动画；
* 启动过程中按任意键或点击屏幕可立即跳过；
* 开启“减少动态效果”（`prefers-reduced-motion: reduce`）时不播放启动动画。

## 6.2 输入与执行

* 按 Enter 后，当前输入行连同提示符保留在历史中，结果紧接着输出在下一行，最后在底部生成新提示符；
* 命令执行前有约 80ms 的短暂响应延迟；
* 命令不区分大小写，参数按空白分隔；
* 空输入按 Enter 只回显一行空提示符；
* 命令执行期间按 Enter，当前输入会排队，在上一条命令结束后依次执行，与真实终端的 type-ahead 一致。

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
* `open`、`info`、`man`、`theme`、`cat`、`cd`、`which` 补全对应参数；
* 有唯一候选时直接补全；有多个候选时补全公共前缀，并以暗色列出候选。

## 6.5 点击导航

* 项目条目是真实的 `<a href>` 链接，样式完全是终端文字；宽屏启动画面中整张截图卡片是一个链接；
* 悬停或键盘聚焦时整项反色显示（截图卡片见第 4 节）；
* 普通左键点击：在输入行逐字“打出” `open <名称>` 并执行，与手动输入完全等价；
* Ctrl / Cmd / Shift / 中键点击：交给浏览器原生行为（新标签页等），终端不拦截；
* 跳转在当前标签页进行，跳转前输出 `Opening <名称>...` 并短暂停顿约 500ms；
* 从目标页面返回时（bfcache 恢复），终端恢复为可输入状态。

## 6.6 焦点

* 点击屏幕任意空白处聚焦输入；
* 如果用户正在选择文本，则不抢夺焦点，保证可以复制输出内容。

## 6.7 分享链接

* 访问 `/?cmd=<命令>`（如 `/?cmd=fastfetch`、`/?cmd=ls+-l`）时，终端启动完成后在输入行逐字打出该命令并执行，与手动输入完全等价；
* 命令中的换行视为空格，首尾空白去除，最长 200 个字符；
* 页面的 canonical 始终指向首页，带参数的链接不会被搜索引擎当作重复页面。

---

# 7. 命令

## 7.1 公开命令（出现在 help 中）

| 命令 | 说明 |
| --- | --- |
| `help` | 列出公开命令及简介 |
| `ls [-lah]` | 列出项目；`-l` 显示序号、名称和简介，`-a` 额外显示隐藏文件，`-h` 为兼容习惯而接受、不改变输出；参数可合并（如 `-lah`） |
| `open <target>` | 打开项目；`target` 可以是序号、名称或别名 |
| `info <target>` | 显示项目详情：简介、截图、地址、别名、短链 |
| `about` | 介绍作者 |
| `history` | 列出本次会话的历史命令 |
| `theme [amber\|green]` | 查看或切换配色，选择保存在本地 |
| `man <command>` | 显示命令用法 |
| `clear` | 清屏 |
| `home` | 清屏后立即重新显示启动画面（含宽屏截图卡片），不播放逐行动画 |

`open` 的输出示例：

```text
looko@home:~$ open moss
Opening the-moss...
```

`info` 的输出示例：

```text
looko@home:~$ info moss
[1] the-moss
  a digital garden of notes and thoughts

  ┌──────────────────────────────┐
  │     (the-moss 磷光单色截图)    │
  └──────────────────────────────┘

  url      https://moss.lookoutldz.top/
  aliases  moss
  short    lookoutldz.top/the-moss
  open     open the-moss
```

其中 url 是可点击的项目链接。`info` 的错误处理与 `open` 相同。

截图来自项目的可选字段 `thumb`（`assets/thumbs/<名称>.webp`，640×400）：

* 宽度最多 48 列，窄屏时缩到屏幕宽度，按 16:10 预留高度，加载完成前不会让输出跳动；
* 用 CSS 转成灰度后与磷光色正片叠底，白色变成当前磷光色、黑色保持黑色，切换 `theme green` 时随之变绿，扫描线照常覆盖，不破坏单色原则；
* 截图本身也是项目链接，点击与点击项目名相同（打出 `open <名称>`），悬停或聚焦时显示亮色描边；
* 没有 `thumb` 或图片加载失败时不显示截图，其余输出不变。

`open` 的错误处理：

```text
looko@home:~$ open
usage: open <target>
targets: 1-6, the-moss, terra-echo, github, blog, arklite, byteriot

looko@home:~$ open foo
 ERR  open: no such target: foo
targets: 1-6, the-moss, terra-echo, github, blog, arklite, byteriot
```

`about` 输出：

```text
Looko
Backend Developer / Full Stack Developer
Building useful things.
```

家目录中有两个文件：`about.md`（与 `about` 等价）和隐藏文件 `.plan`，`ls -a` 可以看到它们，`cat` 可以读取。

`ls` 的错误处理：未知选项输出 ` ERR  ls: invalid option -- 'x'` 和用法；`~`、`.` 等表示家目录的路径照常列出，其他路径输出 ` ERR  ls: cannot access '<path>': No such file or directory`。

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
| `cat about.md` / `cat .plan` | 输出对应文件内容 |
| `cat <其他文件>` | `cat: <file>: No such file or directory` |
| `ll` / `la` | 等同于 `ls -l` / `ls -a`，可再附加其他选项 |
| `tree` | 以树状结构列出项目，项目名可点击，如 `├── the-moss -> moss.lookoutldz.top`，末尾显示 `6 links` |
| `cd` / `cd ~` | 无输出（始终在家目录） |
| `cd <项目>` | `cd: not a directory: <项目>`，并提示 `try: open <名称>` |
| `cd ..` | `cd: there is nowhere above home` |
| `cd <其他>` | `cd: no such file or directory: <路径>` |
| `uname [-asnrvmo]` | 默认 `LOOKO`；`-a` 输出 `LOOKO home 1.0 #1 Cloudflare Pages js LOOKO/OS`；字段按固定顺序输出 |
| `uptime` | `HH:MM:SS up <本次会话时长>, 1 user, load average: 0.00, 0.00, 0.00` |
| `which <命令...>` | 存在的命令输出 `/usr/bin/<命令>`，不存在的输出 `<命令> not found` |
| `sl` | 敲错 `ls` 的经典惩罚：一列自绘的字符画火车（LOOKO EXPRESS）以每秒 30 列的速度从右向左平滑驶过整个终端宽度（按显示器刷新率逐帧移动，不按整字符跳动），烟和车轮每 160ms 交替一次以避免闪烁，驶出后消失；与原版一样不能用 Ctrl+C 中断；开启“减少动态效果”时只输出一帧静止画面 |
| `vim` / `vi` / `nvim` | 进入 vim 模式，见 7.3 |

## 7.3 vim 模式

`vim [文件]` 模拟“退不出 vim”的经典梗：

* 进入备用屏幕（alternate screen）：原有输出暂时隐藏，屏幕被 `~` 行填满，中间显示 `VIM - Vi IMproved` 启动画面；带文件名时最后一行显示 `"<文件>" [New]`；
* 提示符变为空，用户需要自己输入 `:` 开头的命令；Tab 补全和 ↑↓ 历史不可用，输入的内容不进入 shell 历史；
* `:q`、`:q!`、`:wq`、`:wq!`、`:x`、`:qa`、`:qa!`、`:wqa`、`ZZ` 退出：恢复进入前的屏幕，并输出 `You escaped vim. Not everyone does.`；
* 其他输入使用 vim 的真实报错，以反色显示：`:w` → `E32: No file name`，`:help` → `E149: Sorry, no help for LOOKO Terminal`，其他 `:` 命令 → `E492: Not an editor command: <命令>`；不以 `:` 开头的输入提示 `type  :q<Enter>  to exit`；
* Ctrl+C 输出 vim 的真实提示 `Type  :qa!  and press <Enter> to abandon all changes and exit Vim`，不会退出。
| `exit` | 输出 `logout`，清屏并重新播放启动过程 |

`fastfetch` 的信息栏包含：OS、Host、Kernel、Shell、Resolution（实际视口尺寸）、Theme、Font、Uptime（本次会话时长）、Routes、Locale（浏览器语言）。

## 7.4 未知命令

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
* 宽屏（宽 ≥ 960px 且高 ≥ 560px）：启动画面的项目列表显示为截图卡片；
* 手机（≤ 640px）：正文 14px，项目列表每行显示更少条目，状态栏隐藏快捷键提示；
* `ls -l`、`info` 等分列输出在窄屏折行时使用悬挂缩进，续行与所在列对齐，而不是退回行首；
* 隐藏的真实输入框字号保持 16px，避免 iOS 聚焦时自动放大页面；
* 所有项目入口在任何尺寸下都可点击。

---

# 10. 渐进增强与 SEO

* 为保证项目数据只有一处来源，`index.html` 不包含项目列表；不执行 JS 时，屏幕上提示 `This terminal needs JavaScript to run.`；
* 项目链接在 JS 生成后仍是真实 `<a href>`，能执行 JS 的搜索引擎可以抓取；
* 保留 meta、Open Graph、Twitter Card、JSON-LD、`robots.txt`、`sitemap.xml`；meta 描述只概括站点，不列举具体项目；
* 社交分享图使用独立的 1200×630 `assets/og.png`，内容不包含具体项目，增删项目时无需重做。

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
├── index.html          # 页面结构（不含项目数据）
├── _headers            # 响应头：缓存与 CSP
├── functions/
│   └── [name].js       # Pages Function：按 projects.js 处理短链
├── robots.txt
├── sitemap.xml
├── requirements.md
├── README.md           # 项目说明：运行、测试、增删项目、部署
├── LICENSE             # 代码使用 MIT；个人内容与字体除外
├── .github/workflows/  # CI：推送和 PR 时运行测试
├── assets/
│   ├── fonts/          # IBM Plex Mono woff2（拉丁子集）
│   ├── thumbs/         # 项目截图，启动画面卡片和 info 中显示
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── og.png
├── css/
│   └── style.css
├── js/
│   ├── theme-init.js   # 在 <head> 中提前应用已保存的配色
│   ├── main.js         # 入口：启动、事件绑定
│   ├── terminal.js     # 输出渲染、输入层、光标、滚动
│   ├── shell.js        # 分词、解析、目标匹配、补全（纯函数）
│   ├── commands.js     # 命令注册表
│   └── projects.js     # 项目数据：唯一需要修改的地方
└── tests/              # node --test，无需依赖
```

## 12.2 模块职责

* `projects.js`：导出项目列表、按序号/名称/别名查找目标的函数，以及只按名称/别名查找的短链函数。浏览器端和 Pages Function 共用这一个文件。
* `shell.js`：纯函数，不访问 DOM。负责分词、命令查找、补全、公共前缀计算、解析分享链接中的命令。
* `commands.js`：命令注册表。每条命令形如 `{ name, aliases, usage, summary, hidden, complete, run }`。`help`、`man` 和补全都从注册表生成。`run(ctx, args)` 只通过 `ctx` 与终端交互，因此可以用假 `ctx` 测试。
* `terminal.js`：维护输出区和输入层。所有文本通过 `textContent` 写入，图片用 `createElement` 创建，不使用 `innerHTML`。
* `main.js`：启动流程、键盘与点击事件、状态栏时钟、主题初始化。

## 12.3 输入层

* 一个视觉透明、覆盖在输入行上的真实 `<input>`，负责键盘、输入法和移动端软键盘；
* 旁边渲染“光标前文字 / 光标字符 / 光标后文字”三段，通过 `selectionStart` 定位块状光标；
* 输入层的文字与光标对读屏隐藏，真实输入框负责可访问性。

## 12.4 Cloudflare Pages 配置

`functions/[name].js`：处理 `/moss` 这类单段路径。匹配到项目名称或别名时 302 跳转到项目地址；否则调用 `next()` 交给静态文件（如 `/robots.txt`）。

`_headers`：

* 字体文件长期缓存（内容不变）；
* `Content-Security-Policy` 只允许同源脚本、样式、字体和图片；唯一的例外是 Cloudflare Web Analytics：脚本允许 `https://static.cloudflareinsights.com`，上报允许 `https://cloudflareinsights.com`；
* 页面中不使用内联脚本和内联样式（JSON-LD 数据块除外，它不会被执行）。

缓存：JS 和 CSS 使用 Pages 默认的 `public, max-age=0, must-revalidate`，每次通过 ETag 校验，发版后立即生效。Cloudflare 域名设置中的 Browser Cache TTL 必须为 “Respect Existing Headers”，否则浏览器可能继续使用旧版 JS。

Rocket Loader：会改写 `<script>` 并破坏 ES 模块脚本，导致终端无法启动。域名设置中应关闭 Rocket Loader；作为兜底，`index.html` 中的脚本都带 `data-cfasync="false"`，让 Rocket Loader 跳过它们，测试会校验这一点。

## 12.5 本地存储

* 配色选择保存在 `localStorage`，由 `theme-init.js` 在首次绘制前应用，避免刷新时闪现默认配色；
* “本会话已播放启动动画”标记保存在 `sessionStorage`；
* 所有存储读写都包裹在 `try/catch` 中，存储不可用时功能照常工作。

## 12.6 测试

* 使用 Node 内置测试运行器，在仓库根目录执行 `node --test`；
* 覆盖分词、目标匹配、补全、分享链接解析、短链函数、各命令的输出与错误分支；
* GitHub Actions 在推送到 `main` 和提交 PR 时自动运行测试；
* DOM 行为通过浏览器手动验证（桌面与手机宽度）。

---

# 13. 后续扩展

* 搜索项目、项目分类
* Recent Updates / RSS
* 更多彩蛋
* 多语言

第一版保持简单。
