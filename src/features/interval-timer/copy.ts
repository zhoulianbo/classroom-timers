import type { Locale } from '@/config/i18n'
import type { IntervalAlertMode, IntervalConfig, IntervalPreset, IntervalVariant } from './types'

const variantDefaults: Record<IntervalVariant, IntervalConfig> = {
  interval: { name: '', workSeconds: 60, restSeconds: 30, rounds: 5, warmupSeconds: 0, cooldownSeconds: 0, startWithRest: false, alertMode: 'beeps3' },
  hiit: { name: '', workSeconds: 40, restSeconds: 20, rounds: 8, warmupSeconds: 0, cooldownSeconds: 0, startWithRest: false, alertMode: 'beepsWarning' },
  tabata: { name: '', workSeconds: 20, restSeconds: 10, rounds: 8, warmupSeconds: 0, cooldownSeconds: 0, startWithRest: false, alertMode: 'beeps3' },
}

export const variantPresets: Record<IntervalVariant, IntervalPreset[]> = {
  interval: [
    { key: 'workRest', workSeconds: 60, restSeconds: 30, rounds: 5 },
    { key: 'fortyTwenty', workSeconds: 40, restSeconds: 20, rounds: 8 },
    { key: 'classroom', workSeconds: 600, restSeconds: 120, rounds: 4 },
    { key: 'circuit', workSeconds: 30, restSeconds: 30, rounds: 10 },
  ],
  hiit: [
    { key: 'classic', workSeconds: 40, restSeconds: 20, rounds: 8 },
    { key: 'quick', workSeconds: 30, restSeconds: 15, rounds: 10 },
    { key: 'power', workSeconds: 45, restSeconds: 15, rounds: 8 },
  ],
  tabata: [
    { key: 'classic', workSeconds: 20, restSeconds: 10, rounds: 8 },
    { key: 'fortyTwenty', workSeconds: 40, restSeconds: 20, rounds: 8 },
    { key: 'beginner', workSeconds: 20, restSeconds: 20, rounds: 6 },
    { key: 'extended', workSeconds: 20, restSeconds: 10, rounds: 12 },
  ],
}

const alertLabels: Record<Locale, Record<IntervalAlertMode, string>> = {
  en: {
    none: 'No alerts', beeps3: 'Beep × 3', beepsWarning: 'Beep × 3 + 10s warning', short: 'Single short beep', long: 'Single long beep', alternating: 'Alternating short beep', bell: 'Bell', chime: 'Chime', soft: 'Soft tone',
  },
  zh: {
    none: '无提醒', beeps3: '提示音 × 3', beepsWarning: '提示音 × 3 + 10 秒预警', short: '单次短提示音', long: '单次长提示音', alternating: '交替短提示音', bell: '铃声', chime: '钟琴', soft: '柔和提示音',
  },
  'zh-hant': {
    none: '無提醒', beeps3: '提示音 × 3', beepsWarning: '提示音 × 3 + 10 秒預警', short: '單次短提示音', long: '單次長提示音', alternating: '交替短提示音', bell: '鈴聲', chime: '鐘琴', soft: '柔和提示音',
  },
}

const common = {
  en: {
    start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', previous: 'Previous interval', skip: 'Skip', restart: 'Restart', complete: 'Session complete', ready: 'Ready', paused: 'Paused', round: 'Round {current} of {total}', roundShort: 'Round {current}', break: 'Break', elapsed: 'Elapsed', roundMetric: 'Round', remaining: 'Remaining', sessionProgress: 'Session progress', nextIntervals: 'Upcoming intervals', controls: 'Timer controls', totalProgress: 'Total progress', clickHint: 'Click the time to start or pause', presets: 'Quick presets', settingsName: 'Timer name', settingsRounds: 'Number of rounds', settingsWork: 'Work seconds', settingsRest: 'Rest seconds', settingsStartRest: 'Start on rest', settingsWarmup: 'Warm-up seconds', settingsCooldown: 'Cool-down seconds', settingsAlerts: 'Alerts', settingsReset: 'Reset to defaults', alertsBeeps: 'Beeps', alertsOther: 'Other', on: 'On', off: 'Off', warmup: 'Warm up', cooldown: 'Cool down', work: 'Work', rest: 'Rest',
  },
  zh: {
    start: '启动', pause: '暂停', resume: '继续', reset: '复位', previous: '上一阶段', skip: '跳过', restart: '重新开始', complete: '训练完成', ready: '准备', paused: '已暂停', round: '第 {current} / {total} 轮', roundShort: '第 {current} 轮', break: '休息', elapsed: '已用时间', roundMetric: '轮次', remaining: '剩余时间', sessionProgress: '训练进度', nextIntervals: '后续阶段', controls: '计时控制', totalProgress: '总进度', clickHint: '点击时间即可启动或暂停', presets: '快捷预设', settingsName: '计时器名称', settingsRounds: '循环轮数', settingsWork: '工作秒数', settingsRest: '休息秒数', settingsStartRest: '从休息开始', settingsWarmup: '热身秒数', settingsCooldown: '冷身秒数', settingsAlerts: '提醒', settingsReset: '恢复默认设置', alertsBeeps: '提示音', alertsOther: '其他', on: '开启', off: '关闭', warmup: '热身', cooldown: '冷身', work: '工作', rest: '休息',
  },
  'zh-hant': {
    start: '啟動', pause: '暫停', resume: '繼續', reset: '重設', previous: '上一階段', skip: '跳過', restart: '重新開始', complete: '訓練完成', ready: '準備', paused: '已暫停', round: '第 {current} / {total} 輪', roundShort: '第 {current} 輪', break: '休息', elapsed: '已用時間', roundMetric: '輪次', remaining: '剩餘時間', sessionProgress: '訓練進度', nextIntervals: '後續階段', controls: '計時控制', totalProgress: '總進度', clickHint: '點擊時間即可啟動或暫停', presets: '快捷預設', settingsName: '計時器名稱', settingsRounds: '循環輪數', settingsWork: '工作秒數', settingsRest: '休息秒數', settingsStartRest: '從休息開始', settingsWarmup: '熱身秒數', settingsCooldown: '冷身秒數', settingsAlerts: '提醒', settingsReset: '恢復預設設定', alertsBeeps: '提示音', alertsOther: '其他', on: '開啟', off: '關閉', warmup: '熱身', cooldown: '冷身', work: '工作', rest: '休息',
  },
} as const

const variants = {
  en: {
    interval: { title: 'Interval Timer', work: 'Work', rest: 'Rest', presetNames: { workRest: 'Work / rest', fortyTwenty: '40 / 20 Work–Rest', classroom: 'Classroom rotation', circuit: 'Circuit' } },
    hiit: { title: 'HIIT Timer', work: 'High intensity', rest: 'Recovery', presetNames: { classic: '40 / 20 HIIT', quick: 'Quick HIIT', power: 'Power intervals' } },
    tabata: { title: 'Tabata Timer', work: 'Work', rest: 'Rest', presetNames: { classic: 'Classic Tabata', fortyTwenty: 'Sweat Tabata', beginner: 'Beginner Tabata', extended: 'Extended Tabata' } },
  },
  zh: {
    interval: { title: '间歇计时器', work: '工作', rest: '休息', presetNames: { workRest: '工作 / 休息', fortyTwenty: '40 / 20 工作休息', classroom: '课堂轮换', circuit: '循环训练' } },
    hiit: { title: 'HIIT 计时器', work: '高强度', rest: '恢复', presetNames: { classic: '40 / 20 HIIT', quick: '快速 HIIT', power: '力量间歇' } },
    tabata: { title: 'Tabata 计时器', work: '训练', rest: '休息', presetNames: { classic: '经典 Tabata', fortyTwenty: '爆汗 Tabata', beginner: '入门 Tabata', extended: '进阶 Tabata' } },
  },
  'zh-hant': {
    interval: { title: '間歇計時器', work: '工作', rest: '休息', presetNames: { workRest: '工作 / 休息', fortyTwenty: '40 / 20 工作休息', classroom: '課堂輪換', circuit: '循環訓練' } },
    hiit: { title: 'HIIT 計時器', work: '高強度', rest: '恢復', presetNames: { classic: '40 / 20 HIIT', quick: '快速 HIIT', power: '力量間歇' } },
    tabata: { title: 'Tabata 計時器', work: '訓練', rest: '休息', presetNames: { classic: '經典 Tabata', fortyTwenty: '爆汗 Tabata', beginner: '入門 Tabata', extended: '進階 Tabata' } },
  },
} as const

export function getIntervalDefaults(variant: IntervalVariant) {
  return { ...variantDefaults[variant] }
}

export function getIntervalToolCopy(locale: Locale, variant: IntervalVariant) {
  return { ...common[locale], ...variants[locale][variant], alertLabels: alertLabels[locale] }
}
