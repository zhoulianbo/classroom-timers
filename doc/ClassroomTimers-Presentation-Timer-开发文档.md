# ClassroomTimers — Presentation Timer 工具开发文档

版本：V1.0  
产品：ClassroomTimers  
工具：Presentation Timer  
建议路由：`/timer/presentation-timer`

## 1. 产品定义

**一句话核心功能：创建一个演讲计时房间，编排多个计时议程，由主持设备统一控制，并把实时同步的计时画面分享给投影屏或另一台控制设备。**

Presentation Timer 不是“另一个倒计时页面”，而是 ClassroomTimers 中第一个具备 **Room + Agenda + Multi-device Sync** 的协作型计时工具。

第一版聚焦：
- 学校演讲 / 学生展示 / 答辩 / 演讲比赛
- 教师培训 / Workshop / 多讲师切换 / Presentation + Q&A

不扩展到大型活动管理、观众互动、聊天、提问、投票、成员管理。

## 2. 产品原则

1. **无账号**：Create Room → Add Agenda → Start → Share Display。
2. **Room 是唯一实时状态源**：Host、Remote、Display 都读取同一个 Room 状态。
3. **Host 编辑，Remote 控制，Display 只读**。
4. **Agenda 是核心差异**：一个 Room 中有多个有名称、有顺序、有时长的计时段。
5. **不逐秒同步**：同步 `endsAt / status / activeIndex / revision`，各设备本地计算剩余时间。
6. **大屏优先**：Display 只保留当前环节、剩余时间、状态颜色、下一环节。

## 3. MVP 功能边界

### V1 必须有
- 创建 / 重命名 Room
- Redis TTL 临时保存
- LocalStorage 保存最近 Room、Host 权限和议程副本
- Agenda：新增、编辑、排序、复制、删除、切换当前项
- Timer：Start、Pause/Resume、Reset、±1 min、Previous/Next、Overtime
- Green / Yellow / Red / Overtime 四阶段提示
- Host View
- Remote Control
- Display View
- QR Code / Copy Link
- Connected 状态与设备数
- Display 全屏、大数字、当前/下一议程

### V1 不做
- 用户账号 / 订阅
- 成员加入 / 聊天 / 评论 / Q&A / 投票
- Speaker / Moderator 独立角色
- 文件上传 / PPT 控制
- Custom Display Builder
- 多 Room 管理
- Room Password
- CSV 导入导出
- Calendar / Scheduled Start / Target Time

## 4. 路由

SEO 主工具页：
`/timer/presentation-timer`

Room：
- `/timer/presentation-timer/room/{roomId}`
- `/timer/presentation-timer/room/{roomId}/display`
- `/timer/presentation-timer/room/{roomId}/remote`

所有 Room 页面 `noindex,nofollow`，不进入 sitemap。

## 5. 用户流程

首次：
Presentation Timer → Create Timer Room → 默认 Presentation 10:00 → 编辑/新增议程 → Share → Display / Remote → Start。

返回用户：
首页读取 LocalStorage 展示 Recent Rooms；Redis Room 未过期直接打开；已过期但本地有议程时，一键 “Create a new room from this agenda”。

## 6. Host 页面

Header：
- Room 名称
- Live / connected device count
- Share

### 6.1 主计时区设计

Presentation Timer 不使用普通 Classroom Timer 的大圆环，而采用：

> **大数字 + 横向 Green / Yellow / Red 时间条 + Current / Next**

这是 Presentation Timer 与其他计时器在视觉和信息结构上的核心区别。

主界面结构：

```text
┌──────────────────────────────────────────────────────┐
│ CURRENT                                              │
│ Student Presentation                                 │
│                                                      │
│                     04:32                            │
│                                                      │
│ ████████████████████████▓▓▓▓▓▓▓▓▒▒▒▒                │
│ GREEN                    YELLOW   RED                │
│                                                      │
│ Next: Q&A · 03:00                                    │
│                                                      │
│  -1m      Reset       Pause       +1m       Next →  │
└──────────────────────────────────────────────────────┘
```

设计规则：

- **大数字**始终是视觉中心，承担主要计时信息。
- **Current** 显示当前议程名称。
- **Next** 始终显示下一项议程及其时长，帮助主持人预判节奏。
- **横向时间条**固定包含 Green / Yellow / Red 三段，不使用圆环。
- 时间条不是普通百分比进度条，而是明确表达演讲阶段：
  - Green：正常进行
  - Yellow：进入收尾
  - Red：必须结束
- 到 0 后进入 Overtime，数字改为 `+00:18`，时间条保持 Red。
- 控制按钮只保留高频操作：`-1m / Reset / Pause / +1m / Next`。
- Previous 放在 Agenda 区或次级控制中，不与主控制争夺注意力。
- 页面不展示复杂设置；设置通过轻量弹层进入。

### 6.2 Agenda 区

Agenda 放在主计时区下方：

- 拖拽排序
- Edit
- Duplicate
- Delete
- Start this item
- `+ Add agenda item`

当前 Agenda Item 需要明显高亮，并显示状态：
- Ready
- Running
- Completed
- Overtime

## 7. Timer 状态

Green：正常。

Yellow：
`warningAt = min(总时长 × 20%, 120 秒)`

Red：
`criticalAt = min(总时长 × 5%, 30 秒)`

Overtime：
到 0 后显示 `+00:18`，继续红色计时，不自动结束。

建议颜色：
- Green `#30D158`
- Yellow `#FFD60A`
- Red `#FF453A`

## 8. Agenda

示例：
- Opening — 2 min
- Student Presentation — 8 min
- Q&A — 3 min
- Teacher Feedback — 2 min

首版模板只保留：
- Blank
- Presentation + Q&A
- Student Presentation
- Training Session

## 9. Share / Outputs

仅两个输出：

### Display
只读，用于投影仪、教室大屏、第二显示器。

### Remote
手机 / 平板遥控，任何持有该链接的人都能控制 Room，因此必须明确提示不要公开分享。

Share Modal 提供：
- QR Code
- Copy link
- Open
- Connected count

## 10. Display View

Display 与 Host 使用同一套核心视觉语言：

> **大数字 + 横向 Green / Yellow / Red 时间条 + Current / Next**

但 Display 更极简，只保留观众真正需要的信息。

全屏结构：

```text
CURRENT
STUDENT PRESENTATION

04:32

████████████████████████▓▓▓▓▓▒▒▒▒
GREEN                    YELLOW RED

NEXT
Q&A · 03:00
```

显示规则：

- 当前议程名称位于数字上方。
- 巨大倒计时位于视觉中心。
- 横向时间条位于倒计时下方。
- 下一议程显示在底部。
- 不显示 Logo、导航、Share、Settings、Reset、Start 等任何控制。
- Green / Yellow / Red 只通过时间条和局部数字颜色表达。
- 不让整个背景切换为黄色或红色，避免课堂投影时过度刺激。

Overtime：

```text
OVERTIME

+00:42
```

进入 Overtime 后：
- 时间条保持 Red
- 大数字使用 Red
- Next 继续显示
- 不自动跳到下一 Agenda Item

## 11. Remote View

Mobile-first，只保留：
- 当前环节
- 大数字
- ±1 min
- Start/Pause
- Previous/Next
- Reset
- 可展开只读 Agenda，并允许点击切换当前项

Remote 不允许编辑 Agenda。

## 12. 权限

| 操作 | Host | Remote | Display |
|---|---:|---:|---:|
| 查看 Timer | ✓ | ✓ | ✓ |
| Start / Pause | ✓ | ✓ | — |
| Reset | ✓ | ✓ | — |
| +/- 时间 | ✓ | ✓ | — |
| Previous / Next | ✓ | ✓ | — |
| 切换 Agenda | ✓ | ✓ | — |
| 编辑 Agenda | ✓ | — | — |
| 修改 Room | ✓ | — | — |
| 分享链接 | ✓ | — | — |

## 13. LocalStorage

Key：
`classroomtimers:presentation:v1`

保存最多 10 个最近 Room：

```ts
type LocalPresentationRoom = {
  roomId: string
  roomName: string
  hostToken: string
  remoteToken: string
  displayToken: string
  lastOpenedAt: number
  expiresAt: number
  agendaSnapshot: AgendaItem[]
}
```

作用：
- 找回 Room
- 保存 Host 权限
- Redis 过期后恢复议程
- 无账号 Recent Rooms

## 14. Redis

Key：
`presentation:room:{roomId}`

TTL：**7 天**，每次有效 Host / Remote 操作刷新。

```ts
type PresentationRoom = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  expiresAt: number
  agenda: AgendaItem[]
  activeIndex: number
  timer: {
    status: 'ready' | 'running' | 'paused' | 'overtime' | 'finished'
    startedAt?: number
    endsAt?: number
    pausedRemainingMs?: number
    overtimeStartedAt?: number
  }
  settings: {
    endSound: 'off' | 'chime' | 'bell'
    showNextItem: boolean
  }
  revision: number
  tokens: {
    hostHash: string
    remoteHash: string
    displayHash: string
  }
}
```

Agenda：

```ts
type AgendaItem = {
  id: string
  title: string
  durationSec: number
  warningSec?: number
  criticalSec?: number
}
```

## 15. 多设备同步

服务端只同步离散状态：
`endsAt / status / activeIndex / revision / agenda`

客户端本地：
`remaining = endsAt - synchronizedNow`

Start：
`endsAt = serverNow + remaining`

Pause：
保存 `pausedRemainingMs`

Resume：
`endsAt = serverNow + pausedRemainingMs`

这样正常倒计时无需每秒写 Redis。

## 16. 实时连接

推荐：
- Redis：Room 临时持久状态
- WebSocket / Cloudflare Durable Object：活跃 Room 广播

若 MVP 要先降低复杂度，可用 **1 秒 revision polling**：
- 正常倒计时仍由客户端本地时间戳渲染
- 轮询只同步 Pause、Adjust、Switch 等动作

优先级：
`WebSocket > 1s revision polling`

## 17. API

- `POST /api/presentation-rooms` 创建 Room
- `GET /api/presentation-rooms/{roomId}` 获取 Room
- `PATCH /api/presentation-rooms/{roomId}/agenda` Host 编辑 Agenda
- `POST /api/presentation-rooms/{roomId}/actions` Host / Remote 控制

Action：
`start / pause / reset / adjust / select / next / previous`

## 18. Token 与安全

每 Room 创建：
- hostToken
- remoteToken
- displayToken

至少 128-bit cryptographically secure random，Redis 只存 hash。

建议 share URL 使用 fragment，例如：
`/room/abc/display#token=...`

前端读取 fragment 后以 Authorization Header 调 API，降低 token 出现在常规分析日志中的概率。

## 19. 并发

Room 增加 `revision`。

Agenda 编辑携带 `expectedRevision`，版本冲突返回 `409 Conflict`。

Timer 控制由服务端顺序处理，采用最后一个有效动作。

## 20. 网络异常

Display 断网：
- 继续根据最后 `endsAt` 本地计时
- 显示小型 `Reconnecting…`
- 恢复后重新校准

Remote 断网：
- 禁用控制按钮
- 不缓存离线操作

Host 关闭：
- Room 不结束
- Remote 仍可控制

## 21. Room 过期

Redis TTL：7 days since last valid action。

Host 本地若有 agenda snapshot：
`Room expired → Create new room from agenda`

## 22. 视觉风格

继续沿用 ClassroomTimers 的黑色、极简、Apple Clock 风格。

建议：
- Background `#080808`
- Surface `#171717`
- Border `#2A2A2A`
- Text `#F5F5F5`
- Muted `#A1A1A1`

橙色继续承担产品 UI 强调色；Green / Yellow / Red 专门表示演讲计时状态。

## 23. SEO

主关键词：
- Presentation Timer

次关键词：
- Online Presentation Timer
- Presentation Countdown Timer
- Speaker Timer
- Classroom Presentation Timer
- Speech Timer

工具置于正文之前。

页面结构：
1. Live tool / Create Room
2. What is a presentation timer?
3. Why use a shared presentation timer?
4. Student presentations
5. Training and workshops
6. Multi-device timing
7. Agenda timing
8. FAQ
9. Related tools

Related：
- Classroom Timer
- Visual Timer
- Exam Timer
- Stopwatch
- Pomodoro Timer

## 24. 埋点

第一版只统计一个指标：

> **每天创建了多少个 Presentation Room。**

事件：

```text
presentation_room_create
```

统计方式：

- 每成功创建一个 Room，计数 +1。
- 不记录用户身份。
- 不做去重。
- 不统计 Page View、Start、Pause、Share、Remote、Display 等其他事件。
- 按日期聚合，例如：

```text
presentation:stats:2026-09-28:room_create = 126
```

目的只用于判断 Presentation Timer 是否有真实使用量，不增加额外分析系统复杂度。

## 25. 开发阶段

### Phase 1
Room + Agenda + Host + Timer + Redis + LocalStorage

### Phase 2
Display + Share + QR + 同步

### Phase 3
Remote + Connected status

### Phase 4
Templates + Recent Rooms + Expired Room Restore + Analytics + Responsive

## 26. 验收标准

- 3 秒内创建 Room
- 30 秒内完成 3 项 Agenda
- Host / Remote 操作后 Display 1 秒内更新
- 正常运行不同设备倒计时显示误差 < 500ms
- 刷新 Host 不丢 Room
- Host 关闭后 Remote 仍可控制
- Redis 过期但 LocalStorage 有副本时可一键重建
- Laptop / iPad / 1080p Projector / Mobile portrait 均无数字裁切

## 27. 与 PresentationTimer.org 的取舍

值得借鉴：
- One Room = single source of truth
- Host 与 Display 分离
- 角色视图共享同一实时计时
- Agenda = Room 内多个 Timer
- Green / Yellow / Red / Overtime
- Display 适合投影和第二屏
- Remote / Operator 负责实时控制

不复制：
- Speaker Role
- Moderator Role
- 独立 Agenda View
- Messages
- Audience Questions
- Flash / Blackout
- Custom Display Builder
- Scheduled Timer / Target Time
- Linked Start
- CSV Agenda Studio
- Password / Permission Matrix

最终结构只保留：

```text
Room
├── Host
├── Remote
└── Display

Room
└── Agenda
    ├── Timer 1
    ├── Timer 2
    └── Timer 3
```

## 28. 最终界面原则

Presentation Timer 的核心视觉固定为：

> **大数字 + 横向 Green / Yellow / Red 时间条 + Current / Next**

该结构同时用于 Host 和 Display：

- Host：在此基础上增加控制按钮与 Agenda 管理。
- Display：只保留 Current、倒计时、状态条、Next。
- Remote：保留大数字、Current/Next 与核心控制，不复制完整 Host。

第一版不再提供圆环式 Presentation Timer，避免与 Classroom Timer、Study Timer、Focus Timer 等工具产生视觉同质化。

## 29. 最终产品边界

**Plan the agenda, control the time, share the screen.**

中文：

**编排议程、控制时间、共享计时画面。**

这是 Presentation Timer V1 应始终守住的边界。
