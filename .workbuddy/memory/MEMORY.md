# ClassroomTimers 项目记忆

## 项目定位

- 面向全球教师与培训师的课堂计时工具箱，域名 classroomtimers.app
- 价值主张：Make every minute visible.
- 技术栈：Next.js 16 + React 19 + TypeScript + Tailwind v4，部署在 Cloudflare Workers
- 当前已上线 5 个工具：Classroom Timer、Digital Clock、Flip Clock、World Clock、Stopwatch
- 3 语言：en/zh/zh-hant

## 关键决策

- Egg Timer 和 Candle Timer 不单独实现，合并为 Visual Timer（/visual-timer）
- 推广渠道优先级：自然搜索 > Product Hunt > Reddit > 社交媒体
- 内容优先英语，逐步扩展 es/ja 语言
- 不使用 Google Analytics，使用 Vercel Analytics + 自托管 Plausible

## 后续方向

- 迭代计划 v2.0 见 doc/迭代计划-2个月.md
- 关键决策：Egg/Candle Timer 合并为 Visual Timer；新增独立 Pomodoro Timer；Classroom Screen 暂缓
- 月度复盘：8/31、9/30 各一次
- 下一步：Interval Timer（W1, Aug 10-16）
