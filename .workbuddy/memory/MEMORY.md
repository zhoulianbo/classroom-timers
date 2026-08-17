# ClassroomTimers 项目记忆

## 项目定位

- 面向全球教师与培训师的课堂计时工具箱，域名 classroomtimers.app
- 价值主张：Make every minute visible.
- 技术栈：Next.js 16 + React 19 + TypeScript + Tailwind v4，部署在 Cloudflare Workers
- 当前已上线工具：Classroom Timer、Digital Clock、Flip Clock、World Clock、Stopwatch、Interval Timer（含 HIIT/Tabata 变体）、Exam Timer
- 3 语言：en/zh/zh-hant

## 关键决策

- Egg Timer 和 Candle Timer 不单独实现，合并为 Visual Timer（/visual-timer）
- 推广渠道优先级：自然搜索 > Product Hunt > Reddit > 社交媒体
- 内容优先英语，逐步扩展 es/ja 语言
- 不使用 Google Analytics，使用 Vercel Analytics + 自托管 Plausible
- Exam Timer 独立于 Interval Timer：前者为监考场景的多段顺序计时，后者为循环工作/休息
- 通用 Feature 结构：每个工具一个 `src/features/<name>/` 子目录，包含 types.ts、copy.ts（i18n）、data/、components/、page-content.tsx、page-data.ts，路由 `src/app/[locale]/<path>/page.tsx`
- 工具页 UI 约定：主操作按钮统一使用 `RoundButton`（start/pause/reset）；不需要设置面板时向 `ToolStage` 传 `settings={false}`

## 后续方向

- 迭代计划 v2.0 见 doc/迭代计划-2个月.md
- 关键决策：Egg/Candle Timer 合并为 Visual Timer；新增独立 Pomodoro Timer；Classroom Screen 暂缓
- 月度复盘：8/31、9/30 各一次
- 已完成 Day 1（Interval Timer）、Day 6 Part B（Exam Timer）
- 下一步：Visual Timer（W2, Aug 17-23）
- 注意：项目 build 在 NODE_OPTIONS 包含 `--use-system-ca` 时会因 worker init 失败（环境问题，非代码）
