export type ExamPresetKey = 'sat' | 'gre' | 'ielts' | 'custom3x25'

export type ExamSection = {
  /** 用于 React key 等场景；不展示 */
  id: string
  /** 段名称，如 "Verbal"、"Quant"、用户自定义 */
  name: string
  /** 时长（分钟），整数 */
  minutes: number
}

export type ExamPreset = {
  key: ExamPresetKey
  sections: Array<{
    nameKey: 'criticalReading' | 'writing' | 'math' | 'verbal' | 'quant' | 'reading' | 'default'
    minutes: number
  }>
}

export type ExamConfig = {
  sections: ExamSection[]
}

export type ExamStatus = 'ready' | 'running' | 'paused' | 'finished'

export const MAX_SECTIONS = 10
