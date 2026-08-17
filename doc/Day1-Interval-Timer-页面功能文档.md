# Day 1 — Interval Timer 页面功能文档

状态：待确认，确认前不进入代码开发  
计划来源：`doc/迭代计划-2个月.md` Day 1  
目标路由：`/timer/interval-timer`、`/zh/timer/interval-timer`、`/zh-hant/timer/interval-timer`、`/ja/timer/interval-timer`
文档日期：2026-08-10

## 1. 页面定位

`/timer/interval-timer` 是一个通用的在线间歇计时器，用于自动交替执行 Work / Rest 阶段并重复指定轮数。

页面首先解决“无需安装应用，打开浏览器即可运行多轮工作/休息计时”的任务，同时覆盖以下场景：

- HIIT 与 Tabata 训练。
- Circuit Training、体能站点和 PE 课堂。
- 课堂小组轮换、学习站轮换和活动切换。
- 通用工作/休息循环。

页面不替代首页 Classroom Timer，也不替代后续 Pomodoro Timer：

- Classroom Timer：单次课堂倒计时为主，Interval 只是次要设置。
- Interval Timer：通用多轮 Work / Rest 循环，允许自定义秒级间隔。
- Pomodoro Timer：围绕番茄工作法、25/5 流程和专注统计。

## 2. 关键词策略

### 2.1 关键词结论

| 层级 | 关键词 | 页面用途 |
|---|---|---|
| 主关键词 | `online interval timer` | Title、Meta Description、H1、首段、WebApplication 名称 |
| 核心词根 | `interval timer` | URL、正文自然复现、内链锚文本 |
| 副关键词 | `HIIT timer` | HIIT 预设、典型场景、FAQ |
| 副关键词 | `Tabata timer` | 20/10 × 8 预设、说明区、FAQ |
| 副关键词 | `circuit timer` | Circuit / station rotation 场景 |
| 副关键词 | `workout interval timer` | 健身场景正文，不进入 H1 |
| 差异化副词 | `classroom interval timer` | 课堂轮换预设、教师场景、站内内链 |

主关键词选择 `online interval timer`，原因：

1. 与 `/timer/interval-timer` 路由和工具功能完全一致。
2. 当前搜索结果以“浏览器直接运行的可配置 Work / Rest 工具”为主要意图。
3. `HIIT timer` 和 `Tabata timer` 的搜索意图更垂直，适合作为预设与内容入口，不适合取代通用页面主词。
4. ClassroomTimers 的产品差异是课堂大屏体验，但当前该词的搜索结果仍明显偏运动训练，因此页面不能只写教师场景。

### 2.2 长尾关键词

按页面真实功能组织，不单独堆成标签区：

| 优先级 | 长尾关键词 | 承接位置 |
|---|---|---|
| P0 | `free online interval timer` | Title/首段/FAQ |
| P0 | `custom interval timer online` | 自定义设置区/How to use |
| P0 | `interval timer with sound` | 声音设置/FAQ |
| P0 | `20 10 interval timer` | Tabata 预设 |
| P0 | `HIIT interval timer online` | HIIT 场景与 FAQ |
| P1 | `40 20 interval timer` | HIIT 预设 |
| P1 | `30 30 interval timer` | Circuit 预设或相关示例 |
| P1 | `Tabata timer 20 seconds 10 seconds` | Tabata 说明 |
| P1 | `circuit training timer online` | Circuit 场景 |
| P1 | `work rest timer online` | 通用说明 |
| P1 | `round timer online` | 轮次说明/FAQ |
| P1 | `classroom rotation timer` | 课堂轮换预设与教师场景 |
| P1 | `station rotation timer` | 课堂/PE 站点场景 |
| P2 | `interval timer no download` | FAQ |
| P2 | `interval timer fullscreen` | 投屏说明/FAQ |
| P2 | `repeating interval timer` | 循环模式说明 |

### 2.3 本地化关键词

这些是语义本地化目标，不代表已取得本地搜索量数据；上线后再用 GSC 查询词校正。

| Locale | 主关键词 | 副关键词 |
|---|---|---|
| `en` | Online Interval Timer | HIIT Timer、Tabata Timer、Circuit Timer、Classroom Interval Timer |
| `zh` | 在线间歇计时器 | HIIT 计时器、Tabata 计时器、循环计时器、课堂轮换计时器 |
| `zh-hant` | 線上間歇計時器 | HIIT 計時器、Tabata 計時器、循環計時器、課堂輪換計時器 |
| `ja` | オンラインインターバルタイマー | HIIT タイマー、Tabata タイマー、サーキットタイマー、授業ローテーションタイマー |

### 2.4 当前 SERP 观察

本次没有可用的付费关键词量工具，因此不虚构搜索量或难度；关键词优先级依据当前结果页意图、页面相关性和产品匹配度确定。

- [Seconds Interval Timer](https://www.intervaltimer.com/) 使用 “Free Online Interval Timer” 作为 H1，同时覆盖 HIIT、Tabata、Circuit、Pomodoro 和课堂场景。
- [MyTabata Pro](https://www.mytabata.com/) 聚焦 “Tabata & HIIT Timer”，证明这两个词更适合垂直训练意图。
- [Online Interval Timer](https://www.online-intervaltimer.com/) 强调自定义、预设和本地收藏，说明用户期望打开即用和保存配置。
- [ClockMinder HIIT Timer](https://www.clockminder.com/hiit) 聚焦 HIIT、声音提示、全屏和持久化设置。
- [Toololis Tabata Timer](https://toololis.com/tabata-timer/) 使用固定 20/10 × 8 协议和明确轮次反馈。

## 3. SEO 文案草案

### 3.1 English

- URL：`/timer/interval-timer`
- Title：`Online Interval Timer for HIIT & Tabata`
- 完整 Title 预计：`Online Interval Timer for HIIT & Tabata | ClassroomTimers`
- H1：`Free Online Interval Timer`
- Meta Description：`Run custom work and rest rounds for HIIT, Tabata, circuits, classroom rotations, and study breaks. Free, fullscreen, and no sign-up.`

### 3.2 简体中文

- URL：`/zh/timer/interval-timer`
- Title：`在线间歇计时器：HIIT、Tabata 与循环训练`
- H1：`免费在线间歇计时器`
- Meta Description：`自定义工作、休息和循环轮次，适用于 HIIT、Tabata、循环训练与课堂轮换。支持全屏、声音提示，无需注册。`

### 3.3 繁体中文

- URL：`/zh-hant/timer/interval-timer`
- Title：`線上間歇計時器：HIIT、Tabata 與循環訓練`
- H1：`免費線上間歇計時器`
- Meta Description：`自訂工作、休息和循環輪次，適用於 HIIT、Tabata、循環訓練與課堂輪換。支援全螢幕、聲音提示，無需註冊。`

### 3.4 日本語

- URL：`/ja/timer/interval-timer`
- Title：`オンラインインターバルタイマー：HIIT・Tabata・サーキット`
- H1：`無料オンラインインターバルタイマー`
- Meta Description：`作業・休憩・ラウンド数を自由に設定。HIIT、Tabata、サーキット、授業ローテーションに対応。全画面と音声通知付き、登録不要。`

说明：最终实现前需要检查根布局 Title Template 后的实际长度，避免重复出现此前审计中的超长标题问题。

## 4. 目标用户与核心任务

### 4.1 目标用户

1. 教师：课堂站点轮换、小组任务、PE 体能循环。
2. 健身用户或教练：HIIT、Tabata、Circuit Training。
3. 学习与工作用户：自定义工作/休息循环，但不需要番茄统计。
4. 投屏用户：需要远距离阅读、声音和阶段颜色提示。

### 4.2 核心用户任务

用户进入页面后应能：

1. 两次操作内启动常用预设：选择预设 → Start。
2. 自定义 Work、Rest 和 Rounds 后立即开始。
3. 不看设置也能清楚知道当前阶段、当前轮次和剩余时间。
4. 在阶段切换时通过文字、颜色和声音同时获得提示。
5. 暂停、继续、跳过当前阶段或重置，能够恢复误操作。
6. 全屏投影并保持屏幕常亮。
7. 复制配置链接，在另一台设备恢复相同的静态计时设置。

## 5. Day 1 功能范围

### 5.1 必须实现（P0）

| 模块 | 功能 |
|---|---|
| 预设 | HIIT 40/20 × 8、Tabata 20/10 × 8、Classroom Rotation 10/2 × 4、Custom |
| 自定义 | Work 时长、Rest 时长、Rounds；最小 1 秒，轮次 1–99 |
| 运行控制 | Start、Pause、Resume、Skip phase、Reset |
| 状态 | Ready、Work、Rest、Paused、Finished |
| 主显示 | 当前阶段、剩余时间、Round X of Y、阶段进度、总进度 |
| 阶段切换 | Work → Rest → 下一轮 Work；最后一轮 Work 后结束，不额外进入无意义的 Rest |
| 提醒 | Work/Rest 切换声音、最后警示、静音视觉回退 |
| 全屏与常亮 | 复用 ToolStage 的 Fullscreen 与 Wake Lock |
| 配置持久化 | 最近一次自定义值和普通设置存入 localStorage |
| 分享 | 静态配置写入短 URL 参数并支持 Copy link；不分享音量和设备权限 |
| 多语言 | `en`、`zh`、`zh-hant`、`ja` 的 UI、设置、状态、正文、FAQ、metadata 和结构化数据 |
| SEO | 唯一 H1、canonical、hreflang、x-default、WebApplication、FAQ、sitemap |

### 5.2 暂不实现（非 Day 1）

- 多个不同 Work/Rest 区块拼接成复杂训练计划。
- 语音播报动作名称。
- 账户同步、云端收藏和跨设备历史。
- 训练统计、消耗热量或健康建议。
- 拖拽排序训练动作。
- 自定义上传声音。
- 独立的 EMOM、Boxing、Pomodoro 页面逻辑。

## 6. 页面结构

按用户任务优先，工具舞台在前，SEO 内容在后：

1. 全站 Header：保持现有五个一级入口，不把 Interval Timer 加入顶部导航。
2. 工具舞台：阶段、时间、轮次、进度和控制。
3. Ready 状态的预设与 Custom Builder。
4. Visible H1 + 一段简短定位说明。
5. How to use：三步说明。
6. Use cases：HIIT、Tabata、Circuit、Classroom Rotation。
7. What is an interval timer：解释通用 Work / Rest 模型。
8. Interval Timer vs Pomodoro Timer：避免后续页面意图冲突。
9. FAQ。
10. Related classroom tools：Classroom Timer、Stopwatch、Visual Timer（上线后）、Pomodoro Timer（上线后）。
11. Footer。

导航约束：

- 不修改顶部五项导航。
- 首发入口放在首页第二屏 Classroom Tools 区块。
- 同时从 Classroom Timer、Stopwatch 和后续 Pomodoro 页面提供相关工具内链。
- 每个相关工具区只展示 4–8 个高相关入口，不做关键词链接墙。

## 7. 首屏工具舞台

### 7.1 Ready 状态

默认展示：

- H1 不抢占时间舞台，可放在工具舞台后的可见内容区。
- 预设选择：HIIT、Tabata、Classroom Rotation、Custom。
- 选中预设的摘要：`20s Work · 10s Rest · 8 Rounds · 3:50 total`。
- Custom 时展开三个直接输入项：Work、Rest、Rounds。
- Start 为唯一绿色主按钮。
- Fullscreen、Wake Lock、Settings、Copy link 为辅助动作。

预设点击只载入配置，不立即开始；用户再点击 Start，符合“两次操作内启动”。

### 7.2 Running — Work

- 阶段标签：`WORK`，同时显示本地化文本。
- 大数字显示当前阶段剩余时间。
- `Round 2 of 8` 明确当前轮次。
- 橙色表示当前 Work 进度，绿色只保留给运行/成功动作。
- 总进度条显示整个 Session 的完成比例。
- 主操作：Pause。
- 次操作：Skip、Reset。
- 预设和输入区收起，避免干扰。

### 7.3 Running — Rest

- 阶段标签：`REST`，使用与 Work 不同的辅助色，同时保留文字。
- 时间、轮次和总进度位置不变，避免阶段切换时页面跳动。
- 主操作仍为 Pause；Skip、Reset 保持原位。
- 阶段开始播放一次 Rest 声音；静音时提供边缘闪烁或标签变化。

### 7.4 Paused

- 明确显示 `Paused`，不能只改变按钮文字。
- Resume 为唯一绿色主按钮。
- 保留 Skip 和 Reset。
- 暂停期间时间和进度不变化。

### 7.5 Finished

- 显示 `Session complete` / `训练完成` / `訓練完成`。
- 显示总时长和完成轮次。
- 主操作：Restart session。
- 次操作：Edit timer。
- 声音只播放一次，并始终有可见的静音回退。

## 8. 预设定义

| 预设 | Work | Rest | Rounds | 总时长计算 | 用途 |
|---|---:|---:|---:|---|---|
| HIIT 40/20 | 40s | 20s | 8 | 7:40 | 标准高强度间歇训练起点 |
| Tabata 20/10 | 20s | 10s | 8 | 3:50 | 经典 Tabata |
| Classroom Rotation | 10m | 2m | 4 | 46:00 | 小组/站点轮换 |
| Custom | 1m | 30s | 5 | 7:00 | 通用起点 |

总时长规则：最后一轮 Work 完成后直接结束，不把最后一次 Rest 计入总时长。因此：

`总时长 = Work × Rounds + Rest × (Rounds - 1)`

推荐采用：

- HIIT：40/20 × 8。
- Tabata：20/10 × 8。
- Classroom Rotation：10m/2m × 4。
- Custom：用户最近一次配置，首次为 1m/30s × 5。

## 9. Settings

按现有设置系统在桌面使用右侧浮层、移动端使用底部 Sheet。

### Sound

- Phase sound：On / Off。
- Work sound：Bell / Chime / Soft Tone。
- Rest sound：Bell / Chime / Soft Tone。
- Finish sound：Bell / Chime / Soft Tone。
- 提供试听；首次播放由用户操作触发。

### Display

- Show total progress：默认 On。
- Warning：Off / 3 seconds / 5 seconds / 10 seconds。
- Fullscreen 和 Wake Lock 不重复放进分享 URL。

### Behavior

- Session behavior：`Stop after final round`（默认）/ `Repeat session`。
- 将迭代计划里的“循环/单次模式”解释为“完成全部轮次后结束或重新循环整个 Session”，不与 Rounds 重复。
- Reset to defaults。

## 10. 配置、持久化与分享

建议配置模型：

```ts
type IntervalTimerConfig = {
  workSeconds: number
  restSeconds: number
  rounds: number
  preset?: 'hiit' | 'tabata' | 'classroom' | 'custom'
  sessionBehavior: 'once' | 'loop'
  warningAtSeconds: 0 | 3 | 5 | 10
  showTotalProgress: boolean
}
```

URL 参数建议：

```text
/timer/interval-timer?w=20&r=10&rounds=8&preset=tabata&loop=0&warning=3
```

规则：

- URL 配置优先于 localStorage。
- 运行中剩余时间、暂停状态和声音音量不写入 URL。
- localStorage 保存最近配置、声音偏好和显示偏好。
- 所有参数必须校验并限制范围，非法值回退到默认配置。

## 11. 进度与时间准确性

- 继续复用 timestamp-based `useCountdown`，不能用动画帧累加时间。
- 阶段进度：当前阶段已完成比例。
- 总进度：已完成阶段时长 + 当前阶段已完成时长，占整个 Session 总时长比例。
- 浏览器后台降频后恢复时，应按绝对时间补齐阶段切换，不能只停留在一个过期阶段。
- 若后台期间跨过多个短阶段，恢复后直接计算出正确的当前阶段和剩余时间，只播放当前状态提示，不连续补播多次声音。

这部分是独立 Interval Timer 相比首页现有基础循环模式需要重点补强的准确性契约。

## 12. 响应式与投屏

### 320–639px

- 预设横向滚动或 2 × 2 排列。
- Work / Rest / Rounds 输入纵向或紧凑三列，不能产生横向溢出。
- 主时间保持首屏可见；底部导航不能遮挡 Start、Pause 或 Reset。
- Settings 使用底部 Sheet。

### 640–1023px

- 优先验证平板横屏。
- 时间舞台居中，预设和输入位于底部或一侧，不压缩主时间。
- 控件在 4:3 和 16:9 比例中均可见。

### 1024px+

- 首屏可采用“主计时舞台 + 紧凑配置区”的宽屏布局。
- 时间不能无限放大，保留安全边距。
- 全屏隐藏 Header、Footer、正文、广告和无关工具入口。

## 13. 可访问性

- 所有输入有可见标签和范围说明。
- 阶段变化使用 `aria-live="polite"` 宣布，不每秒朗读时间。
- 状态不能只靠颜色：始终显示 WORK / REST / PAUSED / COMPLETE 文本。
- Space：Start / Pause / Resume。
- R：Reset。
- S：Skip phase。
- F：Fullscreen。
- 快捷键在输入框或设置面板聚焦时不触发。
- 支持键盘焦点、200% 缩放、高对比度和 `prefers-reduced-motion`。
- 声音不可用或静音时，阶段变化必须有可见反馈。

## 14. 页面正文与 FAQ

### 正文章节

1. Free online interval timer：工具定位和核心价值。
2. How to use the interval timer：选择预设、自定义、开始。
3. HIIT interval timer：解释可自定义比例，不提供健康效果承诺。
4. Tabata timer：说明经典 20/10 × 8 是 Tabata 的一个固定协议。
5. Circuit and classroom rotation timer：训练站点与课堂站点轮换。
6. Interval Timer vs Pomodoro Timer：通用循环与方法论工具的区别。
7. Privacy and browser accuracy：无需账号、本地保存、时间戳准确性。

### FAQ 建议

1. Is this interval timer free and online?
2. Can I customize work, rest, and rounds?
3. Does the interval timer make a sound between rounds?
4. What is the classic 20/10 Tabata setup?
5. Can I use it as a HIIT or circuit timer?
6. Can teachers use it for classroom rotations?
7. Does it keep accurate time in a background tab?
8. Can I run it fullscreen on a classroom display?
9. What is the difference between an interval timer and a Pomodoro timer?
10. Are my timer settings uploaded?

## 15. 技术实现边界

确认后开发时遵循：

- 路由与 Metadata：`src/app/[locale]/timer/interval-timer/page.tsx`。
- 页面组合与服务端正文：`src/features/interval-timer/page-content.tsx`。
- 交互组件：`src/features/interval-timer/components/interval-timer-tool.tsx`。
- 共享计时：复用或最小扩展 `src/features/timer-core/hooks/use-countdown.ts`。
- 共享舞台：复用 `ToolStage`、Fullscreen、Wake Lock 和现有声音能力。
- 不直接复制首页 `CountdownTool` 的大段逻辑；将真正共享的阶段计算提取到 timer-core，页面专属预设和文案留在 interval-timer feature。
- 不新增依赖，不修改顶部导航结构，不引入后端或账户系统。

## 16. 匿名事件建议

不记录自定义标签或用户输入，仅记录：

- `interval_preset_selected`
- `interval_timer_started`
- `interval_phase_skipped`
- `interval_timer_completed`
- `interval_timer_reset`
- `interval_timer_fullscreen`
- `interval_config_copied`

属性仅允许 preset、rounds、work/rest 区间桶、locale 和 device class。

## 17. 验收标准

### 功能

- 四个预设均能在两次操作内启动。
- 自定义 Work、Rest、Rounds 校验正确。
- Work / Rest 自动切换，轮次和总进度正确。
- Pause / Resume / Skip / Reset 在每个状态行为明确。
- 最后一轮 Work 后完成，不多执行一次 Rest。
- 后台恢复后阶段和剩余时间正确。

### 视觉与体验

- 时间始终是最高视觉层级。
- 320px 无横向溢出或底栏遮挡。
- 手机、平板横屏、桌面、16:9 和 4:3 投影均可完成核心流程。
- 全屏只显示阶段、时间、轮次、进度和必要控制。

### SEO 与本地化

- 每个 Locale 一个可见 H1。
- 英文主词保持 `online interval timer`，不堆砌 HIIT/Tabata/Circuit。
- canonical、hreflang、x-default、sitemap 与 JSON-LD 一致。
- UI、状态、设置、错误、正文、FAQ 和 Metadata 覆盖三种语言。
- 页面正文服务端渲染。

### 质量

- TypeScript 和目标 lint 通过。
- 不新增依赖或锁文件变更。
- 不修改顶部五项导航。
- 不影响首页 Classroom Timer 现有单次和基础循环功能。

## 18. 待确认结论

本文档已按以下推荐方案定稿，确认后即按此进入开发：

1. 主关键词使用 `online interval timer`，`interval timer` 作为核心词根。
2. HIIT 默认采用 40/20 × 8，Tabata 采用 20/10 × 8，避免两个预设完全重复。
3. Day 1 包含 Skip phase 和 Copy configuration link。
4. “循环/单次模式”解释为整个 Session 完成后“停止一次”或“继续循环”。
5. Interval Timer 不进入顶部导航，只进入首页 Classroom Tools 和相关工具内链。
